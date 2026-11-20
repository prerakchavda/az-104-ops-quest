// =============================================================================
// AZ-104 OPS QUEST — PLAYABLE DRILLS DATA
// 20 P1 Incidents • 36 Speed Run Traps • 8 Spot-the-2-Bugs Hunts
// 2 Multi-Tab Exam Case Studies • 10 Open-Book 45s MS Learn Scavenger Hunts
// =============================================================================

window.AZ104_DRILLS = {
  // ---------------------------------------------------------------------------
  // 20 P1 INCIDENT TICKETS (4 PER DOMAIN)
  // ---------------------------------------------------------------------------
  TICKETS: [
    // IDENTITY & GOVERNANCE (4)
    {
      id: "t1", code: "INC-101", domain: "identity", domainLabel: "Identity & Gov", severity: "P1",
      title: "Owner Can't Delete a Test Storage Account",
      msUrl: "https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/lock-resources",
      symptom: "Alex has 'Owner' on Subscription-Prod. She tries to delete an old staging Storage Account inside rg-northstar-data, but Azure rejects it with `ScopeLocked`. There are no Deny policies assigned.",
      question: "What is blocking Alex, and what is the minimum fix?",
      options: [
        "Re-assign Owner directly on the Storage Account instead of inheriting from Subscription.",
        "A CanNotDelete (or ReadOnly) Resource Lock exists on the Storage Account, RG, or Subscription. Remove the lock first, then delete the resource.",
        "Assign 'Storage Account Contributor' in addition to Owner.",
        "Disable Blob Soft Delete so ARM stops returning `ScopeLocked`."
      ],
      answer: 1,
      explanation: "Resource Locks override ALL RBAC roles — even a Subscription Owner cannot delete a locked resource! Only an Owner or User Access Administrator can delete the lock first, then delete the resource."
    },
    {
      id: "t2", code: "INC-102", domain: "identity", domainLabel: "Identity & Gov", severity: "P2",
      title: "Dynamic Group Fails to Auto-Add Marketing Interns",
      msUrl: "https://learn.microsoft.com/en-us/entra/identity/users/groups-dynamic-membership",
      symptom: "You try to create an Entra ID Security Group with Membership Type = 'Dynamic User' (`user.department -eq \"Marketing\"`) in Northstar's tenant, but the Dynamic option is grayed out.",
      question: "Why can't you create a Dynamic Membership group?",
      options: [
        "Dynamic groups only work for Microsoft 365 groups, never Security groups.",
        "Dynamic group membership rules require Microsoft Entra ID P1 (or P2) licenses in the tenant.",
        "You must turn on Self-Service Password Reset (SSPR) before dynamic rules work.",
        "You need the Azure Subscription Owner role to create Entra ID groups."
      ],
      answer: 1,
      explanation: "Entra ID Free only supports Assigned groups. Dynamic user/device membership rules require Entra ID P1 or P2 licensing. Also remember: Entra ID roles (like Groups Administrator) are separate from Azure Subscription RBAC roles!"
    },
    {
      id: "t3", code: "INC-103", domain: "identity", domainLabel: "Identity & Gov", severity: "P2",
      title: "Azure Policy 'Modify' Didn't Tag Existing Resources",
      msUrl: "https://learn.microsoft.com/en-us/azure/governance/policy/how-to/remediate-resources",
      symptom: "You assigned an Azure Policy with the `Modify` effect to add tag `CostCenter=Retail` on all Resource Groups in Subscription-Prod. New RGs get tagged automatically, but 12 existing RGs are still marked Non-Compliant without the tag.",
      question: "How do you apply the tag to the 12 existing RGs?",
      options: [
        "Change the Policy effect to `Deny` so existing RGs get updated.",
        "Create a Remediation Task for the policy assignment (using its Managed Identity with appropriate RBAC permissions).",
        "Delete and recreate all 12 Resource Groups.",
        "Assign a ReadOnly lock to force policy re-evaluation."
      ],
      answer: 1,
      explanation: "Azure Policy `Modify` and `DeployIfNotExists` automatically act on NEW/updated resources, but existing non-compliant resources require creating a **Remediation Task** backed by a Managed Identity!"
    },
    {
      id: "t4", code: "INC-104", domain: "identity", domainLabel: "Identity & Gov", severity: "P1",
      title: "Contractor Granted 'Contributor' Can't Delegate Access",
      msUrl: "https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles",
      symptom: "You gave a lead contractor `Contributor` on `rg-northstar-app`. She can deploy VMs and App Services, but when she tries to assign `Reader` to her teammate on that same RG, the 'Add role assignment' button is disabled.",
      question: "What is the least-privilege role to let her manage RBAC assignments without giving full Owner?",
      options: [
        "Global Reader in Entra ID.",
        "User Access Administrator on `rg-northstar-app`.",
        "Virtual Machine Contributor on the Subscription.",
        "Security Reader on the Management Group."
      ],
      answer: 1,
      explanation: "`Contributor` can manage everything EXCEPT access assignments (`Microsoft.Authorization/roleAssignments/*`). Granting **User Access Administrator** (or Owner) allows managing RBAC at that scope; User Access Administrator is least-privilege when paired with Contributor."
    },

    // VIRTUAL NETWORKING (4)
    {
      id: "t5", code: "INC-201", domain: "networking", domainLabel: "Networking", severity: "P1",
      title: "App VM Can't Reach Data Spoke Through Hub",
      msUrl: "https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-peering-overview",
      symptom: "Northstar peered vnet-app ↔ vnet-hub (Connected) and vnet-data ↔ vnet-hub (Connected). Neither spoke has NSGs yet. From vm-app-01 (10.1.1.4), every packet to vm-data-01 (10.2.1.4) times out.",
      question: "Why is traffic failing between vnet-app and vnet-data?",
      options: [
        "VNet Peering only supports IPv6 unless Gateway Transit is enabled.",
        "Azure VNet Peering is NON-TRANSITIVE. Peering both spokes to the hub does not route spoke-to-spoke traffic unless you either peer App ↔ Data directly OR route via a Hub NVA/Firewall using UDRs.",
        "You forgot to enable 'Allow Forwarded Traffic' on the Storage Account.",
        "Subnets in 10.1.0.0/16 and 10.2.0.0/16 overlap in RFC1918 space."
      ],
      answer: 1,
      explanation: "One of the #1 AZ-104 traps: VNet peering is strictly non-transitive! A↔B and B↔C NEVER implies A↔C. Add direct spoke peering OR route through a Hub firewall/NVA with User-Defined Routes (UDRs)."
    },
    {
      id: "t6", code: "INC-202", domain: "networking", domainLabel: "Networking", severity: "P1",
      title: "Load Balancer Shows Backend Pool 0% Healthy",
      msUrl: "https://learn.microsoft.com/en-us/azure/load-balancer/load-balancer-custom-probe-overview",
      symptom: "You placed a Standard Public Load Balancer in front of 2 healthy nginx VMs on TCP 80. You added an NSG rule allowing TCP 80 from 10.1.0.0/16 (Priority 100) and a custom `DenyAllInbound` rule (Priority 200). Now the LB marks all backends unhealthy.",
      question: "What caused the health probe to fail?",
      options: [
        "Standard Load Balancer health probes require HTTPS on port 443.",
        "Your custom Priority 200 DenyAll rule overrides the default `AllowAzureLoadBalancerInBound` rule (Priority 65001). Allow the `AzureLoadBalancer` service tag at priority < 200.",
        "Load Balancers only work with Basic Public IPs.",
        "You must install the Azure Monitor Agent on both VMs for probes to respond."
      ],
      answer: 1,
      explanation: "NSG rules run from lowest priority number (100) to highest (65500). Default rules sit at 65000+. A custom DenyAll at 200 blocks the `AzureLoadBalancer` probe tag (168.63.129.16)!"
    },
    {
      id: "t7", code: "INC-203", domain: "networking", domainLabel: "Networking", severity: "P1",
      title: "Azure Bastion Deployment Fails on Subnet Validation",
      msUrl: "https://learn.microsoft.com/en-us/azure/bastion/configuration-settings",
      symptom: "You created a subnet named `BastionSubnet` with CIDR `10.0.5.0/27` inside `vnet-hub`, then tried deploying Azure Bastion (Standard SKU). Validation fails immediately.",
      question: "What TWO things are wrong with the subnet?",
      options: [
        "It must be inside `vnet-app` and use a `/29` prefix.",
        "The subnet MUST be named `AzureBastionSubnet` (exact casing) AND have a prefix of `/26` or larger (e.g., `/26` or `/25`).",
        "It needs a NAT Gateway attached and must be named `GatewaySubnet`.",
        "Bastion requires a Public IPv6 prefix on the subnet."
      ],
      answer: 1,
      explanation: "Azure Bastion has two strict rules tested constantly on AZ-104: exact subnet name **`AzureBastionSubnet`** and minimum size **`/26`** (64 total IPs)."
    },
    {
      id: "t8", code: "INC-204", domain: "networking", domainLabel: "Networking", severity: "P2",
      title: "NIC NSG Allows Port 443, Yet HTTPS Still Drops",
      msUrl: "https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview",
      symptom: "You added an Inbound Allow TCP 443 rule (Priority 100) on `vm-web-01`'s NIC NSG. However, external clients still time out. `snet-web` has its own Subnet NSG with a custom Priority 300 rule denying TCP 443 from `Internet`.",
      question: "Why didn't the NIC NSG Priority 100 rule win?",
      options: [
        "Subnet NSGs always overwrite NIC NSG priority numbers globally.",
        "Inbound traffic is evaluated INDEPENDENTLY at Subnet NSG FIRST, then NIC NSG. Because the Subnet NSG drops TCP 443, the packet never reaches the NIC NSG.",
        "Priority 100 is reserved for Azure platform traffic.",
        "NSGs only filter outbound traffic on Linux VMs."
      ],
      answer: 1,
      explanation: "Remember the 2-gate model: **Inbound** = Gate 1 (Subnet NSG) → Gate 2 (NIC NSG). **Outbound** = Gate 1 (NIC NSG) → Gate 2 (Subnet NSG). Priorities are NOT merged across the two NSGs — the packet must pass BOTH gates!"
    },

    // STORAGE (4)
    {
      id: "t9", code: "INC-301", domain: "storage", domainLabel: "Storage", severity: "P1",
      title: "403 Forbidden After Adding a Private Endpoint",
      msUrl: "https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-dns",
      symptom: "You disabled Public Network Access on stnorthstar01 and created a Private Endpoint (10.2.1.10) in vnet-data (peered to vnet-app). From vm-app-01, `nslookup stnorthstar01.blob.core.windows.net` still returns a public IP `52.239.x.x` and gets 403.",
      question: "What missing link connects vnet-app to the Private Endpoint?",
      options: [
        "Open TCP port 445 outbound on the App Subnet NSG.",
        "Create/use a Private DNS Zone (`privatelink.blob.core.windows.net`) with an A record for stnorthstar01 AND link that Private DNS Zone to `vnet-app`.",
        "Enable 'Allow Azure services on the trusted services list' so public DNS returns private IPs.",
        "Private Endpoints cannot be reached across peered VNets."
      ],
      answer: 1,
      explanation: "A Private Endpoint puts a private IP in your VNet, but your VM only routes to it when a linked Private DNS Zone (`privatelink.blob.core.windows.net`) resolves the hostname to `10.2.1.10`!"
    },
    {
      id: "t10", code: "INC-302", domain: "storage", domainLabel: "Storage", severity: "P1",
      title: "Leaked SAS Token Needs Instant Revocation Without Downtime",
      msUrl: "https://learn.microsoft.com/en-us/rest/api/storageservices/define-stored-access-policy",
      symptom: "A partner accidentally posted a Blob container Service SAS URL in a public forum. Three other internal apps currently depend on Storage Account Access Key 1 & Key 2, so rotating keys right now would cause an outage.",
      question: "If you had designed this properly, how can you revoke ONLY that partner's Service SAS immediately without rotating account keys?",
      options: [
        "Delete the Storage Account firewall rule.",
        "Associate the Service SAS with a **Stored Access Policy** on the container — then modify or delete that Stored Access Policy to revoke the SAS instantly.",
        "Change the container access tier from Hot to Cool.",
        "Disable Blob Soft Delete."
      ],
      answer: 1,
      explanation: "Ad-hoc Service SAS tokens can only be revoked by rotating the signing Account Key (which breaks other callers). Tying a Service SAS to a **Stored Access Policy** lets you revoke or shorten expiry in 1 second with zero impact on keys!"
    },
    {
      id: "t11", code: "INC-303", domain: "storage", domainLabel: "Storage", severity: "P2",
      title: "Object Replication Refuses to Enable Between Two Regions",
      msUrl: "https://learn.microsoft.com/en-us/azure/storage/blobs/object-replication-overview",
      symptom: "You want asynchronous Object Replication from `stnorthstareast` (East US) to `stnorthstarwest` (West US). In the portal, Object Replication says prerequisites are not met on the source account.",
      question: "Which features MUST be enabled for Blob Object Replication?",
      options: [
        "Hierarchical Namespace (ADLS Gen2) and Archive tier.",
        "**Blob Versioning** on BOTH source and destination accounts, plus **Blob Change Feed** on the source account.",
        "Azure Files Soft Delete and SMB 3.1.1.",
        "Read-Access Geo-Redundant Storage (RA-GRS) on both accounts."
      ],
      answer: 1,
      explanation: "Exact Microsoft prerequisite: Object Replication requires **Blob Versioning** enabled on BOTH source and destination, plus **Change Feed** enabled on the source account (and standard GPv2 accounts without hierarchical namespace)."
    },
    {
      id: "t12", code: "INC-304", domain: "storage", domainLabel: "Storage", severity: "P2",
      title: "Finance Can't Download an Archived 2024 Invoice Blob",
      msUrl: "https://learn.microsoft.com/en-us/azure/storage/blobs/archive-rehydrate-overview",
      symptom: "Lifecycle Management moved `inv-2024.pdf` to the `Archive` tier after 180 days. Finance clicks Download in Storage Explorer and gets `BlobArchived` error.",
      question: "What must you do so Finance can read the blob as fast as possible?",
      options: [
        "Grant Finance `Storage Blob Data Owner`.",
        "**Rehydrate** the blob to Hot or Cool tier with **High** rehydration priority (takes < 1 hour for small blobs instead of up to 15 hours for Standard priority).",
        "Generate a User Delegation SAS token.",
        "Mount the container over SMB port 445."
      ],
      answer: 1,
      explanation: "Archive tier is **offline** storage — blobs cannot be read or modified until rehydrated to Hot/Cool/Cold. Setting Rehydration Priority to **High** dramatically speeds up retrieval for blobs under 10 GB."
    },

    // COMPUTE (4)
    {
      id: "t13", code: "INC-401", domain: "compute", domainLabel: "Compute", severity: "P2",
      title: "Managed Identity Has 'Contributor' But Can't Read Blobs",
      msUrl: "https://learn.microsoft.com/en-us/azure/storage/blobs/assign-azure-role-data-access",
      symptom: "You enabled System-Assigned Managed Identity on vm-app-01 and assigned `Contributor` on stnorthstar01. Inside the VM, your script authenticates via Entra ID to download a blob and fails with `AuthorizationPermissionMismatch`.",
      question: "Why did `Contributor` fail?",
      options: [
        "Managed Identities only work with Azure Key Vault.",
        "`Contributor` is a Control Plane role (managing the account itself). Reading/writing blobs via Entra ID requires a Data Plane role like `Storage Blob Data Reader` or `Storage Blob Data Contributor`.",
        "You must use a User-Assigned Managed Identity for Blob Storage.",
        "You need to rotate Storage Account Access Key 1 after assigning RBAC."
      ],
      answer: 1,
      explanation: "AZ-104 loves Control Plane vs Data Plane! Even `Owner` and `Contributor` do NOT grant Entra ID data-plane access to blobs or queues — assign `Storage Blob Data Reader` or `Storage Blob Data Contributor`."
    },
    {
      id: "t14", code: "INC-402", domain: "compute", domainLabel: "Compute", severity: "P1",
      title: "App Service Deployment Slot Option Is Grayed Out",
      msUrl: "https://learn.microsoft.com/en-us/azure/app-service/deploy-staging-slots",
      symptom: "Northstar's storefront runs on an App Service Plan using the **Basic (B1)** tier. You open 'Deployment slots' to create a `staging` slot for zero-downtime swaps, and Azure says you must scale up.",
      question: "What is the MINIMUM App Service Plan tier that unlocks Deployment Slots (and Autoscale)?",
      options: [
        "Shared (D1)",
        "Standard (S1)",
        "Basic (B3)",
        "Free (F1) with custom domain enabled"
      ],
      answer: 1,
      explanation: "Memorize the tier jump: **Basic (B1–B3)** gives Custom Domains & manual scale (up to 3 instances), while **Standard (S1+)** unlocks **Deployment Slots (5), Autoscale, Daily Backups, and Traffic Manager**!"
    },
    {
      id: "t15", code: "INC-403", domain: "compute", domainLabel: "Compute", severity: "P2",
      title: "Existing VM Can't Be Added to an Availability Set",
      msUrl: "https://learn.microsoft.com/en-us/azure/virtual-machines/availability-set-overview",
      symptom: "A teammate deployed `vm-legacy-01` standalone (no Availability Set). Now leadership wants 99.95% SLA by putting `vm-legacy-01` and `vm-legacy-02` into an Availability Set.",
      question: "Can you move the existing running `vm-legacy-01` directly into a new Availability Set?",
      options: [
        "Yes — stop/deallocate the VM and pick the Availability Set under Properties.",
        "No — Availability Sets can ONLY be assigned at VM creation time. You must delete the VM (keeping its OS/data disks) and recreate the VM inside the Availability Set attaching those disks.",
        "Yes — run `az vm update --availability-set` while the VM is running.",
        "Only if you first convert it to a VM Scale Set."
      ],
      answer: 1,
      explanation: "Classic AZ-104 VM rule: you CANNOT add an existing VM to an Availability Set (or change its Availability Zone) in place. You must **recreate the VM** from its preserved OS/data disks inside the Availability Set!"
    },
    {
      id: "t16", code: "INC-404", domain: "compute", domainLabel: "Compute", severity: "P2",
      title: "Batch Container Keeps Restarting Forever in ACI",
      msUrl: "https://learn.microsoft.com/en-us/azure/container-instances/container-instances-restart-policy",
      symptom: "You deployed a nightly invoice-processing container in Azure Container Instances (ACI) using default settings. It finishes successfully (exit code 0) in 2 minutes, then immediately restarts and duplicates invoices all night!",
      question: "Which ACI `restartPolicy` should you set so it only restarts if it crashes, NOT when it succeeds?",
      options: [
        "`Always` (default)",
        "`OnFailure`",
        "`Never` (even if it crashes mid-job)",
        "`ScaleToZero`"
      ],
      answer: 1,
      explanation: "ACI supports three restart policies: `Always` (default, for long-running web servers), **`OnFailure`** (ideal for batch jobs that exit 0 on success but should retry on crash), and `Never` (run-once regardless of exit code)."
    },

    // MONITOR & BACKUP (4)
    {
      id: "t17", code: "INC-501", domain: "monitor", domainLabel: "Monitor & Backup", severity: "P2",
      title: "Can't See Production VM When Configuring Azure Backup",
      msUrl: "https://learn.microsoft.com/en-us/azure/backup/backup-azure-vms-first-look-arm",
      symptom: "Production VM vm-app-01 runs in East US. You created Recovery Services Vault rsv-northstar-dr in West US 2 thinking backups belong in another region. Inside the vault, vm-app-01 does not appear under `+ Backup`.",
      question: "Why is vm-app-01 missing from the vault?",
      options: [
        "VMs must be deallocated before enrolling in Azure Backup.",
        "For Azure Backup, the Recovery Services Vault MUST be in the SAME region as the VM (GRS vault redundancy copies it cross-region). Putting the vault in the target region is for Azure Site Recovery (ASR)!",
        "Only Windows VMs support Recovery Services Vaults.",
        "You must use an Azure Backup Vault instead of a Recovery Services Vault for VMs."
      ],
      answer: 1,
      explanation: "Memorize this contrast: **Azure Backup** = Vault in the **SAME** region as the VM. **Azure Site Recovery (ASR)** = Vault in the **TARGET** secondary region!"
    },
    {
      id: "t18", code: "INC-502", domain: "monitor", domainLabel: "Monitor & Backup", severity: "P2",
      title: "Can't Back Up Managed Disks or Blobs in Recovery Services Vault",
      msUrl: "https://learn.microsoft.com/en-us/azure/backup/backup-vault-overview",
      symptom: "You open your Recovery Services Vault to enable operational backup for Azure Blobs and Managed Disks, and neither workload appears as an option.",
      question: "Which Azure resource is required to back up Azure Blobs and Managed Disks?",
      options: [
        "Azure Site Recovery Vault",
        "**Azure Backup Vault** (separate from Recovery Services Vault!)",
        "Log Analytics Workspace",
        "Azure Storage Explorer"
      ],
      answer: 1,
      explanation: "Directly from the official AZ-104 Study Guide: **Recovery Services Vault** protects VMs, Azure File Shares, SQL/SAP in VMs, and ASR; **Azure Backup Vault** protects Azure Blobs, Azure Managed Disks, and PostgreSQL/AKS!"
    },
    {
      id: "t19", code: "INC-503", domain: "monitor", domainLabel: "Monitor & Backup", severity: "P2",
      title: "Alert Storm Wakes On-Call During Sunday Patching Window",
      msUrl: "https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-processing-rules",
      symptom: "Northstar has 25 Azure Monitor alert rules firing during every Sunday 2:00–4:00 AM maintenance window. Your manager wants notifications silenced ONLY during that 2-hour window without manually disabling 25 rules.",
      question: "Which Azure Monitor feature solves this cleanly?",
      options: [
        "Delete the Action Group every Saturday night.",
        "Create an **Alert Processing Rule** scoped to the Subscription/RG with action 'Suppress notifications' scheduled for Sundays 02:00–04:00.",
        "Turn off Diagnostic Settings on the Log Analytics Workspace.",
        "Set Alert Severity to Sev 4 on all rules."
      ],
      answer: 1,
      explanation: "**Alert Processing Rules** (formerly Action Rules) apply on top of fired alerts to suppress notifications during planned maintenance OR add extra Action Groups at scale!"
    },
    {
      id: "t20", code: "INC-504", domain: "monitor", domainLabel: "Monitor & Backup", severity: "P1",
      title: "Can't Delete Test Recovery Services Vault After Lab",
      msUrl: "https://learn.microsoft.com/en-us/azure/backup/backup-azure-delete-vault",
      symptom: "You finished Week 7's backup lab, stopped backup on `vm-test-01`, deleted the backup data, and now try to delete `rsv-northstar-lab`. Azure blocks deletion saying soft-deleted backup items still exist.",
      question: "What are the exact steps to delete a Recovery Services Vault containing soft-deleted items?",
      options: [
        "Put a CanNotDelete lock on the vault, then force-delete the RG.",
        "Go to Vault Properties → **Security Settings → Disable Soft Delete**, then **Undelete** the soft-deleted item(s), permanently delete the backup data, and THEN delete the vault.",
        "Wait 24 hours for Azure Monitor to purge the vault automatically.",
        "Move the vault to another region first."
      ],
      answer: 1,
      explanation: "Soft Delete protects backups for 14 days by default (anti-ransomware!). To remove a lab vault immediately: Disable Soft Delete → Undelete the soft-deleted items → Delete backup data permanently → Delete the vault."
    }
  ],

  // ---------------------------------------------------------------------------
  // 8 "SPOT THE 2 BUGS" SABOTAGE CODE/CONFIG HUNTS
  // ---------------------------------------------------------------------------
  BUG_HUNTS: [
    {
      id: "bh1",
      title: "Sabotage #1: Broken Bicep VM + Bastion Subnet",
      domain: "Compute + Networking",
      prompt: "Find the **2 buggy lines** in this Bicep snippet that will fail deployment in Azure:",
      lines: [
        "param location string = resourceGroup().location",
        "resource vnet 'Microsoft.Network/virtualNetworks@2023-09-01' = {",
        "  name: 'vnet-hub'",
        "  location: location",
        "  properties: {",
        "    addressSpace: { addressPrefixes: ['10.0.0.0/16'] }",
        "    subnets: [",
        "      { name: 'BastionSubnet', properties: { addressPrefix: '10.0.1.0/27' } }",
        "      { name: 'snet-shared', properties: { addressPrefix: '10.0.1.0/24' } }",
        "    ]",
        "  }",
        "}"
      ],
      bugLines: [7, 8],
      explanation: "Line 8 has TWO Bastion violations (`BastionSubnet` must be named `AzureBastionSubnet` and must be at least `/26`, not `/27`), AND Line 9 (`10.0.1.0/24`) overlaps directly with `10.0.1.0/27`!"
    },
    {
      id: "bh2",
      title: "Sabotage #2: Broken VNet Peering CLI Script",
      domain: "Networking",
      prompt: "Find the **2 buggy lines** preventing `vnet-app` (10.1.0.0/16) and `vnet-data` from reaching 'Connected' status:",
      lines: [
        "# Create peering between vnet-app and vnet-data",
        "az network vnet create -g rg-core -n vnet-data --address-prefix 10.1.0.0/16",
        "az network vnet peering create \\",
        "  -g rg-core -n app-to-data \\",
        "  --vnet-name vnet-app \\",
        "  --remote-vnet vnet-data \\",
        "  --allow-vnet-access",
        "# Done! Peering is now bidirectional automatically!"
      ],
      bugLines: [1, 7],
      explanation: "Line 2 uses an OVERLAPPING address space (`10.1.0.0/16` collides with `vnet-app`)! And Line 8 is a classic trap: VNet peering is NOT bidirectional from one command — you must create the reverse peering (`data-to-app`) too or status stays `Initiated`!"
    },
    {
      id: "bh3",
      title: "Sabotage #3: Passwordless VM → Blob Access Gone Wrong",
      domain: "Identity + Storage",
      prompt: "Find the **2 buggy lines** stopping `vm-app-01` from privately reading blobs with Managed Identity:",
      lines: [
        "az vm identity assign -g rg-app -n vm-app-01",
        "az role assignment create --assignee $VM_ID --role \"Contributor\" --scope $ST_ID",
        "az storage account update -g rg-core -n stnorthstar01 --public-network-access Disabled",
        "az network private-endpoint create -g rg-core -n pe-blob --vnet-name vnet-data --subnet snet-pe \\",
        "  --private-connection-resource-id $ST_ID --group-id blob --connection-name conn-blob",
        "# Skip Private DNS Zone — Azure public DNS automatically returns 10.2.1.4!"
      ],
      bugLines: [1, 5],
      explanation: "Line 2 assigns Control Plane `Contributor` instead of Data Plane `Storage Blob Data Reader/Contributor`! And Line 6 skips the Private DNS Zone (`privatelink.blob.core.windows.net`) linked to `vnet-app` — without it, DNS returns the public IP and fails with 403!"
    },
    {
      id: "bh4",
      title: "Sabotage #4: NSG Blocking Load Balancer & App Traffic",
      domain: "Networking",
      prompt: "Find the **2 buggy rules** in this Inbound NSG table that break the Standard Public Load Balancer:",
      lines: [
        "Priority 100 | ALLOW | Source: Internet       | Dest Port: 443 | TCP",
        "Priority 150 | DENY  | Source: Any            | Dest Port: *   | Any",
        "Priority 200 | ALLOW | Source: AzureLoadBalancer | Dest Port: * | Any",
        "Priority 65000 | ALLOW | Source: VirtualNetwork | Dest: VirtualNetwork | Any",
        "Priority 65001 | ALLOW | Source: AzureLoadBalancer | Dest: Any | Any",
        "Priority 65500 | DENY  | Source: Any | Dest: Any | Any"
      ],
      bugLines: [1, 2],
      explanation: "Priority 150 (`DENY Any`) evaluates BEFORE Priority 200 (`ALLOW AzureLoadBalancer`), shadowing it and killing LB health probes! Move the `AzureLoadBalancer` allow rule ABOVE (lower priority number than) any custom DenyAll rule."
    },
    {
      id: "bh5",
      title: "Sabotage #5: Custom RBAC Role JSON Mistakes",
      domain: "Identity & Governance",
      prompt: "Find the **2 buggy lines** in this Custom RBAC JSON intended to let ops ONLY restart VMs in one Subscription:",
      lines: [
        "{",
        "  \"Name\": \"Northstar VM Restarter\",",
        "  \"IsCustom\": true,",
        "  \"Actions\": [ \"Microsoft.Compute/virtualMachines/*\" ],",
        "  \"NotActions\": [],",
        "  \"AssignableScopes\": [ \"/\" ]",
        "}"
      ],
      bugLines: [3, 5],
      explanation: "Line 4 grants wildcard `Microsoft.Compute/virtualMachines/*` (allows deleting VMs instead of just `.../restart/action` + `.../read`!). And Line 6 uses `AssignableScopes: [\"/\"]` (root scope is invalid for custom roles — use `/subscriptions/<sub-id>` or a Management Group/RG!)."
    },
    {
      id: "bh6",
      title: "Sabotage #6: Broken App Service + Deployment Slot CLI",
      domain: "Compute",
      prompt: "Find the **2 buggy lines** that fail or cause downtime when setting up zero-downtime swaps:",
      lines: [
        "az appservice plan create -g rg-app -n asp-northstar --sku B1 --is-linux",
        "az webapp create -g rg-app -p asp-northstar -n app-northstar-web --runtime \"NODE:20-lts\"",
        "az webapp deployment slot create -g rg-app -n app-northstar-web --slot staging",
        "az webapp config appsettings set -g rg-app -n app-northstar-web --slot staging --settings DB_ENV=staging",
        "az webapp deployment slot swap -g rg-app -n app-northstar-web --slot staging --target-slot production"
      ],
      bugLines: [0, 3],
      explanation: "Line 1 uses `--sku B1` (Basic does NOT support Deployment Slots — requires at least `S1`!). And Line 4 sets `DB_ENV=staging` WITHOUT `--slot-settings` (slot-sticky), so swapping will push the STAGING database setting into PRODUCTION!"
    },
    {
      id: "bh7",
      title: "Sabotage #7: Storage Lifecycle + Archive Read Disaster",
      domain: "Storage",
      prompt: "Find the **2 buggy lines** in this Storage setup script:",
      lines: [
        "az storage account create -g rg-core -n stnorthstar01 --sku Standard_LRS --kind StorageV2",
        "az storage blob set-tier -c invoices -n 2024.pdf --tier Archive --account-name stnorthstar01",
        "az storage blob download -c invoices -n 2024.pdf -f ./2024.pdf --account-name stnorthstar01",
        "az lock create -n lock-st -g rg-core --resource-name stnorthstar01 --resource-type Microsoft.Storage/storageAccounts --lock-type ReadOnly",
        "az storage account keys list -g rg-core -n stnorthstar01"
      ],
      bugLines: [2, 4],
      explanation: "Line 3 tries to immediately download a blob moved to `Archive` tier (Archive is OFFLINE — must rehydrate first!). And Line 5 tries to run `keys list` on a Storage Account with a `ReadOnly` lock (listing keys is a POST operation, so ReadOnly lock blocks it!)."
    },
    {
      id: "bh8",
      title: "Sabotage #8: Backup & ASR Vault Region Mix-Up",
      domain: "Monitor & Backup",
      prompt: "Find the **2 buggy lines** in this Backup + Disaster Recovery setup for `vm-prod-01` (located in `eastus`):",
      lines: [
        "# Goal: Back up vm-prod-01 (eastus) and set up ASR failover to westus2",
        "az backup vault create -g rg-ops -n rsv-backup-east --location westus2",
        "az backup protection enable-for-vm -g rg-ops --vault-name rsv-backup-east --vm vm-prod-01 --policy-name DefaultPolicy",
        "az backup vault create -g rg-ops -n rsv-asr-dr --location eastus",
        "# Configure ASR replication from eastus -> westus2 using rsv-asr-dr"
      ],
      bugLines: [1, 3],
      explanation: "Both vault regions are backwards! Line 2 creates the Backup vault in `westus2` (Azure Backup vault MUST be in the SAME region as the VM: `eastus`!). And Line 4 creates the ASR vault in `eastus` (ASR vault MUST be in the TARGET failover region: `westus2`!)."
    }
  ],

  // ---------------------------------------------------------------------------
  // 36 SPEED RUN TRAPS (WITH DOMAIN TAGS FOR WEAKNESS RADAR & SPACED REPETITION)
  // ---------------------------------------------------------------------------
  SPEEDRUN_CARDS: [
    // Identity & Gov (7)
    { id: "sr1", domain: "identity", prompt: "A Subscription Owner tries to delete a Resource Group with a CanNotDelete lock. Does it succeed?", choices: ["Yes — Owner overrides locks", "No — Lock blocks even Owner"], answer: 1, why: "Locks override ALL RBAC roles. Owner must delete the lock first.", url: "https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/lock-resources" },
    { id: "sr2", domain: "identity", prompt: "A ReadOnly lock is placed on a Storage Account. Can an admin run `listKeys` to view Storage Access Keys?", choices: ["Yes — Listing keys is read-only", "No — listKeys is a POST action"], answer: 1, why: "Classic exam gotcha! Listing storage keys is a POST operation, so ReadOnly locks block it.", url: "https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/lock-resources" },
    { id: "sr3", domain: "identity", prompt: "What minimum Entra ID license is required to use Dynamic User/Device membership groups?", choices: ["Entra ID Free", "Entra ID P1"], answer: 1, why: "Dynamic membership rules require Entra ID P1 (or P2).", url: "https://learn.microsoft.com/en-us/entra/identity/users/groups-dynamic-membership" },
    { id: "sr4", domain: "identity", prompt: "Can a single Azure Resource belong to TWO Resource Groups at the same time?", choices: ["Yes — via tags", "No — exactly one RG"], answer: 1, why: "Every Azure resource lives in one and only one Resource Group (though resources in an RG can be in different regions!).", url: "https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/manage-resource-groups-portal" },
    { id: "sr5", domain: "identity", prompt: "Do Resource Tags applied to a Resource Group automatically inherit down to resources inside it?", choices: ["Yes — like RBAC", "No — tags do NOT inherit (use Policy)"], answer: 1, why: "RBAC, Locks, and Policy inherit downward; Tags do NOT automatically inherit unless enforced via Azure Policy!", url: "https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/tag-resources" },
    { id: "sr6", domain: "identity", prompt: "Which built-in RBAC role can assign roles to other users WITHOUT being able to create or delete VMs?", choices: ["Contributor", "User Access Administrator"], answer: 1, why: "Contributor manages resources (not access); User Access Administrator manages RBAC access (not resources).", url: "https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles" },
    { id: "sr7", domain: "identity", prompt: "You assign an Azure Policy with `Modify` effect. How do you fix EXISTING non-compliant resources?", choices: ["Wait 30 minutes for auto-fix", "Run a Remediation Task"], answer: 1, why: "Existing non-compliant resources need a Remediation Task (backed by a Managed Identity).", url: "https://learn.microsoft.com/en-us/azure/governance/policy/how-to/remediate-resources" },

    // Storage (7)
    { id: "sr8", domain: "storage", prompt: "You want to download a Blob currently in the Archive tier. What must you do first?", choices: ["Download directly (slower speed)", "Rehydrate it to Hot/Cool/Cold first"], answer: 1, why: "Archive tier is OFFLINE storage — blobs cannot be read until rehydrated.", url: "https://learn.microsoft.com/en-us/azure/storage/blobs/archive-rehydrate-overview" },
    { id: "sr9", domain: "storage", prompt: "An app VM has 'Contributor' RBAC on a Storage Account. Can it read blobs via Entra ID (no keys)?", choices: ["Yes — Contributor does everything", "No — Needs a Data Plane role"], answer: 1, why: "Contributor is Control Plane only. Assign Storage Blob Data Reader/Contributor for Data Plane.", url: "https://learn.microsoft.com/en-us/azure/storage/blobs/assign-azure-role-data-access" },
    { id: "sr10", domain: "storage", prompt: "You want to revoke a Service SAS token early WITHOUT rotating the Storage Account keys. What do you use?", choices: ["Stored Access Policy", "Private Endpoint"], answer: 0, why: "Tie the Service SAS to a Stored Access Policy so you can modify or delete the policy anytime.", url: "https://learn.microsoft.com/en-us/rest/api/storageservices/define-stored-access-policy" },
    { id: "sr11", domain: "storage", prompt: "Which Storage redundancy option gives 3 Availability Zones in Primary region PLUS a secondary region with read access?", choices: ["RA-GRS", "RA-GZRS"], answer: 1, why: "GZRS = ZRS (3 zones in primary) + GRS (async copy to paired region). RA-GZRS adds secondary read access.", url: "https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy" },
    { id: "sr12", domain: "storage", prompt: "Which SAS type is signed with Microsoft Entra ID credentials instead of the Storage Account Access Key?", choices: ["Account SAS", "User Delegation SAS"], answer: 1, why: "User Delegation SAS is secured with Entra ID credentials (Microsoft's recommended most-secure SAS for Blobs!).", url: "https://learn.microsoft.com/en-us/azure/storage/common/storage-sas-overview" },
    { id: "sr13", domain: "storage", prompt: "To enable Blob Object Replication between two accounts, what MUST be enabled on the source account?", choices: ["Blob Versioning + Change Feed", "Soft Delete + Azure Files"], answer: 0, why: "Source needs Blob Versioning + Change Feed; Destination needs Blob Versioning.", url: "https://learn.microsoft.com/en-us/azure/storage/blobs/object-replication-overview" },
    { id: "sr14", domain: "storage", prompt: "Which TCP port must be open for mounting an Azure File Share over SMB from on-premises?", choices: ["TCP 443", "TCP 445"], answer: 1, why: "SMB 3.0+ uses TCP port 445 (often blocked by ISPs, which is why VPN/ExpressRoute/Private Endpoint is used).", url: "https://learn.microsoft.com/en-us/azure/storage/files/storage-files-planning" },

    // Compute (8)
    { id: "sr15", domain: "compute", prompt: "Which App Service Plan tier is the MINIMUM required for Deployment Slots & Autoscale?", choices: ["Basic (B1)", "Standard (S1)"], answer: 1, why: "Deployment slots, autoscale, and backups require Standard (S1), Premium, or Isolated plans.", url: "https://learn.microsoft.com/en-us/azure/app-service/deploy-staging-slots" },
    { id: "sr16", domain: "compute", prompt: "Can you add an already-created VM directly into an existing Availability Set without recreating the VM?", choices: ["Yes — after deallocating", "No — must recreate VM from its disks"], answer: 1, why: "Availability Sets can only be specified at VM creation time.", url: "https://learn.microsoft.com/en-us/azure/virtual-machines/availability-set-overview" },
    { id: "sr17", domain: "compute", prompt: "Which gives a higher VM uptime SLA: 2+ VMs in an Availability Set (99.95%) or across Availability Zones (99.99%)?", choices: ["Availability Set (99.95%)", "Availability Zones (99.99%)"], answer: 1, why: "Availability Zones span physically separate datacenters in a region, giving a 99.99% SLA.", url: "https://learn.microsoft.com/en-us/azure/virtual-machines/availability" },
    { id: "sr18", domain: "compute", prompt: "Which CLI command converts an exported ARM JSON template into a Bicep file?", choices: ["az bicep build", "az bicep decompile"], answer: 1, why: "`decompile` converts ARM JSON → Bicep; `build` compiles Bicep → ARM JSON.", url: "https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/decompile" },
    { id: "sr19", domain: "compute", prompt: "During an App Service slot swap (`staging` → `production`), which settings stay pinned to staging and do NOT swap?", choices: ["All App Settings", "Settings marked 'Deployment slot setting' (slot-sticky)"], answer: 1, why: "Normal app settings swap with the code; slot-sticky settings stay pinned to their slot!", url: "https://learn.microsoft.com/en-us/azure/app-service/deploy-staging-slots" },
    { id: "sr20", domain: "compute", prompt: "Which container service supports scale-to-zero, HTTP ingress revisions, and KEDA event scaling without managing Kubernetes?", choices: ["Azure Container Instances (ACI)", "Azure Container Apps (ACA)"], answer: 1, why: "ACA is serverless microservices with KEDA scaling, revisions, and ingress; ACI is simple single/group container runs.", url: "https://learn.microsoft.com/en-us/azure/container-apps/compare-options" },
    { id: "sr21", domain: "compute", prompt: "When you resize a VM to a size not supported on its current hardware cluster, what happens automatically?", choices: ["Resize fails permanently", "VM is deallocated, moved to a new host, and restarted"], answer: 1, why: "Resizing across hardware clusters requires deallocating the VM (which also clears temporary local disk!).", url: "https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/resize-vm" },
    { id: "sr22", domain: "compute", prompt: "What happens to a System-Assigned Managed Identity when you delete the VM it belongs to?", choices: ["It stays in Entra ID forever", "It is deleted automatically with the VM"], answer: 1, why: "System-Assigned = 1:1 lifecycle with the resource. User-Assigned = independent lifecycle, shareable across multiple resources.", url: "https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview" },

    // Networking (8)
    { id: "sr23", domain: "networking", prompt: "VNet A is peered to Hub, and Hub is peered to VNet B. Can VMs in VNet A ping VNet B by default?", choices: ["Yes — Peering is transitive", "No — Peering is non-transitive"], answer: 1, why: "VNet peering is NEVER transitive without direct peering or a Hub NVA/Firewall + UDRs.", url: "https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-peering-overview" },
    { id: "sr24", domain: "networking", prompt: "How many IP addresses does Azure reserve inside every subnet?", choices: ["2 IPs (network + broadcast)", "5 IPs (first 4 + last 1)"], answer: 1, why: "Azure reserves 5 IPs per subnet (.0, .1, .2, .3, and broadcast).", url: "https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-faq" },
    { id: "sr25", domain: "networking", prompt: "What MUST the Azure Bastion subnet be named and sized?", choices: ["BastionSubnet (/27 min)", "AzureBastionSubnet (/26 min)"], answer: 1, why: "Exact name `AzureBastionSubnet` with a minimum prefix of `/26`.", url: "https://learn.microsoft.com/en-us/azure/bastion/configuration-settings" },
    { id: "sr26", domain: "networking", prompt: "Which NSG rules must inbound traffic pass to reach a VM?", choices: ["Either Subnet NSG OR NIC NSG", "BOTH Subnet NSG AND NIC NSG"], answer: 1, why: "Inbound evaluates Subnet NSG first, then NIC NSG. Both must allow the packet!", url: "https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview" },
    { id: "sr27", domain: "networking", prompt: "Service Endpoint vs Private Endpoint: which one assigns a real PRIVATE IP inside your VNet subnet?", choices: ["Service Endpoint", "Private Endpoint"], answer: 1, why: "Service Endpoint still uses the PaaS public IP over Azure backbone; Private Endpoint drops a private NIC IP into your subnet!", url: "https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-overview" },
    { id: "sr28", domain: "networking", prompt: "When routing traffic, two routes match: `10.1.0.0/16` (System) and `10.1.2.0/24` (UDR). Which route wins?", choices: ["System route (/16)", "Longest Prefix Match (/24 UDR)"], answer: 1, why: "Azure always selects the **Longest Prefix Match** first; on an exact prefix tie: UDR > BGP > System!", url: "https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-udr-overview" },
    { id: "sr29", domain: "networking", prompt: "Does a Standard Public Load Balancer allow inbound internet traffic by default without an NSG?", choices: ["Yes — open by default", "No — closed by default (requires NSG Allow)"], answer: 1, why: "Standard SKU Load Balancer is secure-by-default and requires an NSG explicitly allowing traffic!", url: "https://learn.microsoft.com/en-us/azure/load-balancer/skus" },
    { id: "sr30", domain: "networking", prompt: "When peering two VNets across DIFFERENT Azure regions, what is it called and does it work?", choices: ["Not supported without VPN", "Global VNet Peering — works natively"], answer: 1, why: "Global VNet Peering connects VNets across Azure regions natively over Microsoft's private backbone.", url: "https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-peering-overview" },

    // Monitor & Backup (6)
    { id: "sr31", domain: "monitor", prompt: "Which vault do you create to back up Azure Virtual Machines and Azure File Shares?", choices: ["Recovery Services Vault", "Azure Backup Vault"], answer: 0, why: "Recovery Services Vault = VMs, Azure Files, ASR. Azure Backup Vault = Blobs, Managed Disks, PostgreSQL.", url: "https://learn.microsoft.com/en-us/azure/backup/backup-overview" },
    { id: "sr32", domain: "monitor", prompt: "You want to silence Azure Monitor alert emails every Sunday 2–4 AM for patching without editing 20 alert rules.", choices: ["Alert Processing Rule", "Diagnostic Setting"], answer: 0, why: "Alert Processing Rules suppress notifications during planned maintenance schedules.", url: "https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-processing-rules" },
    { id: "sr33", domain: "monitor", prompt: "You are configuring Azure Site Recovery (ASR) for an East US VM to fail over to West US. Where does the RSV go?", choices: ["East US (source region)", "West US (target region)"], answer: 1, why: "Backup = Same region. Site Recovery (ASR) = Target secondary region!", url: "https://learn.microsoft.com/en-us/azure/site-recovery/azure-to-azure-architecture" },
    { id: "sr34", domain: "monitor", prompt: "Which Network Watcher tool tells you which exact NSG rule allowed or denied a packet for a specific VM?", choices: ["Next Hop", "IP Flow Verify"], answer: 1, why: "IP Flow Verify checks NSG rules; Next Hop checks Routing Tables (UDRs)!", url: "https://learn.microsoft.com/en-us/azure/network-watcher/ip-flow-verify-overview" },
    { id: "sr35", domain: "monitor", prompt: "How long does Azure Activity Log retain control-plane events by default (before exporting to Log Analytics)?", choices: ["30 days", "90 days"], answer: 1, why: "Azure Activity Log retains events for 90 days; route via Diagnostic Settings to Log Analytics or Storage for longer retention.", url: "https://learn.microsoft.com/en-us/azure/azure-monitor/essentials/activity-log" },
    { id: "sr36", domain: "monitor", prompt: "During the real AZ-104 exam, can you open Microsoft Learn documentation to check a SKU table?", choices: ["Yes — Open-book Learn (no extra time)", "No — Closed-book only"], answer: 0, why: "Role-based Microsoft exams include built-in Microsoft Learn access — practice fast lookups!", url: "https://learn.microsoft.com/en-us/credentials/support/exam-duration-exam-experience" }
  ],

  // ---------------------------------------------------------------------------
  // 2 AUTHENTIC MULTI-TAB AZ-104 EXAM CASE STUDIES
  // ---------------------------------------------------------------------------
  CASE_STUDIES: [
    {
      id: "cs1",
      title: "Case Study 1: Northstar Retail — Cloud Expansion & Security Overhaul",
      tabs: {
        "Overview": "Northstar Retail is migrating its e-commerce storefront and internal finance files to Microsoft Azure. They have one Entra ID tenant (`northstar.onmicrosoft.com`) with Entra ID P1 licenses and two subscriptions: `Sub-Prod` and `Sub-Dev`.",
        "Current Environment": "• `vnet-hub` (10.0.0.0/16) in East US peered to `vnet-app` (10.1.0.0/16) and `vnet-data` (10.2.0.0/16).\n• `stnorthstarprod` (StorageV2, GRS) holds product images (Blob) and finance docs (Azure Files).\n• `app-storefront` runs on a Basic (B2) App Service Plan in East US.\n• 2 Linux VMs (`vm-api-01`, `vm-api-02`) in `vnet-app` sit behind a Standard Public Load Balancer.",
        "Planned Changes": "• Move `app-storefront` to zero-downtime blue/green deployments with staging slots.\n• Block all public internet access to `stnorthstarprod`; allow access ONLY from `vnet-app` over private IPs.\n• Protect `vm-api-01` and `vm-api-02` against a complete East US regional outage with automated failover to West US 2.\n• Prevent even Subscription Owners from accidentally deleting `stnorthstarprod`.",
        "Requirements": "• Minimize costs wherever possible.\n• Use zero hardcoded secrets or storage account keys for VM-to-Blob access.\n• Ensure admins can SSH into `vm-api-01` without assigning Public IPs to any VM."
      },
      questions: [
        {
          id: "cs1q1",
          type: "Single Choice",
          q: "What is the MINIMUM change required on `app-storefront`'s App Service Plan to enable staging deployment slots while minimizing cost?",
          options: [
            "Keep Basic (B2) and enable Always On.",
            "Scale up the App Service Plan from Basic (B2) to Standard (S1).",
            "Scale out Basic (B2) to 3 instances.",
            "Upgrade directly to Isolated (I1v2)."
          ],
          answer: 1,
          why: "Deployment slots require at least Standard (S1). Scaling out B2 does not unlock slots, and Isolated is far more expensive than S1."
        },
        {
          id: "cs1q2",
          type: "Single Choice",
          q: "To protect `vm-api-01` and `vm-api-02` against an East US regional outage with failover to West US 2, where must you create the Recovery Services Vault for Azure Site Recovery (ASR)?",
          options: [
            "In East US (same region as the VMs).",
            "In West US 2 (the target failover region).",
            "Create an Azure Backup Vault in East US instead.",
            "Region does not matter for ASR vaults."
          ],
          answer: 1,
          why: "ASR requires the Recovery Services Vault to be in the TARGET (secondary) region — West US 2 — so the vault stays online if East US goes down!"
        },
        {
          id: "cs1q3",
          type: "Yes/No Series (Exam Style)",
          q: "Proposed Solution: You assign `vm-api-01`'s System-Assigned Managed Identity the `Contributor` role on `stnorthstarprod`, disable Public Network Access, create a Private Endpoint in `vnet-data`, and link `privatelink.blob.core.windows.net` to `vnet-app`. Does this meet the VM-to-Blob requirement?",
          options: [
            "Yes — meets all requirements",
            "No — fails data-plane RBAC (and non-transitive peering!)"
          ],
          answer: 1,
          why: "TWO reasons this fails: (1) `Contributor` is Control Plane only (needs `Storage Blob Data Contributor`), AND (2) `vnet-app` and `vnet-data` are only peered to `vnet-hub`, NOT to each other (non-transitive peering)!"
        },
        {
          id: "cs1q4",
          type: "Single Choice",
          q: "You want to deploy Azure Bastion in `vnet-hub` so admins can SSH into `vm-api-01` (in peered `vnet-app`) with zero VM Public IPs. What subnet must you add to `vnet-hub`?",
          options: [
            "`BastionSubnet` with `/27`",
            "`AzureBastionSubnet` with `/26` or larger (and Standard SKU Bastion for peered VNets)",
            "`GatewaySubnet` with `/26`",
            "Add `AzureBastionSubnet` inside BOTH `vnet-hub` and `vnet-app`."
          ],
          answer: 1,
          why: "Exact name `AzureBastionSubnet` (`/26` min) in `vnet-hub` — and a single Bastion host in the Hub reaches VMs in directly peered spokes automatically!"
        }
      ]
    },
    {
      id: "cs2",
      title: "Case Study 2: Northstar Ops — Governance, Containers & Incident Response",
      tabs: {
        "Overview": "Northstar acquired a smaller logistics brand and onboarded 30 external partner contractors into Entra ID. Finance reports unexpected Azure spend spikes from unapproved regions.",
        "Current Environment": "• 4 Resource Groups in `Sub-Logistics`: `rg-net`, `rg-compute`, `rg-storage`, `rg-ops`.\n• Nightly order-sync jobs run in Docker containers that process batches for 5 minutes and exit.\n• A centralized Log Analytics Workspace `law-northstar` collects logs in East US.",
        "Planned Changes": "• Block any new deployments outside East US and Central US across `Sub-Logistics`.\n• Ensure every existing AND new resource has tag `Division=Logistics`.\n• Run the nightly batch containers cheaply without managing VMs or Kubernetes, retrying ONLY if a job fails.\n• Silence non-critical alert notifications during Sundays 01:00–03:00 maintenance.",
        "Requirements": "• Contractors must be able to reset their own forgotten passwords using 2 methods.\n• Existing backups of Managed Disks must be configured using the correct vault type."
      },
      questions: [
        {
          id: "cs2q1",
          type: "Single Choice",
          q: "You assign an Azure Policy (`Modify` effect) to add `Division=Logistics` to all resources in `Sub-Logistics`. What extra step ensures EXISTING resources get tagged?",
          options: [
            "Switch the policy to `Audit`.",
            "Run a Remediation Task using the policy assignment's Managed Identity.",
            "Apply a `CanNotDelete` lock on `Sub-Logistics`.",
            "Export and re-import the ARM template."
          ],
          answer: 1,
          why: "`Modify` policies automatically tag new/updated resources; a **Remediation Task** retroactively fixes existing non-compliant resources."
        },
        {
          id: "cs2q2",
          type: "Single Choice",
          q: "What is the best container configuration for the 5-minute nightly batch job that should ONLY restart if it crashes?",
          options: [
            "Azure Container Instances (ACI) with `restartPolicy: OnFailure`",
            "Azure Container Instances (ACI) with `restartPolicy: Always`",
            "App Service Plan Premium (P1v3)",
            "VM Scale Set with 3 Linux VMs running 24/7"
          ],
          answer: 0,
          why: "ACI bills per-second only while running, and `OnFailure` ensures the container exits cleanly on success without re-running endlessly."
        },
        {
          id: "cs2q3",
          type: "Single Choice",
          q: "Which vault must you create to back up Azure Managed Disks in `Sub-Logistics`?",
          options: [
            "Recovery Services Vault in East US",
            "Azure Backup Vault in East US",
            "Recovery Services Vault in West US 2",
            "Azure Key Vault in East US"
          ],
          answer: 1,
          why: "Azure Managed Disks (and Azure Blobs) are backed up using an **Azure Backup Vault** (not a Recovery Services Vault!) in the SAME region."
        },
        {
          id: "cs2q4",
          type: "Single Choice",
          q: "How should you silence alert emails every Sunday 01:00–03:00 without disabling individual alert rules?",
          options: [
            "Remove emails from the Action Group every Saturday.",
            "Create a scheduled **Alert Processing Rule** set to Suppress Notifications for Sundays 01:00–03:00.",
            "Change the Log Analytics Workspace retention to 7 days.",
            "Disable Azure Monitor Insights on Sunday."
          ],
          answer: 1,
          why: "Alert Processing Rules cleanly suppress notifications on a recurring maintenance schedule at Subscription or RG scope!"
        }
      ]
    }
  ],

  // ---------------------------------------------------------------------------
  // 10 OPEN-BOOK 45-SECOND MICROSOFT LEARN SCAVENGER HUNTS
  // ---------------------------------------------------------------------------
  SCAVENGER_HUNTS: [
    {
      id: "sh1",
      q: "Find the EXACT maximum number of Deployment Slots supported on an App Service **Standard** plan vs **Premium** plan.",
      hint: "Search Microsoft Learn: `App Service limits deployment slots`",
      url: "https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/azure-subscription-service-limits#app-service-limits",
      answer: "Standard = up to **5** slots; Premium (v2/v3) = up to **20** slots; Basic/Free/Shared = **0** slots."
    },
    {
      id: "sh2",
      q: "Find the minimum number of days a blob must stay in the **Cool**, **Cold**, and **Archive** tiers before avoiding early-deletion fees.",
      hint: "Search Microsoft Learn: `access tiers blob data early deletion`",
      url: "https://learn.microsoft.com/en-us/azure/storage/blobs/access-tiers-overview",
      answer: "Cool = **30 days**, Cold = **90 days**, Archive = **180 days**."
    },
    {
      id: "sh3",
      q: "Find the maximum number of **Fault Domains** and **Update Domains** you can configure in an Azure Availability Set.",
      hint: "Search Microsoft Learn: `availability set fault domains update domains`",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/availability-set-overview",
      answer: "Up to **3 Fault Domains** (region-dependent, 2 or 3) and up to **20 Update Domains** (default 5)."
    },
    {
      id: "sh4",
      q: "Find which Azure Storage redundancy options support **Blob Object Replication** (and whether ADLS Gen2 / Hierarchical Namespace is supported).",
      hint: "Search Microsoft Learn: `object replication overview prerequisites`",
      url: "https://learn.microsoft.com/en-us/azure/storage/blobs/object-replication-overview",
      answer: "Requires General-purpose v2 (or Premium BlockBlob) accounts, Blob Versioning on both + Change Feed on source; NOT supported with Hierarchical Namespace enabled."
    },
    {
      id: "sh5",
      q: "Find the EXACT Private DNS Zone name required for **Azure Blob Storage** vs **Azure File Shares** Private Endpoints.",
      hint: "Search Microsoft Learn: `Azure Private Endpoint DNS configuration storage`",
      url: "https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-dns",
      answer: "Blob = `privatelink.blob.core.windows.net` • Files = `privatelink.file.core.windows.net`."
    },
    {
      id: "sh6",
      q: "Find the default **Instant Restore** snapshot retention range (in days) for Azure VM Backup Standard policy.",
      hint: "Search Microsoft Learn: `Azure VM backup instant restore snapshot retention`",
      url: "https://learn.microsoft.com/en-us/azure/backup/backup-instant-restore-capability",
      answer: "Standard policy = **1 to 5 days** (default 2 days); Enhanced policy = up to **30 days**."
    },
    {
      id: "sh7",
      q: "Find the exact Service Tag name for Azure's platform Load Balancer health probe IP (`168.63.129.16`).",
      hint: "Search Microsoft Learn: `service tags overview AzureLoadBalancer`",
      url: "https://learn.microsoft.com/en-us/azure/virtual-network/service-tags-overview",
      answer: "`AzureLoadBalancer` (represents Azure's infrastructure load balancer / health probes at `168.63.129.16`)."
    },
    {
      id: "sh8",
      q: "Find the maximum number of **Stored Access Policies** you can define on a single Blob container or File share.",
      hint: "Search Microsoft Learn: `define stored access policy limit`",
      url: "https://learn.microsoft.com/en-us/rest/api/storageservices/define-stored-access-policy",
      answer: "Maximum of **5** stored access policies per container, file share, queue, or table."
    },
    {
      id: "sh9",
      q: "Find which Azure Bastion SKU is required to connect to VMs via **native SSH/RDP client** (instead of browser only) or via **IP-based connection**.",
      hint: "Search Microsoft Learn: `Azure Bastion SKU comparison native client`",
      url: "https://learn.microsoft.com/en-us/azure/bastion/configuration-settings#sku",
      answer: "**Standard** (or Premium) SKU! Basic SKU only supports browser-based portal connections."
    },
    {
      id: "sh10",
      q: "Find whether Azure **VM Move** across **Regions** is done directly in Portal 'Move' or via **Azure Resource Mover**.",
      hint: "Search Microsoft Learn: `move Azure VM to another region Resource Mover`",
      url: "https://learn.microsoft.com/en-us/azure/resource-mover/tutorial-move-region-virtual-machines",
      answer: "Moving across RGs/Subscriptions uses ARM Move; moving a VM across **Regions** uses **Azure Resource Mover**!"
    }
  ]
};
