#!/usr/bin/env bash
# Week 2 Monday/Tuesday: Build Hub-and-Spoke VNets (FREE in rg-northstar-core)
# + 2 tiny B1s Linux VMs in rg-northstar-ephemeral to test non-transitive peering!
set -euo pipefail

LOCATION="${1:-eastus}"
RG_CORE="rg-northstar-core"
RG_EPH="rg-northstar-ephemeral"

az group create -n "$RG_CORE" -l "$LOCATION" -o none
az group create -n "$RG_EPH" -l "$LOCATION" -o none

echo "Creating Hub (10.0.0.0/16), App Spoke (10.1.0.0/16), and Data Spoke (10.2.0.0/16)..."
az network vnet create -g "$RG_CORE" -n vnet-hub --address-prefix 10.0.0.0/16 --subnet-name snet-shared --subnet-prefix 10.0.1.0/24 -o none
az network vnet create -g "$RG_CORE" -n vnet-app --address-prefix 10.1.0.0/16 --subnet-name snet-app --subnet-prefix 10.1.1.0/24 -o none
az network vnet create -g "$RG_CORE" -n vnet-data --address-prefix 10.2.0.0/16 --subnet-name snet-data --subnet-prefix 10.2.1.0/24 -o none

echo "Creating bidirectional Hub <-> App and Hub <-> Data peerings..."
APP_ID=$(az network vnet show -g "$RG_CORE" -n vnet-app --query id -o tsv)
DATA_ID=$(az network vnet show -g "$RG_CORE" -n vnet-data --query id -o tsv)
HUB_ID=$(az network vnet show -g "$RG_CORE" -n vnet-hub --query id -o tsv)

az network vnet peering create -g "$RG_CORE" -n hub-to-app --vnet-name vnet-hub --remote-vnet "$APP_ID" --allow-vnet-access -o none
az network vnet peering create -g "$RG_CORE" -n app-to-hub --vnet-name vnet-app --remote-vnet "$HUB_ID" --allow-vnet-access -o none
az network vnet peering create -g "$RG_CORE" -n hub-to-data --vnet-name vnet-hub --remote-vnet "$DATA_ID" --allow-vnet-access -o none
az network vnet peering create -g "$RG_CORE" -n data-to-hub --vnet-name vnet-data --remote-vnet "$HUB_ID" --allow-vnet-access -o none

echo "Hub-and-spoke VNets + peerings ready! Notice App <-> Data are NOT directly peered (test non-transitivity!)."
echo "Optional: Deploy 2 tiny Standard_B1s Linux VMs into snet-app and snet-data inside $RG_EPH to test connectivity."
