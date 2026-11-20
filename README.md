# AZ-104 Study Workspace — Northstar Retail Architecture & First-Try Pass Exam Engine (v4)

An editorial, distraction-free study workspace, interactive exam simulator, and hands-on lab repository for **Microsoft Exam AZ-104 (Azure Administrator Associate)** built 1-to-1 on [Microsoft's Official AZ-104 Study Guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104) *(verified October 30, 2026, targeting post-January 2027)*.

**Live Web Application (GitHub Pages):** https://prerakchavda.github.io/az-104-ops-quest/

---

## Key Capabilities (v4 First-Try Pass Engine)

### 1. Calibrated Domain Readiness & 4-Gate "First-Try Pass" Verdict (`Overview & Readiness`)
- **Honest Accuracy-Gated Scaled Score (`300–1000`, Pass: `700`):** Prevents the "checkbox illusion of competence" — checking off lab or blueprint boxes alone caps below `700/1000` until you prove active recall across troubleshooting incidents, interactive exam drills, sprint exit checkpoints, and timed mock exams (**20%** Blueprint + **25%** Verified Labs & Exit Checkpoints + **55%** Active Recall & Mock Accuracy).
- **4-Gate First-Try Pass Checklist:** Tracks the 4 non-negotiable criteria for passing AZ-104 on attempt #1:
  1. **Calibrated Score ≥ 740 / 1000** (Safety buffer above Microsoft's 700 pass line)
  2. **Every Domain ≥ 70% Mastery** (Zero single-domain collapse)
  3. **Timed Mock Exam ≥ 75%** (Proven 90-second/question pacing under a live clock)
  4. **Leitner Box 1 Urgent Queue = 0** (All missed traps & incidents defused with a 2x consecutive streak)
- **"Where You Need the Most Work" Diagnostic Card:** Ranks the domain costing you the most exam-weighted points right now, with 1-click links to its Lab Guide, Interactive Drills, P1 Incidents, Active-Recall Decision Matrix, or Browser Simulator.

### 2. Step-by-Step Lab Guides, Sprint Exit Checkpoints & Dual-Pace Plans (`Study Plan & Labs`)
- Switch seamlessly between the **8-Week Steady Plan (40 Days, 25m/weekday)** and the **3-Week Intensive Blitz (21 Days)**.
- Clicking **Step-by-Step Guide & Quiz** on any day opens an inline drawer with:
  - **Exact Azure Portal Click-Path** (numbered instructions)
  - **Copyable Azure CLI / Bicep Commands** (with 1-click Copy)
  - **Verification & Exam Trap Checks**
  - **Direct links to Microsoft's 14 Official Hosted HTML Labs (`LAB 01` – `LAB 11`)**
  - **Sprint Exit Checkpoint (2-Question Active Recall Gate):** Verifies real comprehension of that lab's exam traps (30 checkpoint questions across all 15 topic guides) before marking the topic `✓ Recall Verified`.

### 3. Four Multi-Domain "Connected Azure" Integration Capstone Labs
Located in [`labs/integration-labs/`](./labs/integration-labs/) and interactive inside the web app:
- **[Capstone 01: Zero-Secret Private Data Pipeline](./labs/integration-labs/lab-01-private-data-pipeline.md)** — Ties together *Identity + Networking + Storage + Compute* (VM Managed Identity → Data Plane RBAC → Spoke VNet Peering → Storage Private Endpoint → `privatelink.blob.core.windows.net` Private DNS → `CanNotDelete` Lock).
- **[Capstone 02: Zero-Public-IP High-Availability Web Tier](./labs/integration-labs/lab-02-zero-public-ip-ha-web.md)** — Ties together *Compute + Networking + DNS* (Bicep Deployment → 2 Private Linux VMs in Availability Set → Standard Public Load Balancer + HTTP Probe → 2-Gate Subnet & NIC NSGs → Azure Bastion `/26` → Private DNS Auto-Registration).
- **[Capstone 03: Governed Storefront & Serverless Batch Worker](./labs/integration-labs/lab-03-governed-modern-app-stack.md)** — Ties together *Governance + App Service + Containers + Storage* (Azure Policy + Remediation → App Service Standard S1 + Staging Slot with Slot-Sticky DB setting → ACI `OnFailure` container mounting an Azure File Share).
- **[Capstone 04: Full-Stack Observability, Network Diagnostics & DR](./labs/integration-labs/lab-04-observability-and-dr-drill.md)** — Ties together *Monitor + Backup/ASR + Networking + Compute* (Log Analytics + KQL + Action Group + Maintenance Window Alert Processing Rule → Network Watcher `IP Flow Verify` & `Next Hop` → Same-Region Backup Vault vs Target-Region ASR).

### 4. Practice Studio, Authentic AZ-104 Interactive Formats & 3-Box Leitner Engine (`Practice Studio`)
- **20 P1 Troubleshooting Incidents** across all 5 domains
- **15 Interactive Multi-Part Exam Drills (`Interactive Drills`):**
  - **6 "Order-the-Steps" Sequence Challenges** (Select & order 4 exact steps from a pool with distractors: Availability Set VM recreation, Blob Object Replication, Private Endpoint + DNS across spokes, deleting a Soft-Deleted RSV, Policy `Modify` Remediation, and ASR Failover/Commit/Reprotect/Failback)
  - **6 "Hot-Area" Multi-Dropdown Config Tables & Code Slot-Fillers** (Effective Route Table Longest-Prefix + UDR/BGP/System tie-breaker, Bicep Managed Identity + Data Plane RBAC + Private DNS, App Service Slot Swap matrix, Backup vs ASR Vault region placement, SAS & Lifecycle rules, Custom RBAC JSON)
  - **3 Non-Revertible "Locked Yes/No Scenario Series" (9 Screens)** (Mirrors the real exam format where you evaluate 3 proposed solutions for the same problem and cannot go back once locked)
- **8 "Spot the 2 Bugs" Code & Config Sabotage Hunts** (Bicep, Azure CLI, NSG tables, Custom RBAC JSON)
- **3 Interactive Browser Simulators:** 2-Gate NSG Packet Tracer, RBAC + Lock + Policy Precedence Evaluator, and Azure `-5 IP` Subnet & CIDR Planner
- **2 Multi-Tab Exam Case Studies** & **10 Open-Book 45-Second Microsoft Learn Scavenger Hunts**
- **3-Box Leitner Spaced-Repetition Queue (`Speed Run & Leitner`):** Any missed trap, P1 incident, case study question, sprint checkpoint, or mock exam item enters **Box 1 (0/2 Streak)**, promotes to **Box 2 (1/2 Streak)** on first review, and only graduates to **Box 3 (2/2 Streak)** after two consecutive correct reviews.

### 5. Built-In Timed Exam Simulator (`Timed Exam Simulator`)
- **Three Timed Modes:** **15-Question Timed Boss Sprint (22m 30s)**, **35-Question Full AZ-104 Dress Rehearsal (52m 30s)**, and **12-Question Weakest-Domain Surgical Mock (18m)**.
- **Real Exam Mechanics:** 90-second/question countdown clock, Question Navigator grid with `⚑ Flag for Review`, an **Open-Book MS Learn Lookup Stopwatch** (tracks how many seconds of exam time you spend searching docs), full Scaled Score Report (`300–1000`), and **automatic logging to your Overview Readiness Tracker & Leitner Box 1**.

### 6. High-Yield Decision Matrices with "Blank-Out Active Recall" (`Decision Matrices`)
- **8 Exam Comparison Matrices:** Control vs Data Plane RBAC & Locks, Storage Redundancy & Access Tiers, SAS & Private Endpoints, App Service SKU Tiers & Slot Swap rules, VM SLAs & Containers (ACI vs ACA vs ACR), VNet Peering/Routing/Bastion, Backup vs ASR Vault placement, and Monitor Alerts & Network Watcher tools.
- **1-Click Active Recall Toggle:** Blanks out 45+ critical SKU/limit/rule cells into interactive `? Click to Recall` flash-cells so you test your memory instead of passively skimming tables.

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
