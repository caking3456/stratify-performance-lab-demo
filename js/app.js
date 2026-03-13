/**
 * app.js — Main Application Logic
 * Stratify Performance Lab
 *
 * Wires the simulation engine to the UI:
 *  - Skeleton SVG rendering per exercise
 *  - Live stat updates (reps, force, score)
 *  - Joint angle display
 *  - Muscle activation bars
 *  - Force per rep bar chart
 *  - Set summary (text + sparkline graph)
 *  - Recommendations panel
 *  - Tab switching, export (CSV), session config
 */

'use strict';

/* ══════════════════════════════════════════
   GLOBALS
   ══════════════════════════════════════════ */
const sim = new BiomechanicsSimulation();

let currentExerciseId = 'squat';
let sessionConfig = { targetReps: 8, setNumber: 1, loadLabel: '185 lbs' };

/* ══════════════════════════════════════════
   INIT
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Show disclaimer modal
  document.getElementById('disclaimerModal').style.display = 'flex';
  // Populate exercise options
  populateExerciseSelect();
  // Load default exercise UI
  loadExercise('squat');
  // Nav click handlers
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      el.classList.add('active');
    });
  });
});

function closeDisclaimer() {
  document.getElementById('disclaimerModal').style.display = 'none';
}

/* ══════════════════════════════════════════
   EXERCISE SELECT
   ══════════════════════════════════════════ */
function populateExerciseSelect() {
  const sel = document.getElementById('exerciseSelect');
  for (const [id, ex] of Object.entries(EXERCISES)) {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = ex.label;
    sel.appendChild(opt);
  }
}

function onExerciseChange() {
  const id = document.getElementById('exerciseSelect').value;
  if (sim.isRunning) stopAnalysis();
  loadExercise(id);
}

function loadExercise(id) {
  currentExerciseId = id;
  const ex = getExercise(id);

  // Update category tag
  setEl('exerciseCategory', ex.category);
  setEl('exerciseDescription', ex.description);

  // Render skeleton
  renderSkeleton(ex);

  // Render muscle map
  renderMuscleMap(ex);

  // Render joint angle items
  renderJointAngles(ex);

  // Render empty force chart (target reps)
  renderForceChart([], sessionConfig.targetReps);

  // Reset stat cards
  setEl('statReps',  '0');
  setEl('statRepsDenom', sessionConfig.targetReps);
  setEl('statForce', '—');
  setEl('statScore', '—');
  setEl('hudRep',    '0');
  setEl('hudPhase',  'SETUP');
  setEl('hudDepth',  '—');
  setEl('hudForce',  '— N');

  // Reset summary
  renderSummary(null);
  const hepCard = document.getElementById('hepCard');
  if (hepCard) hepCard.style.display = 'none';
  renderRecommendations(ex.recommendations, false);
}

/* ══════════════════════════════════════════
   RECORDING CONTROL
   ══════════════════════════════════════════ */
function toggleAnalysis() {
  if (sim.isRunning) {
    stopAnalysis();
  } else {
    startAnalysis();
  }
}

function startAnalysis() {
  const ex = getExercise(currentExerciseId);
  sessionConfig.targetReps = parseInt(document.getElementById('targetRepsInput').value) || 8;
  sessionConfig.loadLabel  = document.getElementById('loadInput').value || '—';

  setEl('sessionLoad',     sessionConfig.loadLabel);
  setEl('sessionTargetReps', sessionConfig.targetReps);
  setEl('statRepsDenom',   sessionConfig.targetReps);

  // Configure and start simulation
  sim.load(currentExerciseId, sessionConfig.targetReps, 80);
  sim.setNumber = sessionConfig.setNumber;
  sim.onFrame       = handleFrame;
  sim.onRepComplete = handleRepComplete;
  sim.onSetComplete = handleSetComplete;
  sim.start();

  // Button UI
  const btn = document.getElementById('startBtn');
  btn.classList.add('recording');
  btn.querySelector('span').textContent = 'Stop Analysis';
  btn.querySelector('.btn-icon').innerHTML = stopIcon();

  // Show REC badge
  document.getElementById('recBadge').style.display = 'flex';
  document.getElementById('simBadge').style.display = 'none';

  // Reset summary pane
  renderSummary(null);
}

function stopAnalysis() {
  const summary = sim.stop();

  // Button UI
  const btn = document.getElementById('startBtn');
  btn.classList.remove('recording');
  btn.querySelector('span').textContent = 'Start Analysis';
  btn.querySelector('.btn-icon').innerHTML = startIcon();

  document.getElementById('recBadge').style.display = 'none';
  document.getElementById('simBadge').style.display = 'flex';

  if (summary) {
    renderSummary(summary);
    renderRecommendations(summary.recommendations, true);
    renderForceChart(summary.repForces, sessionConfig.targetReps);
    renderHEP(prescribeHEP(currentExerciseId, summary));
    sessionConfig.setNumber++;
    setEl('sessionSetNum', sessionConfig.setNumber);
  }
}

/* ══════════════════════════════════════════
   FRAME HANDLER (called ~60fps)
   ══════════════════════════════════════════ */
function handleFrame(frame) {
  // HUD
  setEl('hudRep',   frame.repCount + 1 > sessionConfig.targetReps ? sessionConfig.targetReps : frame.repCount + 1);
  setEl('hudPhase', frame.phase.toUpperCase());
  setEl('hudDepth', frame.depthPct + '%');
  setEl('hudForce', frame.forceN + ' N');

  // HUD phase color
  const phaseEl = document.getElementById('hudPhase');
  if (phaseEl) {
    phaseEl.style.color = {
      setup: 'var(--text-muted)',
      eccentric: '#A78BFA',
      bottom: 'var(--success)',
      concentric: 'var(--blue-light)'
    }[frame.phase] || 'var(--blue-light)';
  }

  // Live force stat
  setEl('statForce', frame.forceN);

  // Dispatch phase event for pill update
  document.dispatchEvent(new CustomEvent('stratify:frame', { detail: frame }));

  // Animate skeleton depth
  updateSkeletonDepth(frame.phase, frame.depthPct / 100, frame.hasValgus);

  // Update joint angles
  updateJointAngles(frame.angles, getExercise(currentExerciseId), frame.hasValgus);
}

function handleRepComplete({ repNum, force, score, hasValgus }) {
  // Rep count
  const repEl = document.getElementById('statReps');
  if (repEl) {
    repEl.textContent = repNum;
    repEl.classList.remove('rep-pop');
    void repEl.offsetWidth; // reflow
    repEl.classList.add('rep-pop');
  }
  setEl('hudRep', repNum);

  // Running average score
  const scores = sim.repScores;
  const avg = Math.round(scores.reduce((a,b)=>a+b,0)/scores.length);
  setEl('statScore', avg);
  updateScoreColor(avg);

  // Valgus warning
  if (hasValgus) {
    setEl('statScoreSub', '⚠ Form fault detected');
    document.getElementById('statScoreSub').style.color = 'var(--warn)';
  }

  // Update force chart incrementally
  renderForceChart(sim.repForces, sessionConfig.targetReps);
}

function handleSetComplete(summary) {
  stopAnalysis();
}

/* ══════════════════════════════════════════
   SKELETON RENDERING
   ══════════════════════════════════════════ */
function renderSkeleton(ex) {
  const svg = document.getElementById('skeletonSvg');
  if (!svg) return;
  svg.innerHTML = '';

  const sk = ex.skeletonBottom || ex.skeleton;
  const NS = 'http://www.w3.org/2000/svg';

  // Defs / background glow
  const defs = doc(NS, 'defs');
  const rg = doc(NS, 'radialGradient');
  rg.setAttribute('id', 'bgGlow'); rg.setAttribute('cx', '50%'); rg.setAttribute('cy', '50%');
  const s1 = doc(NS, 'stop'); s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#1E8FE1'); s1.setAttribute('stop-opacity', '0.07');
  const s2 = doc(NS, 'stop'); s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', 'transparent');
  rg.appendChild(s1); rg.appendChild(s2);
  defs.appendChild(rg);
  svg.appendChild(defs);

  const bgEllipse = doc(NS, 'ellipse');
  bgEllipse.setAttribute('cx', '130'); bgEllipse.setAttribute('cy', '220');
  bgEllipse.setAttribute('rx', '110'); bgEllipse.setAttribute('ry', '185');
  bgEllipse.setAttribute('fill', 'url(#bgGlow)');
  svg.appendChild(bgEllipse);

  // Muscle overlays
  for (let oi = 0; oi < sk.muscleOverlays.length; oi++) {
    const m = sk.muscleOverlays[oi];
    const el = doc(NS, m.type);
    if (m.type === 'ellipse') {
      el.setAttribute('cx', m.cx); el.setAttribute('cy', m.cy);
      el.setAttribute('rx', m.rx); el.setAttribute('ry', m.ry);
    }
    el.setAttribute('class', m.cls);
    el.dataset.overlayIndex = oi;
    svg.appendChild(el);
  }

  // Bones
  for (let i = 0; i < sk.bones.length; i++) {
    const b = sk.bones[i];
    const line = doc(NS, 'line');
    line.setAttribute('x1', b.x1); line.setAttribute('y1', b.y1);
    line.setAttribute('x2', b.x2); line.setAttribute('y2', b.y2);
    line.setAttribute('class', b.active ? 'bone active' : 'bone');
    line.dataset.boneIndex = i;
    svg.appendChild(line);
  }

  // Joints
  for (let ji = 0; ji < sk.joints.length; ji++) {
    const j = sk.joints[ji];
    if (j.head && !j.headOnly) {
      // Head circle outline
      const outline = doc(NS, 'circle');
      outline.setAttribute('cx', j.cx); outline.setAttribute('cy', j.cy);
      outline.setAttribute('r', '18');
      outline.setAttribute('fill', 'none');
      outline.setAttribute('stroke', '#3AABFF');
      outline.setAttribute('stroke-width', '2');
      outline.dataset.jointIndex = ji;
      svg.appendChild(outline);
    }
    const c = doc(NS, 'circle');
    c.setAttribute('cx', j.cx); c.setAttribute('cy', j.cy);
    c.setAttribute('r',  j.head ? '3' : j.r || 5);
    c.dataset.jointIndex = ji;
    if (j.highlight && !j.warn) {
      c.setAttribute('fill', 'rgba(30,143,225,0.2)');
      c.setAttribute('stroke', '#3AABFF'); c.setAttribute('stroke-width', '2');
      // inner dot
      const dot = doc(NS, 'circle');
      dot.setAttribute('cx', j.cx); dot.setAttribute('cy', j.cy); dot.setAttribute('r', '3');
      dot.setAttribute('class', 'joint'); dot.dataset.jointHighlight = '1';
      dot.dataset.jointIndex = ji;
      svg.appendChild(c);
      svg.appendChild(dot);
      continue;
    } else if (j.highlight && j.warn) {
      c.setAttribute('fill', 'rgba(245,158,11,0.2)');
      c.setAttribute('stroke', '#F59E0B'); c.setAttribute('stroke-width', '2');
      const dot = doc(NS, 'circle');
      dot.setAttribute('cx', j.cx); dot.setAttribute('cy', j.cy); dot.setAttribute('r', '3');
      dot.setAttribute('class', 'joint warn'); dot.dataset.jointHighlight = '1';
      dot.dataset.jointIndex = ji;
      svg.appendChild(c);
      svg.appendChild(dot);
      continue;
    }
    c.setAttribute('class', j.warn ? 'joint warn' : 'joint');
    svg.appendChild(c);
  }

  // Angle annotations
  for (const a of sk.annotations) {
    const t = doc(NS, 'text');
    t.setAttribute('x', a.x); t.setAttribute('y', a.y);
    t.setAttribute('class', a.cls + (a.warn ? ' warn' : ''));
    t.setAttribute('font-family', 'JetBrains Mono, monospace');
    t.setAttribute('font-size', a.small ? '9' : '10');
    t.setAttribute('font-weight', '600');
    t.textContent = a.text;
    t.dataset.annotationType = 'angle';
    svg.appendChild(t);
  }
}

function updateSkeletonDepth(phase, depth, hasValgus) {
  const ex  = getExercise(currentExerciseId);
  const skT = ex.skeletonTop;
  const skB = ex.skeletonBottom || ex.skeleton;

  if (skT && skB) {
    // Lerp bones
    document.querySelectorAll('#skeletonSvg [data-bone-index]').forEach(el => {
      const i = +el.dataset.boneIndex;
      const t = skT.bones[i], b = skB.bones[i];
      if (!t || !b) return;
      el.setAttribute('x1', lerp(t.x1, b.x1, depth).toFixed(1));
      el.setAttribute('y1', lerp(t.y1, b.y1, depth).toFixed(1));
      el.setAttribute('x2', lerp(t.x2, b.x2, depth).toFixed(1));
      el.setAttribute('y2', lerp(t.y2, b.y2, depth).toFixed(1));
    });

    // Lerp joints
    document.querySelectorAll('#skeletonSvg [data-joint-index]').forEach(el => {
      const i = +el.dataset.jointIndex;
      const t = skT.joints[i], b = skB.joints[i];
      if (!t || !b) return;
      el.setAttribute('cx', lerp(t.cx, b.cx, depth).toFixed(1));
      el.setAttribute('cy', lerp(t.cy, b.cy, depth).toFixed(1));
    });

    // Lerp overlays (position + size)
    document.querySelectorAll('#skeletonSvg [data-overlay-index]').forEach(el => {
      const i = +el.dataset.overlayIndex;
      const t = skT.muscleOverlays[i], b = skB.muscleOverlays[i];
      if (!t || !b) return;
      if (t.cx !== undefined) {
        el.setAttribute('cx', lerp(t.cx, b.cx, depth).toFixed(1));
        el.setAttribute('cy', lerp(t.cy, b.cy, depth).toFixed(1));
      }
      if (t.rx !== undefined) {
        el.setAttribute('rx', lerp(t.rx, b.rx, depth).toFixed(1));
        el.setAttribute('ry', lerp(t.ry, b.ry, depth).toFixed(1));
      }
    });
  }

  // Muscle overlay animation state
  document.querySelectorAll('#skeletonSvg .muscle-overlay').forEach(o => {
    o.style.animationPlayState = phase === 'setup' ? 'paused' : 'running';
  });

  // Valgus indicator
  document.querySelectorAll('#skeletonSvg .joint.warn').forEach(j => {
    j.style.opacity = hasValgus ? '1' : '0.4';
  });
}

/* ══════════════════════════════════════════
   MUSCLE MAP
   ══════════════════════════════════════════ */
function renderMuscleMap(ex) {
  const primary = document.getElementById('musclePrimary');
  const stab    = document.getElementById('muscleStabilizers');
  if (!primary || !stab) return;

  primary.innerHTML = buildMuscleRows(ex.muscles.primary);
  stab.innerHTML    = buildMuscleRows(ex.muscles.stabilizers);
}

function buildMuscleRows(muscles) {
  return muscles.map(m => `
    <div class="muscle-row">
      <div class="muscle-name">${m.name}</div>
      <div class="muscle-bar-bg">
        <div class="muscle-bar" style="width:${m.pct}%;background:${m.color};"></div>
      </div>
      <div class="muscle-pct">${m.pct}%</div>
      <div class="muscle-tag ${m.tag}">${m.tag === 'primary' ? 'Primary' : 'Stab.'}</div>
    </div>
  `).join('');
}

/* ══════════════════════════════════════════
   JOINT ANGLES
   ══════════════════════════════════════════ */
function renderJointAngles(ex) {
  const grid = document.getElementById('angleGrid');
  if (!grid) return;
  grid.innerHTML = ex.joints.map(j => `
    <div class="angle-item">
      <div class="angle-joint">${j.name}</div>
      <div class="angle-deg" id="ang-${j.key}">
        ${ex.baseAngles[j.key] || '—'}<span class="unit">°</span>
      </div>
      <div class="angle-status good" id="angst-${j.key}">Optimal</div>
    </div>
  `).join('');
}

function updateJointAngles(angles, ex) {
  for (const j of ex.joints) {
    const val = angles[j.key];
    if (val === undefined) continue;
    const degEl  = document.getElementById(`ang-${j.key}`);
    const statEl = document.getElementById(`angst-${j.key}`);
    if (degEl) degEl.innerHTML = `${val}<span class="unit">°</span>`;
    if (statEl) {
      const inRange = val >= j.optMin && val <= j.optMax;
      const close   = val >= j.optMin - 10 && val <= j.optMax + 10;
      statEl.className = 'angle-status ' + (inRange ? 'good' : close ? 'warn' : 'crit');
      statEl.textContent = inRange ? 'Optimal' : close ? 'Watch' : 'Check';
    }
  }
}

/* ══════════════════════════════════════════
   FORCE BAR CHART
   ══════════════════════════════════════════ */
function renderForceChart(forces, targetReps) {
  const container = document.getElementById('forceChart');
  if (!container) return;
  container.innerHTML = '';

  const maxForce = forces.length ? Math.max(...forces) : 1;

  for (let i = 0; i < targetReps; i++) {
    const col = document.createElement('div');
    col.className = 'force-col';

    const wrap = document.createElement('div');
    wrap.className = 'force-bar-wrap';

    const bar = document.createElement('div');
    bar.className = 'force-bar-fill';

    if (forces[i]) {
      const heightPct = Math.round((forces[i] / (maxForce * 1.05)) * 100);
      bar.style.height = heightPct + '%';
      // Color: first rep blue, last rep warn if fatigue
      const fatigueIdx = Math.floor(targetReps * 0.7);
      bar.style.background = i === 0 ? 'var(--blue)' :
                             i >= fatigueIdx && forces[i] < forces[0] * 0.88 ? 'var(--warn)' :
                             'var(--blue)';
    } else {
      bar.style.height = '8%';
      bar.style.background = 'rgba(255,255,255,0.05)';
    }

    wrap.appendChild(bar);
    col.appendChild(wrap);

    const label = document.createElement('div');
    label.className = 'force-rep-label';
    label.textContent = 'R' + (i + 1);
    col.appendChild(label);

    container.appendChild(col);
  }

  // Update stats below chart
  if (forces.length) {
    const avg     = Math.round(forces.reduce((a,b) => a+b, 0) / forces.length);
    const peak    = Math.max(...forces);
    const fatigue = Math.round((1 - forces[forces.length-1] / forces[0]) * 100);
    setEl('forceStatPeak', `Peak: <strong>${peak}N (R1)</strong>`);
    setEl('forceStatAvg',  `Avg: <strong>${avg}N</strong>`);
    setEl('forceStatFatigue', forces.length > 2 && fatigue > 5 ? `<span style="color:var(--warn)">↓ ${fatigue}% fatigue</span>` : '');
  } else {
    setEl('forceStatPeak', ''); setEl('forceStatAvg', ''); setEl('forceStatFatigue', '');
  }
}

/* ══════════════════════════════════════════
   SET SUMMARY
   ══════════════════════════════════════════ */
function renderSummary(summary) {
  const numEl  = document.getElementById('scoreNum');
  const arcEl  = document.getElementById('scoreArc');
  const titleEl = document.getElementById('scoreTitle');
  const bodyEl  = document.getElementById('scoreSummaryText');

  if (!summary) {
    if (numEl) numEl.textContent = '—';
    if (titleEl) titleEl.textContent = 'Awaiting set completion';
    if (bodyEl) bodyEl.innerHTML = '<em>Complete a set to view your AI-assisted summary.</em>';
    renderSparkline([]);
    return;
  }

  if (numEl) numEl.textContent = summary.avgScore;
  if (titleEl) titleEl.textContent = summary.grade;
  if (bodyEl) bodyEl.innerHTML = `<strong>Clinical Observation:</strong> ${summary.summaryText}`;
  updateScoreColor(summary.avgScore);
  renderSparkline(summary.repScores);
}

function updateScoreColor(score) {
  const arcEl = document.getElementById('scoreArc');
  if (!arcEl) return;
  const color = score >= 88 ? 'var(--success)' : score >= 75 ? 'var(--blue)' : 'var(--warn)';
  arcEl.style.borderTopColor    = color;
  arcEl.style.borderRightColor  = color;
  arcEl.style.borderBottomColor = color;
  const numEl = document.getElementById('scoreNum');
  if (numEl) numEl.style.color = color;
}

function renderSparkline(scores) {
  const svg = document.getElementById('sparklineSvg');
  if (!svg) return;
  svg.innerHTML = '';
  if (!scores.length) return;

  const W = 300, H = 60;
  const NS = 'http://www.w3.org/2000/svg';
  const minS = Math.min(...scores) - 5;
  const maxS = Math.max(...scores) + 5;
  const pts  = scores.map((s, i) => {
    const x = 10 + (i / Math.max(scores.length - 1, 1)) * (W - 20);
    const y = H - 8 - ((s - minS) / (maxS - minS)) * (H - 20);
    return [Math.round(x), Math.round(y)];
  });

  // Gradient fill
  const defs = doc(NS, 'defs');
  const lg = doc(NS, 'linearGradient');
  lg.setAttribute('id', 'sGrad'); lg.setAttribute('x1','0'); lg.setAttribute('x2','0'); lg.setAttribute('y1','0'); lg.setAttribute('y2','1');
  const g1 = doc(NS, 'stop'); g1.setAttribute('offset','0%'); g1.setAttribute('stop-color','#1E8FE1'); g1.setAttribute('stop-opacity','0.35');
  const g2 = doc(NS, 'stop'); g2.setAttribute('offset','100%'); g2.setAttribute('stop-color','#1E8FE1'); g2.setAttribute('stop-opacity','0');
  lg.appendChild(g1); lg.appendChild(g2); defs.appendChild(lg); svg.appendChild(defs);

  const d   = 'M ' + pts.map(p => p.join(' ')).join(' L ');
  const fill = d + ` L ${pts[pts.length-1][0]} ${H} L ${pts[0][0]} ${H} Z`;

  const path = doc(NS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#1E8FE1');
  path.setAttribute('stroke-width', '2.5');
  path.setAttribute('stroke-linecap', 'round');
  svg.appendChild(path);

  const area = doc(NS, 'path');
  area.setAttribute('d', fill);
  area.setAttribute('fill', 'url(#sGrad)');
  svg.appendChild(area);

  // Data points
  pts.forEach(([x,y], i) => {
    const c = doc(NS, 'circle');
    c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', i === pts.length-1 ? '4' : '3');
    c.setAttribute('fill', i === pts.length-1 && scores[i] < scores[0] - 5 ? '#F59E0B' : '#3AABFF');
    svg.appendChild(c);
    // Rep label
    const t = doc(NS, 'text');
    t.setAttribute('x', x); t.setAttribute('y', H);
    t.setAttribute('font-family', 'JetBrains Mono, monospace');
    t.setAttribute('font-size', '8');
    t.setAttribute('fill', '#6B7894');
    t.setAttribute('text-anchor', 'middle');
    t.textContent = 'R'+(i+1);
    svg.appendChild(t);
  });

  // Scores label
  const note = document.getElementById('sparklineNote');
  if (note) {
    const fatigue = scores.length > 1 ? scores[0] - scores[scores.length-1] : 0;
    note.innerHTML = `Scores: <span>${scores.join(' → ')}</span>&nbsp;·&nbsp; Fatigue gradient: <span style="color:var(--warn)">-${fatigue}pts</span>`;
  }
}

/* ══════════════════════════════════════════
   RECOMMENDATIONS
   ══════════════════════════════════════════ */
function renderRecommendations(recs, highlight) {
  const container = document.getElementById('recsContainer');
  if (!container) return;
  container.innerHTML = recs.map(r => `
    <div class="rec-item ${r.priority}">
      <div class="rec-icon">${r.icon}</div>
      <div class="rec-content">
        <h4>${r.title}</h4>
        <p>${r.body}</p>
        ${r.evidence ? `<div class="rec-basis">${r.evidence}</div>` : ''}
      </div>
    </div>
  `).join('');
}

/* ══════════════════════════════════════════
   HEP PRESCRIPTION RENDERING
   ══════════════════════════════════════════ */
function renderHEP(drills) {
  const card      = document.getElementById('hepCard');
  const container = document.getElementById('hepContainer');
  const badge     = document.getElementById('hepBadge');
  if (!card || !container) return;

  if (!drills || !drills.length) {
    card.style.display = 'none';
    return;
  }

  card.style.display = '';
  if (badge) badge.textContent = drills.length;

  container.innerHTML = '<div class="hep-drills">' + drills.map((d, idx) => `
    <div class="hep-drill">
      <div class="hep-drill-num">${idx + 1}</div>
      <div class="hep-drill-body">
        <div class="hep-drill-name">${d.name}</div>
        <div class="hep-drill-muscle">${d.targetMuscle}</div>
        <div class="hep-drill-rx">${d.sets} × ${d.reps}${d.side ? ' &mdash; ' + d.side : ''}</div>
        <div class="hep-drill-cue">${d.cue}</div>
        ${d.evidence ? `<div class="hep-drill-evidence">${d.evidence}</div>` : ''}
      </div>
    </div>
  `).join('') + '</div>';
}

/* ══════════════════════════════════════════
   TABS
   ══════════════════════════════════════════ */
function switchTab(btn, paneId) {
  const group = btn.closest('.tabs').dataset.group || btn.closest('.tabs').id || 'default';
  btn.closest('.tabs').querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');

  // Find sibling tab panes
  const paneContainer = btn.closest('.card') || document;
  paneContainer.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(paneId);
  if (target) target.classList.add('active');
}

/* ══════════════════════════════════════════
   SESSION CONFIG MODAL
   ══════════════════════════════════════════ */
function openSessionConfig() {
  document.getElementById('sessionModal').style.display = 'flex';
}
function closeSessionConfig() {
  document.getElementById('sessionModal').style.display = 'none';
}
function applySessionConfig() {
  sessionConfig.targetReps = parseInt(document.getElementById('cfgReps').value) || 8;
  sessionConfig.loadLabel  = document.getElementById('cfgLoad').value || '—';
  const mass = parseFloat(document.getElementById('cfgMass').value) || 80;
  sim.subjectMassKg = mass;

  setEl('sessionLoad',      sessionConfig.loadLabel);
  setEl('sessionTargetReps', sessionConfig.targetReps);
  setEl('statRepsDenom',    sessionConfig.targetReps);
  document.getElementById('targetRepsInput').value = sessionConfig.targetReps;
  document.getElementById('loadInput').value       = sessionConfig.loadLabel;

  closeSessionConfig();
}

/* ══════════════════════════════════════════
   EXPORT CSV
   ══════════════════════════════════════════ */
function exportCSV() {
  if (!sim.repForces.length) {
    showToast('⚠ Complete a set first to export data.');
    return;
  }
  const ex = getExercise(currentExerciseId);
  const rows = [
    ['Stratify Performance Lab — Set Export'],
    ['Exercise', ex.label],
    ['Set', sessionConfig.setNumber - 1],
    ['Date', new Date().toLocaleDateString()],
    ['Clinician', 'Dr. Chris King PT, DPT, B.S. Kinesiology'],
    [],
    ['Rep', 'Peak Force (N)', 'Quality Score', 'Notes'],
    ...sim.repForces.map((f, i) => [
      i+1, f, sim.repScores[i] || '—',
      i+1 >= sim._faultRep ? 'Fatigue/form fault detected' : 'Clean'
    ]),
    [],
    ['Avg Force (N)', Math.round(sim.repForces.reduce((a,b)=>a+b,0)/sim.repForces.length)],
    ['Avg Score', Math.round(sim.repScores.reduce((a,b)=>a+b,0)/sim.repScores.length)],
    ['DISCLAIMER', 'AI-generated analysis. For educational purposes only. Not medical advice.'],
  ];

  const csv  = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `stratify_${currentExerciseId}_set${sessionConfig.setNumber - 1}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('✓ Data exported as CSV');
}

/* ══════════════════════════════════════════
   TOAST NOTIFICATION
   ══════════════════════════════════════════ */
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

/* ══════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════ */
function setEl(id, html) {
  const el = document.getElementById(id);
  if (el) {
    if (typeof html === 'string' && html.includes('<')) {
      el.innerHTML = html;
    } else {
      el.textContent = html;
    }
  }
}

function doc(ns, tag) {
  return document.createElementNS(ns, tag);
}

function startIcon() {
  return `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>`;
}
function stopIcon() {
  return `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`;
}
