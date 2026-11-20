// =============================================================================
// AZ-104 OPS QUEST — MAIN APPLICATION ENGINE
// Streak + 5-Min Rescue • Spaced Repetition • Export/Import • All 7 Tabs
// =============================================================================

(function () {
  const { NODES, EDGES, DOMAINS, WEEKS, MS_BLUEPRINT } = window.AZ104_CORE;
  const { TICKETS, BUG_HUNTS, SPEEDRUN_CARDS, CASE_STUDIES, SCAVENGER_HUNTS } = window.AZ104_DRILLS;

  const STORAGE_KEY = "az104_northstar_quest_v3";
  let state = {
    selectedNode: "compute",
    checked: {},
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
    bestSpeedRun: 0,
    missedTraps: {},        // { srId: count } — spaced repetition queue!
    domainStats: {},        // { identity: { right: 0, wrong: 0 }, ... }
    blueprintChecked: {},
    studyDates: [],         // ["YYYY-MM-DD", ...]
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
  // STREAK, XP & RANK ENGINE
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
    // Walk backwards up to 365 days; weekends don't break streak, but count if studied!
    for (let i = 0; i < 365; i++) {
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const dow = d.getDay(); // 0=Sun, 6=Sat
      if (set.has(k)) {
        streak++;
      } else if (i === 0 || dow === 0 || dow === 6) {
        // Today not logged yet or weekend — don't break streak
      } else {
        break;
      }
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }

  const RANKS = [
    { min: 0, name: "Rank 1: Day-One Intern" },
    { min: 250, name: "Rank 2: Junior Cloud Admin" },
    { min: 700, name: "Rank 3: Northstar Ops Engineer" },
    { min: 1400, name: "Rank 4: Senior Azure SRE" },
    { min: 2200, name: "Rank 5: AZ-104 Exam Boss" }
  ];

  function updateHUD() {
    const sprintDone = Object.values(state.checked || {}).filter(Boolean).length;
    const ticketsDone = Object.values(state.solvedTickets || {}).filter(Boolean).length;
    const bugsDone = Object.values(state.solvedBugHunts || {}).filter(Boolean).length;
    const caseDone = Object.values(state.solvedCaseQ || {}).filter(Boolean).length;
    const huntsDone = Object.values(state.solvedHunts || {}).filter(Boolean).length;
    const xp =
      sprintDone * 25 +
      ticketsDone * 50 +
      bugsDone * 60 +
      caseDone * 40 +
      huntsDone * 30 +
      (state.bestSpeedRun || 0) * 15 +
      (state.rescueCount || 0) * 40;

    let currentRank = RANKS[0], nextRank = RANKS[1];
    for (let i = 0; i < RANKS.length; i++) {
      if (xp >= RANKS[i].min) { currentRank = RANKS[i]; nextRank = RANKS[i + 1] || null; }
    }

    document.getElementById("xp-display").textContent = xp;
    document.getElementById("total-done").textContent = sprintDone;
    document.getElementById("rank-pill").textContent = currentRank.name;
    document.getElementById("streak-display").textContent = `${calcWeekdayStreak()}d 🔥`;
    document.getElementById("best-badge").textContent = `Best: ${state.bestSpeedRun || 0}`;
    document.getElementById("incident-badge").textContent = `${ticketsDone}/${TICKETS.length}`;

    const missedCount = Object.keys(state.missedTraps || {}).length;
    const missedBadge = document.getElementById("missed-badge");
    if (missedBadge) {
      missedBadge.textContent = missedCount > 0 ? `${missedCount} to review` : "0 missed";
    }

    if (nextRank) {
      const pct = Math.min(100, Math.round(((xp - currentRank.min) / (nextRank.min - currentRank.min)) * 100));
      document.getElementById("xp-bar").style.width = `${pct}%`;
      document.getElementById("next-rank-label").textContent = `Next: ${nextRank.name.split(": ")[1]} (${nextRank.min} XP)`;
    } else {
      document.getElementById("xp-bar").style.width = "100%";
      document.getElementById("next-rank-label").textContent = "Max Rank Unlocked — Ready for AZ-104!";
    }
  }

  // ---------------------------------------------------------------------------
  // THEME TOGGLE + EXPORT / IMPORT PROGRESS
  // ---------------------------------------------------------------------------
  const themeBtn = document.getElementById("theme-toggle");
  function applyTheme(mode) {
    document.documentElement.classList.toggle("light", mode === "light");
    themeBtn.textContent = mode === "light" ? "🌙 Dark" : "☀ Light";
    try { localStorage.setItem("az104_theme", mode); } catch (_) {}
  }
  applyTheme(localStorage.getItem("az104_theme") || "dark");
  themeBtn.addEventListener("click", () => {
    applyTheme(document.documentElement.classList.contains("light") ? "dark" : "light");
  });

  document.getElementById("btn-export").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `az104-ops-quest-progress-${todayKey()}.json`;
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
          alert("Progress imported successfully!");
        }
      } catch (_) {
        alert("Could not parse that JSON file.");
      }
    };
    reader.readAsText(file);
    importInput.value = "";
  });

  // ---------------------------------------------------------------------------
  // 5-MINUTE LOW-ENERGY RESCUE MODAL
  // ---------------------------------------------------------------------------
  const rescueModal = document.getElementById("rescue-modal");
  const rescueBody = document.getElementById("rescue-body");
  let rescueStep = 1;
  let rescueCard = null;
  let rescueTicket = null;
  let rescueAnswered = false;

  document.getElementById("btn-rescue").addEventListener("click", () => {
    const missedIds = Object.keys(state.missedTraps || {});
    rescueCard = missedIds.length
      ? (SPEEDRUN_CARDS.find(c => c.id === missedIds[0]) || SPEEDRUN_CARDS[0])
      : SPEEDRUN_CARDS[Math.floor(Math.random() * SPEEDRUN_CARDS.length)];
    const unsolvedTickets = TICKETS.filter(t => !state.solvedTickets[t.id]);
    rescueTicket = unsolvedTickets.length
      ? unsolvedTickets[Math.floor(Math.random() * unsolvedTickets.length)]
      : TICKETS[Math.floor(Math.random() * TICKETS.length)];
    rescueStep = 1;
    rescueAnswered = false;
    rescueModal.classList.remove("hidden");
    renderRescue();
  });

  document.getElementById("rescue-close").addEventListener("click", () => {
    rescueModal.classList.add("hidden");
  });

  function renderRescue() {
    if (rescueStep === 1) {
      rescueBody.innerHTML = `
        <div class="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Step 1 of 2 • Quick Exam Trap</div>
        <div class="text-base font-bold">${rescueCard.prompt}</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          ${rescueCard.choices.map((c, i) => `
            <button data-r1="${i}" class="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] text-left text-sm font-semibold cursor-pointer">${c}</button>
          `).join("")}
        </div>
        <div id="r1-fb"></div>
      `;
      rescueBody.querySelectorAll("[data-r1]").forEach(btn => {
        btn.addEventListener("click", () => {
          const ok = Number(btn.dataset.r1) === rescueCard.answer;
          trackDomainResult(rescueCard.domain, ok, rescueCard.id);
          rescueBody.querySelector("#r1-fb").innerHTML = `
            <div class="bg-[var(--content)] border border-[var(--card-border)] rounded-xl p-3.5 space-y-2 text-xs">
              <div class="font-bold" style="color:${ok ? "var(--success)" : "var(--warning)"}">${ok ? "✓ Nailed it!" : "Good catch to review!"}</div>
              <p>${rescueCard.why}</p>
              <button id="r-next" class="px-4 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold cursor-pointer">Next: Step 2 of 2 →</button>
            </div>
          `;
          rescueBody.querySelector("#r-next").addEventListener("click", () => { rescueStep = 2; renderRescue(); });
        });
      });
    } else if (rescueStep === 2) {
      rescueBody.innerHTML = `
        <div class="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Step 2 of 2 • Quick P1 Ticket (${rescueTicket.code})</div>
        <div class="bg-[var(--content)] border border-[var(--card-border)] rounded-xl p-3.5 space-y-1">
          <div class="text-sm font-bold">${rescueTicket.title}</div>
          <p class="text-xs text-[var(--muted-foreground)] leading-relaxed">${rescueTicket.symptom}</p>
        </div>
        <div class="text-sm font-semibold">${rescueTicket.question}</div>
        <div class="space-y-2">
          ${rescueTicket.options.map((o, i) => `
            <button data-r2="${i}" class="w-full text-left p-3 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] text-xs sm:text-sm cursor-pointer">${String.fromCharCode(65 + i)}. ${o}</button>
          `).join("")}
        </div>
        <div id="r2-fb"></div>
      `;
      rescueBody.querySelectorAll("[data-r2]").forEach(btn => {
        btn.addEventListener("click", () => {
          const ok = Number(btn.dataset.r2) === rescueTicket.answer;
          if (ok) state.solvedTickets[rescueTicket.id] = true;
          if (!rescueAnswered) {
            rescueAnswered = true;
            state.rescueCount = (state.rescueCount || 0) + 1;
            recordStudyActivity();
            saveState();
            updateHUD();
            renderIncidents();
          }
          rescueBody.querySelector("#r2-fb").innerHTML = `
            <div class="bg-[var(--content)] border border-[var(--card-border)] rounded-xl p-3.5 space-y-2 text-xs">
              <div class="font-bold" style="color:${ok ? "var(--success)" : "var(--warning)"}">${ok ? "✓ Rescue Complete! Streak Saved (+40 XP)!" : "Streak Saved (+40 XP)! Here's the fix:"}</div>
              <p>${rescueTicket.explanation}</p>
              <button id="r-done" class="px-4 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold cursor-pointer">Done for Today 🔥</button>
            </div>
          `;
          rescueBody.querySelector("#r-done").addEventListener("click", () => rescueModal.classList.add("hidden"));
        });
      });
    }
  }

  // ---------------------------------------------------------------------------
  // TAB NAVIGATION
  // ---------------------------------------------------------------------------
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => {
        b.classList.toggle("tab-active", b === btn);
        b.classList.toggle("tab-inactive", b !== btn);
      });
      tabPanels.forEach(p => p.classList.toggle("hidden", p.id !== "tab-" + target));
      if (target === "map") requestAnimationFrame(drawConnections);
      if (target === "simulators") window.AZ104_SIMS.render(document.getElementById("simulators-root"));
    });
  });

  // ---------------------------------------------------------------------------
  // TAB 1: ARCHITECTURE MAP
  // ---------------------------------------------------------------------------
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
    const connBadges = node.connectsTo.map(cid => `
      <button data-jump="${cid}" class="px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:opacity-90 cursor-pointer">
        ↔ ${NODES[cid].title.split(":")[0].split(",")[0]}
      </button>
    `).join("");

    inspector.innerHTML = `
      <div class="space-y-1.5 border-b border-[var(--card-border)] pb-3">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <span class="text-xs font-bold uppercase tracking-wide" style="color: var(${node.colorVar});">${node.domain}</span>
          <span class="text-xs px-2 py-0.5 rounded bg-[var(--secondary)] text-[var(--secondary-foreground)] font-medium">${node.week}</span>
        </div>
        <h3 class="text-lg font-bold">${node.title}</h3>
        <p class="text-sm text-[var(--muted-foreground)]">${node.role}</p>
        <a href="${node.msUrl}" target="_blank" rel="noopener" class="inline-block text-xs font-semibold text-[var(--link)] hover:underline pt-0.5">↗ ${node.msLabel}</a>
      </div>
      <div class="space-y-2">
        <div class="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">How It Connects to Other Domains</div>
        <ul class="space-y-2 text-sm">
          ${node.whyItConnects.map(line => `
            <li class="flex items-start gap-2">
              <span class="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style="background: var(${node.colorVar});"></span>
              <span>${line}</span>
            </li>
          `).join("")}
        </ul>
      </div>
      <div class="space-y-1.5">
        <div class="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Jump to Connected Pieces</div>
        <div class="flex flex-wrap gap-1.5">${connBadges}</div>
      </div>
      <div class="space-y-1.5">
        <div class="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Hands-On CLI / Bicep Preview</div>
        <pre class="bg-[var(--content)] border border-[var(--card-border)] rounded-lg p-3 text-xs font-mono overflow-x-auto text-[var(--code-foreground)]">${node.snippet}</pre>
      </div>
      <div class="bg-[var(--content)] border border-[var(--card-border)] rounded-lg p-3 space-y-1">
        <div class="text-xs font-bold" style="color: var(--warning);">Classic AZ-104 Exam Trap</div>
        <p class="text-xs text-[var(--foreground)] leading-relaxed">${node.examTrap}</p>
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
      paths += `<line class="conn-line" x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${active ? "var(--primary)" : "var(--border)"}" stroke-width="${active ? 2.5 : 1}" stroke-opacity="${active ? 0.85 : 0.35}" ${active ? "" : 'stroke-dasharray="4 4"'} />`;
    });
    svg.innerHTML = paths;
  }

  document.querySelectorAll("[data-node]").forEach(el => {
    el.addEventListener("click", () => { state.selectedNode = el.dataset.node; saveState(); renderMapSelection(); });
  });
  window.addEventListener("resize", drawConnections);

  // ---------------------------------------------------------------------------
  // TAB 2: 8-WEEK EPISODES
  // ---------------------------------------------------------------------------
  function renderSprints() {
    const container = document.getElementById("weeks-container");
    const domainBars = document.getElementById("domain-bars");

    const domainTotals = {}, domainDone = {};
    DOMAINS.forEach(d => { domainTotals[d.id] = 0; domainDone[d.id] = 0; });
    WEEKS.forEach(w => {
      w.sprints.forEach(s => {
        domainTotals[w.domain] = (domainTotals[w.domain] || 0) + 1;
        if (state.checked[s.id]) domainDone[w.domain] = (domainDone[w.domain] || 0) + 1;
      });
    });

    domainBars.innerHTML = DOMAINS.map(d => {
      const tot = domainTotals[d.id] || 1, done = domainDone[d.id] || 0;
      const pct = Math.round((done / tot) * 100);
      return `
        <div class="bg-[var(--content)] border border-[var(--card-border)] rounded-lg p-3 space-y-1.5">
          <div class="flex items-center justify-between text-xs"><span class="font-semibold">${d.label}</span><span class="font-mono text-[var(--muted-foreground)]">${d.weight}</span></div>
          <div class="w-full h-2 rounded-full bg-[var(--secondary)] overflow-hidden"><div class="h-full rounded-full transition-all" style="width:${pct}%; background:${d.color};"></div></div>
          <div class="text-xs text-[var(--muted-foreground)] font-mono">${done}/${tot} sprints</div>
        </div>
      `;
    }).join("");

    container.innerHTML = WEEKS.map(w => {
      const doneInWeek = w.sprints.filter(s => state.checked[s.id]).length;
      const isOpen = !!state.openWeeks[w.num];
      return `
        <div class="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <button data-week-toggle="${w.num}" class="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-[var(--content)] transition-colors">
            <div class="flex items-center gap-3 min-w-0">
              <span class="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 bg-[var(--secondary)] text-[var(--secondary-foreground)]">W${w.num}</span>
              <div class="min-w-0">
                <div class="text-sm font-bold truncate">${w.title}</div>
                <div class="text-xs text-[var(--muted-foreground)] truncate">${w.msPathTitle} • ${w.weight} • <span class="font-mono">${w.labFolder}</span></div>
              </div>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <span class="text-xs font-mono font-bold ${doneInWeek === 5 ? "text-[var(--success)]" : "text-[var(--muted-foreground)]"}">${doneInWeek}/5</span>
              <span class="text-xs text-[var(--muted-foreground)]">${isOpen ? "▲" : "▼"}</span>
            </div>
          </button>
          <div class="${isOpen ? "" : "hidden"} border-t border-[var(--card-border)]">
            <div class="px-4 py-3 bg-[var(--content)] border-b border-[var(--card-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p class="text-xs text-[var(--foreground)] leading-relaxed">${w.story}</p>
              <a href="${w.msPathUrl}" target="_blank" rel="noopener" class="text-xs font-semibold text-[var(--link)] hover:underline shrink-0">↗ Official MS Path</a>
            </div>
            <div class="divide-y divide-[var(--card-border)]">
              ${w.sprints.map(s => {
                const isChecked = !!state.checked[s.id];
                return `
                  <label class="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--content)] transition-colors">
                    <input type="checkbox" data-sprint="${s.id}" ${isChecked ? "checked" : ""} class="mt-1 w-4 h-4 accent-[var(--primary)] cursor-pointer shrink-0" />
                    <div class="space-y-0.5 text-sm">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-mono text-xs font-bold text-[var(--muted-foreground)]">${s.day}</span>
                        <span class="text-xs font-semibold px-2 py-0.5 rounded bg-[var(--secondary)] text-[var(--secondary-foreground)]">${s.tag}</span>
                      </div>
                      <p class="${isChecked ? "line-through text-[var(--muted-foreground)]" : "text-[var(--foreground)]"} text-xs sm:text-sm leading-relaxed">${s.text}</p>
                    </div>
                  </label>
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
        renderSprints();
      });
    });

    container.querySelectorAll("[data-sprint]").forEach(cb => {
      cb.addEventListener("change", () => {
        state.checked[cb.dataset.sprint] = cb.checked;
        if (cb.checked) recordStudyActivity();
        saveState();
        renderSprints();
        updateHUD();
      });
    });
  }

  document.getElementById("reset-progress").addEventListener("click", () => {
    if (!confirm("Reset sprint checkboxes?")) return;
    state.checked = {};
    saveState();
    renderSprints();
    updateHUD();
  });

  // ---------------------------------------------------------------------------
  // TAB 4: P1 INCIDENTS (20) + SPOT THE 2 BUGS SABOTAGE HUNTS (8)
  // ---------------------------------------------------------------------------
  let drillsSubTab = "tickets";
  let selectedOptionForCurrent = null;
  let bugPicks = new Set();

  function renderDrillsTab() {
    document.querySelectorAll("[data-drill-sub]").forEach(b => {
      const on = b.dataset.drillSub === drillsSubTab;
      b.classList.toggle("bg-[var(--primary)]", on);
      b.classList.toggle("text-[var(--primary-foreground)]", on);
      b.classList.toggle("bg-[var(--content)]", !on);
      b.classList.toggle("text-[var(--foreground)]", !on);
    });
    document.getElementById("sub-tickets").classList.toggle("hidden", drillsSubTab !== "tickets");
    document.getElementById("sub-bughunts").classList.toggle("hidden", drillsSubTab !== "bughunts");
    if (drillsSubTab === "tickets") renderIncidents();
    else renderBugHunts();
  }

  document.querySelectorAll("[data-drill-sub]").forEach(b => {
    b.addEventListener("click", () => { drillsSubTab = b.dataset.drillSub; renderDrillsTab(); });
  });

  function renderIncidents() {
    const filtersEl = document.getElementById("ticket-filters");
    const pills = document.getElementById("ticket-pills");
    const view = document.getElementById("ticket-view");
    const solvedCount = Object.values(state.solvedTickets).filter(Boolean).length;
    document.getElementById("inc-score").textContent = `${solvedCount} / ${TICKETS.length}`;

    const filterOpts = [
      { id: "all", label: `All (${TICKETS.length})` },
      { id: "unsolved", label: `Unsolved (${TICKETS.length - solvedCount})` },
      { id: "identity", label: "Identity" },
      { id: "networking", label: "Networking" },
      { id: "storage", label: "Storage" },
      { id: "compute", label: "Compute" },
      { id: "monitor", label: "Monitor" }
    ];
    filtersEl.innerHTML = filterOpts.map(f => `
      <button data-tf="${f.id}" class="px-2.5 py-1 rounded-md text-xs font-semibold border cursor-pointer ${
        state.ticketFilter === f.id
          ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
          : "bg-[var(--content)] text-[var(--foreground)] border-[var(--card-border)]"
      }">${f.label}</button>
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
      return `
        <button data-ticket="${t.id}" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
          active
            ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
            : "bg-[var(--content)] text-[var(--foreground)] border-[var(--card-border)] hover:bg-[var(--secondary)]"
        }">${solved ? "✓ " : ""}${t.code}</button>
      `;
    }).join("") : `<div class="text-xs text-[var(--success)] font-semibold">All tickets in this filter solved! 🎉</div>`;

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
      <div class="bg-[var(--content)] border border-[var(--card-border)] rounded-xl p-4 space-y-2">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="px-2 py-0.5 rounded text-xs font-mono font-bold" style="background: var(--error); color: var(--primary-foreground);">${t.severity}</span>
          <span class="text-xs font-mono text-[var(--muted-foreground)]">${t.code}</span>
          <span class="text-xs font-semibold text-[var(--muted-foreground)]">• ${t.domainLabel}</span>
        </div>
        <h3 class="text-base font-bold">${t.title}</h3>
        <p class="text-sm text-[var(--foreground)] leading-relaxed">${t.symptom}</p>
      </div>
      <div class="space-y-2">
        <div class="text-sm font-semibold">${t.question}</div>
        <div class="space-y-2">
          ${t.options.map((opt, idx) => {
            let borderStyle = "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--content)]";
            let tag = "";
            if (chosen !== null) {
              if (idx === t.answer) {
                borderStyle = "border-[var(--success)] bg-[var(--content)]";
                tag = `<span class="text-xs font-bold shrink-0" style="color: var(--success);">Correct (+50 XP)</span>`;
              } else if (idx === chosen && idx !== t.answer) {
                borderStyle = "border-[var(--error)] bg-[var(--content)]";
                tag = `<span class="text-xs font-bold shrink-0" style="color: var(--error);">Not quite</span>`;
              }
            }
            return `
              <button data-opt="${idx}" class="w-full text-left p-3.5 rounded-lg border ${borderStyle} flex items-start justify-between gap-3 cursor-pointer transition-colors">
                <span class="text-sm leading-relaxed"><span class="font-mono font-bold mr-2 text-[var(--muted-foreground)]">${String.fromCharCode(65 + idx)}.</span>${opt}</span>
                ${tag}
              </button>
            `;
          }).join("")}
        </div>
      </div>
      ${chosen !== null ? `
        <div class="bg-[var(--content)] border border-[var(--card-border)] rounded-xl p-4 space-y-2">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="text-xs font-bold uppercase tracking-wider" style="color: ${chosen === t.answer ? "var(--success)" : "var(--warning)"};">
              ${chosen === t.answer ? "Incident Resolved — Why Everything Connects" : "Post-Mortem Breakdown"}
            </div>
            <a href="${t.msUrl}" target="_blank" rel="noopener" class="text-xs font-semibold text-[var(--link)] hover:underline">↗ Verify in Official MS Docs</a>
          </div>
          <p class="text-sm leading-relaxed">${t.explanation}</p>
        </div>
      ` : ""}
    `;

    view.querySelectorAll("[data-opt]").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.opt);
        selectedOptionForCurrent = idx;
        const ok = idx === t.answer;
        trackDomainResult(t.domain, ok, null);
        if (ok) {
          state.solvedTickets[t.id] = true;
          recordStudyActivity();
        }
        saveState();
        updateHUD();
        renderIncidents();
      });
    });
  }

  function renderBugHunts() {
    const pills = document.getElementById("bh-pills");
    const view = document.getElementById("bh-view");
    const solvedCount = Object.values(state.solvedBugHunts || {}).filter(Boolean).length;
    document.getElementById("bh-score").textContent = `${solvedCount} / ${BUG_HUNTS.length}`;

    pills.innerHTML = BUG_HUNTS.map((b, i) => {
      const active = b.id === state.activeBugHunt;
      const solved = !!state.solvedBugHunts[b.id];
      return `
        <button data-bh="${b.id}" class="px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
          active ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                 : "bg-[var(--content)] text-[var(--foreground)] border-[var(--card-border)]"
        }">${solved ? "✓ " : ""}#${i + 1}: ${b.domain}</button>
      `;
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
      <div class="space-y-3">
        <div>
          <h3 class="text-base font-bold">${bh.title}</h3>
          <p class="text-xs text-[var(--muted-foreground)]">${bh.prompt} (Click any 2 lines below — selected: ${already ? 2 : bugPicks.size}/2)</p>
        </div>
        <div class="bg-[var(--content)] border border-[var(--card-border)] rounded-xl p-3 font-mono text-xs space-y-1 overflow-x-auto">
          ${bh.lines.map((line, idx) => {
            const isBug = bh.bugLines.includes(idx);
            const picked = bugPicks.has(idx) || (already && isBug);
            let cls = "border-transparent hover:bg-[var(--card)]";
            if (donePicking) {
              if (isBug) cls = "border-[var(--success)] bg-[var(--card)]";
              else if (picked && !isBug) cls = "border-[var(--error)] bg-[var(--card)]";
            } else if (picked) {
              cls = "border-[var(--primary)] bg-[var(--card)]";
            }
            return `
              <button data-line="${idx}" class="w-full text-left px-2.5 py-1.5 rounded border ${cls} flex items-start gap-3 cursor-pointer transition-colors">
                <span class="text-[var(--muted-foreground)] select-none w-5 shrink-0">${idx + 1}</span>
                <span class="whitespace-pre text-[var(--code-foreground)]">${line.replace(/</g, "&lt;")}</span>
              </button>
            `;
          }).join("")}
        </div>
        ${donePicking ? `
          <div class="bg-[var(--content)] border border-[var(--card-border)] rounded-xl p-4 space-y-2">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-bold uppercase tracking-wider" style="color:${exactMatch ? "var(--success)" : "var(--warning)"}">
                ${exactMatch ? "✓ Sabotage Defused! (+60 XP)" : "Close — Here are the 2 real bugs (highlighted in green):"}
              </span>
              ${!exactMatch ? `<button id="bh-retry" class="text-xs px-2.5 py-1 rounded bg-[var(--secondary)] text-[var(--secondary-foreground)] font-semibold cursor-pointer">Try Again</button>` : ""}
            </div>
            <p class="text-sm leading-relaxed">${bh.explanation}</p>
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
            updateHUD();
          }
          renderBugHunts();
        });
      });
    }
    const retry = view.querySelector("#bh-retry");
    if (retry) retry.addEventListener("click", () => { bugPicks = new Set(); renderBugHunts(); });
  }

  // ---------------------------------------------------------------------------
  // TAB 5: 60s SPEED RUN + SPACED-REPETITION MISSED-TRAP REVIEW + WEAKNESS RADAR
  // ---------------------------------------------------------------------------
  let srMode = "arcade"; // "arcade" or "review"
  let srRunning = false;
  let srTimeLeft = 60;
  let srScore = 0;
  let srStreak = 0;
  let srDeck = [];
  let srIndex = 0;
  let srTimer = null;
  let srLastFeedback = null;

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
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
    updateHUD();
    renderWeaknessRadar();
  }

  function renderWeaknessRadar() {
    const el = document.getElementById("weakness-radar");
    if (!el) return;
    const missedIds = Object.keys(state.missedTraps || {});
    el.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        ${DOMAINS.map(d => {
          const st = (state.domainStats && state.domainStats[d.id]) || { right: 0, wrong: 0 };
          const tot = st.right + st.wrong;
          const acc = tot ? Math.round((st.right / tot) * 100) : null;
          return `
            <div class="bg-[var(--content)] border border-[var(--card-border)] rounded-lg p-2.5 space-y-1 text-xs">
              <div class="flex items-center justify-between">
                <span class="font-semibold">${d.label}</span>
                <span class="font-mono font-bold" style="color:${acc === null ? "var(--muted-foreground)" : acc >= 80 ? "var(--success)" : acc >= 60 ? "var(--warning)" : "var(--error)"}">${acc === null ? "—" : acc + "%"}</span>
              </div>
              <div class="w-full h-1.5 rounded-full bg-[var(--secondary)] overflow-hidden">
                <div class="h-full rounded-full" style="width:${acc || 0}%; background:${d.color};"></div>
              </div>
              <div class="text-[var(--muted-foreground)] font-mono">${st.right}✓ / ${st.wrong}✗</div>
            </div>
          `;
        }).join("")}
      </div>
      <div class="flex items-center justify-between flex-wrap gap-2 pt-1 text-xs">
        <span class="text-[var(--muted-foreground)]">Spaced Repetition Queue: <strong class="text-[var(--foreground)]">${missedIds.length} missed trap(s)</strong> waiting for rematch.</span>
        <div class="flex gap-2">
          <button id="sr-mode-arcade" class="px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${srMode === "arcade" ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-[var(--secondary)] text-[var(--secondary-foreground)]"}">60s Speed Run (36 Traps)</button>
          <button id="sr-mode-review" class="px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${srMode === "review" ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-[var(--secondary)] text-[var(--secondary-foreground)]"}">Review Missed Traps (${missedIds.length})</button>
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
    document.getElementById("sr-streak").textContent = `${srStreak}🔥`;
  }

  function renderSpeedRun() {
    const stage = document.getElementById("sr-stage");
    updateSRHud();

    if (srMode === "review") {
      const remaining = SPEEDRUN_CARDS.filter(c => state.missedTraps && state.missedTraps[c.id]);
      if (!remaining.length) {
        stage.innerHTML = `
          <div class="bg-[var(--content)] border border-[var(--card-border)] rounded-xl p-6 text-center space-y-2">
            <div class="text-lg font-bold" style="color:var(--success);">🎉 Missed-Trap Queue Is Clear!</div>
            <p class="text-sm text-[var(--muted-foreground)]">Every trap you miss in the 60s Speed Run automatically lands here until you defeat it.</p>
          </div>
        `;
        return;
      }
      const card = remaining[0];
      stage.innerHTML = `
        <div class="bg-[var(--content)] border border-[var(--card-border)] rounded-xl p-5 space-y-4">
          <div class="text-xs font-mono text-[var(--warning)] font-bold">SPACED-REPETITION REMATCH • ${remaining.length} LEFT</div>
          <div class="text-base sm:text-lg font-bold leading-snug">${card.prompt}</div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${card.choices.map((c, i) => `<button data-rev-pick="${i}" class="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] text-left text-sm font-semibold cursor-pointer">${c}</button>`).join("")}
          </div>
        </div>
        ${srLastFeedback ? `<div class="bg-[var(--content)] border border-[var(--card-border)] rounded-lg p-3.5 text-xs"><strong style="color:${srLastFeedback.ok ? "var(--success)" : "var(--error)"}">${srLastFeedback.ok ? "✓ Cleared from missed queue!" : "✗ Still in queue — remember:"}</strong> ${srLastFeedback.why}</div>` : ""}
      `;
      stage.querySelectorAll("[data-rev-pick]").forEach(btn => {
        btn.addEventListener("click", () => {
          const ok = Number(btn.dataset.revPick) === card.answer;
          trackDomainResult(card.domain, ok, card.id);
          if (ok) recordStudyActivity();
          srLastFeedback = { ok, why: card.why };
          renderSpeedRun();
        });
      });
      return;
    }

    if (!srRunning && srTimeLeft === 60) {
      stage.innerHTML = `
        <div class="bg-[var(--content)] border border-[var(--card-border)] rounded-xl p-6 text-center space-y-3">
          <div class="text-lg font-bold">Defuse 36 Real AZ-104 Exam Traps Against the Clock</div>
          <p class="text-sm text-[var(--muted-foreground)] max-w-lg mx-auto">Every miss is automatically saved into your Spaced-Repetition Review Queue and updates your Weakness Radar above.</p>
          <div class="text-xs font-mono text-[var(--muted-foreground)]">Personal Best: <strong>${state.bestSpeedRun || 0}</strong></div>
          <button id="sr-start-btn" class="px-5 py-2.5 rounded-lg text-sm font-bold bg-[var(--primary)] text-[var(--primary-foreground)] cursor-pointer">Start 60-Second Run</button>
        </div>
      `;
      document.getElementById("sr-start-btn").addEventListener("click", startSpeedRun);
      return;
    }

    if (!srRunning) {
      stage.innerHTML = `
        <div class="bg-[var(--content)] border border-[var(--card-border)] rounded-xl p-6 text-center space-y-3">
          <div class="text-xl font-bold">Time's Up! Score: ${srScore}</div>
          <p class="text-sm text-[var(--muted-foreground)]">Personal Best: <strong>${state.bestSpeedRun || 0}</strong> • Any missed traps are waiting in your Spaced-Repetition Review Queue!</p>
          <button id="sr-restart-btn" class="px-5 py-2.5 rounded-lg text-sm font-bold bg-[var(--primary)] text-[var(--primary-foreground)] cursor-pointer">Play Again (Shuffle)</button>
        </div>
      `;
      document.getElementById("sr-restart-btn").addEventListener("click", startSpeedRun);
      return;
    }

    const card = srDeck[srIndex % srDeck.length];
    stage.innerHTML = `
      <div class="bg-[var(--content)] border border-[var(--card-border)] rounded-xl p-5 space-y-4">
        <div class="text-xs font-mono text-[var(--muted-foreground)]">TRAP #${srIndex + 1} • ${card.domain.toUpperCase()}</div>
        <div class="text-base sm:text-lg font-bold leading-snug">${card.prompt}</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${card.choices.map((c, i) => `
            <button data-sr-pick="${i}" class="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] text-left text-sm font-semibold cursor-pointer">${c}</button>
          `).join("")}
        </div>
      </div>
      ${srLastFeedback ? `
        <div class="bg-[var(--content)] border border-[var(--card-border)] rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div><span class="font-bold mr-1.5" style="color:${srLastFeedback.ok ? "var(--success)" : "var(--error)"}">${srLastFeedback.ok ? "✓ Nailed it!" : "✗ Added to Missed Queue!"}</span>${srLastFeedback.why}</div>
          <a href="${srLastFeedback.url}" target="_blank" rel="noopener" class="font-semibold text-[var(--link)] hover:underline shrink-0">↗ MS Docs</a>
        </div>
      ` : ""}
    `;

    stage.querySelectorAll("[data-sr-pick]").forEach(btn => {
      btn.addEventListener("click", () => {
        const ok = Number(btn.dataset.srPick) === card.answer;
        trackDomainResult(card.domain, ok, card.id);
        if (ok) {
          srScore++; srStreak++;
          if (srScore > (state.bestSpeedRun || 0)) { state.bestSpeedRun = srScore; saveState(); updateHUD(); }
        } else { srStreak = 0; }
        srLastFeedback = { ok, why: card.why, url: card.url };
        srIndex++;
        if (srIndex % srDeck.length === 0) srDeck = shuffle(SPEEDRUN_CARDS);
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
        updateHUD();
        renderSpeedRun();
      }
    }, 1000);
  }

  // ---------------------------------------------------------------------------
  // TAB 6: EXAM LAB (2 MULTI-TAB CASE STUDIES + 10 OPEN-BOOK 45s SCAVENGER HUNTS)
  // ---------------------------------------------------------------------------
  let examSubTab = "casestudies";
  let huntIdx = 0;
  let huntTimer = null;
  let huntSecs = 45;
  let huntRevealed = false;

  function renderExamLab() {
    document.querySelectorAll("[data-exam-sub]").forEach(b => {
      const on = b.dataset.examSub === examSubTab;
      b.classList.toggle("bg-[var(--primary)]", on);
      b.classList.toggle("text-[var(--primary-foreground)]", on);
      b.classList.toggle("bg-[var(--content)]", !on);
      b.classList.toggle("text-[var(--foreground)]", !on);
    });
    document.getElementById("sub-casestudies").classList.toggle("hidden", examSubTab !== "casestudies");
    document.getElementById("sub-scavenger").classList.toggle("hidden", examSubTab !== "scavenger");
    if (examSubTab === "casestudies") renderCaseStudy();
    else renderScavenger();
  }

  document.querySelectorAll("[data-exam-sub]").forEach(b => {
    b.addEventListener("click", () => { examSubTab = b.dataset.examSub; renderExamLab(); });
  });

  function renderCaseStudy() {
    const cs = CASE_STUDIES.find(c => c.id === state.activeCaseStudy) || CASE_STUDIES[0];
    const tabNames = Object.keys(cs.tabs);
    if (!tabNames.includes(state.activeCaseTab)) state.activeCaseTab = tabNames[0];

    const root = document.getElementById("cs-root");
    root.innerHTML = `
      <div class="flex flex-wrap gap-2">
        ${CASE_STUDIES.map(c => `
          <button data-cs-pick="${c.id}" class="px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
            c.id === cs.id ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                           : "bg-[var(--content)] text-[var(--foreground)] border-[var(--card-border)]"
          }">${c.title.split(":")[0]}: ${c.title.split(":")[1]}</button>
        `).join("")}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <!-- Left: Real Exam-Style Multi-Tab Brief -->
        <div class="lg:col-span-5 bg-[var(--content)] border border-[var(--card-border)] rounded-xl overflow-hidden">
          <div class="flex flex-wrap border-b border-[var(--card-border)] bg-[var(--card)]">
            ${tabNames.map(tn => `
              <button data-cs-tab="${tn}" class="px-3 py-2 text-xs font-semibold cursor-pointer border-b-2 ${
                tn === state.activeCaseTab ? "border-[var(--primary)] text-[var(--foreground)]" : "border-transparent text-[var(--muted-foreground)]"
              }">${tn}</button>
            `).join("")}
          </div>
          <div class="p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-line">${cs.tabs[state.activeCaseTab]}</div>
        </div>

        <!-- Right: Case Study Questions -->
        <div class="lg:col-span-7 space-y-3">
          ${cs.questions.map((q, qi) => {
            const ans = state.solvedCaseQ[q.id];
            const answered = ans !== undefined;
            return `
              <div class="bg-[var(--content)] border border-[var(--card-border)] rounded-xl p-4 space-y-2.5">
                <div class="flex items-center justify-between gap-2 text-xs">
                  <span class="font-mono font-bold text-[var(--muted-foreground)]">Q${qi + 1} • ${q.type}</span>
                  ${answered ? `<span class="font-bold" style="color:${ans === q.answer ? "var(--success)" : "var(--error)"}">${ans === q.answer ? "✓ Correct (+40 XP)" : "✗ Missed"}</span>` : ""}
                </div>
                <div class="text-sm font-semibold">${q.q}</div>
                <div class="space-y-1.5">
                  ${q.options.map((opt, oi) => {
                    let cls = "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]";
                    if (answered) {
                      if (oi === q.answer) cls = "border-[var(--success)] bg-[var(--card)]";
                      else if (oi === ans && oi !== q.answer) cls = "border-[var(--error)] bg-[var(--card)]";
                    }
                    return `<button data-csq="${q.id}:${oi}" class="w-full text-left px-3 py-2 rounded-lg border ${cls} text-xs sm:text-sm cursor-pointer">${opt}</button>`;
                  }).join("")}
                </div>
                ${answered ? `<p class="text-xs text-[var(--muted-foreground)] pt-1 border-t border-[var(--card-border)]">${q.why}</p>` : ""}
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
      updateHUD();
      renderCaseStudy();
    }));
  }

  function renderScavenger() {
    const h = SCAVENGER_HUNTS[huntIdx];
    const done = Object.values(state.solvedHunts || {}).filter(Boolean).length;
    const root = document.getElementById("scav-root");

    root.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap gap-1.5">
          ${SCAVENGER_HUNTS.map((x, i) => `
            <button data-sh-pick="${i}" class="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border cursor-pointer ${
              i === huntIdx ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                            : "bg-[var(--content)] text-[var(--foreground)] border-[var(--card-border)]"
            }">${state.solvedHunts[x.id] ? "✓ " : ""}#${i + 1}</button>
          `).join("")}
        </div>
        <span class="text-xs font-mono text-[var(--muted-foreground)]">Completed: ${done}/${SCAVENGER_HUNTS.length}</span>
      </div>

      <div class="bg-[var(--content)] border border-[var(--card-border)] rounded-xl p-5 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <span class="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Open-Book Challenge #${huntIdx + 1} (Beat 45 Seconds!)</span>
          <div class="flex items-center gap-2">
            <span id="sh-clock" class="font-mono text-base font-bold px-2.5 py-1 rounded bg-[var(--card)] border border-[var(--border)]">${huntSecs}s</span>
            <button id="sh-start" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] cursor-pointer">Start 45s Clock</button>
          </div>
        </div>
        <div class="text-base font-bold leading-snug">${h.q}</div>
        <div class="text-xs text-[var(--muted-foreground)]">Search Tip: ${h.hint}</div>
        <div class="flex flex-wrap gap-2">
          <a href="${h.url}" target="_blank" rel="noopener" class="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:opacity-90">↗ Open Microsoft Learn Page</a>
          <button id="sh-reveal" class="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[var(--card)] border border-[var(--border)] cursor-pointer">Reveal Answer &amp; Mark Found (+30 XP)</button>
        </div>
        ${huntRevealed ? `
          <div class="p-3.5 rounded-lg bg-[var(--card)] border border-[var(--success)] text-sm">
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
      updateHUD();
      renderScavenger();
    });
  }

  // ---------------------------------------------------------------------------
  // TAB 7: OFFICIAL MICROSOFT LEARN STUDY GUIDE (81/81)
  // ---------------------------------------------------------------------------
  let bpFilter = "all";
  let bpQuery = "";

  function renderBlueprint() {
    const filtersEl = document.getElementById("bp-filters");
    const listEl = document.getElementById("bp-list");
    if (!state.blueprintChecked) state.blueprintChecked = {};

    let totalItems = 0, doneItems = 0;
    MS_BLUEPRINT.forEach((d, di) => d.groups.forEach((g, gi) => g.items.forEach((_, ii) => {
      totalItems++;
      if (state.blueprintChecked[`bp_${di}_${gi}_${ii}`]) doneItems++;
    })));
    document.getElementById("blueprint-badge").textContent = `${doneItems}/${totalItems}`;

    const filterDefs = [{ id: "all", label: `All (${totalItems})` }, ...MS_BLUEPRINT.map(d => ({ id: d.id, label: d.domain.split(" (")[0] }))];
    filtersEl.innerHTML = filterDefs.map(f => `
      <button data-bp-filter="${f.id}" class="px-3 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
        bpFilter === f.id ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                          : "bg-[var(--content)] text-[var(--foreground)] border-[var(--card-border)]"
      }">${f.label}</button>
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
            <label class="flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-[var(--card)] cursor-pointer transition-colors">
              <span class="flex items-start gap-2.5 text-xs sm:text-sm">
                <input type="checkbox" data-bp-key="${key}" ${checked ? "checked" : ""} class="mt-0.5 w-4 h-4 accent-[var(--primary)] cursor-pointer shrink-0" />
                <span class="${checked ? "line-through text-[var(--muted-foreground)]" : "text-[var(--foreground)]"}">${text}</span>
              </span>
              <span class="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-[var(--secondary)] text-[var(--secondary-foreground)] shrink-0">${sprint}</span>
            </label>
          `;
        }).filter(Boolean).join("");
        if (!rows) return "";
        return `<div class="space-y-1"><div class="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] px-1 pt-1">${g.name}</div><div class="space-y-0.5">${rows}</div></div>`;
      }).filter(Boolean).join("");
      if (!groupHtml) return "";
      return `
        <div class="bg-[var(--content)] border border-[var(--card-border)] rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between flex-wrap gap-2 border-b border-[var(--card-border)] pb-2">
            <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full inline-block" style="background:${d.color};"></span><h3 class="text-sm font-bold">${d.domain}</h3></div>
            <a href="${d.url}" target="_blank" rel="noopener" class="text-xs font-semibold text-[var(--link)] hover:underline">↗ Official MS Path</a>
          </div>
          ${groupHtml}
        </div>
      `;
    }).filter(Boolean).join("") || `<div class="text-sm text-[var(--muted-foreground)] py-4 text-center">No objectives match "${bpQuery}".</div>`;

    listEl.querySelectorAll("[data-bp-key]").forEach(cb => {
      cb.addEventListener("change", () => {
        state.blueprintChecked[cb.dataset.bpKey] = cb.checked;
        saveState();
        renderBlueprint();
      });
    });
  }

  document.getElementById("bp-search").addEventListener("input", e => { bpQuery = e.target.value; renderBlueprint(); });

  // ---------------------------------------------------------------------------
  // 25-MINUTE DAILY SPRINT TIMER
  // ---------------------------------------------------------------------------
  let timerSeconds = 25 * 60;
  let timerInterval = null;
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
        else { clearInterval(timerInterval); timerInterval = null; timerToggle.textContent = "Done!"; }
      }, 1000);
    }
  });

  document.getElementById("timer-reset").addEventListener("click", () => {
    clearInterval(timerInterval); timerInterval = null; timerSeconds = 25 * 60; timerToggle.textContent = "Start"; updateTimerUI();
  });

  function renderAll() {
    renderMapSelection();
    renderSprints();
    renderDrillsTab();
    renderWeaknessRadar();
    renderSpeedRun();
    renderExamLab();
    renderBlueprint();
    updateHUD();
    requestAnimationFrame(drawConnections);
  }

  renderAll();
})();
