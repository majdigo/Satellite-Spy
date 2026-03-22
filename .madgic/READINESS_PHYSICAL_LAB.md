# SATELLITE-SPY — PHYSICAL LAB READINESS ASSESSMENT
# Date: 2026-03-22
# Agent: G-ARCH

## VERDICT: NOT READY — but the GAP is SMALLER than you think

The readiness assessment documents are honest and accurate. Here's the Satellite-Spy specific view.

---

## MATURITY MATRIX (Satellite-Spy relevant domains)

| # | Domain | Level | Evidence | Satellite-Spy Role |
|---|--------|-------|----------|-------------------|
| 1 | DJI Mini 3 SDK | 0 - Vision | No MSDK, no dev account | Aerial imagery for ground truth verification |
| 2 | Computer Vision (YOLO) | 0 - Vision | Referenced in docs, not installed | Detect objects in drone/satellite imagery |
| 3 | 3D Reconstruction | 0 - Vision | No photogrammetry pipeline | Terrain reconstruction from drone photos |
| 4 | CesiumJS Globe | **4 - Production** | 131 tests, full integration | **ALREADY DONE** — 3D globe with markers |
| 5 | EventBus / SSE | **4 - Production** | Working, tested | **ALREADY DONE** — real-time data streaming |
| 6 | GDELT/ACLED feeds | **4 - Production** | Live API connectors | **ALREADY DONE** — geopolitical data ingestion |
| 7 | World Model Ontology | **3 - Functional** | 17 entities, 14 relations | Working graph with causal chains |
| 8 | Simulation Engine | **3 - Functional** | 7 scenarios, SSE stream | Cascade propagation working |
| 9 | QuantumData integration | **1 - Hello World** | Just completed today | TypeScript port + GeoEventQuantumData |
| 10 | Design System | **1 - Hello World** | Just copied from shared | TRUTH_COLORS available, not wired |
| 11 | Kalman Filter | 0.5 - Code exists | `madgic_shared/core/kalman_fusion.py` | Not integrated — needed for GPS+IMU+vision fusion |
| 12 | OntologyLearner | 0.5 - Code exists | `madgic_shared/core/ontology_learner.py` | Not integrated — needed for auto-enrichment |
| 13 | Three.js / WebXR | 0 - Vision | Discussed, not started | 3D graph visualization for Quest XR |
| 14 | Unity 3D | 0 - Vision | No C# code anywhere | NOT needed for Satellite-Spy (Three.js path) |
| 15 | Trajectory / A* / RRT* | 0 - Vision | Referenced in docs | Drone path planning (future) |
| 16 | Physics Simulation | 0 - Vision | Custom cascade only | Basic geopolitical cascade, not physics |
| 17 | Reinforcement Learning | 0.5 - Banking only | Prompt-level RL in Harissa | Not in Satellite-Spy scope yet |
| 18 | IoT / Raspberry Pi | 0 - Vision | Tuya devices exist | Ground sensor fusion (future) |
| 19 | Audio / Microphone | 0 - Vision | Hardware available | Not in scope |
| 20 | Obstacle Avoidance | 0 - Vision | No code | Drone autonomy (future) |

---

## WHAT SATELLITE-SPY ALREADY CONTRIBUTES TO THE PHYSICAL LAB

### 1. CesiumJS as the 3D Canvas for Drone Data (READY NOW)
The globe is PRODUCTION READY. When the drone flies and captures photos:
- GPS coordinates from drone → CesiumJS markers on the globe (trivial integration)
- Flight path → CesiumJS polyline entity (same pattern as satellite orbits)
- Ground truth photos → CesiumJS billboards at GPS coordinates

**Gap to close**: Accept drone telemetry via WebSocket and display in real-time on the globe.
**Effort**: ~2 days. The EventBus already supports this pattern.

### 2. WorldModel as the Ontology for Physical Objects (READY NOW)
The 17 entity types + 14 relation types can be EXTENDED with physical types:
- `drone` entity type (position, battery, altitude, camera status)
- `ground_object` entity type (from YOLO detection, with confidence)
- `terrain_mesh` entity type (from photogrammetry, linked to GeoSPARQL)
- `sensor_reading` entity type (from Raspberry Pi, via Kalman fusion)

**Gap to close**: Add 4-5 new entity types to world-model.ts.
**Effort**: ~1 day. Same pattern as the logistics entities we already added.

### 3. EventBus + SSE for Real-Time Drone Telemetry (READY NOW)
The EventBus (11 event types) can be extended with:
- `drone:telemetry` — GPS, altitude, battery, gimbal angle
- `drone:detection` — YOLO detections from onboard camera
- `drone:photo` — photo captured with GPS tag
- `sensor:reading` — IoT sensor data from Raspberry Pi

The SSE endpoint (`/api/simulation/stream`) is the EXACT pattern needed for streaming drone telemetry to the browser.

**Gap to close**: Add drone event types + WebSocket bridge from MSDK.
**Effort**: ~3 days for the TypeScript/Next.js side. The Android/MSDK side is the bottleneck.

### 4. GeoEventQuantumData as the Data Model for Drone Observations (JUST BUILT)
The GeoEventQuantumData we built TODAY has latitude, longitude, country, severity, sourceFeed.
A DroneObservationQuantumData would be:
```
extends QuantumData {
  latitude, longitude, altitude
  droneId, missionId
  detectedClass (from YOLO)
  detectionConfidence
  boundingBox
  imagePath (original photo)
  depthEstimate (from monocular depth)
}
```
Same pattern. Same factory functions. Same tests.

---

## WHAT SATELLITE-SPY NEEDS BUT DOESN'T HAVE

### Critical Path (blocks physical lab integration)

| Priority | Need | Provider | Effort | Impact |
|----------|------|----------|--------|--------|
| P0 | DJI MSDK compiled + connected | Majdi (dev account + Android Studio) | 1-2 weeks | Unlocks ALL drone features |
| P0 | YOLO installed + tested on RTX 4070 | G-DEV (pip install ultralytics + test) | 30 min | Unlocks object detection |
| P1 | WebSocket bridge MSDK → Next.js | G-DEV (Kotlin + TypeScript) | 1 week | Real-time drone on globe |
| P1 | Kalman filter TypeScript port | G-DEV (port from kalman_fusion.py) | 2 days | Multi-sensor fusion in browser |
| P2 | Photogrammetry pipeline (ODM or Meshroom) | G-DEV (Docker + CLI) | 1 week | 3D terrain from drone photos |
| P2 | YOLO → QuantumData pipeline | G-DEV (Python bridge) | 3 days | Auto-enrich ontology |

### NOT Critical for Satellite-Spy (defer to other projects)

| Domain | Better Project | Why |
|--------|---------------|-----|
| Unity 3D | Quest XR | They need native VR performance, we don't |
| Robot DIY | Separate project | Not geopolitical intelligence scope |
| CNC/3D printing | Separate project | Physical fabrication, not satellite/drone intel |
| IoT Raspberry Pi | Masar AI (site monitoring) | Supply chain site sensors |
| Audio/Sonification | MaqamArchitect | Their domain expertise |
| Full RL (gym/PPO) | Harissa Banking | Financial RL already started there |

---

## RECOMMENDED ACTION PLAN FOR SATELLITE-SPY

### Phase A — Drone Vision (4 weeks)

**Week 1-2: YOLO + Drone Basics**
```
TACHE 1: pip install ultralytics && yolo predict source=test.jpg
TACHE 2: Test YOLO on webcam feed — measure FPS on RTX 4070
TACHE 3: Create DroneObservationQuantumData (extends QuantumData)
TACHE 4: YOLO detection → QuantumData OBSERVED factory function
TACHE 5: Process 1 drone video (from DJI SD card) through YOLO offline
```

**Week 3-4: Drone on Globe**
```
TACHE 1: Register DJI developer account
TACHE 2: Install Android Studio + clone MSDK V5 sample
TACHE 3: Add drone entity type to WorldModel
TACHE 4: Add drone:telemetry event to EventBus
TACHE 5: Display drone GPS on CesiumJS globe (even manual/mock data first)
```

### Phase B — 3D Reconstruction (4 weeks)

**Week 5-6: Photogrammetry Hello World**
```
TACHE 1: Install OpenDroneMap via Docker
TACHE 2: Fly a grid pattern, extract photos with GPS
TACHE 3: Run ODM → orthomosaic + 3D mesh
TACHE 4: Display the mesh as CesiumJS 3D Tileset on the globe
```

**Week 7-8: Ground Truth Integration**
```
TACHE 1: Port Kalman filter to TypeScript
TACHE 2: Fuse GPS + YOLO position estimates for each detection
TACHE 3: Link drone observations to GDELT/ACLED events by proximity
TACHE 4: Display "verified" events (drone ground truth + GDELT) on globe
```

### Phase C — Autonomous (8+ weeks, Sprint 2+)

This requires simulation (DJI Assistant 2), PID controllers, and path planning.
Defer until Phase A and B are solid.

---

## THE KEY INSIGHT

Satellite-Spy's EXISTING infrastructure (CesiumJS globe, EventBus, SSE, WorldModel, GeoEventQuantumData) is a **near-perfect receiving platform** for drone data. The bottleneck is NOT on the Satellite-Spy side — it's on the HARDWARE SIDE:

1. **DJI MSDK** — requires dev account + Android setup (Majdi, 1-2 weeks)
2. **YOLO** — requires `pip install ultralytics` (30 minutes)
3. **Photogrammetry** — requires `docker pull opendronemap/odm` (1 hour)

Once these 3 tools are running, integrating them into Satellite-Spy's existing architecture is straightforward — we've already proven the pattern with GDELT, ACLED, and the simulation engine.

**Unity is NOT needed for Satellite-Spy.** CesiumJS + Three.js (via react-three-fiber for the graph view) covers everything we need. Unity is Quest XR's concern.

---

## CROSS-PROJECT SYNERGY MAP (Physical Lab)

```
                    DJI Mini 3
                        │
                   MSDK Bridge
                        │
          ┌─────────────┼─────────────┐
          │             │             │
    Satellite-Spy   Masar AI      Quest XR
    (globe view,   (Al Soudah    (VR drone
     GDELT/ACLED    site survey,   twin,
     ground truth)  Iktva verify)  immersive)
          │             │             │
          └─────────────┼─────────────┘
                        │
              Kalman Filter Fusion
              (madgic_shared/core/)
                        │
              ┌─────────┼─────────┐
              │         │         │
           YOLO    Photogrammetry  OntologyLearner
           (detect) (3D mesh)     (auto-enrich)
              │         │         │
              └─────────┼─────────┘
                        │
                 QuantumData Graph
                 (shared ontology)
```

The physical lab is a SHARED RESOURCE. Satellite-Spy consumes the drone data for intelligence verification. Masar AI consumes it for site surveys. Quest XR consumes it for VR immersion. The data flows THROUGH the QuantumData graph, and each project applies its own ontology and convolutions.
