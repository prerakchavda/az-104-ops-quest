# Multi-Domain Azure Integration Capstone Labs

Standard Microsoft Learn labs test one service at a time in isolation. Real Azure administration—and the hardest AZ-104 exam case studies—test **how 4 to 5 services across different domains wire together** (and what breaks when one link is misconfigured).

These **4 Multi-Domain Integration Labs** tie everything together inside your Northstar Retail environment:

| Lab | Title | Domains Connected | Core Architecture Wired Together |
| :---: | :--- | :--- | :--- |
| **01** | [Zero-Secret Private Data Pipeline](./lab-01-private-data-pipeline.md) | Identity + Networking + Storage + Compute | VM System-Assigned Managed Identity → `Storage Blob Data Contributor` (Data Plane RBAC) → Peered Hub/Spoke VNets → Storage Private Endpoint (`10.2.1.x`) → Private DNS Zone (`privatelink.blob.core.windows.net`) → `CanNotDelete` Lock |
| **02** | [Zero-Public-IP High-Availability Web Tier](./lab-02-zero-public-ip-ha-web.md) | Compute + Networking + Identity | Bicep Deployment → 2 Private Linux VMs in Availability Set → Standard Public Load Balancer (HTTP Probe) → 2-Gate Subnet & NIC NSGs (`AzureLoadBalancer` tag) → Azure Bastion (`/26` `AzureBastionSubnet`) → Private DNS Auto-Registration |
| **03** | [Governed Storefront & Serverless Batch Worker](./lab-03-governed-modern-app-stack.md) | Governance + Compute + Storage + Networking | Azure Policy (`Allowed locations` + `Modify` Tag + Remediation) → App Service Standard (`S1`) + `staging` Deployment Slot (Sticky DB Setting) + Regional VNet Integration → Azure Container Instance (`OnFailure`) mounting an Azure File Share |
| **04** | [Full-Stack Observability, Network Diagnostics & DR](./lab-04-observability-and-dr-drill.md) | Monitor/Backup + Networking + Compute + Storage | Log Analytics Workspace + Diagnostic Settings → KQL Log Alert + Metric Alert + Action Group + Maintenance Window Alert Processing Rule → Network Watcher (`IP Flow Verify` & `Next Hop` catching a UDR blackhole) → Same-Region Backup Vault vs Target-Region ASR |

## Cost-Safety Rule
All hourly compute/network gateways deploy into `rg-northstar-ephemeral`. Run `./scripts/friday-cleanup.sh` as soon as you finish a lab session to keep your monthly Azure spend under **$5**.
