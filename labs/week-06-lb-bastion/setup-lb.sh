#!/usr/bin/env bash
# Week 6 Monday: Standard Public IP + Standard Public Load Balancer + HTTP Health Probe
# Run scripts/friday-cleanup.sh right after testing!
set -euo pipefail

LOCATION="${1:-eastus}"
RG_EPH="rg-northstar-ephemeral"

az group create -n "$RG_EPH" -l "$LOCATION" -o none
echo "Creating Standard Public IP + Standard Public Load Balancer..."
az network public-ip create -g "$RG_EPH" -n pip-lb-northstar --sku Standard --allocation-method Static -o none
az network lb create -g "$RG_EPH" -n lb-northstar --sku Standard \
  --public-ip-address pip-lb-northstar \
  --frontend-ip-name fe-northstar \
  --backend-pool-name be-web-pool -o none

az network lb probe create -g "$RG_EPH" --lb-name lb-northstar -n probe-http \
  --protocol Http --port 80 --path / -o none

az network lb rule create -g "$RG_EPH" --lb-name lb-northstar -n rule-http-80 \
  --protocol Tcp --frontend-port 80 --backend-port 80 \
  --frontend-ip-name fe-northstar --backend-pool-name be-web-pool --probe-name probe-http -o none

echo "Standard Load Balancer 'lb-northstar' ready! Attach 2 B1s nginx VMs (in snet-app) to 'be-web-pool'."
