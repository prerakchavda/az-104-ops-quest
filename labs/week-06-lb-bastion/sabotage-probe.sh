#!/usr/bin/env bash
# Week 6 Wednesday SABOTAGE: Adds a custom Priority 200 DenyAllInbound NSG rule that kills Standard LB health probes!
set -euo pipefail

RG_CORE="rg-northstar-core"

echo "Injecting Load Balancer Health Probe outage on nsg-app-subnet..."
az network nsg create -g "$RG_CORE" -n nsg-app-subnet -o none
az network nsg rule create -g "$RG_CORE" --nsg-name nsg-app-subnet -n AllowVnetHTTP \
  --priority 100 --direction Inbound --access Allow --protocol Tcp \
  --source-address-prefixes VirtualNetwork --destination-port-ranges 80 -o none
az network nsg rule create -g "$RG_CORE" --nsg-name nsg-app-subnet -n StrictDenyAll \
  --priority 200 --direction Inbound --access Deny --protocol "*" \
  --source-address-prefixes "*" --destination-port-ranges "*" -o none

az network vnet subnet update -g "$RG_CORE" --vnet-name vnet-app -n snet-app --network-security-group nsg-app-subnet -o none

echo ""
echo "=== INCIDENT TICKET W6-INC ==="
echo "Your Standard Load Balancer health probe just dropped to 0% healthy!"
echo "Even though Azure has default rule 65001 (AllowAzureLoadBalancerInBound), probes are failing!"
echo "Mission: Add the exact NSG rule needed (Service Tag + Priority < 200) to bring backend health back to 100%."
