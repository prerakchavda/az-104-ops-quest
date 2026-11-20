// Integration Lab 02: Zero-Public-IP High-Availability Web Tier (Compute + Networking + DNS)
// Deploy:
//   az deployment group create -g rg-northstar-ephemeral --template-file labs/integration-labs/lab-02-deploy.bicep --parameters adminPassword='<StrongPass123!>'

param location string = resourceGroup().location
param adminUsername string = 'azureuser'
@secure()
param adminPassword string
param vmSize string = 'Standard_B1s'

resource nsg 'Microsoft.Network/networkSecurityGroups@2023-09-01' = {
  name: 'nsg-snet-web'
  location: location
  properties: {
    securityRules: [
      {
        name: 'AllowInternetHTTP'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: 'Internet'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '80'
        }
      }
      {
        name: 'AllowHealthProbes'
        properties: {
          priority: 110
          direction: 'Inbound'
          access: 'Allow'
          protocol: '*'
          sourceAddressPrefix: 'AzureLoadBalancer'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '*'
        }
      }
    ]
  }
}

resource vnet 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  name: 'vnet-ha'
  location: location
  properties: {
    addressSpace: { addressPrefixes: ['10.30.0.0/16'] }
    subnets: [
      {
        name: 'snet-web'
        properties: {
          addressPrefix: '10.30.1.0/24'
          networkSecurityGroup: { id: nsg.id }
        }
      }
      {
        name: 'AzureBastionSubnet'
        properties: {
          addressPrefix: '10.30.2.0/26'
        }
      }
    ]
  }
}

resource privateDns 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'northstar.internal'
  location: 'global'
}

resource dnsLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: privateDns
  name: 'link-vnet-ha'
  location: 'global'
  properties: {
    registrationEnabled: true
    virtualNetwork: { id: vnet.id }
  }
}

resource pip 'Microsoft.Network/publicIPAddresses@2023-09-01' = {
  name: 'pip-lb-ha'
  location: location
  sku: { name: 'Standard' }
  properties: { publicIPAllocationMethod: 'Static' }
}

resource lb 'Microsoft.Network/loadBalancers@2023-09-01' = {
  name: 'lb-northstar-ha'
  location: location
  sku: { name: 'Standard' }
  properties: {
    frontendIPConfigurations: [
      {
        name: 'fe-public'
        properties: { publicIPAddress: { id: pip.id } }
      }
    ]
    backendAddressPools: [ { name: 'be-web' } ]
    probes: [
      {
        name: 'probe-http'
        properties: {
          protocol: 'Http'
          port: 80
          requestPath: '/'
          intervalInSeconds: 5
          numberOfProbes: 2
        }
      }
    ]
    loadBalancingRules: [
      {
        name: 'rule-http'
        properties: {
          frontendIPConfiguration: { id: resourceId('Microsoft.Network/loadBalancers/frontendIPConfigurations', 'lb-northstar-ha', 'fe-public') }
          backendAddressPool: { id: resourceId('Microsoft.Network/loadBalancers/backendAddressPools', 'lb-northstar-ha', 'be-web') }
          probe: { id: resourceId('Microsoft.Network/loadBalancers/probes', 'lb-northstar-ha', 'probe-http') }
          protocol: 'Tcp'
          frontendPort: 80
          backendPort: 80
        }
      }
    ]
  }
}

resource avset 'Microsoft.Compute/availabilitySets@2023-09-01' = {
  name: 'avset-web'
  location: location
  sku: { name: 'Aligned' }
  properties: {
    platformFaultDomainCount: 2
    platformUpdateDomainCount: 5
  }
}

resource nics 'Microsoft.Network/networkInterfaces@2023-09-01' = [for i in [1, 2]: {
  name: 'nic-vm-web-0${i}'
  location: location
  properties: {
    ipConfigurations: [
      {
        name: 'ipconfig1'
        properties: {
          privateIPAllocationMethod: 'Dynamic'
          subnet: { id: vnet.properties.subnets[0].id }
          loadBalancerBackendAddressPools: [
            { id: lb.properties.backendAddressPools[0].id }
          ]
        }
      }
    ]
  }
}]

resource vms 'Microsoft.Compute/virtualMachines@2023-09-01' = [for i in [1, 2]: {
  name: 'vm-web-0${i}'
  location: location
  properties: {
    availabilitySet: { id: avset.id }
    hardwareProfile: { vmSize: vmSize }
    osProfile: {
      computerName: 'vm-web-0${i}'
      adminUsername: adminUsername
      adminPassword: adminPassword
      customData: base64('#cloud-config\npackage_upgrade: false\npackages:\n  - nginx\nruncmd:\n  - echo "Northstar HA Storefront - Served by $(hostname)" > /var/www/html/index.html\n  - systemctl restart nginx\n')
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
        managedDisk: { storageAccountType: 'Standard_LRS' }
      }
    }
    networkProfile: {
      networkInterfaces: [ { id: nics[i - 1].id } ]
    }
  }
}]

output lbPublicIp string = pip.properties.ipAddress
