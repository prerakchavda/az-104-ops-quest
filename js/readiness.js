// =============================================================================
// AZ-104 OPS QUEST — UNIFIED DOMAIN MASTERY & WEAK-SPOT DIAGNOSTIC ENGINE
// Computes Per-Domain Mastery (Blueprint 30% + Hands-On Labs 30% + Accuracy 40%)
// Ranks "Where You Need the Most Work" by Exam-Weight Impact
// Includes External Practice Exam Score Logger (AI Skills Navigator / TD / etc.)
// =============================================================================

window.AZ104_READINESS = (function () {
  const DOMAIN_META = [
    {
      id: "identity",
      name: "Identities & Governance",
      shortName: "Identity & Gov",
      weightLabel: "20–25%",
      weightNum: 0.225,
      colorVar: "--chart-1",
      recCapstone: "int1",
      recGuideWeek: 1,
      recSim: "gov",
      recMsLab: "LAB 01 & 02a/b"
    },
    {
      id: "compute",
      name: "Deploy & Manage Compute",
      shortName: "Compute",
      weightLabel: "20–25%",
      weightNum: 0.225,
      colorVar: "--chart-3",
      recCapstone: "int2",
      recGuideWeek: 4,
      recSim: "nsg",
      recMsLab: "LAB 03b, 08 & 09a/b/c"
    },
    {
      id: "networking",
      name: "Virtual Networking",
      shortName: "Networking",
      weightLabel: "15–20%",
      weightNum: 0.175,
      colorVar: "--chart-2",
      recCapstone: "int2",
      recGuideWeek: 2,
      recSim: "nsg",
      recMsLab: "LAB 04, 05 & 06"
    },
    {
      id: "storage",
      name: "Implement & Manage Storage",
      shortName: "Storage",
      weightLabel: "15–20%",
      weightNum: 0.175,
      colorVar: "--chart-4",
      recCapstone: "int1",
      recGuideWeek: 3,
      recSim: "gov",
      recMsLab: "LAB 07"
    },
    {
      id: "monitor",
      name: "Monitor & Maintain Resources",
      shortName: "Monitor & Backup",
      weightLabel: "10–15%",
      weightNum: 0.125,
      colorVar: "--chart-5",
      recCapstone: "int4",
      recGuideWeek: 7,
      recSim: "nsg",
      recMsLab: "LAB 10 & 11"
    }
  ];

  // Normalize weights so they sum to 1.0 (0.225+0.225+0.175+0.175+0.125 = 0.925)
  const WEIGHT_SUM = DOMAIN_META.reduce((s, d) => s + d.weightNum, 0);

  function compute(state) {
    const { WEEKS, MS_BLUEPRINT } = window.AZ104_CORE;
    const { TICKETS, SPEEDRUN_CARDS } = window.AZ104_DRILLS;
    const { INTEGRATION_LABS, BLITZ_WEEKS } = window.AZ104_GUIDES;

    const isBlitz = state.planMode === "blitz";
    const mockLogs = Array.isArray(state.mockLogs) ? state.mockLogs : [];

    // 1. Blueprint counts per domain (includes auto-checked objectives from completed labs/sprints/capstones!)
    const bpTotal = {}, bpDone = {};
    MS_BLUEPRINT.forEach((d, di) => {
      bpTotal[d.id] = 0;
      bpDone[d.id] = 0;
      d.groups.forEach((g, gi) => {
        g.items.forEach((_, ii) => {
          bpTotal[d.id]++;
          const st = window.AZ104_GUIDES.getObjectiveStatus(`bp_${di}_${gi}_${ii}`, state);
          if (st.done) {
            bpDone[d.id]++;
          }
        });
      });
    });

    // 2. Hands-on sprint + capstone counts per domain
    const labTotal = {}, labDone = {};
    DOMAIN_META.forEach(d => { labTotal[d.id] = 0; labDone[d.id] = 0; });

    if (isBlitz) {
      BLITZ_WEEKS.forEach(w => {
        w.days.forEach(day => {
          labTotal[day.domain] = (labTotal[day.domain] || 0) + 1;
          if (state.blitzChecked && state.blitzChecked[day.id]) {
            labDone[day.domain] = (labDone[day.domain] || 0) + 1;
          }
        });
      });
    } else {
      WEEKS.forEach(w => {
        w.sprints.forEach(s => {
          labTotal[w.domain] = (labTotal[w.domain] || 0) + 1;
          if (state.checked && state.checked[s.id]) {
            labDone[w.domain] = (labDone[w.domain] || 0) + 1;
          }
        });
      });
    }

    INTEGRATION_LABS.forEach(cap => {
      cap.domains.forEach(domId => {
        labTotal[domId] = (labTotal[domId] || 0) + 1;
        if (state.capstoneChecked && state.capstoneChecked[cap.id]) {
          labDone[domId] = (labDone[domId] || 0) + 1;
        }
      });
    });

    // 3. Per-domain evaluation
    const domains = DOMAIN_META.map(meta => {
      const id = meta.id;
      const bTot = bpTotal[id] || 1;
      const bCur = bpDone[id] || 0;
      const bpPct = Math.round((bCur / bTot) * 100);

      const lTot = labTotal[id] || 1;
      const lCur = labDone[id] || 0;
      const labPct = Math.round((lCur / lTot) * 100);

      // Tickets in this domain
      const domTickets = TICKETS.filter(t => t.domain === id);
      const solvedDomTickets = domTickets.filter(t => state.solvedTickets && state.solvedTickets[t.id]).length;

      // Quiz stats in this domain
      const st = (state.domainStats && state.domainStats[id]) || { right: 0, wrong: 0 };
      const attempts = st.right + st.wrong;

      // Missed traps waiting in queue for this domain
      const missedInDomain = SPEEDRUN_CARDS.filter(
        c => c.domain === id && state.missedTraps && state.missedTraps[c.id]
      ).length;

      // External mock exam average for this domain (if logged)
      const mockScoresForDom = mockLogs
        .map(m => (m.domains && typeof m.domains[id] === "number" ? m.domains[id] : null))
        .filter(v => v !== null);
      const mockAvg = mockScoresForDom.length
        ? Math.round(mockScoresForDom.reduce((a, b) => a + b, 0) / mockScoresForDom.length)
        : null;

      // Combine active accuracy (0-100)
      let practiceSignals = [];
      // Ticket completion signal (always present so 0 solved starts at 0)
      const ticketCompletionPct = Math.round((solvedDomTickets / Math.max(1, domTickets.length)) * 100);
      practiceSignals.push(ticketCompletionPct);

      if (attempts > 0) {
        practiceSignals.push(Math.round((st.right / attempts) * 100));
      }
      if (mockAvg !== null) {
        // Weight external mock exam double inside practice signals
        practiceSignals.push(mockAvg, mockAvg);
      }
      const quizPct = Math.round(practiceSignals.reduce((a, b) => a + b, 0) / practiceSignals.length);

      // Final blended mastery score: 30% Blueprint + 30% Hands-On Labs + 40% Practice/Mock Accuracy
      const masteryPct = Math.round(bpPct * 0.30 + labPct * 0.30 + quizPct * 0.40);

      let status = "Needs Focus";
      let statusClass = "badge-danger";
      if (masteryPct >= 75) {
        status = "Exam-Ready";
        statusClass = "badge-success";
      } else if (masteryPct >= 45) {
        status = "Building";
        statusClass = "badge-warning";
      }

      // Priority gap score: higher exam weight + lower mastery + missed traps = higher urgency
      const normWeight = meta.weightNum / WEIGHT_SUM;
      const gapScore = (100 - masteryPct) * normWeight + missedInDomain * 4 + (st.wrong > st.right ? 8 : 0);

      // Build human diagnostic reason
      const reasons = [];
      if (missedInDomain > 0) reasons.push(`${missedInDomain} missed exam trap(s) waiting for review`);
      if (attempts > 0 && Math.round((st.right / attempts) * 100) < 70) {
        reasons.push(`quiz accuracy is ${Math.round((st.right / attempts) * 100)}% (${st.right}/${attempts})`);
      }
      if (mockAvg !== null && mockAvg < 70) reasons.push(`practice exam average is ${mockAvg}%`);
      if (solvedDomTickets < domTickets.length) reasons.push(`${domTickets.length - solvedDomTickets} unsolved P1 incident(s)`);
      if (bCur < bTot) reasons.push(`${bTot - bCur} unchecked blueprint objective(s)`);
      if (lCur < lTot) reasons.push(`${lTot - lCur} hands-on lab sprint(s) remaining`);

      return {
        ...meta,
        bpDone: bCur,
        bpTotal: bTot,
        bpPct,
        labDone: lCur,
        labTotal: lTot,
        labPct,
        ticketsDone: solvedDomTickets,
        ticketsTotal: domTickets.length,
        quizRight: st.right,
        quizWrong: st.wrong,
        quizAttempts: attempts,
        quizPct,
        mockAvg,
        missedInDomain,
        masteryPct,
        status,
        statusClass,
        gapScore,
        diagnosticReason: reasons.slice(0, 2).join(" • ") || "Keep sharpening with timed drills."
      };
    });

    // Weighted overall readiness
    const overallPct = Math.round(
      domains.reduce((sum, d) => sum + d.masteryPct * (d.weightNum / WEIGHT_SUM), 0)
    );

    // Estimated scaled score (out of 1000, baseline 300 -> 1000)
    const estimatedScaledScore = Math.min(1000, Math.round(300 + (overallPct / 100) * 700));

    // Rank domains from highest urgency gap to lowest
    const prioritized = [...domains].sort((a, b) => b.gapScore - a.gapScore);
    const weakest = prioritized[0];
    const secondWeakest = prioritized[1];

    const totalBpDone = domains.reduce((s, d) => s + d.bpDone, 0);
    const totalBpAll = domains.reduce((s, d) => s + d.bpTotal, 0);

    return {
      overallPct,
      estimatedScaledScore,
      totalBpDone,
      totalBpAll,
      domains,
      prioritized,
      weakest,
      secondWeakest,
      mockLogs
    };
  }

  return { DOMAIN_META, compute };
})();
