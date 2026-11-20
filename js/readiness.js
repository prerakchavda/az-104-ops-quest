// =============================================================================
// AZ-104 OPS QUEST — CALIBRATED DOMAIN MASTERY, LEITNER SPACED-REPETITION &
// FIRST-TRY PASS DIAGNOSTIC ENGINE (v4)
// • Honest Scaled Score Gate: Requires 72%+ verified recall to cross 700/1000
// • 20% Blueprint + 25% Verified Labs/Checkpoints + 55% Active Recall Accuracy
// • 3-Box Leitner Spaced Repetition (Box 1 Urgent -> Box 2 Reinforcing -> Box 3)
// • 4-Gate "First-Try Pass Verdict" Checklist
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
      recMatrix: "mat1",
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
      recMatrix: "mat4",
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
      recMatrix: "mat6",
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
      recMatrix: "mat2",
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
      recMatrix: "mat7",
      recMsLab: "LAB 10 & 11"
    }
  ];

  const WEIGHT_SUM = DOMAIN_META.reduce((s, d) => s + d.weightNum, 0);

  // Ensure legacy missedTraps are reflected in the 3-box Leitner map
  function getLeitnerItems(state) {
    const { SPEEDRUN_CARDS, TICKETS } = window.AZ104_DRILLS;
    const leitner = { ...(state.leitner || {}) };

    if (state.missedTraps) {
      Object.keys(state.missedTraps).forEach(cid => {
        if (!leitner[cid]) {
          const card = SPEEDRUN_CARDS.find(c => c.id === cid);
          if (card) {
            leitner[cid] = {
              id: cid,
              domain: card.domain,
              type: "trap",
              title: card.prompt,
              box: 1,
              streak: 0,
              misses: state.missedTraps[cid] || 1
            };
          }
        }
      });
    }

    // Filter out any corrupted entries
    return Object.values(leitner).filter(item => item && item.id && item.domain);
  }

  function compute(state) {
    const { WEEKS, MS_BLUEPRINT } = window.AZ104_CORE;
    const { TICKETS, BUG_HUNTS, CASE_STUDIES } = window.AZ104_DRILLS;
    const { INTEGRATION_LABS, BLITZ_WEEKS } = window.AZ104_GUIDES;
    const examData = window.AZ104_EXAM_DATA || {
      SEQUENCE_DRILLS: [],
      DROPDOWN_DRILLS: [],
      YESNO_SERIES: [],
      TOPIC_CHECKPOINTS: {}
    };

    const isBlitz = state.planMode === "blitz";
    const mockLogs = Array.isArray(state.mockLogs) ? state.mockLogs : [];
    const leitnerList = getLeitnerItems(state);

    // 1. Blueprint counts per domain
    const bpTotal = {}, bpDone = {};
    MS_BLUEPRINT.forEach((d, di) => {
      bpTotal[d.id] = 0;
      bpDone[d.id] = 0;
      d.groups.forEach((g, gi) => {
        g.items.forEach((_, ii) => {
          bpTotal[d.id]++;
          const st = window.AZ104_GUIDES.getObjectiveStatus(`bp_${di}_${gi}_${ii}`, state);
          if (st.done) bpDone[d.id]++;
        });
      });
    });

    // 2. Hands-on sprint + capstone + topic checkpoint counts per domain
    const labTotal = {}, labDone = {};
    const cpTotal = {}, cpDone = {};
    DOMAIN_META.forEach(d => {
      labTotal[d.id] = 0;
      labDone[d.id] = 0;
      cpTotal[d.id] = 0;
      cpDone[d.id] = 0;
    });

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

    // Sprint Exit Checkpoints per domain
    Object.values(examData.TOPIC_CHECKPOINTS || {}).forEach(list => {
      list.forEach(cp => {
        cpTotal[cp.domain] = (cpTotal[cp.domain] || 0) + 1;
        if (state.solvedCheckpoints && state.solvedCheckpoints[cp.id]) {
          cpDone[cp.domain] = (cpDone[cp.domain] || 0) + 1;
        }
      });
    });

    // Interactive Drills (Sequence + Dropdown + Locked Yes/No) per domain
    const intTotal = {}, intDone = {};
    DOMAIN_META.forEach(d => { intTotal[d.id] = 0; intDone[d.id] = 0; });

    (examData.SEQUENCE_DRILLS || []).forEach(sq => {
      intTotal[sq.domain] = (intTotal[sq.domain] || 0) + 1;
      if (state.solvedSequences && state.solvedSequences[sq.id]) {
        intDone[sq.domain] = (intDone[sq.domain] || 0) + 1;
      }
    });
    (examData.DROPDOWN_DRILLS || []).forEach(dd => {
      intTotal[dd.domain] = (intTotal[dd.domain] || 0) + 1;
      if (state.solvedDropdowns && state.solvedDropdowns[dd.id]) {
        intDone[dd.domain] = (intDone[dd.domain] || 0) + 1;
      }
    });
    (examData.YESNO_SERIES || []).forEach(yn => {
      intTotal[yn.domain] = (intTotal[yn.domain] || 0) + 1;
      if (state.solvedYesNo && state.solvedYesNo[yn.id]) {
        intDone[yn.domain] = (intDone[yn.domain] || 0) + 1;
      }
    });

    // 3. Per-domain evaluation
    let totalActiveAttempts = 0;

    const domains = DOMAIN_META.map(meta => {
      const id = meta.id;
      const bTot = bpTotal[id] || 1;
      const bCur = bpDone[id] || 0;
      const bpPct = Math.round((bCur / bTot) * 100);

      const lTot = (labTotal[id] || 1) + (cpTotal[id] || 0);
      const lCur = (labDone[id] || 0) + (cpDone[id] || 0);
      const labPct = Math.round((lCur / Math.max(1, lTot)) * 100);

      // P1 Tickets in this domain
      const domTickets = TICKETS.filter(t => t.domain === id);
      const solvedDomTickets = domTickets.filter(t => state.solvedTickets && state.solvedTickets[t.id]).length;
      const ticketPct = Math.round((solvedDomTickets / Math.max(1, domTickets.length)) * 100);

      // Interactive Drills in this domain
      const iTot = intTotal[id] || 1;
      const iCur = intDone[id] || 0;
      const interactivePct = Math.round((iCur / iTot) * 100);

      // Active quiz/drill accuracy in this domain
      const st = (state.domainStats && state.domainStats[id]) || { right: 0, wrong: 0 };
      const attempts = st.right + st.wrong;
      totalActiveAttempts += attempts;
      const rawAccuracyPct = attempts > 0 ? Math.round((st.right / attempts) * 100) : null;

      // Leitner boxes for this domain
      const domLeitner = leitnerList.filter(item => item.domain === id);
      const box1InDomain = domLeitner.filter(item => item.box === 1).length;
      const box2InDomain = domLeitner.filter(item => item.box === 2).length;
      const box3InDomain = domLeitner.filter(item => item.box === 3).length;
      const dueInDomain = box1InDomain + box2InDomain;

      // External or Built-In Timed Mock Exam average for this domain
      const mockScoresForDom = mockLogs
        .map(m => (m.domains && typeof m.domains[id] === "number" ? m.domains[id] : null))
        .filter(v => v !== null);
      const mockAvg = mockScoresForDom.length
        ? Math.round(mockScoresForDom.reduce((a, b) => a + b, 0) / mockScoresForDom.length)
        : null;

      // Combine active recall signals (0-100)
      const practiceSignals = [ticketPct, interactivePct];
      if (rawAccuracyPct !== null) {
        // Weight actual answer accuracy heavily once attempts exist
        practiceSignals.push(rawAccuracyPct, rawAccuracyPct);
      }
      if (mockAvg !== null) {
        // Timed mock exam scores carry strong signal weight
        practiceSignals.push(mockAvg, mockAvg, mockAvg);
      }
      const quizPct = Math.round(practiceSignals.reduce((a, b) => a + b, 0) / practiceSignals.length);

      // Calibrated Domain Mastery: 20% Blueprint + 25% Hands-On Labs/Checkpoints + 55% Active Recall
      // Penalize lingering Box 1 urgent misses (-3% per unreviewed Box 1 trap, up to -12%)
      const box1Penalty = Math.min(12, box1InDomain * 3);
      const rawMastery = Math.round(bpPct * 0.20 + labPct * 0.25 + quizPct * 0.55);
      const masteryPct = Math.max(0, rawMastery - box1Penalty);

      let status = "Needs Focus";
      let statusClass = "badge-danger";
      if (masteryPct >= 75 && box1InDomain === 0) {
        status = "Exam-Ready";
        statusClass = "badge-success";
      } else if (masteryPct >= 45) {
        status = "Building";
        statusClass = "badge-warning";
      }

      const normWeight = meta.weightNum / WEIGHT_SUM;
      const gapScore =
        (100 - masteryPct) * normWeight +
        box1InDomain * 6 +
        box2InDomain * 2.5 +
        (st.wrong > st.right ? 8 : 0);

      const reasons = [];
      if (box1InDomain > 0) reasons.push(`${box1InDomain} Box-1 urgent miss(es) need 2x streak`);
      if (box2InDomain > 0) reasons.push(`${box2InDomain} Box-2 item(s) need 1 more correct review`);
      if (rawAccuracyPct !== null && rawAccuracyPct < 72) {
        reasons.push(`active accuracy is ${rawAccuracyPct}% (${st.right}/${attempts})`);
      }
      if (mockAvg !== null && mockAvg < 72) reasons.push(`mock exam avg is ${mockAvg}%`);
      if (iCur < iTot) reasons.push(`${iTot - iCur} interactive exam drill(s) unsolved`);
      if (solvedDomTickets < domTickets.length) reasons.push(`${domTickets.length - solvedDomTickets} P1 incident(s) unsolved`);
      if ((cpDone[id] || 0) < (cpTotal[id] || 0)) reasons.push(`${(cpTotal[id] || 0) - (cpDone[id] || 0)} sprint checkpoint(s) open`);

      return {
        ...meta,
        bpDone: bCur,
        bpTotal: bTot,
        bpPct,
        labDone: labDone[id] || 0,
        labTotal: labTotal[id] || 1,
        cpDone: cpDone[id] || 0,
        cpTotal: cpTotal[id] || 0,
        labPct,
        ticketsDone: solvedDomTickets,
        ticketsTotal: domTickets.length,
        interactiveDone: iCur,
        interactiveTotal: iTot,
        quizRight: st.right,
        quizWrong: st.wrong,
        quizAttempts: attempts,
        rawAccuracyPct,
        quizPct,
        mockAvg,
        box1InDomain,
        box2InDomain,
        box3InDomain,
        missedInDomain: dueInDomain,
        masteryPct,
        status,
        statusClass,
        gapScore,
        diagnosticReason: reasons.slice(0, 2).join(" • ") || "Maintain sharpness with Timed Exam Simulator runs."
      };
    });

    // Weighted overall mastery (0-100%)
    const overallPct = Math.round(
      domains.reduce((sum, d) => sum + d.masteryPct * (d.weightNum / WEIGHT_SUM), 0)
    );

    // Weighted active-recall accuracy (0-100%)
    const verifiedAccuracyPct = Math.round(
      domains.reduce((sum, d) => sum + d.quizPct * (d.weightNum / WEIGHT_SUM), 0)
    );

    // Calibrated Scaled Score (300 - 1000, where 700 requires 72%+ effective exam readiness)
    // Confidence factor prevents hitting 700+ purely by checking blueprint boxes with 0 practice attempts
    const attemptConfidence = Math.min(1, (totalActiveAttempts + mockLogs.length * 15) / 20);
    const effectivePct = Math.round(
      overallPct * 0.40 + verifiedAccuracyPct * 0.60 * Math.max(0.35, attemptConfidence)
    );

    let estimatedScaledScore;
    if (effectivePct < 72) {
      estimatedScaledScore = Math.round(300 + (effectivePct / 72) * 399);
    } else {
      estimatedScaledScore = Math.min(1000, Math.round(700 + ((effectivePct - 72) / 28) * 300));
    }

    const prioritized = [...domains].sort((a, b) => b.gapScore - a.gapScore);
    const weakest = prioritized[0];
    const secondWeakest = prioritized[1];

    const totalBpDone = domains.reduce((s, d) => s + d.bpDone, 0);
    const totalBpAll = domains.reduce((s, d) => s + d.bpTotal, 0);

    const box1Total = domains.reduce((s, d) => s + d.box1InDomain, 0);
    const box2Total = domains.reduce((s, d) => s + d.box2InDomain, 0);
    const box3Total = domains.reduce((s, d) => s + d.box3InDomain, 0);
    const dueTotal = box1Total + box2Total;

    const minDomainPct = Math.min(...domains.map(d => d.masteryPct));
    const bestMockScore = mockLogs.length ? Math.max(...mockLogs.map(m => m.overall || 0)) : 0;

    // 4-Gate First-Try Pass Checklist
    const passGates = [
      {
        id: "gate_score",
        label: "Calibrated Score ≥ 740 / 1000",
        detail: `Current: ${estimatedScaledScore} / 1000 (Pass: 700)`,
        passed: estimatedScaledScore >= 740
      },
      {
        id: "gate_domains",
        label: "Every Domain ≥ 70% Mastery",
        detail: `Lowest domain: ${weakest.shortName} (${minDomainPct}%)`,
        passed: minDomainPct >= 70
      },
      {
        id: "gate_mock",
        label: "Timed Mock Exam ≥ 75%",
        detail: mockLogs.length ? `Best timed mock: ${bestMockScore}%` : "No timed mock taken yet",
        passed: bestMockScore >= 75
      },
      {
        id: "gate_leitner",
        label: "Leitner Box 1 Urgent Queue = 0",
        detail: box1Total === 0 ? "0 urgent misses pending" : `${box1Total} Box-1 miss(es) need review`,
        passed: box1Total === 0 && totalActiveAttempts >= 10
      }
    ];
    const gatesPassedCount = passGates.filter(g => g.passed).length;

    let passVerdict = "Building Foundation";
    let passVerdictClass = "badge-warning";
    if (gatesPassedCount === 4) {
      passVerdict = "First-Try Pass Ready (High Confidence)";
      passVerdictClass = "badge-success";
    } else if (estimatedScaledScore >= 700 && minDomainPct >= 65) {
      passVerdict = "Borderline Pass — Clear Remaining Gates";
      passVerdictClass = "badge-warning";
    } else {
      passVerdict = "Below 700 Pass Line — Focus on Active Recall";
      passVerdictClass = "badge-danger";
    }

    return {
      overallPct,
      verifiedAccuracyPct,
      effectivePct,
      estimatedScaledScore,
      totalBpDone,
      totalBpAll,
      box1Total,
      box2Total,
      box3Total,
      dueTotal,
      leitnerList,
      passGates,
      gatesPassedCount,
      passVerdict,
      passVerdictClass,
      domains,
      prioritized,
      weakest,
      secondWeakest,
      mockLogs
    };
  }

  return { DOMAIN_META, compute, getLeitnerItems };
})();
