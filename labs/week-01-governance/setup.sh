#!/usr/bin/env bash
# Week 1 Monday: Create Northstar Retail's two-RG cost-safe layout + $10 Monthly Budget
set -euo pipefail

LOCATION="${1:-eastus}"
ALERT_EMAIL="${2:-}"

echo "Creating rg-northstar-core (free/penny infra) and rg-northstar-ephemeral (hourly compute) in $LOCATION..."
az group create --name rg-northstar-core --location "$LOCATION" --tags Env=Lab Project=Northstar CostTier=Core -o table
az group create --name rg-northstar-ephemeral --location "$LOCATION" --tags Env=Lab Project=Northstar CostTier=Ephemeral -o table

if [[ -n "$ALERT_EMAIL" ]]; then
  START_DATE="$(date -u +%Y-%m-01)"
  END_DATE="$(date -u -d '+1 year' +%Y-%m-01 2>/dev/null || echo '2028-01-01')"
  echo "Creating $10/month Azure Cost Budget (email: $ALERT_EMAIL)..."
  az consumption budget create \
    --budget-name northstar-lab-10usd \
    --amount 10 \
    --category cost \
    --time-grain monthly \
    --start-date "$START_DATE" \
    --end-date "$END_DATE" || echo "Note: If your subscription type doesn't support CLI budget creation, create a \$10 budget in Portal → Cost Management → Budgets."
else
  echo "Tip: Pass your email as arg 2 (./setup.sh eastus you@example.com) or set a \$10 Budget in Portal → Cost Management → Budgets."
fi

echo "Done! Next: Create 2 test Entra ID users + 1 security group in the Entra ID blade."
