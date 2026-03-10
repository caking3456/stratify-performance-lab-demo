/**
 * exercises.js — Exercise Library
 * Stratify Performance Lab
 *
 * Each exercise defines:
 *  - label, category, description
 *  - muscles: primary and stabilizer activation (0–100%)
 *  - joints: names and optimal angle ranges
 *  - phases: biomechanical phase labels
 *  - skeleton: SVG path data for each animation phase
 *  - recommendations: evidence-based coaching cues
 *  - forceMultiplier: scales GRF estimate relative to bodyweight
 */

const EXERCISES = {

  /* ── SQUAT ─────────────────────────────────────────────── */
  squat: {
    label: 'Back Squat',
    category: 'Lower Body — Knee Dominant',
    description: 'Bilateral compound movement requiring coordinated hip, knee, and ankle flexion under axial spinal load.',
    forceMultiplier: 1.8,
    phases: ['Setup', 'Eccentric', 'Bottom', 'Concentric'],

    muscles: {
      primary: [
        { name: 'Quadriceps',    pct: 92, color: 'linear-gradient(90deg,#EF4444,#F87171)', tag: 'primary' },
        { name: 'Gluteus Max.',  pct: 85, color: 'linear-gradient(90deg,#F59E0B,#FCD34D)', tag: 'primary' },
        { name: 'Hamstrings',   pct: 68, color: 'linear-gradient(90deg,#8B5CF6,#A78BFA)', tag: 'primary' },
      ],
      stabilizers: [
        { name: 'Erector Spinae', pct: 58, color: 'linear-gradient(90deg,#22D4A0,#6EE7B7)', tag: 'secondary' },
        { name: 'Core (TVA)',     pct: 49, color: 'linear-gradient(90deg,#22D4A0,#6EE7B7)', tag: 'secondary' },
        { name: 'Hip Abductors', pct: 42, color: 'linear-gradient(90deg,#1E8FE1,#3AABFF)', tag: 'secondary' },
        { name: 'Gastrocnemius', pct: 31, color: 'linear-gradient(90deg,#1E8FE1,#3AABFF)', tag: 'secondary' },
      ]
    },

    joints: [
      { name: 'Hip',    optMin: 60, optMax: 100, unit: '°', key: 'hip'    },
      { name: 'Knee L', optMin: 80, optMax: 105, unit: '°', key: 'kneeL'  },
      { name: 'Knee R', optMin: 80, optMax: 105, unit: '°', key: 'kneeR'  },
      { name: 'Ankle',  optMin: 20, optMax: 35,  unit: '°', key: 'ankle'  },
      { name: 'Spine',  optMin: 0,  optMax: 15,  unit: '°', key: 'spine'  },
      { name: 'Trunk',  optMin: 5,  optMax: 25,  unit: '°', key: 'trunk'  },
    ],

    // Base joint angles at depth (bottom)
    baseAngles: { hip: 76, kneeL: 89, kneeR: 91, ankle: 24, spine: 8, trunk: 14 },

    recommendations: [
      {
        priority: 'high',
        icon: '⚠',
        title: 'Monitor Knee Valgus',
        body: 'Medial knee collapse on the right side is a common fatigue fault. Cue "push knees out over 3rd toe." Address VMO and hip abductor weakness with targeted drills.',
        evidence: 'Myer et al. (2008) — Hip abductor weakness is associated with dynamic valgus and patellofemoral pain.'
      },
      {
        priority: 'med',
        icon: '💡',
        title: 'Optimize Intra-Abdominal Pressure',
        body: 'Core (TVA) activation under 50% suggests insufficient bracing. Teach 360° brace and Valsalva maneuver for spinal protection under heavy load.',
        evidence: 'McGill et al. (2003) — IAP is critical for spinal stability under axial compressive load.'
      },
      {
        priority: 'low',
        icon: '✓',
        title: 'Excellent Hip Hinge Mechanics',
        body: 'Posterior weight shift and trunk lean maintained within safe range. Reinforce this pattern — it is the foundation of safe squatting.',
        evidence: ''
      }
    ],

    // SVG skeleton definition for squat (bottom position)
    skeleton: {
      // [x1,y1,x2,y2] bone segments; 'a' = active bone
      bones: [
        { x1:130,y1:90,  x2:130,y2:200, active:false }, // spine
        { x1:100,y1:200, x2:160,y2:200, active:false }, // pelvis
        { x1:90, y1:110, x2:170,y2:110, active:false }, // shoulder girdle
        { x1:130,y1:110, x2:90, y2:150, active:false }, // L upper arm
        { x1:90, y1:150, x2:70, y2:195, active:false }, // L forearm
        { x1:130,y1:110, x2:170,y2:150, active:false }, // R upper arm
        { x1:170,y1:150, x2:190,y2:195, active:false }, // R forearm
        { x1:100,y1:200, x2:90, y2:277, active:true  }, // L thigh
        { x1:90, y1:277, x2:100,y2:352, active:true  }, // L shin
        { x1:100,y1:352, x2:100,y2:380, active:false }, // L foot
        { x1:160,y1:200, x2:170,y2:277, active:true  }, // R thigh
        { x1:170,y1:277, x2:160,y2:352, active:true  }, // R shin
        { x1:160,y1:352, x2:160,y2:380, active:false }, // R foot
      ],
      joints: [
        { cx:130,cy:68,  r:5,  warn:false, head:true  },
        { cx:130,cy:90,  r:5,  warn:false },
        { cx:90, cy:110, r:5,  warn:false },
        { cx:170,cy:110, r:5,  warn:false },
        { cx:70, cy:155, r:5,  warn:false },
        { cx:190,cy:155, r:5,  warn:false },
        { cx:65, cy:200, r:4,  warn:false },
        { cx:195,cy:200, r:4,  warn:false },
        { cx:100,cy:200, r:6,  warn:false },
        { cx:160,cy:200, r:6,  warn:false },
        { cx:90, cy:277, r:6,  warn:false, highlight:true },
        { cx:170,cy:277, r:6,  warn:true,  highlight:true },
        { cx:100,cy:352, r:5,  warn:false },
        { cx:160,cy:352, r:5,  warn:false },
      ],
      muscleOverlays: [
        { type:'ellipse', cls:'muscle-overlay quad',  cx:105,cy:285,rx:22,ry:42 },
        { type:'ellipse', cls:'muscle-overlay quad',  cx:155,cy:285,rx:22,ry:42 },
        { type:'ellipse', cls:'muscle-overlay glute', cx:130,cy:218,rx:30,ry:20 },
        { type:'ellipse', cls:'muscle-overlay core',  cx:130,cy:162,rx:18,ry:25 },
        { type:'ellipse', cls:'muscle-overlay ham',   cx:105,cy:258,rx:14,ry:28 },
        { type:'ellipse', cls:'muscle-overlay ham',   cx:155,cy:258,rx:14,ry:28 },
      ],
      annotations: [
        { text:'89°',  x:50,  y:290, cls:'angle-label', warn:false },
        { text:'91°',  x:178, y:290, cls:'angle-label', warn:true  },
        { text:'72°',  x:68,  y:223, cls:'angle-label', warn:false },
        { text:'8° fwd lean', x:85, y:148, cls:'angle-label', warn:false, small:true },
        { text:'⚠ VALGUS', x:185, y:255, cls:'angle-label', warn:true, small:true },
      ]
    }
  },

  /* ── DEADLIFT ──────────────────────────────────────────── */
  deadlift: {
    label: 'Deadlift (Conventional)',
    category: 'Lower Body — Hip Dominant',
    description: 'Bilateral hip hinge pulling pattern loading the posterior chain through a large range of hip flexion.',
    forceMultiplier: 2.2,
    phases: ['Setup', 'Drive', 'Lockout', 'Lower'],

    muscles: {
      primary: [
        { name: 'Gluteus Max.',  pct: 94, color: 'linear-gradient(90deg,#F59E0B,#FCD34D)', tag: 'primary' },
        { name: 'Hamstrings',   pct: 89, color: 'linear-gradient(90deg,#8B5CF6,#A78BFA)', tag: 'primary' },
        { name: 'Erector Spinae', pct: 78, color: 'linear-gradient(90deg,#22D4A0,#6EE7B7)', tag: 'primary' },
      ],
      stabilizers: [
        { name: 'Quadriceps',   pct: 52, color: 'linear-gradient(90deg,#EF4444,#F87171)', tag: 'secondary' },
        { name: 'Lats / LD',    pct: 64, color: 'linear-gradient(90deg,#1E8FE1,#3AABFF)', tag: 'secondary' },
        { name: 'Core (TVA)',   pct: 72, color: 'linear-gradient(90deg,#22D4A0,#6EE7B7)', tag: 'secondary' },
        { name: 'Forearm Flex.',pct: 38, color: 'linear-gradient(90deg,#1E8FE1,#3AABFF)', tag: 'secondary' },
      ]
    },

    joints: [
      { name: 'Hip',    optMin: 90, optMax: 140, unit: '°', key: 'hip'   },
      { name: 'Knee',   optMin: 20, optMax: 40,  unit: '°', key: 'knee'  },
      { name: 'Lumbar', optMin: 0,  optMax: 10,  unit: '°', key: 'lumbar'},
      { name: 'T-Spine',optMin: 0,  optMax: 20,  unit: '°', key: 'tspine'},
      { name: 'Hip Ext',optMin: 0,  optMax: 180, unit: '°', key: 'hipExt'},
      { name: 'Ankle',  optMin: 5,  optMax: 20,  unit: '°', key: 'ankle' },
    ],

    baseAngles: { hip: 118, knee: 28, lumbar: 7, tspine: 14, hipExt: 165, ankle: 10 },

    recommendations: [
      {
        priority: 'high',
        icon: '⚠',
        title: 'Maintain Neutral Lumbar Spine',
        body: 'Lumbar flexion under load significantly increases disc compressive force. Cue "chest up, proud chest." Strengthen spinal extensors and practice hip hinge with dowel rod assessment.',
        evidence: 'McGill (2002) — Lumbar flexion under load increases nucleus pulposus migration and disc stress up to 200%.'
      },
      {
        priority: 'med',
        icon: '💡',
        title: 'Lat Engagement at Liftoff',
        body: '"Protect your armpits" or "bend the bar" cue activates lats to maintain scapular depression, keeping the bar close and reducing moment arm.',
        evidence: 'Escamilla et al. (2002) — Lat activation reduces anterior bar drift and improves mechanical efficiency.'
      },
      {
        priority: 'low',
        icon: '✓',
        title: 'Strong Hip Drive at Lockout',
        body: 'Glute activation at lockout is excellent. Finish with glute squeeze, not lumbar hyperextension. Continue this pattern.',
        evidence: ''
      }
    ],

    skeleton: {
      bones: [
        { x1:140,y1:100, x2:120,y2:200, active:false }, // spine (leaned over)
        { x1:95, y1:200, x2:145,y2:200, active:false }, // pelvis
        { x1:100,y1:115, x2:175,y2:110, active:false }, // shoulder girdle
        { x1:100,y1:115, x2:75, y2:165, active:false }, // L upper arm
        { x1:75, y1:165, x2:65, y2:220, active:false }, // L forearm
        { x1:175,y1:110, x2:195,y2:160, active:false }, // R upper arm
        { x1:195,y1:160, x2:200,y2:215, active:false }, // R forearm
        { x1:95, y1:200, x2:95, y2:295, active:true  }, // L thigh
        { x1:95, y1:295, x2:100,y2:370, active:true  }, // L shin
        { x1:100,y1:370, x2:90, y2:385, active:false }, // L foot
        { x1:145,y1:200, x2:145,y2:295, active:true  }, // R thigh
        { x1:145,y1:295, x2:150,y2:370, active:true  }, // R shin
        { x1:150,y1:370, x2:160,y2:385, active:false }, // R foot
      ],
      joints: [
        { cx:148,cy:80,  r:5,  warn:false, head:true },
        { cx:140,cy:100, r:5,  warn:false },
        { cx:100,cy:115, r:5,  warn:false },
        { cx:175,cy:110, r:5,  warn:false },
        { cx:75, cy:167, r:4,  warn:false },
        { cx:195,cy:162, r:4,  warn:false },
        { cx:65, cy:222, r:4,  warn:false },
        { cx:200,cy:218, r:4,  warn:false },
        { cx:95, cy:200, r:6,  warn:false },
        { cx:145,cy:200, r:6,  warn:false },
        { cx:95, cy:295, r:6,  warn:false, highlight:true },
        { cx:145,cy:295, r:6,  warn:false, highlight:true },
        { cx:100,cy:370, r:5,  warn:false },
        { cx:150,cy:370, r:5,  warn:false },
      ],
      muscleOverlays: [
        { type:'ellipse', cls:'muscle-overlay glute', cx:120,cy:205,rx:30,ry:22 },
        { type:'ellipse', cls:'muscle-overlay ham',   cx:95, cy:248,rx:16,ry:40 },
        { type:'ellipse', cls:'muscle-overlay ham',   cx:145,cy:248,rx:16,ry:40 },
        { type:'ellipse', cls:'muscle-overlay back',  cx:130,cy:155,rx:20,ry:35 },
        { type:'ellipse', cls:'muscle-overlay core',  cx:128,cy:175,rx:15,ry:18 },
      ],
      annotations: [
        { text:'118°', x:60,  y:205, cls:'angle-label', warn:false },
        { text:'7° lumbar', x:80, y:140, cls:'angle-label', warn:false, small:true },
        { text:'28° knee', x:65, y:315, cls:'angle-label', warn:false, small:true },
      ]
    }
  },

  /* ── LUNGE ─────────────────────────────────────────────── */
  lunge: {
    label: 'Forward Lunge',
    category: 'Lower Body — Unilateral',
    description: 'Unilateral stepping pattern training single-leg stability, frontal plane control, and asymmetrical load tolerance.',
    forceMultiplier: 1.4,
    phases: ['Step', 'Descent', 'Bottom', 'Drive Back'],

    muscles: {
      primary: [
        { name: 'Quad (lead)',   pct: 88, color: 'linear-gradient(90deg,#EF4444,#F87171)', tag: 'primary' },
        { name: 'Glute (lead)',  pct: 80, color: 'linear-gradient(90deg,#F59E0B,#FCD34D)', tag: 'primary' },
        { name: 'Ham (trail)',   pct: 65, color: 'linear-gradient(90deg,#8B5CF6,#A78BFA)', tag: 'primary' },
      ],
      stabilizers: [
        { name: 'Hip Abductors', pct: 68, color: 'linear-gradient(90deg,#1E8FE1,#3AABFF)', tag: 'secondary' },
        { name: 'Core (QL)',     pct: 55, color: 'linear-gradient(90deg,#22D4A0,#6EE7B7)', tag: 'secondary' },
        { name: 'Calf (lead)',   pct: 44, color: 'linear-gradient(90deg,#1E8FE1,#3AABFF)', tag: 'secondary' },
        { name: 'VMO (lead)',    pct: 72, color: 'linear-gradient(90deg,#EF4444,#F87171)', tag: 'secondary' },
      ]
    },

    joints: [
      { name: 'Lead Hip',  optMin: 70, optMax: 100, unit: '°', key: 'leadHip'  },
      { name: 'Lead Knee', optMin: 80, optMax: 100, unit: '°', key: 'leadKnee' },
      { name: 'Trail Hip', optMin: 130,optMax: 175, unit: '°', key: 'trailHip' },
      { name: 'Trail Knee',optMin: 80, optMax: 100, unit: '°', key: 'trailKnee'},
      { name: 'Trunk',     optMin: 0,  optMax: 10,  unit: '°', key: 'trunk'    },
      { name: 'Lead Ankle',optMin: 15, optMax: 35,  unit: '°', key: 'ankle'    },
    ],

    baseAngles: { leadHip: 85, leadKnee: 90, trailHip: 155, trailKnee: 88, trunk: 5, ankle: 22 },

    recommendations: [
      {
        priority: 'high',
        icon: '⚠',
        title: 'Control Lead Knee Tracking',
        body: 'Lead knee should track over 2nd-3rd toe throughout descent. Lateral hip weakness is the primary driver of valgus collapse in lunges. Add banded clamshells and lateral band walks.',
        evidence: 'Ireland et al. (2003) — Hip abductor weakness is a significant predictor of ACL injury mechanisms in females.'
      },
      {
        priority: 'med',
        icon: '💡',
        title: 'Upright Torso Mechanics',
        body: 'Maintain a tall, vertical torso during descent. Excessive forward lean shifts load to the knee extensor mechanism. Cue: "chin up, shoulders over hips."',
        evidence: 'Coqueiro et al. (2005) — Forward trunk lean during lunges significantly increases patellofemoral joint stress.'
      },
      {
        priority: 'low',
        icon: '✓',
        title: 'Good Step Length',
        body: 'Step length appears appropriate for depth. Maintain this stride — too short increases knee stress, too long reduces quad recruitment.',
        evidence: ''
      }
    ],

    skeleton: {
      bones: [
        { x1:125,y1:88,  x2:125,y2:188, active:false },
        { x1:100,y1:188, x2:150,y2:188, active:false },
        { x1:88, y1:105, x2:162,y2:105, active:false },
        { x1:88, y1:105, x2:65, y2:148, active:false },
        { x1:65, y1:148, x2:55, y2:195, active:false },
        { x1:162,y1:105, x2:185,y2:148, active:false },
        { x1:185,y1:148, x2:192,y2:195, active:false },
        { x1:100,y1:188, x2:78, y2:288, active:true  }, // lead thigh
        { x1:78, y1:288, x2:80, y2:370, active:true  }, // lead shin
        { x1:80, y1:370, x2:60, y2:385, active:false },
        { x1:150,y1:188, x2:168,y2:268, active:true  }, // trail thigh
        { x1:168,y1:268, x2:160,y2:350, active:true  }, // trail shin
        { x1:160,y1:350, x2:175,y2:360, active:false },
      ],
      joints: [
        { cx:125,cy:68,  r:5, warn:false, head:true },
        { cx:125,cy:88,  r:5, warn:false },
        { cx:88, cy:105, r:5, warn:false },
        { cx:162,cy:105, r:5, warn:false },
        { cx:65, cy:150, r:4, warn:false },
        { cx:185,cy:150, r:4, warn:false },
        { cx:100,cy:188, r:6, warn:false },
        { cx:150,cy:188, r:6, warn:false },
        { cx:78, cy:288, r:6, warn:false, highlight:true },
        { cx:168,cy:268, r:6, warn:false, highlight:true },
        { cx:80, cy:370, r:5, warn:false },
        { cx:160,cy:350, r:5, warn:false },
      ],
      muscleOverlays: [
        { type:'ellipse', cls:'muscle-overlay quad',  cx:78,  cy:238,rx:18,ry:38 },
        { type:'ellipse', cls:'muscle-overlay glute', cx:100, cy:200,rx:25,ry:18 },
        { type:'ellipse', cls:'muscle-overlay ham',   cx:165, cy:228,rx:14,ry:32 },
        { type:'ellipse', cls:'muscle-overlay core',  cx:125, cy:158,rx:16,ry:22 },
      ],
      annotations: [
        { text:'90° lead', x:40, y:290, cls:'angle-label', warn:false, small:true },
        { text:'88° trail', x:168, y:270, cls:'angle-label', warn:false, small:true },
      ]
    }
  },

  /* ── HIP HINGE / RDL ───────────────────────────────────── */
  hip_hinge: {
    label: 'Hip Hinge / RDL',
    category: 'Lower Body — Posterior Chain',
    description: 'Romanian deadlift pattern emphasizing hamstring flexibility and posterior chain strength with minimal knee bend.',
    forceMultiplier: 1.6,
    phases: ['Hinge', 'Descent', 'Stretch', 'Drive'],

    muscles: {
      primary: [
        { name: 'Hamstrings',   pct: 92, color: 'linear-gradient(90deg,#8B5CF6,#A78BFA)', tag: 'primary' },
        { name: 'Gluteus Max.', pct: 86, color: 'linear-gradient(90deg,#F59E0B,#FCD34D)', tag: 'primary' },
        { name: 'Adductors',   pct: 58, color: 'linear-gradient(90deg,#EF4444,#F87171)', tag: 'primary' },
      ],
      stabilizers: [
        { name: 'Erector Spinae',pct: 74, color: 'linear-gradient(90deg,#22D4A0,#6EE7B7)', tag: 'secondary' },
        { name: 'Core (TVA)',    pct: 62, color: 'linear-gradient(90deg,#22D4A0,#6EE7B7)', tag: 'secondary' },
        { name: 'Lats (LD)',     pct: 48, color: 'linear-gradient(90deg,#1E8FE1,#3AABFF)', tag: 'secondary' },
        { name: 'Soleus',        pct: 22, color: 'linear-gradient(90deg,#1E8FE1,#3AABFF)', tag: 'secondary' },
      ]
    },

    joints: [
      { name: 'Hip Flex', optMin: 60, optMax: 110, unit: '°', key: 'hip'    },
      { name: 'Knee Flex',optMin: 10, optMax: 30,  unit: '°', key: 'knee'   },
      { name: 'Lumbar',   optMin: 0,  optMax: 12,  unit: '°', key: 'lumbar' },
      { name: 'T-Spine',  optMin: 0,  optMax: 18,  unit: '°', key: 'tspine' },
      { name: 'Pelvis',   optMin: 30, optMax: 60,  unit: '°', key: 'pelvis' },
      { name: 'Ankle',    optMin: 5,  optMax: 15,  unit: '°', key: 'ankle'  },
    ],

    baseAngles: { hip: 88, knee: 16, lumbar: 6, tspine: 12, pelvis: 48, ankle: 8 },

    recommendations: [
      {
        priority: 'high',
        icon: '⚠',
        title: 'Avoid Lumbar Flexion at End Range',
        body: 'Hamstring tightness often causes posterior pelvic tilt and lumbar rounding at end range. Stop the hinge where neutral spine can be maintained. Progressive hamstring flexibility training needed.',
        evidence: 'Contreras & Schoenfeld (2011) — Lumbar flexion during RDL transfers load from posterior chain to passive spinal structures.'
      },
      {
        priority: 'med',
        icon: '💡',
        title: 'Bar/Weight Close to Body',
        body: 'Keep the load dragging along the shins and thighs. Increased moment arm from anterior drift exponentially raises lumbar extensor demand.',
        evidence: 'Escamilla et al. (2001) — Minimizing bar-to-body distance reduces spinal compressive force by up to 40%.'
      },
      {
        priority: 'low',
        icon: '✓',
        title: 'Good Hamstring Recruitment',
        body: 'Posterior chain activation pattern is appropriate. Focus on feeling the hamstring stretch at end range, not just moving the weight.',
        evidence: ''
      }
    ],

    skeleton: {
      bones: [
        { x1:160,y1:100, x2:130,y2:195, active:false },
        { x1:105,y1:195, x2:155,y2:195, active:false },
        { x1:162,y1:112, x2:198,y2:108, active:false },
        { x1:162,y1:112, x2:155,y2:162, active:false },
        { x1:155,y1:162, x2:158,y2:210, active:false },
        { x1:198,y1:108, x2:205,y2:158, active:false },
        { x1:205,y1:158, x2:208,y2:205, active:false },
        { x1:105,y1:195, x2:100,y2:305, active:true  },
        { x1:100,y1:305, x2:105,y2:380, active:true  },
        { x1:105,y1:380, x2:90, y2:393, active:false },
        { x1:155,y1:195, x2:150,y2:305, active:true  },
        { x1:150,y1:305, x2:155,y2:380, active:true  },
        { x1:155,y1:380, x2:165,y2:393, active:false },
      ],
      joints: [
        { cx:165,cy:82,  r:5, warn:false, head:true },
        { cx:160,cy:100, r:5, warn:false },
        { cx:198,cy:108, r:5, warn:false },
        { cx:162,cy:112, r:5, warn:false },
        { cx:205,cy:160, r:4, warn:false },
        { cx:155,cy:164, r:4, warn:false },
        { cx:105,cy:195, r:6, warn:false },
        { cx:155,cy:195, r:6, warn:false },
        { cx:100,cy:305, r:5, warn:false, highlight:true },
        { cx:150,cy:305, r:5, warn:false, highlight:true },
        { cx:105,cy:380, r:5, warn:false },
        { cx:155,cy:380, r:5, warn:false },
      ],
      muscleOverlays: [
        { type:'ellipse', cls:'muscle-overlay ham',   cx:100,cy:250,rx:16,ry:45 },
        { type:'ellipse', cls:'muscle-overlay ham',   cx:150,cy:250,rx:16,ry:45 },
        { type:'ellipse', cls:'muscle-overlay glute', cx:130,cy:205,rx:28,ry:20 },
        { type:'ellipse', cls:'muscle-overlay back',  cx:140,cy:150,rx:18,ry:38 },
      ],
      annotations: [
        { text:'88° hip', x:60, y:205, cls:'angle-label', warn:false, small:true },
        { text:'6° lumbar', x:95, y:140, cls:'angle-label', warn:false, small:true },
      ]
    }
  },

  /* ── PUSH-UP ───────────────────────────────────────────── */
  pushup: {
    label: 'Push-Up',
    category: 'Upper Body — Push',
    description: 'Closed-chain horizontal push requiring scapular stability, core rigidity, and coordinated upper-extremity extension.',
    forceMultiplier: 0.65,
    phases: ['Plank', 'Descend', 'Chest Touch', 'Press'],

    muscles: {
      primary: [
        { name: 'Pec Major',    pct: 88, color: 'linear-gradient(90deg,#F59E0B,#FCD34D)', tag: 'primary' },
        { name: 'Ant. Deltoid', pct: 76, color: 'linear-gradient(90deg,#3AABFF,#60C6FF)', tag: 'primary' },
        { name: 'Triceps',      pct: 82, color: 'linear-gradient(90deg,#8B5CF6,#A78BFA)', tag: 'primary' },
      ],
      stabilizers: [
        { name: 'Serratus Ant.',pct: 62, color: 'linear-gradient(90deg,#22D4A0,#6EE7B7)', tag: 'secondary' },
        { name: 'Core (TVA)',   pct: 68, color: 'linear-gradient(90deg,#22D4A0,#6EE7B7)', tag: 'secondary' },
        { name: 'Glutes',       pct: 45, color: 'linear-gradient(90deg,#F59E0B,#FCD34D)', tag: 'secondary' },
        { name: 'Rhomboids',    pct: 38, color: 'linear-gradient(90deg,#1E8FE1,#3AABFF)', tag: 'secondary' },
      ]
    },

    joints: [
      { name: 'Elbow L', optMin: 80, optMax: 100, unit: '°', key: 'elbowL'   },
      { name: 'Elbow R', optMin: 80, optMax: 100, unit: '°', key: 'elbowR'   },
      { name: 'Shoulder',optMin: 40, optMax: 70,  unit: '°', key: 'shoulder' },
      { name: 'Wrist',   optMin: 60, optMax: 90,  unit: '°', key: 'wrist'    },
      { name: 'Hip',     optMin: 170,optMax: 180, unit: '°', key: 'hip'      },
      { name: 'Spine',   optMin: 0,  optMax: 5,   unit: '°', key: 'spine'    },
    ],

    baseAngles: { elbowL: 90, elbowR: 90, shoulder: 54, wrist: 72, hip: 178, spine: 2 },

    recommendations: [
      {
        priority: 'high',
        icon: '⚠',
        title: 'Scapular Winging Check',
        body: 'If scapular winging is present, serratus anterior is insufficient. Perform scapular push-ups and wall slides before progressing load. Winging increases rotator cuff impingement risk.',
        evidence: 'Cools et al. (2007) — Serratus anterior dysfunction is strongly associated with shoulder impingement pathology.'
      },
      {
        priority: 'med',
        icon: '💡',
        title: 'Maintain Rigid Plank Alignment',
        body: 'Hips should not sag or pike. A rigid core throughout prevents lumbar hyperextension under fatigue. Cue: "steel rod from head to heel."',
        evidence: 'Calatayud et al. (2015) — Core co-activation during push-ups is comparable to plank exercise at matched intensities.'
      },
      {
        priority: 'low',
        icon: '✓',
        title: 'Elbow Path Looks Optimal',
        body: '45–60° elbow flare angle reduces shoulder impingement risk vs. 90° flare. Current elbow path appears efficient. Continue.',
        evidence: ''
      }
    ],

    skeleton: {
      bones: [
        { x1:68, y1:170, x2:192,y2:180, active:false }, // body (horizontal)
        { x1:68, y1:170, x2:80, y2:220, active:false }, // L thigh
        { x1:80, y1:220, x2:85, y2:270, active:false }, // L shin
        { x1:80, y1:270, x2:60, y2:280, active:false }, // L foot
        { x1:192,y1:180, x2:195,y2:230, active:false }, // R thigh
        { x1:195,y1:230, x2:200,y2:280, active:false }, // R shin
        { x1:200,y1:280, x2:215,y2:285, active:false }, // R foot
        { x1:155,y1:175, x2:140,y2:230, active:true  }, // L upper arm
        { x1:140,y1:230, x2:130,y2:280, active:true  }, // L forearm
        { x1:155,y1:175, x2:170,y2:230, active:true  }, // R upper arm
        { x1:170,y1:230, x2:175,y2:280, active:true  }, // R forearm
      ],
      joints: [
        { cx:155,cy:160, r:14, warn:false, head:true, headOnly:true },
        { cx:155,cy:175, r:5,  warn:false },
        { cx:68, cy:170, r:5,  warn:false },
        { cx:192,cy:180, r:5,  warn:false },
        { cx:80, cy:220, r:4,  warn:false },
        { cx:195,cy:230, r:4,  warn:false },
        { cx:80, cy:270, r:4,  warn:false },
        { cx:200,cy:280, r:4,  warn:false },
        { cx:140,cy:230, r:6,  warn:false, highlight:true },
        { cx:170,cy:230, r:6,  warn:false, highlight:true },
        { cx:130,cy:280, r:4,  warn:false },
        { cx:175,cy:280, r:4,  warn:false },
      ],
      muscleOverlays: [
        { type:'ellipse', cls:'muscle-overlay chest',    cx:125,cy:172,rx:35,ry:12 },
        { type:'ellipse', cls:'muscle-overlay tricep',   cx:140,cy:248,rx:10,ry:20 },
        { type:'ellipse', cls:'muscle-overlay tricep',   cx:172,cy:248,rx:10,ry:20 },
        { type:'ellipse', cls:'muscle-overlay shoulder', cx:155,cy:178,rx:22,ry:10 },
        { type:'ellipse', cls:'muscle-overlay core',     cx:128,cy:175,rx:30,ry:8  },
      ],
      annotations: [
        { text:'90° L', x:112,y:238, cls:'angle-label', warn:false, small:true },
        { text:'90° R', x:174,y:238, cls:'angle-label', warn:false, small:true },
      ]
    }
  },

  /* ── OVERHEAD PRESS ────────────────────────────────────── */
  shoulder_press: {
    label: 'Overhead Press',
    category: 'Upper Body — Vertical Push',
    description: 'Bilateral vertical pressing pattern loading the deltoids, rotator cuff, and upper trapezius with spinal stabilization demand.',
    forceMultiplier: 0.55,
    phases: ['Rack', 'Press', 'Lockout', 'Lower'],

    muscles: {
      primary: [
        { name: 'Ant. Deltoid', pct: 90, color: 'linear-gradient(90deg,#3AABFF,#60C6FF)', tag: 'primary' },
        { name: 'Triceps',      pct: 84, color: 'linear-gradient(90deg,#8B5CF6,#A78BFA)', tag: 'primary' },
        { name: 'Med. Deltoid', pct: 72, color: 'linear-gradient(90deg,#3AABFF,#60C6FF)', tag: 'primary' },
      ],
      stabilizers: [
        { name: 'Rotator Cuff', pct: 66, color: 'linear-gradient(90deg,#22D4A0,#6EE7B7)', tag: 'secondary' },
        { name: 'Upper Trap',   pct: 58, color: 'linear-gradient(90deg,#22D4A0,#6EE7B7)', tag: 'secondary' },
        { name: 'Core (TVA)',   pct: 72, color: 'linear-gradient(90deg,#22D4A0,#6EE7B7)', tag: 'secondary' },
        { name: 'Glutes',       pct: 40, color: 'linear-gradient(90deg,#F59E0B,#FCD34D)', tag: 'secondary' },
      ]
    },

    joints: [
      { name: 'Elbow L',  optMin: 85, optMax: 100, unit: '°', key: 'elbowL'   },
      { name: 'Elbow R',  optMin: 85, optMax: 100, unit: '°', key: 'elbowR'   },
      { name: 'Shoulder', optMin: 150,optMax: 180, unit: '°', key: 'shoulder' },
      { name: 'Wrist',    optMin: 165,optMax: 180, unit: '°', key: 'wrist'    },
      { name: 'Lumbar',   optMin: 0,  optMax: 10,  unit: '°', key: 'lumbar'   },
      { name: 'Hip',      optMin: 170,optMax: 180, unit: '°', key: 'hip'      },
    ],

    baseAngles: { elbowL: 92, elbowR: 90, shoulder: 172, wrist: 178, lumbar: 6, hip: 176 },

    recommendations: [
      {
        priority: 'high',
        icon: '⚠',
        title: 'Prevent Lumbar Hyperextension',
        body: 'Leaning back to complete the press shifts load to the lumbar spine. Brace the core, squeeze glutes, and press from a neutral pelvis. If unable, reduce load.',
        evidence: 'Dempsey et al. (2011) — Lumbar hyperextension under vertical load increases L4-L5 shear force significantly.'
      },
      {
        priority: 'med',
        icon: '💡',
        title: 'Scapular Upward Rotation',
        body: 'At lockout, shrug the traps actively to achieve full scapular upward rotation. This opens the subacromial space and prevents impingement at end-range elevation.',
        evidence: 'Ludewig & Cook (2000) — Impaired upward rotation is the primary kinematic deficit in shoulder impingement syndrome.'
      },
      {
        priority: 'low',
        icon: '✓',
        title: 'Consistent Bar Path',
        body: 'Bar path appears vertical and efficient. Avoid excessive anterior drift at initiation — the bar should travel in a straight line overhead.',
        evidence: ''
      }
    ],

    skeleton: {
      bones: [
        { x1:130,y1:88,  x2:130,y2:240, active:false }, // spine
        { x1:100,y1:240, x2:160,y2:240, active:false }, // pelvis
        { x1:88, y1:105, x2:172,y2:105, active:false }, // shoulder girdle
        { x1:100,y1:240, x2:102,y2:320, active:false }, // L thigh
        { x1:102,y1:320, x2:104,y2:390, active:false }, // L shin
        { x1:160,y1:240, x2:158,y2:320, active:false }, // R thigh
        { x1:158,y1:320, x2:156,y2:390, active:false }, // R shin
        { x1:88, y1:105, x2:62, y2:68,  active:true  }, // L upper arm (overhead)
        { x1:62, y1:68,  x2:60, y2:35,  active:true  }, // L forearm (up)
        { x1:172,y1:105, x2:198,y2:68,  active:true  }, // R upper arm (overhead)
        { x1:198,y1:68,  x2:200,y2:35,  active:true  }, // R forearm (up)
      ],
      joints: [
        { cx:130,cy:68,  r:5, warn:false, head:true },
        { cx:130,cy:88,  r:5, warn:false },
        { cx:88, cy:105, r:6, warn:false, highlight:true },
        { cx:172,cy:105, r:6, warn:false, highlight:true },
        { cx:62, cy:68,  r:5, warn:false },
        { cx:198,cy:68,  r:5, warn:false },
        { cx:60, cy:35,  r:4, warn:false },
        { cx:200,cy:35,  r:4, warn:false },
        { cx:100,cy:240, r:5, warn:false },
        { cx:160,cy:240, r:5, warn:false },
        { cx:102,cy:320, r:4, warn:false },
        { cx:158,cy:320, r:4, warn:false },
      ],
      muscleOverlays: [
        { type:'ellipse', cls:'muscle-overlay shoulder', cx:78,  cy:88, rx:20,ry:14 },
        { type:'ellipse', cls:'muscle-overlay shoulder', cx:182, cy:88, rx:20,ry:14 },
        { type:'ellipse', cls:'muscle-overlay tricep',   cx:66,  cy:50, rx:8, ry:20 },
        { type:'ellipse', cls:'muscle-overlay tricep',   cx:198, cy:50, rx:8, ry:20 },
        { type:'ellipse', cls:'muscle-overlay core',     cx:130, cy:175,rx:18,ry:28 },
      ],
      annotations: [
        { text:'172°', x:42, y:88, cls:'angle-label', warn:false, small:true },
        { text:'6° lumbar', x:100, y:178, cls:'angle-label', warn:false, small:true },
      ]
    }
  }
};

// Convenience getter
function getExercise(id) {
  return EXERCISES[id] || EXERCISES.squat;
}
