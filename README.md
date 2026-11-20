# AZ-104 Ops Quest — Project: Northstar Retail

An engaging, hands-on study system for **Microsoft Exam AZ-104 (Azure Administrator Associate)** built directly on [Microsoft's Official AZ-104 Study Guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104) *(verified October 30, 2026)*.

Instead of watching multi-hour passive videos or clicking through disconnected labs, you spend **20–30 minutes every weekday for 8 weeks** acting as the Azure Administrator for one fictional company (**Northstar Retail**) — building, wiring together, breaking, and defending one real Azure environment across **all 81 official Microsoft exam objectives**.

---

## Quick Start

### Option A: Open the Interactive Study Hub in Your Browser
- **GitHub Pages (Recommended):** Go to **Settings → Pages → Deploy from branch (`main` / root)** to run `index.html` live from any browser or phone!
- **Locally:** Clone this repo and double-click `index.html`.

### What's Inside the Interactive Hub (`index.html`)
1. **Connected Architecture Map:** Click any piece of Northstar Retail (Entra ID, Policy/Locks, Hub VNet & Bastion, Load Balancer & DNS, App Spoke, Data Spoke + Private Endpoint, Azure Monitor, Recovery/Backup Vaults) to illuminate cross-domain connections, see CLI/Bicep previews, catch exam traps, and jump to official Microsoft Learn docs.
2. **8-Week Story Episodes:** 40 weekday sprints framed as realistic company crises (*e.g., stopping Marcus from Marketing from spinning up an $800 GPU VM*), with a built-in **25-minute sprint timer**, XP bar, Admin Ranks, and persistent progress (`localStorage`).
3. **P1 Incident Queue:** 6 realistic multi-domain troubleshooting tickets with instant post-mortems and Microsoft Learn verification links.
4. **60-Second Exam Trap Speed Run:** Beat-the-clock arcade drill covering 14 classic AZ-104 traps with combo streaks and personal best tracking.
5. **Official MS Study Guide Checklist (81/81):** Every single bullet from Microsoft's official AZ-104 Study Guide — searchable, filterable by domain, checkable, and mapped 1-to-1 to a weekday sprint.

---

## Repository Files

- [`index.html`](./index.html) — Self-contained interactive study hub (dark/light mode, zero build step)
- [`PLAYBOOK.md`](./PLAYBOOK.md) — Weekly rhythm, 5 engagement game modes, official Microsoft source table, and Azure cost-control rules
- [`MS_STUDY_GUIDE_COVERAGE.md`](./MS_STUDY_GUIDE_COVERAGE.md) — Complete 81/81 official Microsoft Learn AZ-104 objective coverage matrix
- [`scripts/friday-cleanup.sh`](./scripts/friday-cleanup.sh) & [`scripts/friday-cleanup.ps1`](./scripts/friday-cleanup.ps1) — One-command Friday teardown for `rg-northstar-ephemeral` to keep Azure lab spend near **$0–$5/month**

---

## Official Microsoft Sources

- [Official Study Guide for Exam AZ-104 (Skills Measured & Change Log)](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104)
- [Microsoft Certified: Azure Administrator Associate (Certification Hub & AI Skills Navigator Practice Assessment)](https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/)
- [MicrosoftLearning Official AZ-104 GitHub Labs](https://github.com/MicrosoftLearning/AZ-104-MicrosoftAzureAdministrator)
- [Exam Duration, Open-Book Microsoft Learn Rules & Exam Sandbox](https://learn.microsoft.com/en-us/credentials/support/exam-duration-exam-experience)
