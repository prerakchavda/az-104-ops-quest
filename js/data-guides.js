// =============================================================================
// AZ-104 OPS QUEST — STEP-BY-STEP GUIDES, 14 OFFICIAL MS LABS,
// 4 MULTI-DOMAIN INTEGRATION CAPSTONES, 21-DAY BLITZ & BLUEPRINT <-> LAB SYNC
// =============================================================================

window.AZ104_GUIDES = (function () {
  const MS_LAB_BASE = "https://microsoftlearning.github.io/AZ-104-MicrosoftAzureAdministrator/Instructions/Labs/";

  const OFFICIAL_MS_LABS = {
    lab01:  { code: "LAB 01",  title: "Manage Microsoft Entra ID Identities", domain: "identity",   url: MS_LAB_BASE + "LAB_01-Manage_Entra_ID_Identities.html" },
    lab02a: { code: "LAB 02a", title: "Manage Subscriptions and RBAC",        domain: "identity",   url: MS_LAB_BASE + "LAB_02a_Manage_Subscriptions_and_RBAC_Entra.html" },
    lab02b: { code: "LAB 02b", title: "Manage Governance via Azure Policy",   domain: "identity",   url: MS_LAB_BASE + "LAB_02b-Manage_Governance_via_Azure_Policy.html" },
    lab03b: { code: "LAB 03b", title: "Manage Azure Resources Using ARM/Bicep", domain: "compute",  url: MS_LAB_BASE + "LAB_03b-Manage_Azure_Resources_by_Using_ARM_Templates.html" },
    lab04:  { code: "LAB 04",  title: "Implement Virtual Networking",         domain: "networking", url: MS_LAB_BASE + "LAB_04-Implement_Virtual_Networking.html" },
    lab05:  { code: "LAB 05",  title: "Implement Intersite Connectivity",     domain: "networking", url: MS_LAB_BASE + "LAB_05-Implement_Intersite_Connectivity.html" },
    lab06:  { code: "LAB 06",  title: "Implement Network Traffic Management", domain: "networking", url: MS_LAB_BASE + "LAB_06-Implement_Network_Traffic_Management.html" },
    lab07:  { code: "LAB 07",  title: "Manage Azure Storage",                 domain: "storage",    url: MS_LAB_BASE + "LAB_07-Manage_Azure_Storage.html" },
    lab08:  { code: "LAB 08",  title: "Manage Virtual Machines",              domain: "compute",    url: MS_LAB_BASE + "LAB_08-Manage_Virtual_Machines.html" },
    lab09a: { code: "LAB 09a", title: "Implement Web Apps",                   domain: "compute",    url: MS_LAB_BASE + "LAB_09a-Implement_Web_Apps.html" },
    lab09b: { code: "LAB 09b", title: "Implement Azure Container Instances",  domain: "compute",    url: MS_LAB_BASE + "LAB_09b-Implement_Azure_Container_Instances.html" },
    lab09c: { code: "LAB 09c", title: "Implement Azure Container Apps",       domain: "compute",    url: MS_LAB_BASE + "LAB_09c-Implement-Azure-Container-Apps.html" },
    lab10:  { code: "LAB 10",  title: "Implement Data Protection (Backup/ASR)", domain: "monitor",  url: MS_LAB_BASE + "LAB_10-Implement_Data_Protection.html" },
    lab11:  { code: "LAB 11",  title: "Implement Monitoring",                 domain: "monitor",    url: MS_LAB_BASE + "LAB_11-Implement_Monitoring.html" }
  };

  // ---------------------------------------------------------------------------
  // 4 MULTI-DOMAIN INTEGRATION CAPSTONE LABS
  // ---------------------------------------------------------------------------
  const INTEGRATION_LABS = [
    {
      id: "int1",
      code: "CAPSTONE 01",
      title: "Zero-Secret Private Data Pipeline",
      subtitle: "Wire a Linux VM in App Spoke to read/write Blob Storage in Data Spoke over a Private Endpoint using Managed Identity — with zero storage keys and public access disabled.",
      domains: ["identity", "networking", "storage", "compute"],
      domainLabels: ["Identity & RBAC", "VNet Peering & Private DNS", "Storage Private Endpoint", "VM Managed Identity"],
      coversSprints: ["w1d2", "w1d3", "w2d2", "w3d1", "w3d2", "w4d2"],
      estTime: "40 min",
      repoFile: "labs/integration-labs/lab-01-private-data-pipeline.md",
      repoScript: "labs/integration-labs/lab-01-deploy.sh",
      msLabs: ["lab02a", "lab05", "lab07"],
      architecture: "vm-app-01 (System Managed Identity) ──> Private DNS (privatelink.blob.core.windows.net -> 10.2.1.4) ──> Direct Spoke VNet Peering (10.1.0.0/16 <-> 10.2.0.0/16) ──> Private Endpoint (vnet-data) ──> stnorthstar (Public Access Disabled + CanNotDelete Lock)",
      portalSteps: [
        "Portal → Virtual networks → create `vnet-app` (10.1.0.0/16, subnet `snet-app` 10.1.1.0/24) and `vnet-data` (10.2.0.0/16, subnet `snet-data` 10.2.1.0/24) in `rg-northstar-core`.",
        "Open `vnet-app` → Peerings → + Add → peer directly to `vnet-data` (enable 'Allow virtual network access' on both sides). Confirm status is Connected.",
        "Portal → Storage accounts → create `stnorthstar<xxxx>` (Standard_LRS, StorageV2) → create container `orders` → Networking → set Public network access to Disable.",
        "Storage Account → Networking → Private endpoint connections → + Private endpoint (`pe-northstar-blob`, sub-resource `blob`, placed in `vnet-data/snet-data`, integrate with `privatelink.blob.core.windows.net`).",
        "Portal → Private DNS zones → open `privatelink.blob.core.windows.net` → Virtual network links → + Add → link `vnet-app` so VMs in App Spoke resolve the private IP 10.2.1.4!",
        "Deploy `vm-app-01` (Standard_B1s, no public IP) in `vnet-app/snet-app` → Identity → System assigned = On. Then on Storage Account → Access Control (IAM) → assign `Storage Blob Data Contributor` to `vm-app-01`."
      ],
      cliCommands: `# Run the automated multi-domain deployment in Azure Cloud Shell:
./labs/integration-labs/lab-01-deploy.sh eastus

# Or run the core wiring commands directly:
az storage account update -g rg-northstar-core -n $ST_NAME --public-network-access Disabled
az network private-dns link vnet create -g rg-northstar-core -n link-vnet-app \\
  -z privatelink.blob.core.windows.net -v vnet-app -e false
az role assignment create --assignee $VM_PRINCIPAL_ID \\
  --role "Storage Blob Data Contributor" --scope $ST_ID`,
      verifySteps: [
        "On `vm-app-01` (via Run Command → RunShellScript), run `nslookup <storage>.blob.core.windows.net` and confirm it returns `10.2.1.4` (NOT a `52.x.x.x` public IP).",
        "Run `az login --identity` followed by `az storage blob upload -c orders -n test.txt -f test.txt --account-name <storage> --auth-mode login` — confirm upload succeeds with zero keys.",
        "Deliberate Break Test: Delete the `link-vnet-app` DNS link and re-run `nslookup` — watch DNS revert to the public IP and fail with `403 AuthorizationFailure`."
      ]
    },
    {
      id: "int2",
      code: "CAPSTONE 02",
      title: "Zero-Public-IP High-Availability Web Tier",
      subtitle: "Deploy 2 private nginx VMs in an Availability Set behind a Standard Public Load Balancer using Bicep, protected by 2-gate Subnet & NIC NSGs and managed via Azure Bastion.",
      domains: ["compute", "networking", "identity"],
      domainLabels: ["Bicep & Availability Set", "Standard LB & Health Probes", "2-Gate NSGs & Bastion /26", "Private DNS Auto-Reg"],
      coversSprints: ["w2d1", "w2d3", "w4d1", "w4d4", "w6d1", "w6d2", "w6d3", "w6d4"],
      estTime: "40 min",
      repoFile: "labs/integration-labs/lab-02-zero-public-ip-ha-web.md",
      repoScript: "labs/integration-labs/lab-02-deploy.bicep",
      msLabs: ["lab03b", "lab06", "lab08"],
      architecture: "Internet (TCP 80) ──> Standard Public Load Balancer (HTTP Probe /) ──> Gate 1: Subnet NSG (Allow 80 + Allow AzureLoadBalancer) ──> Gate 2: NIC NSG ──> vm-web-01 & vm-web-02 (No Public IPs, Availability Set 2FD/5UD, Private DNS northstar.internal)",
      portalSteps: [
        "Deploy `labs/integration-labs/lab-02-deploy.bicep` into `rg-northstar-ephemeral` (provisions `vnet-ha`, `snet-web`, `AzureBastionSubnet` /26, `nsg-snet-web`, `avset-web`, 2 nginx VMs, Standard LB, and `northstar.internal` Private DNS).",
        "Open `lb-northstar-ha` → Backend pools (`be-web`) and Health probes (`probe-http`, TCP/HTTP port 80, path `/`) → confirm both VMs show Healthy.",
        "Open `northstar.internal` Private DNS Zone → verify `vm-web-01` and `vm-web-02` auto-registered their `10.30.1.x` A records automatically.",
        "Deliberate Break Test: In `nsg-snet-web`, add an Inbound Deny rule at Priority `105` (`Source: Any, Port: *`) above Priority `110` (`AllowHealthProbes`) — watch the LB health probe drop to 0%.",
        "Fix the priority so `AzureLoadBalancer` sits at Priority `101` (above any custom Deny rule) and confirm traffic recovers."
      ],
      cliCommands: `az group create -n rg-northstar-ephemeral -l eastus
az deployment group create -g rg-northstar-ephemeral \\
  --template-file labs/integration-labs/lab-02-deploy.bicep \\
  --parameters adminPassword='<StrongPass123!>'

# Test round-robin load balancing across vm-web-01 and vm-web-02:
LB_IP=$(az network public-ip show -g rg-northstar-ephemeral -n pip-lb-ha --query ipAddress -o tsv)
curl http://$LB_IP`,
      verifySteps: [
        "Run `curl http://$LB_IP` multiple times and verify responses alternate between `vm-web-01` and `vm-web-02`.",
        "Confirm neither `vm-web-01` nor `vm-web-02` has a Public IP assigned.",
        "Run `./scripts/friday-cleanup.sh` right after finishing so Standard LB / Bastion do not bill overnight."
      ]
    },
    {
      id: "int3",
      code: "CAPSTONE 03",
      title: "Governed Storefront & Serverless Batch Worker",
      subtitle: "Enforce tag governance via Azure Policy, run a zero-downtime App Service staging slot swap with slot-sticky database settings, and mount an Azure File Share into an OnFailure ACI container.",
      domains: ["identity", "compute", "storage"],
      domainLabels: ["Azure Policy & Remediation", "App Service Slots & Sticky Config", "ACI OnFailure Batch Container", "Azure Files SMB Volume"],
      coversSprints: ["w1d4", "w5d1", "w5d2", "w5d3", "w5d4"],
      estTime: "35 min",
      repoFile: "labs/integration-labs/lab-03-governed-modern-app-stack.md",
      repoScript: "labs/integration-labs/lab-03-deploy.sh",
      msLabs: ["lab02b", "lab09a", "lab09b", "lab09c"],
      architecture: "Azure Policy (Require/Modify Tag 'Env=Prod') ──> [1] App Service Plan (Standard S1): Production Slot <-> Staging Slot (DB_CONN marked Slot-Sticky)  [2] ACI Container (restartPolicy: OnFailure) ──(SMB Mount)──> Azure File Share ('batchlogs')",
      portalSteps: [
        "Portal → Policy → Assignments → Assign policy on `rg-northstar-ephemeral`: assign 'Require a tag on resources' (`Env`) or 'Add a tag to resources' (`Modify` effect + Remediation Task).",
        "Portal → Storage accounts → create `stbatch<xxxx>` → File shares → + File share `batchlogs`.",
        "Portal → Container instances → create `aci-batch-worker` with Restart policy = `On failure` and mount `batchlogs` to `/mnt/batchlogs`.",
        "Portal → App Services → create Web App on **Standard S1** plan → Deployment slots → + Add Slot `staging`.",
        "In Environment variables on BOTH slots, add `DB_CONN` (`prod-db` on production, `staging-db` on staging) and check **Deployment slot setting** (slot-sticky).",
        "Swap `staging` → `production` and verify `DB_CONN` on production did NOT get overwritten by `staging-db`!"
      ],
      cliCommands: `./labs/integration-labs/lab-03-deploy.sh eastus

# Verify slot-sticky setting survives a production swap:
az webapp deployment slot swap -g rg-northstar-ephemeral -n $APP_NAME \\
  --slot staging --target-slot production
az webapp config appsettings list -g rg-northstar-ephemeral -n $APP_NAME -o table`,
      verifySteps: [
        "Check `az storage file list --share-name batchlogs --account-name <storage>` and confirm `job-report.txt` was written by the ACI container.",
        "Confirm `aci-batch-worker` state is `Succeeded` / `Terminated (Exit Code 0)` and is NOT restarting in an infinite loop.",
        "Confirm `DB_CONN` on the production App Service slot still points to `prod-db.northstar.internal` after the swap."
      ]
    },
    {
      id: "int4",
      code: "CAPSTONE 04",
      title: "Full-Stack Observability, Network Diagnostics & DR",
      subtitle: "Centralize platform logs into Log Analytics, configure Action Groups + Maintenance Alert Processing Rules, pinpoint a UDR blackhole with Network Watcher, and test Same-Region Backup vs Target-Region ASR.",
      domains: ["monitor", "networking", "compute", "storage"],
      domainLabels: ["Log Analytics, KQL & Alerts", "Alert Processing Rules", "Network Watcher IP Flow & Next Hop", "Recovery & Backup Vaults"],
      coversSprints: ["w2d4", "w7d1", "w7d2", "w7d3", "w7d4", "w7d5"],
      estTime: "40 min",
      repoFile: "labs/integration-labs/lab-04-observability-and-dr-drill.md",
      repoScript: "labs/integration-labs/lab-04-deploy.sh",
      msLabs: ["lab10", "lab11"],
      architecture: "VM + Storage + NSG ──(Diagnostic Settings)──> Log Analytics Workspace (KQL + Metric Alerts) ──> Action Group + Alert Processing Rule (Sunday 02:00-04:00 Suppression) | Network Watcher (IP Flow Verify + Next Hop) | Recovery Services Vault (Same-Region Backup + Soft Delete)",
      portalSteps: [
        "Portal → Log Analytics workspaces → create `law-northstar` in `rg-northstar-ephemeral`.",
        "Portal → Monitor → Activity log → Export Activity Logs → + Add diagnostic setting → send Administrative & Policy logs to `law-northstar`.",
        "Portal → Monitor → Alerts → Action groups → create `ag-northstar-ops` (Email). Then open **Alert processing rules** → + Create → suppress notifications on `rg-northstar-ephemeral` every Sunday 02:00–04:00.",
        "Portal → Network Watcher → **IP flow verify** (test TCP 443 from `vm-app-01` to `10.2.1.4` to see exact NSG rule match) and **Next hop** (verify whether a custom UDR is blackholing `10.2.1.0/24`).",
        "Portal → Recovery Services vaults → create `rsv-northstar-backup` in the **same region** as your VM → enable VM Backup (`DefaultPolicy`).",
        "Teardown Drill: Go to Vault Properties → Security Settings → disable Soft Delete → Stop backup & delete backup data → delete the vault."
      ],
      cliCommands: `./labs/integration-labs/lab-04-deploy.sh eastus you@example.com

# Test Network Watcher Next Hop & IP Flow Verify from CLI:
az network watcher show-next-hop -g rg-northstar-ephemeral --vm vm-app-01 \\
  --source-ip 10.1.1.4 --dest-ip 10.2.1.4 -o table`,
      verifySteps: [
        "Run a KQL query in `law-northstar` (`AzureActivity | take 10`) and verify Activity Log events appear.",
        "Confirm your Alert Processing Rule shows status `Enabled` with recurring Sunday schedule.",
        "Successfully delete `rsv-northstar-backup` after disabling Soft Delete and purging protected items."
      ]
    }
  ];

  // ---------------------------------------------------------------------------
  // DETAILED STEP-BY-STEP GUIDES FOR EACH WEEKLY TOPIC GROUP
  // ---------------------------------------------------------------------------
  const TOPIC_GUIDES = {
    w1_identities: {
      title: "Entra ID Users, Groups, Dynamic Membership, Guests & SSPR",
      msLabs: ["lab01"],
      repoScript: "labs/week-01-governance/setup.sh",
      docLinks: [
        { label: "Manage Entra Users & Groups", url: "https://learn.microsoft.com/en-us/entra/fundamentals/how-to-create-delete-users" },
        { label: "Dynamic Group Rules (Entra P1)", url: "https://learn.microsoft.com/en-us/entra/identity/users/groups-dynamic-membership" },
        { label: "Self-Service Password Reset (SSPR)", url: "https://learn.microsoft.com/en-us/entra/identity/authentication/tutorial-enable-sspr" }
      ],
      portalSteps: [
        "Open Azure Portal → **Microsoft Entra ID** → **Users** → **+ New user** → create `marcus@<your-domain>` (Department: `Marketing`, Usage location: `United States`).",
        "Click **+ New user** → **Invite external user** → test B2B guest invitation workflow and inspect **External Identities → External collaboration settings** (who can invite guests).",
        "Go to **Groups** → **New group** → Security group `grp-marketing`. Inspect **Membership type**: `Assigned` (Entra Free) vs `Dynamic User` (requires Entra ID P1 license, rule syntax: `user.department -eq \"Marketing\"`).",
        "Go to **Password reset (SSPR)** → **Properties** → set Self-service password reset enabled = **Selected** (pick `grp-marketing`) or **All** → check **Authentication methods** (1 vs 2 required methods to reset)."
      ],
      cliCommands: `# Create cost-safe Resource Groups & $10 Monthly Budget:
./labs/week-01-governance/setup.sh eastus you@example.com

# Create an Entra ID user & security group via Azure CLI:
DOMAIN=$(az rest --method get --url https://graph.microsoft.com/v1.0/domains --query 'value[?isDefault].id' -o tsv)
az ad user create --display-name "Marcus Marketing" --password "TempPass#2027!" \\
  --user-principal-name "marcus@\${DOMAIN}"
az ad group create --display-name "grp-northstar-ops" --mail-nickname "grp-northstar-ops"`,
      verifySteps: [
        "Confirm `rg-northstar-core` and `rg-northstar-ephemeral` exist (`az group list -o table`).",
        "Know for the exam: Bulk user creation uses a **CSV file** (`UserPrincipalName`, `DisplayName`, `InitialPassword`, `BlockSignIn`), and licensing requires setting **Usage location** first!"
      ]
    },
    w1_rbac_locks: {
      title: "RBAC Scopes, Custom Roles, Resource Locks & Cost Guardrails",
      msLabs: ["lab02a"],
      repoScript: "labs/week-01-governance/sabotage-lock.sh",
      docLinks: [
        { label: "Built-in Azure RBAC Roles", url: "https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles" },
        { label: "Custom RBAC Role JSON Structure", url: "https://learn.microsoft.com/en-us/azure/role-based-access-control/custom-roles" },
        { label: "Lock Resources (CanNotDelete vs ReadOnly)", url: "https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/lock-resources" }
      ],
      portalSteps: [
        "Open `rg-northstar-core` → **Access control (IAM)** → **+ Add role assignment** → assign `Reader` to `grp-northstar-ops`.",
        "Open **Access control (IAM)** → **Check access** (or View my access) → inspect how permissions inherit additively from **Management Group → Subscription → Resource Group → Resource**.",
        "Open `rg-northstar-core` → **Locks** → **+ Add** → add a `Delete` (`CanNotDelete`) lock. Then run `labs/week-01-governance/sabotage-lock.sh` to see how a `ReadOnly` lock on a Storage Account blocks `listKeys` (POST action)!",
        "Open **Cost Management + Billing** → **Budgets** (verify your $10 budget) and **Advisor** → **Cost** recommendations."
      ],
      cliCommands: `# Trigger the Week 1 Resource Lock + Storage Key Sabotage Mystery:
./labs/week-01-governance/sabotage-lock.sh eastus

# List and remove a lock once you diagnose it:
az lock list -g rg-northstar-ephemeral -o table
az lock delete --name lock-mystery-ro -g rg-northstar-ephemeral --resource-name <st-name> --resource-type Microsoft.Storage/storageAccounts`,
      verifySteps: [
        "Verify you understand why **Owner** is still blocked by a `CanNotDelete` lock until Owner deletes the lock first.",
        "Test the **RBAC + Lock + Policy Simulator** in Practice Studio to confirm Control Plane (`Contributor`) vs Data Plane (`Storage Blob Data Contributor`) vs `User Access Administrator`."
      ]
    },
    w1_policy: {
      title: "Azure Policy, Remediation Tasks, Tags & Management Groups",
      msLabs: ["lab02b"],
      repoScript: "labs/week-01-governance/setup.sh",
      docLinks: [
        { label: "Azure Policy Effects (Deny, Audit, Modify, DINE)", url: "https://learn.microsoft.com/en-us/azure/governance/policy/concepts/effect-basics" },
        { label: "Remediate Non-Compliant Resources", url: "https://learn.microsoft.com/en-us/azure/governance/policy/how-to/remediate-resources" },
        { label: "Management Groups Hierarchy (6 levels max)", url: "https://learn.microsoft.com/en-us/azure/governance/management-groups/overview" }
      ],
      portalSteps: [
        "Portal → **Policy** → **Definitions** → search `Allowed locations` and `Require a tag on resources`.",
        "Click **Assign policy** scoped to `rg-northstar-ephemeral`: assign **Require a tag on resources** (`Tag Name: Env`, effect: `Deny`).",
        "Try creating a test Public IP inside `rg-northstar-ephemeral` WITHOUT the `Env` tag — watch Azure Resource Manager block deployment at validation.",
        "Assign **Inherit a tag from the resource group if missing** (`Modify` effect) — notice Azure automatically creates a **Managed Identity** and requires a **Remediation task** to fix *already-existing* resources."
      ],
      cliCommands: `# View policy assignments and compliance state on rg-northstar-ephemeral:
az policy assignment list -g rg-northstar-ephemeral -o table
az policy state summarize -g rg-northstar-ephemeral`,
      verifySteps: [
        "Confirm you know the difference between **Azure Policy** (restricts *what* resources/SKUs/regions can be created, even by Owners) and **RBAC** (controls *who* can perform actions).",
        "Remember: Tags applied to a Resource Group do **not** inherit to child resources automatically — you must use an Azure Policy (`Modify` effect) to inherit tags!"
      ]
    },
    w2_vnets_peering: {
      title: "VNets, -5 IP Subnet Math & Non-Transitive Hub-Spoke Peering",
      msLabs: ["lab04", "lab05"],
      repoScript: "labs/week-02-networking/setup-hub-spoke.sh",
      docLinks: [
        { label: "Virtual Network Overview & -5 Reserved IPs", url: "https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-faq" },
        { label: "VNet Peering (Non-Transitive & Gateway Transit)", url: "https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-peering-overview" }
      ],
      portalSteps: [
        "First open **Practice Studio → Simulators → Azure -5 IP Subnet Planner** and carve `10.0.0.0/16` into `snet-app`, `snet-data`, `AzureBastionSubnet` (`/26`), and `GatewaySubnet` (`/27`).",
        "Run `labs/week-02-networking/setup-hub-spoke.sh` (or create in Portal): `vnet-hub` (`10.0.0.0/16`), `vnet-app` (`10.1.0.0/16`), and `vnet-data` (`10.2.0.0/16`) in `rg-northstar-core`.",
        "In `vnet-hub` → **Peerings** → verify bidirectional peerings `hub <-> app` and `hub <-> data` show status **Connected**.",
        "Inspect the 4 peering checkboxes for the exam: *Allow virtual network access*, *Allow forwarded traffic* (needed when routing via a Hub NVA/Firewall), *Allow gateway transit* (on Hub), and *Use remote gateways* (on Spoke)."
      ],
      cliCommands: `# Build Hub + App Spoke + Data Spoke + Bidirectional Peerings:
./labs/week-02-networking/setup-hub-spoke.sh eastus

# Verify peering state on vnet-hub:
az network vnet peering list -g rg-northstar-core --vnet-name vnet-hub -o table`,
      verifySteps: [
        "Confirm you can explain why `vnet-app` CANNOT talk to `vnet-data` even though both are peered to `vnet-hub` (peering is **non-transitive**!).",
        "Know the two fixes for spoke-to-spoke traffic: (1) Direct spoke peering `vnet-app <-> vnet-data`, OR (2) Hub NVA/Azure Firewall + User-Defined Routes (`0.0.0.0/0` or `10.2.0.0/16` → Virtual Appliance) + *Allow forwarded traffic*."
      ]
    },
    w2_nsg_udr: {
      title: "2-Gate NSGs (Subnet vs NIC), ASGs & User-Defined Routes (UDRs)",
      msLabs: ["lab04", "lab05"],
      repoScript: "labs/week-02-networking/sabotage-network.sh",
      docLinks: [
        { label: "How NSGs Filter Traffic (Subnet + NIC)", url: "https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview" },
        { label: "Application Security Groups (ASGs)", url: "https://learn.microsoft.com/en-us/azure/virtual-network/application-security-groups" },
        { label: "User-Defined Routes & Longest Prefix Match", url: "https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-udr-overview" }
      ],
      portalSteps: [
        "Run `labs/week-02-networking/sabotage-network.sh` to inject a conflicting NSG priority rule and a UDR blackhole onto `vnet-app/snet-app`.",
        "In Portal → open `nsg-app-subnet` → **Inbound security rules** → notice Priority `150` (`MysteryBlock` Deny) sits above Priority `200` (`AllowHTTP`)! Delete `MysteryBlock` or change `AllowHTTP` to Priority `100`.",
        "Open **Route tables** → `rt-app-mystery` → **Routes** → inspect `BlackholeData` (`10.2.1.0/24` → Next hop type: `None`, which silently drops packets!). Change Next hop or disassociate the route table.",
        "Create an **Application security group** (`asg-web`) and reference `asg-web` as the Destination in an NSG rule instead of hardcoding VM IP addresses."
      ],
      cliCommands: `# Inject the Wednesday NSG + UDR Outage Mystery:
./labs/week-02-networking/sabotage-network.sh

# Fix the NSG rule priority & remove the blackhole route from CLI:
az network nsg rule delete -g rg-northstar-core --nsg-name nsg-app-subnet -n MysteryBlock
az network route-table route delete -g rg-northstar-core --route-table-name rt-app-mystery -n BlackholeData`,
      verifySteps: [
        "Open **Practice Studio → Simulators → NSG Packet Tracer** and test Inbound (`Subnet NSG → NIC NSG`) vs Outbound (`NIC NSG → Subnet NSG`).",
        "Memorize Azure route selection precedence: **1. Longest Prefix Match** (`/24` beats `/16`) → on an exact prefix tie: **2. UDR > 3. BGP > 4. System route**."
      ]
    },
    w3_storage_core: {
      title: "Storage Accounts, Redundancy, Blob Tiers, Lifecycle & Object Rep",
      msLabs: ["lab07"],
      repoScript: "labs/week-03-storage/setup-storage.sh",
      docLinks: [
        { label: "Azure Storage Redundancy (LRS, ZRS, GRS, GZRS)", url: "https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy" },
        { label: "Blob Access Tiers & Archive Rehydration", url: "https://learn.microsoft.com/en-us/azure/storage/blobs/access-tiers-overview" },
        { label: "Blob Lifecycle Management & Object Replication", url: "https://learn.microsoft.com/en-us/azure/storage/blobs/lifecycle-management-overview" }
      ],
      portalSteps: [
        "Run `labs/week-03-storage/setup-storage.sh` to create `stnorthstar<xxxx>` (`StorageV2`, `Standard_LRS`), blob container `products`, and Azure File Share `finance`.",
        "Open your Storage Account → **Data management → Lifecycle management** → **+ Add a rule**: if base blobs weren't modified for `30` days → move to **Cool**; `90` days → move to **Cold**; `180` days → move to **Archive**.",
        "Open **Data management → Data protection** → verify **Blob soft delete**, **Container soft delete**, **Blob versioning**, and **Blob change feed** (remember: Versioning + Change Feed are required for Object Replication!).",
        "Open **File shares → finance → Snapshots** → take an instant file share snapshot and inspect **Soft delete for file shares**."
      ],
      cliCommands: `# Provision StorageV2 + 'products' Blob Container + 'finance' File Share + Versioning:
./labs/week-03-storage/setup-storage.sh eastus

# Copy a file using AzCopy (supported with SAS or Entra ID login):
azcopy login
azcopy copy "./README.md" "https://<st-name>.blob.core.windows.net/products/README.md"`,
      verifySteps: [
        "Know why an **Archive** tier blob cannot be downloaded directly (offline tier — must **rehydrate** to Hot/Cool first using Standard `<15h` or High `<1h` priority).",
        "Know the 4 redundancy SLAs: **LRS** (1 datacenter, 11 nines), **ZRS** (3 Availability Zones in 1 region, 12 nines), **GRS/RA-GRS** (LRS + async copy to paired region, 16 nines), **GZRS/RA-GZRS** (3 zones + paired region)."
      ]
    },
    w3_storage_security: {
      title: "Storage Firewalls, Private Endpoints + DNS, SAS Policies & Entra Auth",
      msLabs: ["lab07"],
      repoScript: "labs/week-03-storage/sabotage-storage.sh",
      docLinks: [
        { label: "Shared Access Signatures (User Delegation vs Service vs Account)", url: "https://learn.microsoft.com/en-us/azure/storage/common/storage-sas-overview" },
        { label: "Stored Access Policies (Instant SAS Revocation)", url: "https://learn.microsoft.com/en-us/rest/api/storageservices/define-stored-access-policy" },
        { label: "Private Endpoints & Private DNS for Storage", url: "https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-dns" }
      ],
      portalSteps: [
        "Open `products` container → **Settings → Access policy** → under **Stored access policies**, click **+ Add policy** (`pol-partner-read`, Permissions: `Read, List`, Expiry: +7 days) → Save.",
        "Generate a **Shared access tokens (SAS)** linked to `pol-partner-read`. Test accessing a blob URL with the SAS, then delete `pol-partner-read` to prove the SAS is revoked immediately without rotating Storage Account keys!",
        "Run `labs/week-03-storage/sabotage-storage.sh <st-name>` to disable Public Network Access and trigger the 403 Private DNS mystery.",
        "Complete **Integration Capstone Lab 01** (`Zero-Secret Private Data Pipeline`) to wire Private Endpoint + `privatelink.blob.core.windows.net` + Managed Identity end-to-end!"
      ],
      cliCommands: `# Trigger the Week 3 Private Endpoint + DNS 403 Mystery:
./labs/week-03-storage/sabotage-storage.sh <your-storage-account-name>

# Or run the full Multi-Domain Integration Capstone 01:
./labs/integration-labs/lab-01-deploy.sh eastus`,
      verifySteps: [
        "Contrast the 3 SAS types: **User Delegation SAS** (signed with Entra ID credentials — most secure, Blob/ADLS only), **Service SAS** (signed with account key, single service like Blob or Files), **Account SAS** (signed with account key, spans multiple services + service-level ops).",
        "Contrast **Service Endpoint** (keeps public IP on storage, restricts source to VNet over Microsoft backbone) vs **Private Endpoint** (assigns a private IP `10.2.1.4` inside your subnet + requires `privatelink.blob.core.windows.net` DNS)."
      ]
    },
    w4_bicep_vms: {
      title: "ARM Templates, Bicep Automation, VMs & Managed Identities",
      msLabs: ["lab03b", "lab08"],
      repoScript: "labs/week-04-compute/main.bicep",
      docLinks: [
        { label: "Bicep File Structure & Decompile from ARM", url: "https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/file" },
        { label: "Managed Identities for Azure Resources", url: "https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview" }
      ],
      portalSteps: [
        "Inspect `labs/week-04-compute/main.bicep` (notice `param`, `resource`, `@secure()`, `resourceId()`, and `output`).",
        "Deploy `main.bicep` into `rg-northstar-ephemeral` using Azure CLI or Cloud Shell.",
        "In Portal → open `rg-northstar-ephemeral` → **Deployments** → inspect inputs/outputs, then open `vm-app-01` → **Automation → Export template** to see the compiled ARM JSON (`$schema`, `parameters`, `variables`, `resources`, `outputs`).",
        "Now open `labs/week-04-compute/sabotage.bicep` and find all **3 hidden Bicep/Azure bugs**!"
      ],
      cliCommands: `# Deploy vm-app-01 with System-Assigned Managed Identity via Bicep:
az group create -n rg-northstar-ephemeral -l eastus
az deployment group create -g rg-northstar-ephemeral \\
  --template-file labs/week-04-compute/main.bicep \\
  --parameters adminPassword='<StrongPass123!>'

# Convert any exported ARM template JSON into Bicep:
az bicep decompile --file template.json`,
      verifySteps: [
        "Know the difference between **System-Assigned Managed Identity** (1:1 lifecycle tied to the VM; deleted automatically when the VM is deleted) and **User-Assigned Managed Identity** (standalone resource; can be shared across multiple VMs/apps).",
        "Confirm you caught all 3 bugs in `sabotage.bicep`: `AzureBastionSubnet` `/26` rule, overlapping subnet CIDR, and lowercase-alphanumeric-only Storage Account naming."
      ]
    },
    w4_vm_scale_ha: {
      title: "VM Disks, ADE, Availability Sets vs Zones, VMSS & Moving VMs",
      msLabs: ["lab08"],
      repoScript: "labs/integration-labs/lab-02-deploy.bicep",
      docLinks: [
        { label: "Availability Sets (99.95%) vs Availability Zones (99.99%)", url: "https://learn.microsoft.com/en-us/azure/virtual-machines/availability" },
        { label: "Virtual Machine Scale Sets (VMSS) & Autoscale", url: "https://learn.microsoft.com/en-us/azure/virtual-machine-scale-sets/overview" },
        { label: "Azure Disk Encryption (ADE) vs Encryption at Host", url: "https://learn.microsoft.com/en-us/azure/virtual-machines/disk-encryption-overview" }
      ],
      portalSteps: [
        "Open `vm-app-01` → **Disks** → **+ Create and attach a new disk** (`16 GiB`, `Standard SSD LRS`). Notice data disks can be attached hot without stopping the VM!",
        "Open `vm-app-01` → **Size** → resize to `Standard_B2s` (remember: if the target size isn't available on the current hardware cluster, you must **Stop/Deallocate** the VM first, which wipes the temporary disk!).",
        "Compare **Availability Sets** (protects against rack/power failure inside 1 datacenter: up to 3 Fault Domains & 20 Update Domains, `99.95%` SLA, **must be set at VM creation**) vs **Availability Zones** (physically separate datacenters in a region, `99.99%` SLA).",
        "In Portal → **Virtual machine scale sets** → inspect **Orchestration modes** (`Uniform` vs `Flexible`) and **Scaling → Custom autoscale** (Scale out when CPU > 70% for 10 min; Scale in when CPU < 30%)."
      ],
      cliCommands: `# Attach a 16GB managed data disk to vm-app-01 live:
az vm disk attach -g rg-northstar-ephemeral --vm-name vm-app-01 \\
  --name disk-app-data01 --new --size-gb 16 --sku StandardSSD_LRS

# Teardown hourly VMs when finished:
./scripts/friday-cleanup.sh`,
      verifySteps: [
        "Memorize the VM Move rule: Moving a VM across **Resource Groups or Subscriptions** uses Portal **Move** (`az resource move`), whereas moving a VM to another **Region** uses **Azure Resource Mover**!",
        "Remember: You **cannot** move an existing VM into an Availability Set — you must delete the VM (keeping its disks) and recreate the VM inside the Availability Set from those disks."
      ]
    },
    w5_app_service: {
      title: "App Service Plans, Deployment Slots, Sticky Settings, VNet & TLS",
      msLabs: ["lab09a"],
      repoScript: "labs/week-05-apps-containers/setup-app-aci.sh",
      docLinks: [
        { label: "App Service Plan Tiers & Limits", url: "https://learn.microsoft.com/en-us/azure/app-service/overview-hosting-plans" },
        { label: "Set Up Staging Environments & Slot-Sticky Settings", url: "https://learn.microsoft.com/en-us/azure/app-service/deploy-staging-slots" },
        { label: "App Service Networking (Regional VNet Integration)", url: "https://learn.microsoft.com/en-us/azure/app-service/overview-vnet-integration" }
      ],
      portalSteps: [
        "Run `labs/week-05-apps-containers/setup-app-aci.sh` to provision a **Standard (S1)** App Service Plan, Web App, and `staging` Deployment Slot.",
        "Run `labs/week-05-apps-containers/sabotage-slot.sh <app-name>` to plant the non-sticky `DB_TARGET` bug.",
        "In Portal → open your Web App → **Settings → Environment variables** → edit `DB_TARGET` → check **Deployment slot setting** (slot-sticky) on both Production and Staging → perform a **Swap**.",
        "Open **Networking** on your Web App → inspect **Outbound traffic configuration → Virtual network integration** (lets App Service reach private IPs/Private Endpoints inside your VNet) vs **Inbound → Access restrictions / Private endpoints**."
      ],
      cliCommands: `# Deploy App Service S1 + staging slot + plant the slot-swap bug:
./labs/week-05-apps-containers/setup-app-aci.sh eastus
./labs/week-05-apps-containers/sabotage-slot.sh $NORTHSTAR_APP

# Fix DB_TARGET by marking it as a slot-sticky setting (--slot-settings):
az webapp config appsettings set -g rg-northstar-ephemeral -n $NORTHSTAR_APP \\
  --slot-settings DB_TARGET="PROD-DB-LIVE"
az webapp config appsettings set -g rg-northstar-ephemeral -n $NORTHSTAR_APP \\
  --slot staging --slot-settings DB_TARGET="STAGING-TEST-DB"`,
      verifySteps: [
        "Memorize the App Service Plan tier breakthroughs: **Free/Shared** (shared CPU, no SSL/slots), **Basic B1–B3** (dedicated VMs, custom domains + SSL, manual scale up to 3 instances, NO slots/autoscale), **Standard S1+** (5 Deployment Slots, Autoscale up to 10 instances, Daily Backups), **Premium P1v3+** (20 Deployment Slots, 30 instances, VNet integration enhancements).",
        "Know what swaps vs stays during a Slot Swap: **Swaps** = App code, regular App Settings, language version. **Stays pinned to the slot** = Custom domains, SSL certificates, Scale settings, Managed Identity, and settings marked **Deployment slot setting**!"
      ]
    },
    w5_containers: {
      title: "Azure Container Registry (ACR), Container Instances (ACI) & Container Apps (ACA)",
      msLabs: ["lab09b", "lab09c"],
      repoScript: "labs/integration-labs/lab-03-deploy.sh",
      docLinks: [
        { label: "ACI Restart Policies & Azure Files Volume Mounts", url: "https://learn.microsoft.com/en-us/azure/container-instances/container-instances-volume-azure-files" },
        { label: "Azure Container Apps (Ingress, Revisions, KEDA Scaling)", url: "https://learn.microsoft.com/en-us/azure/container-apps/overview" },
        { label: "Compare Container Options in Azure", url: "https://learn.microsoft.com/en-us/azure/container-apps/compare-options" }
      ],
      portalSteps: [
        "Run **Integration Capstone Lab 03** (`labs/integration-labs/lab-03-deploy.sh`) to deploy an ACI container with `restartPolicy: OnFailure` mounted to an Azure File Share.",
        "In Portal → **Container instances → aci-batch-worker** → inspect **Containers → Logs** and **Events**.",
        "In Portal → **Container Apps** → click **+ Create** to inspect **Container Apps Environment**, **Ingress** (`External` vs `Internal to VNet`), **Revisions** (traffic splitting 80%/20%), and **Scale rules** (`HTTP`, `TCP`, `Custom KEDA` with min replicas = `0` for scale-to-zero!).",
        "Inspect **Container registries (ACR)** SKUs: `Basic`, `Standard`, and `Premium` (Premium is required for **Geo-replication**, **Private Endpoints**, and **Content Trust**!)."
      ],
      cliCommands: `# Run Integration Capstone Lab 03 (ACI + File Share Mount + App Service Slots):
./labs/integration-labs/lab-03-deploy.sh eastus

# Clean up hourly App Service S1 & containers when finished:
./scripts/friday-cleanup.sh`,
      verifySteps: [
        "Know when to choose **ACI** (simplest burst/batch container, per-second billing, Container Groups sharing localhost/volumes) vs **ACA** (serverless microservices, HTTP ingress, traffic-splitting revisions, KEDA scale-to-zero without managing Kubernetes cluster control plane).",
        "Remember: Mounting an **Azure File Share** in ACI is ONLY supported on **Linux** containers and requires a **Standard** storage account."
      ]
    },
    w6_lb_bastion_dns: {
      title: "Standard Load Balancer, Health Probes, Azure DNS & Azure Bastion",
      msLabs: ["lab06"],
      repoScript: "labs/week-06-lb-bastion/setup-lb.sh",
      docLinks: [
        { label: "Standard Load Balancer & Health Probe Rules", url: "https://learn.microsoft.com/en-us/azure/load-balancer/load-balancer-overview" },
        { label: "Azure Bastion Subnet (/26) & SKU Comparison", url: "https://learn.microsoft.com/en-us/azure/bastion/configuration-settings" },
        { label: "Azure Private DNS Zones & Auto-Registration", url: "https://learn.microsoft.com/en-us/azure/dns/private-dns-autoregistration" }
      ],
      portalSteps: [
        "Run **Integration Capstone Lab 02** (`labs/integration-labs/lab-02-deploy.bicep`) or `labs/week-06-lb-bastion/setup-lb.sh` to deploy a Standard Public Load Balancer with backend pool, HTTP probe, and LB rule.",
        "Run `labs/week-06-lb-bastion/sabotage-probe.sh` to inject a custom `Priority 200 DenyAll` NSG rule that overrides default rule `65001 (AllowAzureLoadBalancerInBound)` and drops LB health to 0%.",
        "Add an Inbound Allow rule for Service Tag `AzureLoadBalancer` at Priority `110` (`< 200`) to restore health probes.",
        "Open `northstar.internal` **Private DNS Zone** → **Virtual network links** → inspect **Enable auto registration** (automatically creates A records for VMs deployed in that linked VNet)."
      ],
      cliCommands: `# Deploy the full HA Web + Standard LB + Private DNS stack (Capstone 02):
az deployment group create -g rg-northstar-ephemeral \\
  --template-file labs/integration-labs/lab-02-deploy.bicep \\
  --parameters adminPassword='<StrongPass123!>'

# Trigger & fix the Load Balancer Health Probe NSG outage:
./labs/week-06-lb-bastion/sabotage-probe.sh
az network nsg rule create -g rg-northstar-core --nsg-name nsg-app-subnet -n AllowLBProbes \\
  --priority 110 --direction Inbound --access Allow --protocol "*" \\
  --source-address-prefixes AzureLoadBalancer --destination-port-ranges "*"

# Always delete Standard LB / Bastion right after testing:
./scripts/friday-cleanup.sh`,
      verifySteps: [
        "Memorize the 3 **Azure Bastion** exam rules: (1) Subnet MUST be named `AzureBastionSubnet` with prefix `/26` or larger; (2) One Bastion in the Hub VNet can connect to VMs in directly peered Spoke VNets; (3) **Standard SKU** is required for Native SSH/RDP client connections, file upload/download, and shareable links.",
        "Memorize **Private DNS VNet Link** limits: A VNet can be linked to **many** Private DNS zones for resolution, but can only have **Auto-registration** enabled on **1** Private DNS zone!"
      ]
    },
    w7_monitor_watcher: {
      title: "Azure Monitor, Log Analytics (KQL), Alerts, Processing Rules & Network Watcher",
      msLabs: ["lab11"],
      repoScript: "labs/week-07-monitor-backup/setup-monitor.sh",
      docLinks: [
        { label: "Azure Monitor Alert Types & Action Groups", url: "https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-overview" },
        { label: "Alert Processing Rules (Maintenance Suppression)", url: "https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-processing-rules" },
        { label: "Network Watcher (IP Flow Verify, Next Hop, Connection Monitor)", url: "https://learn.microsoft.com/en-us/azure/network-watcher/network-watcher-overview" }
      ],
      portalSteps: [
        "Run `labs/week-07-monitor-backup/setup-monitor.sh` to create Log Analytics Workspace `law-northstar-lab` and Action Group `ag-northstar-oncall`.",
        "Open **Monitor → Activity log → Export Activity Logs** → send Administrative, Security, and Policy events to `law-northstar-lab`.",
        "Open **Monitor → Alerts → Alert processing rules** → create a rule scoped to `rg-northstar-ephemeral` that **Suppresses notifications** on a recurring Sunday 02:00–04:00 maintenance schedule.",
        "Open **Network Watcher** and test the 3 diagnostic tools tested on AZ-104: **IP flow verify** (which NSG rule allowed/blocked a packet), **Next hop** (which route/UDR handles a destination IP), and **Connection monitor** (continuous end-to-end latency/reachability monitoring)."
      ],
      cliCommands: `# Create Log Analytics Workspace + Oncall Action Group:
./labs/week-07-monitor-backup/setup-monitor.sh eastus you@example.com

# Query recent Administrative events in Log Analytics via CLI:
az monitor log-analytics query -w <workspace-customer-id> \\
  --analytics-query "AzureActivity | where CategoryValue == 'Administrative' | take 10"`,
      verifySteps: [
        "Contrast the 3 Alert Rule types: **Metric Alerts** (near-real-time numeric thresholds like CPU > 80%), **Log Search Alerts** (KQL queries over Log Analytics tables), **Activity Log Alerts** (control-plane events like 'Resource Lock Deleted' or **Service Health** incidents).",
        "Know how **Data Collection Rules (DCR)** + **Azure Monitor Agent (AMA)** replaced the legacy Log Analytics agent for collecting guest OS VM logs/metrics."
      ]
    },
    w7_backup_asr: {
      title: "Recovery Services Vault vs Azure Backup Vault, Soft Delete & Site Recovery (ASR)",
      msLabs: ["lab10"],
      repoScript: "labs/week-07-monitor-backup/sabotage-backup.sh",
      docLinks: [
        { label: "Recovery Services Vault vs Azure Backup Vault Matrix", url: "https://learn.microsoft.com/en-us/azure/backup/backup-overview" },
        { label: "Soft Delete for Azure Backup", url: "https://learn.microsoft.com/en-us/azure/backup/backup-azure-security-feature-cloud" },
        { label: "Azure Site Recovery (ASR) Architecture & Failover", url: "https://learn.microsoft.com/en-us/azure/site-recovery/azure-to-azure-architecture" }
      ],
      portalSteps: [
        "Run `labs/week-07-monitor-backup/sabotage-backup.sh` to create `rsv-northstar-wrongregion` in `westus2` while your VMs live in `eastus`.",
        "Open `rsv-northstar-wrongregion` → **+ Backup** → notice your `eastus` VMs do NOT appear! That's because **Azure Backup** requires the vault in the **SAME region** as the VM, whereas **Azure Site Recovery (ASR)** requires the vault in the **TARGET failover region**.",
        "Compare **Recovery Services Vault** (protects Azure VMs, Azure Files, SQL/SAP in VMs, and ASR) vs **Azure Backup Vault** (protects **Azure Blobs**, **Azure Managed Disks**, and AKS/PostgreSQL).",
        "Before deleting any lab vault: open **Properties → Security Settings → Disable Soft Delete**, undelete any soft-deleted items, delete backup data permanently, and then delete the vault."
      ],
      cliCommands: `# Experience the Wrong-Region Vault Mystery:
./labs/week-07-monitor-backup/sabotage-backup.sh

# Or deploy the full Integration Capstone Lab 04:
./labs/integration-labs/lab-04-deploy.sh eastus you@example.com`,
      verifySteps: [
        "Memorize the 2-Tier VM Backup restore model: **Instant Restore Snapshots** (stored alongside the disks for **1–5 days** on Standard policy for fast recovery) → **Vault Tier** (copied to Recovery Services Vault for long-term GRS/LRS/ZRS retention).",
        "Know the 4 ASR failover phases: **Test failover** (validates DR in an isolated VNet with zero production impact) → **Planned/Unplanned Failover** → **Commit** → **Reprotect** (reverses replication back to primary region) → **Failback**."
      ]
    },
    w8_exam_mastery: {
      title: "Full-Stack Case Studies, 45-Second Open-Book Lookups & Official Practice Assessment",
      msLabs: ["lab01", "lab05", "lab07", "lab08", "lab10"],
      repoScript: "scripts/friday-cleanup.sh",
      docLinks: [
        { label: "Official AZ-104 Study Guide & Change Log", url: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104" },
        { label: "AZ-104 Certification & New AI Skills Navigator Practice Assessment", url: "https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/" },
        { label: "Open-Book Microsoft Learn Exam Rules & Exam Sandbox", url: "https://learn.microsoft.com/en-us/credentials/support/exam-duration-exam-experience" }
      ],
      portalSteps: [
        "Open **Practice Studio → Exam Case Studies** and complete both multi-tab case studies (*Northstar Retail Cloud Expansion* and *Northstar Ops Governance & Containers*).",
        "Open **Practice Studio → Open-Book 45s Lookups** and complete all 10 timed Microsoft Learn documentation races.",
        "Sign in to Microsoft's official **AI Skills Navigator Practice Assessment** (linked above) and log your per-domain scores in **Overview → Log Practice Exam Score**.",
        "Check **Overview → Where You Need the Most Work** and clear any remaining items in your **Missed-Trap Queue** before running your final teardown."
      ],
      cliCommands: `# Final complete teardown of both ephemeral and core lab Resource Groups:
az group delete --name rg-northstar-ephemeral --yes --no-wait
az group delete --name rg-northstar-core --yes --no-wait`,
      verifySteps: [
        "Confirm your **Overall Exam Readiness** in Overview is **80%+** with no domain below **70%**.",
        "Verify in Azure Portal → **Resource groups** and **Cost Management** that zero billable resources remain running."
      ]
    }
  };

  const SPRINT_TO_GUIDE = {
    w1d1: "w1_identities",   w1d2: "w1_rbac_locks",   w1d3: "w1_rbac_locks",   w1d4: "w1_policy",       w1d5: "w1_policy",
    w2d1: "w2_vnets_peering",w2d2: "w2_vnets_peering",w2d3: "w2_nsg_udr",      w2d4: "w2_nsg_udr",      w2d5: "w2_nsg_udr",
    w3d1: "w3_storage_core", w3d2: "w3_storage_security", w3d3: "w3_storage_security", w3d4: "w3_storage_core", w3d5: "w3_storage_security",
    w4d1: "w4_bicep_vms",    w4d2: "w4_bicep_vms",    w4d3: "w4_vm_scale_ha",  w4d4: "w4_vm_scale_ha",  w4d5: "w4_vm_scale_ha",
    w5d1: "w5_app_service",  w5d2: "w5_app_service",  w5d3: "w5_containers",   w5d4: "w5_containers",   w5d5: "w5_containers",
    w6d1: "w6_lb_bastion_dns",w6d2:"w6_lb_bastion_dns",w6d3:"w6_lb_bastion_dns",w6d4:"w6_lb_bastion_dns",w6d5:"w6_lb_bastion_dns",
    w7d1: "w7_monitor_watcher",w7d2:"w7_monitor_watcher",w7d3:"w7_monitor_watcher",w7d4:"w7_backup_asr", w7d5: "w7_backup_asr",
    w8d1: "w8_exam_mastery", w8d2: "w8_exam_mastery", w8d3: "w8_exam_mastery", w8d4: "w8_exam_mastery", w8d5: "w8_exam_mastery"
  };

  const BLITZ_WEEKS = [
    {
      num: 1,
      title: "Week 1 (Days 1–7): Identity, Networking & Storage Core",
      subtitle: "~2 hrs/weekday (three 35m blocks) • 3–4 hrs weekend • Covers ~55% of exam weight",
      days: [
        { id: "b1", day: "Day 1", domain: "identity",   guide: "w1_identities",       coversSprints: ["w1d1"], title: "Entra ID Users, Groups, Dynamic P1 Rules, Guests & SSPR", task: "Run labs/week-01-governance/setup.sh + complete MS Lab 01 (Users, Dynamic Groups, B2B Guests, SSPR)." },
        { id: "b2", day: "Day 2", domain: "identity",   guide: "w1_rbac_locks",       coversSprints: ["w1d2", "w1d3", "w1d4", "w1d5"], title: "RBAC Scopes, Custom Roles, Resource Locks & Azure Policy", task: "Run sabotage-lock.sh + MS Labs 02a & 02b + test RBAC/Lock/Policy Precedence Simulator." },
        { id: "b3", day: "Day 3", domain: "networking", guide: "w2_vnets_peering",    coversSprints: ["w2d1", "w2d2"], title: "VNets, -5 IP Subnet Math & Non-Transitive Hub-Spoke Peering", task: "Run labs/week-02-networking/setup-hub-spoke.sh + MS Labs 04 & 05 + Subnet Planner Simulator." },
        { id: "b4", day: "Day 4", domain: "networking", guide: "w2_nsg_udr",          coversSprints: ["w2d3", "w2d4", "w2d5"], title: "2-Gate NSGs (Subnet + NIC), ASGs & User-Defined Routes (UDRs)", task: "Run sabotage-network.sh + test 2-Gate NSG Packet Tracer Simulator + solve Networking P1 Tickets." },
        { id: "b5", day: "Day 5", domain: "storage",    guide: "w3_storage_core",     coversSprints: ["w3d1", "w3d4"], title: "StorageV2, Redundancy (LRS/ZRS/GRS/GZRS), Tiers, Lifecycle & Object Rep", task: "Run labs/week-03-storage/setup-storage.sh + MS Lab 07 + configure Lifecycle & Versioning." },
        { id: "b6", day: "Day 6", domain: "storage",    guide: "w3_storage_security", coversSprints: ["w3d2", "w3d3", "w3d5"], title: "Storage Firewalls, Private Endpoints + DNS & SAS Stored Access Policies", task: "Run sabotage-storage.sh + test Stored Access Policy SAS revocation + Data Plane RBAC." },
        { id: "b7", day: "Day 7", domain: "storage",    guide: "w3_storage_security", coversSprints: ["w1d2", "w1d3", "w2d2", "w3d1", "w3d2", "w4d2"], title: "Weekend Capstone: Zero-Secret Private Data Pipeline (Integration Lab 01)", task: "Complete Integration Capstone Lab 01 end-to-end + Bug Hunts #1–#4 + run scripts/friday-cleanup.sh." }
      ]
    },
    {
      num: 2,
      title: "Week 2 (Days 8–14): Compute, Load Balancing, Monitor/DR & Baseline Mock",
      subtitle: "Covers remaining ~45% of exam weight + Day 14 Full Baseline Practice Exam",
      days: [
        { id: "b8",  day: "Day 8",  domain: "compute",    guide: "w4_bicep_vms",        coversSprints: ["w4d1", "w4d2"], title: "ARM/Bicep Templates, VM Provisioning & Managed Identities", task: "Deploy labs/week-04-compute/main.bicep + debug all 3 bugs in sabotage.bicep + MS Lab 03b." },
        { id: "b9",  day: "Day 9",  domain: "compute",    guide: "w4_vm_scale_ha",      coversSprints: ["w4d3", "w4d4", "w4d5"], title: "Availability Sets vs Zones (99.95% vs 99.99%), VMSS, Disks & Moving VMs", task: "Complete MS Lab 08 + hot-attach a data disk + drill VM move and Availability Set recreation traps." },
        { id: "b10", day: "Day 10", domain: "compute",    guide: "w5_app_service",      coversSprints: ["w5d1", "w5d2", "w5d3", "w5d4", "w5d5"], title: "App Service Plans, Staging Slots, Sticky Settings, ACR, ACI & ACA", task: "Run Integration Capstone Lab 03 (App Service slots + ACI File Share mount) + MS Labs 09a/09b/09c." },
        { id: "b11", day: "Day 11", domain: "networking", guide: "w6_lb_bastion_dns",   coversSprints: ["w6d1", "w6d2", "w6d3", "w6d4", "w6d5"], title: "Standard Load Balancer, Health Probes, Private DNS & Azure Bastion", task: "Deploy Integration Capstone Lab 02 (HA Web Bicep) + sabotage-probe.sh + delete Bastion/LB same night!" },
        { id: "b12", day: "Day 12", domain: "monitor",    guide: "w7_monitor_watcher",  coversSprints: ["w7d1", "w7d2", "w7d3"], title: "Azure Monitor, Log Analytics (KQL), Alerts, Processing Rules & Network Watcher", task: "Run setup-monitor.sh + MS Lab 11 + test IP Flow Verify & Next Hop." },
        { id: "b13", day: "Day 13", domain: "monitor",    guide: "w7_backup_asr",       coversSprints: ["w7d4", "w7d5"], title: "Recovery Services Vault vs Azure Backup Vault, Soft Delete & ASR", task: "Run Integration Capstone Lab 04 + sabotage-backup.sh + MS Lab 10 + Bug Hunts #5–#8." },
        { id: "b14", day: "Day 14", domain: "compute",    guide: "w8_exam_mastery",     coversSprints: ["w8d3"], title: "BASELINE MOCK EXAM DAY (AI Skills Navigator Practice Assessment)", task: "Take a full timed 50-question practice exam, log your per-domain scores in Overview, and identify your top 2 weak domains." }
      ]
    },
    {
      num: 3,
      title: "Week 3 (Days 15–21): Weak-Spot Surgery, Case Studies & Exam-Day Speed",
      subtitle: "Zero passive studying — 100% targeted repair on your lowest-scoring domains",
      days: [
        { id: "b15", day: "Day 15", domain: "compute",    guide: "w8_exam_mastery",     coversSprints: ["w8d1"], title: "Multi-Tab Exam Case Studies (#1 & #2) + Mock #1 Post-Mortem", task: "Complete both Multi-Tab Case Studies in Practice Studio + check off mastered items in the 81-item Blueprint." },
        { id: "b16", day: "Day 16", domain: "identity",   guide: "w1_rbac_locks",       coversSprints: ["w1d2", "w1d3"], title: "Weakest Domain Deep Repair (Guided by Overview Tracker)", task: "Click 'Where You Need the Most Work' in Overview → re-run that domain's Capstone Lab, Simulator, and P1 tickets." },
        { id: "b17", day: "Day 17", domain: "networking", guide: "w8_exam_mastery",     coversSprints: ["w8d2"], title: "Open-Book 45-Second MS Learn Mastery + Timed Mock Exam #2", task: "Complete all 10 Open-Book 45s Lookups in Practice Studio → take Timed Mock #2 (target 75%+) & log score." },
        { id: "b18", day: "Day 18", domain: "storage",    guide: "w3_storage_security", coversSprints: ["w3d2", "w3d3"], title: "2nd-Weakest Domain Repair + Clear Missed-Trap Queue to Zero", task: "Clear every trap in your Spaced-Repetition Missed Queue + hit 15+ in the 60s Exam Trap Speed Run." },
        { id: "b19", day: "Day 19", domain: "monitor",    guide: "w8_exam_mastery",     coversSprints: ["w8d4"], title: "Timed Mock Exam #3 (Strict 100-Minute Exam Pace)", task: "Take Mock #3 at real exam pace (max 90s/question before flagging) → target 80%+ and log domain scores." },
        { id: "b20", day: "Day 20", domain: "identity",   guide: "w8_exam_mastery",     coversSprints: ["w8d5"], title: "Final 81/81 Blueprint Audit & Full Azure Teardown (90m max)", task: "Verify 81/81 objectives in Blueprint tab, delete rg-northstar-ephemeral & rg-northstar-core, rest early." },
        { id: "b21", day: "Day 21", domain: "compute",    guide: "w8_exam_mastery",     coversSprints: ["w8d5"], title: "EXAM DAY — Pass AZ-104 (700+)", task: "Play 1 light 60-second Speed Run to warm up, check in 30 minutes early, use open-book MS Learn only for quick table checks." }
      ]
    }
  ];

  // ---------------------------------------------------------------------------
  // AUTOMATIC BLUEPRINT <-> LAB SYNCHRONIZATION ENGINE
  // Parses "W1 Mon", "W2 Wed & Thu", "W2 Wed & W7 Wed", etc. into exact
  // Sprint IDs (w1d1), Blitz Day IDs (b1..b21), Capstone IDs (int1..int4),
  // and Official MS Lab codes (lab01..lab11)
  // ---------------------------------------------------------------------------
  const DAY_MAP = { Mon: "d1", Tue: "d2", Wed: "d3", Thu: "d4", Fri: "d5" };

  function parseSprintLabel(label) {
    // Examples: "W1 Mon", "W1 Mon & Fri", "W2 Wed & Thu", "W2 Wed & W7 Wed", "W6 Mon & Tue"
    const parts = String(label || "").split("&").map(s => s.trim());
    let currentWeek = "1";
    const sprintIds = [];
    parts.forEach(p => {
      const mFull = /^W(\d)\s+(Mon|Tue|Wed|Thu|Fri)$/i.exec(p);
      const mDayOnly = /^(Mon|Tue|Wed|Thu|Fri)$/i.exec(p);
      if (mFull) {
        currentWeek = mFull[1];
        const dKey = mFull[2].charAt(0).toUpperCase() + mFull[2].slice(1).toLowerCase();
        sprintIds.push(`w${currentWeek}${DAY_MAP[dKey]}`);
      } else if (mDayOnly) {
        const dKey = mDayOnly[1].charAt(0).toUpperCase() + mDayOnly[1].slice(1).toLowerCase();
        sprintIds.push(`w${currentWeek}${DAY_MAP[dKey]}`);
      }
    });
    return sprintIds;
  }

  let cachedLinks = null;

  function buildBlueprintLinks() {
    if (cachedLinks) return cachedLinks;
    const { MS_BLUEPRINT } = window.AZ104_CORE;
    const byBpKey = {};
    const bySprintId = {};
    const byBlitzId = {};
    const byCapstoneId = {};

    MS_BLUEPRINT.forEach((d, di) => {
      d.groups.forEach((g, gi) => {
        g.items.forEach(([text, sprintLabel], ii) => {
          const bpKey = `bp_${di}_${gi}_${ii}`;
          const sprintIds = parseSprintLabel(sprintLabel);
          const primarySprint = sprintIds[0] || "w1d1";
          const weekNum = Number(primarySprint.charAt(1)) || 1;
          const guide = TOPIC_GUIDES[SPRINT_TO_GUIDE[primarySprint]] || TOPIC_GUIDES.w1_identities;
          const msLabKey = (guide.msLabs && guide.msLabs[0]) || "lab01";
          const msLab = OFFICIAL_MS_LABS[msLabKey];

          // Which Blitz days cover any of these sprintIds?
          const blitzIds = [];
          BLITZ_WEEKS.forEach(bw => {
            bw.days.forEach(bd => {
              if ((bd.coversSprints || []).some(sid => sprintIds.includes(sid))) {
                blitzIds.push(bd.id);
              }
            });
          });

          // Which Capstones cover any of these sprintIds?
          const capIds = [];
          INTEGRATION_LABS.forEach(cap => {
            if ((cap.coversSprints || []).some(sid => sprintIds.includes(sid))) {
              capIds.push(cap.id);
            }
          });

          const entry = {
            bpKey,
            text,
            groupName: g.name,
            domainId: d.id,
            sprintLabel,
            sprintIds,
            primarySprint,
            weekNum,
            blitzIds,
            capIds,
            msLabKey,
            msLab
          };

          byBpKey[bpKey] = entry;
          sprintIds.forEach(sid => {
            if (!bySprintId[sid]) bySprintId[sid] = [];
            bySprintId[sid].push(entry);
          });
          blitzIds.forEach(bid => {
            if (!byBlitzId[bid]) byBlitzId[bid] = [];
            byBlitzId[bid].push(entry);
          });
          capIds.forEach(cid => {
            if (!byCapstoneId[cid]) byCapstoneId[cid] = [];
            byCapstoneId[cid].push(entry);
          });
        });
      });
    });

    cachedLinks = { byBpKey, bySprintId, byBlitzId, byCapstoneId };
    return cachedLinks;
  }

  // Returns { done: boolean, source: string|null, entry }
  function getObjectiveStatus(bpKey, state) {
    const links = buildBlueprintLinks();
    const entry = links.byBpKey[bpKey];
    if (!entry) return { done: false, source: null, entry: null };

    // 1. If user explicitly unchecked it manually, respect that until re-checked
    if (state.blueprintManualUncheck && state.blueprintManualUncheck[bpKey]) {
      return { done: false, source: null, entry };
    }

    // 2. Check if completed via an 8-Week Sprint
    for (const sid of entry.sprintIds) {
      if (state.checked && state.checked[sid]) {
        const w = sid.charAt(1);
        const dIdx = Number(sid.charAt(3)) - 1;
        const dName = ["Mon", "Tue", "Wed", "Thu", "Fri"][dIdx] || "";
        return { done: true, source: `Auto-checked via W${w} ${dName}`, entry };
      }
    }

    // 3. Check if completed via a 3-Week Blitz Day
    for (const bid of entry.blitzIds) {
      if (state.blitzChecked && state.blitzChecked[bid]) {
        return { done: true, source: `Auto-checked via Blitz ${bid.toUpperCase()}`, entry };
      }
    }

    // 4. Check if completed via a Multi-Domain Capstone Lab
    for (const cid of entry.capIds) {
      if (state.capstoneChecked && state.capstoneChecked[cid]) {
        const cap = INTEGRATION_LABS.find(c => c.id === cid);
        return { done: true, source: `Auto-checked via ${cap ? cap.code : cid}`, entry };
      }
    }

    // 5. Check if manually checked in Blueprint tab
    if (state.blueprintChecked && state.blueprintChecked[bpKey]) {
      return { done: true, source: "Checked manually", entry };
    }

    return { done: false, source: null, entry };
  }

  function getGuideForSprint(sprintId) {
    const key = SPRINT_TO_GUIDE[sprintId] || "w1_identities";
    return TOPIC_GUIDES[key];
  }

  function getGuideByKey(key) {
    return TOPIC_GUIDES[key] || TOPIC_GUIDES.w1_identities;
  }

  return {
    OFFICIAL_MS_LABS,
    INTEGRATION_LABS,
    BLITZ_WEEKS,
    TOPIC_GUIDES,
    getGuideForSprint,
    getGuideByKey,
    buildBlueprintLinks,
    getObjectiveStatus
  };
})();
