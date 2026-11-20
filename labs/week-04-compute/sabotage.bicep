// Week 4 Wednesday SABOTAGE BUG HUNT!
// There are 3 deliberate AZ-104 / Bicep bugs hidden in this file.
// Try running `az bicep build --file sabotage.bicep` and spotting ALL 3 bugs before checking the hints at the bottom!

param location string = resourceGroup().location

resource brokenVnet 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  name: 'vnet-sabotage-test'
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [ '10.90.0.0/16' ]
    }
    subnets: [
      {
        name: 'BastionSubnet' // BUG? Check name + prefix!
        properties: { addressPrefix: '10.90.1.0/27' }
      }
      {
        name: 'snet-app'
        properties: { addressPrefix: '10.90.1.0/24' } // BUG? Check overlap!
      }
    ]
  }
}

resource brokenStorage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'StNorthstar_Broken-01' // BUG? Check Azure Storage Account naming rules!
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
}

// --- ANSWERS (Scroll down only after you guess!) ---
// 1. BastionSubnet must be named EXACTLY 'AzureBastionSubnet' with minimum prefix '/26' (not '/27').
// 2. 10.90.1.0/24 overlaps directly with 10.90.1.0/27! Use e.g. 10.90.2.0/24.
// 3. Storage Account names must be 3-24 chars, LOWERCASE letters and numbers ONLY (no uppercase, hyphens, or underscores)!
