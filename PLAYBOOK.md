# AZ-104 Ops Quest: The "Northstar Retail" Playbook (Post-Jan 2027)

> [!IMPORTANT]
> **Verified directly against Microsoft's official AZ-104 Study Guide** (last updated **October 30, 2026**). No structural blueprint overhaul has been announced for early 2027 yet—but because you're targeting **after January 2027**, your Day-0 step is a 1-minute glance at the official [Study Guide Change Log](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104#change-log) before you schedule the exam.

---

## 1. Official Microsoft Sources (Bookmark These to Go Back Anytime)

Every sprint and trap in this plan maps directly to these official Microsoft pages:

| Resource | Official Link | When You Use It |
| :--- | :--- | :--- |
| **Official AZ-104 Study Guide** | [Study Guide & Skills Measured](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104) | Master exam checklist + Change Log check after January |
| **Certification Hub + NEW Practice Assessment** | [AZ-104 Certification Page](https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/) | Launch the upgraded **AI Skills Navigator Practice Assessment** (replaces legacy Learn PA!) |
| **Official Microsoft Hands-On Lab Repo** | [MicrosoftLearning/AZ-104 GitHub](https://github.com/MicrosoftLearning/AZ-104-MicrosoftAzureAdministrator) | Reference ARM/Bicep templates & official lab tasks when you want extra reps |
| **Open-Book Exam Rules & Sandbox** | [Exam Duration & Experience](https://learn.microsoft.com/en-us/credentials/support/exam-duration-exam-experience) | Practice the real exam UI & built-in Microsoft Learn lookup rules |

### Official Learning Paths by Domain (For Quick Lookups—Not Passive Reading!)
- **Prerequisites:** [AZ-104: Prerequisites for Azure administrators](https://learn.microsoft.com/en-us/training/paths/az-104-administrator-prerequisites/)
- **Domain 1 (20–25%):** [AZ-104: Manage identities and governance in Azure](https://learn.microsoft.com/en-us/training/paths/az-104-manage-identities-governance/)
- **Domain 2 (15–20%):** [AZ-104: Implement and manage storage in Azure](https://learn.microsoft.com/en-us/training/paths/az-104-manage-storage/)
- **Domain 3 (20–25%):** [AZ-104: Deploy and manage Azure compute resources](https://learn.microsoft.com/en-us/training/paths/az-104-manage-compute-resources/)
- **Domain 4 (15–20%):** [AZ-104: Configure and manage virtual networks](https://learn.microsoft.com/en-us/training/paths/az-104-manage-virtual-networks/)
- **Domain 5 (10–15%):** [AZ-104: Monitor and back up Azure resources](https://learn.microsoft.com/en-us/training/paths/az-104-monitor-backup-resources/)

---

## 2. How We Make This Actually Engaging (5 Game Modes)

Standard studying fails because passive reading/watching gives your brain zero stakes and zero dopamine. Instead, we rotate **5 active modes** across your 20–30 minute weekday sprints:

1. **Episode Roleplay ("Incoming Slack Crisis"):** Every week opens with a messy, realistic company disaster at Northstar Retail (e.g., *Marcus from Marketing spun up an $800 GPU VM in Japan East and deleted a staging RG*). You aren't "reading about Policy"—you're fixing Marcus's mess.
2. **Try → Break → Aha! (Flip the Order):** Never watch a 45-minute lecture first. You build/break a piece in 15 minutes, hit the exact confusing Azure quirk (like *"Why did Private Endpoint still give me 403?!"*), and *then* a 60-second explanation + official Microsoft doc link locks it into long-term memory.
3. **Sabotage / Bug Hunt Mode:** I hand you a broken 15-line Bicep file, NSG table, or CLI command with **2 hidden bugs**—you play detective and spot them in 3 minutes.
4. **60-Second Exam Trap Speed Run:** Built right into Tab 4 of [`index.html`](./index.html)—race a 60-second clock, build combo streaks, level up your Admin Rank, and click directly into the Microsoft Learn proof.
5. **Open-Book Scavenger Hunt & "Explain to the CTO":** Because AZ-104 lets you open Microsoft Learn *during the live exam*, we race a 45-second timer to find sneaky SKU tables in official docs—plus I roleplay a skeptical manager asking *"Why can't we just paste the storage key in the app?"* and you defend your architecture in 2 sentences.

---

## 3. The Mon–Fri 25-Minute Rhythm

| Day | Mode | What You Do |
| :--- | :--- | :--- |
| **Mon** | **Blueprint** | Read the week's Slack Crisis → build the core resource in Azure |
| **Tue** | **Connect** | Wire Monday's resource into *previous* weeks' infrastructure |
| **Wed** | **Incident** | Break it on purpose (or play a live P1 Ticket / Sabotage Bug Hunt with me) |
| **Thu** | **IaC & Traps** | Inspect the CLI/Bicep equivalent + run 1 round of the 60s Trap Speed Run |
| **Fri** | **Boss + Clean** | 10-question mixed Boss Fight + delete `rg-northstar-ephemeral` to keep costs near $0 |

---

## 4. Exam-Weighted 8-Week Arc (Aligned to Official Microsoft Objectives)

| Week | Northstar Episode | Official Domain & Weight | Official MS Learn Link |
| :---: | :--- | :--- | :--- |
| **1** | Stop Marcus From Burning the Company Card (Entra ID, SSPR, RBAC, Policy, Locks, $10 Budget) | Identities & Governance (**20–25%**) | [Identities & Governance](https://learn.microsoft.com/en-us/training/paths/az-104-manage-identities-governance/) |
| **2** | Wire Hub-and-Spoke Without Loops (VNets, CIDR, Non-Transitive Peering, NSGs/ASGs, UDRs) | Virtual Networking Pt 1 (**15–20%**) | [Virtual Networks](https://learn.microsoft.com/en-us/training/paths/az-104-manage-virtual-networks/) |
| **3** | Seal the Data Vault (Blob Tiers, Lifecycle, Object Rep, Azure Files, SAS vs Policy, Private Endpoint + DNS) | Storage (**15–20%**) | [Azure Storage](https://learn.microsoft.com/en-us/training/paths/az-104-manage-storage/) |
| **4** | Automate Compute & Kill Hardcoded Secrets (ARM/Bicep, VMs, Disks/ADE, VMSS, Managed Identity) | Compute Pt 1 (**20–25%**) | [Azure Compute](https://learn.microsoft.com/en-us/training/paths/az-104-manage-compute-resources/) |
| **5** | Zero-Downtime Storefront & Containers (App Service Slots/TLS/VNet, ACR, ACI, ACA) | Compute Pt 2 (**20–25%**) | [Azure Compute](https://learn.microsoft.com/en-us/training/paths/az-104-manage-compute-resources/) |
| **6** | Traffic Control & Zero Public IPs (Internal/Public Standard LB, Probes, Azure DNS, Bastion) | Virtual Networking Pt 2 (**15–20%**) | [Virtual Networks](https://learn.microsoft.com/en-us/training/paths/az-104-manage-virtual-networks/) |
| **7** | Catch Outages in 30s & Survive Region Failure (Monitor Insights, Alert Processing Rules, Network Watcher, RSV & Backup Vault, ASR) | Monitor & Maintain (**10–15%**) | [Monitor & Back Up](https://learn.microsoft.com/en-us/training/paths/az-104-monitor-backup-resources/) |
| **8** | Final Boss War Room & Open-Book Mastery (Post-Jan Change Log check, AI Skills Navigator PA, Exam Sandbox) | **All 5 Domains** | [AZ-104 Cert Page](https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/) |

---

## 5. Azure Cost-Control Rules (Keep It Under $5/Month)

> [!WARNING]
> **Delete these the same day you test them:** **Azure Bastion** (~$0.19/hr), **Standard Load Balancers**, and **running VMs/VMSS**. Put all hourly resources inside `rg-northstar-ephemeral` and keep free/penny resources (VNets, Policies, tiny LRS Storage) in `rg-northstar-core`.

Every Friday, run one command to wipe all hourly billing:
```bash
az group delete --name rg-northstar-ephemeral --yes --no-wait
```

---

## 6. Prompts to Drop Into Chat Whenever You Sit Down

- **`"Drop today's Slack Crisis (Week X Day Y)"`** — I'll start your 20-min sprint in story mode with exact steps + official doc links.
- **`"Sabotage me on [Networking / Storage / Bicep]"`** — I'll give you a broken config with 2 hidden AZ-104 bugs to hunt down.
- **`"Open-book race!"`** — I'll ask a sneaky SKU/limit question and time how fast you find it on Microsoft Learn.
- **`"Be a skeptical CTO on [topic]"`** — You defend your Azure design choice in 2 sentences and I score you.
