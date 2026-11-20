// =============================================================================
// AZ-104 OPS QUEST — 3 INTERACTIVE AZURE BROWSER SIMULATORS (VANILLA CSS)
// 1. NSG Packet Tracer (Subnet NSG + NIC NSG + Default Rules)
// 2. RBAC + Resource Lock + Azure Policy Precedence Evaluator
// 3. Azure "-5 IP" Subnet & CIDR Planner (Overlap + Bastion /26 Validator)
// =============================================================================

window.AZ104_SIMS = (function () {
  let activeSim = "nsg";

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
        { prio: 65000, action: "Allow", source: "VirtualNetwork", port: "*", name: "AllowVnetInBound (Default)" },
        { prio: 65001, action: "Allow", source: "AzureLoadBalancer", port: "*", name: "AllowAzureLoadBalancerInBound (Default)" },
        { prio: 65500, action: "Deny", source: "Any", port: "*", name: "DenyAllInBound (Default)" }
      ];
    }
    return [
      { prio: 65000, action: "Allow", source: "VirtualNetwork", port: "*", name: "AllowVnetOutBound (Default)" },
      { prio: 65001, action: "Allow", source: "Internet", port: "*", name: "AllowInternetOutBound (Default)" },
      { prio: 65500, action: "Deny", source: "Any", port: "*", name: "DenyAllOutBound (Default)" }
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

  // SIM 2: RBAC + LOCK + POLICY
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

    let rbacOk = false, rbacMsg = "";
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

    let lockOk = true, lockMsg = "No Resource Lock blocking this action.";
    if (govState.lock === "CanNotDelete" && act.op === "delete") {
      lockOk = false;
      lockMsg = "BLOCKED by CanNotDelete lock! Locks override even Subscription Owners — remove the lock first.";
    } else if (govState.lock === "ReadOnly" && (act.op === "delete" || act.op === "write_post" || act.op === "create" || act.op === "rbac")) {
      lockOk = false;
      lockMsg = act.op === "write_post"
        ? "BLOCKED by ReadOnly lock! Listing Storage Account keys is a POST operation, so ReadOnly locks block it!"
        : "BLOCKED by ReadOnly lock! Only GET read operations are allowed until the lock is removed.";
    } else if (govState.lock !== "None") {
      lockMsg = `${govState.lock} lock is present, but does not block this specific operation.`;
    }
    steps.push({ name: "2. Resource Lock Check", ok: lockOk, msg: lockMsg });
    if (allowed && !lockOk) { allowed = false; finalReason = lockMsg; }

    let polOk = true, polMsg = "No Azure Policy blocking this action.";
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

  // SIM 3: SUBNET PLANNER
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

  function setSim(simId) {
    if (["nsg", "gov", "cidr"].includes(simId)) activeSim = simId;
  }

  function render(container) {
    if (!container) return;
    container.innerHTML = `
      <div class="panel">
        <div class="panel-header">
          <div>
            <div class="panel-title">Interactive Azure Simulators</div>
            <div class="panel-sub">Test 2-gate NSG packet evaluation, RBAC/Lock/Policy collisions, and Azure -5 IP subnet math directly in your browser.</div>
          </div>
          <div class="segmented">
            <button data-sim="nsg" class="seg-btn ${activeSim === "nsg" ? "active" : ""}">1. NSG Packet Tracer</button>
            <button data-sim="gov" class="seg-btn ${activeSim === "gov" ? "active" : ""}">2. RBAC + Lock + Policy</button>
            <button data-sim="cidr" class="seg-btn ${activeSim === "cidr" ? "active" : ""}">3. Azure -5 IP Subnet Planner</button>
          </div>
        </div>
        <div id="sim-body" class="panel-body"></div>
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
      <div style="display:flex; flex-direction:column; gap:18px;">
        <div style="display:flex; flex-wrap:wrap; align-items:center; gap:8px;">
          <span style="font-size:12px; font-weight:600; color:var(--text-secondary);">Load Preset Scenario:</span>
          ${Object.entries(NSG_PRESETS).map(([k, p]) => `
            <button data-preset="${k}" class="btn btn-sm">${p.label}</button>
          `).join("")}
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:12px; padding:14px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
          <label style="display:flex; flex-direction:column; gap:4px; font-size:12px;">
            <span style="color:var(--text-secondary); font-weight:600;">Traffic Direction</span>
            <select id="nsg-dir" class="select">
              <option value="Inbound" ${nsgState.direction === "Inbound" ? "selected" : ""}>Inbound (Subnet NSG → NIC NSG)</option>
              <option value="Outbound" ${nsgState.direction === "Outbound" ? "selected" : ""}>Outbound (NIC NSG → Subnet NSG)</option>
            </select>
          </label>
          <label style="display:flex; flex-direction:column; gap:4px; font-size:12px;">
            <span style="color:var(--text-secondary); font-weight:600;">${isIn ? "Source" : "Destination"} Service Tag</span>
            <select id="nsg-src" class="select">
              ${["Internet", "VirtualNetwork", "AzureLoadBalancer"].map(s => `<option value="${s}" ${nsgState.source === s ? "selected" : ""}>${s}</option>`).join("")}
            </select>
          </label>
          <label style="display:flex; flex-direction:column; gap:4px; font-size:12px;">
            <span style="color:var(--text-secondary); font-weight:600;">Destination Port</span>
            <select id="nsg-port" class="select">
              ${["80", "443", "22", "3389", "445"].map(p => `<option value="${p}" ${nsgState.port === p ? "selected" : ""}>TCP ${p}</option>`).join("")}
            </select>
          </label>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:12px;">
          <div style="padding:14px; background:var(--bg-canvas); border:1px solid ${r1.allowed ? "var(--success)" : "var(--danger)"}; border-radius:var(--radius-md);">
            <div style="display:flex; justify-content:space-between; font-size:12.5px; font-weight:700;">
              <span>${gate1Name}</span>
              <span class="badge ${r1.allowed ? "badge-success" : "badge-danger"}">${r1.allowed ? "PASS →" : "DROPPED"}</span>
            </div>
            <p style="font-size:12px; color:var(--text-secondary); margin-top:6px;">Matched Priority <strong class="mono">${r1.matched.prio}</strong>: ${r1.matched.name} (${r1.matched.action} ${r1.matched.source}:${r1.matched.port})</p>
          </div>

          <div style="padding:14px; background:var(--bg-canvas); border:1px solid ${!r1.allowed ? "var(--border-subtle)" : (r2.allowed ? "var(--success)" : "var(--danger)")}; border-radius:var(--radius-md); opacity:${r1.allowed ? "1" : "0.55"};">
            <div style="display:flex; justify-content:space-between; font-size:12.5px; font-weight:700;">
              <span>${gate2Name}</span>
              <span class="badge ${!r1.allowed ? "" : (r2.allowed ? "badge-success" : "badge-danger")}">${!r1.allowed ? "UNREACHED" : (r2.allowed ? "PASS →" : "DROPPED")}</span>
            </div>
            <p style="font-size:12px; color:var(--text-secondary); margin-top:6px;">${!r1.allowed ? "Packet dropped at Gate 1 before reaching Gate 2." : `Matched Priority <strong class="mono">${r2.matched.prio}</strong>: ${r2.matched.name} (${r2.matched.action} ${r2.matched.source}:${r2.matched.port})`}</p>
          </div>

          <div style="padding:14px; background:var(--bg-canvas); border:1px solid ${finalAllowed ? "var(--success)" : "var(--danger)"}; border-radius:var(--radius-md);">
            <div style="font-size:12.5px; font-weight:700; color:${finalAllowed ? "var(--success)" : "var(--danger)"};">Final Verdict: ${finalAllowed ? "PACKET DELIVERED" : "PACKET BLOCKED"}</div>
            <p style="font-size:12px; color:var(--text-secondary); margin-top:6px;">${finalAllowed ? "Both NSG gates independently allowed the packet." : "Both Subnet NSG and NIC NSG must independently allow the packet. Lowest priority number wins inside each NSG."}</p>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:14px;">
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
      <div style="padding:14px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md); display:flex; flex-direction:column; gap:10px;">
        <div style="font-size:13px; font-weight:650;">${title}</div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          ${sorted.length ? sorted.map(r => `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:7px 10px; background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); font-size:12px;">
              <span class="mono"><strong>${r.prio}</strong> • <span style="color:${r.action === "Allow" ? "var(--success)" : "var(--danger)"}">${r.action}</span> • ${r.source}:${r.port}</span>
              <button data-del-rule="${listKey}:${rules.indexOf(r)}" class="btn btn-sm" style="padding:2px 7px;">Remove</button>
            </div>
          `).join("") : `<div style="font-size:12px; color:var(--text-secondary);">No custom rules (using Azure defaults 65000–65500).</div>`}
        </div>
        <form data-add-rule="${listKey}" style="display:flex; flex-wrap:wrap; gap:6px; padding-top:4px;">
          <input name="prio" type="number" min="100" max="4096" value="110" class="input mono" style="width:72px;" title="Priority (100-4096)" />
          <select name="action" class="select"><option value="Allow">Allow</option><option value="Deny">Deny</option></select>
          <select name="source" class="select">
            <option value="Any">Any</option>
            <option value="Internet">Internet</option>
            <option value="VirtualNetwork">VirtualNetwork</option>
            <option value="AzureLoadBalancer">AzureLoadBalancer</option>
          </select>
          <select name="port" class="select">
            <option value="*">*</option><option value="80">80</option><option value="443">443</option><option value="22">22</option><option value="3389">3389</option><option value="445">445</option>
          </select>
          <button type="submit" class="btn btn-primary btn-sm">+ Add Rule</button>
        </form>
      </div>
    `;
  }

  function renderGov(body) {
    const res = evaluateGovernance();
    body.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:18px;">
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(175px, 1fr)); gap:12px; padding:14px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
          <label style="display:flex; flex-direction:column; gap:4px; font-size:12px;">
            <span style="font-weight:600; color:var(--text-secondary);">Control Plane RBAC</span>
            <select id="g-ctrl" class="select">
              ${["None", "Reader", "Contributor", "Owner", "User Access Administrator"].map(r => `<option value="${r}" ${govState.controlRole === r ? "selected" : ""}>${r}</option>`).join("")}
            </select>
          </label>
          <label style="display:flex; flex-direction:column; gap:4px; font-size:12px;">
            <span style="font-weight:600; color:var(--text-secondary);">Data Plane RBAC</span>
            <select id="g-data" class="select">
              ${["None", "Storage Blob Data Reader", "Storage Blob Data Contributor"].map(r => `<option value="${r}" ${govState.dataRole === r ? "selected" : ""}>${r}</option>`).join("")}
            </select>
          </label>
          <label style="display:flex; flex-direction:column; gap:4px; font-size:12px;">
            <span style="font-weight:600; color:var(--text-secondary);">Resource Lock</span>
            <select id="g-lock" class="select">
              ${["None", "CanNotDelete", "ReadOnly"].map(r => `<option value="${r}" ${govState.lock === r ? "selected" : ""}>${r}</option>`).join("")}
            </select>
          </label>
          <label style="display:flex; flex-direction:column; gap:4px; font-size:12px;">
            <span style="font-weight:600; color:var(--text-secondary);">Azure Policy</span>
            <select id="g-pol" class="select">
              <option value="None" ${govState.policy === "None" ? "selected" : ""}>None</option>
              <option value="deny_region" ${govState.policy === "deny_region" ? "selected" : ""}>Deny: East US Only</option>
              <option value="modify_tag" ${govState.policy === "modify_tag" ? "selected" : ""}>Modify: Add Required Tag</option>
            </select>
          </label>
          <label style="display:flex; flex-direction:column; gap:4px; font-size:12px;">
            <span style="font-weight:600; color:var(--text-secondary);">Action Attempted</span>
            <select id="g-act" class="select">
              ${Object.entries(GOV_ACTIONS).map(([k, v]) => `<option value="${k}" ${govState.action === k ? "selected" : ""}>${v.label}</option>`).join("")}
            </select>
          </label>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:12px;">
          ${res.steps.map(s => `
            <div style="padding:14px; background:var(--bg-canvas); border:1px solid ${s.ok ? "var(--success)" : "var(--danger)"}; border-radius:var(--radius-md);">
              <div style="display:flex; justify-content:space-between; font-size:12.5px; font-weight:700;">
                <span>${s.name}</span>
                <span class="badge ${s.ok ? "badge-success" : "badge-danger"}">${s.ok ? "PASS" : "BLOCKED"}</span>
              </div>
              <p style="font-size:12px; color:var(--text-secondary); margin-top:6px;">${s.msg}</p>
            </div>
          `).join("")}
        </div>

        <div style="padding:16px; background:var(--bg-canvas); border:1px solid ${res.allowed ? "var(--success)" : "var(--danger)"}; border-radius:var(--radius-md);">
          <div style="font-size:14px; font-weight:700; color:${res.allowed ? "var(--success)" : "var(--danger)"};">${res.allowed ? "ACTION ALLOWED" : "ACTION DENIED"}</div>
          <p style="font-size:13px; margin-top:4px;">${res.finalReason}</p>
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

    parsedSubs.forEach((s, i) => {
      if (!s.info) { s.issues.push("Invalid CIDR syntax (use x.x.x.x/8..29)"); return; }
      if (vnet && (s.info.start < vnet.start || s.info.end > vnet.end)) {
        s.issues.push(`Outside VNet range (${vnet.startStr}–${vnet.endStr})`);
      }
      if (s.name === "AzureBastionSubnet" && s.info.prefix > 26) {
        s.issues.push("AzureBastionSubnet MUST be /26 or larger");
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
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:12px; padding:14px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
          <div style="display:flex; flex-wrap:wrap; align-items:flex-end; gap:12px;">
            <label style="display:flex; flex-direction:column; gap:4px; font-size:12px;">
              <span style="font-weight:600; color:var(--text-secondary);">VNet Address Space</span>
              <input id="vnet-cidr-in" type="text" value="${cidrState.vnetCidr}" class="input mono" style="width:155px;" />
            </label>
            <div style="font-size:12.5px; color:var(--text-secondary); padding-bottom:6px;">
              ${vnet ? `Range: <strong class="mono" style="color:var(--text-primary);">${vnet.startStr} – ${vnet.endStr}</strong> (${vnet.size.toLocaleString()} total IPs • ${totalAllocated.toLocaleString()} carved)` : `<span style="color:var(--danger)">Invalid VNet CIDR</span>`}
            </div>
          </div>
          <div style="display:flex; gap:8px;">
            <button id="cidr-broken-preset" class="btn btn-sm">Load Broken Exam Trap</button>
            <button id="cidr-clean-preset" class="btn btn-sm">Reset Clean Hub</button>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px;">
          ${parsedSubs.map(s => {
            const ok = s.issues.length === 0;
            return `
              <div style="padding:12px 14px; background:var(--bg-canvas); border:1px solid ${ok ? "var(--border-subtle)" : "var(--danger)"}; border-radius:var(--radius-md); display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px;">
                <div style="display:flex; flex-direction:column; gap:4px;">
                  <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                    <span class="mono" style="font-weight:700; font-size:13.5px;">${s.name}</span>
                    <span class="badge mono">${s.cidr}</span>
                    <span class="badge ${ok ? "badge-success" : "badge-danger"}">${ok ? "Valid" : "Conflict"}</span>
                  </div>
                  ${s.info ? `<div class="mono" style="font-size:12px; color:var(--text-secondary);">${s.info.startStr} → ${s.info.endStr} • Total: ${s.info.size} − <strong>5 Azure Reserved</strong> = <strong style="color:var(--text-primary);">${s.info.usable} usable IPs</strong></div>` : ""}
                  ${s.issues.length ? `<div style="font-size:12px; font-weight:600; color:var(--danger);">${s.issues.join(" • ")}</div>` : ""}
                </div>
                <button data-del-sub="${s.idx}" class="btn btn-sm">Remove</button>
              </div>
            `;
          }).join("")}
        </div>

        <form id="add-sub-form" style="display:flex; flex-wrap:wrap; gap:8px; align-items:center; padding:12px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
          <input name="name" placeholder="Subnet name (e.g. snet-pe)" required class="input" style="width:200px;" />
          <input name="cidr" placeholder="CIDR (e.g. 10.0.5.0/26)" required class="input mono" style="width:175px;" />
          <button type="submit" class="btn btn-primary btn-sm">+ Add Subnet</button>
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

  return { render, setSim };
})();
