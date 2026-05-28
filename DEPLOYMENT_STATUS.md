# Deployment Status

## ✅ Completed

- **EKS Cluster**: cal-diary-cluster (ACTIVE)
- **Region**: ap-southeast-1
- **Compute**: Fargate (cal-diary-profile)
- **Pod Status**: Running (2/2 containers)
  - cal-diary app (port 3000)
  - ADOT collector (OpenTelemetry)
- **Verification**: App accessible via `kubectl port-forward`

## ✅ Local Testing

Access the app locally:
```bash
kubectl port-forward -n cal-diary svc/cal-diary 8080:80
# Then: http://localhost:8080
```

## ⏳ Remaining Task: Public Internet Access

To enable public internet access via NLB, install AWS Load Balancer Controller:

### From personal laptop (where you can install Helm):

```bash
# 1. Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# 2. Update kubeconfig
aws eks update-kubeconfig --name cal-diary-cluster --region ap-southeast-1

# 3. Install AWS Load Balancer Controller
helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=cal-diary-cluster \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller

# 4. Verify
kubectl get deployment -n kube-system aws-load-balancer-controller

# 5. Check public URL
kubectl get svc -n cal-diary cal-diary
```

Once the controller is installed, the NLB will automatically register pod IPs and the public URL will work\!

## Infrastructure Summary

- **Cluster Endpoint**: https://28854AA29479811E610E886622462CF0.gr7.ap-southeast-1.eks.amazonaws.com
- **NLB URL**: ada98659a2daf452094ed9bc79d0a9ea-d70255f57ccf6df5.elb.ap-southeast-1.amazonaws.com
- **VPC**: vpc-008f4c70f9b227844
- **Pod IP**: 10.0.183.80
- **Service Type**: LoadBalancer (NLB, IP target type)

## Configuration Files Modified

- `eksctl/cluster-config.yaml` - NAT gateway enabled
- `k8s/adot-config.yaml` - Fixed exporter config (debug→logging)
- `k8s/service.yaml` - NLB with IP target type support
