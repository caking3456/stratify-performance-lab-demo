# Stratify Performance Lab

**AI-Assisted Biomechanics & Movement Analysis Platform**
*Dr. Chris King PT, DPT · B.S. Kinesiology*

---

## Overview

Stratify Performance Lab is a browser-based biomechanics analysis platform that simulates real-time movement analysis, muscle activation mapping, force estimation, and evidence-based coaching feedback. Built to demonstrate the intersection of clinical physical therapy knowledge, kinesiology, and applied AI.

> ⚠ **Educational Use Only.** This platform is for demonstration and educational purposes. It does not constitute medical advice, clinical diagnosis, or a substitute for in-person evaluation by a licensed healthcare professional.

---

## Features

| Feature | Description |
|---|---|
| **Live Skeleton Animation** | SVG-based skeletal visualization adapts per exercise with animated muscle overlays |
| **Rep Counter** | Tracks completed reps with phase detection (eccentric / isometric / concentric) |
| **Force Estimation** | Simplified GRF model estimates peak force (N) per rep using subject mass |
| **Fatigue Modeling** | Force and quality scores decrease realistically across a set |
| **Joint Angle Display** | Live joint angles with optimal range indicators per exercise |
| **Muscle Activation Map** | Primary movers and stabilizers shown with activation % per exercise |
| **Movement Quality Score** | Per-rep scoring (0–100) with aggregate set grade |
| **Set Summary** | Text + sparkline graph summary on set completion |
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

## Clinical Foundation

Built on a foundation of peer-reviewed evidence. Recommendations cite:

- Myer et al. (2008) — Hip abductor weakness & dynamic valgus
- McGill et al. (2003) — Intra-abdominal pressure & spinal stability
- Escamilla et al. (2001, 2002) — Deadlift and squat biomechanics
- Ludewig & Cook (2000) — Scapular kinematics in shoulder impingement
- Calatayud et al. (2015) — Core activation during push-up variants
- Ireland et al. (2003) — Hip weakness and ACL injury mechanisms

---

## Getting Started

No installation required. This is a fully static, single-page application.

```bash
# Option 1: Open directly in browser
open stratify-portfolio/index.html

# Option 2: Serve locally (recommended for development)
npx serve stratify-portfolio
# or
python -m http.server 8080 --directory stratify-portfolio
```

Then navigate to `http://localhost:8080` (or just open the HTML file directly).

---

## Project Structure

```
stratify-portfolio/
├── index.html          # Main app shell + layout
├── css/
│   └── style.css       # All styles (design tokens, components, animations)
├── js/
│   ├── exercises.js    # Exercise library: muscle maps, joints, skeletons, recs
│   ├── simulation.js   # Biomechanics simulation engine (rep cycle, force, scoring)
│   └── app.js          # UI wiring: rendering, event handlers, charts, export
└── assets/
    └── logo.jpg        # Stratify Performance Lab logo
```

---

## Technology

- **Pure HTML/CSS/JavaScript** — zero dependencies, no build step
- **SVG-based skeleton rendering** — fully programmatic, exercise-specific poses
- **requestAnimationFrame loop** — smooth 60fps simulation
- **CSS custom properties** — consistent design token system
- **Responsive layout** — works on tablet and desktop

---

## Background

This project was created to demonstrate clinical biomechanics knowledge combined with software development skills:

- **Doctor of Physical Therapy (DPT)** — clinical movement analysis, patient rehabilitation, evidence-based practice
- **B.S. Kinesiology** — exercise physiology, biomechanics, anatomy, motor control
- **Software** — full-stack development, real-time simulation, data visualization

The full platform (with WebSocket backend, Python FastAPI, and MediaPipe pose tracking) is available in the parent repository.

---

## Roadmap

- [ ] MediaPipe BlazePose integration (real webcam input)
- [ ] Session history & multi-set comparison
- [ ] PDF report generation
- [ ] Mobile-optimized layout
- [ ] Additional exercises (Nordic Curl, Split Squat, Row)
- [ ] Asymmetry index (bilateral force comparison)

---

## Disclaimer

AI-generated analysis and recommendations are for **educational and informational purposes only**. They do not replace clinical judgment, physical examination, or a diagnosis from a licensed healthcare provider. Training modifications should always be discussed with a qualified professional.

---

*Stratify Performance Lab v1.0 · Dr. Chris King PT, DPT, B.S. Kinesiology*
