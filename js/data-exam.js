// =============================================================================
// AZ-104 OPS QUEST — FIRST-TRY PASS EXAM ENGINE DATA (v4)
// 1. SEQUENCE_DRILLS: 6 Order-the-Steps Procedural Challenges (with distractors)
// 2. DROPDOWN_DRILLS: 6 Multi-Dropdown Hot-Area Tables & Code Slot-Fillers
// 3. YESNO_SERIES: 3 Locked Yes/No Scenario Series (9 non-revertible screens)
// 4. DECISION_MATRICES: 8 High-Yield Comparison Matrices with Active-Recall Cells
// 5. TOPIC_CHECKPOINTS: 24 Sprint Exit Checkpoint Questions (2 per Topic Guide)
// =============================================================================

window.AZ104_EXAM_DATA = {
  // ---------------------------------------------------------------------------
  // 1. ORDER-THE-STEPS SEQUENCE DRILLS (6 HIGH-YIELD AZ-104 PROCEDURES)
  // ---------------------------------------------------------------------------
  SEQUENCE_DRILLS: [
    {
      id: "seq1",
      code: "SEQ-01",
      domain: "compute",
      domainLabel: "Compute",
      title: "Move an Existing Standalone VM into an Availability Set",
      msUrl: "https://learn.microsoft.com/en-us/azure/virtual-machines/availability-set-overview",
      scenario: "Teammate deployed `vm-api-01` (with managed OS disk and 1 data disk) without an Availability Set. You must place `vm-api-01` into `avset-api-prod` (`2 FD / 5 UD`) while preserving all disk data. Select and order the 4 required steps (ignore the 2 invalid distractor steps).",
      requiredCount: 4,
      pool: [
        { id: "s1", text: "Create the target Availability Set (`avset-api-prod`) in the same Resource Group and Region." },
        { id: "s2", text: "Record `vm-api-01`'s NIC, OS disk, and data disk names, then delete the VM resource while keeping its disks and NIC." },
        { id: "s3", text: "Create a new VM configured to use `avset-api-prod` by attaching the existing preserved OS disk." },
        { id: "s4", text: "Re-attach the preserved Managed Data Disk and existing NIC to the newly recreated VM." },
        { id: "d1", text: "Stop (deallocate) `vm-api-01` and change the Availability Set dropdown in the Portal Availability + Scale blade." },
        { id: "d2", text: "Use Azure Resource Mover to live-migrate `vm-api-01` into `avset-api-prod` without downtime." }
      ],
      correctOrder: ["s1", "s2", "s3", "s4"],
      explanation: "Availability Sets can ONLY be assigned at VM creation time. You cannot change an existing VM's Availability Set via Stop/Deallocate or Resource Mover — you must delete the VM resource (preserving its Managed Disks), then recreate the VM inside the Availability Set from those disks."
    },
    {
      id: "seq2",
      code: "SEQ-02",
      domain: "storage",
      domainLabel: "Storage",
      title: "Configure Cross-Region Blob Object Replication End-to-End",
      msUrl: "https://learn.microsoft.com/en-us/azure/storage/blobs/object-replication-configure",
      scenario: "You need asynchronous Blob Object Replication from `stnorthstareast` (East US) to `stnorthstarwest` (West US 2). Select and order the 4 valid steps in sequence.",
      requiredCount: 4,
      pool: [
        { id: "s1", text: "Enable Blob Versioning on BOTH `stnorthstareast` (source) and `stnorthstarwest` (destination)." },
        { id: "s2", text: "Enable Blob Change Feed on the source storage account (`stnorthstareast`)." },
        { id: "s3", text: "Create the Object Replication policy on the destination account (or via source portal wizard), generating the policy ID rule mapping source and destination containers." },
        { id: "s4", text: "For pre-existing blobs, verify the replication filter includes 'Everything' (or custom prefix) and monitor replication status in blob properties." },
        { id: "d1", text: "Enable Hierarchical Namespace (ADLS Gen2) on both source and destination accounts." },
        { id: "d2", text: "Move the source container default access tier to Archive before creating the replication rule." }
      ],
      correctOrder: ["s1", "s2", "s3", "s4"],
      explanation: "Object Replication requires Blob Versioning on BOTH source and destination, plus Change Feed on the source account. Hierarchical Namespace (ADLS Gen2) is NOT supported with Object Replication!"
    },
    {
      id: "seq3",
      code: "SEQ-03",
      domain: "networking",
      domainLabel: "Networking + Storage",
      title: "Lock Down Blob Storage Behind a Private Endpoint Across Peered VNets",
      msUrl: "https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-dns",
      scenario: "`vm-app-01` runs in `vnet-app` (10.1.0.0/16). `stnorthstar01` is in `rg-core` alongside `vnet-data` (10.2.0.0/16). You must disable public storage access and ensure `vm-app-01` connects privately to `stnorthstar01.blob.core.windows.net` over `10.2.1.4`. Order the 4 steps.",
      requiredCount: 4,
      pool: [
        { id: "s1", text: "Disable Public Network Access on `stnorthstar01` and create a Private Endpoint (`sub-resource: blob`) inside `vnet-data/snet-pe`." },
        { id: "s2", text: "Create Private DNS Zone `privatelink.blob.core.windows.net` with an A record mapping `stnorthstar01` to `10.2.1.4`." },
        { id: "s3", text: "Create a Virtual Network Link on `privatelink.blob.core.windows.net` linked to `vnet-app` (and `vnet-data`)." },
        { id: "s4", text: "Ensure bidirectional VNet Peering is Connected directly between `vnet-app` and `vnet-data` (not just via an unrouted Hub)." },
        { id: "d1", text: "Enable Auto-Registration on the `privatelink.blob.core.windows.net` VNet link so Storage blobs register VM hostnames." },
        { id: "d2", text: "Add a Service Endpoint for `Microsoft.Storage` on `vnet-app` to force DNS resolution to `10.2.1.4`." }
      ],
      correctOrder: ["s1", "s2", "s3", "s4"],
      explanation: "Private Endpoint drops a private NIC (`10.2.1.4`) into `vnet-data`, Private DNS Zone `privatelink.blob.core.windows.net` must be linked to `vnet-app` so the VM resolves the private IP, and `vnet-app` must have a direct peering (or NVA route) to `vnet-data` because peering is non-transitive."
    },
    {
      id: "seq4",
      code: "SEQ-04",
      domain: "monitor",
      domainLabel: "Monitor & Backup",
      title: "Delete a Recovery Services Vault Containing Soft-Deleted VM Backups",
      msUrl: "https://learn.microsoft.com/en-us/azure/backup/backup-azure-delete-vault",
      scenario: "You stopped backup on `vm-test-01` and clicked 'Delete backup data', but `rsv-northstar-lab` refuses to delete because soft-deleted items are retained for 14 days. Order the 4 exact steps to delete the vault immediately.",
      requiredCount: 4,
      pool: [
        { id: "s1", text: "Open `rsv-northstar-lab` → Properties → Security Settings and disable Soft Delete (if not locked in Always-On mode)." },
        { id: "s2", text: "Open Backup items → select the soft-deleted `vm-test-01` item and perform an **Undelete** operation." },
        { id: "s3", text: "Return to `vm-test-01` backup item and choose **Delete backup data** to permanently purge the recovery points." },
        { id: "s4", text: "Delete the Recovery Services Vault (`rsv-northstar-lab`)." },
        { id: "d1", text: "Switch the vault Storage Replication type from GRS to LRS to flush soft-deleted items." },
        { id: "d2", text: "Delete the parent Resource Group with `--force-deletion-types Microsoft.Compute/virtualMachines`." }
      ],
      correctOrder: ["s1", "s2", "s3", "s4"],
      explanation: "Disabling Soft Delete alone does NOT purge items already in the soft-deleted state! You must Disable Soft Delete → **Undelete** the item → **Delete backup data** permanently → Delete the vault."
    },
    {
      id: "seq5",
      code: "SEQ-05",
      domain: "identity",
      domainLabel: "Identity & Gov",
      title: "Enforce & Retroactively Apply Tags to Existing Resources via Azure Policy",
      msUrl: "https://learn.microsoft.com/en-us/azure/governance/policy/how-to/remediate-resources",
      scenario: "Northstar has 40 existing untagged resources in `rg-northstar-core`, which carries tag `CostCenter=Retail`. You must ensure all NEW resources inherit `CostCenter` automatically AND fix all 40 EXISTING resources. Order the 4 steps.",
      requiredCount: 4,
      pool: [
        { id: "s1", text: "Select the built-in policy definition 'Inherit a tag from the resource group if missing' (which uses the `Modify` effect)." },
        { id: "s2", text: "Assign the policy at `rg-northstar-core` scope with `Tag Name = CostCenter` and enable 'Create a Managed Identity' (with `Contributor` role)." },
        { id: "s3", text: "Create and trigger a **Remediation Task** for that policy assignment targeting the 40 existing non-compliant resources." },
        { id: "s4", text: "Verify compliance reaches 100% in the Policy Compliance blade and Activity Log." },
        { id: "d1", text: "Assign 'Require a tag on resources' (`Deny` effect) and wait 30 minutes for Azure to auto-tag the 40 existing resources." },
        { id: "d2", text: "Apply a `ReadOnly` resource lock on `rg-northstar-core` before running the Remediation Task." }
      ],
      correctOrder: ["s1", "s2", "s3", "s4"],
      explanation: "`Deny` policies never modify resources; `Modify` policies auto-inject tags on new deployments and require a Managed Identity + **Remediation Task** to retroactively tag existing resources (and a `ReadOnly` lock would block remediation!)."
    },
    {
      id: "seq6",
      code: "SEQ-06",
      domain: "monitor",
      domainLabel: "Monitor & Backup",
      title: "Azure Site Recovery (ASR): Validate DR, Fail Over, and Fail Back to Primary",
      msUrl: "https://learn.microsoft.com/en-us/azure/site-recovery/site-recovery-failover",
      scenario: "East US VMs replicate to West US 2 via ASR. You want to test DR safely first, then later execute a real failover during an East US outage and restore replication back to East US once recovered. Order the 4 lifecycle phases.",
      requiredCount: 4,
      pool: [
        { id: "s1", text: "Run a **Test Failover** into an isolated non-production VNet in West US 2, verify the app, then click **Cleanup test failover**." },
        { id: "s2", text: "During the real outage, trigger **Failover** to West US 2 and click **Commit** once the secondary VMs are verified." },
        { id: "s3", text: "Click **Reprotect** in the vault so replication reverses direction (West US 2 now replicates changes back to East US)." },
        { id: "s4", text: "Once East US is healthy and synchronized, execute a planned **Failback** (Failover back to East US + Commit + Reprotect)." },
        { id: "d1", text: "Delete the West US 2 Recovery Services Vault immediately after Commit so users can reach the secondary VMs." },
        { id: "d2", text: "Run Test Failover directly inside the live Production VNet while primary VMs are still serving traffic." }
      ],
      correctOrder: ["s1", "s2", "s3", "s4"],
      explanation: "Memorize the ASR lifecycle: **Test Failover** (isolated VNet + Cleanup) → **Failover** → **Commit** → **Reprotect** (reverses replication from secondary back to primary!) → **Failback**."
    }
  ],

  // ---------------------------------------------------------------------------
  // 2. MULTI-DROPDOWN CONFIG TABLES & CODE SLOT-FILLERS (6 HOT-AREA DRILLS)
  // ---------------------------------------------------------------------------
  DROPDOWN_DRILLS: [
    {
      id: "dd1",
      code: "HOT-01",
      domain: "networking",
      domainLabel: "Networking",
      title: "Effective Route Table & Next Hop Evaluator (Longest Prefix + Tie-Breaker)",
      msUrl: "https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-udr-overview",
      context: `Subnet snet-app (10.1.1.0/24) has the following active routes:
• System Route: 10.1.0.0/16      ──> Next Hop: VNetLocal
• System Route: 10.2.0.0/16      ──> Next Hop: VNetPeering (vnet-data)
• BGP Route:    10.2.1.0/24      ──> Next Hop: VirtualNetworkGateway (10.0.254.4)
• Custom UDR 1: 10.2.1.0/24      ──> Next Hop: VirtualAppliance (10.0.10.4 - Hub Firewall)
• Custom UDR 2: 10.2.1.128/25    ──> Next Hop: None
• System Route: 0.0.0.0/0        ──> Next Hop: Internet`,
      prompt: "Select the winning Next Hop for each outbound packet sent from `vm-app-01` (10.1.1.4):",
      slots: [
        {
          id: "slot1",
          label: "Packet 1 → Destination `10.2.1.10` (matches `/16` Peering, `/24` BGP, and `/24` UDR 1)",
          options: [
            "VirtualAppliance (10.0.10.4) — `/24` beats `/16`, and on an exact `/24` tie, UDR beats BGP",
            "VirtualNetworkGateway (10.0.254.4) — BGP routes override custom User-Defined Routes",
            "VNetPeering (vnet-data) — System peering routes always override `/24` custom routes",
            "Internet — falls back to default `0.0.0.0/0` route"
          ],
          answer: 0
        },
        {
          id: "slot2",
          label: "Packet 2 → Destination `10.2.1.200` (inside `10.2.1.128/25`)",
          options: [
            "VirtualAppliance (10.0.10.4) — forwarded to the Hub Firewall",
            "Dropped (Next Hop: None) — `/25` is a longer prefix match than `/24` and `/16`!",
            "VNetPeering (vnet-data) — System peering rescues packets dropped by UDRs",
            "VirtualNetworkGateway — routed to on-premises via ExpressRoute/VPN"
          ],
          answer: 1
        },
        {
          id: "slot3",
          label: "Packet 3 → Destination `10.2.2.50` (inside `10.2.0.0/16`, outside `10.2.1.0/24`)",
          options: [
            "VirtualAppliance (10.0.10.4) — UDR 1 captures all `10.2.x.x` traffic",
            "Dropped (Next Hop: None)",
            "VNetPeering (vnet-data) — matches `10.2.0.0/16` System Peering route directly",
            "VNetLocal — kept inside `10.1.0.0/16`"
          ],
          answer: 2
        }
      ],
      explanation: "Azure evaluates routes strictly by **1. Longest Prefix Match** (`/25` > `/24` > `/16` > `/0`). Only when two routes have the **exact same prefix length** does Azure use the tie-breaker: **UDR > BGP > System**!"
    },
    {
      id: "dd2",
      code: "HOT-02",
      domain: "identity",
      domainLabel: "Identity & Storage",
      title: "Bicep Code Slot-Filler: Passwordless VM → Private Blob Pipeline",
      msUrl: "https://learn.microsoft.com/en-us/azure/storage/blobs/assign-azure-role-data-access",
      context: `resource vm 'Microsoft.Compute/virtualMachines@2023-09-01' = {
  name: 'vm-app-01'
  location: location
  identity: {
    type: /* [SLOT 1] */
  }
}

resource blobRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, vm.id, 'blob-role')
  scope: storageAccount
  properties: {
    principalId: vm.identity.principalId
    roleDefinitionId: /* [SLOT 2] */
    principalType: 'ServicePrincipal'
  }
}

resource privateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: /* [SLOT 3] */
  location: 'global'
}`,
      prompt: "Select the 3 exact values to complete this Bicep template so `vm-app-01` can upload blobs privately via Entra ID with zero keys:",
      slots: [
        {
          id: "slot1",
          label: "SLOT 1 (`vm.identity.type` for 1:1 lifecycle tied to the VM)",
          options: [
            "'SystemAssigned'",
            "'UserAssigned'",
            "'ServicePrincipal'",
            "'EntraApplication'"
          ],
          answer: 0
        },
        {
          id: "slot2",
          label: "SLOT 2 (`roleDefinitionId` required for reading AND writing blobs via Entra ID)",
          options: [
            "subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'b24988ac-6180-42a0-ab88-20f7382dd24c') // Contributor (Control Plane)",
            "subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe') // Storage Blob Data Contributor",
            "subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'acdd72a7-3385-48ef-bd42-f606fba81ae7') // Reader",
            "subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '17d1049b-9a84-46fb-8f53-869881c3d3ab') // Storage Account Contributor"
          ],
          answer: 1
        },
        {
          id: "slot3",
          label: "SLOT 3 (`privateDnsZone.name` for Azure Blob Storage Private Endpoints)",
          options: [
            "'privatelink.file.core.windows.net'",
            "'blob.core.windows.net'",
            "'privatelink.blob.core.windows.net'",
            "'internal.blob.azure.net'"
          ],
          answer: 2
        }
      ],
      explanation: "`SystemAssigned` creates an identity tied to `vm.identity.principalId`; reading/writing blobs via Entra ID requires **Storage Blob Data Contributor** (not Control-Plane `Contributor` or `Storage Account Contributor`); and Blob Private Endpoints require `privatelink.blob.core.windows.net`."
    },
    {
      id: "dd3",
      code: "HOT-03",
      domain: "compute",
      domainLabel: "Compute",
      title: "App Service Slot Swap Evaluation Matrix (What Swaps vs What Stays?)",
      msUrl: "https://learn.microsoft.com/en-us/azure/app-service/deploy-staging-slots#what-happens-during-a-swap",
      context: `Web App: app-northstar-prod (Standard S1 Plan)
Slot 'production':
  • App Setting: FEATURE_FLAG = "v1"            (Deployment slot setting = Unchecked)
  • App Setting: DB_CONN      = "prod-sql"      (Deployment slot setting = Checked / Sticky)
  • Custom Domain & TLS Cert:   shop.northstar.com
  • Always On:                  On

Slot 'staging':
  • App Setting: FEATURE_FLAG = "v2-checkout"   (Deployment slot setting = Unchecked)
  • App Setting: DB_CONN      = "staging-sql"   (Deployment slot setting = Checked / Sticky)
  • Custom Domain & TLS Cert:   staging.northstar.com
  • Always On:                  Off`,
      prompt: "You perform a slot swap (`staging` ↔ `production`). Determine the state of the **Production** slot after the swap completes:",
      slots: [
        {
          id: "slot1",
          label: "1. What are the values of `FEATURE_FLAG` and `DB_CONN` on the Production slot after the swap?",
          options: [
            "FEATURE_FLAG = \"v2-checkout\" AND DB_CONN = \"staging-sql\"",
            "FEATURE_FLAG = \"v2-checkout\" AND DB_CONN = \"prod-sql\"",
            "FEATURE_FLAG = \"v1\" AND DB_CONN = \"prod-sql\"",
            "FEATURE_FLAG = \"v1\" AND DB_CONN = \"staging-sql\""
          ],
          answer: 1
        },
        {
          id: "slot2",
          label: "2. What happens to the Custom Domain (`shop.northstar.com`) and TLS certificate binding on Production?",
          options: [
            "They swap to staging, so customers hitting shop.northstar.com reach the old staging slot",
            "They are deleted and must be re-bound manually after every slot swap",
            "They DO NOT swap — custom domains, TLS bindings, and Managed Identities stay pinned to the Production slot",
            "They merge so both slots serve shop.northstar.com round-robin"
          ],
          answer: 2
        },
        {
          id: "slot3",
          label: "3. What happens to the `Always On` setting on the Production slot after the swap?",
          options: [
            "Always On stays `On` in Production (`Always On`, scale settings, and VNet integration DO NOT swap across slots!)",
            "Always On becomes `Off` in Production because staging had Always On = Off",
            "The swap fails at validation unless Always On matches on both slots",
            "Always On is disabled on both slots during a swap"
          ],
          answer: 0
        }
      ],
      explanation: "Memorize the App Service Slot Swap table! **Items that SWAP:** App code, language stack/version, and regular App Settings/Connection Strings (`FEATURE_FLAG`). **Items that STAY PINNED to the slot:** Custom Domains, SSL/TLS Certificates, Scale Settings, `Always On`, VNet Integration, Managed Identity, and settings checked as **Deployment slot setting** (`DB_CONN`)."
    },
    {
      id: "dd4",
      code: "HOT-04",
      domain: "monitor",
      domainLabel: "Monitor & Backup",
      title: "Vault Type & Region Placement Matrix (Recovery Services vs Backup Vault)",
      msUrl: "https://learn.microsoft.com/en-us/azure/backup/backup-overview",
      context: `Northstar runs all primary workloads in East US and uses West US 2 as its paired disaster recovery region.
You need to provision vaults for three different protection tasks:
  Task A: Daily operational & vaulted backup of an Azure Virtual Machine (vm-app-01 in East US)
  Task B: Operational & vaulted backup of Azure Managed Disks and Azure Blobs (in East US)
  Task C: Continuous replication & regional disaster failover (ASR) of vm-app-01 from East US to West US 2`,
      prompt: "Select the exact Vault Resource Type and Region required for each task:",
      slots: [
        {
          id: "slot1",
          label: "Task A — Daily backup of Azure VM `vm-app-01` (running in East US)",
          options: [
            "Recovery Services Vault deployed in East US (SAME region as the VM)",
            "Recovery Services Vault deployed in West US 2 (target DR region)",
            "Azure Backup Vault deployed in East US",
            "Azure Backup Vault deployed in West US 2"
          ],
          answer: 0
        },
        {
          id: "slot2",
          label: "Task B — Backup of Azure Managed Disks and Azure Blob Storage (in East US)",
          options: [
            "Recovery Services Vault deployed in East US",
            "Azure Backup Vault deployed in East US (SAME region as the disks/blobs)",
            "Recovery Services Vault deployed in West US 2",
            "Log Analytics Workspace with Blob Versioning in West US 2"
          ],
          answer: 1
        },
        {
          id: "slot3",
          label: "Task C — Azure Site Recovery (ASR) regional failover of `vm-app-01` from East US → West US 2",
          options: [
            "Recovery Services Vault deployed in East US (source region)",
            "Azure Backup Vault deployed in West US 2",
            "Recovery Services Vault deployed in West US 2 (TARGET failover region)",
            "Availability Set spanning East US and West US 2"
          ],
          answer: 2
        }
      ],
      explanation: "Two rules tested heavily on AZ-104: (1) **Recovery Services Vault** = VMs, Azure Files, SQL in VM, ASR; **Azure Backup Vault** = Azure Blobs, Managed Disks, PostgreSQL, AKS. (2) **Backup** = Vault in **SAME** region; **Site Recovery (ASR)** = Vault in **TARGET** failover region!"
    },
    {
      id: "dd5",
      code: "HOT-05",
      domain: "storage",
      domainLabel: "Storage",
      title: "Storage SAS, Firewall & Lifecycle Decision Matrix",
      msUrl: "https://learn.microsoft.com/en-us/azure/storage/common/storage-sas-overview",
      context: `Northstar Security defines 3 storage requirements on stnorthstar01 (GPv2):
  Req 1: Issue a 24-hour Blob SAS token that is signed using Microsoft Entra ID credentials (NOT storage account keys).
  Req 2: Issue a 30-day Blob container SAS to a vendor that can be revoked in 1 second WITHOUT rotating Account Key 1 or Key 2.
  Req 3: Move blobs untouched for 180 days to the lowest-cost offline tier, knowing early deletion before X days incurs a prorated fee.`,
      prompt: "Select the exact Azure Storage configuration for each requirement:",
      slots: [
        {
          id: "slot1",
          label: "Req 1 — SAS type signed with Microsoft Entra ID credentials instead of Account Keys",
          options: [
            "Account SAS",
            "Service SAS with IP restriction",
            "User Delegation SAS (supports Blob & ADLS Gen2)",
            "Stored Access Policy SAS"
          ],
          answer: 2
        },
        {
          id: "slot2",
          label: "Req 2 — Revoke a specific Service SAS token early without rotating Storage Account Keys",
          options: [
            "Tie the Service SAS to a Stored Access Policy on the container (up to 5 policies per container), then delete/edit the policy",
            "Disable Blob Soft Delete on the storage account",
            "Use an Account SAS with HTTPS-only enforced",
            "Rotate only Storage Account Key 2 while the SAS is signed by Key 1"
          ],
          answer: 0
        },
        {
          id: "slot3",
          label: "Req 3 — Lowest-cost offline tier & minimum retention days before early-deletion penalty",
          options: [
            "Cool tier (30-day minimum retention; online)",
            "Cold tier (90-day minimum retention; online)",
            "Archive tier (180-day minimum retention; offline — requires rehydration before reading)",
            "Archive tier (30-day minimum retention; directly readable via AzCopy)"
          ],
          answer: 2
        }
      ],
      explanation: "**User Delegation SAS** uses Entra ID credentials; **Stored Access Policies** (max 5 per container/share) allow instant revocation of a Service SAS without key rotation; and early-deletion periods are **Cool = 30d**, **Cold = 90d**, **Archive = 180d (offline)**."
    },
    {
      id: "dd6",
      code: "HOT-06",
      domain: "identity",
      domainLabel: "Identity & Gov",
      title: "Custom RBAC Role JSON & Governance Scope Precedence",
      msUrl: "https://learn.microsoft.com/en-us/azure/role-based-access-control/custom-roles",
      context: `{
  "Name": "Northstar Support Operator",
  "IsCustom": true,
  "Description": "Can view all resources, restart VMs, and read blobs, but cannot delete anything.",
  /* [SLOT 1: Control-plane permissions] */
  /* [SLOT 2: Data-plane permissions] */
  "AssignableScopes": [
    /* [SLOT 3: Valid scope for Sub-Prod and Sub-Dev] */
  ]
}`,
      prompt: "Select the 3 valid JSON blocks for this Custom RBAC Role definition:",
      slots: [
        {
          id: "slot1",
          label: "SLOT 1 — Grant Control Plane read + VM restart, while excluding all delete actions",
          options: [
            "\"Actions\": [\"*/read\", \"Microsoft.Compute/virtualMachines/restart/action\"], \"NotActions\": [\"*/delete\"]",
            "\"DataActions\": [\"Microsoft.Compute/virtualMachines/restart/action\"], \"NotDataActions\": []",
            "\"Actions\": [\"Microsoft.Authorization/*\"], \"NotActions\": []",
            "\"DenyActions\": [\"*/delete\"]"
          ],
          answer: 0
        },
        {
          id: "slot2",
          label: "SLOT 2 — Grant Data Plane permission to read blobs inside containers",
          options: [
            "\"Actions\": [\"Microsoft.Storage/storageAccounts/listKeys/action\"]",
            "\"DataActions\": [\"Microsoft.Storage/storageAccounts/blobServices/containers/blobs/read\"]",
            "\"NotActions\": [\"Microsoft.Storage/storageAccounts/blobServices/*\"]",
            "\"ControlActions\": [\"Microsoft.Storage/blobs/read\"]"
          ],
          answer: 1
        },
        {
          id: "slot3",
          label: "SLOT 3 — Valid `AssignableScopes` entry to share this custom role across multiple subscriptions in a Management Group",
          options: [
            "\"/\" (Tenant Root `/` is allowed for custom roles)",
            "\"/providers/Microsoft.Management/managementGroups/mg-northstar\"",
            "\"https://northstar.onmicrosoft.com/directory\"",
            "\"*\""
          ],
          answer: 1
        }
      ],
      explanation: "Custom RBAC roles separate Control Plane (`Actions` / `NotActions`) from Data Plane (`DataActions` / `NotDataActions`). And `AssignableScopes` can target Resource Groups, Subscriptions, or a **Management Group** (`/providers/Microsoft.Management/managementGroups/<id>`), never bare `/` or `*`!"
    }
  ],

  // ---------------------------------------------------------------------------
  // 3. LOCKED YES/NO SCENARIO SERIES (3 SERIES x 3 PROPOSED SOLUTIONS = 9 ITEMS)
  // Mirrors the exact AZ-104 section where you CANNOT go back once you answer!
  // ---------------------------------------------------------------------------
  YESNO_SERIES: [
    {
      id: "yn1",
      code: "SERIES-01",
      domain: "networking",
      domainLabel: "Networking + Compute",
      title: "Cross-Spoke Connectivity & Private Bastion Access",
      problem: "Northstar has `vnet-hub` (10.0.0.0/16), `vnet-app` (10.1.0.0/16), and `vnet-data` (10.2.0.0/16) in East US. Currently, `vnet-hub` is peered to `vnet-app`, and `vnet-hub` is peered to `vnet-data`. An Azure Firewall (`10.0.10.4`) is deployed inside `vnet-hub`. No VMs have Public IPs.\n\nREQUIRED GOAL: You must ensure `vm-app-01` (in `vnet-app`) can send TCP 1433 traffic to `vm-db-01` (in `vnet-data`) AND allow administrators to SSH into `vm-app-01` through the browser via a single Azure Bastion host in `vnet-hub`.",
      solutions: [
        {
          id: "yn1_s1",
          num: 1,
          proposed: "You deploy Azure Bastion (Standard SKU) into a subnet named `BastionSubnet` (`10.0.5.0/27`) in `vnet-hub`, and you enable 'Allow forwarded traffic' on the existing `vnet-hub <-> vnet-app` and `vnet-hub <-> vnet-data` peerings without adding any Route Tables or direct spoke peering.",
          meetsGoal: false,
          why: "NO — Fails on BOTH counts! (1) Azure Bastion subnet MUST be named `AzureBastionSubnet` with at least a `/26` prefix (not `BastionSubnet` `/27`). (2) Even with 'Allow forwarded traffic' checked, VNet peering is non-transitive — without a User-Defined Route (UDR) pointing `10.2.0.0/16` to the Hub Firewall (`10.0.10.4`) or direct spoke peering, `vnet-app` drops packets to `10.2.0.0/16`!"
        },
        {
          id: "yn1_s2",
          num: 2,
          proposed: "You deploy Azure Bastion into `AzureBastionSubnet` (`10.0.5.0/26`) inside `vnet-hub`. Then you create a direct bidirectional VNet Peering between `vnet-app` and `vnet-data` with 'Allow virtual network access' enabled on both sides.",
          meetsGoal: true,
          why: "YES — Meets both goals! (1) `AzureBastionSubnet` (`/26`) in `vnet-hub` can connect to VMs in directly peered `vnet-app` over private IPs. (2) Creating a direct bidirectional VNet peering between `vnet-app` and `vnet-data` gives `vm-app-01` a direct system route to `10.2.0.0/16`."
        },
        {
          id: "yn1_s3",
          num: 3,
          proposed: "You deploy Azure Bastion into `AzureBastionSubnet` (`10.0.5.0/26`) inside `vnet-hub`. You enable 'Allow forwarded traffic' on the `vnet-app -> vnet-hub` and `vnet-data -> vnet-hub` peerings, and attach Route Tables (UDRs) to `snet-app` and `snet-data` routing cross-spoke traffic to Virtual Appliance `10.0.10.4` (where Azure Firewall allows TCP 1433).",
          meetsGoal: true,
          why: "YES — Also meets both goals! That's the second valid hub-and-spoke pattern: UDRs (`Next Hop = Virtual Appliance 10.0.10.4`) + `Allow forwarded traffic` on the spoke peerings + Hub Bastion in `AzureBastionSubnet` (`/26`)."
        }
      ]
    },
    {
      id: "yn2",
      code: "SERIES-02",
      domain: "identity",
      domainLabel: "Identity & Governance + Storage",
      title: "Lock Precedence & Passwordless Data-Plane Blob Uploads",
      problem: "Storage Account `stnorthstarprod` sits inside Resource Group `rg-northstar-core`. A `ReadOnly` resource lock is currently applied at the `rg-northstar-core` Resource Group scope.\n\nREQUIRED GOAL: `vm-app-01` (running in `rg-northstar-app`) must be able to upload new order JSON blobs into container `orders` on `stnorthstarprod` using its System-Assigned Managed Identity (zero access keys), while still preventing any administrator (even Subscription Owners) from accidentally deleting `stnorthstarprod`.",
      solutions: [
        {
          id: "yn2_s1",
          num: 1,
          proposed: "You assign `vm-app-01`'s System-Assigned Managed Identity the `Contributor` role scoped to `stnorthstarprod`, and leave the `ReadOnly` lock on `rg-northstar-core` unchanged.",
          meetsGoal: false,
          why: "NO — `Contributor` is a Control Plane role and does NOT grant Data Plane permission to upload blobs via Entra ID (`AuthorizationPermissionMismatch`)."
        },
        {
          id: "yn2_s2",
          num: 2,
          proposed: "You change the lock on `rg-northstar-core` from `ReadOnly` to `CanNotDelete`, and assign `vm-app-01`'s System-Assigned Managed Identity the `Storage Blob Data Reader` role on `stnorthstarprod`.",
          meetsGoal: false,
          why: "NO — `CanNotDelete` properly protects the account from deletion (even by Owners), but `Storage Blob Data Reader` only allows reading/downloading blobs, NOT uploading new blobs!"
        },
        {
          id: "yn2_s3",
          num: 3,
          proposed: "You replace the `ReadOnly` lock on `rg-northstar-core` with a `CanNotDelete` lock, and assign `vm-app-01`'s System-Assigned Managed Identity the `Storage Blob Data Contributor` role on `stnorthstarprod`.",
          meetsGoal: true,
          why: "YES — `Storage Blob Data Contributor` grants Entra ID data-plane read/write/delete on blobs, and the `CanNotDelete` lock blocks accidental deletion of the storage account by anyone (including Subscription Owners) without blocking normal operations!"
        }
      ]
    },
    {
      id: "yn3",
      code: "SERIES-03",
      domain: "compute",
      domainLabel: "Compute + Monitor",
      title: "High-Availability SLA & Maintenance Window Alert Suppression",
      problem: "Northstar runs a mission-critical API on Azure Virtual Machines in East US and monitors them with 18 Azure Monitor Metric and Log Search alert rules connected to Action Group `ag-ops-pager`.\n\nREQUIRED GOAL: You must achieve at least a **99.99% VM uptime SLA** to survive a complete single-datacenter power/cooling failure inside East US, AND you must stop `ag-ops-pager` from sending alert notifications every Sunday from 02:00 to 04:00 AM during scheduled OS patching without disabling the 18 alert rules.",
      solutions: [
        {
          id: "yn3_s1",
          num: 1,
          proposed: "You deploy 2 VMs inside an Availability Set (`3 Fault Domains, 5 Update Domains`) in East US, and you create an Alert Processing Rule scoped to the Resource Group configured to 'Suppress notifications' on a recurring Sunday 02:00–04:00 schedule.",
          meetsGoal: false,
          why: "NO — While the Alert Processing Rule correctly suppresses Sunday 02:00–04:00 notifications, an **Availability Set** only protects against rack/hardware failures inside a single datacenter and only provides a **99.95% SLA** (not 99.99% across a datacenter outage!)."
        },
        {
          id: "yn3_s2",
          num: 2,
          proposed: "You deploy 2+ VMs pinned across **Availability Zones 1 and 2** in East US behind a Standard Zone-Redundant Load Balancer, and you create an **Alert Processing Rule** scoped to the Resource Group configured to 'Suppress notifications' every Sunday from 02:00 to 04:00 AM.",
          meetsGoal: true,
          why: "YES — 2+ VMs deployed across **Availability Zones** span physically separate datacenters with independent power/cooling/networking (**99.99% SLA**), and an **Alert Processing Rule** suppresses notifications on a recurring maintenance schedule without touching the 18 alert rules!"
        },
        {
          id: "yn3_s3",
          num: 3,
          proposed: "You deploy 2+ VMs across Availability Zones 1 and 2 in East US, and you configure a Diagnostic Setting on the Log Analytics Workspace to pause log ingestion every Sunday from 02:00 to 04:00 AM.",
          meetsGoal: false,
          why: "NO — Diagnostic Settings cannot 'pause on a schedule', and Metric Alerts evaluate platform metrics directly without Log Analytics ingestion. You must use an **Alert Processing Rule** to suppress notifications during maintenance windows!"
        }
      ]
    }
  ],

  // ---------------------------------------------------------------------------
  // 4. EIGHT HIGH-YIELD AZ-104 DECISION MATRICES (WITH ACTIVE-RECALL CELLS)
  // Cells wrapped in `[[...]]` become interactive click-to-reveal flash cells
  // when "Active Recall Blank-Out Mode" is enabled!
  // ---------------------------------------------------------------------------
  DECISION_MATRICES: [
    {
      id: "mat1",
      domain: "identity",
      domainLabel: "Identity & Gov (20–25%)",
      title: "1. Control Plane RBAC vs Data Plane RBAC vs Locks",
      subtitle: "The #1 most-tested governance distinction on AZ-104: who can manage resources vs RBAC vs data vs locks.",
      headers: ["Role / Guardrail", "Plane / Scope", "What It CAN Do", "Critical Exam Trap (What It CANNOT Do)"],
      rows: [
        ["Owner", "Control Plane", "Full resource management + [[can assign RBAC roles & delete Resource Locks]]", "[[Blocked by CanNotDelete / ReadOnly locks]] until Owner removes the lock first; [[does NOT grant Entra ID Data Plane blob/file access]]"],
        ["Contributor", "Control Plane", "Create, update, and delete all resources", "[[CANNOT assign RBAC roles]] (no `Microsoft.Authorization/*/write`) and [[CANNOT delete Resource Locks]]"],
        ["User Access Administrator", "Control Plane (RBAC)", "[[Assign/remove RBAC roles and delete Resource Locks]]", "[[Cannot create, modify, or delete VMs/Storage resources]] (pair with Contributor for least-privilege lead dev)"],
        ["Storage Blob Data Contributor", "[[Data Plane]]", "[[Read, write, and delete blobs/containers via Entra ID / Managed Identity]]", "Cannot change Storage Account firewall, rotate account keys, or delete the Storage Account"],
        ["Storage File Data SMB Share Contributor", "[[Data Plane (Files)]]", "[[Read, write, and delete files/folders in Azure Files over SMB using Entra/AD auth]]", "Needs `...Elevated Contributor` to modify Windows NTFS ACLs/permissions"],
        ["ReadOnly Resource Lock", "ARM Control Plane Gate", "Allows only HTTP `GET` read operations on the scope", "[[Blocks `listKeys` on Storage Accounts]] (because listing keys is an HTTP `POST` operation!) and blocks moving resources"]
      ]
    },
    {
      id: "mat2",
      domain: "storage",
      domainLabel: "Storage (15–20%)",
      title: "2. Storage Redundancy, Durability & Access Tiers Matrix",
      subtitle: "Know exact nines, zone vs region protection, and early-deletion days for Cool, Cold, and Archive.",
      headers: ["Option / Tier", "Copies & Locations", "Durability / Availability Note", "Exam Rule & Conversion / Retrieval Trap"],
      rows: [
        ["LRS (Locally Redundant)", "[[3 synchronous copies in 1 datacenter]]", "11 nines (99.999999999%)", "Cheapest; does NOT survive a datacenter fire/flood; [[cannot enable Read-Access secondary]]"],
        ["ZRS (Zone-Redundant)", "[[3 synchronous copies across 3 Availability Zones in 1 region]]", "12 nines (99.9999999999%)", "Survives a full datacenter outage in primary region; [[switching LRS <-> ZRS requires a live migration / manual copy]]"],
        ["GRS / RA-GRS", "[[3 copies in Primary (LRS) + 3 async copies in Paired Secondary region]]", "16 nines", "[[RA-GRS]] is required if you need to read from `<account>-secondary.blob...` BEFORE Microsoft/you initiate a failover!"],
        ["GZRS / RA-GZRS", "[[3 Availability Zones in Primary + 3 async copies in Paired Secondary]]", "16 nines (Maximum resilience)", "Recommended for mission-critical enterprise workloads needing both zone + regional DR"],
        ["Cool vs Cold Tier", "Online Access Tiers", "Min retention: [[Cool = 30 days • Cold = 90 days]]", "Lower storage cost per GB, higher read/transaction cost; [[immediately readable online (zero rehydration delay)]]"],
        ["Archive Tier", "[[Offline Access Tier]]", "Min retention: [[180 days]] (supported on LRS/GRS/RA-GRS, [[NOT supported on ZRS/GZRS]])", "[[Cannot be read or downloaded directly!]] Must rehydrate to Hot/Cool first ([[Standard <15h or High <1h priority]])"]
      ]
    },
    {
      id: "mat3",
      domain: "storage",
      domainLabel: "Storage (15–20%)",
      title: "3. SAS Tokens, Stored Access Policies & Storage Networking",
      subtitle: "How to choose between the 3 SAS types, revoke tokens without downtime, and wire Private Endpoints.",
      headers: ["Feature", "Signed / Secured By", "Supported Services", "Key Exam Rule"],
      rows: [
        ["User Delegation SAS", "[[Microsoft Entra ID credentials]]", "[[Blob Storage & ADLS Gen2 only]]", "[[Most secure SAS type]] (Microsoft recommended); survives Storage Account Key rotation!"],
        ["Service SAS", "[[Storage Account Access Key (Key 1 or Key 2)]]", "Single service only (Blob, Queue, Table, or Files)", "To revoke early without rotating account keys, [[bind it to a Stored Access Policy (max 5 per container/share)]]"],
        ["Account SAS", "[[Storage Account Access Key (Key 1 or Key 2)]]", "[[One or MORE services (Blob + Files + Queue + Table)]]", "Required for service-level operations (like creating containers/shares) or multi-service tokens; [[cannot use a Stored Access Policy]]"],
        ["Service Endpoint", "VNet Route over Microsoft Backbone", "PaaS still uses its [[Public IP address]]", "Fast/free to enable on a subnet; [[does NOT work from on-premises over VPN/ExpressRoute]]"],
        ["Private Endpoint", "Private NIC inside your VNet subnet", "Assigns a real [[Private IP (e.g., 10.2.1.4)]] from your subnet", "Accessible across peered VNets & on-prem VPN/ER; requires [[Private DNS Zone `privatelink.blob.core.windows.net`]] linked to caller VNets"]
      ]
    },
    {
      id: "mat4",
      domain: "compute",
      domainLabel: "Compute (20–25%)",
      title: "4. App Service Plan SKU Tiers & Slot Swap Behavior",
      subtitle: "Memorize the Basic -> Standard tier jump and which settings swap vs stay pinned during a deployment slot swap.",
      headers: ["App Service Tier / Concept", "Max Instances & Scale", "Deployment Slots & Backups", "Critical Exam Trap"],
      rows: [
        ["Free (F1) / Shared (D1)", "Shared VM instances (no scale out)", "[[0 slots • No backups]]", "F1 has 60 CPU min/day quota; D1 supports custom domains but [[NO SSL/TLS certificates]]"],
        ["Basic (B1–B3)", "Up to [[3 dedicated instances (Manual scale only)]]", "[[0 slots • No automated backups]]", "Supports Custom Domains + SSL and Regional VNet Integration, but [[NO Deployment Slots and NO Autoscale]]"],
        ["Standard (S1–S3)", "Up to [[10 instances (Autoscale supported)]]", "[[Up to 5 Deployment Slots]] • Daily Backups (up to 10/day)", "[[Minimum tier for Deployment Slots, Autoscale, and Automated Backups!]]"],
        ["Premium (P1v3–P3v3)", "Up to [[30 instances (Autoscale)]]", "[[Up to 20 Deployment Slots]] • 50 backups/day", "Faster hardware, more slots, higher memory/instance limits"],
        ["Slot Swap: SWAPS with Code", "Moves from Staging → Production", "App code, [[non-sticky App Settings & Connection Strings]], language version, handler mappings", "If a DB string is NOT marked 'Deployment slot setting', [[swapping overwrites Production with the Staging DB!]]"],
        ["Slot Swap: STAYS PINNED", "Never moves during a swap", "[[Custom Domains, TLS/SSL certs, Scale settings, Always On, VNet Integration, Managed Identity, Slot-Sticky settings]]", "Mark environment-specific settings as [[Deployment slot setting (`--slot-settings`)]] so they stay pinned"]
      ]
    },
    {
      id: "mat5",
      domain: "compute",
      domainLabel: "Compute (20–25%)",
      title: "5. VM Availability SLAs, VM Moves & Container Services (ACI vs ACA vs ACR)",
      subtitle: "Exact uptime SLAs, Availability Set vs Zone rules, and when to pick ACI vs Azure Container Apps.",
      headers: ["Service / Architecture", "Uptime SLA / Scope", "Key Capabilities", "Exam Decision Rule"],
      rows: [
        ["Single VM", "[[99.9% (Premium SSD / Ultra)]] • 99.5% (Standard SSD)", "Standalone VM in 1 datacenter", "No high availability during host maintenance or rack failure"],
        ["Availability Set (2+ VMs)", "[[99.95% SLA]] (Single Datacenter)", "Up to [[3 Fault Domains (racks) & 20 Update Domains]]", "[[Must be assigned at VM creation time!]] To add an existing VM: [[delete VM (keep disks) and recreate inside the Set]]"],
        ["Availability Zones (2+ VMs)", "[[99.99% SLA]] (Separate Datacenters in 1 Region)", "Zones 1, 2, 3 have independent power, cooling & networking", "Requires [[Standard SKU Public IP & Standard Load Balancer]] for zone-redundant front door"],
        ["Azure Container Instances (ACI)", "Per-second billing, Pod/Container Group", "Restart policies: [[`Always` (default), `OnFailure` (batch jobs), `Never`]]", "Best for simple isolated containers/batch jobs; [[Azure Files SMB mount only supported on Linux containers]]"],
        ["Azure Container Apps (ACA)", "Serverless Microservices (on AKS/KEDA)", "[[Scale-to-zero (`minReplicas: 0`)]], HTTP ingress, traffic-splitting revisions, Dapr", "Choose ACA whenever the exam asks for [[HTTP traffic splitting, KEDA event scaling, or scale-to-zero without managing Kubernetes]]"],
        ["Azure Container Registry (ACR)", "Basic / Standard / [[Premium]] SKUs", "Stores private Docker/OCI images", "[[Premium SKU]] is required for [[Geo-Replication, Private Endpoints, and Content Trust]]"]
      ]
    },
    {
      id: "mat6",
      domain: "networking",
      domainLabel: "Networking (15–20%)",
      title: "6. VNet Peering, Routing Precedence, Load Balancer & Bastion Rules",
      subtitle: "The core networking laws: -5 reserved IPs, 4 peering flags, route selection tie-breaker, and Bastion /26.",
      headers: ["Networking Topic", "Exact Rule / Formula", "Required Configuration", "Exam Gotcha"],
      rows: [
        ["Azure Subnet IP Math", "[[Total IPs (2^(32-prefix)) minus 5 reserved IPs]]", "`.0` (Network), `.1` (Gateway), `.2` & `.3` (Azure DNS), `.255` (Broadcast)", "A `/29` (8 IPs) has only [[3 usable IPs]]; `GatewaySubnet` min `/29` (rec `/27`); [[`AzureBastionSubnet` min `/26`]]"],
        ["VNet Peering", "[[Strictly Non-Transitive (A↔B + B↔C ≠ A↔C)]]", "Must be created on [[BOTH VNets]] to reach `Connected`; zero CIDR overlap allowed", "To route Spoke A → Hub NVA → Spoke B: check [[`Allow forwarded traffic`]] on spoke peerings + attach [[UDRs (`Next Hop: Virtual Appliance`)]]"],
        ["Peering Gateway Transit", "Share 1 Hub VPN/ER Gateway with Spokes", "On Hub peering: check [[`Allow gateway transit`]] • On Spoke peering: check [[`Use remote gateways`]]", "Spoke VNet [[cannot already have its own Virtual Network Gateway]] if `Use remote gateways` is checked!"],
        ["Route Selection Order", "[[1. Longest Prefix Match]] (`/25` beats `/24`)", "On an exact prefix-length tie: [[2. UDR > 3. BGP > 4. System route]]", "Next Hop = `None` creates a blackhole that drops matching traffic"],
        ["Standard Load Balancer", "Layer 4 (TCP/UDP) • [[Closed by default]]", "Requires [[Standard Public IP]], explicit NSG Allow rule, and Health Probe (`TCP`, `HTTP`, or `HTTPS`)", "Custom NSG `DenyAll` rules (< 65001) block health probes unless you add an explicit Allow for service tag [[`AzureLoadBalancer` (`168.63.129.16`)]]"],
        ["Azure Bastion SKUs", "Subnet: [[`AzureBastionSubnet` (`/26` or larger)]]", "Basic vs [[Standard / Premium]] SKU", "[[Standard SKU]] is required for [[Native SSH/RDP client connections (`az network bastion ssh`), file transfer, and custom inbound ports]]"]
      ]
    },
    {
      id: "mat7",
      domain: "monitor",
      domainLabel: "Monitor & Backup (10–15%)",
      title: "7. Azure Backup vs Azure Site Recovery (ASR) & Vault Matrix",
      subtitle: "Never mix up Recovery Services Vault vs Azure Backup Vault or Same-Region vs Target-Region placement.",
      headers: ["Capability", "Recovery Services Vault (RSV)", "Azure Backup Vault", "Azure Site Recovery (ASR)"],
      rows: [
        ["Protected Workloads", "[[Azure VMs, Azure File Shares, SQL/SAP in Azure VMs, On-Prem MARS/MABS]]", "[[Azure Blobs, Azure Managed Disks, AKS, Azure Database for PostgreSQL]]", "[[Azure VMs (cross-region DR) & VMware/Hyper-V on-prem VMs]]"],
        ["Required Vault Region", "[[SAME Region]] as the protected VM or Storage Account", "[[SAME Region]] as the Disk or Storage Account", "[[TARGET (Secondary/Failover) Region!]] (So vault stays alive if source region dies)"],
        ["Restore / Failover Tiers", "[[Tier 1: Instant Restore Snapshots (1–5 days Standard / up to 30d Enhanced)]] → Tier 2: Vault", "Operational backup (local snapshots) + Vaulted backup (off-host)", "Continuous disk replication via [[Mobility Service extension]] → RPO in seconds/minutes"],
        ["Soft Delete Protection", "[[Retains deleted backup data for 14 days]] (default/always-on)", "Supports Soft Delete & Immutability", "To delete a lab RSV immediately: [[Disable Soft Delete → Undelete items → Permanently delete backup data → Delete vault]]"]
      ]
    },
    {
      id: "mat8",
      domain: "monitor",
      domainLabel: "Monitor & Backup (10–15%)",
      title: "8. Azure Monitor Alerts & Network Watcher Diagnostic Tool Matrix",
      subtitle: "Pick the exact alert type or Network Watcher tool in under 10 seconds on the exam.",
      headers: ["Tool / Alert Type", "What Question It Answers", "How It Works", "Classic Exam Scenario"],
      rows: [
        ["Metric Alert", "Is a numeric metric (CPU, Network In, Queue Depth) over threshold?", "Evaluates platform/custom metrics every 1–5 min (Stateless)", "Fastest near-real-time alert when `Percentage CPU > 85%` on a VM or VMSS"],
        ["Log Search Alert", "Did a [[KQL query]] over Log Analytics return N rows?", "Runs scheduled KQL query against `law-northstar` tables (Stateful/Stateless)", "Alert when 5+ HTTP 500 errors or specific Windows/Linux syslog events appear in logs"],
        ["Activity Log Alert", "Did a [[Control-Plane ARM operation or Service Health event]] happen?", "Evaluates free 90-day Azure Activity Log events", "Alert when someone [[deletes a Resource Lock, creates a VM, or when an Azure regional outage hits Service Health]]"],
        ["Alert Processing Rule", "How do we [[silence alerts during a maintenance window]] at scale?", "Applies above alert rules to [[Suppress notifications]] or add Action Groups on a schedule", "[[Silence all 25 alert emails every Sunday 02:00–04:00 AM]] without disabling the alert rules!"],
        ["Network Watcher: IP Flow Verify", "[[Which exact NSG rule allowed or blocked a 5-tuple packet?]]", "Tests simulated TCP/UDP packet against effective Subnet + NIC NSGs", "Instant diagnosis when a VM cannot reach port 443 or 80"],
        ["Network Watcher: Next Hop", "[[Which route / UDR is steering traffic for destination IP X?]]", "Evaluates effective routes on a VM NIC", "Pinpoints when a custom UDR (`Next Hop: None` or wrong NVA IP) is blackholing traffic"]
      ]
    }
  ],

  // ---------------------------------------------------------------------------
  // 5. SPRINT EXIT CHECKPOINTS (2 ACTIVE-RECALL QUESTIONS PER TOPIC GUIDE)
  // Verifies real comprehension before locking in a daily study guide sprint!
  // ---------------------------------------------------------------------------
  TOPIC_CHECKPOINTS: {
    w1_identities: [
      {
        id: "cp_w1_1",
        domain: "identity",
        q: "Before you can assign a Microsoft Entra ID P1 license to a new user or add them to a Dynamic User group, what user property MUST be populated?",
        options: ["Job Title & Manager", "Usage location (e.g., United States)", "Employee Hire Date", "Secondary Recovery Email"],
        answer: 1,
        why: "Microsoft Entra ID requires **Usage location** to be set on a user before any license can be assigned (because available services/compliance vary by country)."
      },
      {
        id: "cp_w1_2",
        domain: "identity",
        q: "Which bulk operation format does Microsoft Entra ID use in the portal to create or invite 50 users at once?",
        options: ["A Bicep `.bicep` deployment file", "An ARM template `.json` file", "A comma-separated values (`.csv`) template file", "An XML SAML manifest"],
        answer: 2,
        why: "Entra ID bulk user creation/invitation/deletion in the portal uses a downloadable **CSV template**."
      }
    ],
    w1_rbac_locks: [
      {
        id: "cp_w1_3",
        domain: "identity",
        q: "A `ReadOnly` lock is placed on a Resource Group containing a Storage Account. Why do applications that authenticate via Azure CLI `az storage account keys list` suddenly fail?",
        options: [
          "ReadOnly locks disable the Storage Account firewall.",
          "Listing Storage Account keys is an ARM HTTP `POST` operation, which is blocked by a `ReadOnly` lock.",
          "ReadOnly locks revoke all active Microsoft Entra ID tokens.",
          "ReadOnly locks automatically move all blobs into the Archive tier."
        ],
        answer: 1,
        why: "`listKeys` is a `POST` request in Azure Resource Manager because it returns sensitive credentials; `ReadOnly` locks block all `POST`, `PUT`, `PATCH`, and `DELETE` control-plane calls!"
      },
      {
        id: "cp_w1_4",
        domain: "identity",
        q: "Which role combination follows least privilege for a team lead who needs to deploy resources in `rg-app` AND grant `Reader` access to new developers?",
        options: [
          "Global Administrator at the tenant root",
          "Contributor + User Access Administrator scoped to `rg-app`",
          "Reader + Storage Blob Data Owner scoped to `rg-app`",
          "Contributor alone (Contributor includes RBAC assignment rights)"
        ],
        answer: 1,
        why: "`Contributor` cannot assign RBAC roles; pairing it with `User Access Administrator` (or using `Owner`) at `rg-app` scope grants RBAC delegation."
      }
    ],
    w1_policy: [
      {
        id: "cp_w1_5",
        domain: "identity",
        q: "You apply tag `Dept=Finance` to Resource Group `rg-finance`. What tags do VMs inside `rg-finance` receive by default?",
        options: [
          "They automatically inherit `Dept=Finance` within 5 minutes.",
          "None — tags do NOT inherit automatically from a Resource Group; you must use an Azure Policy (`Modify` effect) to inherit tags.",
          "They inherit tags only if a `CanNotDelete` lock is enabled on the RG.",
          "They inherit tags only when deployed via Bicep."
        ],
        answer: 1,
        why: "Unlike RBAC, Locks, and Policy (which inherit downward), **Tags do NOT inherit automatically** — use the built-in Azure Policy 'Inherit a tag from the resource group'."
      },
      {
        id: "cp_w1_6",
        domain: "identity",
        q: "What is the maximum number of Management Group hierarchy levels supported (excluding the Root Management Group and the Subscription level)?",
        options: ["2 levels", "6 levels", "15 levels", "Unlimited levels"],
        answer: 1,
        why: "Azure supports up to **6 levels** of Management Groups beneath the Tenant Root Group."
      }
    ],
    w2_vnets_peering: [
      {
        id: "cp_w2_1",
        domain: "networking",
        q: "You carve a `/26` subnet (`10.0.3.0/26`) in `vnet-hub`. How many usable IP addresses remain after Azure's reserved IPs?",
        options: ["62 usable IPs (64 - 2)", "59 usable IPs (64 - 5)", "27 usable IPs (32 - 5)", "64 usable IPs"],
        answer: 1,
        why: "`/26` provides $2^{32-26} = 64$ total IPs, minus **5 Azure-reserved IPs** (`.0`, `.1`, `.2`, `.3`, and `.63` broadcast) = **59 usable IPs**."
      },
      {
        id: "cp_w2_2",
        domain: "networking",
        q: "Hub VNet has a VPN Gateway connected to on-premises. What TWO peering checkboxes allow Spoke VMs to use the Hub's VPN Gateway without deploying a second gateway in the Spoke?",
        options: [
          "`Allow gateway transit` on the Hub peering AND `Use remote gateways` on the Spoke peering",
          "`Use remote gateways` on the Hub peering AND `Allow gateway transit` on the Spoke peering",
          "`Allow virtual network access` on both sides only",
          "`Disable BGP route propagation` on both sides"
        ],
        answer: 0,
        why: "The VNet *with* the gateway (Hub) checks **`Allow gateway transit`**; the VNet *borrowing* the gateway (Spoke) checks **`Use remote gateways`**!"
      }
    ],
    w2_nsg_udr: [
      {
        id: "cp_w2_3",
        domain: "networking",
        q: "In what exact order are Network Security Groups evaluated for OUTBOUND traffic leaving a VM?",
        options: [
          "Subnet NSG first → NIC NSG second",
          "NIC NSG first → Subnet NSG second",
          "Only the Subnet NSG is evaluated on outbound traffic",
          "Rules from both NSGs are merged into one list by priority number"
        ],
        answer: 1,
        why: "Follow the packet physically! **Inbound** hits **Subnet NSG → NIC NSG**. **Outbound** leaves the VM through **NIC NSG → Subnet NSG**. Both must allow the packet!"
      },
      {
        id: "cp_w2_4",
        domain: "networking",
        q: "Why do Azure administrators use Application Security Groups (ASGs) inside NSG rules?",
        options: [
          "To encrypt traffic between VMs using mutual TLS automatically",
          "To group VM NICs logically by workload role (e.g., `asg-web`, `asg-db`) instead of hardcoding IP addresses in NSG rules",
          "To bypass the 2-gate Subnet + NIC NSG evaluation rule",
          "To replace User-Defined Route tables across peered VNets"
        ],
        answer: 1,
        why: "ASGs let you tag VM NICs as `asg-web` or `asg-db` and write clean NSG rules (`Source: asg-web → Dest: asg-db:1433`) inside a single VNet without managing IP lists."
      }
    ],
    w3_storage_core: [
      {
        id: "cp_w3_1",
        domain: "storage",
        q: "Which Storage Account redundancy option allows your application to read from the secondary region (`<account>-secondary.blob.core.windows.net`) at any time, even when the primary region is completely healthy?",
        options: ["LRS", "ZRS", "GRS", "RA-GRS (or RA-GZRS)"],
        answer: 3,
        why: "Standard `GRS`/`GZRS` only exposes the secondary copy if you/Microsoft execute a storage failover. **`RA-GRS` / `RA-GZRS`** (Read-Access) exposes the `-secondary` endpoint 24/7 for read queries!"
      },
      {
        id: "cp_w3_2",
        domain: "storage",
        q: "What happens if a Lifecycle Management rule moves a blob to the `Archive` tier on Day 1, and you delete or rehydrate that blob to `Hot` on Day 40?",
        options: [
          "Azure blocks the operation until 180 days have elapsed.",
          "The operation succeeds (after rehydration), but you are charged a prorated early-deletion fee for the remaining 140 days (180 - 40).",
          "There is no early-deletion fee as long as the blob stayed for 30 days.",
          "The blob is permanently corrupted."
        ],
        answer: 1,
        why: "Archive tier has a **180-day minimum retention period** (Cool = 30d, Cold = 90d). Moving or deleting early incurs a prorated early-deletion charge for the remaining days."
      }
    ],
    w3_storage_security: [
      {
        id: "cp_w3_3",
        domain: "storage",
        q: "You disabled Public Network Access on `stnorthstar01` and created a Private Endpoint for `blob` in `vnet-data`. Why does `vm-app-01` (in peered `vnet-app`) still fail to connect to `stnorthstar01.file.core.windows.net`?",
        options: [
          "Each Storage sub-resource (`blob`, `file`, `queue`, `table`) requires its OWN separate Private Endpoint and Private DNS Zone (`privatelink.file.core.windows.net`).",
          "Private Endpoints do not support Azure Files.",
          "You must enable Anonymous Blob Public Access.",
          "Private Endpoints only work with Basic SKU Load Balancers."
        ],
        answer: 0,
        why: "A Private Endpoint targets ONE specific sub-resource (`groupId: blob` vs `file`). To access Azure Files privately, you need a `file` Private Endpoint and `privatelink.file.core.windows.net`!"
      },
      {
        id: "cp_w3_4",
        domain: "storage",
        q: "What is the maximum number of Stored Access Policies you can configure on a single Blob container or Azure File Share?",
        options: ["1 policy", "5 policies", "20 policies", "Unlimited policies"],
        answer: 1,
        why: "Each Blob container, File share, Queue, or Table supports a maximum of **5 Stored Access Policies**."
      }
    ],
    w4_bicep_vms: [
      {
        id: "cp_w4_1",
        domain: "compute",
        q: "In an ARM or Bicep deployment, what is the dangerous difference between `Incremental` deployment mode (default) and `Complete` deployment mode?",
        options: [
          "`Complete` mode deletes any existing resources in the Resource Group that are NOT specified in the template!",
          "`Incremental` mode deletes existing resources in the Resource Group before deploying.",
          "`Complete` mode can only be run at the Tenant Root Management Group.",
          "`Incremental` mode does not allow modifying existing resources."
        ],
        answer: 0,
        why: "**`Complete` mode** DELETES existing resources in the target Resource Group that aren't present in the template! **`Incremental` mode** (the default) leaves unmentioned resources untouched."
      },
      {
        id: "cp_w4_2",
        domain: "compute",
        q: "You have 4 VMs that all need the exact same Entra ID identity and permissions to read from `stnorthstar01`. Which identity type minimizes RBAC management overhead?",
        options: [
          "4 separate System-Assigned Managed Identities",
          "1 User-Assigned Managed Identity attached to all 4 VMs",
          "1 Storage Account Access Key pasted into a startup script",
          "An Entra ID B2B Guest User account"
        ],
        answer: 1,
        why: "A **User-Assigned Managed Identity** has an independent lifecycle and can be shared across multiple VMs/App Services with a single RBAC role assignment."
      }
    ],
    w4_vm_scale_ha: [
      {
        id: "cp_w4_3",
        domain: "compute",
        q: "You want to move `vm-app-01` from East US to West US 2. Which Azure tool is used to move VMs across **Regions** (as opposed to moving across Resource Groups or Subscriptions)?",
        options: [
          "Standard Portal 'Move' button (`az resource move`)",
          "Azure Resource Mover",
          "AzCopy",
          "Azure Storage Explorer"
        ],
        answer: 1,
        why: "Standard Portal `Move` moves resources across Resource Groups or Subscriptions (within the same tenant); moving VMs across **Regions** requires **Azure Resource Mover**!"
      },
      {
        id: "cp_w4_4",
        domain: "compute",
        q: "When configuring VMSS Custom Autoscale, why must you always pair a Scale-Out rule (e.g., `CPU > 75% → +1 instance`) with a Scale-In rule (`CPU < 25% → -1 instance`)?",
        options: [
          "Without a Scale-In rule, the VMSS scales out during peak load and never scales back down, burning money 24/7.",
          "Azure blocks saving any Autoscale profile that doesn't have at least 4 rules.",
          "Scale-In rules are required to unlock Availability Zones.",
          "Without a Scale-In rule, the Load Balancer health probes stop working."
        ],
        answer: 0,
        why: "Classic exam scenario: if a VMSS scales out to 10 instances during a traffic spike and has no Scale-In rule, it stays at 10 instances permanently even when CPU drops to 2%!"
      }
    ],
    w5_app_service: [
      {
        id: "cp_w5_1",
        domain: "compute",
        q: "An App Service Web App needs to query a SQL VM (`10.2.1.15`) inside your private VNet, and also needs to block all public internet callers from hitting the Web App itself. Which TWO features do you configure?",
        options: [
          "Regional VNet Integration (for outbound calls to `10.2.1.15`) AND Private Endpoint / Access Restrictions (for inbound calls to the Web App)",
          "Private Endpoint only (handles both inbound and outbound traffic automatically)",
          "Deployment Slots AND Always On",
          "Hybrid Connections AND Custom Domains"
        ],
        answer: 0,
        why: "Crucial App Service Networking distinction: **VNet Integration** is for **OUTBOUND** traffic from the Web App into a VNet; **Private Endpoints / Access Restrictions** control **INBOUND** traffic to the Web App!"
      },
      {
        id: "cp_w5_2",
        domain: "compute",
        q: "What is the maximum backup size for an App Service automated/custom backup (including app files + linked database)?",
        options: ["1 GB", "10 GB", "500 GB", "4 TB"],
        answer: 1,
        why: "App Service Backups require **Standard, Premium, or Isolated** tiers, a destination Storage Account container, and have a **10 GB** maximum backup size limit."
      }
    ],
    w5_containers: [
      {
        id: "cp_w5_3",
        domain: "compute",
        q: "You try to mount an Azure File Share as a persistent volume on a **Windows** container in Azure Container Instances (ACI), and deployment fails. Why?",
        options: [
          "Azure File Share volume mounts in ACI are ONLY supported on Linux containers (and require a Standard storage account).",
          "ACI only supports mounting Azure File Shares over NFS on Windows containers.",
          "Windows containers require an Isolated App Service Plan.",
          "You must enable Hierarchical Namespace first."
        ],
        answer: 0,
        why: "Exact Microsoft Learn ACI limitation: mounting an Azure File Share in ACI is restricted to **Linux containers**!"
      },
      {
        id: "cp_w5_4",
        domain: "compute",
        q: "Which Azure Container Registry (ACR) SKU is the MINIMUM required if you need **Geo-Replication** across multiple regions or a **Private Endpoint**?",
        options: ["Basic", "Standard", "Premium", "Enterprise"],
        answer: 2,
        why: "**Premium** ACR is required for Geo-replication, Private Endpoints, Content Trust, and customer-managed key encryption."
      }
    ],
    w6_lb_bastion_dns: [
      {
        id: "cp_w6_1",
        domain: "networking",
        q: "You link `vnet-app` to 3 Private DNS Zones: `northstar.internal`, `privatelink.blob.core.windows.net`, and `privatelink.file.core.windows.net`. On how many of those 3 zones can `vnet-app` enable **Auto-registration** of VM A-records?",
        options: [
          "All 3 Private DNS Zones",
          "Only 1 Private DNS Zone (`northstar.internal`) — a VNet can link to many zones for resolution, but Auto-registration can only be enabled on ONE zone per VNet!",
          "0 — Auto-registration requires Public DNS Zones",
          "Up to 2 Private DNS Zones"
        ],
        answer: 1,
        why: "High-frequency DNS limit: a VNet can link to up to 1,000 Private DNS Zones for name resolution, but can enable **VM Auto-registration on at most 1 Private DNS Zone**!"
      },
      {
        id: "cp_w6_2",
        domain: "networking",
        q: "VMs behind an Internal Standard Load Balancer (with no Public IPs on the VMs) suddenly cannot reach `packages.ubuntu.com` on the outbound internet. Why?",
        options: [
          "Internal Load Balancers have no public frontend IP, and Standard SKU VMs do NOT get default outbound internet access — assign a NAT Gateway (or Public LB outbound rule / VM Public IP).",
          "Internal Load Balancers block TCP port 80 outbound by default.",
          "You must switch the VMs from Standard SSD to Premium SSD.",
          "Azure DNS blocks Ubuntu repositories unless BGP is enabled."
        ],
        answer: 0,
        why: "Standard SKU is secure-by-default: VMs behind an **Internal** Standard LB without a Public IP or **Azure NAT Gateway** (or a Public LB with outbound rules) have **NO outbound internet access**!"
      }
    ],
    w7_monitor_watcher: [
      {
        id: "cp_w7_1",
        domain: "monitor",
        q: "How long does the free Azure Activity Log retain control-plane events before you must export them via Diagnostic Settings to Log Analytics or Blob Storage?",
        options: ["7 days", "30 days", "90 days", "365 days"],
        answer: 2,
        why: "Azure Activity Log retains events for **90 days** at no cost; for >90 days or KQL querying, export via a Diagnostic Setting to a Log Analytics Workspace or Storage Account."
      },
      {
        id: "cp_w7_2",
        domain: "monitor",
        q: "Which modern agent + configuration object replaced the legacy Log Analytics MMA/OMS agent for collecting guest OS logs and performance counters from Azure VMs?",
        options: [
          "Azure Monitor Agent (AMA) configured with Data Collection Rules (DCRs)",
          "Network Watcher Agent with NSG Flow Logs v1",
          "Mobility Service Agent with Recovery Plans",
          "Entra Connect Sync Agent"
        ],
        answer: 0,
        why: "**Azure Monitor Agent (AMA)** paired with **Data Collection Rules (DCRs)** is Microsoft's current architecture for collecting VM guest telemetry into Log Analytics and Azure Monitor Metrics."
      }
    ],
    w7_backup_asr: [
      {
        id: "cp_w7_3",
        domain: "monitor",
        q: "During a VM backup using the Standard backup policy, where are the **Instant Restore** snapshots kept for fast recovery, and what is their configurable retention range?",
        options: [
          "Stored alongside the VM disks in the operational tier for 1 to 5 days (default 2 days) before relying solely on the Recovery Services Vault tier",
          "Stored in the Archive Blob tier for 180 days",
          "Stored inside Entra ID for 14 days",
          "Stored only in the secondary paired region for 90 days"
        ],
        answer: 0,
        why: "Phase 1 takes an **Instant Restore snapshot** stored locally alongside the disks (retained **1–5 days** on Standard policy, up to 30 days on Enhanced) for rapid restore; Phase 2 transfers it into the **Vault tier**."
      },
      {
        id: "cp_w7_4",
        domain: "monitor",
        q: "After an Azure Site Recovery (ASR) failover to West US 2 is committed, users are running against the West US 2 VMs. What action MUST you click in the vault so changes in West US 2 start replicating back to East US?",
        options: ["Cleanup test failover", "Reprotect", "Disable Soft Delete", "Create Snapshot"],
        answer: 1,
        why: "After **Failover → Commit**, the secondary VMs are live but unprotected! Clicking **Reprotect** reverses replication direction from secondary back to primary so you can later **Failback**."
      }
    ],
    w8_exam_mastery: [
      {
        id: "cp_w8_1",
        domain: "compute",
        q: "During the real AZ-104 exam, what happens when you click 'Finish Case Study' or advance past a 'Locked Yes/No Scenario Series' question?",
        options: [
          "You can freely return to edit those answers at the very end of the 100-minute exam.",
          "Those questions lock permanently — you CANNOT return to a Case Study once exited or go back to a previous Yes/No Series screen!",
          "The exam clock pauses while you review your answers.",
          "Microsoft Learn opens automatically."
        ],
        answer: 1,
        why: "Exam-day discipline: Case Studies are self-contained locked sections, and Yes/No Scenario Series screens lock immediately upon clicking Next!"
      },
      {
        id: "cp_w8_2",
        domain: "monitor",
        q: "When you open the built-in Microsoft Learn tab during the live AZ-104 exam to verify a SKU table, what happens to your exam countdown timer?",
        options: [
          "The exam timer keeps ticking (no extra time is added for open-book lookups).",
          "The timer pauses for up to 5 minutes per lookup.",
          "You get 30 bonus minutes added automatically.",
          "Using Microsoft Learn deducts 20 points from your scaled score."
        ],
        answer: 0,
        why: "Open-book Microsoft Learn access gives **zero extra exam clock time** — flag uncertain questions first, answer what you know, and spend <45–60s on surgical table lookups!"
      }
    ]
  }
};
