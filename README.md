# AZ-104 Study Workspace — Northstar Retail Architecture & Lab Guide

An editorial, distraction-free study workspace and lab repository for **Microsoft Exam AZ-104 (Azure Administrator Associate)** built 1-to-1 on [Microsoft's Official AZ-104 Study Guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104) *(verified October 30, 2026, targeting post-January 2027)*.

**Live Web Application (GitHub Pages):** https://prerakchavda.github.io/az-104-ops-quest/

---

## Key Capabilities (v3 Workspace)

### 1. Unified Domain Readiness & Weak-Spot Tracker (`Overview`)
- **Blended Per-Domain Mastery (0–100%):** Combines your 81-item Microsoft Study Guide coverage (**30%**), hands-on sprints & integration capstones (**30%**), and P1 incident, speed-run & mock exam accuracy (**40%**), weighted by official AZ-104 exam percentages.
- **"Where You Need the Most Work" Diagnostic Card:** Automatically ranks the domain costing you the most potential exam points right now, with 1-click links to open its step-by-step lab guide, multi-domain capstone, P1 incident queue, or interactive simulator.
- **Practice Assessment & Mock Exam Logger:** Log domain scores from Microsoft's free **AI Skills Navigator Practice Assessment**, Tutorials Dojo, or MeasureUp to calibrate your readiness.

### 2. Step-by-Step Lab Guides, Official MS Lab Links & Dual-Pace Plans (`Study Plan & Labs`)
- Switch seamlessly between the **8-Week Steady Plan (40 Days, 25m/weekday)** and the **3-Week Intensive Blitz (21 Days)**.
- Clicking **Step-by-Step Guide** on any day opens an inline drawer with:
  - **Exact Azure Portal Click-Path** (numbered instructions)
  - **Copyable Azure CLI / Bicep Commands** (with 1-click Copy)
  - **Verification & Exam Trap Checks**
  - **Direct links to Microsoft's 14 Official Hosted HTML Labs (`LAB 01` – `LAB 11`)** and Microsoft Learn documentation.

### 3. Four Multi-Domain "Connected Azure" Integration Capstone Labs
Located in [`labs/integration-labs/`](./labs/integration-labs/) and interactive inside the web app:
- **[Capstone 01: Zero-Secret Private Data Pipeline](./labs/integration-labs/lab-01-private-data-pipeline.md)** — Ties together *Identity + Networking + Storage + Compute* (VM Managed Identity → Data Plane RBAC → Spoke VNet Peering → Storage Private Endpoint → `privatelink.blob.core.windows.net` Private DNS → `CanNotDelete` Lock).
- **[Capstone 02: Zero-Public-IP High-Availability Web Tier](./labs/integration-labs/lab-02-zero-public-ip-ha-web.md)** — Ties together *Compute + Networking + DNS* (Bicep Deployment → 2 Private Linux VMs in Availability Set → Standard Public Load Balancer + HTTP Probe → 2-Gate Subnet & NIC NSGs → Azure Bastion `/26` → Private DNS Auto-Registration).
- **[Capstone 03: Governed Storefront & Serverless Batch Worker](./labs/integration-labs/lab-03-governed-modern-app-stack.md)** — Ties together *Governance + App Service + Containers + Storage* (Azure Policy + Remediation → App Service Standard S1 + Staging Slot with Slot-Sticky DB setting → ACI `OnFailure` container mounting an Azure File Share).
- **[Capstone 04: Full-Stack Observability, Network Diagnostics & DR](./labs/integration-labs/lab-04-observability-and-dr-drill.md)** — Ties together *Monitor + Backup/ASR + Networking + Compute* (Log Analytics + KQL + Action Group + Maintenance Window Alert Processing Rule → Network Watcher `IP Flow Verify` & `Next Hop` → Same-Region Backup Vault vs Target-Region ASR).

### 4. Practice Studio & Interactive Azure Simulators (`Practice Studio`)
- **20 P1 Troubleshooting Incidents** across all 5 domains
- **8 "Spot the 2 Bugs" Code & Config Sabotage Hunts** (Bicep, Azure CLI, NSG tables, Custom RBAC JSON)
- **3 Interactive Browser Simulators:** 2-Gate NSG Packet Tracer, RBAC + Lock + Policy Precedence Evaluator, and Azure `-5 IP` Subnet & CIDR Planner
- **2 Multi-Tab Exam Case Studies** & **10 Open-Book 45-Second Microsoft Learn Scavenger Hunts**
- **36-Card 60-Second Exam Trap Speed Run** with automatic Spaced-Repetition Rematch Queue

---

## All 14 Official Microsoft Hosted HTML Labs (Direct Reference)

| Lab Code | Official Microsoft Lab Guide | AZ-104 Domain |
| :---: | :--- | :--- |
| **LAB 01** | [Manage Microsoft Entra ID Identities](https://microsoftlearning.github.io/AZ-104-MicrosoftAzureAdministrator/Instructions/Labs/LAB_01-Manage_Entra_ID_Identities.html) | Identities & Governance |
| **LAB 02a** | [Manage Subscriptions and RBAC](https://microsoftlearning.github.io/AZ-104-MicrosoftAzureAdministrator/Instructions/Labs/LAB_02a_Manage_Subscriptions_and_RBAC_Entra.html) | Identities & Governance |
| **LAB 02b** | [Manage Governance via Azure Policy](https://microsoftlearning.github.io/AZ-104-MicrosoftAzureAdministrator/Instructions/Labs/LAB_02b-Manage_Governance_via_Azure_Policy.html) | Identities & Governance |
| **LAB 03b** | [Manage Azure Resources by Using ARM Templates / Bicep](https://microsoftlearning.github.io/AZ-104-MicrosoftAzureAdministrator/Instructions/Labs/LAB_03b-Manage_Azure_Resources_by_Using_ARM_Templates.html) | Compute |
| **LAB 04** | [Implement Virtual Networking](https://microsoftlearning.github.io/AZ-104-MicrosoftAzureAdministrator/Instructions/Labs/LAB_04-Implement_Virtual_Networking.html) | Virtual Networking |
| **LAB 05** | [Implement Intersite Connectivity](https://microsoftlearning.github.io/AZ-104-MicrosoftAzureAdministrator/Instructions/Labs/LAB_05-Implement_Intersite_Connectivity.html) | Virtual Networking |
| **LAB 06** | [Implement Network Traffic Management](https://microsoftlearning.github.io/AZ-104-MicrosoftAzureAdministrator/Instructions/Labs/LAB_06-Implement_Network_Traffic_Management.html) | Virtual Networking |
| **LAB 07** | [Manage Azure Storage](https://microsoftlearning.github.io/AZ-104-MicrosoftAzureAdministrator/Instructions/Labs/LAB_07-Manage_Azure_Storage.html) | Storage |
| **LAB 08** | [Manage Virtual Machines](https://microsoftlearning.github.io/AZ-104-MicrosoftAzureAdministrator/Instructions/Labs/LAB_08-Manage_Virtual_Machines.html) | Compute |
| **LAB 09a** | [Implement Web Apps](https://microsoftlearning.github.io/AZ-104-MicrosoftAzureAdministrator/Instructions/Labs/LAB_09a-Implement_Web_Apps.html) | Compute |
| **LAB 09b** | [Implement Azure Container Instances](https://microsoftlearning.github.io/AZ-104-MicrosoftAzureAdministrator/Instructions/Labs/LAB_09b-Implement_Azure_Container_Instances.html) | Compute |
| **LAB 09c** | [Implement Azure Container Apps](https://microsoftlearning.github.io/AZ-104-MicrosoftAzureAdministrator/Instructions/Labs/LAB_09c-Implement-Azure-Container-Apps.html) | Compute |
| **LAB 10** | [Implement Data Protection (Backup & ASR)](https://microsoftlearning.github.io/AZ-104-MicrosoftAzureAdministrator/Instructions/Labs/LAB_10-Implement_Data_Protection.html) | Monitor & Maintain |
| **LAB 11** | [Implement Monitoring](https://microsoftlearning.github.io/AZ-104-MicrosoftAzureAdministrator/Instructions/Labs/LAB_11-Implement_Monitoring.html) | Monitor & Maintain |
