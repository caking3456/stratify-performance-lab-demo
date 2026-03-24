# Stratify Performance Lab

**AI-Assisted Biomechanics & Movement Analysis Platform**
*Dr. Chris King PT, DPT · B.S. Kinesiology*

**[Live Demo](https://caking3456.github.io/stratify-performance-lab-demo/app/)**

---

## Overview

Stratify Performance Lab is a browser-based biomechanics analysis platform for real-time movement analysis, muscle activation mapping, force estimation, and evidence-based coaching feedback. Supports both a live camera mode (MediaPipe BlazePose) and a built-in simulation mode for demo purposes. Built to demonstrate the intersection of clinical physical therapy knowledge, kinesiology, and applied AI.

> ⚠ **Educational Use Only.** This platform is for demonstration and educational purposes. It does not constitute medical advice, clinical diagnosis, or a substitute for in-person evaluation by a licensed healthcare professional.

---

## Features

| Feature | Description |
| --- | --- |
| **Camera Mode** | MediaPipe BlazePose tracks 33 body landmarks in real-time via device camera (sagittal view) |
| **Simulation Mode** | Built-in biomechanics simulation for demo use — no camera required |
| **Live Skeleton Animation** | SVG-based skeletal visualization adapts per exercise with animated muscle overlays |
| **Rep Counter** | Tracks completed reps with phase detection (eccentric / isometric / concentric) |
| **Force Estimation** | Simplified GRF model estimates peak force (N) per rep using subject mass |
| **Fatigue Modeling** | Force and quality scores decrease realistically across a set |
| **Joint Angle Display** | Live joint angles with optimal range indicators per exercise |
| **Muscle Activation Map** | Primary movers and stabilizers shown with activation % per exercise |
| **Movement Quality Score** | Per-rep scoring (0–100) with aggregate set grade |
| **Set Summary** | Text + sparkline graph summary on set completion |
| **HEP Generator** | Auto-prescribes corrective drills based on detected faults (valgus, depth, fatigue) with evidence citations |
| **Clinical Recommendations** | Evidence-based coaching cues with literature citations |
| **Export CSV** | Export full set data (rep forces, quality scores, flags) |
| **Session Config** | Configurable reps, load, and subject mass |
| **6 Exercise Library** | Back Squat, Deadlift, Forward Lunge, Hip Hinge/RDL, Push-Up, Overhead Press |

---

## Exercise Library

- **Back Squat** — Bilateral knee-dominant lower body compound
- **Deadlift (Conventional)** — Hip-dominant posterior chain pull
- **Forward Lunge** — Unilateral stability and frontal plane control
- **Hip Hinge / RDL** — Posterior chain hamstring-dominant pattern
- **Push-Up** — Closed-chain horizontal push with scapular stability demand
- **Overhead Press** — Vertical push with rotator cuff and core stability demand

---

## HEP Prescription Engine

After set completion, the platform detects movement faults and auto-generates a corrective Home Exercise Program (up to 4 drills). Fault detection logic:

| Fault | Trigger | Example Drills Prescribed |
| --- | --- | --- |
| **Knee Valgus** | Detected valgus pattern | Clamshell, Lateral Band Walk, Single-Leg Glute Bridge |
| **Depth Limitation** | Score < 83 on squat/lunge | Ankle Dorsiflexion Mob, Hip 90/90 |
| **Fatigue** | >15% force drop across set | Tempo Squat, Romanian DL, Dead Bug |
| **General Form** | Score < 80 | Dowel Hip Hinge, Band Pull-Apart, Serratus Wall Slide |

Each drill includes sets/reps, coaching cues, and a peer-reviewed evidence citation.

---

## Clinical Foundation

Built on a foundation of peer-reviewed evidence. Recommendations cite:

- Myer et al. (2008) — Hip abductor weakness & dynamic valgus
- McGill et al. (2003) — Intra-abdominal pressure & spinal stability
- Escamilla et al. (2001, 2002) — Deadlift and squat biomechanics
- Ludewig & Cook (2000) — Scapular kinematics in shoulder impingement
- Calatayud et al. (2015) — Core activation during push-up variants
- Ireland et al. (2003) — Hip weakness and ACL injury mechanisms
- Distefano et al. (2009) — Clamshell for glute med activation & valgus correction
- Backman & Danielson (2011) — Ankle dorsiflexion restriction & knee valgus
- Ager et al. (2017) — Rotator cuff strengthening & overhead stability

---

## Getting Started

No installation required. Fully static — no build step, no dependencies.

```bash
# Option 1: Open the app directly in browser
open app/index.html

# Option 2: Serve locally (recommended — required for camera mode)
npx serve .
# or
python -m http.server 8080
```

Then navigate to `http://localhost:8080/app/`.

> **Camera mode** requires a served URL (not `file://`) due to browser `getUserMedia` restrictions. Use localhost or the live demo link.

---

## Project Structure

```text
stratify-performance-lab-demo/
├── index.html              # Landing page
├── landing/
│   └── index.html          # Alternate landing layout
├── app/
│   ├── index.html          # Main app shell
│   ├── css/
│   │   └── style.css       # All styles (design tokens, components, animations)
│   ├── js/
│   │   ├── exercises.js    # Exercise library: muscle maps, joints, skeletons, recs
│   │   ├── simulation.js   # Biomechanics simulation engine (rep cycle, force, scoring)
│   │   ├── camera.js       # MediaPipe BlazePose camera integration
│   │   ├── hep.js          # HEP prescription engine (fault detection → corrective drills)
│   │   └── app.js          # UI wiring: rendering, event handlers, charts, export
│   ├── assets/
│   │   └── logo.jpg        # Stratify Performance Lab logo
│   └── img/
│       └── logo.png        # Logo (PNG variant)
```

---

## Technology

- **Pure HTML/CSS/JavaScript** — zero dependencies, no build step
- **MediaPipe BlazePose** (CDN) — 33-landmark real-time pose estimation
- **SVG-based skeleton rendering** — fully programmatic, exercise-specific poses
- **requestAnimationFrame loop** — smooth 60fps simulation and camera processing
- **CSS custom properties** — consistent design token system
- **Responsive layout** — works on tablet and desktop

---

## Background

This project was created to demonstrate clinical biomechanics knowledge combined with software development:

- **Doctor of Physical Therapy (DPT)** — clinical movement analysis, patient rehabilitation, evidence-based practice
- **B.S. Kinesiology** — exercise physiology, biomechanics, anatomy, motor control
- **Software** — real-time pose estimation, data visualization, browser-based simulation

---

## Roadmap

- [ ] Session history & multi-set comparison
- [ ] PDF report generation
- [ ] Mobile-optimized layout
- [ ] Additional exercises (Nordic Curl, Split Squat, Row)
- [ ] Asymmetry index (bilateral force comparison)
- [ ] Multi-set fatigue trend analysis

---

## Disclaimer

AI-generated analysis and recommendations are for **educational and informational purposes only**. They do not replace clinical judgment, physical examination, or a diagnosis from a licensed healthcare provider. Training modifications should always be discussed with a qualified professional.

---

### Stratify Performance Lab · Dr. Chris King PT, DPT, B.S. Kinesiology
