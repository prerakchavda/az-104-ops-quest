// =============================================================================
// AZ-104 OPS QUEST — CORE DATA (Map Nodes, 8-Week Episodes, 81 MS Objectives)
// Verified against Microsoft's Official AZ-104 Study Guide (Oct 30, 2026)
// =============================================================================

window.AZ104_CORE = {
  NODES: {
    entra: {
      title: "Entra ID, RBAC & Managed Identities",
      domain: "Manage Azure Identities & Governance (20–25%)",
      week: "Week 1 (Expanded in Wk 3 & 4)",
      colorVar: "--chart-1",
      msUrl: "https://learn.microsoft.com/en-us/training/paths/az-104-manage-identities-governance/",
      msLabel: "MS Learn: Identities & Governance Path",
      role: "Controls WHO (users, groups, licenses, external guests, SSPR) and WHAT (VMs/App Services) can touch Northstar resources — without pasting storage keys into code.",
      connectsTo: ["governance", "compute", "storage"],
      whyItConnects: [
        "Compute → Storage: Your App VM uses a System-Assigned Managed Identity with 'Storage Blob Data Contributor' so it reads blobs with zero secrets.",
        "Governance: RBAC flows down from Management Group → Subscription → Resource Group → Resource (additive permissions!).",
        "Storage trap: Having 'Contributor' on a Storage Account does NOT grant access to read/write blobs via Entra ID — you need a Data Plane role."
      ],
      snippet: "az role assignment create --assignee <vm-principal-id> \\\n  --role \"Storage Blob Data Contributor\" \\\n  --scope <storage-account-id>",
      examTrap: "Control Plane (Owner/Contributor) vs Data Plane (Storage Blob Data Contributor). Also know Dynamic Groups (requires Entra ID P1) and SSPR authentication methods."
    },
    governance: {
      title: "Azure Policy, Resource Locks & Cost Budgets",
      domain: "Manage Azure Identities & Governance (20–25%)",
      week: "Week 1",
      colorVar: "--chart-1",
      msUrl: "https://learn.microsoft.com/en-us/training/paths/az-104-manage-identities-governance/",
      msLabel: "MS Learn: Azure Policy & Governance",
      role: "Guardrails that stop Marcus from Marketing from burning $800 on GPU VMs: restrict regions, enforce tags, lock shared infra, review Azure Advisor, and alert at $5/$10 spend.",
      connectsTo: ["entra", "compute", "storage", "monitor"],
      whyItConnects: [
        "Overrides RBAC: Even a Subscription Owner CANNOT delete a resource with a CanNotDelete lock until they remove the lock first.",
        "ReadOnly Lock quirk: A ReadOnly lock on a Storage Account blocks listing access keys (because listing keys is a POST operation!).",
        "Azure Policy evaluates at create/update and logs compliance events into Activity Logs."
      ],
      snippet: "az lock create --name lock-rg-data --lock-type CanNotDelete \\\n  --resource-group rg-northstar-core",
      examTrap: "Resource Locks override Owners! Azure Policy 'Deny' blocks new deployments, whereas 'Modify' / 'DeployIfNotExists' requires a Remediation Task + Managed Identity for existing resources."
    },
    ingress: {
      title: "Azure Load Balancer & Azure DNS",
      domain: "Implement & Manage Virtual Networking (15–20%)",
      week: "Week 6",
      colorVar: "--chart-2",
      msUrl: "https://learn.microsoft.com/en-us/training/paths/az-104-manage-virtual-networks/",
      msLabel: "MS Learn: Virtual Networking Path",
      role: "The resilient Layer-4 front door (Internal or Public Standard Load Balancer) + Public/Private Azure DNS zones routing customers and internal apps cleanly.",
      connectsTo: ["bastion", "compute", "monitor"],
      whyItConnects: [
        "Ingress → Compute: Health probes check your App Spoke VMs/VMSS. If your NSG blocks the 'AzureLoadBalancer' service tag, probes fail and traffic drops to 0%!",
        "SKU alignment: Standard Load Balancer requires Standard Public IPs and explicit NSG rules (closed by default).",
        "DNS: Private DNS Zones auto-register internal VM names across linked VNets (`northstar.internal`)."
      ],
      snippet: "az network lb probe create -g rg-northstar-ephemeral \\\n  --lb-name lb-northstar -n probe-http --protocol Http --port 80 --path /",
      examTrap: "Standard LB requires Standard SKU Public IPs and is secure-by-default (NSG must explicitly allow inbound traffic + AzureLoadBalancer health probes)."
    },
    bastion: {
      title: "Hub VNet, Peering, UDRs & Azure Bastion",
      domain: "Implement & Manage Virtual Networking (15–20%)",
      week: "Week 2 & Week 6",
      colorVar: "--chart-2",
      msUrl: "https://learn.microsoft.com/en-us/training/paths/az-104-manage-virtual-networks/",
      msLabel: "MS Learn: Peering, UDRs & Bastion",
      role: "The central transit hub (10.0.0.0/16) peered to App and Data spokes. Azure Bastion gives browser-based RDP/SSH into private VMs with zero Public IPs.",
      connectsTo: ["ingress", "compute", "storage", "monitor"],
      whyItConnects: [
        "NON-TRANSITIVE PEERING: App Spoke peered to Hub + Data Spoke peered to Hub does NOT let App talk to Data! You need direct peering OR a Hub firewall/NVA + UDRs.",
        "Bastion requires a subnet named EXACTLY `AzureBastionSubnet` (minimum `/26`).",
        "Peering requires non-overlapping CIDR ranges across all peered VNets."
      ],
      snippet: "az network vnet peering create -g rg-northstar-core -n hub-to-app \\\n  --vnet-name vnet-hub --remote-vnet vnet-app --allow-vnet-access",
      examTrap: "VNet peering is NEVER transitive by default, and must be created on BOTH VNets to reach 'Connected' status. Remember Azure reserves 5 IPs per subnet."
    },
    compute: {
      title: "App Spoke: Bicep VMs, VMSS, App Service & Containers",
      domain: "Deploy & Manage Azure Compute Resources (20–25%)",
      week: "Week 4 & Week 5",
      colorVar: "--chart-3",
      msUrl: "https://learn.microsoft.com/en-us/training/paths/az-104-manage-compute-resources/",
      msLabel: "MS Learn: Compute Resources Path",
      role: "Where Northstar's workloads run (10.1.0.0/16): ARM/Bicep VMs, VMSS, App Service (slots/TLS/VNet/backup), plus ACR, Azure Container Instances (ACI), and Container Apps (ACA).",
      connectsTo: ["entra", "governance", "ingress", "bastion", "storage", "monitor", "backup"],
      whyItConnects: [
        "NSGs apply TWICE: Inbound traffic must pass Subnet NSG AND NIC NSG. Outbound passes NIC NSG AND Subnet NSG.",
        "Compute → Storage: App Service uses Regional VNet Integration to hit the Private Endpoint in Data Spoke.",
        "Compute → Backup & Monitor: VMs enroll in Recovery Services Vault and ship telemetry via Azure Monitor Agent (AMA)."
      ],
      snippet: "az deployment group create -g rg-northstar-ephemeral \\\n  --template-file labs/week-04-compute/main.bicep --parameters vmSize=Standard_B1s",
      examTrap: "Availability Sets (single datacenter, FD/UD) vs Availability Zones (separate datacenters, 99.99% SLA). Deployment slots & custom TLS require Standard App Service Plan+."
    },
    storage: {
      title: "Data Spoke: Storage Account, Private Endpoint & DNS",
      domain: "Implement & Manage Storage (15–20%)",
      week: "Week 3",
      colorVar: "--chart-4",
      msUrl: "https://learn.microsoft.com/en-us/training/paths/az-104-manage-storage/",
      msLabel: "MS Learn: Implement & Manage Storage Path",
      role: "Holds product images (Blob tiers, versioning, lifecycle, object replication) and finance shares (Azure Files + snapshots + Entra auth), sealed behind Private Endpoint.",
      connectsTo: ["entra", "governance", "bastion", "compute", "backup"],
      whyItConnects: [
        "Service Endpoint keeps public IP but restricts traffic to Azure backbone; Private Endpoint assigns a real private IP (10.2.1.4) inside your subnet!",
        "Without a Private DNS Zone (`privatelink.blob.core.windows.net`) linked to `vnet-app`, your VM resolves the public IP and gets 403 Firewall Blocked!",
        "To revoke a Service SAS before expiry without rotating keys, tie it to a Stored Access Policy."
      ],
      snippet: "az storage account update -g rg-northstar-core -n stnorthstar01 \\\n  --public-network-access Disabled",
      examTrap: "Archive blobs are OFFLINE (must rehydrate before reading). Object Replication requires Blob Versioning + Change Feed enabled on source and Versioning on destination."
    },
    monitor: {
      title: "Azure Monitor, Insights & Network Watcher",
      domain: "Monitor & Maintain Azure Resources (10–15%)",
      week: "Week 7",
      colorVar: "--chart-5",
      msUrl: "https://learn.microsoft.com/en-us/training/paths/az-104-monitor-backup-resources/",
      msLabel: "MS Learn: Monitor & Back Up Path",
      role: "Central Log Analytics Workspace + Metrics + Insights + Alert Rules / Action Groups / Alert Processing Rules + Network Watcher (IP Flow Verify, Next Hop, Connection Monitor).",
      connectsTo: ["governance", "ingress", "bastion", "compute"],
      whyItConnects: [
        "Diagnostic Settings route platform logs (Storage, NSG, Activity Log) into Log Analytics for KQL queries.",
        "Alert Processing Rules let you suppress alerts during planned maintenance windows (without disabling every alert rule!).",
        "Network Watcher IP Flow Verify tells you in 5 seconds *which exact NSG rule* dropped a packet."
      ],
      snippet: "az network watcher test-ip-flow --direction Outbound --protocol TCP \\\n  --local 10.1.1.4:50000 --remote 10.2.1.4:443 --vm vm-app-01 -g rg-northstar-ephemeral",
      examTrap: "Know Metric vs Log (KQL) vs Activity Log alerts, AND remember Alert Processing Rules suppress notifications during maintenance windows!"
    },
    backup: {
      title: "Recovery Services Vault & Azure Backup Vault",
      domain: "Monitor & Maintain Azure Resources (10–15%)",
      week: "Week 7",
      colorVar: "--chart-5",
      msUrl: "https://learn.microsoft.com/en-us/training/paths/az-104-monitor-backup-resources/",
      msLabel: "MS Learn: Backup & Site Recovery Docs",
      role: "Protects VMs & File Shares (Recovery Services Vault), Managed Disks & Blobs (Azure Backup Vault), Soft Delete ransomware defense, and Site Recovery (ASR) failover.",
      connectsTo: ["compute", "storage"],
      whyItConnects: [
        "Recovery Services Vault handles VMs, Azure Files, and Azure Site Recovery (ASR). Azure Backup Vault handles Azure Blobs and Managed Disks!",
        "Region rule: Azure Backup Vault/RSV must be in the SAME region as the protected resource. For ASR (DR), the RSV must be in the TARGET secondary region!",
        "Soft delete protects backups for 14 days even after deletion."
      ],
      snippet: "az backup protection enable-for-vm -g rg-northstar-ephemeral \\\n  --vault-name rsv-northstar --vm vm-app-01 --policy-name DefaultPolicy",
      examTrap: "Backup = Vault in SAME region. Site Recovery (ASR) = Vault in TARGET region. Also know Recovery Services Vault (VMs/Files/ASR) vs Azure Backup Vault (Disks/Blobs)!"
    }
  },

  EDGES: [
    ["entra", "governance"], ["entra", "compute"], ["entra", "storage"],
    ["governance", "compute"], ["governance", "storage"],
    ["ingress", "bastion"], ["ingress", "compute"],
    ["bastion", "compute"], ["bastion", "storage"],
    ["compute", "storage"], ["compute", "monitor"], ["compute", "backup"],
    ["storage", "backup"], ["bastion", "monitor"], ["ingress", "monitor"]
  ],

  DOMAINS: [
    { id: "identity", label: "Identity & Gov", weight: "20–25%", color: "var(--chart-1)" },
    { id: "networking", label: "Virtual Networking", weight: "15–20%", color: "var(--chart-2)" },
    { id: "storage", label: "Storage", weight: "15–20%", color: "var(--chart-4)" },
    { id: "compute", label: "Compute", weight: "20–25%", color: "var(--chart-3)" },
    { id: "monitor", label: "Monitor & Backup", weight: "10–15%", color: "var(--chart-5)" }
  ],

  WEEKS: [
    {
      num: 1,
      title: "Ep 1: Stop Marcus From Burning the Company Card",
      domain: "identity",
      weight: "20–25%",
      labFolder: "labs/week-01-governance/",
      msPathUrl: "https://learn.microsoft.com/en-us/training/paths/az-104-manage-identities-governance/",
      msPathTitle: "MS Learn: Identities & Governance",
      story: "SLACK ALERT (CTO): \"Welcome to Northstar! Marcus from Marketing just spun up an $800 GPU VM in Japan East and deleted a staging resource group. Lock this tenant down with RBAC, Policy, Locks, and a $10 budget before Friday.\"",
      sprints: [
        { id: "w1d1", day: "Mon", tag: "Blueprint", text: "Run labs/week-01-governance/setup.sh to create rg-northstar-core + rg-northstar-ephemeral and a $10 Cost Budget. Create 2 Entra ID users + 1 group, check Licenses, External Users, and SSPR." },
        { id: "w1d2", day: "Tue", tag: "Connect", text: "Assign Reader at RG scope and Contributor on one resource; verify Effective Access + test how Management Group → Sub → RG → Resource inheritance stacks." },
        { id: "w1d3", day: "Wed", tag: "Incident", text: "Run labs/week-01-governance/sabotage-lock.sh — then diagnose why even Owner cannot delete a resource or list Storage keys! Practice in the RBAC+Lock Simulator." },
        { id: "w1d4", day: "Thu", tag: "IaC & Traps", text: "Assign Azure Policy 'Allowed locations' (2 regions) + 'Require a tag on resources'. Inspect Custom RBAC JSON (`Actions`, `NotActions`, `DataActions`) and Management Groups." },
        { id: "w1d5", day: "Fri", tag: "Boss + Clean", text: "Review Azure Advisor Cost recommendations, run 1 round of the 60s Speed Run, and verify $0 spend in Cost Analysis." }
      ]
    },
    {
      num: 2,
      title: "Ep 2: Wire the Hub-and-Spoke Network Without Loops",
      domain: "networking",
      weight: "15–20%",
      labFolder: "labs/week-02-networking/",
      msPathUrl: "https://learn.microsoft.com/en-us/training/paths/az-104-manage-virtual-networks/",
      msPathTitle: "MS Learn: Virtual Networks",
      story: "SLACK ALERT (Dev Lead): \"Our app servers and database servers are sitting in one flat subnet with zero firewall rules. Split them into Hub, App, and Data VNets—and figure out why App still can't ping Data!\"",
      sprints: [
        { id: "w2d1", day: "Mon", tag: "Blueprint", text: "Plan CIDRs in Tab 3's Subnet Planner (remember -5 Azure reserved IPs!), then run labs/week-02-networking/setup-hub-spoke.sh for vnet-hub, vnet-app, and vnet-data." },
        { id: "w2d2", day: "Tue", tag: "Connect", text: "Peer Hub ↔ App and Hub ↔ Data. Test ping/TCP between your 2 tiny B1s VMs to witness firsthand that VNet peering is NON-TRANSITIVE." },
        { id: "w2d3", day: "Wed", tag: "Incident", text: "Run labs/week-02-networking/sabotage-network.sh! Use Effective Security Rules + Effective Routes (and Tab 3's NSG Packet Tracer) to diagnose the mystery outage." },
        { id: "w2d4", day: "Thu", tag: "IaC & Traps", text: "Replace raw IPs with Application Security Groups (asg-web, asg-db). Add a User-Defined Route (UDR) table and trace longest-prefix-match routing." },
        { id: "w2d5", day: "Fri", tag: "Boss + Clean", text: "Solve 3 Networking P1 Tickets in Tab 4 + run scripts/friday-cleanup.sh to delete rg-northstar-ephemeral (VNets stay in core for $0!)." }
      ]
    },
    {
      num: 3,
      title: "Ep 3: Seal the Data Vault Off the Public Internet",
      domain: "storage",
      weight: "15–20%",
      labFolder: "labs/week-03-storage/",
      msPathUrl: "https://learn.microsoft.com/en-us/training/paths/az-104-manage-storage/",
      msPathTitle: "MS Learn: Azure Storage",
      story: "SLACK ALERT (Security): \"Compliance audit hit! Product images and finance files are exposed on public storage endpoints using shared keys. Lock public access off, wire a Private Endpoint, and automate archival tiers.\"",
      sprints: [
        { id: "w3d1", day: "Mon", tag: "Blueprint", text: "Run labs/week-03-storage/setup-storage.sh (StorageV2 LRS, 'products' container, 'finance' File Share + snapshots/soft delete). Upload files with AzCopy or Storage Explorer." },
        { id: "w3d2", day: "Tue", tag: "Connect", text: "Compare Service Endpoints vs Private Endpoints. Disable Public Network Access, attach a Private Endpoint in vnet-data + Private DNS Zone linked to vnet-app." },
        { id: "w3d3", day: "Wed", tag: "Incident", text: "Run labs/week-03-storage/sabotage-storage.sh to trigger a real 403 DNS mystery! Also rotate Access Keys, test Stored Access Policy SAS revocation, and test Data Plane RBAC." },
        { id: "w3d4", day: "Thu", tag: "IaC & Traps", text: "Configure Blob Lifecycle Management (Hot→Cool→Archive), Blob Versioning, Storage Encryption (MMK vs CMK), Object Replication prerequisites, Redundancy, and Azure Files Entra auth." },
        { id: "w3d5", day: "Fri", tag: "Boss + Clean", text: "Solve the Storage P1 Tickets + delete temporary Private Endpoint if idle over weekend (~$0.01/hr)." }
      ]
    },
    {
      num: 4,
      title: "Ep 4: Automate Compute & Kill Hardcoded Secrets",
      domain: "compute",
      weight: "20–25%",
      labFolder: "labs/week-04-compute/",
      msPathUrl: "https://learn.microsoft.com/en-us/training/paths/az-104-manage-compute-resources/",
      msPathTitle: "MS Learn: Azure Compute",
      story: "SLACK ALERT (Ops): \"Stop hand-clicking VMs in the portal! Write a repeatable Bicep template, make our app servers auto-scale for promos, and let them talk to Storage with ZERO passwords.\"",
      sprints: [
        { id: "w4d1", day: "Mon", tag: "Blueprint", text: "Inspect labs/week-04-compute/main.bicep, modify a parameter, deploy vm-app-01 via CLI, and practice exporting an ARM template + converting ARM → Bicep (`az bicep decompile`)." },
        { id: "w4d2", day: "Tue", tag: "Connect", text: "Use vm-app-01's System-Assigned Managed Identity + `Storage Blob Data Contributor` to run `az login --identity` and upload a blob with zero access keys." },
        { id: "w4d3", day: "Wed", tag: "Incident", text: "Debug labs/week-04-compute/sabotage.bicep (3 hidden bugs!). Then attach a Managed Data Disk, resize VM, review Azure Disk Encryption, and check VM move rules across RG/Sub/Region." },
        { id: "w4d4", day: "Thu", tag: "IaC & Traps", text: "Deploy a VM Scale Set (VMSS) with CPU autoscale rules. Drill Availability Sets (FD/UD) vs Availability Zones (99.99% SLA)." },
        { id: "w4d5", day: "Fri", tag: "Boss + Clean", text: "Play 2 Bicep Bug Hunts in Tab 4 + run scripts/friday-cleanup.sh to delete VMs/VMSS (saves 95% of your bill!)." }
      ]
    },
    {
      num: 5,
      title: "Ep 5: Zero-Downtime Storefront & Containers",
      domain: "compute",
      weight: "20–25%",
      labFolder: "labs/week-05-apps-containers/",
      msPathUrl: "https://learn.microsoft.com/en-us/training/paths/az-104-manage-compute-resources/",
      msPathTitle: "MS Learn: App Service & Containers",
      story: "SLACK ALERT (Product): \"Last Friday's deploy broke checkout for 40 minutes. Move the storefront to App Service with zero-downtime staging swaps, and spin up background workers in containers!\"",
      sprints: [
        { id: "w5d1", day: "Mon", tag: "Blueprint", text: "Run labs/week-05-apps-containers/setup-app-aci.sh. Inspect App Service Plan scaling, TLS certificates, Custom DNS mapping, and App Service Backup tier requirements." },
        { id: "w5d2", day: "Tue", tag: "Connect", text: "Add a 'staging' Deployment Slot, mark a setting slot-sticky, swap to production, and inspect Regional VNet Integration for talking to Data Spoke." },
        { id: "w5d3", day: "Wed", tag: "Incident", text: "Run labs/week-05-apps-containers/sabotage-slot.sh! Also create an Azure Container Registry (ACR) + deploy Azure Container Instance (ACI) with Azure File Share mount." },
        { id: "w5d4", day: "Thu", tag: "IaC & Traps", text: "Deploy a tiny container to Azure Container Apps (ACA) with HTTP ingress + scaling rules. Drill the ACI vs ACA vs App Service exam decision table." },
        { id: "w5d5", day: "Fri", tag: "Boss + Clean", text: "Complete Case Study #1 in Tab 6 + run scripts/friday-cleanup.sh to wipe paid App Service plans, ACR, and containers." }
      ]
    },
    {
      num: 6,
      title: "Ep 6: Traffic Control & Zero Public IPs on VMs",
      domain: "networking",
      weight: "15–20%",
      labFolder: "labs/week-06-lb-bastion/",
      msPathUrl: "https://learn.microsoft.com/en-us/training/paths/az-104-manage-virtual-networks/",
      msPathTitle: "MS Learn: Load Balancing & DNS",
      story: "SLACK ALERT (SecOps): \"A port scanner just hammered our VM public IP! Strip every Public IP off our VMs, put a Standard Load Balancer in front, and set up Azure Bastion for browser-only admin access.\"",
      sprints: [
        { id: "w6d1", day: "Mon", tag: "Blueprint", text: "Run labs/week-06-lb-bastion/setup-lb.sh to deploy a Standard Public IP + Standard Load Balancer (backend pool, HTTP probe, LB rule) across 2 tiny nginx VMs." },
        { id: "w6d2", day: "Tue", tag: "Connect", text: "Stop nginx on VM1 and verify LB shifts 100% traffic to VM2. Compare Public vs Internal Load Balancer and outbound SNAT rules." },
        { id: "w6d3", day: "Wed", tag: "Incident", text: "Run labs/week-06-lb-bastion/sabotage-probe.sh to kill the LB health probes and fix it! Also test Azure Bastion in `AzureBastionSubnet` (/26) with zero VM Public IPs." },
        { id: "w6d4", day: "Thu", tag: "IaC & Traps", text: "Configure Public DNS vs Private DNS Zone (`northstar.internal`) with VNet auto-registration. Practice LB troubleshooting scenarios." },
        { id: "w6d5", day: "Fri", tag: "Boss + Clean", text: "Run Tab 4's Networking Bug Hunts + IMMEDIATELY run scripts/friday-cleanup.sh (Bastion is ~$0.19/hr if left running!)." }
      ]
    },
    {
      num: 7,
      title: "Ep 7: Catch Outages in 30 Seconds & Survive Region Failure",
      domain: "monitor",
      weight: "10–15%",
      labFolder: "labs/week-07-monitor-backup/",
      msPathUrl: "https://learn.microsoft.com/en-us/training/paths/az-104-monitor-backup-resources/",
      msPathTitle: "MS Learn: Monitor & Back Up",
      story: "SLACK ALERT (VP of Eng): \"An outage lasted 2 hours last night because nobody got paged—and someone deleted a file share! Set up Monitor Insights, Alert Processing Rules, Network Watcher, and Backup Vaults.\"",
      sprints: [
        { id: "w7d1", day: "Mon", tag: "Blueprint", text: "Run labs/week-07-monitor-backup/setup-monitor.sh (Log Analytics Workspace + Diagnostic Settings + Insights) and run 3 basic KQL queries." },
        { id: "w7d2", day: "Tue", tag: "Connect", text: "Test Action Group, Metric Alert (CPU > 80%), Activity Log Alert (Lock deleted), and an Alert Processing Rule suppressing alerts during a maintenance window." },
        { id: "w7d3", day: "Wed", tag: "Incident", text: "Use Network Watcher (IP Flow Verify, Next Hop, Connection Monitor) to catch a deliberately planted UDR blackhole and NSG deny rule." },
        { id: "w7d4", day: "Thu", tag: "IaC & Traps", text: "Run labs/week-07-monitor-backup/sabotage-backup.sh to see the region-mismatch vault trap! Compare Recovery Services Vault vs Azure Backup Vault, backup policies, restore, and ASR failover." },
        { id: "w7d5", day: "Fri", tag: "Boss + Clean", text: "Review Backup Reports & Alerts + disable Soft Delete on lab vaults before running scripts/friday-cleanup.sh." }
      ]
    },
    {
      num: 8,
      title: "Ep 8: Final Boss — P1 War Room & Open-Book Exam Mastery",
      domain: "compute",
      weight: "All 5 Domains",
      labFolder: "scripts/",
      msPathUrl: "https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/",
      msPathTitle: "MS Learn: Practice Assessment & Exam",
      story: "SLACK ALERT (Board): \"Black Friday simulation! Combine all 5 domains under exam pressure, train 45-second Microsoft Learn open-book lookups, and crush Microsoft's new AI Skills Navigator Practice Assessment.\"",
      sprints: [
        { id: "w8d1", day: "Mon", tag: "Blueprint", text: "Post-Jan Blueprint Check: verify Microsoft's Study Guide Change Log, then finish BOTH multi-tab Case Studies in Tab 6." },
        { id: "w8d2", day: "Tue", tag: "Connect", text: "Run all 10 Open-Book 45-Second Microsoft Learn Scavenger Hunts in Tab 6 so you can find any SKU/limit table mid-exam without panicking." },
        { id: "w8d3", day: "Wed", tag: "Incident", text: "Take Microsoft's NEW official AZ-104 Practice Assessment on AI Skills Navigator + tour the official Exam Sandbox UI." },
        { id: "w8d4", day: "Thu", tag: "IaC & Traps", text: "Clear your Missed-Trap Review queue in Tab 5 to 0 remaining traps + verify all 81/81 objectives in Tab 7." },
        { id: "w8d5", day: "Fri", tag: "Boss + Clean", text: "Full timed mock (100 min pace) targeting 80%+. Tear down both rg-northstar-ephemeral and rg-northstar-core & schedule your AZ-104 exam!" }
      ]
    }
  ],

  MS_BLUEPRINT: [
    {
      domain: "Manage Azure identities and governance (20–25%)",
      id: "identity",
      color: "var(--chart-1)",
      url: "https://learn.microsoft.com/en-us/training/paths/az-104-manage-identities-governance/",
      groups: [
        {
          name: "Manage Microsoft Entra users and groups",
          items: [
            ["Create users and groups", "W1 Mon"],
            ["Manage user and group properties", "W1 Mon"],
            ["Manage licenses in Microsoft Entra ID", "W1 Mon"],
            ["Manage external users", "W1 Mon"],
            ["Configure self-service password reset (SSPR)", "W1 Mon"]
          ]
        },
        {
          name: "Manage access to Azure resources",
          items: [
            ["Manage built-in Azure roles", "W1 Tue"],
            ["Assign roles at different scopes", "W1 Tue"],
            ["Interpret access assignments", "W1 Tue"]
          ]
        },
        {
          name: "Manage Azure subscriptions and governance",
          items: [
            ["Implement and manage Azure Policy", "W1 Thu"],
            ["Configure resource locks", "W1 Wed"],
            ["Apply and manage tags on resources", "W1 Thu"],
            ["Manage resource groups", "W1 Mon"],
            ["Manage subscriptions", "W1 Tue"],
            ["Manage costs by using alerts, budgets, and Azure Advisor recommendations", "W1 Mon & Fri"],
            ["Configure management groups", "W1 Thu"]
          ]
        }
      ]
    },
    {
      domain: "Implement and manage storage (15–20%)",
      id: "storage",
      color: "var(--chart-4)",
      url: "https://learn.microsoft.com/en-us/training/paths/az-104-manage-storage/",
      groups: [
        {
          name: "Configure access to storage",
          items: [
            ["Configure Azure Storage firewalls and virtual networks", "W3 Tue"],
            ["Create and use shared access signature (SAS) tokens", "W3 Wed"],
            ["Configure stored access policies", "W3 Wed"],
            ["Manage access keys", "W3 Wed"],
            ["Configure identity-based access for Azure Files", "W3 Thu"]
          ]
        },
        {
          name: "Configure and manage storage accounts",
          items: [
            ["Create and configure storage accounts", "W3 Mon"],
            ["Configure Azure Storage redundancy", "W3 Thu"],
            ["Configure object replication", "W3 Thu"],
            ["Configure storage account encryption", "W3 Thu"],
            ["Manage data by using Azure Storage Explorer and AzCopy", "W3 Mon"]
          ]
        },
        {
          name: "Configure Azure Files and Azure Blob Storage",
          items: [
            ["Create and configure a file share in Azure Storage", "W3 Mon"],
            ["Create and configure a container in Blob Storage", "W3 Mon"],
            ["Configure storage tiers", "W3 Thu"],
            ["Configure snapshots and soft delete for Azure Files", "W3 Mon"],
            ["Configure blob lifecycle management", "W3 Thu"],
            ["Configure blob versioning", "W3 Thu"]
          ]
        }
      ]
    },
    {
      domain: "Deploy and manage Azure compute resources (20–25%)",
      id: "compute",
      color: "var(--chart-3)",
      url: "https://learn.microsoft.com/en-us/training/paths/az-104-manage-compute-resources/",
      groups: [
        {
          name: "Automate deployment by using ARM templates or Bicep files",
          items: [
            ["Interpret an ARM template or a Bicep file", "W4 Mon"],
            ["Modify an existing ARM template", "W4 Mon"],
            ["Modify an existing Bicep file", "W4 Mon"],
            ["Deploy resources by using an ARM template or a Bicep file", "W4 Mon"],
            ["Export a deployment as an ARM template or convert an ARM template to a Bicep file", "W4 Mon"]
          ]
        },
        {
          name: "Create and configure virtual machines",
          items: [
            ["Create a virtual machine", "W4 Mon"],
            ["Configure Azure Disk Encryption", "W4 Wed"],
            ["Move a virtual machine to another resource group, subscription, or region", "W4 Wed"],
            ["Manage virtual machine sizes", "W4 Wed"],
            ["Manage virtual machine disks", "W4 Wed"],
            ["Deploy virtual machines to availability zones and availability sets", "W4 Thu"],
            ["Deploy and configure an Azure Virtual Machine Scale Sets", "W4 Thu"]
          ]
        },
        {
          name: "Provision and manage containers in the Azure portal",
          items: [
            ["Create and manage an Azure container registry", "W5 Wed"],
            ["Provision a container by using Azure Container Instances", "W5 Wed"],
            ["Provision a container by using Azure Container Apps", "W5 Thu"],
            ["Manage sizing and scaling for containers, including ACI and ACA", "W5 Thu"]
          ]
        },
        {
          name: "Create and configure Azure App Service",
          items: [
            ["Provision an App Service plan", "W5 Mon"],
            ["Configure scaling for an App Service plan", "W5 Mon"],
            ["Create an App Service", "W5 Mon"],
            ["Configure certificates and TLS for an App Service", "W5 Mon"],
            ["Map an existing custom DNS name to an App Service", "W5 Mon"],
            ["Configure backup for an App Service", "W5 Mon"],
            ["Configure networking settings for an App Service", "W5 Tue"],
            ["Configure deployment slots for an App Service", "W5 Tue"]
          ]
        }
      ]
    },
    {
      domain: "Implement and manage virtual networking (15–20%)",
      id: "networking",
      color: "var(--chart-2)",
      url: "https://learn.microsoft.com/en-us/training/paths/az-104-manage-virtual-networks/",
      groups: [
        {
          name: "Configure and manage virtual networks in Azure",
          items: [
            ["Create and configure virtual networks and subnets", "W2 Mon"],
            ["Create and configure virtual network peering", "W2 Tue"],
            ["Configure public IP addresses", "W6 Mon"],
            ["Configure user-defined network routes", "W2 Thu"],
            ["Troubleshoot network connectivity", "W2 Wed & W7 Wed"]
          ]
        },
        {
          name: "Configure secure access to virtual networks",
          items: [
            ["Create and configure NSGs and application security groups (ASGs)", "W2 Wed & Thu"],
            ["Evaluate effective security rules in NSGs", "W2 Wed"],
            ["Implement Azure Bastion", "W6 Wed"],
            ["Configure service endpoints for Azure PaaS", "W3 Tue"],
            ["Configure private endpoints for Azure PaaS", "W3 Tue"]
          ]
        },
        {
          name: "Configure name resolution and load balancing",
          items: [
            ["Configure Azure DNS", "W6 Thu"],
            ["Configure an internal or public load balancer", "W6 Mon & Tue"],
            ["Troubleshoot load balancing", "W6 Wed & Thu"]
          ]
        }
      ]
    },
    {
      domain: "Monitor and maintain Azure resources (10–15%)",
      id: "monitor",
      color: "var(--chart-5)",
      url: "https://learn.microsoft.com/en-us/training/paths/az-104-monitor-backup-resources/",
      groups: [
        {
          name: "Monitor resources in Azure",
          items: [
            ["Interpret metrics in Azure Monitor", "W7 Mon & Tue"],
            ["Configure log settings in Azure Monitor", "W7 Mon"],
            ["Query and analyze logs in Azure Monitor", "W7 Mon"],
            ["Set up alert rules, action groups, and alert processing rules in Azure Monitor", "W7 Tue"],
            ["Configure and interpret monitoring of VMs, storage accounts, and networks by using Azure Monitor Insights", "W7 Mon"],
            ["Use Azure Network Watcher and Connection Monitor", "W7 Wed"]
          ]
        },
        {
          name: "Implement backup and recovery",
          items: [
            ["Create a Recovery Services vault", "W7 Thu"],
            ["Create an Azure Backup vault", "W7 Thu"],
            ["Create and configure a backup policy", "W7 Thu"],
            ["Perform backup and restore operations by using Azure Backup", "W7 Thu"],
            ["Configure Azure Site Recovery for Azure resources", "W7 Thu"],
            ["Perform a failover to a secondary region by using Site Recovery", "W7 Thu"],
            ["Configure and interpret reports and alerts for backups", "W7 Fri"]
          ]
        }
      ]
    }
  ]
};
