#!/usr/bin/env bash
# Week 2 Wednesday SABOTAGE: Injects a conflicting Subnet NSG rule + UDR blackhole onto snet-app!
# DON'T READ BELOW LINE 10 UNTIL YOU SOLVE IT IN THE PORTAL!
set -euo pipefail

RG_CORE="rg-northstar-core"
echo "Injecting sneaky networking outage on vnet-app/snet-app..."

az network nsg create -g "$RG_CORE" -n nsg-app-subnet -o none
az network nsg rule create -g "$RG_CORE" --nsg-name nsg-app-subnet -n AllowHTTP \
  --priority 200 --direction Inbound --access Allow --protocol Tcp --destination-port-ranges 80 443 -o none
az network nsg rule create -g "$RG_CORE" --nsg-name nsg-app-subnet -n MysteryBlock \
  --priority 150 --direction Inbound --access Deny --protocol Tcp --source-address-prefixes "*" --destination-port-ranges 80 443 -o none

az network route-table create -g "$RG_CORE" -n rt-app-mystery -o none
az network route-table route create -g "$RG_CORE" --route-table-name rt-app-mystery -n BlackholeData \
  --address-prefix 10.2.1.0/24 --next-hop-type None -o none

az network vnet subnet update -g "$RG_CORE" --vnet-name vnet-app -n snet-app \
  --network-security-group nsg-app-subnet --route-table rt-app-mystery -o none

echo ""
echo "=== INCIDENT TICKET W2-INC ==="
echo "Something broke on vnet-app/snet-app:"
echo "1. Inbound HTTP/HTTPS is being dropped even though an AllowHTTP rule exists!"
echo "2. Outbound traffic to 10.2.1.0/24 is disappearing into thin air!"
echo "Mission: Use Effective Security Rules + Effective Routes (or Portal NSG/Route Table blades) to find and fix BOTH causes."
