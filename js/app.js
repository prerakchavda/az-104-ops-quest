// =============================================================================
// AZ-104 OPS QUEST — MAIN APPLICATION CONTROLLER (v3 EDITORIAL WORKSPACE)
// Connects Overview Readiness Tracker, Dual-Pace Study Plan & Step-by-Step Lab
// Guides, 4 Multi-Domain Integration Capstones, Practice Studio, and Blueprint
// =============================================================================

(function () {
  const { NODES, EDGES, DOMAINS, WEEKS, MS_BLUEPRINT } = window.AZ104_CORE;
  const { TICKETS, BUG_HUNTS, SPEEDRUN_CARDS, CASE_STUDIES, SCAVENGER_HUNTS } = window.AZ104_DRILLS;
  const { OFFICIAL_MS_LABS, INTEGRATION_LABS, BLITZ_WEEKS, getGuideForSprint, getGuideByKey } = window.AZ104_GUIDES;

  const STORAGE_KEY = "az104_northstar_quest_v3";
  let state = {
    activeView: "overview",
    planSub: "steady",      // "steady" | "blitz" | "capstones" | "topology"
    planMode: "steady",     // "steady" | "blitz" (used by readiness engine)
    pracSub: "tickets",     // "tickets" | "bughunts" | "simulators" | "casestudies" | "scavenger" | "speedrun"
    selectedNode: "compute",
    checked: {},            // 8-week sprints
    blitzChecked: {},       // 21-day blitz days
    capstoneChecked: {},    // 4 multi-domain integration capstones
    openGuides: {},         // { sprintOrBlitzOrCapId: true }
    solvedTickets: {},
    solvedBugHunts: {},
    solvedCaseQ: {},
    solvedHunts: {},
    activeTicket: "t1",
    ticketFilter: "all",
    activeBugHunt: "bh1",
    activeCaseStudy: "cs1",
    activeCaseTab: "Overview",
    openWeeks: { 1: true },
    openBlitzWeeks: { 1: true },
    bestSpeedRun: 0,
    missedTraps: {},
    domainStats: {},
    blueprintChecked: {},
    mockLogs: [],
    studyDates: [],
    rescueCount: 0
  };

  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem("az104_northstar_quest_v2") ||
      localStorage.getItem("az104_northstar_quest_v1") ||
      "null"
    );
    if (saved && typeof saved === "object") state = { ...state, ...saved };
  } catch (_) {}

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  // ---------------------------------------------------------------------------
  // STREAK & ACTIVITY LOGGING
  // ---------------------------------------------------------------------------
  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function recordStudyActivity() {
    if (!Array.isArray(state.studyDates)) state.studyDates = [];
    const today = todayKey();
    if (!state.studyDates.includes(today)) {
      state.studyDates.push(today);
      saveState();
    }
  }

  function calcWeekdayStreak() {
    const set = new Set(state.studyDates || []);
    if (set.size === 0) return 0;
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const dow = d.getDay();
      if (set.has(k)) streak++;
      else if (i === 0 || dow === 0 || dow === 6) { /* allow today or weekend */ }
      else break;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }

  function escapeHtml(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // ---------------------------------------------------------------------------
  // THEME (CHARCOAL DARK DEFAULT, WARM PAPER LIGHT TOGGLE)
  // ---------------------------------------------------------------------------
  const themeBtn = document.getElementById("theme-toggle");
  function applyTheme(mode) {
    document.documentElement.classList.toggle("light", mode === "light");
    themeBtn.textContent = mode === "light" ? "Charcoal Dark" : "Light Theme";
    try { localStorage.setItem("az104_theme", mode); } catch (_) {}
  }
  applyTheme(localStorage.getItem("az104_theme") || "dark");
  themeBtn.addEventListener("click", () => {
    applyTheme(document.documentElement.classList.contains("light") ? "dark" : "light");
  });

  // Mobile Menu Drawer
  const sidebarEl = document.getElementById("app-sidebar");
  document.getElementById("mobile-menu-btn").addEventListener("click", () => {
    sidebarEl.classList.toggle("open");
  });

  // Export & Import JSON
  document.getElementById("btn-export").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `az104-workspace-progress-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  const importInput = document.getElementById("import-file");
  document.getElementById("btn-import").addEventListener("click", () => importInput.click());
  importInput.addEventListener("change", e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (parsed && typeof parsed === "object") {
          state = { ...state, ...parsed };
          saveState();
          renderAll();
        }
      } catch (_) {
        alert("Could not parse that progress JSON file.");
      }
    };
    reader.readAsText(file);
    importInput.value = "";
  });

  // ---------------------------------------------------------------------------
  // PRIMARY SIDEBAR NAVIGATION (4 VIEWS)
  // ---------------------------------------------------------------------------
  function switchView(viewId) {
    state.activeView = viewId;
    saveState();
    document.querySelectorAll("[data-view]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.view === viewId);
    });
    document.querySelectorAll(".view-section").forEach(sec => {
      sec.classList.toggle("hidden", sec.id !== "view-" + viewId);
    });
    sidebarEl.classList.remove("open");
    if (viewId === "overview") renderOverview();
    if (viewId === "plan") renderPlanView();
    if (viewId === "practice") renderPracticeView();
    if (viewId === "blueprint") renderBlueprint();
  }

  document.querySelectorAll("[data-view]").forEach(btn => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });

  document.getElementById("btn-jump-plan").addEventListener("click", () => switchView("plan"));

  // ---------------------------------------------------------------------------
  // VIEW 1: OVERVIEW & UNIFIED DOMAIN READINESS TRACKER
  // ---------------------------------------------------------------------------
  function renderOverview() {
    const report = window.AZ104_READINESS.compute(state);
    const capDone = Object.values(state.capstoneChecked || {}).filter(Boolean).length;
    const isBlitz = state.planMode === "blitz";
    const planDone = isBlitz
      ? Object.values(state.blitzChecked || {}).filter(Boolean).length
      : Object.values(state.checked || {}).filter(Boolean).length;
    const planTotal = isBlitz ? 21 : 40;
    const ticketsDone = Object.values(state.solvedTickets || {}).filter(Boolean).length;

    // Sidebar badges
    document.getElementById("sidebar-readiness-pill").textContent = `${report.overallPct}%`;
    document.getElementById("nav-plan-count").textContent = `${planDone}/${planTotal}`;
    document.getElementById("nav-practice-count").textContent = `${ticketsDone}/${TICKETS.length}`;
    document.getElementById("nav-bp-count").textContent = `${report.totalBpDone}/${report.totalBpAll}`;

    // Top 4 Metrics
    document.getElementById("ov-readiness-pct").textContent = `${report.overallPct}%`;
    document.getElementById("ov-scaled-est").textContent = `Est. scaled score: ${report.estimatedScaledScore} / 1000 (Pass: 700)`;
    document.getElementById("ov-bp-progress").textContent = `${report.totalBpDone} / ${report.totalBpAll}`;
    document.getElementById("ov-cap-progress").textContent = `${capDone} / 4`;
    document.getElementById("ov-streak").textContent = `${calcWeekdayStreak()} days`;

    // "Where You Need the Most Work" Diagnostic Card
    const w = report.weakest;
    const w2 = report.secondWeakest;
    const weakPanel = document.getElementById("ov-weakspot-panel");
    weakPanel.innerHTML = `
      <div class="panel-header">
        <div>
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span class="badge badge-warning">Priority Focus Diagnostic</span>
            <h2 class="panel-title">Where You Need the Most Work Right Now: ${w.name} (${w.weightLabel} of exam)</h2>
          </div>
          <div class="panel-sub" style="margin-top:4px;">
            Current Mastery: <strong class="mono" style="color:var(--text-primary);">${w.masteryPct}%</strong> — ${w.diagnosticReason}.
            ${w2 ? `Next priority after this: <strong>${w2.shortName}</strong> (${w2.masteryPct}%).` : ""}
          </div>
        </div>
      </div>
      <div class="panel-body" style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px;">
        <div style="font-size:13px; color:var(--text-secondary);">
          Recommended Official Microsoft Labs: <strong style="color:var(--text-primary);">${w.recMsLab}</strong>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          <button id="wk-open-guide" class="btn btn-primary btn-sm">1. Open ${w.shortName} Lab Guide</button>
          <button id="wk-open-cap" class="btn btn-sm">2. Open Multi-Domain Capstone</button>
          <button id="wk-open-tickets" class="btn btn-sm">3. Drill ${w.shortName} P1 Incidents</button>
          <button id="wk-open-sim" class="btn btn-sm">4. Launch Simulator</button>
        </div>
      </div>
    `;

    weakPanel.querySelector("#wk-open-guide").addEventListener("click", () => {
      state.planSub = "steady";
      state.openWeeks[w.recGuideWeek] = true;
      const firstSprintId = `w${w.recGuideWeek}d1`;
      state.openGuides[firstSprintId] = true;
      switchView("plan");
    });

    weakPanel.querySelector("#wk-open-cap").addEventListener("click", () => {
      state.planSub = "capstones";
      state.openGuides[w.recCapstone] = true;
      switchView("plan");
    });

    weakPanel.querySelector("#wk-open-tickets").addEventListener("click", () => {
      state.pracSub = "tickets";
      state.ticketFilter = w.id;
      switchView("practice");
    });

    weakPanel.querySelector("#wk-open-sim").addEventListener("click", () => {
      state.pracSub = "simulators";
      window.AZ104_SIMS.setSim(w.recSim);
      switchView("practice");
    });

    // Per-Domain Mastery Breakdown Rows
    const rowsEl = document.getElementById("ov-domain-rows");
    rowsEl.innerHTML = report.domains.map(d => `
      <div class="domain-row">
        <div class="domain-name-wrap">
          <div class="domain-title-line">
            <span class="domain-dot" style="background:var(${d.colorVar});"></span>
            <span>${d.name}</span>
          </div>
          <div class="domain-meta-line">Exam Weight: ${d.weightLabel} • ${d.recMsLab}</div>
        </div>

        <div>
          <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:5px;">
            <span style="color:var(--text-secondary);">${d.diagnosticReason}</span>
            <strong class="mono">${d.masteryPct}%</strong>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${d.masteryPct}%; background:var(${d.colorVar});"></div>
          </div>
          <div class="domain-signals">
            <span>Blueprint: <strong class="mono" style="color:var(--text-primary);">${d.bpDone}/${d.bpTotal}</strong> (${d.bpPct}%)</span>
            <span>Hands-On Labs: <strong class="mono" style="color:var(--text-primary);">${d.labDone}/${d.labTotal}</strong> (${d.labPct}%)</span>
            <span>P1 Tickets: <strong class="mono" style="color:var(--text-primary);">${d.ticketsDone}/${d.ticketsTotal}</strong></span>
            <span>Quiz Accuracy: <strong class="mono" style="color:var(--text-primary);">${d.quizAttempts ? Math.round((d.quizRight / d.quizAttempts) * 100) + "%" : "—"}</strong></span>
            ${d.mockAvg !== null ? `<span>Mock Avg: <strong class="mono" style="color:var(--text-primary);">${d.mockAvg}%</strong></span>` : ""}
          </div>
        </div>

        <div class="domain-right-col">
          <span class="badge ${d.statusClass}">${d.status}</span>
          <button data-focus-dom="${d.id}" data-focus-wk="${d.recGuideWeek}" class="btn btn-sm">Study Guide →</button>
        </div>
      </div>
    `).join("");

    rowsEl.querySelectorAll("[data-focus-dom]").forEach(btn => {
      btn.addEventListener("click", () => {
        const wk = Number(btn.dataset.focusWk);
        state.planSub = "steady";
        state.openWeeks[wk] = true;
        state.openGuides[`w${wk}d1`] = true;
        switchView("plan");
      });
    });

    // External Mock Exam Log History
    const histEl = document.getElementById("ov-mock-history");
    if (!report.mockLogs.length) {
      histEl.innerHTML = `
        <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px; color:var(--text-secondary); font-size:13px;">
          <span>No practice exam attempts logged yet. Once you take <a href="https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/" target="_blank" rel="noopener">Microsoft's free AI Skills Navigator Practice Assessment</a>, log your domain percentages here so the tracker pinpoints your exact gaps.</span>
        </div>
      `;
    } else {
      histEl.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${report.mockLogs.map((m, idx) => `
            <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px; padding:10px 14px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md); font-size:12.5px;">
              <div>
                <strong>${escapeHtml(m.source)}</strong>
                <span style="color:var(--text-secondary); margin-left:8px;" class="mono">${m.date}</span>
              </div>
              <div style="display:flex; flex-wrap:wrap; align-items:center; gap:10px;" class="mono">
                <span class="badge ${m.overall >= 75 ? "badge-success" : "badge-warning"}">Overall: ${m.overall}%</span>
                <span>ID: ${m.domains.identity}%</span>
                <span>Comp: ${m.domains.compute}%</span>
                <span>Net: ${m.domains.networking}%</span>
                <span>Stor: ${m.domains.storage}%</span>
                <span>Mon: ${m.domains.monitor}%</span>
                <button data-del-mock="${idx}" class="btn btn-sm" style="padding:2px 7px;">Delete</button>
              </div>
            </div>
          `).join("")}
        </div>
      `;
      histEl.querySelectorAll("[data-del-mock]").forEach(btn => {
        btn.addEventListener("click", () => {
          state.mockLogs.splice(Number(btn.dataset.delMock), 1);
          saveState();
          renderOverview();
        });
      });
    }
  }

  // Mock Exam Modal Handlers
  const mockModal = document.getElementById("mock-modal");
  document.getElementById("btn-open-mock-modal").addEventListener("click", () => mockModal.classList.remove("hidden"));
  document.getElementById("btn-open-mock-modal-2").addEventListener("click", () => mockModal.classList.remove("hidden"));
  document.getElementById("mock-modal-close").addEventListener("click", () => mockModal.classList.add("hidden"));

  document.getElementById("mock-form").addEventListener("submit", e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const doms = {
      identity: Math.min(100, Math.max(0, Number(fd.get("identity")) || 0)),
      compute: Math.min(100, Math.max(0, Number(fd.get("compute")) || 0)),
      networking: Math.min(100, Math.max(0, Number(fd.get("networking")) || 0)),
      storage: Math.min(100, Math.max(0, Number(fd.get("storage")) || 0)),
      monitor: Math.min(100, Math.max(0, Number(fd.get("monitor")) || 0))
    };
    const overall = Math.round(
      (doms.identity * 0.225 + doms.compute * 0.225 + doms.networking * 0.175 + doms.storage * 0.175 + doms.monitor * 0.125) / 0.925
    );
    if (!Array.isArray(state.mockLogs)) state.mockLogs = [];
    state.mockLogs.unshift({
      source: fd.get("source"),
      date: todayKey(),
      overall,
      domains: doms
    });
    recordStudyActivity();
    saveState();
    mockModal.classList.add("hidden");
    renderOverview();
  });

  // ---------------------------------------------------------------------------
  // VIEW 2: STUDY PLAN, STEP-BY-STEP GUIDES & 4 MULTI-DOMAIN CAPSTONES
  // ---------------------------------------------------------------------------
  document.querySelectorAll("[data-plan-sub]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.planSub = btn.dataset.planSub;
      if (state.planSub === "steady" || state.planSub === "blitz") {
        state.planMode = state.planSub;
      }
      saveState();
      renderPlanView();
      renderOverview();
    });
  });

  function renderGuideDrawerHtml(guide, drawerId) {
    const msLabLinks = (guide.msLabs || []).map(k => {
      const l = OFFICIAL_MS_LABS[k];
      if (!l) return "";
      return `<a href="${l.url}" target="_blank" rel="noopener" class="btn btn-sm">↗ Official ${l.code}: ${l.title}</a>`;
    }).join("");

    const docLinks = (guide.docLinks || []).map(d =>
      `<a href="${d.url}" target="_blank" rel="noopener" class="btn btn-sm">↗ MS Learn: ${d.label}</a>`
    ).join("");

    return `
      <div class="guide-drawer">
        <div class="guide-grid">
          <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:10px; padding-bottom:12px; border-bottom:1px solid var(--border-subtle);">
            <div>
              <div style="font-size:11.5px; font-weight:600; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.05em;">Step-by-Step Lab &amp; Study Guide</div>
              <div style="font-size:15px; font-weight:700; margin-top:2px;">${escapeHtml(guide.title)}</div>
            </div>
            <span class="badge mono">${escapeHtml(guide.repoScript || "")}</span>
          </div>

          <!-- Official MS Hosted Lab & Doc Links -->
          <div>
            <div style="font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:8px;">Official Microsoft Hosted Lab Instructions &amp; Reference Docs</div>
            <div style="display:flex; flex-wrap:wrap; gap:6px;">
              ${msLabLinks}
              ${docLinks}
            </div>
          </div>

          <!-- Exact Azure Portal Click-Path -->
          <div>
            <div style="font-size:12px; font-weight:600; color:var(--text-secondary);">Exact Azure Portal Walkthrough</div>
            <ol class="step-list">
              ${(guide.portalSteps || []).map(s => `<li>${s}</li>`).join("")}
            </ol>
          </div>

          <!-- Copyable Azure CLI / Bicep Commands -->
          <div>
            <div class="code-block-wrap">
              <div class="code-block-bar">
                <span>Azure Cloud Shell / CLI &amp; Bicep Commands</span>
                <button data-copy-code="${drawerId}" class="btn btn-sm" style="padding:2px 8px;">Copy Commands</button>
              </div>
              <pre id="code-${drawerId}" class="code-pre">${escapeHtml(guide.cliCommands || "")}</pre>
            </div>
          </div>

          <!-- Verification & Exam Takeaway Checks -->
          <div>
            <div style="font-size:12px; font-weight:600; color:var(--text-secondary);">Verification &amp; Exam Trap Checks</div>
            <ul class="step-list">
              ${(guide.verifySteps || []).map(v => `<li>${v}</li>`).join("")}
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  function wireCopyButtons(container) {
    container.querySelectorAll("[data-copy-code]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.copyCode;
        const pre = document.getElementById("code-" + id);
        if (!pre) return;
        navigator.clipboard.writeText(pre.textContent).then(() => {
          const orig = btn.textContent;
          btn.textContent = "Copied ✓";
          setTimeout(() => { btn.textContent = orig; }, 1500);
        }).catch(() => {});
      });
    });
  }

  function renderPlanView() {
    document.querySelectorAll("[data-plan-sub]").forEach(b => {
      b.classList.toggle("active", b.dataset.planSub === state.planSub);
    });

    const schedEl = document.getElementById("plan-schedule-container");
    const capEl = document.getElementById("plan-capstones-container");
    const topoEl = document.getElementById("plan-topology-container");

    const showSched = state.planSub === "steady" || state.planSub === "blitz";
    schedEl.classList.toggle("hidden", !showSched);
    capEl.classList.toggle("hidden", state.planSub !== "capstones");
    topoEl.classList.toggle("hidden", state.planSub !== "topology");

    if (state.planSub === "steady") renderSteadySchedule(schedEl);
    else if (state.planSub === "blitz") renderBlitzSchedule(schedEl);
    else if (state.planSub === "capstones") renderCapstones(capEl);
    else if (state.planSub === "topology") {
      renderMapSelection();
      requestAnimationFrame(drawConnections);
    }
  }

  function renderSteadySchedule(container) {
    container.innerHTML = WEEKS.map(w => {
      const doneInWeek = w.sprints.filter(s => state.checked[s.id]).length;
      const isOpen = !!state.openWeeks[w.num];
      return `
        <div class="panel">
          <button data-week-toggle="${w.num}" class="panel-header" style="width:100%; background:transparent; border:none; border-bottom:${isOpen ? "1px solid var(--border-subtle)" : "none"}; text-align:left; cursor:pointer; color:var(--text-primary); font-family:var(--font-sans);">
            <div style="display:flex; align-items:center; gap:12px;">
              <span class="badge mono">Week ${w.num}</span>
              <div>
                <div class="panel-title">${w.title}</div>
                <div class="panel-sub">${w.msPathTitle} • Official Weight: ${w.weight} • Repo: <span class="mono">${w.labFolder}</span></div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
              <span class="badge ${doneInWeek === 5 ? "badge-success" : ""}">${doneInWeek} / 5 days</span>
              <span style="font-size:12px; color:var(--text-secondary);">${isOpen ? "Hide ▲" : "Expand ▼"}</span>
            </div>
          </button>

          <div class="${isOpen ? "" : "hidden"}">
            <div style="padding:12px 20px; background:var(--bg-canvas); border-bottom:1px solid var(--border-subtle); display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:10px; font-size:12.5px;">
              <span style="color:var(--text-secondary);">${w.story}</span>
              <a href="${w.msPathUrl}" target="_blank" rel="noopener" style="font-weight:600; flex-shrink:0;">↗ Official MS Learn Path</a>
            </div>

            <div class="divider-list">
              ${w.sprints.map(s => {
                const isChecked = !!state.checked[s.id];
                const guideOpen = !!state.openGuides[s.id];
                const guide = getGuideForSprint(s.id);
                const msLabBadges = (guide.msLabs || []).map(k => OFFICIAL_MS_LABS[k] ? OFFICIAL_MS_LABS[k].code : "").filter(Boolean).join(", ");
                return `
                  <div>
                    <div class="sprint-item">
                      <label class="sprint-left" style="cursor:pointer;">
                        <input type="checkbox" data-sprint="${s.id}" ${isChecked ? "checked" : ""} class="checkbox" />
                        <div>
                          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                            <span class="mono" style="font-size:12px; font-weight:700; color:var(--text-secondary);">${s.day}</span>
                            <span class="badge">${s.tag}</span>
                            <span class="badge badge-accent mono">MS ${msLabBadges}</span>
                          </div>
                          <div style="margin-top:4px; font-size:13.5px; ${isChecked ? "text-decoration:line-through; color:var(--text-tertiary);" : ""}">${s.text}</div>
                        </div>
                      </label>
                      <button data-toggle-guide="${s.id}" class="btn btn-sm ${guideOpen ? "btn-primary" : ""}" style="flex-shrink:0;">
                        ${guideOpen ? "Hide Guide ▲" : "Step-by-Step Guide ▼"}
                      </button>
                    </div>
                    ${guideOpen ? renderGuideDrawerHtml(guide, s.id) : ""}
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        </div>
      `;
    }).join("");

    container.querySelectorAll("[data-week-toggle]").forEach(btn => {
      btn.addEventListener("click", () => {
        const n = Number(btn.dataset.weekToggle);
        state.openWeeks[n] = !state.openWeeks[n];
        saveState();
        renderSteadySchedule(container);
      });
    });

    container.querySelectorAll("[data-sprint]").forEach(cb => {
      cb.addEventListener("change", () => {
        state.checked[cb.dataset.sprint] = cb.checked;
        if (cb.checked) recordStudyActivity();
        saveState();
        renderSteadySchedule(container);
        renderOverview();
      });
    });

    container.querySelectorAll("[data-toggle-guide]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.toggleGuide;
        state.openGuides[id] = !state.openGuides[id];
        saveState();
        renderSteadySchedule(container);
      });
    });

    wireCopyButtons(container);
  }

  function renderBlitzSchedule(container) {
    container.innerHTML = BLITZ_WEEKS.map(w => {
      const doneInWeek = w.days.filter(d => state.blitzChecked && state.blitzChecked[d.id]).length;
      const isOpen = !!state.openBlitzWeeks[w.num];
      return `
        <div class="panel">
          <button data-bweek-toggle="${w.num}" class="panel-header" style="width:100%; background:transparent; border:none; border-bottom:${isOpen ? "1px solid var(--border-subtle)" : "none"}; text-align:left; cursor:pointer; color:var(--text-primary); font-family:var(--font-sans);">
            <div style="display:flex; align-items:center; gap:12px;">
              <span class="badge badge-warning mono">Blitz W${w.num}</span>
              <div>
                <div class="panel-title">${w.title}</div>
                <div class="panel-sub">${w.subtitle}</div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
              <span class="badge ${doneInWeek === 7 ? "badge-success" : ""}">${doneInWeek} / 7 days</span>
              <span style="font-size:12px; color:var(--text-secondary);">${isOpen ? "Hide ▲" : "Expand ▼"}</span>
            </div>
          </button>

          <div class="${isOpen ? "" : "hidden"} divider-list">
            ${w.days.map(d => {
              const isChecked = !!(state.blitzChecked && state.blitzChecked[d.id]);
              const guideOpen = !!state.openGuides[d.id];
              const guide = getGuideByKey(d.guide);
              const msLabBadges = (guide.msLabs || []).map(k => OFFICIAL_MS_LABS[k] ? OFFICIAL_MS_LABS[k].code : "").filter(Boolean).join(", ");
              return `
                <div>
                  <div class="sprint-item">
                    <label class="sprint-left" style="cursor:pointer;">
                      <input type="checkbox" data-blitz="${d.id}" ${isChecked ? "checked" : ""} class="checkbox" />
                      <div>
                        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                          <span class="mono" style="font-size:12px; font-weight:700; color:var(--text-secondary);">${d.day}</span>
                          <strong style="font-size:13.5px;">${d.title}</strong>
                          <span class="badge badge-accent mono">MS ${msLabBadges}</span>
                        </div>
                        <div style="margin-top:4px; font-size:13px; color:var(--text-secondary); ${isChecked ? "text-decoration:line-through;" : ""}">${d.task}</div>
                      </div>
                    </label>
                    <button data-toggle-bguide="${d.id}" class="btn btn-sm ${guideOpen ? "btn-primary" : ""}" style="flex-shrink:0;">
                      ${guideOpen ? "Hide Guide ▲" : "Step-by-Step Guide ▼"}
                    </button>
                  </div>
                  ${guideOpen ? renderGuideDrawerHtml(guide, d.id) : ""}
                </div>
              `;
            }).join("")}
          </div>
        </div>
      `;
    }).join("");

    container.querySelectorAll("[data-bweek-toggle]").forEach(btn => {
      btn.addEventListener("click", () => {
        const n = Number(btn.dataset.bweekToggle);
        state.openBlitzWeeks[n] = !state.openBlitzWeeks[n];
        saveState();
        renderBlitzSchedule(container);
      });
    });

    container.querySelectorAll("[data-blitz]").forEach(cb => {
      cb.addEventListener("change", () => {
        if (!state.blitzChecked) state.blitzChecked = {};
        state.blitzChecked[cb.dataset.blitz] = cb.checked;
        if (cb.checked) recordStudyActivity();
        saveState();
        renderBlitzSchedule(container);
        renderOverview();
      });
    });

    container.querySelectorAll("[data-toggle-bguide]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.toggleBguide;
        state.openGuides[id] = !state.openGuides[id];
        saveState();
        renderBlitzSchedule(container);
      });
    });

    wireCopyButtons(container);
  }

  function renderCapstones(container) {
    container.innerHTML = INTEGRATION_LABS.map(cap => {
      const isDone = !!(state.capstoneChecked && state.capstoneChecked[cap.id]);
      const isOpen = state.openGuides[cap.id] !== false; // Open by default on first visit
      return `
        <div class="panel">
          <div class="panel-header">
            <label style="display:flex; align-items:flex-start; gap:12px; cursor:pointer; flex:1;">
              <input type="checkbox" data-cap="${cap.id}" ${isDone ? "checked" : ""} class="checkbox" />
              <div>
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                  <span class="badge badge-accent mono">${cap.code}</span>
                  <span class="badge mono">${cap.estTime}</span>
                  ${cap.domainLabels.map(dl => `<span class="badge">${dl}</span>`).join("")}
                </div>
                <div class="panel-title" style="margin-top:6px;">${cap.title}</div>
                <div class="panel-sub">${cap.subtitle}</div>
              </div>
            </label>
            <button data-toggle-cap="${cap.id}" class="btn btn-sm ${isOpen ? "btn-primary" : ""}">
              ${isOpen ? "Hide Walkthrough ▲" : "Open Walkthrough ▼"}
            </button>
          </div>

          <div class="${isOpen ? "" : "hidden"} panel-body" style="display:flex; flex-direction:column; gap:16px;">
            <div style="padding:12px 14px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md); font-size:12.5px;" class="mono">
              <div style="font-size:11px; color:var(--text-secondary); text-transform:uppercase; margin-bottom:4px;">Connected Service Flow</div>
              ${escapeHtml(cap.architecture)}
            </div>

            <div style="display:flex; flex-wrap:wrap; gap:6px;">
              ${cap.msLabs.map(k => {
                const l = OFFICIAL_MS_LABS[k];
                return l ? `<a href="${l.url}" target="_blank" rel="noopener" class="btn btn-sm">↗ Official ${l.code}: ${l.title}</a>` : "";
              }).join("")}
              <span class="badge mono" style="padding:5px 10px;">Repo Guide: ${cap.repoFile}</span>
            </div>

            <div>
              <div style="font-size:12px; font-weight:600; color:var(--text-secondary);">Step-by-Step Azure Portal Build</div>
              <ol class="step-list">
                ${cap.portalSteps.map(s => `<li>${s}</li>`).join("")}
              </ol>
            </div>

            <div class="code-block-wrap">
              <div class="code-block-bar">
                <span>Automated Deployment &amp; Wiring (${cap.repoScript})</span>
                <button data-copy-code="${cap.id}" class="btn btn-sm" style="padding:2px 8px;">Copy Commands</button>
              </div>
              <pre id="code-${cap.id}" class="code-pre">${escapeHtml(cap.cliCommands)}</pre>
            </div>

            <div>
              <div style="font-size:12px; font-weight:600; color:var(--text-secondary);">End-to-End Verification &amp; Deliberate Break Test</div>
              <ul class="step-list">
                ${cap.verifySteps.map(v => `<li>${v}</li>`).join("")}
              </ul>
            </div>
          </div>
        </div>
      `;
    }).join("");

    container.querySelectorAll("[data-cap]").forEach(cb => {
      cb.addEventListener("change", () => {
        if (!state.capstoneChecked) state.capstoneChecked = {};
        state.capstoneChecked[cb.dataset.cap] = cb.checked;
        if (cb.checked) recordStudyActivity();
        saveState();
        renderCapstones(container);
        renderOverview();
      });
    });

    container.querySelectorAll("[data-toggle-cap]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.toggleCap;
        state.openGuides[id] = state.openGuides[id] === false ? true : false;
        saveState();
        renderCapstones(container);
      });
    });

    wireCopyButtons(container);
  }

  // Topology Map inside Study Plan
  function renderMapSelection() {
    const sel = state.selectedNode;
    const node = NODES[sel];
    const connectedSet = new Set([sel, ...node.connectsTo]);

    document.querySelectorAll("[data-node]").forEach(el => {
      const id = el.dataset.node;
      el.classList.remove("node-selected", "node-connected", "node-dimmed");
      if (id === sel) el.classList.add("node-selected");
      else if (connectedSet.has(id)) el.classList.add("node-connected");
      else el.classList.add("node-dimmed");
    });

    const inspector = document.getElementById("node-inspector");
    if (!inspector) return;
    inspector.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:14px;">
        <div style="padding-bottom:12px; border-bottom:1px solid var(--border-subtle);">
          <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:6px; font-size:11.5px;">
            <span style="color:var(${node.colorVar}); font-weight:700; text-transform:uppercase;">${node.domain}</span>
            <span class="badge">${node.week}</span>
          </div>
          <h3 style="font-size:17px; margin-top:6px;">${node.title}</h3>
          <p style="font-size:13px; color:var(--text-secondary); margin-top:4px;">${node.role}</p>
          <a href="${node.msUrl}" target="_blank" rel="noopener" style="display:inline-block; font-size:12.5px; font-weight:600; margin-top:6px;">↗ ${node.msLabel}</a>
        </div>

        <div>
          <div style="font-size:11.5px; font-weight:600; text-transform:uppercase; color:var(--text-tertiary);">How It Connects Across Domains</div>
          <ul class="step-list" style="margin-top:6px;">
            ${node.whyItConnects.map(line => `<li>${line}</li>`).join("")}
          </ul>
        </div>

        <div>
          <div style="font-size:11.5px; font-weight:600; text-transform:uppercase; color:var(--text-tertiary); margin-bottom:6px;">Connected Services</div>
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            ${node.connectsTo.map(cid => `<button data-jump="${cid}" class="btn btn-sm">↔ ${NODES[cid].title.split(":")[0].split(",")[0]}</button>`).join("")}
          </div>
        </div>

        <div class="code-block-wrap">
          <div class="code-block-bar"><span>Azure CLI / Bicep Snippet</span></div>
          <pre class="code-pre">${escapeHtml(node.snippet)}</pre>
        </div>

        <div style="padding:12px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
          <div style="font-size:12px; font-weight:700; color:var(--warning);">High-Frequency AZ-104 Exam Trap</div>
          <p style="font-size:12.5px; color:var(--text-secondary); margin-top:3px;">${node.examTrap}</p>
        </div>
      </div>
    `;

    inspector.querySelectorAll("[data-jump]").forEach(btn => {
      btn.addEventListener("click", () => { state.selectedNode = btn.dataset.jump; saveState(); renderMapSelection(); });
    });
    drawConnections();
  }

  function drawConnections() {
    const stage = document.getElementById("arch-stage");
    const svg = document.getElementById("arch-svg");
    if (!stage || !svg) return;
    const stageRect = stage.getBoundingClientRect();
    if (stageRect.width === 0) return;

    svg.setAttribute("viewBox", `0 0 ${stageRect.width} ${stageRect.height}`);
    const sel = state.selectedNode;
    const centers = {};
    stage.querySelectorAll("[data-node]").forEach(el => {
      const r = el.getBoundingClientRect();
      centers[el.dataset.node] = { x: r.left - stageRect.left + r.width / 2, y: r.top - stageRect.top + r.height / 2 };
    });

    let paths = "";
    EDGES.forEach(([a, b]) => {
      const p1 = centers[a], p2 = centers[b];
      if (!p1 || !p2) return;
      const active = a === sel || b === sel;
      paths += `<line class="conn-line" x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${active ? "var(--accent)" : "var(--border-strong)"}" stroke-width="${active ? 2.2 : 1}" stroke-opacity="${active ? 0.85 : 0.35}" ${active ? "" : 'stroke-dasharray="4 4"'} />`;
    });
    svg.innerHTML = paths;
  }

  document.querySelectorAll("[data-node]").forEach(el => {
    el.addEventListener("click", () => { state.selectedNode = el.dataset.node; saveState(); renderMapSelection(); });
  });
  window.addEventListener("resize", () => { if (state.activeView === "plan" && state.planSub === "topology") drawConnections(); });

  // ---------------------------------------------------------------------------
  // VIEW 3: PRACTICE STUDIO & SIMULATORS
  // ---------------------------------------------------------------------------
  let selectedOptionForCurrent = null;
  let bugPicks = new Set();

  document.querySelectorAll("[data-prac-sub]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.pracSub = btn.dataset.pracSub;
      saveState();
      renderPracticeView();
    });
  });

  function renderPracticeView() {
    document.querySelectorAll("[data-prac-sub]").forEach(b => {
      b.classList.toggle("active", b.dataset.pracSub === state.pracSub);
    });
    ["tickets", "bughunts", "simulators", "casestudies", "scavenger", "speedrun"].forEach(k => {
      const el = document.getElementById("prac-" + k);
      if (el) el.classList.toggle("hidden", state.pracSub !== k);
    });

    if (state.pracSub === "tickets") renderIncidents();
    else if (state.pracSub === "bughunts") renderBugHunts();
    else if (state.pracSub === "simulators") window.AZ104_SIMS.render(document.getElementById("simulators-root"));
    else if (state.pracSub === "casestudies") renderCaseStudy();
    else if (state.pracSub === "scavenger") renderScavenger();
    else if (state.pracSub === "speedrun") { renderWeaknessRadar(); renderSpeedRun(); }
  }

  function trackDomainResult(domainId, ok, cardId) {
    if (!state.domainStats) state.domainStats = {};
    if (!state.domainStats[domainId]) state.domainStats[domainId] = { right: 0, wrong: 0 };
    if (ok) state.domainStats[domainId].right++;
    else state.domainStats[domainId].wrong++;

    if (cardId) {
      if (!state.missedTraps) state.missedTraps = {};
      if (ok) delete state.missedTraps[cardId];
      else state.missedTraps[cardId] = (state.missedTraps[cardId] || 0) + 1;
    }
    saveState();
    renderOverview();
  }

  function renderIncidents() {
    const filtersEl = document.getElementById("ticket-filters");
    const pills = document.getElementById("ticket-pills");
    const view = document.getElementById("ticket-view");
    const solvedCount = Object.values(state.solvedTickets).filter(Boolean).length;
    document.getElementById("inc-score").textContent = `${solvedCount} / ${TICKETS.length} solved`;

    const filterOpts = [
      { id: "all", label: `All (${TICKETS.length})` },
      { id: "unsolved", label: `Unsolved (${TICKETS.length - solvedCount})` },
      { id: "identity", label: "Identity & Gov" },
      { id: "networking", label: "Networking" },
      { id: "storage", label: "Storage" },
      { id: "compute", label: "Compute" },
      { id: "monitor", label: "Monitor & Backup" }
    ];
    filtersEl.innerHTML = filterOpts.map(f => `
      <button data-tf="${f.id}" class="btn btn-sm ${state.ticketFilter === f.id ? "btn-primary" : ""}">${f.label}</button>
    `).join("");

    filtersEl.querySelectorAll("[data-tf]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.ticketFilter = btn.dataset.tf;
        saveState();
        renderIncidents();
      });
    });

    const visible = TICKETS.filter(t => {
      if (state.ticketFilter === "all") return true;
      if (state.ticketFilter === "unsolved") return !state.solvedTickets[t.id];
      return t.domain === state.ticketFilter;
    });

    if (visible.length && !visible.some(t => t.id === state.activeTicket)) {
      state.activeTicket = visible[0].id;
      selectedOptionForCurrent = null;
    }

    pills.innerHTML = visible.length ? visible.map(t => {
      const active = t.id === state.activeTicket;
      const solved = !!state.solvedTickets[t.id];
      return `<button data-ticket="${t.id}" class="btn btn-sm ${active ? "btn-primary" : ""}">${solved ? "✓ " : ""}${t.code}</button>`;
    }).join("") : `<div style="font-size:13px; color:var(--success); font-weight:600;">All tickets in this filter solved.</div>`;

    pills.querySelectorAll("[data-ticket]").forEach(b => {
      b.addEventListener("click", () => {
        state.activeTicket = b.dataset.ticket;
        selectedOptionForCurrent = state.solvedTickets[state.activeTicket] ? TICKETS.find(x => x.id === state.activeTicket).answer : null;
        saveState();
        renderIncidents();
      });
    });

    const t = visible.find(x => x.id === state.activeTicket) || visible[0];
    if (!t) { view.innerHTML = ""; return; }
    const alreadySolved = !!state.solvedTickets[t.id];
    const chosen = selectedOptionForCurrent !== null ? selectedOptionForCurrent : (alreadySolved ? t.answer : null);

    view.innerHTML = `
      <div style="padding:16px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:6px;">
          <span class="badge badge-danger mono">${t.severity}</span>
          <span class="mono" style="font-size:12px; color:var(--text-secondary);">${t.code}</span>
          <span class="badge">${t.domainLabel}</span>
        </div>
        <h3 style="font-size:16px;">${t.title}</h3>
        <p style="font-size:13.5px; color:var(--text-secondary); margin-top:6px;">${t.symptom}</p>
      </div>

      <div style="font-weight:650; font-size:14px;">${t.question}</div>

      <div style="display:flex; flex-direction:column; gap:8px;">
        ${t.options.map((opt, idx) => {
          let cls = "";
          let tag = "";
          if (chosen !== null) {
            if (idx === t.answer) { cls = "correct"; tag = `<span class="badge badge-success">Correct</span>`; }
            else if (idx === chosen && idx !== t.answer) { cls = "wrong"; tag = `<span class="badge badge-danger">Incorrect</span>`; }
          }
          return `
            <button data-opt="${idx}" class="option-btn ${cls}">
              <span><strong class="mono" style="margin-right:8px; color:var(--text-secondary);">${String.fromCharCode(65 + idx)}.</strong>${opt}</span>
              ${tag}
            </button>
          `;
        }).join("")}
      </div>

      ${chosen !== null ? `
        <div style="padding:16px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
          <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:6px;">
            <span style="font-size:12px; font-weight:700; text-transform:uppercase; color:${chosen === t.answer ? "var(--success)" : "var(--warning)"};">
              ${chosen === t.answer ? "Root Cause & Architectural Wiring" : "Post-Mortem Explanation"}
            </span>
            <a href="${t.msUrl}" target="_blank" rel="noopener" style="font-size:12.5px; font-weight:600;">↗ Verify in Official MS Learn Docs</a>
          </div>
          <p style="font-size:13.5px;">${t.explanation}</p>
        </div>
      ` : ""}
    `;

    view.querySelectorAll("[data-opt]").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.opt);
        selectedOptionForCurrent = idx;
        const ok = idx === t.answer;
        trackDomainResult(t.domain, ok, null);
        if (ok) { state.solvedTickets[t.id] = true; recordStudyActivity(); }
        saveState();
        renderIncidents();
        renderOverview();
      });
    });
  }

  function renderBugHunts() {
    const pills = document.getElementById("bh-pills");
    const view = document.getElementById("bh-view");
    const solvedCount = Object.values(state.solvedBugHunts || {}).filter(Boolean).length;
    document.getElementById("bh-score").textContent = `${solvedCount} / ${BUG_HUNTS.length} defused`;

    pills.innerHTML = BUG_HUNTS.map((b, i) => {
      const active = b.id === state.activeBugHunt;
      const solved = !!state.solvedBugHunts[b.id];
      return `<button data-bh="${b.id}" class="btn btn-sm ${active ? "btn-primary" : ""}">${solved ? "✓ " : ""}#${i + 1}: ${b.domain}</button>`;
    }).join("");

    pills.querySelectorAll("[data-bh]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.activeBugHunt = btn.dataset.bh;
        bugPicks = new Set();
        saveState();
        renderBugHunts();
      });
    });

    const bh = BUG_HUNTS.find(x => x.id === state.activeBugHunt) || BUG_HUNTS[0];
    const already = !!state.solvedBugHunts[bh.id];
    const donePicking = bugPicks.size === 2 || already;
    const exactMatch = already || (bugPicks.size === 2 && bh.bugLines.every(l => bugPicks.has(l)));

    view.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div>
          <h3 style="font-size:15.5px;">${bh.title}</h3>
          <p style="font-size:12.5px; color:var(--text-secondary); margin-top:2px;">Click the 2 buggy lines below (selected: ${already ? 2 : bugPicks.size}/2).</p>
        </div>

        <div class="code-block-wrap" style="padding:8px;">
          ${bh.lines.map((line, idx) => {
            const isBug = bh.bugLines.includes(idx);
            const picked = bugPicks.has(idx) || (already && isBug);
            let border = "1px solid transparent";
            let bg = "transparent";
            if (donePicking) {
              if (isBug) { border = "1px solid var(--success)"; bg = "var(--success-soft)"; }
              else if (picked && !isBug) { border = "1px solid var(--danger)"; bg = "var(--danger-soft)"; }
            } else if (picked) {
              border = "1px solid var(--accent)";
              bg = "var(--accent-soft)";
            }
            return `
              <button data-line="${idx}" style="display:flex; align-items:flex-start; gap:12px; width:100%; text-align:left; padding:6px 10px; border:${border}; background:${bg}; border-radius:var(--radius-sm); color:var(--text-primary); font-family:var(--font-mono); font-size:12.5px; cursor:pointer;">
                <span style="color:var(--text-tertiary); width:20px; flex-shrink:0; user-select:none;">${idx + 1}</span>
                <span style="white-space:pre-wrap;">${escapeHtml(line)}</span>
              </button>
            `;
          }).join("")}
        </div>

        ${donePicking ? `
          <div style="padding:14px 16px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span style="font-size:12px; font-weight:700; text-transform:uppercase; color:${exactMatch ? "var(--success)" : "var(--warning)"};">
                ${exactMatch ? "Sabotage Defused" : "Here are the 2 real bugs (highlighted in green):"}
              </span>
              ${!exactMatch ? `<button id="bh-retry" class="btn btn-sm">Try Again</button>` : ""}
            </div>
            <p style="font-size:13.5px;">${bh.explanation}</p>
          </div>
        ` : ""}
      </div>
    `;

    if (!donePicking) {
      view.querySelectorAll("[data-line]").forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = Number(btn.dataset.line);
          if (bugPicks.has(idx)) bugPicks.delete(idx);
          else if (bugPicks.size < 2) bugPicks.add(idx);
          if (bugPicks.size === 2 && bh.bugLines.every(l => bugPicks.has(l))) {
            state.solvedBugHunts[bh.id] = true;
            recordStudyActivity();
            saveState();
            renderOverview();
          }
          renderBugHunts();
        });
      });
    }
    const retry = view.querySelector("#bh-retry");
    if (retry) retry.addEventListener("click", () => { bugPicks = new Set(); renderBugHunts(); });
  }

  function renderCaseStudy() {
    const cs = CASE_STUDIES.find(c => c.id === state.activeCaseStudy) || CASE_STUDIES[0];
    const tabNames = Object.keys(cs.tabs);
    if (!tabNames.includes(state.activeCaseTab)) state.activeCaseTab = tabNames[0];

    const root = document.getElementById("cs-root");
    root.innerHTML = `
      <div style="display:flex; flex-wrap:wrap; gap:8px;">
        ${CASE_STUDIES.map(c => `
          <button data-cs-pick="${c.id}" class="btn btn-sm ${c.id === cs.id ? "btn-primary" : ""}">${c.title}</button>
        `).join("")}
      </div>

      <div class="topo-layout">
        <div style="background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md); overflow:hidden;">
          <div style="display:flex; flex-wrap:wrap; border-bottom:1px solid var(--border-subtle); background:var(--bg-elevated); padding:4px; gap:4px;">
            ${tabNames.map(tn => `
              <button data-cs-tab="${tn}" class="seg-btn ${tn === state.activeCaseTab ? "active" : ""}">${tn}</button>
            `).join("")}
          </div>
          <div style="padding:16px; font-size:13.5px; line-height:1.65; white-space:pre-line;">${escapeHtml(cs.tabs[state.activeCaseTab])}</div>
        </div>

        <div style="display:flex; flex-direction:column; gap:12px;">
          ${cs.questions.map((q, qi) => {
            const ans = state.solvedCaseQ[q.id];
            const answered = ans !== undefined;
            return `
              <div style="padding:16px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md); display:flex; flex-direction:column; gap:10px;">
                <div style="display:flex; justify-content:space-between; font-size:12px;">
                  <span class="mono" style="color:var(--text-secondary); font-weight:700;">Question ${qi + 1} • ${q.type}</span>
                  ${answered ? `<span class="badge ${ans === q.answer ? "badge-success" : "badge-danger"}">${ans === q.answer ? "Correct" : "Review"}</span>` : ""}
                </div>
                <div style="font-weight:650; font-size:13.5px;">${q.q}</div>
                <div style="display:flex; flex-direction:column; gap:6px;">
                  ${q.options.map((opt, oi) => {
                    let cls = "";
                    if (answered) {
                      if (oi === q.answer) cls = "correct";
                      else if (oi === ans && oi !== q.answer) cls = "wrong";
                    }
                    return `<button data-csq="${q.id}:${oi}" class="option-btn ${cls}" style="padding:9px 12px; font-size:13px;">${opt}</button>`;
                  }).join("")}
                </div>
                ${answered ? `<p style="font-size:12.5px; color:var(--text-secondary); padding-top:8px; border-top:1px solid var(--border-subtle);">${q.why}</p>` : ""}
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;

    root.querySelectorAll("[data-cs-pick]").forEach(b => b.addEventListener("click", () => { state.activeCaseStudy = b.dataset.csPick; state.activeCaseTab = "Overview"; saveState(); renderCaseStudy(); }));
    root.querySelectorAll("[data-cs-tab]").forEach(b => b.addEventListener("click", () => { state.activeCaseTab = b.dataset.csTab; saveState(); renderCaseStudy(); }));
    root.querySelectorAll("[data-csq]").forEach(b => b.addEventListener("click", () => {
      const [qid, oi] = b.dataset.csq.split(":");
      state.solvedCaseQ[qid] = Number(oi);
      recordStudyActivity();
      saveState();
      renderCaseStudy();
      renderOverview();
    }));
  }

  let huntIdx = 0, huntTimer = null, huntSecs = 45, huntRevealed = false;
  function renderScavenger() {
    const h = SCAVENGER_HUNTS[huntIdx];
    const done = Object.values(state.solvedHunts || {}).filter(Boolean).length;
    const root = document.getElementById("scav-root");

    root.innerHTML = `
      <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px;">
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${SCAVENGER_HUNTS.map((x, i) => `
            <button data-sh-pick="${i}" class="btn btn-sm mono ${i === huntIdx ? "btn-primary" : ""}">${state.solvedHunts[x.id] ? "✓ " : ""}#${i + 1}</button>
          `).join("")}
        </div>
        <span class="badge mono">Completed: ${done} / ${SCAVENGER_HUNTS.length}</span>
      </div>

      <div style="padding:18px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md); display:flex; flex-direction:column; gap:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <span style="font-size:12px; font-weight:700; text-transform:uppercase; color:var(--text-secondary);">Open-Book Lookup #${huntIdx + 1} (Target: Under 45 Seconds)</span>
          <div style="display:flex; align-items:center; gap:8px;">
            <span id="sh-clock" class="badge mono" style="font-size:14px; padding:4px 10px;">${huntSecs}s</span>
            <button id="sh-start" class="btn btn-primary btn-sm">Start 45s Clock</button>
          </div>
        </div>
        <div style="font-size:15.5px; font-weight:650;">${h.q}</div>
        <div style="font-size:12.5px; color:var(--text-secondary);">${h.hint}</div>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          <a href="${h.url}" target="_blank" rel="noopener" class="btn btn-sm">↗ Open Microsoft Learn Doc</a>
          <button id="sh-reveal" class="btn btn-sm">Reveal Official Answer &amp; Mark Complete</button>
        </div>
        ${huntRevealed ? `
          <div style="padding:12px 14px; background:var(--bg-surface); border:1px solid var(--success); border-radius:var(--radius-md); font-size:13.5px;">
            <strong style="color:var(--success);">Official Answer:</strong> ${h.answer}
          </div>
        ` : ""}
      </div>
    `;

    root.querySelectorAll("[data-sh-pick]").forEach(b => b.addEventListener("click", () => {
      clearInterval(huntTimer); huntTimer = null; huntSecs = 45; huntRevealed = false;
      huntIdx = Number(b.dataset.shPick);
      renderScavenger();
    }));

    root.querySelector("#sh-start").addEventListener("click", () => {
      clearInterval(huntTimer);
      huntSecs = 45;
      huntTimer = setInterval(() => {
        huntSecs--;
        const c = document.getElementById("sh-clock");
        if (c) c.textContent = `${huntSecs}s`;
        if (huntSecs <= 0) { clearInterval(huntTimer); huntTimer = null; }
      }, 1000);
    });

    root.querySelector("#sh-reveal").addEventListener("click", () => {
      clearInterval(huntTimer); huntTimer = null;
      huntRevealed = true;
      state.solvedHunts[h.id] = true;
      recordStudyActivity();
      saveState();
      renderScavenger();
      renderOverview();
    });
  }

  // 60s Speed Run & Spaced Repetition Queue
  let srMode = "arcade", srRunning = false, srTimeLeft = 60, srScore = 0, srStreak = 0, srDeck = [], srIndex = 0, srTimer = null, srLastFeedback = null;

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function renderWeaknessRadar() {
    const el = document.getElementById("weakness-radar");
    if (!el) return;
    const missedIds = Object.keys(state.missedTraps || {});
    el.innerHTML = `
      <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:10px; padding-bottom:12px; border-bottom:1px solid var(--border-subtle);">
        <span style="font-size:13px; color:var(--text-secondary);">Spaced-Repetition Queue: <strong style="color:var(--text-primary);">${missedIds.length} missed trap(s)</strong> • Personal Best: <strong class="mono" style="color:var(--text-primary);">${state.bestSpeedRun || 0}</strong></span>
        <div class="segmented">
          <button id="sr-mode-arcade" class="seg-btn ${srMode === "arcade" ? "active" : ""}">60s Speed Run (36 Traps)</button>
          <button id="sr-mode-review" class="seg-btn ${srMode === "review" ? "active" : ""}">Missed-Trap Rematch (${missedIds.length})</button>
        </div>
      </div>
    `;
    el.querySelector("#sr-mode-arcade").addEventListener("click", () => {
      clearInterval(srTimer); srRunning = false; srTimeLeft = 60; srMode = "arcade"; renderWeaknessRadar(); renderSpeedRun();
    });
    el.querySelector("#sr-mode-review").addEventListener("click", () => {
      clearInterval(srTimer); srRunning = false; srMode = "review"; srLastFeedback = null;
      srDeck = SPEEDRUN_CARDS.filter(c => state.missedTraps && state.missedTraps[c.id]);
      srIndex = 0;
      renderWeaknessRadar(); renderSpeedRun();
    });
  }

  function updateSRHud() {
    document.getElementById("sr-time").textContent = srMode === "review" ? "∞" : `${srTimeLeft}s`;
    document.getElementById("sr-score").textContent = srScore;
    document.getElementById("sr-streak").textContent = srStreak;
  }

  function renderSpeedRun() {
    const stage = document.getElementById("sr-stage");
    if (!stage) return;
    updateSRHud();

    if (srMode === "review") {
      const remaining = SPEEDRUN_CARDS.filter(c => state.missedTraps && state.missedTraps[c.id]);
      if (!remaining.length) {
        stage.innerHTML = `
          <div style="padding:28px; text-align:center; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
            <div style="font-size:16px; font-weight:700; color:var(--success);">Missed-Trap Queue Is Clear</div>
            <p style="font-size:13px; color:var(--text-secondary); margin-top:4px;">Any trap you miss during the 60s Speed Run automatically lands here until you answer it correctly.</p>
          </div>
        `;
        return;
      }
      const card = remaining[0];
      stage.innerHTML = `
        <div style="padding:20px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md); display:flex; flex-direction:column; gap:14px;">
          <div class="mono" style="font-size:11.5px; color:var(--warning); font-weight:700;">REMATCH QUEUE • ${remaining.length} REMAINING</div>
          <div style="font-size:16px; font-weight:650;">${card.prompt}</div>
          <div class="topo-grid-2">
            ${card.choices.map((c, i) => `<button data-rev-pick="${i}" class="option-btn">${c}</button>`).join("")}
          </div>
          ${srLastFeedback ? `<div style="font-size:12.5px; color:var(--text-secondary); padding-top:8px; border-top:1px solid var(--border-subtle);"><strong style="color:${srLastFeedback.ok ? "var(--success)" : "var(--danger)"}">${srLastFeedback.ok ? "Cleared!" : "Still in queue:"}</strong> ${srLastFeedback.why}</div>` : ""}
        </div>
      `;
      stage.querySelectorAll("[data-rev-pick]").forEach(btn => {
        btn.addEventListener("click", () => {
          const ok = Number(btn.dataset.revPick) === card.answer;
          trackDomainResult(card.domain, ok, card.id);
          if (ok) recordStudyActivity();
          srLastFeedback = { ok, why: card.why };
          renderWeaknessRadar();
          renderSpeedRun();
        });
      });
      return;
    }

    if (!srRunning && srTimeLeft === 60) {
      stage.innerHTML = `
        <div style="padding:28px; text-align:center; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md); display:flex; flex-direction:column; align-items:center; gap:12px;">
          <div style="font-size:16.5px; font-weight:700;">Defuse 36 High-Frequency AZ-104 Exam Traps in 60 Seconds</div>
          <p style="font-size:13px; color:var(--text-secondary); max-width:520px;">Every answer calibrates your per-domain quiz accuracy in Overview, and any miss is queued for spaced repetition.</p>
          <button id="sr-start-btn" class="btn btn-primary">Start 60-Second Run</button>
        </div>
      `;
      document.getElementById("sr-start-btn").addEventListener("click", startSpeedRun);
      return;
    }

    if (!srRunning) {
      stage.innerHTML = `
        <div style="padding:28px; text-align:center; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md); display:flex; flex-direction:column; align-items:center; gap:12px;">
          <div style="font-size:18px; font-weight:700;">Time's Up — Final Score: ${srScore}</div>
          <p style="font-size:13px; color:var(--text-secondary);">Personal Best: <strong>${state.bestSpeedRun || 0}</strong> • Switch to Missed-Trap Rematch above to clear any misses.</p>
          <button id="sr-restart-btn" class="btn btn-primary">Play Again (Shuffle)</button>
        </div>
      `;
      document.getElementById("sr-restart-btn").addEventListener("click", startSpeedRun);
      return;
    }

    const card = srDeck[srIndex % srDeck.length];
    stage.innerHTML = `
      <div style="padding:20px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md); display:flex; flex-direction:column; gap:14px;">
        <div class="mono" style="font-size:11.5px; color:var(--text-secondary);">TRAP #${srIndex + 1} • ${card.domain.toUpperCase()}</div>
        <div style="font-size:16px; font-weight:650;">${card.prompt}</div>
        <div class="topo-grid-2">
          ${card.choices.map((c, i) => `<button data-sr-pick="${i}" class="option-btn">${c}</button>`).join("")}
        </div>
        ${srLastFeedback ? `
          <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; font-size:12.5px; padding-top:8px; border-top:1px solid var(--border-subtle);">
            <span><strong style="color:${srLastFeedback.ok ? "var(--success)" : "var(--danger)"}">${srLastFeedback.ok ? "Correct:" : "Queued for review:"}</strong> ${srLastFeedback.why}</span>
            <a href="${srLastFeedback.url}" target="_blank" rel="noopener">↗ MS Docs</a>
          </div>
        ` : ""}
      </div>
    `;

    stage.querySelectorAll("[data-sr-pick]").forEach(btn => {
      btn.addEventListener("click", () => {
        const ok = Number(btn.dataset.srPick) === card.answer;
        trackDomainResult(card.domain, ok, card.id);
        if (ok) {
          srScore++; srStreak++;
          if (srScore > (state.bestSpeedRun || 0)) { state.bestSpeedRun = srScore; saveState(); }
        } else { srStreak = 0; }
        srLastFeedback = { ok, why: card.why, url: card.url };
        srIndex++;
        if (srIndex % srDeck.length === 0) srDeck = shuffle(SPEEDRUN_CARDS);
        renderWeaknessRadar();
        renderSpeedRun();
      });
    });
  }

  function startSpeedRun() {
    clearInterval(srTimer);
    srRunning = true; srTimeLeft = 60; srScore = 0; srStreak = 0; srIndex = 0; srLastFeedback = null;
    srDeck = shuffle(SPEEDRUN_CARDS);
    renderSpeedRun();
    srTimer = setInterval(() => {
      srTimeLeft--;
      updateSRHud();
      if (srTimeLeft <= 0) {
        clearInterval(srTimer);
        srRunning = false;
        recordStudyActivity();
        saveState();
        renderOverview();
        renderSpeedRun();
      }
    }, 1000);
  }

  // ---------------------------------------------------------------------------
  // VIEW 4: OFFICIAL MICROSOFT LEARN STUDY GUIDE BLUEPRINT (81/81)
  // ---------------------------------------------------------------------------
  let bpFilter = "all", bpQuery = "";

  function renderBlueprint() {
    const filtersEl = document.getElementById("bp-filters");
    const listEl = document.getElementById("bp-list");
    if (!state.blueprintChecked) state.blueprintChecked = {};

    let totalItems = 0;
    MS_BLUEPRINT.forEach(d => d.groups.forEach(g => g.items.forEach(() => { totalItems++; })));

    const filterDefs = [{ id: "all", label: `All (${totalItems})` }, ...MS_BLUEPRINT.map(d => ({ id: d.id, label: d.domain.split(" (")[0] }))];
    filtersEl.innerHTML = filterDefs.map(f => `
      <button data-bp-filter="${f.id}" class="btn btn-sm ${bpFilter === f.id ? "btn-primary" : ""}">${f.label}</button>
    `).join("");

    filtersEl.querySelectorAll("[data-bp-filter]").forEach(btn => {
      btn.addEventListener("click", () => { bpFilter = btn.dataset.bpFilter; renderBlueprint(); });
    });

    const q = bpQuery.trim().toLowerCase();
    listEl.innerHTML = MS_BLUEPRINT.map((d, di) => {
      if (bpFilter !== "all" && d.id !== bpFilter) return "";
      const groupHtml = d.groups.map((g, gi) => {
        const rows = g.items.map(([text, sprint], ii) => {
          if (q && !text.toLowerCase().includes(q) && !g.name.toLowerCase().includes(q) && !sprint.toLowerCase().includes(q)) return "";
          const key = `bp_${di}_${gi}_${ii}`;
          const checked = !!state.blueprintChecked[key];
          return `
            <label style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:8px 12px; border-radius:var(--radius-sm); cursor:pointer;" class="sprint-item">
              <span style="display:flex; align-items:flex-start; gap:10px; font-size:13.5px;">
                <input type="checkbox" data-bp-key="${key}" ${checked ? "checked" : ""} class="checkbox" />
                <span style="${checked ? "text-decoration:line-through; color:var(--text-tertiary);" : ""}">${text}</span>
              </span>
              <span class="badge mono">${sprint}</span>
            </label>
          `;
        }).filter(Boolean).join("");
        if (!rows) return "";
        return `
          <div style="padding:12px 16px;">
            <div style="font-size:11.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-tertiary); padding:0 12px 6px;">${g.name}</div>
            <div>${rows}</div>
          </div>
        `;
      }).filter(Boolean).join("");
      if (!groupHtml) return "";
      return `
        <div class="panel">
          <div class="panel-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="domain-dot" style="background:${d.color};"></span>
              <span class="panel-title">${d.domain}</span>
            </div>
            <a href="${d.url}" target="_blank" rel="noopener" style="font-size:12.5px; font-weight:600;">↗ Official MS Learn Path</a>
          </div>
          <div class="divider-list">${groupHtml}</div>
        </div>
      `;
    }).filter(Boolean).join("") || `<div style="padding:24px; text-align:center; color:var(--text-secondary);">No objectives match "${escapeHtml(bpQuery)}".</div>`;

    listEl.querySelectorAll("[data-bp-key]").forEach(cb => {
      cb.addEventListener("change", () => {
        state.blueprintChecked[cb.dataset.bpKey] = cb.checked;
        if (cb.checked) recordStudyActivity();
        saveState();
        renderBlueprint();
        renderOverview();
      });
    });
  }

  document.getElementById("bp-search").addEventListener("input", e => { bpQuery = e.target.value; renderBlueprint(); });

  // ---------------------------------------------------------------------------
  // 5-MINUTE QUICK DRILL (targeted to weakest domain!)
  // ---------------------------------------------------------------------------
  const rescueModal = document.getElementById("rescue-modal");
  const rescueBody = document.getElementById("rescue-body");
  let rescueStep = 1, rescueCard = null, rescueTicket = null, rescueAnswered = false;

  document.getElementById("btn-rescue").addEventListener("click", () => {
    const report = window.AZ104_READINESS.compute(state);
    const weakDom = report.weakest.id;
    const domCards = SPEEDRUN_CARDS.filter(c => c.domain === weakDom);
    rescueCard = domCards[Math.floor(Math.random() * domCards.length)] || SPEEDRUN_CARDS[0];
    const domTickets = TICKETS.filter(t => t.domain === weakDom && !state.solvedTickets[t.id]);
    rescueTicket = domTickets[0] || TICKETS.find(t => t.domain === weakDom) || TICKETS[0];
    rescueStep = 1;
    rescueAnswered = false;
    rescueModal.classList.remove("hidden");
    renderRescue();
  });

  document.getElementById("rescue-close").addEventListener("click", () => rescueModal.classList.add("hidden"));

  function renderRescue() {
    if (rescueStep === 1) {
      rescueBody.innerHTML = `
        <div style="font-size:11.5px; font-weight:700; text-transform:uppercase; color:var(--text-secondary);">Step 1 of 2 • Priority Domain Trap (${rescueCard.domain})</div>
        <div style="font-size:15.5px; font-weight:650;">${rescueCard.prompt}</div>
        <div class="topo-grid-2">
          ${rescueCard.choices.map((c, i) => `<button data-r1="${i}" class="option-btn">${c}</button>`).join("")}
        </div>
        <div id="r1-fb"></div>
      `;
      rescueBody.querySelectorAll("[data-r1]").forEach(btn => {
        btn.addEventListener("click", () => {
          const ok = Number(btn.dataset.r1) === rescueCard.answer;
          trackDomainResult(rescueCard.domain, ok, rescueCard.id);
          rescueBody.querySelector("#r1-fb").innerHTML = `
            <div style="padding:12px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md); display:flex; flex-direction:column; gap:8px;">
              <div style="font-weight:700; color:${ok ? "var(--success)" : "var(--warning)"};">${ok ? "Correct" : "Key Rule"}</div>
              <p style="font-size:13px;">${rescueCard.why}</p>
              <div><button id="r-next" class="btn btn-primary btn-sm">Next: Step 2 of 2 →</button></div>
            </div>
          `;
          rescueBody.querySelector("#r-next").addEventListener("click", () => { rescueStep = 2; renderRescue(); });
        });
      });
    } else {
      rescueBody.innerHTML = `
        <div style="font-size:11.5px; font-weight:700; text-transform:uppercase; color:var(--text-secondary);">Step 2 of 2 • Priority P1 Incident (${rescueTicket.code})</div>
        <div style="padding:12px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
          <div style="font-weight:700; font-size:14px;">${rescueTicket.title}</div>
          <p style="font-size:12.5px; color:var(--text-secondary); margin-top:4px;">${rescueTicket.symptom}</p>
        </div>
        <div style="font-weight:650; font-size:13.5px;">${rescueTicket.question}</div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          ${rescueTicket.options.map((o, i) => `<button data-r2="${i}" class="option-btn" style="padding:9px 12px; font-size:13px;">${String.fromCharCode(65 + i)}. ${o}</button>`).join("")}
        </div>
        <div id="r2-fb"></div>
      `;
      rescueBody.querySelectorAll("[data-r2]").forEach(btn => {
        btn.addEventListener("click", () => {
          const ok = Number(btn.dataset.r2) === rescueTicket.answer;
          trackDomainResult(rescueTicket.domain, ok, null);
          if (ok) state.solvedTickets[rescueTicket.id] = true;
          if (!rescueAnswered) {
            rescueAnswered = true;
            state.rescueCount = (state.rescueCount || 0) + 1;
            recordStudyActivity();
            saveState();
            renderOverview();
          }
          rescueBody.querySelector("#r2-fb").innerHTML = `
            <div style="padding:12px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md); display:flex; flex-direction:column; gap:8px;">
              <div style="font-weight:700; color:${ok ? "var(--success)" : "var(--warning)"};">Quick Drill Complete — Streak Updated</div>
              <p style="font-size:13px;">${rescueTicket.explanation}</p>
              <div><button id="r-done" class="btn btn-primary btn-sm">Done</button></div>
            </div>
          `;
          rescueBody.querySelector("#r-done").addEventListener("click", () => rescueModal.classList.add("hidden"));
        });
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 25-MINUTE FOCUS TIMER
  // ---------------------------------------------------------------------------
  let timerSeconds = 25 * 60, timerInterval = null;
  const timerDisplay = document.getElementById("timer-display");
  const timerToggle = document.getElementById("timer-toggle");

  function updateTimerUI() {
    timerDisplay.textContent = `${String(Math.floor(timerSeconds / 60)).padStart(2, "0")}:${String(timerSeconds % 60).padStart(2, "0")}`;
  }

  timerToggle.addEventListener("click", () => {
    if (timerInterval) {
      clearInterval(timerInterval); timerInterval = null; timerToggle.textContent = "Resume";
    } else {
      timerToggle.textContent = "Pause";
      timerInterval = setInterval(() => {
        if (timerSeconds > 0) { timerSeconds--; updateTimerUI(); }
        else { clearInterval(timerInterval); timerInterval = null; timerToggle.textContent = "Done"; recordStudyActivity(); renderOverview(); }
      }, 1000);
    }
  });

  document.getElementById("timer-reset").addEventListener("click", () => {
    clearInterval(timerInterval); timerInterval = null; timerSeconds = 25 * 60; timerToggle.textContent = "Start"; updateTimerUI();
  });

  function renderAll() {
    switchView(state.activeView || "overview");
    renderOverview();
    renderPlanView();
    renderPracticeView();
    renderBlueprint();
  }

  renderAll();
})();
