# Northstar Retail — Runnable Azure Lab Kits & "Sabotage" Scripts

Every week has two tiny, low-cost scripts designed to run directly in **Azure Cloud Shell (Bash)** or your local terminal (`az login`):
1. **`setup*.sh` / `main.bicep`** — Spins up Monday/Tuesday's Northstar Retail resources cleanly (using `Standard_B1s` Linux VMs and LRS storage to stay near **$0–$5/month**).
2. **`sabotage*.sh` / `sabotage.bicep`** — Deliberately breaks your live lab environment on **Wednesday** without telling you what it changed, turning AZ-104 troubleshooting into a real detective mission!

## Cost-Safety Pattern (Always Followed Here)
- **`rg-northstar-core`** — Free/penny resources (VNets, NSGs, Route Tables, tiny LRS Storage, Policies).
- **`rg-northstar-ephemeral`** — Hourly resources (VMs, Public IPs, Load Balancers, Bastion, App Services, Vaults). Wipe every Friday with:
  ```bash
  ./scripts/friday-cleanup.sh
  ```

## Week-by-Week Lab Map
| Week | Folder | Setup Script | Wednesday Sabotage Mystery |
| :---: | :--- | :--- | :--- |
| **1** | [`week-01-governance/`](./week-01-governance/) | `setup.sh` (Core/Ephemeral RGs + $10 Budget) | `sabotage-lock.sh` (Owner delete + Storage key lock trap) |
| **2** | [`week-02-networking/`](./week-02-networking/) | `setup-hub-spoke.sh` (Hub + App/Data VNets + Peerings + B1s VMs) | `sabotage-network.sh` (Conflicting NSG + UDR blackhole!) |
| **3** | [`week-03-storage/`](./week-03-storage/) | `setup-storage.sh` (StorageV2 + Blob + Files + Private Endpoint) | `sabotage-storage.sh` (403 Private DNS link mystery!) |
| **4** | [`week-04-compute/`](./week-04-compute/) | `main.bicep` (Bicep VM + Managed Identity) | `sabotage.bicep` (3 hidden Bicep/Azure bugs to debug!) |
| **5** | [`week-05-apps-containers/`](./week-05-apps-containers/) | `setup-app-aci.sh` (App Service + Slot + ACI) | `sabotage-slot.sh` (Sticky setting swap + ACI restart loop) |
| **6** | [`week-06-lb-bastion/`](./week-06-lb-bastion/) | `setup-lb.sh` (Standard Public LB + 2 nginx VMs) | `sabotage-probe.sh` (Kills LB health probe via NSG priority!) |
| **7** | [`week-07-monitor-backup/`](./week-07-monitor-backup/) | `setup-monitor.sh` (Log Analytics + Alerts + Maintenance Rule) | `sabotage-backup.sh` (Wrong-region RSV backup mystery!) |
