#!/usr/bin/env bash
# Week 5 Monday/Tuesday: App Service (S1 briefly for slot demo) + Staging Slot + ACI container
# IMPORTANT: Delete rg-northstar-ephemeral when finished so S1 doesn't bill all month!
set -euo pipefail

LOCATION="${1:-eastus}"
RG_EPH="rg-northstar-ephemeral"
RAND_SUFFIX=$((RANDOM % 9000 + 1000))
APP_NAME="app-northstar-${RAND_SUFFIX}"

az group create -n "$RG_EPH" -l "$LOCATION" -o none
echo "Creating Standard (S1) App Service Plan + Web App $APP_NAME + 'staging' Deployment Slot..."
az appservice plan create -g "$RG_EPH" -n asp-northstar-lab --sku S1 --is-linux -o none
az webapp create -g "$RG_EPH" -p asp-northstar-lab -n "$APP_NAME" --runtime "NODE:20-lts" -o none
az webapp deployment slot create -g "$RG_EPH" -n "$APP_NAME" --slot staging -o none

echo "Deploying sample Azure Container Instance (ACI) with OnFailure restart policy..."
az container create -g "$RG_EPH" -n aci-northstar-batch \
  --image mcr.microsoft.com/azuredocs/aci-helloworld \
  --restart-policy OnFailure --cpu 1 --memory 1 --os-type Linux -o none

echo "Ready! Web App: https://${APP_NAME}.azurewebsites.net | Staging: https://${APP_NAME}-staging.azurewebsites.net"
echo "Export for sabotage script: export NORTHSTAR_APP=$APP_NAME"
