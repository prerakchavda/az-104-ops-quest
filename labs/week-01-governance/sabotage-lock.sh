#!/usr/bin/env bash
# Week 1 Wednesday SABOTAGE: Creates a tiny locked test Storage Account so you can experience
# Resource Locks overriding Owner AND ReadOnly blocking listKeys (POST)!
set -euo pipefail

LOCATION="${1:-eastus}"
RAND_SUFFIX=$((RANDOM % 9000 + 1000))
ST_NAME="stnorthstarlock${RAND_SUFFIX}"

echo "Injecting Week 1 Governance Mystery into rg-northstar-ephemeral..."
az group create -n rg-northstar-ephemeral -l "$LOCATION" -o none
az storage account create -g rg-northstar-ephemeral -n "$ST_NAME" -l "$LOCATION" --sku Standard_LRS --kind StorageV2 -o none
az lock create --name lock-mystery-ro --lock-type ReadOnly -g rg-northstar-ephemeral --resource-name "$ST_NAME" --resource-type Microsoft.Storage/storageAccounts -o none

echo ""
echo "=== INCIDENT TICKET W1-INC ==="
echo "Storage Account created: $ST_NAME (in rg-northstar-ephemeral)"
echo "1. Try running: az storage account keys list -g rg-northstar-ephemeral -n $ST_NAME"
echo "2. Try deleting $ST_NAME even though you are Subscription Owner!"
echo "Mission: Diagnose WHY both fail, fix it cleanly, and delete $ST_NAME."
