#!/usr/bin/env bash
# Week 5 Wednesday SABOTAGE: Sets a NON-sticky staging DB setting on the staging slot!
set -euo pipefail

APP_NAME="${1:-${NORTHSTAR_APP:-}}"
RG_EPH="rg-northstar-ephemeral"

if [[ -z "$APP_NAME" ]]; then
  echo "Usage: ./sabotage-slot.sh <your-app-service-name>"
  exit 1
fi

echo "Planting slot-swap configuration bug on $APP_NAME..."
az webapp config appsettings set -g "$RG_EPH" -n "$APP_NAME" --settings DB_TARGET="PROD-DB-LIVE" -o none
az webapp config appsettings set -g "$RG_EPH" -n "$APP_NAME" --slot staging --settings DB_TARGET="STAGING-TEST-DB" -o none

echo ""
echo "=== INCIDENT TICKET W5-INC ==="
echo "If you swap 'staging' -> 'production' right now, Production will suddenly point to STAGING-TEST-DB!"
echo "Mission: Fix DB_TARGET on BOTH slots so each slot keeps its OWN database value after a swap (hint: Deployment Slot Setting / --slot-settings)."
