/**
 * camera.js — MediaPipe BlazePose Camera Integration
 * Stratify Performance Lab
 *
 * Replaces the simulation engine with real pose data from the device camera.
 * Uses MediaPipe BlazePose (via CDN) to extract 33 body landmarks,
 * computes joint angles for squat and push-up (sagittal view),
 * detects rep phases, and feeds data into the existing app.js callbacks
 * (handleFrame, handleRepComplete, handleSetComplete) unchanged.
 *
 * Supported exercises (sagittal view): squat, pushup
 * Phone position: side-on, full body visible
 *
 * Educational use only. Not a substitute for clinical evaluation.
 */

'use strict';

/* ══════════════════════════════════════════
   MEDIAPIPE LANDMARK INDICES
   BlazePose 33-point model
   ══════════════════════════════════════════ */
const LM = {
  NOSE:           0,
  LEFT_SHOULDER:  11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW:     13,
  RIGHT_ELBOW:    14,
  LEFT_WRIST:     15,
  RIGHT_WRIST:    16,
  LEFT_HIP:       23,
  RIGHT_HIP:      24,
  LEFT_KNEE:      25,
  RIGHT_KNEE:     26,
  LEFT_ANKLE:     27,
  RIGHT_ANKLE:    28,
  LEFT_HEEL:      29,
  RIGHT_HEEL:     30,
  LEFT_FOOT:      31,
  RIGHT_FOOT:     32,
};

/* ══════════════════════════════════════════
   CAMERA CONTROLLER CLASS
   ══════════════════════════════════════════ */
class CameraController {
  constructor() {
    this.isRunning      = false;
    this.exerciseId     = 'squat';
    this.targetReps     = 8;
    this.subjectMassKg  = 80;
    this.setNumber      = 1;

    // Callbacks — same interface as BiomechanicsSimulation
    this.onFrame        = null;
    this.onRepComplete  = null;
    this.onSetComplete  = null;

    // MediaPipe + video elements
    this._pose          = null;
    this._camera        = null;
    this._videoEl       = null;
    this._canvasEl      = null;
    this._canvasCtx     = null;

    // Rep tracking state
    this._phase         = 'setup';
    this._repCount      = 0;
    this._repForces     = [];
    this._repScores     = [];
    this._depthHistory  = [];   // rolling window for smoothing
    this._phaseHistory  = [];   // for phase transition debouncing
    this._inRep         = false;
    this._repStartDepth = 0;
    this._peakDepth     = 0;
    this._framesSincePhaseChange = 0;

    // Angle smoothing
    this._angleBuffer   = {};   // key → last N values
    this._bufferSize    = 6;

    // Score tracking
    this._repQualityFlags = [];
    this._hasValgus       = false;

    // Thresholds (set per exercise in _loadExerciseConfig)
    this._cfg = {};
  }

  /* ── Public API (mirrors BiomechanicsSimulation) ────────── */

  load(exerciseId, targetReps, subjectMassKg) {
    this.exerciseId     = exerciseId;
    this.targetReps     = targetReps;
    this.subjectMassKg  = subjectMassKg;
    this._loadExerciseConfig(exerciseId);
    this._resetRepState();
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this._resetRepState();
    await this._initMediaPipe();
  }

  stop() {
    this.isRunning = false;
    this._stopCamera();
    return this._buildSetSummary();
  }

  /* ── Exercise Config ────────────────────────────────────── */

  _loadExerciseConfig(id) {
    const configs = {
      squat: {
        // Knee angle thresholds for phase detection (sagittal, degrees)
        repStartAngle:  155,  // knee angle that triggers eccentric start (from standing)
        repBottomAngle:  95,  // knee angle that counts as "at depth"
        repTopAngle:    160,  // knee angle that counts as "back to standing"
        minRepDepth:     0.3, // minimum normalised depth to count a rep
        // Valgus: compare left vs right knee x-position relative to ankle
        checkValgus: true,
        // Force multiplier (matches exercises.js)
        forceMultiplier: 1.8,
        // Which landmarks to use for primary angle (knee)
        primaryAngle: { a: LM.LEFT_HIP, b: LM.LEFT_KNEE, c: LM.LEFT_ANKLE },
        // Additional angles to report
        angles: {
          hip:   { a: LM.LEFT_SHOULDER, b: LM.LEFT_HIP,   c: LM.LEFT_KNEE  },
          kneeL: { a: LM.LEFT_HIP,      b: LM.LEFT_KNEE,  c: LM.LEFT_ANKLE },
          kneeR: { a: LM.RIGHT_HIP,     b: LM.RIGHT_KNEE, c: LM.RIGHT_ANKLE},
          ankle: { a: LM.LEFT_KNEE,     b: LM.LEFT_ANKLE, c: LM.LEFT_FOOT  },
          trunk: { a: LM.LEFT_HIP,      b: LM.LEFT_SHOULDER, c: null       },
        }
      },
      pushup: {
        repStartAngle:  155,  // elbow angle from extended
        repBottomAngle:  90,  // elbow at bottom
        repTopAngle:    150,  // elbow back to top
        minRepDepth:     0.3,
        checkValgus: false,
        forceMultiplier: 0.65,
        primaryAngle: { a: LM.LEFT_SHOULDER, b: LM.LEFT_ELBOW, c: LM.LEFT_WRIST },
        angles: {
          elbowL:   { a: LM.LEFT_SHOULDER,  b: LM.LEFT_ELBOW,  c: LM.LEFT_WRIST  },
          elbowR:   { a: LM.RIGHT_SHOULDER, b: LM.RIGHT_ELBOW, c: LM.RIGHT_WRIST },
          shoulder: { a: LM.LEFT_HIP,       b: LM.LEFT_SHOULDER, c: LM.LEFT_ELBOW},
          hip:      { a: LM.LEFT_SHOULDER,  b: LM.LEFT_HIP,    c: LM.LEFT_KNEE   },
          spine:    { a: LM.LEFT_HIP,       b: LM.LEFT_SHOULDER, c: null          },
        }
      }
    };
    this._cfg = configs[id] || configs.squat;
  }

  /* ── MediaPipe Init ─────────────────────────────────────── */

  async _initMediaPipe() {
    // Create hidden video + canvas elements
    this._videoEl = document.getElementById('cameraVideo');
    this._canvasEl = document.getElementById('cameraCanvas');

    if (!this._videoEl || !this._canvasEl) {
      console.error('Camera elements not found. Make sure cameraVideo and cameraCanvas exist in the DOM.');
      return;
    }

    this._canvasCtx = this._canvasEl.getContext('2d');

    // Load MediaPipe Pose
    // Loaded via CDN script tags in index.html — see instructions below
    if (typeof Pose === 'undefined') {
      console.error('MediaPipe Pose not loaded. Add CDN scripts to index.html.');
      this.isRunning = false;
      return;
    }

    this._pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
    });

    this._pose.setOptions({
      modelComplexity: 1,        // 0=lite, 1=full, 2=heavy — 1 is best balance for mobile
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5
    });

    this._pose.onResults((results) => this._onPoseResults(results));

    // Start camera
    this._camera = new Camera(this._videoEl, {
      onFrame: async () => {
        if (this.isRunning) {
          await this._pose.send({ image: this._videoEl });
        }
      },
      // Portrait orientation for iPhone propped on side
      width: 720,
      height: 1280,
      facingMode: 'environment'  // rear camera
    });

    await this._camera.start();
    console.log('[Stratify Camera] MediaPipe camera started');
  }

  _stopCamera() {
    if (this._camera) {
      this._camera.stop();
      this._camera = null;
    }
    if (this._pose) {
      this._pose.close();
      this._pose = null;
    }
    // Clear video
    if (this._videoEl && this._videoEl.srcObject) {
      this._videoEl.srcObject.getTracks().forEach(t => t.stop());
      this._videoEl.srcObject = null;
    }
  }

  /* ── Pose Results Handler ───────────────────────────────── */

  _onPoseResults(results) {
    if (!this.isRunning) return;
    if (!results.poseLandmarks) return;

    const lm = results.poseLandmarks;

    // Draw camera feed + skeleton overlay on canvas
    this._drawOverlay(results);

    // Compute all joint angles for this exercise
    const angles = this._computeAngles(lm);

    // Get primary angle (drives rep detection)
    const primaryAngle = this._getPrimaryAngle(lm);

    // Smooth primary angle
    const smoothed = this._smooth('primary', primaryAngle);

    // Detect rep phase
    const prevPhase = this._phase;
    this._updatePhase(smoothed);

    // Compute depth (0=top, 1=bottom) from primary angle
    const cfg = this._cfg;
    const depthRaw = 1 - Math.max(0, Math.min(1,
      (smoothed - cfg.repBottomAngle) / (cfg.repStartAngle - cfg.repBottomAngle)
    ));
    const depth = Math.round(depthRaw * 100);

    // Estimate instantaneous force
    const forceN = this._estimateForce();

    // Check valgus (squat only)
    if (cfg.checkValgus) {
      this._hasValgus = this._detectValgus(lm);
    }

    // Build frame object — same shape as BiomechanicsSimulation._buildFrame()
    const frame = {
      type:        'frame',
      phase:       this._phase,
      repCount:    this._repCount,
      depthPct:    depth,
      forceN,
      tempo:       '—',
      angles,
      hasValgus:   this._hasValgus,
      fatigueFlag: false,
      // Extra: raw landmarks for advanced use
      landmarks:   lm,
    };

    if (this.onFrame) this.onFrame(frame);
  }

  /* ── Angle Computation ──────────────────────────────────── */

  /**
   * Compute angle at point B formed by A-B-C (degrees)
   * Uses landmark objects with {x, y, z, visibility}
   */
  _angleBetween(a, b, c) {
    if (!a || !b || !c) return 0;
    // Only use x,y for sagittal plane (ignore depth z for stability)
    const v1 = { x: a.x - b.x, y: a.y - b.y };
    const v2 = { x: c.x - b.x, y: c.y - b.y };
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag = Math.sqrt(v1.x**2 + v1.y**2) * Math.sqrt(v2.x**2 + v2.y**2);
    if (mag === 0) return 0;
    return Math.round(Math.acos(Math.max(-1, Math.min(1, dot / mag))) * (180 / Math.PI));
  }

  /**
   * Angle of a single segment relative to vertical (for trunk lean, etc.)
   */
  _segmentAngle(top, bottom) {
    if (!top || !bottom) return 0;
    const dx = bottom.x - top.x;
    const dy = bottom.y - top.y;
    return Math.round(Math.abs(Math.atan2(dx, dy) * (180 / Math.PI)));
  }

  _getPrimaryAngle(lm) {
    const cfg = this._cfg.primaryAngle;
    return this._angleBetween(lm[cfg.a], lm[cfg.b], lm[cfg.c]);
  }

  _computeAngles(lm) {
    const out = {};
    for (const [key, def] of Object.entries(this._cfg.angles)) {
      if (def.c === null) {
        // Segment angle (trunk lean)
        out[key] = this._segmentAngle(lm[def.a], lm[def.b]);
      } else {
        const raw = this._angleBetween(lm[def.a], lm[def.b], lm[def.c]);
        out[key] = this._smooth(key, raw);
      }
    }
    return out;
  }

  /* ── Angle Smoothing ────────────────────────────────────── */

  _smooth(key, value) {
    if (!this._angleBuffer[key]) this._angleBuffer[key] = [];
    const buf = this._angleBuffer[key];
    buf.push(value);
    if (buf.length > this._bufferSize) buf.shift();
    return Math.round(buf.reduce((a, b) => a + b, 0) / buf.length);
  }

  /* ── Rep Phase Detection ────────────────────────────────── */

  _updatePhase(primaryAngle) {
    const cfg = this._cfg;
    this._framesSincePhaseChange++;

    // Minimum frames before allowing a phase change (debounce ~0.3s at 30fps)
    const minFrames = 9;
    if (this._framesSincePhaseChange < minFrames) return;

    const prev = this._phase;

    switch (this._phase) {
      case 'setup':
        // Transition to eccentric when angle drops below repStartAngle
        if (primaryAngle < cfg.repStartAngle) {
          this._phase = 'eccentric';
          this._peakDepth = 0;
          this._framesSincePhaseChange = 0;
        }
        break;

      case 'eccentric':
        // Track deepest point
        const depthNow = cfg.repStartAngle - primaryAngle;
        if (depthNow > this._peakDepth) this._peakDepth = depthNow;

        // Transition to bottom when angle drops below repBottomAngle
        if (primaryAngle <= cfg.repBottomAngle) {
          this._phase = 'bottom';
          this._framesSincePhaseChange = 0;
        }
        // If they reversed before reaching depth, go back to setup
        if (primaryAngle >= cfg.repTopAngle) {
          this._phase = 'setup';
          this._peakDepth = 0;
          this._framesSincePhaseChange = 0;
        }
        break;

      case 'bottom':
        // Transition to concentric when angle starts increasing
        if (primaryAngle > cfg.repBottomAngle + 8) {
          this._phase = 'concentric';
          this._framesSincePhaseChange = 0;
        }
        break;

      case 'concentric':
        // Rep complete when angle returns to top
        if (primaryAngle >= cfg.repTopAngle) {
          this._completeRep(primaryAngle);
          this._phase = 'setup';
          this._framesSincePhaseChange = 0;
        }
        // If they dropped again before completing
        if (primaryAngle < cfg.repBottomAngle) {
          this._phase = 'bottom';
          this._framesSincePhaseChange = 0;
        }
        break;
    }
  }

  /* ── Rep Completion ─────────────────────────────────────── */

  _completeRep(finalAngle) {
    // Only count if they actually reached meaningful depth
    const depthReached = this._peakDepth / (this._cfg.repStartAngle - this._cfg.repBottomAngle);
    if (depthReached < this._cfg.minRepDepth) return;

    this._repCount++;

    // Score: based on depth achieved, valgus, and fatigue
    const depthScore   = Math.min(100, Math.round(depthReached * 100));
    const valgusDeduct = this._hasValgus ? 15 : 0;
    const fatigueDeduct = Math.max(0, (this._repCount - 1) * 2);
    const score = Math.max(55, Math.round(depthScore * 0.7 + 30 - valgusDeduct - fatigueDeduct));

    // Force estimate
    const force = this._estimateRepForce();

    this._repForces.push(force);
    this._repScores.push(score);
    this._peakDepth = 0;

    if (this.onRepComplete) {
      this.onRepComplete({
        repNum:    this._repCount,
        force,
        score,
        hasValgus: this._hasValgus
      });
    }

    if (this._repCount >= this.targetReps) {
      this.isRunning = false;
      const summary = this._buildSetSummary();
      if (this.onSetComplete) this.onSetComplete(summary);
    }
  }

  /* ── Force Estimation ───────────────────────────────────── */

  _estimateForce() {
    const bw       = this.subjectMassKg * 9.81;
    const phase    = this._phase;
    let mult = 1.0;
    if (phase === 'concentric') mult = 1.3;
    if (phase === 'bottom')     mult = 1.1;
    if (phase === 'eccentric')  mult = 0.85;
    const fatigue = Math.max(0.75, 1 - this._repCount * 0.012);
    return Math.round(bw * this._cfg.forceMultiplier * mult * fatigue);
  }

  _estimateRepForce() {
    const bw      = this.subjectMassKg * 9.81;
    const fatigue = Math.max(0.75, 1 - (this._repCount - 1) * 0.015);
    const variance = 0.95 + Math.random() * 0.1;
    return Math.round(bw * this._cfg.forceMultiplier * 1.25 * fatigue * variance);
  }

  /* ── Valgus Detection (Squat) ───────────────────────────── */

  /**
   * Knee valgus: left knee x-position should be >= left ankle x.
   * In sagittal view this is approximate — works best with slight frontal offset.
   */
  _detectValgus(lm) {
    const lKnee  = lm[LM.LEFT_KNEE];
    const lAnkle = lm[LM.LEFT_ANKLE];
    const rKnee  = lm[LM.RIGHT_KNEE];
    const rAnkle = lm[LM.RIGHT_ANKLE];

    if (!lKnee || !lAnkle || !rKnee || !rAnkle) return false;

    // Only check during bottom phase
    if (this._phase !== 'bottom' && this._phase !== 'eccentric') return false;

    // Valgus: knee caves medially (left knee x < left ankle x in normalized coords)
    const leftValgus  = (lKnee.x < lAnkle.x - 0.04);
    const rightValgus = (rKnee.x > rAnkle.x + 0.04);

    return leftValgus || rightValgus;
  }

  /* ── Canvas Overlay Drawing ─────────────────────────────── */

  _drawOverlay(results) {
    if (!this._canvasCtx || !this._canvasEl) return;

    const ctx = this._canvasCtx;
    const W   = this._canvasEl.width;
    const H   = this._canvasEl.height;

    ctx.clearRect(0, 0, W, H);

    // Draw camera feed
    if (results.image) {
      ctx.drawImage(results.image, 0, 0, W, H);
    }

    // Dark overlay tint
    ctx.fillStyle = 'rgba(8,12,18,0.35)';
    ctx.fillRect(0, 0, W, H);

    if (!results.poseLandmarks) return;

    const lm = results.poseLandmarks;

    // Helper: landmark → pixel coords
    const px = (l) => ({ x: l.x * W, y: l.y * H });

    // Draw skeleton connections
    const connections = [
      // Spine / torso
      [LM.LEFT_SHOULDER,  LM.RIGHT_SHOULDER],
      [LM.LEFT_HIP,       LM.RIGHT_HIP],
      [LM.LEFT_SHOULDER,  LM.LEFT_HIP],
      [LM.RIGHT_SHOULDER, LM.RIGHT_HIP],
      // Left arm
      [LM.LEFT_SHOULDER,  LM.LEFT_ELBOW],
      [LM.LEFT_ELBOW,     LM.LEFT_WRIST],
      // Right arm
      [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW],
      [LM.RIGHT_ELBOW,    LM.RIGHT_WRIST],
      // Left leg
      [LM.LEFT_HIP,       LM.LEFT_KNEE],
      [LM.LEFT_KNEE,      LM.LEFT_ANKLE],
      [LM.LEFT_ANKLE,     LM.LEFT_FOOT],
      // Right leg
      [LM.RIGHT_HIP,      LM.RIGHT_KNEE],
      [LM.RIGHT_KNEE,     LM.RIGHT_ANKLE],
      [LM.RIGHT_ANKLE,    LM.RIGHT_FOOT],
    ];

    // Draw bones
    connections.forEach(([ai, bi]) => {
      const a = lm[ai], b = lm[bi];
      if (!a || !b) return;
      if (a.visibility < 0.4 || b.visibility < 0.4) return;

      const pa = px(a), pb = px(b);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);

      // Highlight load-bearing bones in blue
      const isActive = [
        LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE,
        LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE
      ].includes(ai);

      ctx.strokeStyle = isActive ? 'rgba(58,171,255,0.85)' : 'rgba(255,255,255,0.4)';
      ctx.lineWidth   = isActive ? 3 : 1.5;
      ctx.stroke();
    });

    // Draw joints
    const keyJoints = [
      LM.LEFT_HIP,  LM.RIGHT_HIP,
      LM.LEFT_KNEE, LM.RIGHT_KNEE,
      LM.LEFT_ANKLE,LM.RIGHT_ANKLE,
      LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER,
      LM.LEFT_ELBOW, LM.RIGHT_ELBOW,
    ];

    keyJoints.forEach(idx => {
      const l = lm[idx];
      if (!l || l.visibility < 0.4) return;
      const p = px(l);

      const isKnee   = (idx === LM.LEFT_KNEE || idx === LM.RIGHT_KNEE);
      const valgusKnee = this._hasValgus && isKnee;

      ctx.beginPath();
      ctx.arc(p.x, p.y, isKnee ? 8 : 5, 0, Math.PI * 2);
      ctx.fillStyle = valgusKnee ? 'rgba(245,158,11,0.25)' : 'rgba(30,143,225,0.2)';
      ctx.fill();
      ctx.strokeStyle = valgusKnee ? '#F59E0B' : '#3AABFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Phase label overlay (top left)
    const phaseColors = {
      setup:      '#6B7894',
      eccentric:  '#A78BFA',
      bottom:     '#22D4A0',
      concentric: '#3AABFF',
    };
    ctx.fillStyle = phaseColors[this._phase] || '#6B7894';
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText(this._phase.toUpperCase(), 16, 28);

    // Valgus warning
    if (this._hasValgus) {
      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.fillText('⚠ VALGUS', 16, 50);
    }

    // Rep counter (top right)
    ctx.fillStyle = '#3AABFF';
    ctx.font = 'bold 20px "Barlow Condensed", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`REP ${this._repCount}/${this.targetReps}`, W - 16, 28);
    ctx.textAlign = 'left';
  }

  /* ── Set Summary ────────────────────────────────────────── */

  _buildSetSummary() {
    if (!this._repForces.length) return null;

    const ex        = getExercise(this.exerciseId);
    const avgForce  = Math.round(this._repForces.reduce((a,b) => a+b,0) / this._repForces.length);
    const peakForce = Math.max(...this._repForces);
    const avgScore  = Math.round(this._repScores.reduce((a,b) => a+b,0) / this._repScores.length);
    const fatigue   = this._repForces.length > 1
      ? Math.round((1 - this._repForces[this._repForces.length-1] / this._repForces[0]) * 100)
      : 0;

    const grade = avgScore >= 88 ? 'Excellent' :
                  avgScore >= 78 ? 'Good — Minor Corrections Needed' :
                  avgScore >= 65 ? 'Fair — Form Improvements Required' :
                                   'Poor — Reduce Load & Focus on Technique';

    return {
      exercise:      ex.label,
      setNumber:     this.setNumber,
      targetReps:    this.targetReps,
      completedReps: this._repCount,
      avgScore,
      avgForce,
      peakForce,
      fatiguePct:    fatigue,
      repForces:     [...this._repForces],
      repScores:     [...this._repScores],
      grade,
      summaryText:   `${this._repCount} reps completed via live camera. Avg force ${avgForce}N (peak ${peakForce}N). ${fatigue > 10 ? `${fatigue}% fatigue drop detected.` : 'Consistent force output.'} See Clinical Recommendations.`,
      recommendations: ex.recommendations,
      hasValgus:     this._hasValgus,
    };
  }

  _resetRepState() {
    this._phase               = 'setup';
    this._repCount            = 0;
    this._repForces           = [];
    this._repScores           = [];
    this._depthHistory        = [];
    this._angleBuffer         = {};
    this._peakDepth           = 0;
    this._hasValgus           = false;
    this._framesSincePhaseChange = 0;
  }

  /* ── Public getters (match BiomechanicsSimulation interface) */
  get repForces() { return this._repForces; }
  get repScores() { return this._repScores; }
  get _faultRep() { return this._repCount; }
}

/* ══════════════════════════════════════════
   CAMERA MODE TOGGLE — wires into app.js
   ══════════════════════════════════════════ */

// Global instance — used by app.js when camera mode is active
const camCtrl = new CameraController();
let cameraMode = false;

/**
 * Call this to switch between simulation and camera modes.
 * Wires camCtrl callbacks to the same handlers as the sim engine.
 */
function toggleCameraMode(enable) {
  cameraMode = enable;

  const btn        = document.getElementById('cameraModeBtn');
  const simBadge   = document.getElementById('simBadge');
  const camBadge   = document.getElementById('camBadge');
  const cameraPanel = document.getElementById('cameraPanel');

  if (enable) {
    // Show camera panel, hide sim badge
    if (cameraPanel) cameraPanel.style.display = 'flex';
    if (simBadge)    simBadge.style.display = 'none';
    if (camBadge)    camBadge.style.display = 'flex';
    if (btn)         btn.textContent = '📷 Camera: ON';
    showToast('📷 Camera mode active — point your phone at yourself from the side');
  } else {
    if (cameraPanel) cameraPanel.style.display = 'none';
    if (simBadge)    simBadge.style.display = 'flex';
    if (camBadge)    camBadge.style.display = 'none';
    if (btn)         btn.textContent = '📷 Use Camera';
    // Stop camera if running
    if (camCtrl.isRunning) camCtrl.stop();
  }
}

/**
 * Modified startAnalysis that checks cameraMode and routes accordingly.
 * Replace the existing startAnalysis() in app.js with this,
 * OR call activateCameraAnalysis() from a separate button.
 */
function startCameraAnalysis() {
  const ex = getExercise(currentExerciseId);
  sessionConfig.targetReps = parseInt(document.getElementById('targetRepsInput').value) || 8;
  sessionConfig.loadLabel  = document.getElementById('loadInput').value || '—';

  setEl('sessionLoad',       sessionConfig.loadLabel);
  setEl('sessionTargetReps', sessionConfig.targetReps);
  setEl('statRepsDenom',     sessionConfig.targetReps);

  // Wire callbacks — same as sim engine
  camCtrl.load(currentExerciseId, sessionConfig.targetReps, 80);
  camCtrl.setNumber      = sessionConfig.setNumber;
  camCtrl.onFrame        = handleFrame;
  camCtrl.onRepComplete  = handleRepComplete;
  camCtrl.onSetComplete  = handleSetComplete;

  camCtrl.start().catch(err => {
    showToast('⚠ Camera access denied. Check browser permissions.');
    console.error('[Stratify Camera] start error:', err);
    toggleCameraMode(false);
  });

  // Update button UI
  const btn = document.getElementById('startBtn');
  if (btn) {
    btn.classList.add('recording');
    btn.querySelector('span').textContent = 'Stop Analysis';
  }
  document.getElementById('recBadge').style.display = 'flex';
  renderSummary(null);
}

function stopCameraAnalysis() {
  const summary = camCtrl.stop();
  const btn = document.getElementById('startBtn');
  if (btn) {
    btn.classList.remove('recording');
    btn.querySelector('span').textContent = 'Start Analysis';
  }
  document.getElementById('recBadge').style.display = 'none';

  if (summary) {
    renderSummary(summary);
    renderRecommendations(summary.recommendations, true);
    renderForceChart(summary.repForces, sessionConfig.targetReps);
    renderHEP(prescribeHEP(currentExerciseId, summary));
    sessionConfig.setNumber++;
    setEl('sessionSetNum', sessionConfig.setNumber);
  }
}
