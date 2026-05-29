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

## ✅ Public Internet Access

AWS Load Balancer Controller installed via Helm in `kube-system`. App accessible publicly via NLB.

```bash
# Verify controller
kubectl get deployment -n kube-system aws-load-balancer-controller

# Check public URL
kubectl get svc -n cal-diary cal-diary
```

## Infrastructure Summary

- **Cluster Endpoint**: https://28854AA29479811E610E886622462CF0.gr7.ap-southeast-1.eks.amazonaws.com
- **NLB URL**: k8s-caldiary-caldiary-a98b6ffdff-8951020a9f8498f3.elb.ap-southeast-1.amazonaws.com
- **VPC**: vpc-008f4c70f9b227844
- **Pod IP**: 10.0.183.80
- **Service Type**: LoadBalancer (NLB, IP target type)

## Configuration Files Modified

- `eksctl/cluster-config.yaml` - NAT gateway enabled
- `k8s/adot-config.yaml` - Fixed exporter config (debug→logging)
- `k8s/service.yaml` - NLB with IP target type support
