#!/usr/bin/env bash
# Deletes all hourly-billed lab resources in rg-northstar-ephemeral every Friday
# while keeping free/penny core resources (VNets, Policies, tiny LRS Storage) in rg-northstar-core.

set -euo pipefail

RG_EPHEMERAL="${1:-rg-northstar-ephemeral}"

echo "Checking if resource group '$RG_EPHEMERAL' exists..."
if az group exists --name "$RG_EPHEMERAL" | grep -q "true"; then
  echo "Deleting '$RG_EPHEMERAL' asynchronously to stop hourly Azure charges..."
  az group delete --name "$RG_EPHEMERAL" --yes --no-wait
  echo "Teardown triggered! Verify in Azure Portal → Cost Management in a few minutes."
else
  echo "Resource group '$RG_EPHEMERAL' does not exist — nothing to clean up."
fi
