/**
 * simulation.js — Biomechanics Simulation Engine
 * Stratify Performance Lab
 *
 * Drives a realistic exercise simulation:
 *  - Rep phase cycling (setup → eccentric → bottom → concentric)
 *  - Joint angle interpolation with jitter
 *  - Ground reaction force estimation (simplified GRF model)
 *  - Movement quality scoring
 *  - Fatigue modeling across reps
 *
 * Educational use only. Not a substitute for clinical evaluation.
 */

class BiomechanicsSimulation {
  constructor() {
    this.exercise     = null;
    this.isRunning    = false;
    this._raf         = null;
    this._lastTick    = 0;

    // Session state
    this.repCount      = 0;
    this.targetReps    = 8;
    this.setNumber     = 1;
    this.subjectMassKg = 80;

    // Per-rep data
    this.repForces     = [];
    this.repScores     = [];

    // Current frame state
    this.phase         = 'setup';   // setup | eccentric | bottom | concentric
    this._phaseTime    = 0;         // seconds elapsed in this phase
    this._phaseDur     = { setup:1.0, eccentric:2.0, bottom:0.5, concentric:1.5 };

    // Interpolated angles (0=top position, 1=bottom position)
    this._depth        = 0;         // 0.0–1.0
    this._targetDepth  = 0;

    // Quality fault state
    this._faultRep     = -1;
    this._hasValgus    = false;

    // Callbacks
    this.onFrame      = null;  // called every animation tick
    this.onRepComplete = null; // called when a rep finishes
    this.onSetComplete = null; // called when targetReps reached

    // Force tracking
    this._peakForceThisRep  = 0;
    this._forceHistory      = [];
  }

  /* ── Public API ─────────────────────────────────────────── */

  load(exerciseId, targetReps, subjectMassKg) {
    this.exercise      = getExercise(exerciseId);
    this.targetReps    = targetReps;
    this.subjectMassKg = subjectMassKg;
    this._reset();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning  = true;
    this._lastTick  = performance.now();
    this._schedule();
  }

  stop() {
    this.isRunning = false;
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    return this._buildSetSummary();
  }

  reset() {
    this.stop();
    this._reset();
  }

  /* ── Internal ────────────────────────────────────────────── */

  _reset() {
    this.repCount        = 0;
    this.repForces       = [];
    this.repScores       = [];
    this.phase           = 'setup';
    this._phaseTime      = 0;
    this._depth          = 0;
    this._targetDepth    = 0;
    this._peakForceThisRep = 0;
    this._forceHistory   = [];
    this._faultRep       = Math.floor(Math.random() * 3) + 3; // fault appears rep 3-5
    this._hasValgus      = false;
  }

  _schedule() {
    this._raf = requestAnimationFrame((ts) => {
      if (!this.isRunning) return;
      const dt = Math.min((ts - this._lastTick) / 1000, 0.1); // seconds, capped
      this._lastTick = ts;
      this._tick(dt);
      this._schedule();
    });
  }

  _tick(dt) {
    this._phaseTime += dt;

    // Advance depth based on phase
    switch (this.phase) {
      case 'setup':
        this._depth = 0;
        if (this._phaseTime >= this._phaseDur.setup) this._nextPhase('eccentric');
        break;

      case 'eccentric':
        this._depth = Math.min(this._phaseTime / this._phaseDur.eccentric, 1.0);
        if (this._phaseTime >= this._phaseDur.eccentric) this._nextPhase('bottom');
        break;

      case 'bottom':
        this._depth = 1.0;
        if (this._phaseTime >= this._phaseDur.bottom) this._nextPhase('concentric');
        break;

      case 'concentric':
        this._depth = Math.max(1.0 - this._phaseTime / this._phaseDur.concentric, 0.0);
        if (this._phaseTime >= this._phaseDur.concentric) {
          this._depth = 0;
          this._completeRep();
          this._nextPhase('eccentric'); // start next rep immediately
        }
        break;
    }

    // Build frame and dispatch
    if (this.onFrame) {
      this.onFrame(this._buildFrame());
    }
  }

  _nextPhase(p) {
    this.phase      = p;
    this._phaseTime = 0;
  }

  _completeRep() {
    this.repCount++;

    // Quality degrades with fatigue
    const fatiguePenalty = (this.repCount - 1) * (2.5 + Math.random() * 1.5);
    const faultPenalty   = (this.repCount >= this._faultRep) ? (5 + Math.random() * 8) : 0;
    const baseScore      = 90 + Math.random() * 5;
    const score          = Math.max(60, Math.round(baseScore - fatiguePenalty - faultPenalty));
    this._hasValgus      = (this.repCount >= this._faultRep);

    // Force estimate (simplified GRF × bodyweight)
    const bodyweightN     = this.subjectMassKg * 9.81;
    const fm              = this.exercise.forceMultiplier;
    const forceVariance   = 0.9 + Math.random() * 0.2;
    const fatigueFactor   = 1 - (this.repCount - 1) * 0.015;
    const force           = Math.round(bodyweightN * fm * forceVariance * fatigueFactor);

    this.repForces.push(force);
    this.repScores.push(score);
    this._peakForceThisRep = 0; // reset for next rep

    if (this.onRepComplete) {
      this.onRepComplete({ repNum: this.repCount, force, score, hasValgus: this._hasValgus });
    }

    if (this.repCount >= this.targetReps) {
      this.isRunning = false;
      if (this.onSetComplete) {
        this.onSetComplete(this._buildSetSummary());
      }
    }
  }

  _buildFrame() {
    const ex    = this.exercise;
    const d     = this._depth; // 0=top, 1=bottom
    const noise = () => (Math.random() - 0.5) * 2.5; // small jitter

    // Interpolate joint angles between top (rest) and bottom (depth) positions
    const base  = ex.baseAngles;
    const angles = {};
    for (const [key, val] of Object.entries(base)) {
      angles[key] = Math.round(val * d + (val * 0.08) * (1 - d) + noise());
    }

    // Force: peaks in concentric phase
    const bodyweightN = this.subjectMassKg * 9.81;
    let phaseMult = 1.0;
    if (this.phase === 'concentric')   phaseMult = 1.3 + (1 - this._depth) * 0.4;
    if (this.phase === 'eccentric')    phaseMult = 0.8 + this._depth * 0.3;
    if (this.phase === 'bottom')       phaseMult = 1.1;
    const fatigue  = 1 - (this.repCount) * 0.012;
    const forceN   = Math.round(bodyweightN * ex.forceMultiplier * phaseMult * fatigue * (0.92 + Math.random() * 0.16));

    const depthPct = Math.round(d * 95 + 5);

    // Tempo: track approximate eccentric:isometric:concentric ratio
    const tempo = '2:1:2';

    return {
      type:       'frame',
      phase:      this.phase,
      repCount:   this.repCount,
      depthPct,
      forceN,
      tempo,
      angles,
      hasValgus:  this._hasValgus,
      fatigueFlag: this.repCount >= this._faultRep,
    };
  }

  _buildSetSummary() {
    if (!this.repForces.length) return null;

    const avgForce  = Math.round(this.repForces.reduce((a,b) => a+b, 0) / this.repForces.length);
    const peakForce = Math.max(...this.repForces);
    const avgScore  = Math.round(this.repScores.reduce((a,b) => a+b, 0) / this.repScores.length);
    const fatigue   = this.repForces.length > 1
      ? Math.round((1 - this.repForces[this.repForces.length - 1] / this.repForces[0]) * 100)
      : 0;

    const grade = avgScore >= 88 ? 'Excellent' :
                  avgScore >= 78 ? 'Good — Minor Corrections Needed' :
                  avgScore >= 65 ? 'Fair — Form Improvements Required' :
                                   'Poor — Reduce Load & Focus on Technique';

    const summaryText = this._buildSummaryText(avgScore, avgForce, peakForce, fatigue);

    return {
      exercise:     this.exercise.label,
      setNumber:    this.setNumber,
      targetReps:   this.targetReps,
      completedReps:this.repCount,
      avgScore,
      avgForce,
      peakForce,
      fatiguePct:   fatigue,
      repForces:    [...this.repForces],
      repScores:    [...this.repScores],
      grade,
      summaryText,
      recommendations: this.exercise.recommendations,
      hasValgus:        this._hasValgus,
    };
  }

  _buildSummaryText(avgScore, avgForce, peakForce, fatigue) {
    const ex   = this.exercise;
    const reps = this.repCount;
    const faultRep = this._faultRep;

    const scoreContext = avgScore >= 88 ? 'Movement quality was consistently high.' :
                         avgScore >= 78 ? `Movement quality was good through rep ${faultRep - 1}, with notable degradation thereafter.` :
                         `Significant form breakdown occurred beginning at rep ${faultRep}.`;

    const forceContext = fatigue > 12 ? `A ${fatigue}% force reduction across the set indicates moderate fatigue accumulation.` :
                         fatigue > 5  ? `A ${fatigue}% force reduction is within acceptable range.` :
                         `Force output was consistent across the set — strong endurance profile.`;

    return `${reps} of ${this.targetReps} reps completed. ${scoreContext} Avg estimated peak force ${avgForce}N (peak ${peakForce}N on Rep 1). ${forceContext} See Clinical Recommendations below.`;
  }
}

/* ── Force Estimation (standalone, for display) ─────────────
   Simplified GRF model: F = m × a × loadFactor
   where a is estimated from depth change rate.
   This is for educational demonstration only.
   ─────────────────────────────────────────────────────────── */
function estimateGRF(massKg, phaseMultiplier, exerciseMultiplier) {
  const g = 9.81;
  return Math.round(massKg * g * phaseMultiplier * exerciseMultiplier);
}

function lerp(a, b, t) { return a + (b - a) * t; }
