#!/usr/bin/env bash
# Week 7 Thursday SABOTAGE: Creates a Recovery Services Vault in the WRONG region (westus2 instead of eastus)
# so your eastus VM cannot be discovered for Azure Backup!
set -euo pipefail

RG_EPH="rg-northstar-ephemeral"
echo "Creating a Recovery Services Vault in westus2 (while your VMs live in eastus)..."
az group create -n "$RG_EPH" -l eastus -o none
az backup vault create -g "$RG_EPH" -n rsv-northstar-wrongregion --location westus2 -o none

echo ""
echo "=== INCIDENT TICKET W7-INC ==="
echo "Open 'rsv-northstar-wrongregion' in Portal -> + Backup -> Azure Virtual Machine."
echo "Why are NONE of your eastus VMs showing up?!"
echo "Mission: Explain Backup region rules vs Site Recovery (ASR) region rules, create the vault in the right region, and remember to disable Soft Delete before deleting lab vaults!"
