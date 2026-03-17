# I-001 — CesiumJS VR Limitation

**Date** : 2026-03-17  
**Project** : Satellite-Spy  
**Impact** : Quest XR integration  
**Severity** : Medium — design constraint, not a blocker

---

## Finding

CesiumJS `Viewer` is initialized with `vrButton: false` in `GlobeViewer.tsx` L55:

```typescript
const viewer = new Cesium.Viewer(containerRef.current!, {
  // ...
  vrButton: false,    // ← explicitly disabled
  // ...
  scene3DOnly: true,
});
```

## CesiumJS WebXR Support

| Feature | Status |
|---------|--------|
| `vrButton: true` (split-screen stereo) | ✅ Supported — basic stereo in browser |
| WebXR Device API session | ❌ Not natively supported by CesiumJS |
| Hand tracking | ❌ Not supported |
| Controller mapping | ❌ Not supported |
| 6DoF headset tracking | ❌ Not supported (uses devicemotion only) |

## Implications for Quest XR

1. **Browser mode works** : The Quest 3 Chromium browser renders CesiumJS fine as a 2D panel. The globe is interactive with touch controls.

2. **Stereo mode available** : Setting `vrButton: true` enables basic stereo rendering. Not immersive, no hand tracking.

3. **Full immersive VR requires bridge** : To run the globe in a WebXR immersive session, the satellite/entity data must be exported from CesiumJS and re-rendered in Three.js (which has full WebXR support).

## Recommended Approach

```
Option A (minimal): vrButton: true → stereo view in Quest browser
Option B (bridge):   CesiumJS data → JSON → Three.js globe + WebXR
Option C (data only): Export positions/entities → Quest XR scene graph renders them
```

**Option C is recommended** : Satellite-Spy keeps CesiumJS for its desktop UI. For Quest XR, it publishes entity positions + alerts via EventBus/WebSocket. Quest XR renders them in its own Three.js scene graph on a separate 3D globe or spatial layout.

## GLSL Shaders Note

The night vision and thermal GLSL shaders (`src/shaders/nightvision.glsl`, `thermal.glsl`) are CesiumJS post-processing effects. They would NOT work in a Three.js/WebXR context directly — they'd need to be ported to Three.js `ShaderMaterial` or `EffectComposer` passes.

However, the current visual filters in `GlobeViewer.tsx` L504-517 are CSS `filter` properties, not the GLSL shaders. CSS filters don't apply to WebXR canvases.
