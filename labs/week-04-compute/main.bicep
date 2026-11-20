// Week 4 Monday: Clean, low-cost Bicep template deploying a Standard_B1s Linux VM
// with System-Assigned Managed Identity into existing vnet-app/snet-app!
// Deploy with:
//   az deployment group create -g rg-northstar-ephemeral --template-file main.bicep --parameters adminPassword='<StrongPass123!>'

param location string = resourceGroup().location
param vmName string = 'vm-app-01'
param vmSize string = 'Standard_B1s'
param adminUsername string = 'azureuser'
@secure()
param adminPassword string
param coreRgName string = 'rg-northstar-core'
param vnetName string = 'vnet-app'
param subnetName string = 'snet-app'

resource nic 'Microsoft.Network/networkInterfaces@2023-09-01' = {
  name: 'nic-${vmName}'
  location: location
  properties: {
    ipConfigurations: [
      {
        name: 'ipconfig1'
        properties: {
          privateIPAllocationMethod: 'Dynamic'
          subnet: {
            id: resourceId(coreRgName, 'Microsoft.Network/virtualNetworks/subnets', vnetName, subnetName)
          }
        }
      }
    ]
  }
}

resource vm 'Microsoft.Compute/virtualMachines@2023-09-01' = {
  name: vmName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    hardwareProfile: {
      vmSize: vmSize
    }
    osProfile: {
      computerName: vmName
      adminUsername: adminUsername
      adminPassword: adminPassword
    }
    storageProfile: {
      imageReference: {
        publisher: 'Canonical'
        offer: '0001-com-ubuntu-server-jammy'
        sku: '22_04-lts-gen2'
        version: 'latest'
      }
      osDisk: {
        createOption: 'FromImage'
        managedDisk: {
          storageAccountType: 'Standard_LRS'
        }
      }
    }
    networkProfile: {
      networkInterfaces: [
        { id: nic.id }
      ]
    }
  }
}

output vmPrincipalId string = vm.identity.principalId
output privateIp string = nic.properties.ipConfigurations[0].properties.privateIPAddress
