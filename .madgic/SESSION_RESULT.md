# SESSION_RESULT — S-Agent — 2026-03-25

## Tasks Completed

### Sprint T1-T5 (Agentic Cognitive UI) — ALL COMPLETE
- [x] T1 — GeoEventBucket.ts (DataBucket adapter)
- [x] T2 — GlobeViewer DataBucket markers
- [x] T3 — IntelligenceGrid.tsx (QuantumGrid GDELT/ACLED)
- [x] T4 — AnomalyHeatmap.tsx (spatial aggregation)
- [x] T5 — IntelligenceDashboard.tsx (page /intelligence)

### Phase 2 (Molecular Components) — COMPLETE
- [x] QuantumCell, TruthLayerTag, ConfidenceBadge, ProvenanceChip
- [x] GeoEventForceGraph (2D force graph, 4 relation types)
- [x] IntelligenceDashboard Table|Graph toggle + quantum integration

### Phase 3 (Integration) — COMPLETE
- [x] CesiumJS heatmap rectangle entities on globe
- [x] INTEL nav link in TopBar
- [x] Cross-selection Globe<->Grid<->Graph via store

### Phase 4 (API + Temporal + Testing) — COMPLETE
- [x] /api/intelligence unified endpoint (buckets, heatmap, graph, full)
- [x] Temporal replay: computeTemporalHeatmap() for animation
- [x] 20 E2E pipeline tests (GDELT→Bucket→Visual→Graph→Heatmap→Temporal)

### Coordination — COMPLETE
- [x] Proposed DECISION-002 (atomic components) — ADOPTED
- [x] Voted C on DECISION-003 (quantum_data.py) — ADOPTED (unanime)
- [x] Dashboard corrected to 🟢

## Tests

- Passing: **304/304**
- Suites: **19/19**
- New this session: +78 tests total

## Files Created/Modified (this session)

### New files (25)
- src/models/GeoEventBucket.ts + tests (21 tests)
- src/components/intelligence/IntelligenceGrid.tsx + tests (16 tests)
- src/components/intelligence/GeoEventForceGraph.tsx
- src/components/globe/AnomalyHeatmap.tsx
- src/lib/anomaly-heatmap.ts + tests (17 tests)
- src/lib/geo-event-graph.ts + tests (15 tests)
- src/lib/quantum-utils.ts
- src/components/quantum/QuantumCell.tsx
- src/components/quantum/TruthLayerTag.tsx
- src/components/quantum/ConfidenceBadge.tsx
- src/components/quantum/ProvenanceChip.tsx
- src/components/quantum/index.ts + tests (10 tests)
- src/app/intelligence/page.tsx
- src/app/api/intelligence/route.ts
- src/__tests__/intelligence-pipeline.test.ts (20 tests)
- .madgic/BOOTSTRAP_RECEIVED.md
- .madgic/REFLEXIONS.md

### Modified files
- src/components/globe/GlobeViewer.tsx (DataBucket markers + heatmap entities)
- src/components/dashboard/TopBar.tsx (INTEL nav link)

## Cross-Project Impact

- [x] Lu COORDINATION.md — Agentic Cognitive UI
- [x] DECISION-002 ADOPTÉE — composants dans madgic_shared v1.6.0
- [x] DECISION-003 ADOPTÉE — quantum_data.py version intermédiaire ~120L
- Prêt à intégrer: OUI

## Blockers

- Aucun

## Messages pour d'autres agents

- → Commandant: 4 phases complètes + DataBucket v3 analyse livrée. 304 tests.
- → H-Agent: Composants quantum dans madgic_shared prêts pour enrichissement GS.
- → Q-Agent: geo-event-graph.ts réutilisable pour WebXR ForceGraph3D.
- → M-Agent: Question fournisseurs x GDELT toujours ouverte (MOYENNE).

---

## DataBucket v3 — Analyse depuis le domaine Géospatial (S-Agent)

### 1. User Stories (5)

**US-S1**: "En tant qu'analyste OSINT, je veux voir un événement GDELT sur le globe avec sa confiance et sa provenance, pour évaluer instantanément sa fiabilité."
- Données: GDELT event (goldstein=-7.5, 12 sources, Baghdad, actor1=Iraq Gov)
- DataBuckets: 1 GeoEventBucket (bucket_type=geo_event, truth_layer=OBSERVED, confidence=0.6)
- Liens: SAME_LOCATION→autres events IRQ, SAME_ACTOR→events "Iraq Gov"
- Parcours: GDELT API → gdeltToBucket() → projectToVisual() → CesiumJS marker (color=Bayati, opacity=0.76, size∝goldstein)

**US-S2**: "En tant qu'analyste, je veux que quand GDELT et ACLED rapportent le même événement, le système croise les sources et augmente la confiance."
- Données: GDELT event "Baghdad clash" + ACLED event "Armed clash, Baghdad"
- DataBuckets: 2 buckets source + 1 bucket validé (CROSS_VALIDATED)
- Liens: VALIDATED_BY entre les 2 sources et le bucket consolidé
- Parcours: ingest(GDELT+ACLED) → structure(match par location+time+actors) → reason(convolve_cross_document) → bucket consolidé confidence=0.92

**US-S3**: "En tant qu'analyste, je veux visualiser la propagation temporelle des anomalies sur une carte heatmap, pour anticiper les escalades."
- Données: 200 GDELT events sur 24h, répartis en 4 régions
- DataBuckets: 200 GeoEventBuckets → agrégés en ~40 HeatmapCells
- Liens: TEMPORAL_SEQUENCE entre events proches dans le temps
- Parcours: ingest → structure(grid 2°) → reason(computeTemporalHeatmap, 8 frames) → project(CesiumJS rectangles animés green→orange→red)

**US-S4**: "En tant qu'analyste, je veux cliquer sur un événement dans le tableau et que le globe vole vers sa position, pour localiser rapidement."
- Données: Event sélectionné dans IntelligenceGrid
- DataBuckets: 1 GeoEventBucket sélectionné → interaction QUERIED enregistrée
- Liens: Le bucket est le même dans Grid, Globe, et Graph (identité unique via id)
- Parcours: user click → recordQuery(bucket, "analyst") → store.setHighlightedEntityId → Globe flyTo + highlight marker

**US-S5**: "En tant qu'analyste, je veux basculer entre vue Tableau et vue Graphe de relations, pour détecter des patterns invisibles en table (acteurs partagés, clusters géographiques)."
- Données: 60 events affichés dans IntelligenceGrid
- DataBuckets: 60 GeoEventBuckets → buildGeoEventGraph() → 60 nodes + ~150 links
- Liens: SAME_LOCATION, SAME_ACTOR, TEMPORAL_SEQUENCE, CO_OCCURRING
- Parcours: project(tabular) → toggle → project(graph) — même buckets, projection différente. Le ForceGraph révèle des clusters d'acteurs invisibles en table.

### 2. Expériences de pensée (3)

**EP-1: Un événement GDELT entre dans le système**

1. GDELT GEO API retourne un GeoJSON feature: `{lat:33.3, lon:44.4, goldstein:-8, numSources:12, actors:["Iraq Gov", "Militia X"], quadClass:"material_conflict"}`
2. `gdeltToBucket()` crée un GeoEventBucket:
   - id: `geo-bucket-gdelt-123`
   - truthLayer: OBSERVED (feed direct, pas calculé)
   - confidence: 12/20 = 0.6 (normalisé par nombre de sources)
   - properties: `{lat, lon, country:"IRQ", actors:["Iraq Gov","Militia X"], eventType:"material_conflict", goldsteinScale:-8, severity:"critical"}`
   - interactions: 1 × CREATED by "GDELT-feed" via "gdelt_ingest"
3. `projectToVisual()` calcule: color=#2D6A4F (OBSERVED), opacity=0.76, size=10.4px, glowColor=#E63946 (critical), pulse=true
4. GlobeViewer crée un Cesium entity à la position (33.3, 44.4) avec ces props visuelles
5. IntelligenceGrid affiche une row avec QuantumCell coloré par truth layer
6. Si l'analyste clique → recordQuery() ajoute une interaction QUERIED → l'EntityCard affiche le ProvenanceChip

**Que casse si on change goldsteinScale de -8 à -2 ?**
- severity passe de "critical" à "medium"
- projectToVisual: glowColor disparaît, pulse=false, size diminue
- heatmap: la cellule IRQ perd de l'intensité
- ForceGraph: le nœud shrinks, perd le glow rouge
- Propagation: AUCUN autre bucket n'est invalidé (c'est un leaf node OBSERVED)

**EP-2: Cross-validation GDELT × ACLED**

1. GDELT rapporte "Armed clash, Baghdad, 2026-03-24T08:00"
2. ACLED rapporte "Battle, Armed clash, Baghdad, 2026-03-24T07:45", fatalities=5
3. Les 2 arrivent comme GeoEventBuckets séparés
4. QUESTION: comment le système détecte-t-il que c'est le MÊME événement ?
   - Critères: même location (< 0.5° lat/lon), même timeframe (< 2h), même actors
   - MANQUE dans DataBucket v2: pas de mécanisme standard de déduplication/fusion
5. Si détecté: créer un 3e bucket "validated_clash_baghdad" avec:
   - truth_layer: OBSERVED (consolidé)
   - confidence: max(0.6, 0.85) × 0.99 = 0.84 (cross-doc boost)
   - links: VALIDATED_BY→gdelt_bucket, VALIDATED_BY→acled_bucket
   - interactions: CREATED, ENRICHED (cross-validation)
   - properties.fatalities: 5 (enrichi depuis ACLED, pas dispo dans GDELT)

**EP-3: Heatmap comme convolution spatiale**

1. 200 GeoEventBuckets distribués sur une carte du monde
2. `computeHeatmap()` est fondamentalement une **convolution spatiale** du graphe:
   - Kernel = grille 2° × 2° (configurable)
   - Input = ensemble de buckets avec (lat, lon, goldstein, severity)
   - Output = ensemble de HeatmapCells avec (lat, lon, intensity, avgGoldstein, maxSeverity)
3. Chaque HeatmapCell est-elle un DataBucket ? Arguments pour:
   - C'est un résultat COMPUTED avec des inputs traçables
   - A une confiance (normalisée), un truth_layer (COMPUTED)
   - Pourrait recevoir des interactions (PROJECTED quand affiché)
4. Arguments contre:
   - Éphémère — recalculé à chaque refresh
   - Pas de persistance nécessaire
   - Volume: 40+ cellules × 8 frames temporelles = 320 buckets éphémères
5. **Proposition**: les HeatmapCells ne sont PAS des DataBuckets. Ce sont des **projections calculées** (comme un pixel dans un rendu 3D). Le bucket est l'EVENT, pas l'agrégat.

### 3. Gaps identifiés (5)

**GAP-1: Pas de mécanisme de déduplication/fusion**
Le même événement rapporté par GDELT et ACLED crée 2 buckets séparés. Il n'y a pas de:
- Standard pour détecter les doublons (matching criteria)
- Mécanisme de fusion (quel bucket survit ? merge des propriétés ?)
- Type de lien VALIDATED_BY ou CORROBORATES
- Proposition: ajouter un `canonical_id` optionnel + lien SAME_AS

**GAP-2: Pas de type formel GeoEvent dans les link relations**
`links: List[Dict[str, str]]` est un fourre-tout. Pour le géospatial, j'ai besoin de:
- SAME_LOCATION (même pays/zone)
- SAME_ACTOR (acteurs partagés)
- TEMPORAL_SEQUENCE (dans les 24h)
- CO_OCCURRING (< 2° lat/lon)
- ESCALATION (goldstein qui empire entre 2 events)
- CAUSAL (conflit → déplacement → crise humanitaire)
Proposition: typer les relations comme enum + weight + metadata

**GAP-3: Pas de support natif pour les coordonnées spatiales**
QuantumData n'a pas de champs lat/lon/alt. Chaque projet géospatial (S-Agent, R-Agent, Q-Agent) doit mettre ça dans `properties: Dict[str, Any]` sans schéma. Proposition: ajouter `spatial_context: Optional[SpatialContext]` avec `{lat, lon, alt, crs, bbox, geojson}`.

**GAP-4: Pas de concept d'agrégation/pooling**
Le heatmap est une agrégation spatiale. Le temporal density engine est une agrégation temporelle. Ces opérations n'ont pas de modèle dans DataBucket. Est-ce que l'agrégat est un bucket COMPUTED avec N inputs ? Ou est-ce une vue éphémère ? La réponse impacte la traçabilité.

**GAP-5: Pas de streaming/TTL pour le temps réel**
Les événements GDELT arrivent en continu. Un bucket créé il y a 48h est-il encore pertinent ? Il n'y a pas de:
- TTL (time-to-live) sur les buckets
- Mécanisme d'archivage (ARCHIVED interaction type existe mais pas de policy)
- Concept de "fenêtre glissante" pour les flux continus

### 4. Questions ouvertes depuis le domaine géospatial

1. **Un événement = 1 bucket ou N ?** Un événement GDELT a des acteurs, un lieu, un type. Faut-il 1 bucket "event" avec actors dans properties, ou 1 bucket "event" + 2 buckets "actor" + 1 bucket "location" liés par des edges ? (Mon implémentation: 1 bucket avec actors dans properties. Plus simple, mais empêche de traverser le graphe par acteur.)

2. **Les images satellite sont-elles des DataBuckets ?** Un satellite capture une image d'un site militaire. C'est un blob binaire. Est-ce un DataBucket (modality=visual, value=image_url, confidence=resolution) ou juste un document source référencé ?

3. **Comment lier un GeoEventBucket à l'ontologie L2 ?** Mon concept "plover:MATERIAL_CONFLICT" devrait-il être un lien vers un nœud ontologique, ou juste une propriété plate ? Si lien: le nœud ontologique est-il lui-même un DataBucket ?

4. **Le goldstein_scale est-il un bucket séparé ?** C'est un score calculé par GDELT, pas une donnée brute. Devrait-il être un DataBucket COMPUTED (confidence=0.7, formula="GDELT Goldstein Scale", inputs=[event]) lié à l'event par DERIVES ? Ou juste une propriété ?

### 5. Proposition: GeoEventBucket v3

```typescript
interface GeoEventBucketV3 {
  // Identity (from QuantumData)
  id: string;
  label: string;
  bucket_type: "geo_event";

  // Value (the "primary metric" of this event)
  value: number;         // goldstein_scale as primary value
  unit: "goldstein";
  value_type: "ratio";

  // Epistemic (from QuantumData v2)
  truth_layer: TruthLayer;
  confidence: number;
  extraction_method: ExtractionMethod; // "api" for GDELT, "api" for ACLED

  // Spatial (NEW — should be in shared QuantumData)
  spatial: {
    lat: number;
    lon: number;
    alt?: number;
    crs: "EPSG:4326";
    bbox?: [number, number, number, number]; // for area events
    country: string;
    region?: string;
  };

  // Domain-specific (in properties, but TYPED)
  actors: Array<{ name: string; type: string; country?: string }>;
  event_type: string;    // PLOVER ontology concept
  severity: "low" | "medium" | "high" | "critical";
  source_feed: "GDELT" | "ACLED" | "USGS" | "computed";

  // Cross-validation (NEW)
  canonical_id?: string;  // shared ID when same event from multiple sources
  corroborations: string[]; // IDs of buckets that validate this one

  // Links (TYPED, not Dict[str, Any])
  links: Array<{
    target: string;
    relation: GeoRelationType;
    weight: number;
    metadata?: Record<string, unknown>;
  }>;

  // Interaction journal (from DataBucket)
  interactions: Interaction[];

  // Lifecycle
  created_at: string;
  created_by: string;
  ttl?: number;           // seconds until archival (NEW for streaming)
}

type GeoRelationType =
  | "SAME_LOCATION"
  | "SAME_ACTOR"
  | "TEMPORAL_SEQUENCE"
  | "CO_OCCURRING"
  | "ESCALATION"
  | "CAUSAL"
  | "VALIDATED_BY"
  | "SAME_AS";
```

### Recherche domaine: Standards géospatiaux pertinents

- **GeoSPARQL** (OGC): standard ontologique pour les données géospatiales dans les knowledge graphs. Définit Feature, Geometry, SpatialRelation. Notre `spatial` context devrait être compatible.
- **STIX/TAXII** (OASIS): standards pour le partage de threat intelligence. Les "Indicators" STIX sont proches de nos GeoEventBuckets (observable + context + confidence).
- **GDELT Project**: utilise le codebook CAMEO/PLOVER pour classifier les événements. Notre mapping eventType→PLOVER est correct.
- **Apache SIS / GeoTools**: frameworks Java pour le traitement géospatial. Trop lourd pour nous mais leurs modèles Feature/Coverage sont pertinents.
- **H3 (Uber)**: indexation spatiale hexagonale. Pourrait remplacer notre grille 2°×2° pour le heatmap avec une résolution variable (zoom-dependent).

---

## Task Force KG-ORM — S-Agent (Satellite-Spy) — 2026-03-25

### Mes pain points (Problèmes 1-5)

#### Problème 1 : Comment le graphe SAIT ce que sont mes données géospatiales ?

**Le problème tel que je le vis :** Quand un événement GDELT entre dans le système — disons `{goldstein:-7.5, lat:33.3, lon:44.4, actors:["Iraq Gov", "Militia X"], quadClass:"material_conflict"}` — le graphe doit DÉJÀ savoir :

- Qu'un événement de `quadClass=material_conflict` avec `goldstein < -7` est **critique** (classification de sévérité)
- Que l'Irak (lat 33, lon 44) est dans une **watch region** "Middle East" avec un historique de conflits
- Que "Iraq Gov" est un **acteur étatique** et "Militia X" un **acteur non-étatique** (classification CAMEO/PLOVER)
- Qu'un événement critique avec 12+ sources est **fiable** (heuristique de confiance)
- Que si 3+ événements critiques dans la même zone en 24h → **pattern d'escalade** détectable
- Que les événements en Irak doivent être **corrélés** avec les prix du pétrole Brent et les routes de Hormuz

**Connaissance a priori nécessaire :**

1. **Ontologie PLOVER/CAMEO** : 16 types d'événements (MAKE_PUBLIC_STATEMENT, APPEAL, COOPERATE, COERCE, ASSAULT, USE_MILITARY_FORCE, etc.) organisés en hiérarchie coopération→conflit. Le graphe doit connaître cette hiérarchie pour classer automatiquement et propager l'escalade.

2. **GeoSPARQL** (OGC) : ontologie W3C pour les features géospatiales. Définit `Feature`, `Geometry`, `SpatialRelation` (contains, intersects, within). Notre `spatial_context` devrait être un nœud GeoSPARQL `Feature` avec une `Geometry` liée.

3. **SEM (Simple Event Model)** : ontologie d'événements qui distingue `Event`, `Actor`, `Place`, `Time`. C'est exactement notre décomposition — mais actuellement on met tout dans un seul bucket au lieu de séparer les entités.

**Ce qui n'existe PAS et qu'il faut inventer :**
- Un mapping **goldstein_scale → severity ontologique** qui soit configurable par domaine
- Des **règles d'escalade temporelle** (3 events critiques en 24h dans 2° → escalation pattern)
- Un **graphe de corrélation cross-domaine** (conflit Irak ↔ prix pétrole ↔ routes maritimes)

**3 exemples concrets :**

1. **GDELT event "Military buildup Baghdad"** : le graphe devrait savoir que CAMEO code 170 (coerce) est sous PLOVER "USE_CONVENTIONAL_MILITARY_FORCE", que Baghdad est en Irak (ISO 3166: IRQ), et que l'Irak est dans la watch region "Middle East" qui a une corrélation 0.7 avec Brent crude.

2. **ACLED conflict "Armed clash, Mosul, 5 fatalities"** : le graphe devrait savoir que "battle" ACLED mappe à PLOVER "USE_CONVENTIONAL_MILITARY_FORCE", que Mosul (36.3°N, 43.1°E) est à 300km de Baghdad (même cluster spatial), et que 5 fatalities est above-median pour cette région.

3. **Satellite pass "KH-11 Keyhole over Persian Gulf"** : le graphe devrait savoir qu'un satellite de reconnaissance qui passe au-dessus d'une zone de conflit actif est un signal d'intelligence (surveillance pattern), que la corrélation pass + conflit actif élève le threat level.

#### Problème 2 : Comment je déclare un GraphModel géospatial ?

**Mon pain point :** Mon `GeoEventBucket.ts` actuel est une **interface TypeScript plate** avec un `properties: Dict[str, Any]`. Aucun typage de relations, aucune formule de propagation, aucune connaissance ontologique.

Quand je fais `gdeltToBucket(event)`, je convertis manuellement chaque champ. Si GDELT ajoute un nouveau champ, je dois modifier le code. Il n'y a pas de déclaration de modèle qui "sait" ce qu'est un événement GDELT.

**Ce qui me manque comme types de champs :** SpatialField (lat/lon/alt/crs/bbox), TemporalField (instant vs duration vs recurring), ActorField (nom + type + pays + rôle), SeverityField (enum calculé depuis goldstein + mentions).

**Ce qui me manque comme types de relations :**
- `SAME_LOCATION` — partage la même zone spatiale (avec distance threshold)
- `SAME_ACTOR` — partage un acteur commun (fuzzy matching sur noms)
- `ESCALATES_TO` — un événement est une escalade temporelle d'un précédent
- `CORRELATES_WITH` — cross-domaine (conflit → impact marché)
- `DETECTED_BY` — un satellite/capteur a observé l'événement
- `VALIDATED_BY` — une 2ème source confirme le même fait

**Comment la propagation doit fonctionner :** Pour le géospatial, la propagation est SPATIALE et TEMPORELLE, pas juste arithmétique. Un événement critique en Irak ne "recalcule" pas le prix du pétrole par formule — il **influence** le prix par corrélation probabiliste. C'est un `CORRELATES_WITH` (weight=0.7) pas un `COMPOSES` (déterministe).

#### Problème 3 : Comment mes données entrent dans le graphe ?

**Sources concrètes :**

| Source | Format | Fréquence | Volume | Fiabilité |
|--------|--------|-----------|--------|-----------|
| GDELT GEO API | GeoJSON | 15min batches | 200-500 events/batch | Medium (journalistique) |
| GDELT DOC API | JSON articles | 15min | 100-250 articles | Low (pas de coords) |
| ACLED | REST JSON | Daily update | 50-200 conflicts/day | High (vérifié par chercheurs) |
| USGS Earthquakes | GeoJSON | Real-time | 5-50 events/day | Very High (capteurs) |
| Satellite TLE | TXT (2-line elements) | 12h updates | 2000+ satellites | Very High (NORAD) |
| OpenSky Network | REST JSON | 10s polling | 1000+ aircraft | High (ADS-B) |

**Scénario end-to-end : GDELT event → graph :**

1. **Source brute :** GDELT GEO API retourne un GeoJSON feature avec properties `{actor1geo: "33.3,44.4", goldsteinscale: -7.5, nummentions: 45, ...}`
2. **Parsing/extraction :** `parseGDELTGeoJSON()` extrait lat/lon, mappe quadClass, assigne globalEventId
3. **Instanciation :** `gdeltToBucket()` crée un GeoEventBucket avec truth_layer=OBSERVED, confidence=45/20=0.6 (clipped)
4. **Liens créés :** `buildGeoEventGraph()` itère tous les buckets et crée des edges SAME_LOCATION (même pays), SAME_ACTOR (acteur commun), TEMPORAL_SEQUENCE (< 24h)
5. **Confiance :** GDELT direct = OBSERVED (confidence normalisée par numSources). Si < 5 sources → confidence < 0.25 (signal faible).

**Ce qui peut MAL TOURNER :**
- **Doublons** : GDELT et ACLED rapportent le même événement → 2 buckets au lieu de 1. Pas de mécanisme de dédup.
- **Coordonnées manquantes** : GDELT DOC API ne fournit pas de lat/lon — on utilise le centroïde pays avec jitter aléatoire. Faux signal spatial.
- **Latence** : GDELT met 15-30 min. ACLED met 24h+. Les événements arrivent dans le désordre temporel.
- **Bruit** : GDELT inclut des articles de presse non vérifiés. Confiance variable, pas de ground truth.

**Mises à jour :** Les événements géo sont **append-only**. Un événement passé ne change pas. Mais sa classification peut être enrichie (OBSERVED → COMPUTED si un modèle ML le re-classe).

#### Problème 4 : Comment un calcul/modèle consomme le graphe ?

**Calcul concret : Anomaly Heatmap (convolution spatiale)**

Ce calcul traverse le graphe et agrège :

- **Inputs :** Tous les GeoEventBuckets dans une fenêtre temporelle (24h) et spatiale (global)
- **Opération :** Convolution spatiale — grille 2°×2°, chaque cellule accumule (eventCount, goldsteinSum, maxSeverity)
- **Outputs :** HeatmapCells avec intensity normalisée [0,1]

```
Pour chaque bucket b dans window(24h):
  cell = grid[floor(b.lat/2), floor(b.lon/2)]
  cell.count += 1
  cell.goldstein_sum += b.goldstein
  cell.max_severity = max(cell.max_severity, b.severity)
Normaliser: cell.intensity = cell.count / max(counts)
```

**Quels nœuds sont inputs ?** Tous les GeoEventBucket dans la fenêtre temporelle.
**Quels nœuds sont outputs ?** Les HeatmapCells (mais sont-elles des DataBuckets ? voir GAP-4 du v3).
**Comment sait-on quoi recalculer ?** Quand un nouveau bucket arrive, on recalcule la cellule correspondante. Pas besoin de topo sort — c'est un agrégat incrementable.
**Les formules sont-elles dans l'ontologie ?** NON. La convolution spatiale est une opération procédurale. L'ontologie sait que "GDELT event est un GeoEvent", mais la grille 2°×2° est un choix d'implémentation.
**Confiance :** La confiance d'une HeatmapCell = weighted average des confidences des buckets qui la composent. Plus il y a de sources indépendantes, plus la confiance monte.

**Autre calcul : Cross-intelligence correlation**

```
crossIntelligenceAlert = f(conflicts_IRQ, marketData_BRENT, satPasses_IRQ)
Si conflicts_IRQ.count > threshold ET brent.price_change > 5% ET satPasses_IRQ.count > 2:
  → ALERT severity=HIGH, confidence=0.7
```

Ici les inputs viennent de 3 domaines différents. Le calcul crée un NOUVEAU bucket COMPUTED lié à ses inputs par CORRELATES_WITH. La confiance = min(conf_conflicts, conf_market, conf_sat) × 0.8.

#### Problème 5 : Comment le graphe se projette en UI automatiquement ?

**Projections nécessaires pour le géospatial :**

| Projection | Component | Data mapping |
|-----------|-----------|-------------|
| **Globe 3D** | CesiumJS markers | lat/lon→position, severity→size, truthLayer→color, confidence→opacity |
| **Table** | IntelligenceGrid | buckets→rows, properties→columns, truthLayer→cell color |
| **Force Graph** | GeoEventForceGraph | buckets→nodes, relations→edges, severity→node size |
| **Heatmap** | AnomalyHeatmap | aggregated cells→rectangles, intensity→color gradient |
| **Timeline** | TemporalReplay | buckets→keyframes, time→x-axis, severity→y-axis |
| **Narrative** | AI text | bucket properties→template slots ("On {date}, {actors} clashed in {location}...") |

**Comment le GraphModel déclare-t-il la projection ?** Actuellement, c'est hardcodé dans chaque composant. `projectToVisual()` est dans GeoEventBucket.ts. Le IntelligenceGrid sait qu'il faut mapper goldstein→couleur. C'est du code, pas du déclaratif.

**Proposition : Perspective registry** (inspiré Neo4j Bloom) :
```typescript
const GEO_INTELLIGENCE_PERSPECTIVE: Perspective = {
  name: "Intelligence Map",
  nodeLabels: {
    "plover:GeoEvent": { displayName: "Event", icon: "🎯" },
    "madgic:Actor": { displayName: "Actor", icon: "👤" },
  },
  projections: {
    "plover:GeoEvent": {
      spatial: { component: CesiumMarker, props: { sizeFn: "goldstein_magnitude", colorFn: "truth_layer" } },
      tabular: { component: IntelligenceGridRow, props: { columns: ["date","location","type","goldstein","confidence"] } },
      graph: { component: ForceNode, props: { radiusFn: "goldstein_magnitude" } },
    },
  },
};
```

**Scénario : l'analyste modifie la sévérité d'un événement →**
1. Analyste dans IntelligenceGrid change severity de "high" à "critical"
2. `recordQuery(bucket, "analyst")` + `bucket.severity = "critical"` → Interaction CORRECTED
3. `projectToVisual()` recalcule : glowColor="#E63946", pulse=true
4. Globe : marker pulse en rouge, glow apparaît
5. ForceGraph : nœud grossit + glow
6. Heatmap : la cellule contenant cet event recalcule son maxSeverity
7. Si alert threshold franchi → nouvelle CrossIntelligenceAlert

---

### Mes 3 GraphModels concrets

#### GraphModel 1 : GeoEvent (l'événement géopolitique)

```python
class GeoEvent(GraphModel):
    _concept = 'plover:GeoEvent'
    _ontology = 'madgic:L2-Satellite'

    # Champs typés
    goldstein = FloatField(required=True, range=(-10, 10),
                           description="Goldstein scale: conflict/cooperation intensity")
    location = SpatialField(required=True, crs="EPSG:4326",
                            description="Lat/lon of event epicenter")
    event_type = ConceptField(required=True, ontology='plover:EventType',
                              description="PLOVER classification")
    severity = ComputedField(formula='classify_severity(goldstein, num_mentions)',
                             enum=["low", "medium", "high", "critical"])
    num_mentions = IntField(default=0, description="Number of media mentions")
    tone = FloatField(range=(-100, 100), description="Average article tone")

    # Relations
    actors = ManyToMany('madgic:Actor', edge_type='PARTICIPATES',
                        description="Actors involved in event")
    country = ManyToOne('geo:Country', edge_type='LOCATED_IN')
    source_articles = ManyToMany('madgic:Article', edge_type='EXTRACTED_FROM')
    escalation_of = ForeignKey('plover:GeoEvent', edge_type='ESCALATES_TO',
                               null=True, description="Prior event this escalates")
    corroborated_by = ManyToMany('plover:GeoEvent', edge_type='VALIDATED_BY',
                                  description="Same event from different sources")

    # Propagation
    @on_change('goldstein', 'num_mentions')
    def recompute_severity(self):
        """Severity est recalculé quand goldstein ou mentions changent."""
        if self.goldstein < -7: self.severity = "critical"
        elif self.goldstein < -3: self.severity = "high"
        elif self.goldstein < 0: self.severity = "medium"
        else: self.severity = "low"

    @on_change('severity')
    def propagate_to_heatmap(self):
        """Si severity change, la cellule heatmap contenant cet event doit recalculer."""
        cell = HeatmapCell.objects.get_for_location(self.location, resolution=2)
        if cell:
            cell.recompute()  # agrégation incrémentale

    @on_change('severity')
    def check_escalation(self):
        """Si severity=critical, chercher d'autres events récents dans la même zone."""
        recent = GeoEvent.objects.filter(
            location__within_degrees=2, created_at__gte=now()-hours(24),
            severity__in=["high", "critical"]
        )
        if len(recent) >= 3:
            EscalationAlert.create(events=recent, confidence=0.8)
```

**Pourquoi ces champs :** goldstein et severity sont les métriques centrales du renseignement GDELT. Le SpatialField est nécessaire pour les requêtes géographiques. Le ComputedField severity est dérivé — pas stocké manuellement.

**Pourquoi ces relations :** PARTICIPATES (acteurs), LOCATED_IN (géographie), ESCALATES_TO (chaîne temporelle), VALIDATED_BY (cross-source). Chaque type a une sémantique de propagation différente.

#### GraphModel 2 : Actor (l'acteur géopolitique)

```python
class Actor(GraphModel):
    _concept = 'madgic:GeopoliticalActor'

    name = TextField(required=True, unique_with=['country_code'])
    country_code = TextField(max_length=3, description="ISO 3166 alpha-3")
    actor_type = ConceptField(ontology='cameo:ActorType',
                              enum=["GOV", "MIL", "REB", "OPP", "CVL", "NGO", "IGO", "BUS"])
    threat_level = ComputedField(
        formula='aggregate_events_severity(participates_in)',
        range=(0, 10))

    # Relations
    participates_in = ManyToMany('plover:GeoEvent', edge_type='PARTICIPATES',
                                  reverse=True)
    allied_with = ManyToMany('madgic:GeopoliticalActor', edge_type='ALLIED_WITH',
                              symmetric=True)
    opposed_to = ManyToMany('madgic:GeopoliticalActor', edge_type='OPPOSED_TO',
                             symmetric=True)

    # Propagation
    @on_change('participates_in')
    def recompute_threat_level(self):
        """Threat level = weighted average of severity of events this actor is in."""
        events = self.participates_in.all()
        if not events:
            self.threat_level = 0
            return
        severity_map = {"low": 1, "medium": 3, "high": 6, "critical": 10}
        total = sum(severity_map.get(e.severity, 0) for e in events)
        self.threat_level = min(10, total / len(events))
```

**Pourquoi :** Les acteurs sont des entités persistantes qui accumulent un profil de menace au fil des événements. Séparer Actor de GeoEvent permet de traverser le graphe par acteur ("tous les événements impliquant Russia") et de calculer des métriques cross-événements (threat_level).

#### GraphModel 3 : WatchRegion (la zone de surveillance)

```python
class WatchRegion(GraphModel):
    _concept = 'madgic:WatchRegion'

    name = TextField(required=True)
    bounds = BBoxField(required=True, description="north/south/east/west bounds")
    center = SpatialField(required=True)
    alert_threshold = IntField(default=3,
        description="Number of critical events in 24h to trigger alert")
    market_correlation = ForeignKey('fibo:Commodity', edge_type='CORRELATES_WITH',
                                     null=True, description="Linked commodity")
    correlation_weight = FloatField(default=0.5, range=(0, 1))

    # Relations
    events = ManyToMany('plover:GeoEvent', edge_type='LOCATED_IN',
                         reverse=True, filter='location__within_bbox=bounds')
    surveillance = ManyToMany('madgic:SatellitePass', edge_type='OBSERVED_BY')

    # Propagation
    @on_new_event_in_region
    def check_alert_threshold(self, event):
        """Quand un nouvel event tombe dans cette region, vérifier le seuil d'alerte."""
        recent_critical = self.events.filter(
            severity__in=["high", "critical"],
            created_at__gte=now()-hours(24)
        ).count()
        if recent_critical >= self.alert_threshold:
            RegionalAlert.create(region=self, trigger_event=event,
                                 severity="critical", confidence=0.85)

    @on_change('events')
    def propagate_to_market(self):
        """Si le nombre d'événements critiques change, signal au marché corrélé."""
        if self.market_correlation:
            self.market_correlation.trigger_reevaluation(
                reason=f"Geopolitical tension in {self.name}",
                edge_type=EdgeType.CORRELATES_WITH,
                weight=self.correlation_weight
            )
```

**Pourquoi :** Les WatchRegions sont le pont entre le géospatial et les autres domaines (marché, supply chain). Le `market_correlation` lié par CORRELATES_WITH est la clé de la cross-intelligence. Quand les conflits augmentent au Moyen-Orient, le signal est propagé vers le Brent crude via le graphe — pas par un script hardcodé.

---

### Mon scénario end-to-end

**"Escalade au Moyen-Orient détectée → alerte cross-intelligence → heatmap pulse"**

**1. D'où vient la donnée ?**
GDELT GEO API, batch de 15 minutes. 3 événements rapportés en 30 min :
- Event A: "Iran military exercises", goldstein=-6.5, Tehran, 8 sources
- Event B: "Iraq border clash", goldstein=-8.0, Basra, 15 sources
- Event C: "US Navy deployment Persian Gulf", goldstein=-4.0, 10 sources

**2. Comment elle entre dans le graphe ?**
```
fetchGDELT() → [eventA, eventB, eventC]
for each event:
  bucket = gdeltToBucket(event)  → GeoEvent node in graph
  bucket.actors → Actor nodes (Iran Gov, Iraq Gov, US Navy)
  bucket.location → Country node (IRN, IRQ, intl waters)
  graph.add_node(bucket)
  graph.add_edges(PARTICIPATES, LOCATED_IN, EXTRACTED_FROM)
```

**3. Quels liens se créent automatiquement ?**
- `eventA -SAME_ACTOR("Iran Gov")- eventB` (Iran Gov impliqué dans les 2)
- `eventA -TEMPORAL_SEQUENCE- eventB -TEMPORAL_SEQUENCE- eventC` (< 30 min entre chaque)
- `eventB -LOCATED_IN- WatchRegion("Middle East")`
- `eventA -LOCATED_IN- WatchRegion("Middle East")`
- `eventC -LOCATED_IN- WatchRegion("Persian Gulf")`
- Les 3 events sont dans le **même cluster spatial** (< 5° lat/lon)

**4. Quel calcul les consomme ?**
a) `WatchRegion("Middle East").check_alert_threshold()` : 2 events critical/high en 30min, threshold=3 pas atteint mais ATTENTION signalé
b) `computeHeatmap()` : la cellule (32°N, 46°E) passe de intensity=0.2 à intensity=0.8
c) `crossIntelligenceCorrelation()` : 3 events tension + US Navy = pattern de tension régionale → `CrossIntelAlert(severity="high", confidence=0.75)`

**5. Comment le résultat est projeté en UI ?**
- **Globe** : 3 nouveaux markers rouge/orange pulsants. Heatmap cell passe orange→rouge.
- **IntelligenceGrid** : 3 nouvelles lignes en haut (sorted by date desc), severity cells rouges.
- **ForceGraph** : 3 nouveaux nœuds connectés par TEMPORAL_SEQUENCE, cluster visible.
- **TopBar** : "1 ALERT" badge apparaît (cross-intelligence alert).

**6. L'utilisateur modifie quelque chose → que se passe-t-il ?**
L'analyste dans le Grid change la severity de Event C de "medium" à "high" (il juge que le déploiement naval est plus grave que ce que GDELT a classifié).

→ `Interaction: CORRECTED by "analyst", confidence_before=0.5, confidence_after=0.85`
→ `Event C.severity = "high"` → `recompute_severity()` skipped (override humain)
→ `propagate_to_heatmap()` : cellule Persian Gulf recalcule → intensity monte
→ `WatchRegion("Persian Gulf").check_alert_threshold()` : maintenant 1 high event → pas encore alerte
→ Globe : marker C pulse maintenant + glow orange
→ Mais surtout : le truth_layer de Event C passe de OBSERVED à USER_INPUT → couleur change de vert (Bayati) à doré (Sikah)
→ Le ProvenanceChip montre : G→H (GDELT feed → human correction)

---

### État de l'art (recherches)

#### Problème 1 (connaissance a priori) — Standards

- **OGC GeoSPARQL** : standard W3C pour les features géospatiales dans les knowledge graphs. Définit Feature, Geometry, SpatialRelation. Maturité : adopté par les grandes plateformes (Oracle Spatial, Apache Jena Spatial). On devrait faire hériter notre SpatialField de `geo:Feature`.
- **SEM (Simple Event Model)** : ontologie légère pour les événements (Event, Actor, Place, Time). Plus simple que CIDOC-CRM, suffisant pour nos besoins. Compatible avec notre décomposition GeoEvent + Actor.
- **STIX 2.1** (OASIS Cyber Threat Intelligence) : modélise des "Indicators" avec observed_data + confidence + source. Très proche de notre GeoEventBucket. Le pattern (indicator + sighting + relationship) est directement applicable.
- **GDELT Global Knowledge Graph** : GDELT lui-même est un knowledge graph (2.5 trillion data points). Utilise CAMEO pour les event codes, GKG pour les themes/organizations. On peut s'en inspirer mais c'est un read-only graph — pas d'insertion.

#### Problème 2 (déclaration de modèle) — Frameworks

- **Owlready2** (Python) : OWL ontology manipulation. Permet de définir des classes OWL et d'instancier des individus. Mais pas de propagation réactive.
- **gremlin-python** / **Apache TinkerPop** : language de traversal de graphe universel. Le plus proche d'un "ORM graphe" — mais orienté requête, pas déclaration de modèle.
- **Django-Neomodel** / **Neomodel** : ORM Neo4j pour Python. Syntaxe Django-like (`class Person(StructuredNode): name = StringProperty()`). Le plus proche de ce qu'on veut. Manque la propagation et la confiance.
- **Palantir Foundry Ontology SDK** : déclare des "object types" liés à des datasets. Chaque object type a des propriétés et des relations. Le plus avancé industriellement mais propriétaire.

#### Problème 3 (ingestion) — Pipelines

- **Apache Kafka + Neo4j Streams** : pattern de streaming d'événements vers un graphe. Kafka ingère les events, Neo4j Streams les insère comme nœuds/edges. C'est le pattern pour notre flux GDELT/ACLED.
- **GDELT DOC/GEO API** : REST APIs avec rate limiting. Pas de streaming natif — polling 15min. Le goulot d'étranglement est la latence, pas le volume.
- **Debezium CDC** : Change Data Capture. Si nos événements sont d'abord dans Postgres, Debezium capture les INSERT et les envoie dans le graphe. Pattern applicable pour synchroniser l'API route Next.js vers un graphe persistant.

#### Problème 4 (consommation analytique) — Modèles

- **H3 (Uber)** : indexation spatiale hexagonale. Résolution variable (de 1km à 5000km). Beaucoup mieux que notre grille 2°×2° fixe. Chaque hexagone a un ID unique → peut être un nœud dans le graphe.
- **GNN pour event prediction** : FinDKG (Dynamic Knowledge Graphs for Finance) utilise KGTransformer pour prédire des événements futurs à partir du graphe temporel. Applicable à l'escalade prediction.
- **Spatial convolutions on graphs** : les GCN (Graph Convolutional Networks) font exactement notre heatmap mais de façon apprise. Message passing entre nœuds voisins spatiaux. Uber, Lyft utilisent pour la demande.

#### Problème 5 (projection UI) — Plateformes

- **CesiumJS** (déjà utilisé) : globe 3D avec entités. Pas de lien natif avec un knowledge graph — on fait le bridge dans GlobeViewer.tsx.
- **Kepler.gl** (Uber) : visualisation géospatiale data-driven. Les layers sont déclarées par config JSON, pas par code. Plus proche du déclaratif qu'on veut.
- **deck.gl** (Uber/vis.gl) : WebGL layers data-driven. Chaque layer prend un dataset + accessors (getPosition, getColor, getRadius). C'est exactement le pattern de projection : data → visual channel mapping.
- **SHACL → Map** : pas de framework existant pour générer des cartes depuis des shapes SHACL. C'est un gap qu'on pourrait combler.

---

### Mes 5 questions les plus dures

**Q1 : Un événement géo est-il 1 nœud ou N nœuds ?**
Actuellement : 1 bucket avec actors dans properties (array de strings). Problème : impossible de traverser le graphe "tous les événements de Russia" sans scanner TOUS les buckets. Si on sépare Actor en nœud propre : on multiplie par 3-4 le nombre de nœuds, on complexifie l'ingestion, mais on gagne la traversabilité. Quel est le bon trade-off ? Palantir fait N nœuds. GDELT fait 1 nœud. Qui a raison pour notre scale (1000-10000 events/jour) ?

**Q2 : Comment fusionner des événements de sources différentes sans ground truth ?**
GDELT et ACLED rapportent "Armed clash, Baghdad, 2026-03-24". Même événement ? Les coords diffèrent de 0.3°. Les dates de 2h. Les acteurs ont des noms différents ("Iraq Security Forces" vs "Iraqi Army"). Il n'y a pas de identifiant commun. Le fuzzy matching (location < 0.5° AND time < 4h AND actor similarity > 0.7) aura des faux positifs. Comment scorer la probabilité de match sans être trop agressif ou trop conservateur ?

**Q3 : Le heatmap est-il dans le graphe ou en dehors ?**
Chaque HeatmapCell agrège 5-50 événements. C'est une projection spatiale. Si on en fait des DataBuckets : traçabilité parfaite (inputs liés par AGGREGATES), mais volume × 10 (320 cellules × 8 frames temporelles = 2560 buckets éphémères par refresh). Si on les laisse hors du graphe : pas de traçabilité, mais performant. Y a-t-il un pattern "vue matérialisée dans un graphe" comme les materialized views SQL ?

**Q4 : Comment gérer le temps réel (30fps capteurs) vs le temps différé (24h ACLED) dans le même graphe ?**
Un satellite envoie sa position toutes les 10s. ACLED met à jour 1 fois/jour. Le graphe doit les contenir tous les deux. Mais si chaque position satellite est un nœud : 8640 nœuds/jour/satellite × 2000 satellites = 17M nœuds/jour. C'est intenable. Faut-il un "streaming layer" séparé du "knowledge layer" ? Ou des buckets avec TTL qui expirent ?

**Q5 : Comment la propagation cross-domaine (conflit → marché → supply chain) fonctionne sans être un spaghetti de règles ad-hoc ?**
Aujourd'hui : `if conflicts_IRQ > threshold AND brent_change > 5% → alert`. C'est un script. Dans le graphe : `GeoEvent -CORRELATES_WITH(weight=0.7)→ Commodity("Brent")`. Mais CORRELATES_WITH est vague. Le poids 0.7 vient d'où ? Du domaine expert ? D'une régression ? D'un GNN ? Si le poids est appris, il change au fil du temps. Comment mettre à jour les poids de corrélation sans casser la traçabilité ? C'est le problème fondamental du "intelligence fusion" et aucune plateforme open-source ne le résout proprement.
