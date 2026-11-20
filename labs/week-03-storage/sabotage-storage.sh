#!/usr/bin/env bash
# Week 3 Wednesday SABOTAGE: Disables public access and creates a Private DNS Zone WITHOUT linking vnet-app!
set -euo pipefail

ST_NAME="${1:-${NORTHSTAR_ST:-}}"
RG_CORE="rg-northstar-core"

if [[ -z "$ST_NAME" ]]; then
  echo "Usage: ./sabotage-storage.sh <your-storage-account-name>"
  exit 1
fi

echo "Locking down $ST_NAME and creating an UNLINKED Private DNS Zone..."
az storage account update -g "$RG_CORE" -n "$ST_NAME" --public-network-access Disabled -o none
az network private-dns zone create -g "$RG_CORE" -n privatelink.blob.core.windows.net -o none

echo ""
echo "=== INCIDENT TICKET W3-INC ==="
echo "Public Network Access is now DISABLED on $ST_NAME."
echo "A Private DNS Zone (privatelink.blob.core.windows.net) exists, but VMs in vnet-app still get 403!"
echo "Mission:"
echo "1. Create a Private Endpoint for $ST_NAME (target sub-resource: blob) inside vnet-data/snet-data."
echo "2. Link privatelink.blob.core.windows.net to vnet-app AND verify an A record exists for $ST_NAME."
echo "3. Ensure vnet-app can route to vnet-data (remember non-transitive peering!)."
