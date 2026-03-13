/**
 * hep.js — Home Exercise Program Prescription Engine
 * Stratify Performance Lab
 *
 * Maps detected movement faults to evidence-based corrective drills.
 * Educational use only. Not a substitute for clinical evaluation.
 */

'use strict';

/* ══════════════════════════════════════════
   DRILL LIBRARY
   ══════════════════════════════════════════ */
const HEP_DRILLS = {

  clamshell: {
    id: 'clamshell',
    name: 'Side-Lying Clamshell',
    targetMuscle: 'Gluteus Medius / Hip External Rotators',
    sets: 3, reps: '15', side: 'each side',
    cue: 'Side-lying, hips stacked at 45°. Open top knee like a clamshell without rotating the pelvis. Squeeze glute at top. Keep core braced throughout.',
    forFaults: ['valgus'],
    forExercises: ['squat', 'lunge', 'deadlift', 'hip_hinge'],
    priority: 1,
    evidence: 'Distefano et al. (2009) — Clamshell activates glute med at 56% MVIC; effective for dynamic valgus correction'
  },

  single_leg_glute_bridge: {
    id: 'single_leg_glute_bridge',
    name: 'Single-Leg Glute Bridge',
    targetMuscle: 'Glute Max / Glute Med / Hip Stabilizers',
    sets: 3, reps: '12', side: 'each side',
    cue: 'Supine, one foot flat. Extend opposite leg. Drive through heel, squeeze glute at top. Keep hips perfectly level — no trunk rotation or hip drop.',
    forFaults: ['valgus', 'fatigue'],
    forExercises: ['squat', 'lunge', 'deadlift', 'hip_hinge'],
    priority: 1,
    evidence: 'Khayambashi et al. (2012) — Isolated hip strengthening reduces knee valgus and patellofemoral pain'
  },

  lateral_band_walk: {
    id: 'lateral_band_walk',
    name: 'Lateral Band Walk',
    targetMuscle: 'Glute Med / TFL / Hip Abductors',
    sets: 3, reps: '15 steps', side: 'each direction',
    cue: 'Resistance band above knees. Athletic stance, slight knee bend. Step laterally keeping toes forward, knees tracking over 2nd toe. Maintain tension throughout — never let feet come together.',
    forFaults: ['valgus'],
    forExercises: ['squat', 'lunge'],
    priority: 2,
    evidence: 'Fredericson et al. (2000) — Hip abductor strengthening reduces IT band syndrome and valgus loading patterns'
  },

  step_down_eccentric: {
    id: 'step_down_eccentric',
    name: 'Single-Leg Step Down (Eccentric)',
    targetMuscle: 'Quad / Glute Med / Knee Stabilizers',
    sets: 3, reps: '10', side: 'each side',
    cue: 'Stand on a 6–8" step. Slowly lower opposite heel toward floor over 4 counts, keeping stance knee tracking over 2nd toe. Step back up. Use wall for balance if needed.',
    forFaults: ['valgus', 'fatigue'],
    forExercises: ['lunge', 'squat'],
    priority: 2,
    evidence: 'Eccentric quad loading at functional angles reduces patellofemoral pain and corrects valgus landing mechanics'
  },

  ankle_dorsiflexion_mob: {
    id: 'ankle_dorsiflexion_mob',
    name: 'Ankle Dorsiflexion Mobilization',
    targetMuscle: 'Ankle / Soleus / Posterior Capsule',
    sets: 2, reps: '10 × 5s hold', side: 'each side',
    cue: 'Lunge stance, front foot 4" from wall. Drive knee over 5th toe toward wall without heel rising. Hold 5 seconds. Progress by moving foot further from wall over time.',
    forFaults: ['depth'],
    forExercises: ['squat', 'lunge'],
    priority: 1,
    evidence: 'Backman & Danielson (2011) — Restricted ankle dorsiflexion directly increases knee valgus and limits squat depth'
  },

  hip_90_90: {
    id: 'hip_90_90',
    name: 'Hip 90/90 Mobility Drill',
    targetMuscle: 'Hip Flexors / Hip Capsule / Piriformis',
    sets: 2, reps: '60s hold', side: 'each side',
    cue: 'Seated with front and back hips at 90°. Maintain tall spine. Hinge forward from the hip — not the waist — until you feel a stretch. Breathe. Hold. Switch sides.',
    forFaults: ['depth', 'score'],
    forExercises: ['squat', 'lunge', 'hip_hinge', 'deadlift'],
    priority: 2,
    evidence: 'Hip capsule restrictions force compensatory lumbar flexion and directly limit squat depth and hinge mechanics'
  },

  tempo_squat: {
    id: 'tempo_squat',
    name: '3-Second Tempo Squat',
    targetMuscle: 'Quad / Glute / Core — Eccentric Control',
    sets: 3, reps: '8', side: null,
    cue: '3-count descent, 1-count pause at bottom, 2-count ascent. Reduce load 30–40% from working weight. Prioritize form quality and depth over intensity.',
    forFaults: ['fatigue', 'score'],
    forExercises: ['squat'],
    priority: 2,
    evidence: 'Tempo training improves neuromuscular coordination and reduces injury risk by increasing eccentric time under tension'
  },

  hip_hinge_dowel: {
    id: 'hip_hinge_dowel',
    name: 'Dowel Hip Hinge Drill',
    targetMuscle: 'Hamstrings / Glutes / Lumbar Extensors',
    sets: 3, reps: '12', side: null,
    cue: 'Hold dowel with 3 points of contact: head, thoracic spine, sacrum. Hinge at the hip maintaining all 3 contacts. No lumbar flexion. Push hips back toward wall behind you.',
    forFaults: ['score', 'fatigue'],
    forExercises: ['deadlift', 'hip_hinge'],
    priority: 1,
    evidence: 'Dowel constraint provides real-time proprioceptive feedback for neutral spine during hip hinge pattern retraining'
  },

  romanian_dl_bw: {
    id: 'romanian_dl_bw',
    name: 'Romanian DL — Bodyweight',
    targetMuscle: 'Hamstrings / Glute Max / Lumbar Extensors',
    sets: 3, reps: '10', side: null,
    cue: 'Hip-width stance, slight knee bend. Push hips back and hinge until you feel a hamstring stretch. Keep hands close to body, neutral spine. Drive hips forward to stand. No rounding.',
    forFaults: ['fatigue', 'score'],
    forExercises: ['deadlift'],
    priority: 2,
    evidence: 'Bodyweight RDL reinforces the hip hinge motor pattern and hamstring loading mechanics before adding external load'
  },

  band_pull_apart: {
    id: 'band_pull_apart',
    name: 'Band Pull-Apart',
    targetMuscle: 'Posterior Deltoid / Rhomboids / Lower Trapezius',
    sets: 3, reps: '20', side: null,
    cue: 'Arms at shoulder height, overhand grip on band. Pull band apart squeezing shoulder blades. Control the return. Soft elbows, no shrugging or trunk extension.',
    forFaults: ['valgus', 'score'],
    forExercises: ['pushup', 'shoulder_press'],
    priority: 1,
    evidence: 'Posterior shoulder strengthening corrects scapular dyskinesis linked to shoulder impingement and press faults'
  },

  serratus_wall_slide: {
    id: 'serratus_wall_slide',
    name: 'Wall Slide (Serratus Activation)',
    targetMuscle: 'Serratus Anterior / Lower Trapezius',
    sets: 3, reps: '10', side: null,
    cue: 'Forearms on wall, elbows at 90°. Push wall away — feel shoulder blades protract and wrap around ribcage. Slide arms overhead. Lower with control.',
    forFaults: ['score', 'fatigue'],
    forExercises: ['pushup', 'shoulder_press'],
    priority: 2,
    evidence: 'Serratus anterior is the primary scapular stabilizer — weakness leads to winging and shoulder impingement risk'
  },

  rotator_cuff_er: {
    id: 'rotator_cuff_er',
    name: 'Band External Rotation',
    targetMuscle: 'Infraspinatus / Teres Minor / Posterior Rotator Cuff',
    sets: 3, reps: '15', side: 'each side',
    cue: 'Elbow at side, 90° flexion, small towel roll under arm. Rotate forearm outward against band resistance. 3-count return. No trunk rotation or shoulder shrug.',
    forFaults: ['valgus', 'score'],
    forExercises: ['shoulder_press', 'pushup'],
    priority: 1,
    evidence: 'Ager et al. (2017) — Rotator cuff strengthening reduces shoulder impingement and improves overhead press stability'
  },

  dead_bug: {
    id: 'dead_bug',
    name: 'Dead Bug',
    targetMuscle: 'Deep Core / Transversus Abdominis / Diaphragm',
    sets: 3, reps: '8', side: 'each side',
    cue: 'Supine, arms up, hips and knees at 90°. Brace core — create 360° tension. Slowly extend opposite arm and leg toward floor without arching low back. Return. Breathe throughout.',
    forFaults: ['fatigue', 'score'],
    forExercises: ['squat', 'deadlift', 'pushup', 'shoulder_press', 'lunge', 'hip_hinge'],
    priority: 3,
    evidence: 'McGill (2010) — Abdominal bracing strategies superior to hollowing for lumbar spine stability under loaded tasks'
  }

};

/* ══════════════════════════════════════════
   PRESCRIPTION ENGINE
   ══════════════════════════════════════════ */
/**
 * prescribeHEP
 * Given an exercise and set summary, returns an ordered array of
 * corrective drill objects (max 4) targeting detected faults.
 *
 * @param {string} exerciseId  — e.g. 'squat'
 * @param {object} summary     — from BiomechanicsSimulation._buildSetSummary()
 * @returns {Array}            — ordered drill objects, priority ascending
 */
function prescribeHEP(exerciseId, summary) {
  const faults = new Set();

  // Detect valgus (knee cave)
  if (summary.hasValgus) faults.add('valgus');

  // Detect fatigue (>15% force drop across set)
  if (summary.fatiguePct > 15) faults.add('fatigue');

  // Detect general form breakdown
  if (summary.avgScore < 80) faults.add('score');

  // Detect mobility-related depth limitation
  if (summary.avgScore < 83 && ['squat', 'lunge'].includes(exerciseId)) {
    faults.add('depth');
  }

  // Every prescription includes at least score-based drills
  if (faults.size === 0) faults.add('score');

  const faultArray = Array.from(faults);

  // Filter: must match this exercise AND at least one detected fault
  const candidates = Object.values(HEP_DRILLS).filter(drill =>
    drill.forExercises.includes(exerciseId) &&
    drill.forFaults.some(f => faultArray.includes(f))
  );

  // Sort by priority (1 = highest), limit to 4 drills
  return candidates
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 4);
}
