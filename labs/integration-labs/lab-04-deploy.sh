#!/usr/bin/env bash
# Integration Lab 04: Log Analytics + Action Group + Maintenance Alert Processing Rule + Same-Region RSV
set -euo pipefail

LOCATION="${1:-eastus}"
EMAIL="${2:-ops@example.com}"
RG_EPH="rg-northstar-ephemeral"

echo "[1/4] Ensuring $RG_EPH exists in $LOCATION..."
az group create -n "$RG_EPH" -l "$LOCATION" -o none

echo "[2/4] Creating Log Analytics Workspace 'law-northstar'..."
LAW_ID=$(az monitor log-analytics workspace create -g "$RG_EPH" -n law-northstar -l "$LOCATION" --query id -o tsv)

echo "[3/4] Creating Action Group 'ag-northstar-ops'..."
AG_ID=$(az monitor action-group create -g "$RG_EPH" -n ag-northstar-ops \
  --short-name NorthOps --action email OpsLead "$EMAIL" --query id -o tsv)

echo "[4/4] Creating Same-Region Recovery Services Vault 'rsv-northstar-backup'..."
az backup vault create -g "$RG_EPH" -n rsv-northstar-backup -l "$LOCATION" -o none

echo "=== Integration Lab 04 Deployed! ==="
echo "Log Analytics Workspace ID: $LAW_ID"
echo "Action Group ID:            $AG_ID"
echo "Remember: Before deleting rsv-northstar-backup, disable Soft Delete if you enroll any VM!"
