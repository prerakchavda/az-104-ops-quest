#!/usr/bin/env bash
# Integration Lab 01: Zero-Secret Private Data Pipeline (Identity + Networking + Storage + Compute)
set -euo pipefail

LOCATION="${1:-eastus}"
RG_CORE="rg-northstar-core"
RG_EPH="rg-northstar-ephemeral"
RAND_SUFFIX=$((RANDOM % 9000 + 1000))
ST_NAME="stnorthstar${RAND_SUFFIX}"

echo "[1/6] Creating Resource Groups..."
az group create -n "$RG_CORE" -l "$LOCATION" -o none
az group create -n "$RG_EPH" -l "$LOCATION" -o none

echo "[2/6] Creating vnet-app (10.1.0.0/16) & vnet-data (10.2.0.0/16) + Bidirectional Peering..."
az network vnet create -g "$RG_CORE" -n vnet-app --address-prefix 10.1.0.0/16 --subnet-name snet-app --subnet-prefix 10.1.1.0/24 -o none
az network vnet create -g "$RG_CORE" -n vnet-data --address-prefix 10.2.0.0/16 --subnet-name snet-data --subnet-prefix 10.2.1.0/24 -o none

APP_VNET_ID=$(az network vnet show -g "$RG_CORE" -n vnet-app --query id -o tsv)
DATA_VNET_ID=$(az network vnet show -g "$RG_CORE" -n vnet-data --query id -o tsv)

az network vnet peering create -g "$RG_CORE" -n app-to-data --vnet-name vnet-app --remote-vnet "$DATA_VNET_ID" --allow-vnet-access -o none
az network vnet peering create -g "$RG_CORE" -n data-to-app --vnet-name vnet-data --remote-vnet "$APP_VNET_ID" --allow-vnet-access -o none

echo "[3/6] Creating Storage Account $ST_NAME & disabling Public Network Access..."
az storage account create -g "$RG_CORE" -n "$ST_NAME" -l "$LOCATION" --sku Standard_LRS --kind StorageV2 --allow-blob-public-access false -o none
ST_ID=$(az storage account show -g "$RG_CORE" -n "$ST_NAME" --query id -o tsv)
az storage container create --name orders --account-name "$ST_NAME" -o none
az storage account update -g "$RG_CORE" -n "$ST_NAME" --public-network-access Disabled -o none

echo "[4/6] Creating Private Endpoint in vnet-data + Private DNS Zone linked to BOTH VNets..."
PE_ID=$(az network private-endpoint create -g "$RG_EPH" -n pe-northstar-blob \
  --vnet-name "$DATA_VNET_ID" --subnet snet-data \
  --private-connection-resource-id "$ST_ID" --group-id blob \
  --connection-name conn-blob --query id -o tsv)

az network private-dns zone create -g "$RG_CORE" -n privatelink.blob.core.windows.net -o none
az network private-dns link vnet create -g "$RG_CORE" -n link-vnet-data -z privatelink.blob.core.windows.net -v "$DATA_VNET_ID" -e false -o none
az network private-dns link vnet create -g "$RG_CORE" -n link-vnet-app -z privatelink.blob.core.windows.net -v "$APP_VNET_ID" -e false -o none
az network private-endpoint dns-zone-group create -g "$RG_EPH" --endpoint-name pe-northstar-blob -n default \
  --private-dns-zone privatelink.blob.core.windows.net --zone-name blob -o none

echo "[5/6] Deploying vm-app-01 with System-Assigned Managed Identity & granting Storage Blob Data Contributor..."
APP_SUBNET_ID=$(az network vnet subnet show -g "$RG_CORE" --vnet-name vnet-app -n snet-app --query id -o tsv)
az vm create -g "$RG_EPH" -n vm-app-01 --image Ubuntu2204 --size Standard_B1s \
  --subnet "$APP_SUBNET_ID" --public-ip-address "" --assign-identity \
  --admin-username azureuser --generate-ssh-keys -o none

VM_PRINCIPAL_ID=$(az vm show -g "$RG_EPH" -n vm-app-01 --query identity.principalId -o tsv)
az role assignment create --assignee-object-id "$VM_PRINCIPAL_ID" --assignee-principal-type ServicePrincipal \
  --role "Storage Blob Data Contributor" --scope "$ST_ID" -o none

echo "[6/6] Applying CanNotDelete Lock on $ST_NAME..."
az lock create -n lock-protect-orders -g "$RG_CORE" --resource-name "$ST_NAME" \
  --resource-type Microsoft.Storage/storageAccounts --lock-type CanNotDelete -o none

echo "=== Integration Lab 01 Deployed! ==="
echo "Storage Account: $ST_NAME | Test via Portal -> vm-app-01 -> Run Command -> RunShellScript:"
echo "  nslookup ${ST_NAME}.blob.core.windows.net"
