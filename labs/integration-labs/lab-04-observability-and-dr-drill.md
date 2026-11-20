# Integration Lab 04: Full-Stack Observability, Network Diagnostics & Disaster Recovery

**Domains Connected:** Monitor & Maintain (10–15%) • Virtual Networking (15–20%) • Compute (20–25%) • Storage (15–20%)  
**Estimated Time:** 35–45 minutes  
**Official Microsoft Lab References:**
- [Lab 10: Implement Data Protection (Backup & Recovery)](https://microsoftlearning.github.io/AZ-104-MicrosoftAzureAdministrator/Instructions/Labs/LAB_10-Implement_Data_Protection.html)
- [Lab 11: Implement Monitoring](https://microsoftlearning.github.io/AZ-104-MicrosoftAzureAdministrator/Instructions/Labs/LAB_11-Implement_Monitoring.html)

---

## 1. Architecture You Are Building

```
[App VM + Storage Account + Subnet NSG]
   ├── Diagnostic Settings ──> [Log Analytics Workspace (law-northstar)]
   │                               └── Metric & Activity Log Alerts ──> [Action Group: Email Ops]
   │                               └── [Alert Processing Rule: Suppress Sundays 02:00–04:00]
   ├── Network Watcher ──────> [IP Flow Verify (NSG Check) + Next Hop (UDR Blackhole Check)]
   └── Data Protection ──────> [Recovery Services Vault (SAME region for VM/File Backup)]
                               [Target-Region RSV (Secondary region for Azure Site Recovery)]
```

---

## 2. Step-by-Step Azure Portal Guide

1. **Centralize Logs in Log Analytics & Query with KQL:**
   - Create a Log Analytics Workspace `law-northstar` in `rg-northstar-ephemeral`.
   - Open **Monitor** → **Activity log** → **Export Activity Logs** → **+ Add diagnostic setting** → check *Administrative*, *Security*, *Policy* → send to `law-northstar`.
   - Open your Storage Account → **Diagnostic settings** → `blob` → send Read/Write/Delete logs to `law-northstar`.
2. **Wire Alerts, Action Groups & Maintenance Suppression:**
   - In **Monitor** → **Alerts** → **Action groups** → create `ag-northstar-ops` (Email notification).
   - Create an **Alert processing rule**:
     - Scope: `rg-northstar-ephemeral`
     - Rule type: **Suppress notifications**
     - Schedule: Recurring weekly, Sundays `02:00` to `04:00`.
3. **Catch a Planted Network Outage with Network Watcher:**
   - Open **Network Watcher** → **IP flow verify**:
     - Pick `vm-app-01`, Direction: `Outbound`, Protocol: `TCP`, Local port: `50000`, Remote IP: `10.2.1.4`, Remote port: `443`.
     - Observe the exact NSG rule name allowing or denying the packet.
   - Open **Network Watcher** → **Next hop**:
     - Source IP: `10.1.1.4`, Destination IP: `10.2.1.4` → verify whether a custom Route Table (`NextHopType: None`) is blackholing traffic.
4. **Configure Same-Region VM Backup & Test Soft Delete Cleanup:**
   - Create Recovery Services Vault `rsv-northstar-east` in the **same region** as `vm-app-01`.
   - Enable VM Backup using `DefaultPolicy` and trigger an on-demand **Backup now**.
   - Before tearing down the lab: go to Vault **Properties → Security Settings → Disable Soft Delete**, stop backup & delete backup data, then delete the vault.

---

## 3. Automated CLI Deployment (`lab-04-deploy.sh`)

```bash
./labs/integration-labs/lab-04-deploy.sh eastus you@example.com
```
