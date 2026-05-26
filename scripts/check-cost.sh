#!/usr/bin/env bash
# Check how long cluster has been running and estimated cost
set -euo pipefail

CLUSTER_NAME="cal-diary-cluster"
REGION="ap-southeast-1"
COST_PER_HOUR="0.158"

CREATED=$(aws eks describe-cluster \
  --name "$CLUSTER_NAME" \
  --region "$REGION" \
  --query "cluster.createdAt" \
  --output text 2>/dev/null || echo "")

if [ -z "$CREATED" ]; then
  echo "Cluster is not running. No active charges."
  exit 0
fi

CREATED_EPOCH=$(date -d "$CREATED" +%s 2>/dev/null || \
                date -j -f "%Y-%m-%dT%H:%M:%S" "${CREATED%.*}" +%s 2>/dev/null)
NOW_EPOCH=$(date +%s)
ELAPSED_SECONDS=$((NOW_EPOCH - CREATED_EPOCH))
ELAPSED_HOURS=$(echo "scale=2; $ELAPSED_SECONDS / 3600" | bc)
COST=$(echo "scale=2; $ELAPSED_HOURS * $COST_PER_HOUR" | bc)

echo "Cluster running for: ${ELAPSED_HOURS} hours"
echo "Estimated cost so far: \$$COST"
echo ""
if (( $(echo "$ELAPSED_HOURS > 4" | bc -l) )); then
  echo "⚠️  WARNING: Cluster has been running for more than 4 hours!"
  echo "Consider running stop-session.sh if you are done."
fi
