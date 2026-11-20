#!/usr/bin/env bash
# Week 3 Monday/Tuesday: StorageV2 LRS + Blob Container + Azure File Share + Private DNS Zone
set -euo pipefail

LOCATION="${1:-eastus}"
RG_CORE="rg-northstar-core"
RAND_SUFFIX=$((RANDOM % 9000 + 1000))
ST_NAME="stnorthstar${RAND_SUFFIX}"

az group create -n "$RG_CORE" -l "$LOCATION" -o none
echo "Creating StorageV2 account $ST_NAME (Standard_LRS)..."
az storage account create -g "$RG_CORE" -n "$ST_NAME" -l "$LOCATION" --sku Standard_LRS --kind StorageV2 --allow-blob-public-access false -o none

az storage container create --name products --account-name "$ST_NAME" --auth-mode login 2>/dev/null || \
  az storage container create --name products --account-name "$ST_NAME" -o none
az storage share-rm create -g "$RG_CORE" --storage-account "$ST_NAME" --name finance --quota 5 -o none

echo "Enabling Blob Versioning & Soft Delete (7 days)..."
az storage account blob-service-properties update -g "$RG_CORE" -n "$ST_NAME" \
  --enable-versioning true --enable-delete-retention true --delete-retention-days 7 -o none

echo "Created $ST_NAME with container 'products' and file share 'finance'!"
echo "Export for later scripts: export NORTHSTAR_ST=$ST_NAME"
