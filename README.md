# AZ-104 Ops Quest — Project: Northstar Retail

An interactive, anti-boredom study engine for **Microsoft Exam AZ-104 (Azure Administrator Associate)** built 1-to-1 on [Microsoft's Official AZ-104 Study Guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104) *(verified October 30, 2026, targeting post-January 2027)*.

**Live Interactive Study Hub (GitHub Pages):** https://prerakchavda.github.io/az-104-ops-quest/

---

## Why This Works (Instead of 20-Hour Video Marathons)

Instead of passively watching long videos or doing isolated sandbox labs, you spend **20–30 minutes every weekday for 8 weeks** acting as the sole Azure Administrator for one company (**Northstar Retail**) — building, wiring, sabotaging, and defending one connected Azure architecture across **all 81 official Microsoft exam objectives**.

### What's Inside the Live Web App (`index.html`)
1. **Connected Architecture Map:** Interactive topology illuminating how Identity, Governance, Hub/Spoke VNets, Compute, Storage Private Endpoints, Monitor, and Backup Vaults wire together — with CLI/Bicep previews and official Microsoft Learn links.
2. **8-Week Story Episodes:** 40 weekday sprints framed as Slack company crises (*e.g., stopping Marcus from Marketing from spinning up an $800 GPU VM*), linked to runnable `labs/` scripts, a 25-minute timer, XP, and Admin Ranks.
3. **3 Interactive Azure Browser Simulators (Zero Azure Login Needed):**
   - **NSG Packet Tracer:** Test Subnet NSG + NIC NSG + Azure default rules & `AzureLoadBalancer` service tags step-by-step.
   - **RBAC + Lock + Policy Precedence Evaluator:** Watch Control Plane vs Data Plane RBAC, `CanNotDelete`/`ReadOnly` locks, and Azure Policy collide in real time.
   - **Azure `-5 IP` Subnet & CIDR Planner:** Carve subnets with real bitwise math, overlap detection, and `AzureBastionSubnet` `/26` validation.
4. **20 P1 Incidents + 8 "Spot the 2 Bugs" Sabotage Hunts:** Multi-domain troubleshooting tickets plus interactive Bicep/CLI/NSG/JSON code blocks where you click the 2 buggy lines to defuse sabotage.
5. **60-Second Exam Trap Speed Run (36 Traps) + Spaced-Repetition Weakness Radar:** Beat-the-clock arcade drill that tracks domain accuracy and queues every missed trap for automatic rematch review.
6. **Real AZ-104 Exam Lab:** **2 Multi-Tab Exam Case Studies** (with Yes/No Series questions) + **10 Open-Book 45-Second Microsoft Learn Scavenger Hunts** to train real test-day speed.
7. **Official MS Study Guide Blueprint (81/81):** Searchable, checkable 100% coverage matrix mapped directly to Microsoft's official AZ-104 objectives.
8. **Anti-Fall-Off Consistency Engine:** Weekday Streak tracker (weekends never break your streak!), **⚡ 5-Minute Low-Energy Rescue Mode** for exhausted days, Light/Dark theme toggle, and **Export/Import Progress JSON** across devices.

---

## Repository Structure

- [`index.html`](./index.html) + [`js/`](./js/) — Modular zero-build-step interactive study hub (`data-core.js`, `data-drills.js`, `simulators.js`, `app.js`)
- [`labs/`](./labs/) — Runnable Azure Cloud Shell / CLI starter kits, Bicep templates, and Wednesday **"Sabotage Scripts"** (`week-01` through `week-07`)
- [`PLAYBOOK.md`](./PLAYBOOK.md) — Complete 8-week study playbook, 5 engagement game modes, and Azure cost-control rules
- [`MS_STUDY_GUIDE_COVERAGE.md`](./MS_STUDY_GUIDE_COVERAGE.md) — 100% (81/81) official Microsoft Learn AZ-104 objective coverage matrix
- [`scripts/friday-cleanup.sh`](./scripts/friday-cleanup.sh) & [`scripts/friday-cleanup.ps1`](./scripts/friday-cleanup.ps1) — One-command Friday teardown for `rg-northstar-ephemeral` to keep Azure lab spend near **$0–$5/month**

---

## Official Microsoft Sources

- [Official Study Guide for Exam AZ-104 (Skills Measured & Change Log)](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104)
- [Microsoft Certified: Azure Administrator Associate (Exam Hub & New AI Skills Navigator Practice Assessment)](https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/)
- [MicrosoftLearning Official AZ-104 GitHub Labs](https://github.com/MicrosoftLearning/AZ-104-MicrosoftAzureAdministrator)
- [Exam Duration, Open-Book Microsoft Learn Rules & Exam Sandbox](https://learn.microsoft.com/en-us/credentials/support/exam-duration-exam-experience)
