// =============================================================================
// AZ-104 OPS QUEST — 3 INTERACTIVE AZURE BROWSER SIMULATORS
// 1. NSG Packet Tracer (Subnet NSG + NIC NSG + Default Rules)
// 2. RBAC + Resource Lock + Azure Policy Precedence Evaluator
// 3. Azure "-5 IP" Subnet & CIDR Planner (Overlap + Bastion /26 Validator)
// =============================================================================

window.AZ104_SIMS = (function () {
  let activeSim = "nsg";

  // ---------------------------------------------------------------------------
  // SIM 1: NSG PACKET TRACER STATE
  // ---------------------------------------------------------------------------
  const NSG_PRESETS = {
    lbProbe: {
      label: "LB Health Probe Blocked",
      direction: "Inbound",
      source: "AzureLoadBalancer",
      port: "80",
      subnetRules: [
        { prio: 100, action: "Allow", source: "VirtualNetwork", port: "80", name: "AllowVnetHTTP" },
        { prio: 200, action: "Deny", source: "Any", port: "*", name: "CustomDenyAll" }
      ],
      nicRules: [
        { prio: 100, action: "Allow", source: "Any", port: "80", name: "AllowHTTPToVM" }
      ]
    },
    twoGate: {
      label: "Subnet Allows, NIC Denies",
      direction: "Inbound",
      source: "Internet",
      port: "443",
      subnetRules: [
        { prio: 100, action: "Allow", source: "Internet", port: "443", name: "AllowHTTPSIn" }
      ],
      nicRules: [
        { prio: 150, action: "Deny", source: "Internet", port: "443", name: "BlockHTTPSOnNIC" }
      ]
    },
    cleanPass: {
      label: "Clean HTTPS Pass",
      direction: "Inbound",
      source: "Internet",
      port: "443",
      subnetRules: [
        { prio: 100, action: "Allow", source: "Internet", port: "443", name: "AllowHTTPS" }
      ],
      nicRules: [
        { prio: 100, action: "Allow", source: "Internet", port: "443", name: "AllowHTTPS" }
      ]
    },
    outboundDrop: {
      label: "Outbound SMB Blocked at NIC",
      direction: "Outbound",
      source: "Internet",
      port: "445",
      subnetRules: [
        { prio: 100, action: "Allow", source: "Any", port: "445", name: "AllowSMBSubnet" }
      ],
      nicRules: [
        { prio: 120, action: "Deny", source: "Internet", port: "445", name: "BlockOutbound445" }
      ]
    }
  };

  let nsgState = JSON.parse(JSON.stringify(NSG_PRESETS.lbProbe));

  function getDefaultRules(direction) {
    if (direction === "Inbound") {
      return [
        { prio: 65000, action: "Allow", source: "VirtualNetwork", port: "*", name: "AllowVnetInBound (Default)", isDefault: true },
        { prio: 65001, action: "Allow", source: "AzureLoadBalancer", port: "*", name: "AllowAzureLoadBalancerInBound (Default)", isDefault: true },
        { prio: 65500, action: "Deny", source: "Any", port: "*", name: "DenyAllInBound (Default)", isDefault: true }
      ];
    }
    return [
      { prio: 65000, action: "Allow", source: "VirtualNetwork", port: "*", name: "AllowVnetOutBound (Default)", isDefault: true },
      { prio: 65001, action: "Allow", source: "Internet", port: "*", name: "AllowInternetOutBound (Default)", isDefault: true },
      { prio: 65500, action: "Deny", source: "Any", port: "*", name: "DenyAllOutBound (Default)", isDefault: true }
    ];
  }

  function evalNSG(customRules, direction, packetSource, packetPort) {
    const all = [...customRules, ...getDefaultRules(direction)].sort((a, b) => a.prio - b.prio);
    for (const r of all) {
      const srcMatch = r.source === "Any" || r.source === packetSource;
      const portMatch = r.port === "*" || r.port === packetPort;
      if (srcMatch && portMatch) {
        return { matched: r, allowed: r.action === "Allow" };
      }
    }
    return { matched: all[all.length - 1], allowed: false };
  }

  // ---------------------------------------------------------------------------
  // SIM 2: RBAC + LOCK + POLICY PRECEDENCE STATE
  // ---------------------------------------------------------------------------
  let govState = {
    controlRole: "Owner",
    dataRole: "None",
    lock: "CanNotDelete",
    policy: "None",
    action: "delete_storage"
  };

  const GOV_ACTIONS = {
    delete_storage: { label: "Delete Storage Account (East US)", plane: "control", op: "delete", region: "eastus" },
    list_keys: { label: "List Storage Account Access Keys (POST)", plane: "control", op: "write_post", region: "eastus" },
    read_blob: { label: "Read Blob via Entra ID (Data Plane)", plane: "data", op: "read", region: "eastus" },
    assign_rbac: { label: "Assign 'Reader' Role to Teammate", plane: "rbac", op: "rbac", region: "eastus" },
    deploy_japan: { label: "Deploy VM in Japan East", plane: "control", op: "create", region: "japaneast" },
    view_vm: { label: "View VM Properties & Metrics (GET)", plane: "control", op: "read", region: "eastus" }
  };

  function evaluateGovernance() {
    const act = GOV_ACTIONS[govState.action];
    const steps = [];
    let allowed = true;
    let finalReason = "";

    // Step 1: RBAC
    let rbacOk = false;
    let rbacMsg = "";
    if (act.plane === "data") {
      if (govState.dataRole === "Storage Blob Data Reader" || govState.dataRole === "Storage Blob Data Contributor") {
        rbacOk = true;
        rbacMsg = `Data Plane role '${govState.dataRole}' grants Entra ID blob read access.`;
      } else {
        rbacOk = false;
        rbacMsg = `DENIED: Control Plane role '${govState.controlRole}' does NOT grant Data Plane blob reads! Assign 'Storage Blob Data Reader' or 'Contributor'.`;
      }
    } else if (act.plane === "rbac") {
      if (govState.controlRole === "Owner" || govState.controlRole === "User Access Administrator") {
        rbacOk = true;
        rbacMsg = `'${govState.controlRole}' has Microsoft.Authorization/roleAssignments/write.`;
      } else {
        rbacOk = false;
        rbacMsg = `DENIED: '${govState.controlRole}' cannot assign RBAC roles. Requires Owner or User Access Administrator.`;
      }
    } else {
      if (act.op === "read") {
        rbacOk = govState.controlRole !== "None";
        rbacMsg = rbacOk ? `'${govState.controlRole}' allows Control Plane GET reads.` : "DENIED: No RBAC role assigned.";
      } else {
        rbacOk = govState.controlRole === "Contributor" || govState.controlRole === "Owner";
        rbacMsg = rbacOk ? `'${govState.controlRole}' allows Control Plane write/delete operations.` : `DENIED: '${govState.controlRole}' lacks write/delete permissions (needs Contributor or Owner).`;
      }
    }
    steps.push({ name: "1. RBAC Evaluation", ok: rbacOk, msg: rbacMsg });
    if (!rbacOk) { allowed = false; finalReason = rbacMsg; }

    // Step 2: Resource Lock
    let lockOk = true;
    let lockMsg = "No Resource Lock blocking this action.";
    if (govState.lock === "CanNotDelete" && act.op === "delete") {
      lockOk = false;
      lockMsg = "BLOCKED by CanNotDelete lock! Locks override even Subscription Owners — remove the lock first.";
    } else if (govState.lock === "ReadOnly" && (act.op === "delete" || act.op === "write_post" || act.op === "create" || act.op === "rbac")) {
      lockOk = false;
      lockMsg = act.op === "write_post"
        ? "BLOCKED by ReadOnly lock! Classic AZ-104 trap: listing Storage Account keys is a POST operation, so ReadOnly locks block it!"
        : "BLOCKED by ReadOnly lock! Only GET read operations are allowed until the lock is removed.";
    } else if (govState.lock !== "None") {
      lockMsg = `${govState.lock} lock is present, but does not block this specific operation.`;
    }
    steps.push({ name: "2. Resource Lock Check", ok: lockOk, msg: lockMsg });
    if (allowed && !lockOk) { allowed = false; finalReason = lockMsg; }

    // Step 3: Azure Policy
    let polOk = true;
    let polMsg = "No Azure Policy blocking this action.";
    if (govState.policy === "deny_region" && act.op === "create" && act.region !== "eastus") {
      polOk = false;
      polMsg = "BLOCKED by Azure Policy 'Allowed Locations (East US only)'! Deny effect stops deployments in Japan East even for Owners.";
    } else if (govState.policy === "modify_tag" && act.op === "create") {
      polOk = true;
      polMsg = "Azure Policy 'Modify' automatically injects the required tag on new deployments (existing resources need a Remediation Task).";
    }
    steps.push({ name: "3. Azure Policy Check", ok: polOk, msg: polMsg });
    if (allowed && !polOk) { allowed = false; finalReason = polMsg; }

    if (allowed) finalReason = "All 3 governance gates passed — Azure Resource Manager executes this action!";
    return { allowed, steps, finalReason };
  }

  // ---------------------------------------------------------------------------
  // SIM 3: AZURE "-5 IP" SUBNET & CIDR PLANNER
  // ---------------------------------------------------------------------------
  let cidrState = {
    vnetCidr: "10.0.0.0/16",
    subnets: [
      { name: "snet-app", cidr: "10.0.1.0/24" },
      { name: "snet-data", cidr: "10.0.2.0/24" },
      { name: "AzureBastionSubnet", cidr: "10.0.3.0/26" },
      { name: "GatewaySubnet", cidr: "10.0.4.0/27" }
    ]
  };

  function parseCidr(str) {
    const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/.exec((str || "").trim());
    if (!m) return null;
    const octets = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
    const prefix = Number(m[5]);
    if (octets.some(o => o < 0 || o > 255) || prefix < 8 || prefix > 29) return null;
    const ipInt = (((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0);
    const mask = prefix === 0 ? 0 : ((0xFFFFFFFF << (32 - prefix)) >>> 0);
    const start = (ipInt & mask) >>> 0;
    const size = Math.pow(2, 32 - prefix);
    const end = (start + size - 1) >>> 0;
    return { start, end, size, prefix, usable: Math.max(0, size - 5), startStr: intToIp(start), endStr: intToIp(end) };
  }

  function intToIp(n) {
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
  }

  // ---------------------------------------------------------------------------
  // RENDER CONTROLLER
  // ---------------------------------------------------------------------------
  function render(container) {
    if (!container) return;
    container.innerHTML = `
      <div class="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--card-border)] pb-3">
          <div>
            <h2 class="text-base font-bold">Interactive Azure Simulators (Zero Azure Login Needed)</h2>
            <p class="text-xs text-[var(--muted-foreground)]">Break rules, trace packets, test locks vs Owners, and carve Azure subnets with real -5 IP math.</p>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button data-sim="nsg" class="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${activeSim === "nsg" ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-[var(--content)] border border-[var(--card-border)] text-[var(--foreground)]"}">1. NSG Packet Tracer</button>
            <button data-sim="gov" class="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${activeSim === "gov" ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-[var(--content)] border border-[var(--card-border)] text-[var(--foreground)]"}">2. RBAC + Lock + Policy</button>
            <button data-sim="cidr" class="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${activeSim === "cidr" ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-[var(--content)] border border-[var(--card-border)] text-[var(--foreground)]"}">3. Azure -5 IP Planner</button>
          </div>
        </div>
        <div id="sim-body"></div>
      </div>
    `;

    container.querySelectorAll("[data-sim]").forEach(b => {
      b.addEventListener("click", () => {
        activeSim = b.dataset.sim;
        render(container);
      });
    });

    const body = container.querySelector("#sim-body");
    if (activeSim === "nsg") renderNSG(body, container);
    else if (activeSim === "gov") renderGov(body, container);
    else renderCidr(body, container);
  }

  function renderNSG(body, root) {
    const isIn = nsgState.direction === "Inbound";
    const gate1Name = isIn ? "Gate 1: Subnet NSG" : "Gate 1: NIC NSG";
    const gate2Name = isIn ? "Gate 2: NIC NSG" : "Gate 2: Subnet NSG";
    const gate1Rules = isIn ? nsgState.subnetRules : nsgState.nicRules;
    const gate2Rules = isIn ? nsgState.nicRules : nsgState.subnetRules;

    const r1 = evalNSG(gate1Rules, nsgState.direction, nsgState.source, nsgState.port);
    const r2 = r1.allowed ? evalNSG(gate2Rules, nsgState.direction, nsgState.source, nsgState.port) : null;
    const finalAllowed = r1.allowed && r2 && r2.allowed;

    body.innerHTML = `
      <div class="space-y-4">
        <!-- Presets -->
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <span class="font-semibold text-[var(--muted-foreground)]">Try a Scenario:</span>
          ${Object.entries(NSG_PRESETS).map(([k, p]) => `
            <button data-preset="${k}" class="px-2.5 py-1 rounded-md bg-[var(--content)] border border-[var(--card-border)] hover:border-[var(--primary)] cursor-pointer">${p.label}</button>
          `).join("")}
        </div>

        <!-- Packet Controls -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[var(--content)] border border-[var(--card-border)] rounded-xl p-3.5 text-xs">
          <label class="space-y-1 block">
            <span class="text-[var(--muted-foreground)] font-semibold">Traffic Direction</span>
            <select id="nsg-dir" class="w-full px-2.5 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]">
              <option value="Inbound" ${nsgState.direction === "Inbound" ? "selected" : ""}>Inbound (Subnet NSG → NIC NSG)</option>
              <option value="Outbound" ${nsgState.direction === "Outbound" ? "selected" : ""}>Outbound (NIC NSG → Subnet NSG)</option>
            </select>
          </label>
          <label class="space-y-1 block">
            <span class="text-[var(--muted-foreground)] font-semibold">${isIn ? "Source" : "Destination"} Tag</span>
            <select id="nsg-src" class="w-full px-2.5 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]">
              ${["Internet", "VirtualNetwork", "AzureLoadBalancer"].map(s => `<option value="${s}" ${nsgState.source === s ? "selected" : ""}>${s}</option>`).join("")}
            </select>
          </label>
          <label class="space-y-1 block">
            <span class="text-[var(--muted-foreground)] font-semibold">Destination Port</span>
            <select id="nsg-port" class="w-full px-2.5 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]">
              ${["80", "443", "22", "3389", "445"].map(p => `<option value="${p}" ${nsgState.port === p ? "selected" : ""}>TCP ${p}</option>`).join("")}
            </select>
          </label>
        </div>

        <!-- Visual Packet Pipeline Result -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="bg-[var(--content)] border-2 rounded-xl p-3.5 space-y-1" style="border-color: ${r1.allowed ? "var(--success)" : "var(--error)"};">
            <div class="flex items-center justify-between text-xs font-bold">
              <span>${gate1Name}</span>
              <span style="color: ${r1.allowed ? "var(--success)" : "var(--error)"};">${r1.allowed ? "PASS →" : "DROPPED ✗"}</span>
            </div>
            <div class="text-xs text-[var(--muted-foreground)]">Matched Priority <strong>${r1.matched.prio}</strong>: ${r1.matched.name} (${r1.matched.action} ${r1.matched.source}:${r1.matched.port})</div>
          </div>

          <div class="bg-[var(--content)] border-2 rounded-xl p-3.5 space-y-1" style="border-color: ${!r1.allowed ? "var(--border)" : (r2.allowed ? "var(--success)" : "var(--error)")}; opacity: ${r1.allowed ? "1" : "0.55"};">
            <div class="flex items-center justify-between text-xs font-bold">
              <span>${gate2Name}</span>
              <span style="color: ${!r1.allowed ? "var(--muted-foreground)" : (r2.allowed ? "var(--success)" : "var(--error)")};">${!r1.allowed ? "NEVER REACHED" : (r2.allowed ? "PASS →" : "DROPPED ✗")}</span>
            </div>
            <div class="text-xs text-[var(--muted-foreground)]">${!r1.allowed ? "Packet was already dropped at Gate 1." : `Matched Priority <strong>${r2.matched.prio}</strong>: ${r2.matched.name} (${r2.matched.action} ${r2.matched.source}:${r2.matched.port})`}</div>
          </div>

          <div class="bg-[var(--content)] border-2 rounded-xl p-3.5 space-y-1" style="border-color: ${finalAllowed ? "var(--success)" : "var(--error)"};">
            <div class="text-xs font-bold uppercase tracking-wide" style="color: ${finalAllowed ? "var(--success)" : "var(--error)"};">Final Verdict: ${finalAllowed ? "PACKET DELIVERED ✓" : "PACKET BLOCKED ✗"}</div>
            <div class="text-xs text-[var(--muted-foreground)]">${finalAllowed ? "Both NSGs allowed the packet!" : "Both Subnet NSG and NIC NSG must independently allow the packet. Lowest priority number wins inside each NSG."}</div>
          </div>
        </div>

        <!-- Editable Rules for Subnet & NIC NSG -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${renderRuleBox("Subnet NSG Custom Rules", "subnetRules", nsgState.subnetRules)}
          ${renderRuleBox("NIC NSG Custom Rules", "nicRules", nsgState.nicRules)}
        </div>
      </div>
    `;

    body.querySelectorAll("[data-preset]").forEach(btn => {
      btn.addEventListener("click", () => {
        nsgState = JSON.parse(JSON.stringify(NSG_PRESETS[btn.dataset.preset]));
        renderNSG(body, root);
      });
    });

    body.querySelector("#nsg-dir").addEventListener("change", e => { nsgState.direction = e.target.value; renderNSG(body, root); });
    body.querySelector("#nsg-src").addEventListener("change", e => { nsgState.source = e.target.value; renderNSG(body, root); });
    body.querySelector("#nsg-port").addEventListener("change", e => { nsgState.port = e.target.value; renderNSG(body, root); });

    body.querySelectorAll("[data-del-rule]").forEach(btn => {
      btn.addEventListener("click", () => {
        const [listKey, idx] = btn.dataset.delRule.split(":");
        nsgState[listKey].splice(Number(idx), 1);
        renderNSG(body, root);
      });
    });

    body.querySelectorAll("[data-add-rule]").forEach(form => {
      form.addEventListener("submit", e => {
        e.preventDefault();
        const key = form.dataset.addRule;
        const fd = new FormData(form);
        const prio = Math.max(100, Math.min(4096, Number(fd.get("prio")) || 150));
        nsgState[key].push({
          prio,
          action: fd.get("action"),
          source: fd.get("source"),
          port: fd.get("port"),
          name: `Custom_${fd.get("action")}_${prio}`
        });
        renderNSG(body, root);
      });
    });
  }

  function renderRuleBox(title, listKey, rules) {
    const sorted = [...rules].sort((a, b) => a.prio - b.prio);
    return `
      <div class="bg-[var(--content)] border border-[var(--card-border)] rounded-xl p-3.5 space-y-2.5">
        <div class="text-xs font-bold">${title}</div>
        <div class="space-y-1.5">
          ${sorted.length ? sorted.map((r, i) => `
            <div class="flex items-center justify-between gap-2 text-xs px-2.5 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)]">
              <span class="font-mono"><strong>${r.prio}</strong> • <span style="color:${r.action === "Allow" ? "var(--success)" : "var(--error)"}">${r.action}</span> • ${r.source}:${r.port}</span>
              <button data-del-rule="${listKey}:${rules.indexOf(r)}" class="text-[var(--muted-foreground)] hover:text-[var(--error)] cursor-pointer font-bold">✕</button>
            </div>
          `).join("") : `<div class="text-xs text-[var(--muted-foreground)]">No custom rules (using Azure defaults 65000–65500).</div>`}
        </div>
        <form data-add-rule="${listKey}" class="flex flex-wrap gap-1.5 pt-1 text-xs">
          <input name="prio" type="number" min="100" max="4096" value="110" class="w-16 px-2 py-1 rounded bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] font-mono" title="Priority (100-4096)" />
          <select name="action" class="px-2 py-1 rounded bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]">
            <option value="Allow">Allow</option>
            <option value="Deny">Deny</option>
          </select>
          <select name="source" class="px-2 py-1 rounded bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]">
            <option value="Any">Any</option>
            <option value="Internet">Internet</option>
            <option value="VirtualNetwork">VirtualNetwork</option>
            <option value="AzureLoadBalancer">AzureLoadBalancer</option>
          </select>
          <select name="port" class="px-2 py-1 rounded bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]">
            <option value="*">*</option>
            <option value="80">80</option>
            <option value="443">443</option>
            <option value="22">22</option>
            <option value="3389">3389</option>
            <option value="445">445</option>
          </select>
          <button type="submit" class="px-2.5 py-1 rounded bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold cursor-pointer">+ Add</button>
        </form>
      </div>
    `;
  }

  function renderGov(body) {
    const res = evaluateGovernance();
    body.innerHTML = `
      <div class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-[var(--content)] border border-[var(--card-border)] rounded-xl p-3.5 text-xs">
          <label class="space-y-1 block">
            <span class="font-semibold text-[var(--muted-foreground)]">Control Plane RBAC</span>
            <select id="g-ctrl" class="w-full px-2 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]">
              ${["None", "Reader", "Contributor", "Owner", "User Access Administrator"].map(r => `<option value="${r}" ${govState.controlRole === r ? "selected" : ""}>${r}</option>`).join("")}
            </select>
          </label>
          <label class="space-y-1 block">
            <span class="font-semibold text-[var(--muted-foreground)]">Data Plane RBAC</span>
            <select id="g-data" class="w-full px-2 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]">
              ${["None", "Storage Blob Data Reader", "Storage Blob Data Contributor"].map(r => `<option value="${r}" ${govState.dataRole === r ? "selected" : ""}>${r}</option>`).join("")}
            </select>
          </label>
          <label class="space-y-1 block">
            <span class="font-semibold text-[var(--muted-foreground)]">Resource Lock</span>
            <select id="g-lock" class="w-full px-2 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]">
              ${["None", "CanNotDelete", "ReadOnly"].map(r => `<option value="${r}" ${govState.lock === r ? "selected" : ""}>${r}</option>`).join("")}
            </select>
          </label>
          <label class="space-y-1 block">
            <span class="font-semibold text-[var(--muted-foreground)]">Azure Policy</span>
            <select id="g-pol" class="w-full px-2 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]">
              <option value="None" ${govState.policy === "None" ? "selected" : ""}>None</option>
              <option value="deny_region" ${govState.policy === "deny_region" ? "selected" : ""}>Deny: East US Only</option>
              <option value="modify_tag" ${govState.policy === "modify_tag" ? "selected" : ""}>Modify: Add Required Tag</option>
            </select>
          </label>
          <label class="space-y-1 block">
            <span class="font-semibold text-[var(--muted-foreground)]">Action Attempted</span>
            <select id="g-act" class="w-full px-2 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]">
              ${Object.entries(GOV_ACTIONS).map(([k, v]) => `<option value="${k}" ${govState.action === k ? "selected" : ""}>${v.label}</option>`).join("")}
            </select>
          </label>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          ${res.steps.map(s => `
            <div class="bg-[var(--content)] border-2 rounded-xl p-3.5 space-y-1" style="border-color: ${s.ok ? "var(--success)" : "var(--error)"};">
              <div class="flex items-center justify-between text-xs font-bold">
                <span>${s.name}</span>
                <span style="color: ${s.ok ? "var(--success)" : "var(--error)"};">${s.ok ? "PASS ✓" : "BLOCKED ✗"}</span>
              </div>
              <p class="text-xs text-[var(--muted-foreground)] leading-relaxed">${s.msg}</p>
            </div>
          `).join("")}
        </div>

        <div class="bg-[var(--content)] border-2 rounded-xl p-4" style="border-color: ${res.allowed ? "var(--success)" : "var(--error)"};">
          <div class="text-sm font-bold" style="color: ${res.allowed ? "var(--success)" : "var(--error)"};">
            ${res.allowed ? "✓ ACTION ALLOWED" : "✗ ACTION DENIED"}
          </div>
          <p class="text-xs sm:text-sm text-[var(--foreground)] mt-1">${res.finalReason}</p>
        </div>
      </div>
    `;

    body.querySelector("#g-ctrl").addEventListener("change", e => { govState.controlRole = e.target.value; renderGov(body); });
    body.querySelector("#g-data").addEventListener("change", e => { govState.dataRole = e.target.value; renderGov(body); });
    body.querySelector("#g-lock").addEventListener("change", e => { govState.lock = e.target.value; renderGov(body); });
    body.querySelector("#g-pol").addEventListener("change", e => { govState.policy = e.target.value; renderGov(body); });
    body.querySelector("#g-act").addEventListener("change", e => { govState.action = e.target.value; renderGov(body); });
  }

  function renderCidr(body) {
    const vnet = parseCidr(cidrState.vnetCidr);
    const parsedSubs = cidrState.subnets.map((s, idx) => ({ ...s, idx, info: parseCidr(s.cidr), issues: [] }));

    // Validate each subnet
    parsedSubs.forEach((s, i) => {
      if (!s.info) { s.issues.push("Invalid CIDR syntax (use x.x.x.x/8..29)"); return; }
      if (vnet && (s.info.start < vnet.start || s.info.end > vnet.end)) {
        s.issues.push(`Outside VNet range (${vnet.startStr}–${vnet.endStr})`);
      }
      if (s.name === "AzureBastionSubnet" && s.info.prefix > 26) {
        s.issues.push("AzureBastionSubnet MUST be /26 or larger!");
      }
      if (s.name.toLowerCase().includes("bastion") && s.name !== "AzureBastionSubnet") {
        s.issues.push("Must be named EXACTLY 'AzureBastionSubnet'");
      }
      if (s.name === "GatewaySubnet" && s.info.prefix > 27) {
        s.issues.push("GatewaySubnet should be /27 or larger (min /29)");
      }
      parsedSubs.forEach((o, j) => {
        if (i !== j && o.info && s.info.start <= o.info.end && o.info.start <= s.info.end) {
          s.issues.push(`OVERLAPS with '${o.name}' (${o.cidr})`);
        }
      });
    });

    const totalAllocated = parsedSubs.reduce((acc, s) => acc + (s.info ? s.info.size : 0), 0);

    body.innerHTML = `
      <div class="space-y-4">
        <div class="flex flex-wrap items-end justify-between gap-3 bg-[var(--content)] border border-[var(--card-border)] rounded-xl p-3.5 text-xs">
          <div class="flex flex-wrap items-end gap-3">
            <label class="space-y-1 block">
              <span class="font-semibold text-[var(--muted-foreground)]">VNet Address Space</span>
              <input id="vnet-cidr-in" type="text" value="${cidrState.vnetCidr}" class="px-2.5 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] font-mono text-[var(--foreground)] w-40" />
            </label>
            <div class="text-[var(--muted-foreground)] pb-1.5">
              ${vnet ? `Range: <strong class="font-mono text-[var(--foreground)]">${vnet.startStr} – ${vnet.endStr}</strong> (${vnet.size.toLocaleString()} total IPs • ${totalAllocated.toLocaleString()} carved)` : `<span style="color:var(--error)">Invalid VNet CIDR</span>`}
            </div>
          </div>
          <div class="flex gap-2">
            <button id="cidr-broken-preset" class="px-2.5 py-1.5 rounded-lg bg-[var(--secondary)] text-[var(--secondary-foreground)] font-semibold cursor-pointer">Load Broken Exam Trap</button>
            <button id="cidr-clean-preset" class="px-2.5 py-1.5 rounded-lg bg-[var(--secondary)] text-[var(--secondary-foreground)] font-semibold cursor-pointer">Reset Clean Hub</button>
          </div>
        </div>

        <div class="space-y-2">
          ${parsedSubs.map(s => {
            const ok = s.issues.length === 0;
            return `
              <div class="bg-[var(--content)] border rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style="border-color: ${ok ? "var(--card-border)" : "var(--error)"};">
                <div class="space-y-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-mono text-sm font-bold">${s.name}</span>
                    <span class="px-2 py-0.5 rounded bg-[var(--card)] border border-[var(--border)] font-mono text-xs">${s.cidr}</span>
                    <span class="text-xs font-bold" style="color: ${ok ? "var(--success)" : "var(--error)"};">${ok ? "✓ Valid" : "✗ Error"}</span>
                  </div>
                  ${s.info ? `<div class="text-xs text-[var(--muted-foreground)] font-mono">${s.info.startStr} → ${s.info.endStr} • Total: ${s.info.size} − <strong>5 Azure Reserved</strong> = <strong class="text-[var(--foreground)]">${s.info.usable} usable IPs</strong></div>` : ""}
                  ${s.issues.length ? `<div class="text-xs font-semibold" style="color: var(--error);">${s.issues.join(" • ")}</div>` : ""}
                </div>
                <button data-del-sub="${s.idx}" class="text-xs px-2.5 py-1 rounded bg-[var(--card)] border border-[var(--border)] hover:text-[var(--error)] cursor-pointer self-start sm:self-center">Remove</button>
              </div>
            `;
          }).join("")}
        </div>

        <form id="add-sub-form" class="flex flex-wrap gap-2 items-center bg-[var(--content)] border border-[var(--card-border)] rounded-xl p-3 text-xs">
          <input name="name" placeholder="Subnet name (e.g. snet-pe)" required class="px-2.5 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] w-48" />
          <input name="cidr" placeholder="CIDR (e.g. 10.0.5.0/26)" required class="px-2.5 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] font-mono text-[var(--foreground)] w-44" />
          <button type="submit" class="px-3.5 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold cursor-pointer">+ Add Subnet</button>
        </form>
      </div>
    `;

    body.querySelector("#vnet-cidr-in").addEventListener("change", e => { cidrState.vnetCidr = e.target.value; renderCidr(body); });
    body.querySelector("#cidr-broken-preset").addEventListener("click", () => {
      cidrState = {
        vnetCidr: "10.0.0.0/16",
        subnets: [
          { name: "snet-app", cidr: "10.0.1.0/24" },
          { name: "snet-overlap", cidr: "10.0.1.128/25" },
          { name: "BastionSubnet", cidr: "10.0.2.0/27" }
        ]
      };
      renderCidr(body);
    });
    body.querySelector("#cidr-clean-preset").addEventListener("click", () => {
      cidrState = {
        vnetCidr: "10.0.0.0/16",
        subnets: [
          { name: "snet-app", cidr: "10.0.1.0/24" },
          { name: "snet-data", cidr: "10.0.2.0/24" },
          { name: "AzureBastionSubnet", cidr: "10.0.3.0/26" },
          { name: "GatewaySubnet", cidr: "10.0.4.0/27" }
        ]
      };
      renderCidr(body);
    });
    body.querySelectorAll("[data-del-sub]").forEach(b => {
      b.addEventListener("click", () => {
        cidrState.subnets.splice(Number(b.dataset.delSub), 1);
        renderCidr(body);
      });
    });
    body.querySelector("#add-sub-form").addEventListener("submit", e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      cidrState.subnets.push({ name: fd.get("name").trim(), cidr: fd.get("cidr").trim() });
      renderCidr(body);
    });
  }

  return { render };
})();
