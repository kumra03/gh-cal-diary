#!/usr/bin/env bash
# Start a learning session — creates EKS cluster if not exists, deploys app
set -euo pipefail

CLUSTER_NAME="cal-diary-cluster"
REGION="ap-southeast-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "=== Calories Diary Learning Session Start ==="
echo "Account: $ACCOUNT_ID | Region: $REGION"
echo "WARNING: Cluster costs ~\$0.158/hr while running. Remember to run stop-session.sh!"
echo ""

# Check if cluster already exists
CLUSTER_STATUS=$(aws eks describe-cluster \
  --name "$CLUSTER_NAME" \
  --region "$REGION" \
  --query "cluster.status" \
  --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$CLUSTER_STATUS" = "NOT_FOUND" ]; then
  echo "[1/4] Creating EKS Fargate cluster (takes ~15 minutes)..."
  eksctl create cluster -f eksctl/cluster-config.yaml
  echo "[1/4] Cluster created."
else
  echo "[1/4] Cluster already exists (status: $CLUSTER_STATUS). Skipping creation."
fi

echo "[2/4] Updating kubeconfig..."
aws eks update-kubeconfig \
  --name "$CLUSTER_NAME" \
  --region "$REGION"

echo "[3/4] Waiting for CoreDNS to be ready..."
kubectl rollout status deployment/coredns -n kube-system --timeout=300s || true

echo "[4/4] Deploying app and ADOT..."
# Substitute image tag (use 'latest' or pass IMAGE_TAG env var)
IMAGE_TAG="${IMAGE_TAG:-latest}"

kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/serviceaccount.yaml
kubectl apply -f k8s/adot-config.yaml

sed "s/IMAGE_TAG/$IMAGE_TAG/g; s/ACCOUNT_ID/$ACCOUNT_ID/g" k8s/deployment.yaml | kubectl apply -f -
kubectl apply -f k8s/service.yaml

echo ""
echo "Waiting for LoadBalancer to be provisioned (~2 minutes)..."
for i in {1..24}; do
  ALB_DNS=$(kubectl get svc cal-diary -n cal-diary \
    -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")
  if [ -n "$ALB_DNS" ]; then
    break
  fi
  echo "Waiting... ($i/24)"
  sleep 5
done

ALB_DNS=$(kubectl get svc cal-diary -n cal-diary \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "pending")

echo ""
echo "=== Session Ready ==="
echo "App URL: http://$ALB_DNS"
echo "Session start: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo ""
echo "Run './scripts/stop-session.sh' when done to stop billing."
