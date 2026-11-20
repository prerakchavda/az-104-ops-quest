#!/usr/bin/env bash
# Integration Lab 03: Governed Storefront (Slots + Sticky Settings) & ACI Mounted to Azure Files
set -euo pipefail

LOCATION="${1:-eastus}"
RG_EPH="rg-northstar-ephemeral"
RAND_SUFFIX=$((RANDOM % 9000 + 1000))
ST_NAME="stbatch${RAND_SUFFIX}"
APP_NAME="app-northstar-${RAND_SUFFIX}"

echo "[1/4] Creating $RG_EPH with governance tags..."
az group create -n "$RG_EPH" -l "$LOCATION" --tags Env=Prod Project=Northstar -o none

echo "[2/4] Creating Storage Account $ST_NAME + Azure File Share 'batchlogs'..."
az storage account create -g "$RG_EPH" -n "$ST_NAME" -l "$LOCATION" --sku Standard_LRS --kind StorageV2 --tags Env=Prod -o none
ST_KEY=$(az storage account keys list -g "$RG_EPH" -n "$ST_NAME" --query '[0].value' -o tsv)
az storage share create --name batchlogs --account-name "$ST_NAME" --account-key "$ST_KEY" -o none

echo "[3/4] Deploying ACI batch container mounting 'batchlogs' with OnFailure restart policy..."
az container create -g "$RG_EPH" -n aci-batch-worker \
  --image mcr.microsoft.com/azure-cli \
  --restart-policy OnFailure \
  --azure-file-volume-account-name "$ST_NAME" \
  --azure-file-volume-account-key "$ST_KEY" \
  --azure-file-volume-share-name batchlogs \
  --azure-file-volume-mount-path /mnt/batchlogs \
  --command-line "/bin/sh -c 'echo \"Batch job succeeded at \$(date -u)\" > /mnt/batchlogs/job-report.txt && cat /mnt/batchlogs/job-report.txt'" -o none

echo "[4/4] Creating Standard (S1) App Service + 'staging' slot with Slot-Sticky DB_CONN settings..."
az appservice plan create -g "$RG_EPH" -n asp-northstar-s1 --sku S1 --is-linux --tags Env=Prod -o none
az webapp create -g "$RG_EPH" -p asp-northstar-s1 -n "$APP_NAME" --runtime "NODE:20-lts" --tags Env=Prod -o none
az webapp deployment slot create -g "$RG_EPH" -n "$APP_NAME" --slot staging -o none

# Notice --slot-settings makes DB_CONN sticky to each slot across swaps!
az webapp config appsettings set -g "$RG_EPH" -n "$APP_NAME" --slot-settings DB_CONN="Server=prod-db.northstar.internal" -o none
az webapp config appsettings set -g "$RG_EPH" -n "$APP_NAME" --slot staging --slot-settings DB_CONN="Server=staging-db.northstar.internal" -o none

echo "=== Integration Lab 03 Deployed! ==="
echo "Verify Azure File Share output: az storage file list --share-name batchlogs --account-name $ST_NAME -o table"
echo "Test Slot Swap: az webapp deployment slot swap -g $RG_EPH -n $APP_NAME --slot staging --target-slot production"
