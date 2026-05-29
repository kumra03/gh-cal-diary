# Deployment Status

## ✅ Everything Working

| Component | Status |
|---|---|
| EKS Fargate cluster | Active (`cal-diary-cluster`, `ap-southeast-1`) |
| App pod | Running 2/2 (cal-diary + ADOT collector) |
| AWS Load Balancer Controller | Running 2/2 in `kube-system` |
| CoreDNS | Running 2/2 in `kube-system` |
| Public NLB | Active, IP-mode, healthy targets |

**Public URL:**
```
http://k8s-caldiary-caldiary-a98b6ffdff-8951020a9f8498f3.elb.ap-southeast-1.amazonaws.com
```

**Local access (port-forward):**
```bash
kubectl port-forward -n cal-diary svc/cal-diary 8080:80
# Then: http://localhost:8080
```

---

## Architecture

```
Internet → NLB (IP-mode) → Pod IP 10.0.183.80:3000
                 ↑
     AWS Load Balancer Controller
     (kube-system, manages NLB lifecycle)
```

### Key resources

| Resource | Value |
|---|---|
| Cluster endpoint | `https://28854AA29479811E610E886622462CF0.gr7.ap-southeast-1.eks.amazonaws.com` |
| VPC | `vpc-008f4c70f9b227844` |
| NLB URL | `k8s-caldiary-caldiary-a98b6ffdff-8951020a9f8498f3.elb.ap-southeast-1.amazonaws.com` |
| Pod IP | `10.0.183.80` |
| LBC IAM role | `arn:aws:iam::032160549000:role/aws-load-balancer-controller-role` |

### Fargate profiles

| Profile | Namespace | Label filter |
|---|---|---|
| `cal-diary-profile` | `cal-diary` | `app: cal-diary` |
| `kube-system-profile` | `kube-system` | none (all pods) |

### IAM / access

- **`gha-deploy-role`** — used by GitHub Actions CI/CD
- **`ramesh-dev`** (personal laptop) — EKS cluster-admin access entry
- **`kumra03-console`** (office laptop) — EKS cluster-admin access entry
- **`aws-load-balancer-controller-role`** — IRSA role for the LBC pod; trust policy must reference the cluster's OIDC provider ID (updated automatically by `start-cluster.yml`)

---

## Recreating the cluster

The `Start EKS Cluster Session` GitHub Actions workflow handles everything end-to-end:

1. Creates cluster from `eksctl/cluster-config.yaml` (both Fargate profiles, access entries)
2. Updates the LBC IAM role trust policy with the new OIDC provider ID
3. Creates `aws-load-balancer-controller` service account in `kube-system` (IRSA annotated)
4. Installs AWS Load Balancer Controller via Helm
5. Deploys the app

> **Important:** The OIDC provider ID changes each time the cluster is recreated. The workflow handles this automatically — do not hardcode the OIDC ID anywhere.

---

## Configuration files

| File | Purpose |
|---|---|
| `eksctl/cluster-config.yaml` | Cluster definition (Fargate profiles, OIDC, access entries) |
| `k8s/namespace.yaml` | `cal-diary` namespace |
| `k8s/serviceaccount.yaml` | ADOT collector service account (IRSA) |
| `k8s/adot-config.yaml` | OpenTelemetry collector config |
| `k8s/deployment.yaml` | App + ADOT sidecar deployment |
| `k8s/service.yaml` | LoadBalancer service (NLB, IP-mode, internet-facing) |
| `.github/workflows/start-cluster.yml` | Full cluster + app bring-up |
| `.github/workflows/stop-cluster.yml` | Cluster teardown |
| `.github/workflows/deploy.yml` | App-only redeploy (cluster already running) |
| `.github/workflows/build-and-push.yml` | Build and push Docker image to ECR |
