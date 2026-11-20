# Integration Lab 02: Zero-Public-IP High-Availability Web Tier

**Domains Connected:** Compute (20–25%) • Virtual Networking (15–20%) • Identity & Security  
**Estimated Time:** 35–45 minutes  
**Official Microsoft Lab References:**
- [Lab 03b: Manage Azure Resources by Using ARM Templates / Bicep](https://microsoftlearning.github.io/AZ-104-MicrosoftAzureAdministrator/Instructions/Labs/LAB_03b-Manage_Azure_Resources_by_Using_ARM_Templates.html)
- [Lab 06: Implement Network Traffic Management](https://microsoftlearning.github.io/AZ-104-MicrosoftAzureAdministrator/Instructions/Labs/LAB_06-Implement_Network_Traffic_Management.html)
- [Lab 08: Manage Virtual Machines](https://microsoftlearning.github.io/AZ-104-MicrosoftAzureAdministrator/Instructions/Labs/LAB_08-Manage_Virtual_Machines.html)

---

## 1. Architecture You Are Building

```
[Internet Customers] ──(TCP 80)──> [Standard Public Load Balancer + HTTP Health Probe (/)]
                                           │
                      ┌────────────────────┴────────────────────┐
                      ▼                                         ▼
        [Gate 1: Subnet NSG]  ──(Must allow TCP 80 + AzureLoadBalancer tag!)
        [Gate 2: VM NIC NSG]
                      │                                         │
           [vm-web-01 (No Public IP)]                [vm-web-02 (No Public IP)]
           (Availability Set: 2 FD / 5 UD)           (Auto-registered in Private DNS)
                      ▲
                      └──(SSH via Browser TLS)── [Azure Bastion in AzureBastionSubnet (/26)]
```

---

## 2. Step-by-Step Azure Portal + Bicep Guide

1. **Deploy the HA Stack via Bicep (`lab-02-deploy.bicep`):**
   - Open Azure Cloud Shell and run:
     ```bash
     az group create -n rg-northstar-ephemeral -l eastus
     az deployment group create -g rg-northstar-ephemeral \
       --template-file labs/integration-labs/lab-02-deploy.bicep \
       --parameters adminPassword='<YourStrongPass123!>'
     ```
   - This single template provisions:
     - `vnet-ha` (`10.30.0.0/16`) with `snet-web` (`10.30.1.0/24`) and `AzureBastionSubnet` (`10.30.2.0/26`).
     - Subnet NSG allowing TCP 80 from `Internet` (Priority 100) and `AzureLoadBalancer` health probes (Priority 110).
     - An Availability Set (`avset-web`, 2 Fault Domains, 5 Update Domains) with two `Standard_B1s` Linux VMs running nginx (zero VM Public IPs).
     - A Standard Public Load Balancer (`lb-northstar-ha`) with backend pool, HTTP probe on port 80, and load balancing rule.
     - A Private DNS Zone (`northstar.internal`) with VNet auto-registration enabled.
2. **Test Load Balancing & Failover:**
   - Copy the `lbPublicIp` output from the Bicep deployment and run `curl http://<lbPublicIp>` several times — watch it alternate between `vm-web-01` and `vm-web-02`.
3. **Trigger & Diagnose the Classic Health Probe Outage:**
   - In the Portal, open `nsg-snet-web` → **Inbound security rules** → add a custom rule:
     - Priority: `105`, Source: `Any`, Destination: `Any`, Port: `*`, Action: **Deny** (`BlockAllTest`).
   - Notice Priority `105` sits between `100` (Allow HTTP) and `110` (Allow `AzureLoadBalancer`)! Within 15 seconds, the Load Balancer health probe is blocked and `curl http://<lbPublicIp>` times out.
   - Delete `BlockAllTest` (or move `AllowAzureLoadBalancer` to Priority `101`) and watch traffic recover.
4. **Teardown Same Day:**
   ```bash
   ./scripts/friday-cleanup.sh
   ```
