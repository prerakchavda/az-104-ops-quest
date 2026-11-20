// =============================================================================
// AZ-104 OPS QUEST — MAIN APPLICATION CONTROLLER (v4 FIRST-TRY PASS ENGINE)
// Connects Calibrated Overview & 4-Gate Pass Checklist, Study Plan & Lab Guides
// with Sprint Exit Checkpoints, 15 Interactive Exam Drills, 3-Box Leitner
// Spaced Repetition, Built-In Timed Exam Simulator, 8 Active-Recall Decision
// Matrices, and 81-Item Official Blueprint Sync
// =============================================================================

(function () {
  const { NODES, EDGES, DOMAINS, WEEKS, MS_BLUEPRINT } = window.AZ104_CORE;
  const { TICKETS, BUG_HUNTS, SPEEDRUN_CARDS, CASE_STUDIES, SCAVENGER_HUNTS } = window.AZ104_DRILLS;
  const { OFFICIAL_MS_LABS, INTEGRATION_LABS, BLITZ_WEEKS, SPRINT_TO_GUIDE, getGuideForSprint, getGuideByKey } = window.AZ104_GUIDES;
  const { SEQUENCE_DRILLS, DROPDOWN_DRILLS, YESNO_SERIES, DECISION_MATRICES, TOPIC_CHECKPOINTS } = window.AZ104_EXAM_DATA;

  const STORAGE_KEY = "az104_northstar_quest_v4";
  let state = {
    activeView: "overview",
    planSub: "steady",        // "steady" | "blitz" | "capstones" | "topology"
    planMode: "steady",       // "steady" | "blitz"
    pracSub: "tickets",       // "tickets" | "interactive" | "bughunts" | "simulators" | "casestudies" | "scavenger" | "speedrun"
    intMode: "sequence",      // "sequence" | "dropdown" | "yesno"
    activeSeqId: "seq1",
    activeDdId: "dd1",
    activeYnId: "yn1",
    selectedNode: "compute",
    checked: {},              // 8-week sprints
    blitzChecked: {},         // 21-day blitz days
    capstoneChecked: {},      // 4 multi-domain integration capstones
    openGuides: {},           // { sprintOrBlitzOrCapId: true }
    solvedTickets: {},
    solvedBugHunts: {},
    solvedCaseQ: {},
    solvedHunts: {},
    solvedSequences: {},
    solvedDropdowns: {},
    solvedYesNo: {},
    solvedCheckpoints: {},
    checkpointAnswers: {},
    activeTicket: "t1",
    ticketFilter: "all",
    activeBugHunt: "bh1",
    activeCaseStudy: "cs1",
    activeCaseTab: "Overview",
    openWeeks: { 1: true },
    openBlitzWeeks: { 1: true },
    bestSpeedRun: 0,
    missedTraps: {},
    leitner: {},              // { itemId: { id, domain, type, title, prompt, choices, answer, why, url, box: 1|2|3, streak: 0|1|2, misses } }
    domainStats: {},
    blueprintChecked: {},
    blueprintManualUncheck: {},
    mockLogs: [],
    studyDates: [],
    rescueCount: 0,
    matrixRecallMode: true,
    matrixFilter: "all",
    revealedMatrixCells: {}
  };

  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem("az104_northstar_quest_v3") ||
      localStorage.getItem("az104_northstar_quest_v2") ||
      localStorage.getItem("az104_northstar_quest_v1") ||
      "null"
    );
    if (saved && typeof saved === "object") state = { ...state, ...saved };
  } catch (_) {}

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  // Normalize domain names from strings like "Compute + Networking" -> "compute"
  function normalizeDomainId(raw) {
    const s = String(raw || "").toLowerCase();
    if (s.includes("ident") || s.includes("gov")) return "identity";
    if (s.includes("net")) return "networking";
    if (s.includes("stor")) return "storage";
    if (s.includes("mon") || s.includes("back")) return "monitor";
    return "compute";
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
  // PRIMARY SIDEBAR NAVIGATION (6 VIEWS)
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
    if (viewId === "examsim") renderExamSim();
    if (viewId === "matrices") renderMatricesView();
    if (viewId === "blueprint") renderBlueprint();
  }

  document.querySelectorAll("[data-view]").forEach(btn => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });

  document.getElementById("btn-jump-plan").addEventListener("click", () => switchView("plan"));
  const launchSimBtn1 = document.getElementById("btn-launch-examsim");
  if (launchSimBtn1) launchSimBtn1.addEventListener("click", () => switchView("examsim"));
  const launchSimBtn2 = document.getElementById("btn-launch-examsim-2");
  if (launchSimBtn2) launchSimBtn2.addEventListener("click", () => switchView("examsim"));

  // ---------------------------------------------------------------------------
  // UNIFIED 3-BOX LEITNER SPACED REPETITION & DOMAIN ACCURACY TRACKER
  // Box 1: Urgent Repeat (0/2 streak)
  // Box 2: Reinforcing (1/2 streak)
  // Box 3: Graduated / Mastered (2/2 consecutive review streak)
  // ---------------------------------------------------------------------------
  function lookupReviewableItem(itemId) {
    const sr = SPEEDRUN_CARDS.find(c => c.id === itemId);
    if (sr) return { id: sr.id, domain: sr.domain, type: "Exam Trap", prompt: sr.prompt, choices: sr.choices, answer: sr.answer, why: sr.why, url: sr.url };

    const tk = TICKETS.find(t => t.id === itemId);
    if (tk) return { id: tk.id, domain: tk.domain, type: `P1 Incident (${tk.code})`, prompt: `${tk.title}: ${tk.symptom}\n\n${tk.question}`, choices: tk.options, answer: tk.answer, why: tk.explanation, url: tk.msUrl };

    for (const cs of CASE_STUDIES) {
      const cq = cs.questions.find(q => q.id === itemId);
      if (cq) return { id: cq.id, domain: normalizeDomainId(cs.title), type: `Case Study (${cs.title.split(":")[0]})`, prompt: cq.q, choices: cq.options, answer: cq.answer, why: cq.why, url: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104" };
    }

    for (const list of Object.values(TOPIC_CHECKPOINTS)) {
      const cp = list.find(x => x.id === itemId);
      if (cp) return { id: cp.id, domain: cp.domain, type: "Sprint Checkpoint", prompt: cp.q, choices: cp.options, answer: cp.answer, why: cp.why, url: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104" };
    }

    return null;
  }

  function trackDomainResult(domainId, ok, itemId, isLeitnerReview) {
    const dom = normalizeDomainId(domainId);
    if (!state.domainStats) state.domainStats = {};
    if (!state.domainStats[dom]) state.domainStats[dom] = { right: 0, wrong: 0 };
    if (ok) state.domainStats[dom].right++;
    else state.domainStats[dom].wrong++;

    if (!state.leitner) state.leitner = {};
    if (!state.missedTraps) state.missedTraps = {};

    if (itemId) {
      const meta = lookupReviewableItem(itemId);
      const existing = state.leitner[itemId];

      if (!ok) {
        // Any miss drops the item straight into Box 1 (0/2 streak)
        state.leitner[itemId] = {
          id: itemId,
          domain: meta ? meta.domain : dom,
          type: meta ? meta.type : "Practice Drill",
          title: meta ? meta.prompt : itemId,
          box: 1,
          streak: 0,
          misses: (existing ? existing.misses || 0 : 0) + 1,
          lastSeen: todayKey()
        };
        if (itemId.startsWith("sr")) {
          state.missedTraps[itemId] = (state.missedTraps[itemId] || 0) + 1;
        }
      } else if (existing && (isLeitnerReview || existing.box < 3)) {
        // Requiring 2 consecutive correct answers to graduate to Box 3!
        const newStreak = (existing.streak || 0) + 1;
        const newBox = newStreak >= 2 ? 3 : 2;
        state.leitner[itemId] = {
          ...existing,
          box: newBox,
          streak: Math.min(2, newStreak),
          lastSeen: todayKey()
        };
        if (newBox === 3 && state.missedTraps[itemId]) {
          delete state.missedTraps[itemId];
        }
      }
    }

    saveState();
    renderOverview();
  }

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
    const intDoneCount =
      Object.values(state.solvedSequences || {}).filter(Boolean).length +
      Object.values(state.solvedDropdowns || {}).filter(Boolean).length +
      Object.values(state.solvedYesNo || {}).filter(Boolean).length;

    // Sidebar badges
    document.getElementById("sidebar-readiness-pill").textContent = `${report.overallPct}%`;
    document.getElementById("nav-plan-count").textContent = `${planDone}/${planTotal}`;
    document.getElementById("nav-practice-count").textContent = `${ticketsDone + intDoneCount}/35`;
    document.getElementById("nav-bp-count").textContent = `${report.totalBpDone}/${report.totalBpAll}`;
    const examBadge = document.getElementById("nav-exam-badge");
    if (examBadge) {
      examBadge.textContent = report.mockLogs.length ? `${report.mockLogs[0].overall}%` : "Mock";
    }

    // Top 4 Metrics
    document.getElementById("ov-readiness-pct").textContent = `${report.overallPct}%`;
    document.getElementById("ov-scaled-est").textContent = `Calibrated score: ${report.estimatedScaledScore} / 1000 (Pass: 700)`;
    const verAccEl = document.getElementById("ov-verified-acc");
    if (verAccEl) verAccEl.textContent = `${report.verifiedAccuracyPct}%`;
    const leitnerFootEl = document.getElementById("ov-leitner-foot");
    if (leitnerFootEl) {
      leitnerFootEl.textContent = `Box 1 Urgent: ${report.box1Total} • Box 2: ${report.box2Total} • Graduated: ${report.box3Total}`;
    }
    document.getElementById("ov-bp-progress").textContent = `${report.totalBpDone} / ${report.totalBpAll}`;
    document.getElementById("ov-cap-progress").textContent = `Capstones: ${capDone} / 4 completed`;
    document.getElementById("ov-streak").textContent = `${calcWeekdayStreak()} days`;

    // 4-Gate First-Try Pass Checklist Panel
    const gatesPanel = document.getElementById("ov-pass-gates-panel");
    if (gatesPanel) {
      gatesPanel.innerHTML = `
        <div class="panel-header">
          <div>
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <span class="badge ${report.passVerdictClass}">${report.passVerdict}</span>
              <h2 class="panel-title">First-Try Pass Readiness Checklist (${report.gatesPassedCount} / 4 Gates Cleared)</h2>
            </div>
            <div class="panel-sub" style="margin-top:3px;">
              Honest calibration: checking lab or blueprint boxes alone caps out below 700. Clear all 4 active-recall gates below before sitting the real AZ-104 exam.
            </div>
          </div>
          <button id="ov-open-leitner-btn" class="btn btn-sm ${report.dueTotal > 0 ? "btn-primary" : ""}">
            Review Leitner Queue (${report.dueTotal} due) →
          </button>
        </div>
        <div class="panel-body">
          <div class="gates-grid">
            ${report.passGates.map((g, idx) => `
              <div class="gate-card ${g.passed ? "passed" : ""}">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:6px;">
                  <span class="mono" style="font-size:11px; font-weight:700; color:${g.passed ? "var(--success)" : "var(--text-secondary)"};">GATE ${idx + 1}</span>
                  <span class="badge ${g.passed ? "badge-success" : "badge-warning"}">${g.passed ? "✓ Cleared" : "In Progress"}</span>
                </div>
                <div style="font-weight:650; font-size:13px; margin-top:2px;">${g.label}</div>
                <div style="font-size:12px; color:var(--text-secondary);" class="mono">${g.detail}</div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
      const leitnerBtn = gatesPanel.querySelector("#ov-open-leitner-btn");
      if (leitnerBtn) {
        leitnerBtn.addEventListener("click", () => {
          state.pracSub = "speedrun";
          srMode = "review";
          switchView("practice");
        });
      }
    }

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
          <button id="wk-open-int" class="btn btn-sm">2. Interactive Drills</button>
          <button id="wk-open-tickets" class="btn btn-sm">3. Drill ${w.shortName} P1 Incidents</button>
          <button id="wk-open-matrix" class="btn btn-sm">4. Active-Recall Matrix</button>
          <button id="wk-open-sim" class="btn btn-sm">5. Launch Simulator</button>
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

    weakPanel.querySelector("#wk-open-int").addEventListener("click", () => {
      state.pracSub = "interactive";
      switchView("practice");
    });

    weakPanel.querySelector("#wk-open-tickets").addEventListener("click", () => {
      state.pracSub = "tickets";
      state.ticketFilter = w.id;
      switchView("practice");
    });

    weakPanel.querySelector("#wk-open-matrix").addEventListener("click", () => {
      state.matrixFilter = w.id;
      switchView("matrices");
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
            <span>Blueprint: <strong class="mono" style="color:var(--text-primary);">${d.bpDone}/${d.bpTotal}</strong></span>
            <span>Labs &amp; Checkpoints: <strong class="mono" style="color:var(--text-primary);">${d.labDone + d.cpDone}/${d.labTotal + d.cpTotal}</strong></span>
            <span>P1 &amp; Interactive: <strong class="mono" style="color:var(--text-primary);">${d.ticketsDone + d.interactiveDone}/${d.ticketsTotal + d.interactiveTotal}</strong></span>
            <span>Recall Accuracy: <strong class="mono" style="color:var(--text-primary);">${d.rawAccuracyPct !== null ? d.rawAccuracyPct + "%" : "—"}</strong></span>
            ${d.box1InDomain > 0 ? `<span style="color:var(--danger); font-weight:600;">Box 1 Urgent: ${d.box1InDomain}</span>` : ""}
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

    // External & Built-In Mock Exam Log History
    const histEl = document.getElementById("ov-mock-history");
    if (!report.mockLogs.length) {
      histEl.innerHTML = `
        <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px; color:var(--text-secondary); font-size:13px;">
          <span>No timed mock exam attempts logged yet. Launch the <strong>Built-In Timed Exam Simulator</strong> above (auto-logs on completion) or log your score from <a href="https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/" target="_blank" rel="noopener">Microsoft's free AI Skills Navigator Practice Assessment</a>.</span>
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
  // VIEW 2: STUDY PLAN, STEP-BY-STEP GUIDES, EXIT CHECKPOINTS & CAPSTONES
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

  function getCheckpointsForGuideKey(guideKey) {
    return (TOPIC_CHECKPOINTS && TOPIC_CHECKPOINTS[guideKey]) || [];
  }

  function renderGuideDrawerHtml(guide, drawerId, linkedBpEntries, guideKey) {
    const msLabLinks = (guide.msLabs || []).map(k => {
      const l = OFFICIAL_MS_LABS[k];
      if (!l) return "";
      return `<a href="${l.url}" target="_blank" rel="noopener" class="btn btn-sm">↗ Official ${l.code}: ${l.title}</a>`;
    }).join("");

    const docLinks = (guide.docLinks || []).map(d =>
      `<a href="${d.url}" target="_blank" rel="noopener" class="btn btn-sm">↗ MS Learn: ${d.label}</a>`
    ).join("");

    const bpListHtml = (linkedBpEntries && linkedBpEntries.length) ? `
      <div style="padding:12px 14px; background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
        <div style="font-size:12px; font-weight:650; color:var(--text-secondary); margin-bottom:6px;">
          Official MS Study Guide Objectives Auto-Checked by This Lab (${linkedBpEntries.length})
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${linkedBpEntries.map(e => {
            const st = window.AZ104_GUIDES.getObjectiveStatus(e.bpKey, state);
            return `<span class="badge ${st.done ? "badge-success" : ""}">${st.done ? "✓ " : ""}${escapeHtml(e.text)}</span>`;
          }).join("")}
        </div>
      </div>
    ` : "";

    // Sprint Exit Checkpoint (2 Active-Recall Questions per Topic Guide)
    const checkpoints = getCheckpointsForGuideKey(guideKey);
    const cpSolvedCount = checkpoints.filter(cp => state.solvedCheckpoints && state.solvedCheckpoints[cp.id]).length;
    const checkpointHtml = checkpoints.length ? `
      <div style="padding:14px 16px; background:var(--bg-surface); border:1px solid ${cpSolvedCount === checkpoints.length ? "var(--success)" : "var(--border-strong)"}; border-radius:var(--radius-md); display:flex; flex-direction:column; gap:12px;">
        <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px;">
          <div>
            <div style="font-size:11.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:${cpSolvedCount === checkpoints.length ? "var(--success)" : "var(--warning)"};">
              Sprint Exit Checkpoint — Active Recall Gate (${cpSolvedCount}/${checkpoints.length} Verified)
            </div>
            <div style="font-size:12.5px; color:var(--text-secondary);">Prove recall on these 2 high-frequency exam traps to lock in your lab mastery score.</div>
          </div>
          <span class="badge ${cpSolvedCount === checkpoints.length ? "badge-success" : "badge-warning"}">${cpSolvedCount === checkpoints.length ? "✓ Recall Verified" : "Verification Pending"}</span>
        </div>

        <div style="display:flex; flex-direction:column; gap:12px;">
          ${checkpoints.map((cp, idx) => {
            const chosen = state.checkpointAnswers && state.checkpointAnswers[cp.id] !== undefined
              ? state.checkpointAnswers[cp.id]
              : (state.solvedCheckpoints && state.solvedCheckpoints[cp.id] ? cp.answer : null);
            return `
              <div style="padding:12px 14px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md); display:flex; flex-direction:column; gap:8px;">
                <div style="font-size:13px; font-weight:650;">Checkpoint ${idx + 1}: ${cp.q}</div>
                <div style="display:flex; flex-direction:column; gap:6px;">
                  ${cp.options.map((opt, oi) => {
                    let cls = "";
                    if (chosen !== null) {
                      if (oi === cp.answer) cls = "correct";
                      else if (oi === chosen && oi !== cp.answer) cls = "wrong";
                    }
                    return `
                      <button data-cp-pick="${cp.id}:${oi}:${drawerId}" class="option-btn ${cls}" style="padding:8px 11px; font-size:12.5px;">
                        <span><strong class="mono" style="margin-right:6px; color:var(--text-secondary);">${String.fromCharCode(65 + oi)}.</strong>${opt}</span>
                      </button>
                    `;
                  }).join("")}
                </div>
                ${chosen !== null ? `
                  <div style="font-size:12px; color:var(--text-secondary); padding-top:6px; border-top:1px solid var(--border-subtle);">
                    <strong style="color:${chosen === cp.answer ? "var(--success)" : "var(--danger)"};">${chosen === cp.answer ? "Verified:" : "Queued in Leitner Box 1:"}</strong> ${cp.why}
                  </div>
                ` : ""}
              </div>
            `;
          }).join("")}
        </div>
      </div>
    ` : "";

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

          ${bpListHtml}

          <div>
            <div style="font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:8px;">Official Microsoft Hosted Lab Instructions &amp; Reference Docs</div>
            <div style="display:flex; flex-wrap:wrap; gap:6px;">
              ${msLabLinks}
              ${docLinks}
            </div>
          </div>

          <div>
            <div style="font-size:12px; font-weight:600; color:var(--text-secondary);">Exact Azure Portal Walkthrough</div>
            <ol class="step-list">
              ${(guide.portalSteps || []).map(s => `<li>${s}</li>`).join("")}
            </ol>
          </div>

          <div>
            <div class="code-block-wrap">
              <div class="code-block-bar">
                <span>Azure Cloud Shell / CLI &amp; Bicep Commands</span>
                <button data-copy-code="${drawerId}" class="btn btn-sm" style="padding:2px 8px;">Copy Commands</button>
              </div>
              <pre id="code-${drawerId}" class="code-pre">${escapeHtml(guide.cliCommands || "")}</pre>
            </div>
          </div>

          <div>
            <div style="font-size:12px; font-weight:600; color:var(--text-secondary);">Verification &amp; Exam Trap Checks</div>
            <ul class="step-list">
              ${(guide.verifySteps || []).map(v => `<li>${v}</li>`).join("")}
            </ul>
          </div>

          ${checkpointHtml}
        </div>
      </div>
    `;
  }

  function wireCopyAndCheckpoints(container, rerenderFn) {
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

    container.querySelectorAll("[data-cp-pick]").forEach(btn => {
      btn.addEventListener("click", () => {
        const [cpId, oiStr] = btn.dataset.cpPick.split(":");
        const oi = Number(oiStr);
        let foundCp = null;
        Object.values(TOPIC_CHECKPOINTS).forEach(list => {
          const match = list.find(x => x.id === cpId);
          if (match) foundCp = match;
        });
        if (!foundCp) return;

        if (!state.checkpointAnswers) state.checkpointAnswers = {};
        if (!state.solvedCheckpoints) state.solvedCheckpoints = {};
        state.checkpointAnswers[cpId] = oi;
        const ok = oi === foundCp.answer;
        if (ok) {
          state.solvedCheckpoints[cpId] = true;
          recordStudyActivity();
        }
        trackDomainResult(foundCp.domain, ok, cpId, false);
        saveState();
        rerenderFn(container);
      });
    });
  }

  function clearManualUnchecks(entries) {
    if (!state.blueprintManualUncheck || !entries) return;
    entries.forEach(e => { delete state.blueprintManualUncheck[e.bpKey]; });
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

  function getGuideKeyForSprintId(sprintId) {
    const map = {
      w1d1: "w1_identities",   w1d2: "w1_rbac_locks",   w1d3: "w1_rbac_locks",   w1d4: "w1_policy",       w1d5: "w1_policy",
      w2d1: "w2_vnets_peering",w2d2: "w2_vnets_peering",w2d3: "w2_nsg_udr",      w2d4: "w2_nsg_udr",      w2d5: "w2_nsg_udr",
      w3d1: "w3_storage_core", w3d2: "w3_storage_security", w3d3: "w3_storage_security", w3d4: "w3_storage_core", w3d5: "w3_storage_security",
      w4d1: "w4_bicep_vms",    w4d2: "w4_bicep_vms",    w4d3: "w4_vm_scale_ha",  w4d4: "w4_vm_scale_ha",  w4d5: "w4_vm_scale_ha",
      w5d1: "w5_app_service",  w5d2: "w5_app_service",  w5d3: "w5_containers",   w5d4: "w5_containers",   w5d5: "w5_containers",
      w6d1: "w6_lb_bastion_dns",w6d2:"w6_lb_bastion_dns",w6d3:"w6_lb_bastion_dns",w6d4:"w6_lb_bastion_dns",w6d5:"w6_lb_bastion_dns",
      w7d1: "w7_monitor_watcher",w7d2:"w7_monitor_watcher",w7d3:"w7_monitor_watcher",w7d4:"w7_backup_asr", w7d5: "w7_backup_asr",
      w8d1: "w8_exam_mastery", w8d2: "w8_exam_mastery", w8d3: "w8_exam_mastery", w8d4: "w8_exam_mastery", w8d5: "w8_exam_mastery"
    };
    return map[sprintId] || "w1_identities";
  }

  function renderSteadySchedule(container) {
    const bpLinks = window.AZ104_GUIDES.buildBlueprintLinks();
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
                const guideKey = getGuideKeyForSprintId(s.id);
                const guide = getGuideForSprint(s.id);
                const linkedBp = bpLinks.bySprintId[s.id] || [];
                const msLabBadges = (guide.msLabs || []).map(k => OFFICIAL_MS_LABS[k] ? OFFICIAL_MS_LABS[k].code : "").filter(Boolean).join(", ");
                const cps = getCheckpointsForGuideKey(guideKey);
                const cpDone = cps.filter(c => state.solvedCheckpoints && state.solvedCheckpoints[c.id]).length;
                return `
                  <div id="sprint-row-${s.id}">
                    <div class="sprint-item">
                      <label class="sprint-left" style="cursor:pointer;">
                        <input type="checkbox" data-sprint="${s.id}" ${isChecked ? "checked" : ""} class="checkbox" />
                        <div>
                          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                            <span class="mono" style="font-size:12px; font-weight:700; color:var(--text-secondary);">${s.day}</span>
                            <span class="badge">${s.tag}</span>
                            <span class="badge badge-accent mono">MS ${msLabBadges}</span>
                            ${linkedBp.length ? `<span class="badge ${isChecked ? "badge-success" : ""}">${isChecked ? "✓ Checked" : "Auto-checks"} ${linkedBp.length} Blueprint obj.</span>` : ""}
                            ${cps.length ? `<span class="badge ${cpDone === cps.length ? "badge-success" : "badge-warning"}">${cpDone === cps.length ? "✓ Recall Verified" : `Exit Quiz ${cpDone}/${cps.length}`}</span>` : ""}
                          </div>
                          <div style="margin-top:4px; font-size:13.5px; ${isChecked ? "text-decoration:line-through; color:var(--text-tertiary);" : ""}">${s.text}</div>
                        </div>
                      </label>
                      <button data-toggle-guide="${s.id}" class="btn btn-sm ${guideOpen ? "btn-primary" : ""}" style="flex-shrink:0;">
                        ${guideOpen ? "Hide Guide ▲" : "Step-by-Step Guide &amp; Quiz ▼"}
                      </button>
                    </div>
                    ${guideOpen ? renderGuideDrawerHtml(guide, s.id, linkedBp, guideKey) : ""}
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
        const sid = cb.dataset.sprint;
        state.checked[sid] = cb.checked;
        if (cb.checked) {
          clearManualUnchecks(bpLinks.bySprintId[sid]);
          recordStudyActivity();
        }
        saveState();
        renderSteadySchedule(container);
        renderBlueprint();
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

    wireCopyAndCheckpoints(container, renderSteadySchedule);
  }

  function renderBlitzSchedule(container) {
    const bpLinks = window.AZ104_GUIDES.buildBlueprintLinks();
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
              const linkedBp = bpLinks.byBlitzId[d.id] || [];
              const msLabBadges = (guide.msLabs || []).map(k => OFFICIAL_MS_LABS[k] ? OFFICIAL_MS_LABS[k].code : "").filter(Boolean).join(", ");
              const cps = getCheckpointsForGuideKey(d.guide);
              const cpDone = cps.filter(c => state.solvedCheckpoints && state.solvedCheckpoints[c.id]).length;
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
                          ${linkedBp.length ? `<span class="badge ${isChecked ? "badge-success" : ""}">${isChecked ? "✓ Checked" : "Auto-checks"} ${linkedBp.length} Blueprint obj.</span>` : ""}
                          ${cps.length ? `<span class="badge ${cpDone === cps.length ? "badge-success" : "badge-warning"}">${cpDone === cps.length ? "✓ Recall Verified" : `Exit Quiz ${cpDone}/${cps.length}`}</span>` : ""}
                        </div>
                        <div style="margin-top:4px; font-size:13px; color:var(--text-secondary); ${isChecked ? "text-decoration:line-through;" : ""}">${d.task}</div>
                      </div>
                    </label>
                    <button data-toggle-bguide="${d.id}" class="btn btn-sm ${guideOpen ? "btn-primary" : ""}" style="flex-shrink:0;">
                      ${guideOpen ? "Hide Guide ▲" : "Step-by-Step Guide &amp; Quiz ▼"}
                    </button>
                  </div>
                  ${guideOpen ? renderGuideDrawerHtml(guide, d.id, linkedBp, d.guide) : ""}
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
        const bid = cb.dataset.blitz;
        state.blitzChecked[bid] = cb.checked;
        if (cb.checked) {
          clearManualUnchecks(bpLinks.byBlitzId[bid]);
          recordStudyActivity();
        }
        saveState();
        renderBlitzSchedule(container);
        renderBlueprint();
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

    wireCopyAndCheckpoints(container, renderBlitzSchedule);
  }

  function renderCapstones(container) {
    const bpLinks = window.AZ104_GUIDES.buildBlueprintLinks();
    container.innerHTML = INTEGRATION_LABS.map(cap => {
      const isDone = !!(state.capstoneChecked && state.capstoneChecked[cap.id]);
      const isOpen = state.openGuides[cap.id] !== false;
      const linkedBp = bpLinks.byCapstoneId[cap.id] || [];
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
                  ${linkedBp.length ? `<span class="badge ${isDone ? "badge-success" : "badge-warning"}">${isDone ? "✓ Auto-checked" : "Auto-checks"} ${linkedBp.length} Blueprint Objectives</span>` : ""}
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
            ${linkedBp.length ? `
              <div style="padding:12px 14px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
                <div style="font-size:12px; font-weight:650; color:var(--text-secondary); margin-bottom:6px;">
                  Official MS Study Guide Objectives Auto-Checked When You Complete ${cap.code} (${linkedBp.length})
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:6px;">
                  ${linkedBp.map(e => {
                    const st = window.AZ104_GUIDES.getObjectiveStatus(e.bpKey, state);
                    return `<span class="badge ${st.done ? "badge-success" : ""}">${st.done ? "✓ " : ""}${escapeHtml(e.text)}</span>`;
                  }).join("")}
                </div>
              </div>
            ` : ""}

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
        const cid = cb.dataset.cap;
        state.capstoneChecked[cid] = cb.checked;
        if (cb.checked) {
          clearManualUnchecks(bpLinks.byCapstoneId[cid]);
          recordStudyActivity();
        }
        saveState();
        renderCapstones(container);
        renderBlueprint();
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

    wireCopyAndCheckpoints(container, renderCapstones);
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
    ["tickets", "interactive", "bughunts", "simulators", "casestudies", "scavenger", "speedrun"].forEach(k => {
      const el = document.getElementById("prac-" + k);
      if (el) el.classList.toggle("hidden", state.pracSub !== k);
    });

    if (state.pracSub === "tickets") renderIncidents();
    else if (state.pracSub === "interactive") renderInteractiveDrills();
    else if (state.pracSub === "bughunts") renderBugHunts();
    else if (state.pracSub === "simulators") window.AZ104_SIMS.render(document.getElementById("simulators-root"));
    else if (state.pracSub === "casestudies") renderCaseStudy();
    else if (state.pracSub === "scavenger") renderScavenger();
    else if (state.pracSub === "speedrun") { renderWeaknessRadar(); renderSpeedRun(); }
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
            else if (idx === chosen && idx !== t.answer) { cls = "wrong"; tag = `<span class="badge badge-danger">Queued in Leitner Box 1</span>`; }
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
        trackDomainResult(t.domain, ok, t.id, false);
        if (ok) { state.solvedTickets[t.id] = true; recordStudyActivity(); }
        saveState();
        renderIncidents();
        renderOverview();
      });
    });
  }

  // ---------------------------------------------------------------------------
  // PRACTICE 1B: 15 INTERACTIVE EXAM DRILLS
  // (Order-the-Steps, Multi-Dropdown Tables, Locked Yes/No Series)
  // ---------------------------------------------------------------------------
  let seqPickedMap = {};     // { seqId: ["s1", "s2", ...] }
  let seqCheckedMap = {};    // { seqId: boolean }
  let ddSelectionsMap = {};  // { ddId: { slot1: 0, slot2: 1, slot3: 2 } }
  let ddCheckedMap = {};     // { ddId: boolean }
  let ynProgressMap = {};    // { ynId: { step: 0|1|2|3, answers: [bool, bool, bool] } }

  document.querySelectorAll("[data-int-mode]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.intMode = btn.dataset.intMode;
      saveState();
      renderInteractiveDrills();
    });
  });

  function renderInteractiveDrills() {
    document.querySelectorAll("[data-int-mode]").forEach(b => {
      b.classList.toggle("active", b.dataset.intMode === state.intMode);
    });
    const root = document.getElementById("int-drills-root");
    if (!root) return;

    if (state.intMode === "sequence") renderSequenceDrill(root);
    else if (state.intMode === "dropdown") renderDropdownDrill(root);
    else renderYesNoSeries(root);
  }

  function renderSequenceDrill(root) {
    const sq = SEQUENCE_DRILLS.find(x => x.id === state.activeSeqId) || SEQUENCE_DRILLS[0];
    state.activeSeqId = sq.id;
    if (!seqPickedMap[sq.id]) {
      seqPickedMap[sq.id] = state.solvedSequences && state.solvedSequences[sq.id] ? [...sq.correctOrder] : [];
    }
    const picked = seqPickedMap[sq.id];
    const checked = !!seqCheckedMap[sq.id] || !!(state.solvedSequences && state.solvedSequences[sq.id]);
    const isExact = picked.length === sq.correctOrder.length && sq.correctOrder.every((id, i) => picked[i] === id);
    const solvedTotal = Object.values(state.solvedSequences || {}).filter(Boolean).length;

    const remainingPool = sq.pool.filter(p => !picked.includes(p.id));

    root.innerHTML = `
      <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px;">
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${SEQUENCE_DRILLS.map(item => `
            <button data-seq-pick="${item.id}" class="btn btn-sm ${item.id === sq.id ? "btn-primary" : ""}">
              ${state.solvedSequences && state.solvedSequences[item.id] ? "✓ " : ""}${item.code}: ${item.domainLabel}
            </button>
          `).join("")}
        </div>
        <span class="badge mono">${solvedTotal} / ${SEQUENCE_DRILLS.length} Sequences Solved</span>
      </div>

      <div style="padding:16px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
          <span class="badge badge-accent mono">${sq.code}</span>
          <span class="badge">${sq.domainLabel}</span>
          <span class="badge">Select &amp; Order ${sq.requiredCount} Steps</span>
        </div>
        <h3 style="font-size:16px;">${sq.title}</h3>
        <p style="font-size:13.5px; color:var(--text-secondary); margin-top:6px;">${sq.scenario}</p>
      </div>

      <div class="seq-builder">
        <!-- Left: Available Pool -->
        <div style="padding:14px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md); display:flex; flex-direction:column; gap:10px;">
          <div style="font-size:12.5px; font-weight:700; color:var(--text-secondary); text-transform:uppercase;">Available Actions Pool (${remainingPool.length} remaining)</div>
          ${remainingPool.length ? remainingPool.map(p => `
            <div class="seq-step-row">
              <span>${p.text}</span>
              <button data-seq-add="${p.id}" class="btn btn-primary btn-sm" style="flex-shrink:0;" ${picked.length >= sq.requiredCount ? "disabled" : ""}>+ Add</button>
            </div>
          `).join("") : `<div style="font-size:12.5px; color:var(--text-secondary);">All candidate steps placed.</div>`}
        </div>

        <!-- Right: Ordered Sequence -->
        <div style="padding:14px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md); display:flex; flex-direction:column; gap:10px;">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <span style="font-size:12.5px; font-weight:700; color:var(--text-secondary); text-transform:uppercase;">Your Ordered Sequence (${picked.length} / ${sq.requiredCount})</span>
            <button id="seq-reset-btn" class="btn btn-sm">Clear &amp; Reset</button>
          </div>
          ${picked.length ? picked.map((pid, idx) => {
            const stepObj = sq.pool.find(x => x.id === pid);
            let cls = "";
            if (checked) {
              cls = sq.correctOrder[idx] === pid ? "correct" : "wrong";
            }
            return `
              <div class="seq-step-row ${cls}">
                <div style="display:flex; align-items:flex-start; gap:8px;">
                  <span class="badge mono">Step ${idx + 1}</span>
                  <span>${stepObj ? stepObj.text : pid}</span>
                </div>
                <div style="display:flex; gap:4px; flex-shrink:0;">
                  <button data-seq-up="${idx}" class="btn btn-sm" style="padding:2px 7px;" ${idx === 0 ? "disabled" : ""}>↑</button>
                  <button data-seq-down="${idx}" class="btn btn-sm" style="padding:2px 7px;" ${idx === picked.length - 1 ? "disabled" : ""}>↓</button>
                  <button data-seq-rem="${idx}" class="btn btn-sm" style="padding:2px 7px;">✕</button>
                </div>
              </div>
            `;
          }).join("") : `<div style="padding:20px; text-align:center; color:var(--text-tertiary); font-size:13px;">Click <strong>+ Add</strong> on ${sq.requiredCount} steps from the pool in exact execution order.</div>`}

          <div style="display:flex; justify-content:flex-end; padding-top:6px;">
            <button id="seq-verify-btn" class="btn btn-primary" ${picked.length !== sq.requiredCount ? "disabled" : ""}>Verify ${sq.requiredCount}-Step Sequence</button>
          </div>
        </div>
      </div>

      ${checked ? `
        <div style="padding:16px; background:var(--bg-canvas); border:1px solid ${isExact ? "var(--success)" : "var(--warning)"}; border-radius:var(--radius-md);">
          <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:6px;">
            <span style="font-size:12px; font-weight:700; text-transform:uppercase; color:${isExact ? "var(--success)" : "var(--warning)"};">
              ${isExact ? "✓ Exact Sequence Verified" : "Sequence Mismatch — Check Highlighted Steps"}
            </span>
            <a href="${sq.msUrl}" target="_blank" rel="noopener" style="font-size:12.5px; font-weight:600;">↗ Official Microsoft Learn Procedure</a>
          </div>
          <p style="font-size:13.5px;">${sq.explanation}</p>
        </div>
      ` : ""}
    `;

    root.querySelectorAll("[data-seq-pick]").forEach(b => {
      b.addEventListener("click", () => {
        state.activeSeqId = b.dataset.seqPick;
        saveState();
        renderSequenceDrill(root);
      });
    });

    root.querySelectorAll("[data-seq-add]").forEach(b => {
      b.addEventListener("click", () => {
        if (picked.length < sq.requiredCount) {
          picked.push(b.dataset.seqAdd);
          seqCheckedMap[sq.id] = false;
          renderSequenceDrill(root);
        }
      });
    });

    root.querySelectorAll("[data-seq-up]").forEach(b => {
      b.addEventListener("click", () => {
        const i = Number(b.dataset.seqUp);
        if (i > 0) {
          [picked[i - 1], picked[i]] = [picked[i], picked[i - 1]];
          seqCheckedMap[sq.id] = false;
          renderSequenceDrill(root);
        }
      });
    });

    root.querySelectorAll("[data-seq-down]").forEach(b => {
      b.addEventListener("click", () => {
        const i = Number(b.dataset.seqDown);
        if (i < picked.length - 1) {
          [picked[i + 1], picked[i]] = [picked[i], picked[i + 1]];
          seqCheckedMap[sq.id] = false;
          renderSequenceDrill(root);
        }
      });
    });

    root.querySelectorAll("[data-seq-rem]").forEach(b => {
      b.addEventListener("click", () => {
        picked.splice(Number(b.dataset.seqRem), 1);
        seqCheckedMap[sq.id] = false;
        renderSequenceDrill(root);
      });
    });

    root.querySelector("#seq-reset-btn").addEventListener("click", () => {
      seqPickedMap[sq.id] = [];
      seqCheckedMap[sq.id] = false;
      renderSequenceDrill(root);
    });

    root.querySelector("#seq-verify-btn").addEventListener("click", () => {
      seqCheckedMap[sq.id] = true;
      const ok = picked.length === sq.correctOrder.length && sq.correctOrder.every((id, i) => picked[i] === id);
      if (ok) {
        if (!state.solvedSequences) state.solvedSequences = {};
        state.solvedSequences[sq.id] = true;
        recordStudyActivity();
      }
      trackDomainResult(sq.domain, ok, null, false);
      saveState();
      renderSequenceDrill(root);
    });
  }

  function renderDropdownDrill(root) {
    const dd = DROPDOWN_DRILLS.find(x => x.id === state.activeDdId) || DROPDOWN_DRILLS[0];
    state.activeDdId = dd.id;
    const alreadySolved = !!(state.solvedDropdowns && state.solvedDropdowns[dd.id]);
    if (!ddSelectionsMap[dd.id]) {
      const init = {};
      dd.slots.forEach(s => { init[s.id] = alreadySolved ? s.answer : 0; });
      ddSelectionsMap[dd.id] = init;
    }
    const sel = ddSelectionsMap[dd.id];
    const checked = !!ddCheckedMap[dd.id] || alreadySolved;
    const allCorrect = dd.slots.every(s => Number(sel[s.id]) === s.answer);
    const solvedTotal = Object.values(state.solvedDropdowns || {}).filter(Boolean).length;

    root.innerHTML = `
      <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px;">
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${DROPDOWN_DRILLS.map(item => `
            <button data-dd-pick="${item.id}" class="btn btn-sm ${item.id === dd.id ? "btn-primary" : ""}">
              ${state.solvedDropdowns && state.solvedDropdowns[item.id] ? "✓ " : ""}${item.code}: ${item.domainLabel}
            </button>
          `).join("")}
        </div>
        <span class="badge mono">${solvedTotal} / ${DROPDOWN_DRILLS.length} Hot-Area Tables Solved</span>
      </div>

      <div style="padding:16px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md); display:flex; flex-direction:column; gap:12px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="badge badge-accent mono">${dd.code}</span>
          <span class="badge">${dd.domainLabel}</span>
          <span class="badge">3-Slot Configuration Evaluation</span>
        </div>
        <h3 style="font-size:16px;">${dd.title}</h3>
        <div class="code-block-wrap">
          <div class="code-block-bar"><span>Environment / Template Context</span></div>
          <pre class="code-pre">${escapeHtml(dd.context)}</pre>
        </div>
        <div style="font-weight:650; font-size:13.5px;">${dd.prompt}</div>
      </div>

      <div style="display:flex; flex-direction:column; gap:12px;">
        ${dd.slots.map(s => {
          const pickedIdx = Number(sel[s.id] || 0);
          const slotOk = pickedIdx === s.answer;
          return `
            <div style="padding:14px 16px; background:var(--bg-canvas); border:1px solid ${!checked ? "var(--border-subtle)" : (slotOk ? "var(--success)" : "var(--danger)")}; border-radius:var(--radius-md); display:flex; flex-direction:column; gap:8px;">
              <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
                <span style="font-size:13px; font-weight:650;">${s.label}</span>
                ${checked ? `<span class="badge ${slotOk ? "badge-success" : "badge-danger"}">${slotOk ? "✓ Correct Slot" : "✕ Incorrect"}</span>` : ""}
              </div>
              <select data-dd-slot="${s.id}" class="select" style="width:100%;">
                ${s.options.map((opt, oi) => `<option value="${oi}" ${pickedIdx === oi ? "selected" : ""}>${escapeHtml(opt)}</option>`).join("")}
              </select>
              ${checked && !slotOk ? `<div style="font-size:12px; color:var(--success);">Expected: <strong>${escapeHtml(s.options[s.answer])}</strong></div>` : ""}
            </div>
          `;
        }).join("")}
      </div>

      <div style="display:flex; justify-content:flex-end; gap:8px;">
        <button id="dd-evaluate-btn" class="btn btn-primary">Evaluate All 3 Dropdown Slots</button>
      </div>

      ${checked ? `
        <div style="padding:16px; background:var(--bg-canvas); border:1px solid ${allCorrect ? "var(--success)" : "var(--warning)"}; border-radius:var(--radius-md);">
          <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:6px;">
            <span style="font-size:12px; font-weight:700; text-transform:uppercase; color:${allCorrect ? "var(--success)" : "var(--warning)"};">
              ${allCorrect ? "✓ All 3/3 Configuration Slots Verified" : "Review Slot Breakdown"}
            </span>
            <a href="${dd.msUrl}" target="_blank" rel="noopener" style="font-size:12.5px; font-weight:600;">↗ Verify in Official MS Learn Docs</a>
          </div>
          <p style="font-size:13.5px;">${dd.explanation}</p>
        </div>
      ` : ""}
    `;

    root.querySelectorAll("[data-dd-pick]").forEach(b => {
      b.addEventListener("click", () => {
        state.activeDdId = b.dataset.ddPick;
        saveState();
        renderDropdownDrill(root);
      });
    });

    root.querySelectorAll("[data-dd-slot]").forEach(selEl => {
      selEl.addEventListener("change", e => {
        ddSelectionsMap[dd.id][selEl.dataset.ddSlot] = Number(e.target.value);
        ddCheckedMap[dd.id] = false;
      });
    });

    root.querySelector("#dd-evaluate-btn").addEventListener("click", () => {
      ddCheckedMap[dd.id] = true;
      const ok = dd.slots.every(s => Number(ddSelectionsMap[dd.id][s.id]) === s.answer);
      if (ok) {
        if (!state.solvedDropdowns) state.solvedDropdowns = {};
        state.solvedDropdowns[dd.id] = true;
        recordStudyActivity();
      }
      trackDomainResult(dd.domain, ok, null, false);
      saveState();
      renderDropdownDrill(root);
    });
  }

  function renderYesNoSeries(root) {
    const yn = YESNO_SERIES.find(x => x.id === state.activeYnId) || YESNO_SERIES[0];
    state.activeYnId = yn.id;
    if (!ynProgressMap[yn.id]) {
      ynProgressMap[yn.id] = { step: 0, answers: [] };
    }
    const prog = ynProgressMap[yn.id];
    const solvedTotal = Object.values(state.solvedYesNo || {}).filter(Boolean).length;
    const isFinished = prog.step >= yn.solutions.length;

    root.innerHTML = `
      <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px;">
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${YESNO_SERIES.map(item => `
            <button data-yn-pick="${item.id}" class="btn btn-sm ${item.id === yn.id ? "btn-primary" : ""}">
              ${state.solvedYesNo && state.solvedYesNo[item.id] ? "✓ " : ""}${item.code}: ${item.domainLabel}
            </button>
          `).join("")}
        </div>
        <span class="badge mono">${solvedTotal} / ${YESNO_SERIES.length} Locked Series Completed</span>
      </div>

      <div style="padding:16px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md); display:flex; flex-direction:column; gap:10px;">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="badge badge-warning mono">${yn.code} • NON-REVERTIBLE EXAM FORMAT</span>
            <span class="badge">${yn.domainLabel}</span>
          </div>
          <span class="mono" style="font-size:12px; color:var(--text-secondary);">
            ${isFinished ? "Series Complete (3/3 Locked)" : `Screen ${prog.step + 1} of 3 (Cannot go back after locking!)`}
          </span>
        </div>
        <h3 style="font-size:16px;">${yn.title}</h3>
        <p style="font-size:13.5px; color:var(--text-secondary); white-space:pre-line;">${escapeHtml(yn.problem)}</p>
      </div>

      ${!isFinished ? (() => {
        const curSol = yn.solutions[prog.step];
        return `
          <div style="padding:18px; background:var(--bg-canvas); border:1px solid var(--border-strong); border-radius:var(--radius-md); display:flex; flex-direction:column; gap:14px;">
            <div style="display:flex; align-items:center; justify-content:space-between;">
              <span class="badge badge-accent mono">PROPOSED SOLUTION ${curSol.num} OF 3</span>
              <span style="font-size:12px; color:var(--text-tertiary);">Once you click Lock, this screen cannot be revisited</span>
            </div>
            <div style="font-size:14.5px; font-weight:600; line-height:1.55;">${curSol.proposed}</div>
            <div style="font-size:13px; color:var(--text-secondary); font-weight:600;">Does this proposed solution meet the required goal?</div>
            <div class="topo-grid-2">
              <button data-yn-ans="true" class="option-btn">
                <span><strong>Yes</strong> — This proposed solution meets all requirements</span>
                <span class="badge">Lock &amp; Next →</span>
              </button>
              <button data-yn-ans="false" class="option-btn">
                <span><strong>No</strong> — This proposed solution fails at least one requirement</span>
                <span class="badge">Lock &amp; Next →</span>
              </button>
            </div>
          </div>
        `;
      })() : (() => {
        const correctCount = yn.solutions.filter((s, idx) => prog.answers[idx] === s.meetsGoal).length;
        return `
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; padding:14px 16px; background:var(--bg-canvas); border:1px solid ${correctCount === 3 ? "var(--success)" : "var(--warning)"}; border-radius:var(--radius-md);">
              <div>
                <div style="font-size:14px; font-weight:700; color:${correctCount === 3 ? "var(--success)" : "var(--warning)"};">
                  Locked Series Post-Mortem: ${correctCount} / 3 Proposed Solutions Evaluated Correctly
                </div>
                <div style="font-size:12.5px; color:var(--text-secondary);">Compare the 3 proposed architectures side-by-side below to see what made each one succeed or fail.</div>
              </div>
              <button id="yn-retry-btn" class="btn btn-sm">Replay Series</button>
            </div>

            ${yn.solutions.map((s, idx) => {
              const userAns = prog.answers[idx];
              const ok = userAns === s.meetsGoal;
              return `
                <div style="padding:14px 16px; background:var(--bg-canvas); border:1px solid ${ok ? "var(--success)" : "var(--danger)"}; border-radius:var(--radius-md); display:flex; flex-direction:column; gap:8px;">
                  <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                    <span class="mono" style="font-size:12px; font-weight:700;">Solution ${s.num} • Official Answer: <strong style="color:${s.meetsGoal ? "var(--success)" : "var(--danger)"};">${s.meetsGoal ? "YES (Meets Goal)" : "NO (Fails Goal)"}</strong></span>
                    <span class="badge ${ok ? "badge-success" : "badge-danger"}">Your Pick: ${userAns ? "Yes" : "No"} (${ok ? "✓ Correct" : "✕ Missed"})</span>
                  </div>
                  <div style="font-size:13px; color:var(--text-secondary);">${s.proposed}</div>
                  <div style="font-size:13px; padding-top:6px; border-top:1px solid var(--border-subtle);">${s.why}</div>
                </div>
              `;
            }).join("")}
          </div>
        `;
      })()}
    `;

    root.querySelectorAll("[data-yn-pick]").forEach(b => {
      b.addEventListener("click", () => {
        state.activeYnId = b.dataset.ynPick;
        saveState();
        renderYesNoSeries(root);
      });
    });

    root.querySelectorAll("[data-yn-ans]").forEach(b => {
      b.addEventListener("click", () => {
        const ans = b.dataset.ynAns === "true";
        const curSol = yn.solutions[prog.step];
        const ok = ans === curSol.meetsGoal;
        prog.answers.push(ans);
        prog.step++;
        trackDomainResult(yn.domain, ok, null, false);

        if (prog.step >= yn.solutions.length) {
          const allOk = yn.solutions.every((s, idx) => prog.answers[idx] === s.meetsGoal);
          if (allOk) {
            if (!state.solvedYesNo) state.solvedYesNo = {};
            state.solvedYesNo[yn.id] = true;
            recordStudyActivity();
          }
          saveState();
        }
        renderYesNoSeries(root);
      });
    });

    const retryBtn = root.querySelector("#yn-retry-btn");
    if (retryBtn) {
      retryBtn.addEventListener("click", () => {
        ynProgressMap[yn.id] = { step: 0, answers: [] };
        renderYesNoSeries(root);
      });
    }
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
          if (bugPicks.size === 2) {
            const matched = bh.bugLines.every(l => bugPicks.has(l));
            trackDomainResult(bh.domain, matched, null, false);
            if (matched) {
              state.solvedBugHunts[bh.id] = true;
              recordStudyActivity();
              saveState();
            }
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
                  ${answered ? `<span class="badge ${ans === q.answer ? "badge-success" : "badge-danger"}">${ans === q.answer ? "Correct" : "Queued in Leitner Box 1"}</span>` : ""}
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
      const [qid, oiStr] = b.dataset.csq.split(":");
      const oi = Number(oiStr);
      const qObj = cs.questions.find(x => x.id === qid);
      state.solvedCaseQ[qid] = oi;
      if (qObj) {
        trackDomainResult(cs.id === "cs1" ? "compute" : "identity", oi === qObj.answer, qid, false);
      }
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

  // ---------------------------------------------------------------------------
  // 60s SPEED RUN & 3-BOX LEITNER SPACED REPETITION QUEUE
  // ---------------------------------------------------------------------------
  let srMode = "arcade", srRunning = false, srTimeLeft = 60, srScore = 0, srStreak = 0, srDeck = [], srIndex = 0, srTimer = null, srLastFeedback = null;
  let leitnerCursor = 0;

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function getDueLeitnerQueue() {
    const allItems = window.AZ104_READINESS.getLeitnerItems(state);
    // Prioritize Box 1 (Urgent, streak 0) first, then Box 2 (Reinforcing, streak 1)
    return allItems
      .filter(it => it.box === 1 || it.box === 2)
      .sort((a, b) => a.box - b.box);
  }

  function renderWeaknessRadar() {
    const el = document.getElementById("weakness-radar");
    if (!el) return;
    const allItems = window.AZ104_READINESS.getLeitnerItems(state);
    const box1Count = allItems.filter(i => i.box === 1).length;
    const box2Count = allItems.filter(i => i.box === 2).length;
    const box3Count = allItems.filter(i => i.box === 3).length;
    const dueCount = box1Count + box2Count;

    el.innerHTML = `
      <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:10px; padding-bottom:12px; border-bottom:1px solid var(--border-subtle);">
        <div style="display:flex; flex-wrap:wrap; align-items:center; gap:8px; font-size:12.5px;">
          <span class="badge ${box1Count > 0 ? "badge-danger" : ""}">Box 1 Urgent (0/2): <strong class="mono" style="margin-left:4px;">${box1Count}</strong></span>
          <span class="badge ${box2Count > 0 ? "badge-warning" : ""}">Box 2 Reinforcing (1/2): <strong class="mono" style="margin-left:4px;">${box2Count}</strong></span>
          <span class="badge badge-success">Box 3 Graduated (2/2): <strong class="mono" style="margin-left:4px;">${box3Count}</strong></span>
          <span style="color:var(--text-secondary); margin-left:4px;">Best 60s Run: <strong class="mono" style="color:var(--text-primary);">${state.bestSpeedRun || 0}</strong></span>
        </div>
        <div class="segmented">
          <button id="sr-mode-arcade" class="seg-btn ${srMode === "arcade" ? "active" : ""}">60s Speed Run (36 Traps)</button>
          <button id="sr-mode-review" class="seg-btn ${srMode === "review" ? "active" : ""}">Leitner Review Queue (${dueCount} due)</button>
        </div>
      </div>
    `;
    el.querySelector("#sr-mode-arcade").addEventListener("click", () => {
      clearInterval(srTimer); srRunning = false; srTimeLeft = 60; srMode = "arcade"; renderWeaknessRadar(); renderSpeedRun();
    });
    el.querySelector("#sr-mode-review").addEventListener("click", () => {
      clearInterval(srTimer); srRunning = false; srMode = "review"; srLastFeedback = null;
      leitnerCursor = 0;
      renderWeaknessRadar(); renderSpeedRun();
    });
  }

  function updateSRHud() {
    document.getElementById("sr-time").textContent = srMode === "review" ? "Leitner" : `${srTimeLeft}s`;
    document.getElementById("sr-score").textContent = srScore;
    document.getElementById("sr-streak").textContent = srStreak;
  }

  function renderSpeedRun() {
    const stage = document.getElementById("sr-stage");
    if (!stage) return;
    updateSRHud();

    if (srMode === "review") {
      const dueList = getDueLeitnerQueue();
      if (!dueList.length) {
        stage.innerHTML = `
          <div style="padding:28px; text-align:center; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
            <div style="font-size:16px; font-weight:700; color:var(--success);">Leitner Box 1 &amp; Box 2 Queues Are Clear!</div>
            <p style="font-size:13px; color:var(--text-secondary); margin-top:4px;">Every missed trap, P1 incident, case study question, or sprint checkpoint automatically enters Box 1 and requires 2 consecutive correct reviews to graduate to Box 3.</p>
          </div>
        `;
        return;
      }
      const leitnerEntry = dueList[leitnerCursor % dueList.length];
      const card = lookupReviewableItem(leitnerEntry.id) || SPEEDRUN_CARDS[0];

      stage.innerHTML = `
        <div style="padding:20px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md); display:flex; flex-direction:column; gap:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <span class="badge ${leitnerEntry.box === 1 ? "badge-danger" : "badge-warning"} mono">
              LEITNER BOX ${leitnerEntry.box} (${leitnerEntry.streak || 0}/2 STREAK) • ${card.type.toUpperCase()}
            </span>
            <span class="mono" style="font-size:12px; color:var(--text-secondary);">${dueList.length} item(s) due for graduation</span>
          </div>
          <div style="font-size:15.5px; font-weight:650; white-space:pre-line;">${escapeHtml(card.prompt)}</div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${card.choices.map((c, i) => `<button data-rev-pick="${i}" class="option-btn">${c}</button>`).join("")}
          </div>
          ${srLastFeedback ? `
            <div style="font-size:12.5px; color:var(--text-secondary); padding-top:8px; border-top:1px solid var(--border-subtle);">
              <strong style="color:${srLastFeedback.ok ? "var(--success)" : "var(--danger)"}">${srLastFeedback.statusMsg}</strong> ${srLastFeedback.why}
            </div>
          ` : ""}
        </div>
      `;
      stage.querySelectorAll("[data-rev-pick]").forEach(btn => {
        btn.addEventListener("click", () => {
          const ok = Number(btn.dataset.revPick) === card.answer;
          const prevBox = leitnerEntry.box;
          trackDomainResult(card.domain, ok, card.id, true);
          if (ok) {
            recordStudyActivity();
            leitnerCursor++;
          }
          const statusMsg = ok
            ? (prevBox === 1 ? "Promoted to Box 2 (1/2 Streak — 1 more right answer graduates it!):" : "Graduated to Box 3 (2/2 Streak — Locked In!):")
            : "Reset to Box 1 (0/2 Streak):";
          srLastFeedback = { ok, statusMsg, why: card.why };
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
          <p style="font-size:13px; color:var(--text-secondary); max-width:540px;">Every answer calibrates your per-domain recall accuracy in Overview, and any miss enters Leitner Box 1 (requiring a 2x streak to graduate).</p>
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
          <p style="font-size:13px; color:var(--text-secondary);">Personal Best: <strong>${state.bestSpeedRun || 0}</strong> • Switch to Leitner Review Queue above to promote Box 1 &amp; Box 2 items.</p>
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
            <span><strong style="color:${srLastFeedback.ok ? "var(--success)" : "var(--danger)"}">${srLastFeedback.ok ? "Correct:" : "Sent to Leitner Box 1:"}</strong> ${srLastFeedback.why}</span>
            <a href="${srLastFeedback.url}" target="_blank" rel="noopener">↗ MS Docs</a>
          </div>
        ` : ""}
      </div>
    `;

    stage.querySelectorAll("[data-sr-pick]").forEach(btn => {
      btn.addEventListener("click", () => {
        const ok = Number(btn.dataset.srPick) === card.answer;
        trackDomainResult(card.domain, ok, card.id, false);
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
  // VIEW 4: BUILT-IN TIMED AZ-104 EXAM SIMULATOR
  // Supports 15Q Timed Boss Sprint (22m), 35Q Full Dress Rehearsal (52m),
  // and 12Q Weakest-Domain Surgical Mock (18m)
  // Auto-logs domain percentages to Overview & queues misses in Leitner Box 1
  // ---------------------------------------------------------------------------
  let examSim = {
    status: "lobby",      // "lobby" | "running" | "report"
    modeLabel: "",
    questions: [],
    currentIndex: 0,
    answers: {},          // { qIndex: number }
    flagged: {},          // { qIndex: true }
    secondsLeft: 0,
    totalSeconds: 0,
    timerId: null,
    msLearnActive: false,
    msLearnSeconds: 0,
    msLearnTimerId: null,
    lastReport: null
  };

  function buildUnifiedQuestionPool() {
    const pool = [];
    // 1. All 20 P1 Tickets
    TICKETS.forEach(t => {
      pool.push({
        uid: t.id,
        domain: t.domain,
        format: `Scenario (${t.code})`,
        stem: `${t.title}\n\n${t.symptom}\n\n${t.question}`,
        options: t.options,
        answer: t.answer,
        why: t.explanation,
        url: t.msUrl
      });
    });
    // 2. All 24 Sprint Checkpoints
    Object.values(TOPIC_CHECKPOINTS).forEach(list => {
      list.forEach(cp => {
        pool.push({
          uid: cp.id,
          domain: cp.domain,
          format: "Blueprint Checkpoint",
          stem: cp.q,
          options: cp.options,
          answer: cp.answer,
          why: cp.why,
          url: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104"
        });
      });
    });
    // 3. All 8 Case Study Questions (with case summary context)
    CASE_STUDIES.forEach(cs => {
      cs.questions.forEach(cq => {
        pool.push({
          uid: cq.id,
          domain: cs.id === "cs1" ? "compute" : "identity",
          format: `Case Study (${cs.title.split(":")[0]})`,
          stem: `[Case Context] ${cs.tabs["Current Environment"]}\n${cs.tabs["Planned Changes"]}\n\nQuestion: ${cq.q}`,
          options: cq.options,
          answer: cq.answer,
          why: cq.why,
          url: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104"
        });
      });
    });
    // 4. Multi-Dropdown slots flattened as high-yield scenario items
    DROPDOWN_DRILLS.forEach(dd => {
      dd.slots.forEach((slot, si) => {
        pool.push({
          uid: `${dd.id}_${slot.id}`,
          domain: dd.domain,
          format: `Hot-Area Config (${dd.code} #${si + 1})`,
          stem: `${dd.title}\n\n${dd.context}\n\n${slot.label}`,
          options: slot.options,
          answer: slot.answer,
          why: dd.explanation,
          url: dd.msUrl
        });
      });
    });
    // 5. Locked Yes/No Series items
    YESNO_SERIES.forEach(yn => {
      yn.solutions.forEach(sol => {
        pool.push({
          uid: sol.id,
          domain: yn.domain,
          format: `Yes/No Scenario (${yn.code})`,
          stem: `${yn.problem}\n\nProposed Solution: ${sol.proposed}\n\nDoes this meet the goal?`,
          options: [
            "Yes — This proposed solution meets all requirements",
            "No — This proposed solution fails at least one requirement"
          ],
          answer: sol.meetsGoal ? 0 : 1,
          why: sol.why,
          url: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104"
        });
      });
    });
    // 6. High-yield Speed Run traps
    SPEEDRUN_CARDS.forEach(sr => {
      pool.push({
        uid: sr.id,
        domain: sr.domain,
        format: "Rapid Trap Verification",
        stem: sr.prompt,
        options: sr.choices,
        answer: sr.answer,
        why: sr.why,
        url: sr.url
      });
    });
    return pool;
  }

  function startExamSession(mode) {
    clearInterval(examSim.timerId);
    clearInterval(examSim.msLearnTimerId);

    const allPool = shuffle(buildUnifiedQuestionPool());
    let picked = [];
    let label = "";

    if (mode === "weakest") {
      const report = window.AZ104_READINESS.compute(state);
      const weakDom = report.weakest.id;
      picked = allPool.filter(q => q.domain === weakDom).slice(0, 12);
      label = `Surgical Mock: ${report.weakest.shortName} (12Q)`;
    } else {
      const targetCount = mode === "full" ? 35 : 15;
      label = mode === "full" ? "Built-In 35Q AZ-104 Dress Rehearsal" : "Built-In 15Q Timed Boss Sprint";
      // Pick proportional to AZ-104 domain weights
      const quotas = mode === "full"
        ? { identity: 8, compute: 8, networking: 7, storage: 7, monitor: 5 }
        : { identity: 4, compute: 4, networking: 3, storage: 2, monitor: 2 };
      Object.entries(quotas).forEach(([dom, count]) => {
        const domQuestions = allPool.filter(q => q.domain === dom).slice(0, count);
        picked.push(...domQuestions);
      });
      picked = shuffle(picked).slice(0, targetCount);
    }

    const totalSecs = picked.length * 90; // 90 seconds per question real exam pace
    examSim = {
      status: "running",
      modeLabel: label,
      questions: picked,
      currentIndex: 0,
      answers: {},
      flagged: {},
      secondsLeft: totalSecs,
      totalSeconds: totalSecs,
      timerId: null,
      msLearnActive: false,
      msLearnSeconds: 0,
      msLearnTimerId: null,
      lastReport: null
    };

    examSim.timerId = setInterval(() => {
      examSim.secondsLeft--;
      const clockEl = document.getElementById("es-clock-readout");
      if (clockEl) {
        const m = String(Math.floor(Math.max(0, examSim.secondsLeft) / 60)).padStart(2, "0");
        const s = String(Math.max(0, examSim.secondsLeft) % 60).padStart(2, "0");
        clockEl.textContent = `${m}:${s}`;
      }
      if (examSim.secondsLeft <= 0) {
        submitExamSession();
      }
    }, 1000);

    renderExamSim();
  }

  function toggleMsLearnTimer() {
    if (examSim.msLearnActive) {
      clearInterval(examSim.msLearnTimerId);
      examSim.msLearnTimerId = null;
      examSim.msLearnActive = false;
    } else {
      examSim.msLearnActive = true;
      examSim.msLearnTimerId = setInterval(() => {
        examSim.msLearnSeconds++;
        const el = document.getElementById("es-mslearn-readout");
        if (el) el.textContent = `${examSim.msLearnSeconds}s in Docs`;
      }, 1000);
    }
    renderExamSim();
  }

  function submitExamSession() {
    clearInterval(examSim.timerId);
    clearInterval(examSim.msLearnTimerId);
    examSim.timerId = null;
    examSim.msLearnTimerId = null;
    examSim.msLearnActive = false;

    const domTotals = { identity: 0, compute: 0, networking: 0, storage: 0, monitor: 0 };
    const domRight = { identity: 0, compute: 0, networking: 0, storage: 0, monitor: 0 };
    let totalRight = 0;

    examSim.questions.forEach((q, idx) => {
      const userAns = examSim.answers[idx];
      const ok = userAns === q.answer;
      domTotals[q.domain] = (domTotals[q.domain] || 0) + 1;
      if (ok) {
        domRight[q.domain] = (domRight[q.domain] || 0) + 1;
        totalRight++;
      }
      // Feed every question into domain accuracy and Leitner queue!
      trackDomainResult(q.domain, ok, lookupReviewableItem(q.uid) ? q.uid : null, false);
    });

    const overallPct = Math.round((totalRight / Math.max(1, examSim.questions.length)) * 100);
    const scaledScore = overallPct < 72
      ? Math.round(300 + (overallPct / 72) * 399)
      : Math.min(1000, Math.round(700 + ((overallPct - 72) / 28) * 300));

    // Compute per-domain percentages (fallback to overallPct if a single-domain surgical drill left other domains at 0 questions)
    const domPcts = {};
    ["identity", "compute", "networking", "storage", "monitor"].forEach(d => {
      domPcts[d] = domTotals[d] > 0 ? Math.round((domRight[d] / domTotals[d]) * 100) : overallPct;
    });

    // Auto-log to Overview mockLogs!
    if (!Array.isArray(state.mockLogs)) state.mockLogs = [];
    state.mockLogs.unshift({
      source: `${examSim.modeLabel} (${scaledScore}/1000)`,
      date: todayKey(),
      overall: overallPct,
      domains: domPcts
    });
    recordStudyActivity();
    saveState();

    examSim.status = "report";
    examSim.lastReport = {
      totalRight,
      totalQuestions: examSim.questions.length,
      overallPct,
      scaledScore,
      passed: scaledScore >= 700,
      domPcts,
      domTotals,
      domRight,
      timeSpentSecs: examSim.totalSeconds - Math.max(0, examSim.secondsLeft),
      msLearnSeconds: examSim.msLearnSeconds
    };

    renderExamSim();
    renderOverview();
  }

  function renderExamSim() {
    const root = document.getElementById("examsim-root");
    if (!root) return;

    if (examSim.status === "lobby") {
      const report = window.AZ104_READINESS.compute(state);
      root.innerHTML = `
        <div class="panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Choose Your Timed Exam Simulation Mode</h2>
              <div class="panel-sub">Zero instant spoilers during the test — simulates real Pearson VUE pacing (90s/question), question flagging, and open-book Microsoft Learn time budgeting.</div>
            </div>
            <span class="badge badge-accent mono">Pass Target: 700 / 1000 (72%+)</span>
          </div>
          <div class="panel-body" style="display:flex; flex-direction:column; gap:18px;">
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:14px;">
              <div style="padding:18px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md); display:flex; flex-direction:column; justify-content:space-between; gap:14px;">
                <div>
                  <span class="badge badge-accent mono">15 Questions • 22m 30s</span>
                  <h3 style="font-size:16px; margin-top:8px;">Timed Boss Sprint (15Q)</h3>
                  <p style="font-size:13px; color:var(--text-secondary); margin-top:4px;">Domain-weighted 22-minute exam sprint mixing P1 incidents, blueprint checkpoints, hot-area dropdowns, and locked Yes/No scenarios.</p>
                </div>
                <button id="es-start-sprint" class="btn btn-primary">Start 15-Question Timed Sprint →</button>
              </div>

              <div style="padding:18px; background:var(--bg-canvas); border:1px solid var(--border-strong); border-radius:var(--radius-md); display:flex; flex-direction:column; justify-content:space-between; gap:14px;">
                <div>
                  <span class="badge badge-success mono">35 Questions • 52m 30s</span>
                  <h3 style="font-size:16px; margin-top:8px;">Full AZ-104 Dress Rehearsal (35Q)</h3>
                  <p style="font-size:13px; color:var(--text-secondary); margin-top:4px;">Comprehensive multi-domain simulation weighted 1-to-1 to the official AZ-104 blueprint. Automatically logs to your 4-Gate Pass Checklist.</p>
                </div>
                <button id="es-start-full" class="btn btn-primary">Start 35-Question Dress Rehearsal →</button>
              </div>

              <div style="padding:18px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md); display:flex; flex-direction:column; justify-content:space-between; gap:14px;">
                <div>
                  <span class="badge badge-warning mono">12 Questions • 18m 00s</span>
                  <h3 style="font-size:16px; margin-top:8px;">Weakest-Domain Surgical Mock (${report.weakest.shortName})</h3>
                  <p style="font-size:13px; color:var(--text-secondary); margin-top:4px;">100% focused on your lowest-ranked domain right now (<strong>${report.weakest.name}</strong> at ${report.weakest.masteryPct}%).</p>
                </div>
                <button id="es-start-weak" class="btn">Drill ${report.weakest.shortName} Under Clock →</button>
              </div>
            </div>

            <div style="padding:14px 16px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md); font-size:13px; color:var(--text-secondary);">
              <strong style="color:var(--text-primary);">Exam-Day Open-Book Strategy Rule:</strong> During the real AZ-104 exam, you can open Microsoft Learn side-by-side, but <strong>the exam clock never pauses</strong>. Use the simulator's built-in <em>MS Learn Lookup Stopwatch</em> to train yourself to flag SKU/limit questions and spend under 45 seconds per lookup!
            </div>
          </div>
        </div>
      `;

      root.querySelector("#es-start-sprint").addEventListener("click", () => startExamSession("sprint"));
      root.querySelector("#es-start-full").addEventListener("click", () => startExamSession("full"));
      root.querySelector("#es-start-weak").addEventListener("click", () => startExamSession("weakest"));
      return;
    }

    if (examSim.status === "running") {
      const q = examSim.questions[examSim.currentIndex];
      const totalQ = examSim.questions.length;
      const answeredCount = Object.keys(examSim.answers).length;
      const isFlagged = !!examSim.flagged[examSim.currentIndex];
      const chosen = examSim.answers[examSim.currentIndex];

      const mins = String(Math.floor(Math.max(0, examSim.secondsLeft) / 60)).padStart(2, "0");
      const secs = String(Math.max(0, examSim.secondsLeft) % 60).padStart(2, "0");

      root.innerHTML = `
        <div class="panel">
          <!-- Top Exam HUD -->
          <div class="panel-header" style="background:var(--bg-elevated);">
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
              <span class="badge badge-accent mono">${escapeHtml(examSim.modeLabel)}</span>
              <span class="mono" style="font-size:12.5px; color:var(--text-secondary);">Answered: <strong>${answeredCount}/${totalQ}</strong></span>
            </div>
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <button id="es-mslearn-btn" class="btn btn-sm ${examSim.msLearnActive ? "btn-primary" : ""}">
                ${examSim.msLearnActive ? "⏸ Stop MS Learn Stopwatch" : "↗ Open MS Learn Lookup Stopwatch"}
              </button>
              <span id="es-mslearn-readout" class="badge ${examSim.msLearnSeconds > 120 ? "badge-warning" : ""} mono">${examSim.msLearnSeconds}s in Docs</span>
              <span class="badge mono" style="font-size:14px; padding:4px 10px;">Clock: <strong id="es-clock-readout" style="margin-left:5px;">${mins}:${secs}</strong></span>
              <button id="es-submit-btn" class="btn btn-primary btn-sm">Finish &amp; Grade Exam</button>
            </div>
          </div>

          <div class="panel-body" style="display:flex; flex-direction:column; gap:18px;">
            <!-- Question Navigator Strip -->
            <div>
              <div style="font-size:11.5px; font-weight:600; color:var(--text-secondary); margin-bottom:6px;">Question Navigator (Green = Answered • Amber = Flagged for Review)</div>
              <div class="exam-q-nav">
                ${examSim.questions.map((_, i) => {
                  const cls = [
                    "exam-q-pill",
                    i === examSim.currentIndex ? "active" : "",
                    examSim.answers[i] !== undefined ? "answered" : "",
                    examSim.flagged[i] ? "flagged" : ""
                  ].filter(Boolean).join(" ");
                  return `<button data-es-jump="${i}" class="${cls}">${i + 1}${examSim.flagged[i] ? "⚑" : ""}</button>`;
                }).join("")}
              </div>
            </div>

            <!-- Question Stem -->
            <div style="padding:18px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md); display:flex; flex-direction:column; gap:12px;">
              <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span class="mono" style="font-size:12px; font-weight:700; color:var(--text-secondary);">QUESTION ${examSim.currentIndex + 1} OF ${totalQ}</span>
                  <span class="badge">${q.format}</span>
                  <span class="badge mono">${q.domain.toUpperCase()}</span>
                </div>
                <button id="es-flag-btn" class="btn btn-sm ${isFlagged ? "btn-primary" : ""}">
                  ${isFlagged ? "⚑ Flagged for Review" : "⚑ Flag for Review"}
                </button>
              </div>
              <div style="font-size:14.5px; font-weight:600; line-height:1.6; white-space:pre-line;">${escapeHtml(q.stem)}</div>
            </div>

            <!-- Options -->
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${q.options.map((opt, oi) => {
                const isPicked = chosen === oi;
                return `
                  <button data-es-opt="${oi}" class="option-btn" style="border-color:${isPicked ? "var(--accent)" : "var(--border-subtle)"}; background:${isPicked ? "var(--accent-soft)" : "var(--bg-surface)"};">
                    <span><strong class="mono" style="margin-right:8px; color:var(--text-secondary);">${String.fromCharCode(65 + oi)}.</strong>${escapeHtml(opt)}</span>
                    ${isPicked ? `<span class="badge badge-accent">Selected</span>` : ""}
                  </button>
                `;
              }).join("")}
            </div>

            <!-- Bottom Navigation Bar -->
            <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; padding-top:10px; border-top:1px solid var(--border-subtle);">
              <button id="es-prev-btn" class="btn" ${examSim.currentIndex === 0 ? "disabled" : ""}>← Previous</button>
              <div style="display:flex; gap:8px;">
                ${examSim.currentIndex < totalQ - 1
                  ? `<button id="es-next-btn" class="btn btn-primary">Next Question →</button>`
                  : `<button id="es-finish-bottom" class="btn btn-primary">Submit &amp; Score Exam ✓</button>`}
              </div>
            </div>
          </div>
        </div>
      `;

      root.querySelectorAll("[data-es-jump]").forEach(b => {
        b.addEventListener("click", () => {
          examSim.currentIndex = Number(b.dataset.esJump);
          renderExamSim();
        });
      });

      root.querySelectorAll("[data-es-opt]").forEach(b => {
        b.addEventListener("click", () => {
          examSim.answers[examSim.currentIndex] = Number(b.dataset.esOpt);
          renderExamSim();
        });
      });

      root.querySelector("#es-flag-btn").addEventListener("click", () => {
        examSim.flagged[examSim.currentIndex] = !examSim.flagged[examSim.currentIndex];
        renderExamSim();
      });

      root.querySelector("#es-mslearn-btn").addEventListener("click", () => {
        if (!examSim.msLearnActive) {
          window.open(q.url || "https://learn.microsoft.com/en-us/azure/", "_blank", "noopener");
        }
        toggleMsLearnTimer();
      });

      const prevBtn = root.querySelector("#es-prev-btn");
      if (prevBtn) prevBtn.addEventListener("click", () => {
        if (examSim.currentIndex > 0) { examSim.currentIndex--; renderExamSim(); }
      });

      const nextBtn = root.querySelector("#es-next-btn");
      if (nextBtn) nextBtn.addEventListener("click", () => {
        if (examSim.currentIndex < totalQ - 1) { examSim.currentIndex++; renderExamSim(); }
      });

      root.querySelector("#es-submit-btn").addEventListener("click", submitExamSession);
      const finBot = root.querySelector("#es-finish-bottom");
      if (finBot) finBot.addEventListener("click", submitExamSession);
      return;
    }

    // REPORT STATE
    const rep = examSim.lastReport;
    root.innerHTML = `
      <div class="panel" style="margin-bottom:20px;">
        <div class="panel-header">
          <div>
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <span class="badge ${rep.passed ? "badge-success" : "badge-danger"}">${rep.passed ? "✓ PASS (≥ 700 / 1000)" : "✕ BELOW 700 PASS LINE"}</span>
              <h2 class="panel-title">${escapeHtml(examSim.modeLabel)} — Scaled Score: ${rep.scaledScore} / 1000 (${rep.overallPct}%)</h2>
            </div>
            <div class="panel-sub" style="margin-top:4px;">
              Auto-saved to your Overview Mock Exam Log &amp; 4-Gate Pass Checklist • Missed items queued into Leitner Box 1.
            </div>
          </div>
          <div style="display:flex; gap:8px;">
            <button id="es-back-lobby" class="btn btn-primary btn-sm">New Exam Simulation</button>
            <button id="es-go-leitner" class="btn btn-sm">Review Missed Items in Leitner Queue →</button>
          </div>
        </div>
        <div class="panel-body" style="display:flex; flex-direction:column; gap:16px;">
          <div class="metrics-grid" style="margin-bottom:0;">
            <div class="metric-box">
              <div class="metric-label">Scaled Exam Score</div>
              <div class="metric-value" style="color:${rep.passed ? "var(--success)" : "var(--danger)"};">${rep.scaledScore} / 1000</div>
              <div class="metric-foot">Raw: ${rep.totalRight} / ${rep.totalQuestions} (${rep.overallPct}%)</div>
            </div>
            <div class="metric-box">
              <div class="metric-label">Pacing &amp; Total Time</div>
              <div class="metric-value">${Math.floor(rep.timeSpentSecs / 60)}m ${rep.timeSpentSecs % 60}s</div>
              <div class="metric-foot">Avg ${Math.round(rep.timeSpentSecs / Math.max(1, rep.totalQuestions))}s / question (Target ≤ 90s)</div>
            </div>
            <div class="metric-box">
              <div class="metric-label">Open-Book MS Learn Time</div>
              <div class="metric-value">${rep.msLearnSeconds}s</div>
              <div class="metric-foot">${rep.msLearnSeconds <= 180 ? "Disciplined lookup budget" : "Watch open-book clock drain!"}</div>
            </div>
            <div class="metric-box">
              <div class="metric-label">Domain Breakdown</div>
              <div class="mono" style="font-size:12px; margin-top:6px; line-height:1.5;">
                ID: <strong>${rep.domPcts.identity}%</strong> • Comp: <strong>${rep.domPcts.compute}%</strong> • Net: <strong>${rep.domPcts.networking}%</strong><br/>
                Stor: <strong>${rep.domPcts.storage}%</strong> • Mon: <strong>${rep.domPcts.monitor}%</strong>
              </div>
            </div>
          </div>

          <div style="font-size:13.5px; font-weight:700; padding-top:8px;">Question-by-Question Post-Mortem Review</div>
          <div style="display:flex; flex-direction:column; gap:12px;">
            ${examSim.questions.map((q, idx) => {
              const userAns = examSim.answers[idx];
              const ok = userAns === q.answer;
              return `
                <div style="padding:14px 16px; background:var(--bg-canvas); border:1px solid ${ok ? "var(--border-subtle)" : "var(--danger)"}; border-radius:var(--radius-md); display:flex; flex-direction:column; gap:8px;">
                  <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <span class="mono" style="font-size:12px; font-weight:700;">Q${idx + 1} • ${q.format} • ${q.domain.toUpperCase()}</span>
                    <span class="badge ${ok ? "badge-success" : "badge-danger"}">${ok ? "✓ Correct" : "✕ Missed (Queued in Box 1)"}</span>
                  </div>
                  <div style="font-size:13.5px; font-weight:600; white-space:pre-line;">${escapeHtml(q.stem)}</div>
                  <div style="font-size:12.5px; color:var(--text-secondary);">
                    Your Answer: <strong style="color:${ok ? "var(--success)" : "var(--danger)"};">${userAns !== undefined ? escapeHtml(q.options[userAns]) : "Unanswered"}</strong>
                    ${!ok ? `<br/>Correct Answer: <strong style="color:var(--success);">${escapeHtml(q.options[q.answer])}</strong>` : ""}
                  </div>
                  <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; font-size:12.5px; padding-top:6px; border-top:1px solid var(--border-subtle);">
                    <span>${q.why}</span>
                    <a href="${q.url}" target="_blank" rel="noopener" style="font-weight:600;">↗ MS Learn Proof</a>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </div>
    `;

    root.querySelector("#es-back-lobby").addEventListener("click", () => {
      examSim.status = "lobby";
      renderExamSim();
    });
    root.querySelector("#es-go-leitner").addEventListener("click", () => {
      state.pracSub = "speedrun";
      srMode = "review";
      switchView("practice");
    });
  }

  // ---------------------------------------------------------------------------
  // VIEW 5: INTERACTIVE DECISION MATRICES & ACTIVE-RECALL FLASH CELLS
  // ---------------------------------------------------------------------------
  const toggleRecallBtn = document.getElementById("btn-toggle-matrix-recall");
  const resetRevealsBtn = document.getElementById("btn-reset-matrix-reveals");

  if (toggleRecallBtn) {
    toggleRecallBtn.addEventListener("click", () => {
      state.matrixRecallMode = !state.matrixRecallMode;
      saveState();
      renderMatricesView();
    });
  }

  if (resetRevealsBtn) {
    resetRevealsBtn.addEventListener("click", () => {
      state.revealedMatrixCells = {};
      state.matrixRecallMode = true;
      saveState();
      renderMatricesView();
    });
  }

  function formatMatrixCellHtml(rawText, cellKeyPrefix) {
    let tokenIdx = 0;
    return escapeHtml(rawText).replace(/\[\[([^\]]+)\]\]/g, (_, inner) => {
      const key = `${cellKeyPrefix}_${tokenIdx++}`;
      if (!state.matrixRecallMode) {
        return `<strong style="color:var(--text-primary);">${inner}</strong>`;
      }
      if (state.revealedMatrixCells && state.revealedMatrixCells[key]) {
        return `<span class="recall-revealed">${inner}</span>`;
      }
      return `<button data-reveal-cell="${key}" class="recall-blank" title="Click to test your recall and reveal">? Click to Recall</button>`;
    });
  }

  function renderMatricesView() {
    const filtersEl = document.getElementById("matrix-filters");
    const root = document.getElementById("matrices-root");
    if (!root || !filtersEl) return;

    if (toggleRecallBtn) {
      toggleRecallBtn.textContent = state.matrixRecallMode
        ? "Active Recall Mode: ON (Click Blank Cells to Reveal)"
        : "Active Recall Mode: OFF (Showing All Answers)";
      toggleRecallBtn.classList.toggle("btn-primary", !!state.matrixRecallMode);
    }

    const filterOpts = [
      { id: "all", label: `All 8 Decision Matrices` },
      { id: "identity", label: "Identity & Gov" },
      { id: "storage", label: "Storage" },
      { id: "compute", label: "Compute" },
      { id: "networking", label: "Networking" },
      { id: "monitor", label: "Monitor & Backup" }
    ];
    filtersEl.innerHTML = filterOpts.map(f => `
      <button data-mf="${f.id}" class="btn btn-sm ${state.matrixFilter === f.id ? "btn-primary" : ""}">${f.label}</button>
    `).join("");

    filtersEl.querySelectorAll("[data-mf]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.matrixFilter = btn.dataset.mf;
        saveState();
        renderMatricesView();
      });
    });

    const visible = DECISION_MATRICES.filter(m => state.matrixFilter === "all" || m.domain === state.matrixFilter);

    root.innerHTML = visible.map(m => `
      <div class="panel">
        <div class="panel-header">
          <div>
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
              <span class="badge">${m.domainLabel}</span>
            </div>
            <h2 class="panel-title">${escapeHtml(m.title)}</h2>
            <div class="panel-sub">${escapeHtml(m.subtitle)}</div>
          </div>
        </div>
        <div class="matrix-table-wrap">
          <table class="matrix-table">
            <thead>
              <tr>
                ${m.headers.map(h => `<th>${escapeHtml(h)}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${m.rows.map((row, ri) => `
                <tr>
                  ${row.map((cell, ci) => `
                    <td style="${ci === 0 ? "font-weight:650; white-space:nowrap;" : ""}">
                      ${formatMatrixCellHtml(cell, `${m.id}_${ri}_${ci}`)}
                    </td>
                  `).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `).join("");

    root.querySelectorAll("[data-reveal-cell]").forEach(btn => {
      btn.addEventListener("click", () => {
        if (!state.revealedMatrixCells) state.revealedMatrixCells = {};
        state.revealedMatrixCells[btn.dataset.revealCell] = true;
        recordStudyActivity();
        saveState();
        renderMatricesView();
      });
    });
  }

  // ---------------------------------------------------------------------------
  // VIEW 6: OFFICIAL MICROSOFT LEARN STUDY GUIDE BLUEPRINT (81/81)
  // ---------------------------------------------------------------------------
  let bpFilter = "all", bpQuery = "";

  function renderBlueprint() {
    const filtersEl = document.getElementById("bp-filters");
    const listEl = document.getElementById("bp-list");
    if (!state.blueprintChecked) state.blueprintChecked = {};
    if (!state.blueprintManualUncheck) state.blueprintManualUncheck = {};

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
          const st = window.AZ104_GUIDES.getObjectiveStatus(key, state);
          const checked = st.done;
          const entry = st.entry;
          const msLab = entry && entry.msLab;
          return `
            <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:10px; padding:9px 12px; border-radius:var(--radius-sm);" class="sprint-item">
              <label style="display:flex; align-items:flex-start; gap:10px; font-size:13.5px; cursor:pointer; flex:1; min-width:220px;">
                <input type="checkbox" data-bp-key="${key}" ${checked ? "checked" : ""} class="checkbox" />
                <div>
                  <span style="${checked ? "text-decoration:line-through; color:var(--text-tertiary);" : ""}">${text}</span>
                  ${st.source && st.source.startsWith("Auto-checked") ? `<span class="badge badge-success" style="margin-left:8px;">✓ ${st.source}</span>` : ""}
                </div>
              </label>
              <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                ${msLab ? `<a href="${msLab.url}" target="_blank" rel="noopener" class="badge badge-accent mono" title="${escapeHtml(msLab.title)}">↗ MS ${msLab.code}</a>` : ""}
                <button data-bp-jump="${entry ? entry.primarySprint : "w1d1"}" data-bp-week="${entry ? entry.weekNum : 1}" class="btn btn-sm mono" title="Open step-by-step lab guide for ${sprint}">
                  Open Lab (${sprint}) →
                </button>
              </div>
            </div>
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
        const key = cb.dataset.bpKey;
        if (cb.checked) {
          state.blueprintChecked[key] = true;
          delete state.blueprintManualUncheck[key];
          recordStudyActivity();
        } else {
          state.blueprintChecked[key] = false;
          state.blueprintManualUncheck[key] = true;
        }
        saveState();
        renderBlueprint();
        renderOverview();
      });
    });

    listEl.querySelectorAll("[data-bp-jump]").forEach(btn => {
      btn.addEventListener("click", () => {
        const sprintId = btn.dataset.bpJump;
        const wk = Number(btn.dataset.bpWeek) || 1;
        state.planSub = "steady";
        state.openWeeks[wk] = true;
        state.openGuides[sprintId] = true;
        switchView("plan");
        setTimeout(() => {
          const row = document.getElementById("sprint-row-" + sprintId);
          if (row) row.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 60);
      });
    });
  }

  document.getElementById("bp-search").addEventListener("input", e => { bpQuery = e.target.value; renderBlueprint(); });

  // ---------------------------------------------------------------------------
  // 5-MINUTE QUICK DRILL (prioritizes Leitner Box 1 + Weakest Domain!)
  // ---------------------------------------------------------------------------
  const rescueModal = document.getElementById("rescue-modal");
  const rescueBody = document.getElementById("rescue-body");
  let rescueStep = 1, rescueCard = null, rescueTicket = null, rescueAnswered = false;

  document.getElementById("btn-rescue").addEventListener("click", () => {
    const report = window.AZ104_READINESS.compute(state);
    const weakDom = report.weakest.id;
    const dueLeitner = getDueLeitnerQueue();
    if (dueLeitner.length > 0) {
      rescueCard = lookupReviewableItem(dueLeitner[0].id);
    }
    if (!rescueCard) {
      const domCards = SPEEDRUN_CARDS.filter(c => c.domain === weakDom);
      rescueCard = domCards[Math.floor(Math.random() * domCards.length)] || SPEEDRUN_CARDS[0];
    }
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
        <div style="font-size:11.5px; font-weight:700; text-transform:uppercase; color:var(--text-secondary);">Step 1 of 2 • Priority Domain / Leitner Trap (${rescueCard.domain})</div>
        <div style="font-size:15.5px; font-weight:650; white-space:pre-line;">${escapeHtml(rescueCard.prompt)}</div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${rescueCard.choices.map((c, i) => `<button data-r1="${i}" class="option-btn">${c}</button>`).join("")}
        </div>
        <div id="r1-fb"></div>
      `;
      rescueBody.querySelectorAll("[data-r1]").forEach(btn => {
        btn.addEventListener("click", () => {
          const ok = Number(btn.dataset.r1) === rescueCard.answer;
          trackDomainResult(rescueCard.domain, ok, rescueCard.id, true);
          rescueBody.querySelector("#r1-fb").innerHTML = `
            <div style="padding:12px; background:var(--bg-canvas); border:1px solid var(--border-subtle); border-radius:var(--radius-md); display:flex; flex-direction:column; gap:8px;">
              <div style="font-weight:700; color:${ok ? "var(--success)" : "var(--warning)"};">${ok ? "Correct" : "Key Rule (Queued in Leitner Box 1)"}</div>
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
          trackDomainResult(rescueTicket.domain, ok, rescueTicket.id, true);
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
    renderExamSim();
    renderMatricesView();
    renderBlueprint();
  }

  renderAll();
})();
