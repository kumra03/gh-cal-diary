#!/usr/bin/env bash
# Stop learning session — deletes all AWS resources to stop billing
set -euo pipefail

CLUSTER_NAME="cal-diary-cluster"
REGION="ap-southeast-1"

echo "=== Calories Diary Learning Session Stop ==="
echo "This will DELETE the EKS cluster and all session resources."
echo "ECR images and IAM roles will be preserved."
echo ""

read -rp "Type DELETE to confirm: " CONFIRM
if [ "$CONFIRM" != "DELETE" ]; then
  echo "Aborted."
  exit 0
fi

# Update kubeconfig first (needed to delete K8s resources)
echo "[1/4] Connecting to cluster..."
aws eks update-kubeconfig \
  --name "$CLUSTER_NAME" \
  --region "$REGION" 2>/dev/null || {
    echo "Could not connect to cluster. It may already be deleted."
    exit 0
  }

echo "[2/4] Deleting Kubernetes resources (triggers ALB deletion)..."
kubectl delete -f k8s/ --ignore-not-found=true || true

echo "Waiting 90 seconds for ALB to drain and delete..."
sleep 90

echo "[3/4] Deleting EKS cluster (takes ~10 minutes)..."
eksctl delete cluster \
  --name "$CLUSTER_NAME" \
  --region "$REGION" \
  --wait

echo "[4/4] Verifying no lingering resources..."
aws ec2 describe-load-balancers \
  --region "$REGION" \
  --query "LoadBalancers[?contains(LoadBalancerName, 'cal-diary')].[LoadBalancerName,State.Code]" \
  --output table 2>/dev/null || true

echo ""
echo "=== Session Stopped ==="
echo "All session resources deleted. No more hourly charges."
echo "ECR images retained. IAM roles retained."
echo "Run './scripts/start-session.sh' to start next session."
