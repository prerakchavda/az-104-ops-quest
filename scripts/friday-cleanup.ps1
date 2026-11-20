# Deletes all hourly-billed lab resources in rg-northstar-ephemeral every Friday
# while keeping free/penny core resources (VNets, Policies, tiny LRS Storage) in rg-northstar-core.

param(
    [string]$ResourceGroupName = "rg-northstar-ephemeral"
)

$ErrorActionPreference = "Stop"

$exists = az group exists --name $ResourceGroupName
if ($exists -eq "true") {
    Write-Host "Deleting '$ResourceGroupName' asynchronously to stop hourly Azure charges..." -ForegroundColor Yellow
    az group delete --name $ResourceGroupName --yes --no-wait
    Write-Host "Teardown triggered! Verify in Azure Portal -> Cost Management." -ForegroundColor Green
} else {
    Write-Host "Resource group '$ResourceGroupName' does not exist - nothing to clean up." -ForegroundColor Cyan
}
