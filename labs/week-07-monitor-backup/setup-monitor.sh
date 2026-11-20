#!/usr/bin/env bash
# Week 7 Monday/Tuesday: Log Analytics Workspace + Action Group + Alert Processing Rule (Maintenance Window)
set -euo pipefail

LOCATION="${1:-eastus}"
ALERT_EMAIL="${2:-ops@example.com}"
RG_EPH="rg-northstar-ephemeral"

az group create -n "$RG_EPH" -l "$LOCATION" -o none
echo "Creating Log Analytics Workspace 'law-northstar-lab'..."
az monitor log-analytics workspace create -g "$RG_EPH" -n law-northstar-lab -l "$LOCATION" -o none

echo "Creating Action Group 'ag-northstar-oncall' (email: $ALERT_EMAIL)..."
az monitor action-group create -g "$RG_EPH" -n ag-northstar-oncall \
  --short-name NorthstarOps --action email oncall "$ALERT_EMAIL" -o none

echo "Log Analytics + Action Group ready!"
echo "Next in Portal:"
echo "1. Open Diagnostic Settings on your Storage Account & Activity Log → route to 'law-northstar-lab'."
echo "2. Create an Alert Processing Rule suppressing notifications during Sunday 02:00–04:00 maintenance."
