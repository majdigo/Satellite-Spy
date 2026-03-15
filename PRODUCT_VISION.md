# SATELLITE SPY — Vision Produit

> **Version** : 1.0 — Mars 2026
> **Statut** : Document fondateur

---

## Le problème fondamental

Les crises mondiales (conflits, catastrophes, ruptures supply chain, chocs de marche)
ne surgissent jamais d'un seul domaine. Elles emergent de la **convergence de signaux faibles**
disperses dans des systemes differents : satellites, marches financiers, mouvements militaires,
medias, donnees economiques.

Aujourd'hui, ces signaux sont :
- **Isoles** — chaque domaine a ses propres outils, ses propres analystes
- **Retardes** — le temps de correler manuellement, la crise a eclate
- **Passifs** — les dashboards affichent des donnees, ils ne proposent pas de decisions

**Le cout de cette fragmentation** : les decideurs reagissent aux crises au lieu de les anticiper.

---

## Diagnostic honnete de l'existant

Satellite Spy est aujourd'hui un **agregateur de donnees avec visualisation 3D**.
C'est impressionnant techniquement (~10K lignes, 9 APIs, moteur de correlation).
Mais soyons lucides sur les ecarts :

| Ce qu'on a | Ce qu'il manque |
|---|---|
| 9 sources de donnees integrees | Pas de modele du monde (graph de connaissances) |
| Moteur de correlation rule-based | Pas de prediction reelle (ML/simulation) |
| Alertes et notifications | Pas de recommandations d'action |
| Affichage de donnees sur globe 3D | Pas de workflow de decision |
| Patterns historiques pre-codes | Pas d'apprentissage (le systeme ne progresse pas) |
| Interface mono-utilisateur | Pas de collaboration operationnelle |
| Analyse LLM ponctuelle | Pas de raisonnement continu sur le contexte |

**En resume** : on a la couche 1 (ingestion) et un debut de couche 3 (analyse),
mais pas de couche 2 (modele du monde) ni de couche 4 (moteur d'action).

---

## Vision produit

### Enonce

> **Satellite Spy est un systeme d'intelligence operationnelle qui transforme
> les signaux faibles du monde reel en decisions anticipees.**

Ce n'est pas un dashboard. Ce n'est pas un outil d'analyse.
C'est un **copilote strategique** pour les decideurs qui doivent comprendre
le monde en temps reel et agir avant les crises.

### Principe fondateur

**Le produit ne montre pas des donnees. Il genere des decisions.**

La valeur n'est pas dans l'affichage de 1000 satellites sur un globe.
Elle est dans la phrase : *"Un regroupement de satellites de reconnaissance
au-dessus du detour d'Hormuz, combine a des mouvements de tankers et une
hausse anormale des options sur le petrole, suggere une disruption d'approvisionnement
dans 48-72h. Actions recommandees : [...]"*

---

## Utilisateurs cibles

### Persona 1 — Analyste renseignement (OSINT)

**Profil** : analyste dans une cellule de veille (gouvernement, think tank, entreprise de defense)

**Besoin** : detecter des situations anormales a partir de sources ouvertes,
produire des rapports structures, ne rien rater

**Aujourd'hui** : jongle entre 15 onglets, CelesTrak, FlightRadar24, Twitter,
GDELT, terminaux Bloomberg. Fait la correlation a la main.

**Avec Satellite Spy** : un seul ecran. Le systeme fait la correlation.
L'analyste valide, enrichit, et diffuse.

### Persona 2 — Decideur operationnel (cellule de crise)

**Profil** : directeur operations dans une entreprise exposee (energie,
logistique, defense) ou cellule de crise gouvernementale

**Besoin** : comprendre l'impact d'un evenement sur ses operations en minutes,
pas en heures. Recevoir des recommandations, pas des graphiques.

**Aujourd'hui** : attend les rapports de ses equipes. Reagit.

**Avec Satellite Spy** : recoit des alertes contextualisees avec impact calcule
et options d'action. Anticipe.

### Persona 3 — Trader / Risk Manager (geopolitique)

**Profil** : gere un portefeuille expose aux risques geopolitiques
(commodites, defense, emergents)

**Besoin** : detecter les signaux geopolitiques avant qu'ils atteignent les marches.
Quantifier l'impact. Agir vite.

**Avec Satellite Spy** : recoit des alertes de type "pattern Hormuz detecte,
impact estime sur CL=F : +8-12%, confiance 73%. Precedents historiques : [...]"

---

## Architecture produit cible — Les 4 couches

### Couche 1 — Ingestion (EXISTE)

Collecte et normalisation de donnees multi-sources en temps reel.

```
Sources actuelles :               Sources futures :
- CelesTrak (satellites)          - AIS maritime (navires)
- OpenSky (aeronefs)              - Sentinel/Copernicus (imagerie SAR)
- GDELT (medias)                  - Donnees douanieres
- ACLED (conflits)                - Reseaux sociaux (Twitter/X, Telegram)
- USGS/ReliefWeb (catastrophes)   - Dark web monitoring
- WorldBank (economie)            - Registres d'entreprises
- Marches (commodites/actions)    - Donnees telecom/internet
```

**Etat** : Fonctionnel. 9 sources integrees, polling regulier.

**Prochaines etapes** :
- Ajouter AIS maritime (critique pour supply chain)
- Integrer imagery satellite (Sentinel-2, changement detection)
- Connecteurs modulaires (architecture plugin)

---

### Couche 2 — Modele du monde (A CONSTRUIRE)

C'est **la piece manquante critique**. Le systeme doit construire et maintenir
une representation structuree du monde reel.

#### Knowledge Graph operationnel

Chaque entite du monde reel devient un noeud dans un graphe :

```
Entites :                    Relations :
- Pays                       - [Pays] --controle--> [Base militaire]
- Region                     - [Base militaire] --deploie--> [Satellite]
- Base militaire             - [Route maritime] --traverse--> [Detour]
- Satellite                  - [Commodite] --produite_par--> [Pays]
- Navire                     - [Conflit] --impacte--> [Route maritime]
- Aeronef                    - [Satellite] --survole--> [Region]
- Route maritime             - [Marche] --reagit_a--> [Conflit]
- Pipeline                   - [Entreprise] --depend_de--> [Supply chain]
- Commodite
- Entreprise
- Evenement
```

#### Etat du monde en temps reel

Le graphe est mis a jour en continu :
- Un satellite bouge → sa relation "survole" change
- Un conflit eclate → nouvelles relations "impacte" se creent
- Un prix bouge → la relation "reagit_a" est evaluee

**Technologie suggeree** : Neo4j ou un graph en memoire (pour la latence),
avec projection spatiale et temporelle.

**Valeur** : permet de repondre a des questions comme :
- "Quelles supply chains sont exposees si le port de Shanghai ferme ?"
- "Quels satellites ont survole cette base dans les 72 dernieres heures ?"
- "Quel est le chemin de dependance entre ce conflit et ce marche ?"

---

### Couche 3 — Intelligence & Prediction (EN COURS)

Transformer les donnees et le graphe en comprehension et prediction.

#### 3a — Detection d'anomalies (EXISTE, A AMELIORER)

L'existant :
- Correlation rule-based (region ↔ commodite, conflit ↔ marche)
- Pattern matching sur scenarios historiques pre-codes
- Analyse LLM ponctuelle

Ce qu'il faut construire :
- **Anomaly scoring multi-dimensionnel** : combiner signaux de plusieurs domaines
  en un score de confiance unique
- **Baseline comportementale** : le systeme apprend ce qui est "normal" pour
  chaque entite/region et detecte les deviations
- **Raisonnement causal** : pas juste "A et B arrivent en meme temps"
  mais "A cause probablement B parce que [chemin dans le graphe]"

#### 3b — Prediction (A CONSTRUIRE)

- **Propagation de crise** : si X arrive, quelles sont les consequences
  en cascade dans le graphe ? (simulation Monte Carlo sur le knowledge graph)
- **Fenetres temporelles** : "dans combien de temps l'impact atteint le marche ?"
  basees sur les latences historiques
- **Scenarios what-if** : l'utilisateur modifie une variable,
  le systeme recalcule les impacts

#### 3c — Raisonnement IA continu (A CONSTRUIRE)

Au lieu d'appels LLM ponctuels, le systeme maintient un **contexte de raisonnement** :
- Resume glissant de la situation mondiale
- Hypotheses en cours (avec niveau de confiance)
- Questions ouvertes que le systeme surveille activement
- Mise a jour du raisonnement a chaque nouveau signal

---

### Couche 4 — Moteur d'action (A CONSTRUIRE)

C'est ce qui transforme un dashboard en **systeme operationnel**.

#### Recommandations structurees

Chaque alerte produit non pas juste un message, mais un **paquet de decision** :

```
┌──────────────────────────────────────────────────┐
│  ALERTE CROSS-INTELLIGENCE                       │
│  Confiance: 78%  |  Severite: HAUTE              │
├──────────────────────────────────────────────────┤
│                                                  │
│  SITUATION                                       │
│  Regroupement anormal de 4 satellites recon.     │
│  au-dessus du detroit d'Hormuz. Hausse +340%     │
│  du volume des options call sur CL=F.            │
│  3 tankers ont change de route.                  │
│                                                  │
│  ANALYSE                                         │
│  Pattern similaire a : Crise Hormuz 2019 (87%),  │
│  Incident tanker 2021 (72%)                      │
│                                                  │
│  IMPACT ESTIME                                   │
│  - Petrole brut : +8-15% sous 48h               │
│  - Defense stocks : +3-5%                        │
│  - VIX : +12-20%                                 │
│  - Supply chain Asie-Europe : disruption 2-4sem  │
│                                                  │
│  ACTIONS RECOMMANDEES                            │
│  [ ] Augmenter surveillance zone Hormuz          │
│  [ ] Alerter equipe trading commodites           │
│  [ ] Activer protocole supply chain backup       │
│  [ ] Preparer brief pour direction               │
│                                                  │
│  [Valider] [Modifier] [Rejeter] [Escalader]      │
└──────────────────────────────────────────────────┘
```

#### Workflow de decision

1. Le systeme detecte un pattern → genere une alerte avec recommandations
2. L'operateur revoit, ajuste, valide ou rejette
3. Les actions validees sont tracees et suivies
4. Le systeme apprend des decisions humaines (feedback loop)

#### Integrations d'action

- **Notifications** : Slack, email, SMS pour alertes critiques
- **Export** : rapports PDF/briefings structures (existe deja en partie)
- **API** : webhook pour declencher des actions dans des systemes externes
- **Collaboration** : partage d'alertes entre operateurs, annotation

---

## Roadmap produit

### Phase 1 — Solidifier les fondations (actuel → +2 mois)

**Objectif** : rendre l'existant fiable et utilisable au quotidien

- [ ] Persistance des donnees (base de donnees — les donnees sont perdues au refresh)
- [ ] Authentification utilisateur
- [ ] AIS maritime (donnees navires — critique pour supply chain)
- [ ] Ameliorer la fiabilite des APIs (retry, cache, fallback)
- [ ] Historique des alertes et decisions
- [ ] Tests E2E sur les workflows critiques
- [ ] Documentation utilisateur

### Phase 2 — Modele du monde (+2 → +5 mois)

**Objectif** : passer d'un agregateur de donnees a un systeme qui "comprend" le monde

- [ ] Knowledge graph des entites et relations
- [ ] Etat du monde temps reel (mise a jour continue du graphe)
- [ ] Requetes sur le graphe ("quels satellites ont survole X ?")
- [ ] Baseline comportementale par entite/region
- [ ] Scoring d'anomalie multi-dimensionnel

### Phase 3 — Intelligence predictive (+5 → +8 mois)

**Objectif** : anticiper les crises au lieu de les reporter

- [ ] Simulation de propagation de crise (cascade dans le graphe)
- [ ] Fenetres temporelles d'impact
- [ ] Scenarios what-if interactifs
- [ ] Raisonnement IA continu (pas juste ponctuel)
- [ ] Apprentissage des patterns (le systeme s'ameliore)

### Phase 4 — Systeme operationnel (+8 → +12 mois)

**Objectif** : transformer l'analyse en action

- [ ] Recommandations structurees (paquets de decision)
- [ ] Workflow de validation humaine
- [ ] Integrations d'action (Slack, webhooks, APIs)
- [ ] Mode collaboration multi-operateurs
- [ ] Feedback loop (le systeme apprend des decisions)
- [ ] Audit trail complet

---

## Positionnement strategique

### Ce qu'on n'est PAS

- **Pas un outil de tracking satellite** (STK, N2YO font ca)
- **Pas un terminal financier** (Bloomberg, Refinitiv font ca)
- **Pas un agregateur de news** (GDELT, Dataminr font ca)
- **Pas un SIG militaire** (ArcGIS, ATAK font ca)

### Ce qu'on EST

**Le seul systeme qui connecte ces domaines et transforme leur convergence
en decisions operationnelles anticipees.**

La valeur est dans le **"et"** :
satellites **ET** marches **ET** conflits **ET** transport **ET** economie
→ correles → predits → traduits en actions.

### Avantage competitif

| Concurrent | Ce qu'il fait bien | Ce qu'il ne fait pas |
|---|---|---|
| Palantir Gotham | Integration donnees, ontologie | Tres cher, deploiement lourd, pas temps reel ouvert |
| Maxar/Planet | Imagerie satellite haute res | Pas de correlation multi-domaine |
| Dataminr | Alertes temps reel (medias) | Pas de spatial, pas de marches |
| Bloomberg Terminal | Donnees financieres exhaustives | Pas de geospatial, pas de OSINT |
| Satellite Spy | Correlation cross-domaine, temps reel, accessible | A construire : prediction, action, graph |

**Notre creneau** : la puissance analytique cross-domaine de Palantir,
avec la vitesse et l'accessibilite d'un SaaS moderne.

---

## Metriques de succes produit

### Metrique nord star

**Temps entre signal faible et decision** (Signal-to-Decision Time)

Aujourd'hui (sans le produit) : heures → jours
Objectif Phase 1 : < 30 minutes (detection + alerte)
Objectif Phase 4 : < 5 minutes (detection + recommandation + action)

### Metriques secondaires

| Metrique | Description | Cible |
|---|---|---|
| Taux de detection | % de crises detectees avant qu'elles eclatent | > 70% |
| Precision des alertes | % d'alertes qui menent a une action | > 40% |
| Faux positifs | % d'alertes non pertinentes | < 30% |
| Couverture | % des crises majeures couvertes par les sources | > 85% |
| Adoption | Frequence d'utilisation quotidienne par operateur | > 3 sessions/jour |
| Confiance | Score de confiance moyen des predictions validees | > 65% |

---

## Principes produit

1. **Decision > Donnee** — Chaque feature doit rapprocher l'utilisateur d'une decision.
   Si ca ne mene pas a une action, ca ne devrait pas etre dans le produit.

2. **Signal > Bruit** — Mieux vaut 3 alertes pertinentes que 50 notifications.
   Le systeme doit filtrer, pas inonder.

3. **Anticipation > Reaction** — La valeur est dans le "avant", pas le "apres".
   Chaque feature doit etre evaluee : "est-ce que ca aide a voir avant ?"

4. **Confiance calibree** — Toujours afficher le niveau de confiance.
   Ne jamais presenter une hypothese comme un fait.

5. **Humain dans la boucle** — Le systeme recommande, l'humain decide.
   L'automatisation totale est un piege dans ce domaine.

6. **Simplicite operationnelle** — L'interface doit etre utilisable a 3h du matin
   par un operateur fatigue en situation de crise. Pas de complexite inutile.

---

## Conclusion

Satellite Spy a les fondations techniques pour devenir un produit de reference
dans l'intelligence operationnelle cross-domaine. Le gap a combler n'est pas technique
— c'est un gap de **pensee produit** :

**Passer de "regarder le monde" a "comprendre le monde et agir dessus".**

Les 4 couches (ingestion → modele → intelligence → action) sont le chemin.
Chaque feature, chaque sprint, chaque decision technique doit etre evaluee
a travers cette grille : "est-ce que ca nous rapproche d'un systeme qui genere
des decisions, ou est-ce qu'on ajoute juste un widget de plus ?"
