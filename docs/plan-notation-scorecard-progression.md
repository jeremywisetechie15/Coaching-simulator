# Plan - Notation scorecard et progression roleplay

Date: 2026-07-02

## Objectif

Ajouter un pipeline de notation scorecard generique sans casser le pipeline actuel base sur les fichiers de notation `criteres_v1` / DAGO.

La sortie finale reste le meme contrat:

```txt
sessions.notation_json = {
  score_global,
  synthese,
  methodo,
  discours,
  transcription
}
```

Le `notation_json` reste le document complet pour l'affichage detaille. Les nouvelles tables normalisees servent aux scores, stats, pages progression et agregations.

## Contraintes

- Ne pas modifier les prompts specifiques existants.
- Ne pas casser le runtime iframe public utilise par Figma Make.
- Ne pas casser `POST /api/notation` ni `GET /api/notation?scenario_id=...`.
- Ne pas supprimer le mode PDF tant que les anciens scenarios l'utilisent.
- Garder la SSOT: la methode, la scorecard, les criteres, les competences et les items viennent de la DB, pas des prompts.
- Ne pas faire confiance a l'IA pour les IDs DB.

## Etat actuel

Pipeline actuel:

```txt
sessions + messages + scenarios
+ notation_methods
+ notation_method_steps
+ notation_method_files dans notation_pdf
+ prompts notation.*
+ notation_output_schemas
-> OpenAI
-> sessions.notation_json
```

Dans `src/app/api/notation/route.ts`, la route fait deja un appel OpenAI par onglet:

- `synthese`
- `methodo`
- `discours`
- `transcription`

Elle sauvegarde ensuite le resultat dans `sessions.notation_json`.

## Pipeline cible

Deux modes coexistent.

### Mode legacy PDF

Utilise pour les scenarios sans scorecard exploitable.

```txt
transcript
+ prompts legacy existants
+ fichiers notation_pdf
-> OpenAI
-> sessions.notation_json
```

Les prompts et fichiers existants restent inchanges.

### Mode scorecard generique

Utilise quand `scenarios.scorecard_id` est renseigne et exploitable.

```txt
transcript
+ methode DB
+ method_steps DB
+ scorecard DB
+ scorecard_steps DB
+ scorecard_criteria DB
+ skills DB
+ skill_dimension_items DB
+ criterionMap serveur
+ prompts notation.scorecard.*
-> OpenAI
-> sessions.notation_json
-> resultats normalises DB
```

## Prompts generiques a ajouter

Ajouter uniquement quatre nouvelles lignes dans `prompts`:

```txt
notation.scorecard.methodo
notation.scorecard.synthese
notation.scorecard.discours
notation.scorecard.transcription
```

Ces prompts ne doivent contenir aucune logique AC/DC, DAGO ou methode specifique.

Ils doivent seulement definir le role de l'IA:

- analyser le transcript selon la methode fournie;
- utiliser uniquement la scorecard fournie;
- respecter les refs de criteres fournies;
- ne creer aucun critere;
- ne pas modifier les refs;
- noter selon les preuves observees dans le transcript;
- respecter strictement le schema JSON attendu.

Les anciens prompts restent intacts:

```txt
notation.methodo
notation.synthese
notation.discours
notation.transcription
```

Ils continuent a servir au mode legacy PDF.

## Ordre des appels OpenAI

Le mode legacy peut garder l'ordre actuel.

Le mode scorecard doit noter `methodo` en premier:

```txt
1. Appel OpenAI methodo
2. Validation serveur des refs criteres
3. Calcul serveur des scores
4. Injection de score_global
5. Appels synthese / discours / transcription avec methodo + score_global
6. Merge final dans sessions.notation_json
7. Normalisation des resultats en DB
```

Raison: `methodo` devient la source de verite des points. Les autres onglets doivent rester coherents avec ce score.

## Criterion map

Avant l'appel IA scorecard, le serveur genere une map controlee:

```txt
C1 -> scorecard_criterion_id
      scorecard_step_id
      method_step_id
      skill_id
      dimension
      dimension_item_id
      max_points

C2 -> ...
```

L'IA recoit une version lisible:

```json
{
  "ref": "C1",
  "etape": "Decouvrir",
  "critere": "Identifie le besoin prioritaire",
  "preuve_attendue": "Le commercial fait expliciter le besoin metier",
  "verbatim_conformes": "Si je comprends bien...",
  "points_max": 4
}
```

L'IA renvoie seulement:

```json
{
  "ref": "C1",
  "points_obtenus": 3,
  "preuve": "Le commercial demande quel enjeu est prioritaire.",
  "commentaire": "Bonne exploration du besoin, reformulation encore incomplete.",
  "conseil": "Reformuler explicitement le besoin avant de passer a la suite."
}
```

Le serveur remappe `C1` vers les vrais IDs DB.

Regles serveur:

- ref inconnue: rejetee;
- ref manquante: score 0 ou erreur selon la strategie retenue;
- `points_obtenus` borne entre `0` et `points_max`;
- l'IA ne peut jamais ecrire un `skill_id`, `dimension_item_id` ou `scorecard_criterion_id`.

## Calcul des scores

La scorecard n'a pas besoin de faire 100 points.

Les points servent de poids relatifs.

```txt
score_critere = points_obtenus / points_max * 100
score_etape = somme points_obtenus etape / somme points_max etape * 100
score_global = somme points_obtenus total / somme points_max total * 100
```

Exemple:

```txt
C1 = 3 / 4
C2 = 2 / 3
C3 = 5 / 8

Total obtenu = 10
Total max = 15
Score global = 66.67%
```

Cela reste coherent avec l'ancien systeme AC/DC/DAGO:

- avant: score etape IA x poids etape;
- maintenant: points criteres, puis poids d'etape deduit du total des criteres de l'etape.

## Changements DB

### Colonnes a ajouter sur `sessions`

Ajouter:

```txt
notation_status
notation_error
notation_generated_at
notation_source
```

Contrat propose:

```txt
notation_status:
  - not_started
  - processing
  - completed
  - failed

notation_source:
  - legacy_pdf
  - scorecard
```

Usage:

- `notation_status = processing` au debut de la generation;
- `notation_status = completed` quand `notation_json` est sauvegarde;
- `notation_status = failed` si OpenAI, schema, parsing ou persistence echoue;
- `notation_error` stocke le message technique court;
- `notation_generated_at` stocke la date de generation reussie;
- `notation_source` permet de savoir si la session vient du legacy PDF ou du mode scorecard.

Backfill migration:

- si `notation_json is not null`, mettre `notation_status = completed`;
- mettre `notation_source = legacy_pdf` par defaut pour les anciennes donnees;
- sinon `notation_status = not_started`.

### Table `roleplay_session_results`

Une ligne par session notee.

```txt
session_id uuid primary key references sessions(id) on delete cascade
user_id uuid references profiles(id) on delete set null
scenario_id uuid references scenarios(id) on delete cascade
method_id uuid references methods(id) on delete set null
scorecard_id uuid references scorecards(id) on delete set null
notation_source text not null
score_percent numeric not null
points_awarded numeric
points_max numeric
completed_at timestamptz not null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Cette table alimente:

- score d'une session;
- meilleur score d'un scenario;
- historique utilisateur;
- score global de la page evaluation simulation.

### Table `roleplay_session_step_results`

Une ligne par etape notee.

```txt
id uuid primary key default gen_random_uuid()
session_id uuid references sessions(id) on delete cascade
user_id uuid references profiles(id) on delete set null
scenario_id uuid references scenarios(id) on delete cascade
scorecard_id uuid references scorecards(id) on delete set null
scorecard_step_id uuid references scorecard_steps(id) on delete set null
method_step_id uuid references method_steps(id) on delete set null
step_order integer not null
title text not null
score_percent numeric not null
points_awarded numeric
points_max numeric
coach_comment text
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
unique(session_id, step_order)
```

Cette table alimente:

- score par etape;
- page progression par etapes;
- stats de scenario par etape;
- diagnostics principaux par etape.

### Table `roleplay_session_criterion_results`

Une ligne par critere scorecard note.

```txt
id uuid primary key default gen_random_uuid()
session_id uuid references sessions(id) on delete cascade
user_id uuid references profiles(id) on delete set null
scenario_id uuid references scenarios(id) on delete cascade
scorecard_id uuid references scorecards(id) on delete set null
scorecard_step_id uuid references scorecard_steps(id) on delete set null
scorecard_criterion_id uuid references scorecard_criteria(id) on delete set null
skill_id text references skills(id) on update cascade on delete set null
dimension text not null
dimension_item_id uuid references skill_dimension_items(id) on delete set null
criterion_ref text not null
points_awarded numeric not null
points_max numeric not null
score_percent numeric not null
evidence text
coach_comment text
advice text
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
unique(session_id, criterion_ref)
```

Cette table alimente:

- score par critere;
- score par competence;
- score par dimension;
- score par item de competence;
- detail de progression;
- page detail competence;
- reporting utilisateur/groupe/organisation.

### RLS et securite

Tables exposees dans `public`:

- activer RLS;
- `authenticated` peut lire ses propres resultats;
- admins peuvent lire selon leur perimetre;
- mutations reservees aux routes serveur via service role;
- ne pas exposer de mutation directe client.

Les routes iframe publiques continuent a passer par les routes serveur existantes. La cle service role reste uniquement cote serveur.

## Donnees a fournir a l'IA en mode scorecard

Contexte session:

- `session_id`;
- `scenario_id`;
- duree;
- transcript ordonne depuis `messages`.

Contexte scenario:

- titre;
- description;
- contexte;
- objectif;
- obstacles;
- difficulte;
- persona / coach si utile.

Contexte methode:

- nom;
- version;
- objectifs;
- enjeux;
- etapes;
- objectifs d'etapes;
- bonnes pratiques;
- pieges;
- posture;
- verbatims.

Contexte scorecard:

- scorecard;
- etapes scorecard;
- criteres;
- preuve attendue;
- consigne IA;
- verbatims conformes;
- points max;
- competence;
- dimension;
- item de dimension.

## Sortie `notation_json`

Le mode scorecard doit produire la meme forme globale:

```txt
score_global
synthese
methodo
discours
transcription
```

Le `methodo` doit contenir assez de detail pour reconstruire les tables normalisees:

```txt
etapes[]
  score
  points_obtenus
  points_max
  criteres[]
    ref
    points_obtenus
    points_max
    preuve
    commentaire
    conseil
```

Le serveur enrichit ensuite:

- poids;
- contribution au score global;
- score global;
- IDs DB via `criterionMap`;
- lignes normalisees DB.

## Pages alimentees

### Page evaluation de simulation

Pour une session precise:

- `sessions.notation_json` pour l'affichage detaille;
- `roleplay_session_results` pour le score global;
- `roleplay_session_step_results` pour les etapes;
- `roleplay_session_criterion_results` pour le tableau detaille;
- `messages` pour la transcription.

### Page detail de progression

Regle MVP:

```txt
progression = meilleure note obtenue
```

Par utilisateur + scenario:

- `masteryScore = max(score_percent)`;
- `initialScore = premiere session completee`;
- `afterTraining = meilleur score`;
- `delta = afterTraining - initialScore`.

Si une seule session:

- `initialScore = score`;
- `afterTraining = score`;
- `delta = 0`.

Par etape:

```txt
max(step_score_percent)
```

Par competence, dimension, item:

```txt
max(score_percent)
group by skill_id, dimension, dimension_item_id
```

Dimensions:

- `savoir_faire` et `savoir_etre`: resultats roleplay;
- `savoir`: resultats quiz;
- si pas de quiz: afficher non evalue ou masquer selon decision UI.

### Stats d'un scenario

Depuis les tables normalisees:

- nombre de sessions;
- dernier score;
- meilleur score;
- score moyen si besoin;
- progression par etape;
- progression par competence;
- historique utilisateur.

## Architecture code cible

Ajouter des modules dedies, pas tout dans la route:

```txt
src/features/roleplays/server/build-roleplay-notation-context.ts
src/features/roleplays/server/scorecard-notation-prompts.ts
src/features/roleplays/server/scorecard-notation-scoring.ts
src/features/roleplays/server/persist-roleplay-notation-results.ts
src/features/roleplays/domain/roleplay-notation.ts
```

La route `/api/notation` orchestre seulement:

```txt
resolve session
resolve mode
load context
call OpenAI
validate result
save notation_json
persist normalized results
return response
```

## Phases d'implementation

1. Migration DB:
   - ajouter colonnes `sessions.notation_*`;
   - creer les trois tables de resultats;
   - ajouter RLS, grants, indexes, triggers updated_at;
   - inserer les quatre prompts `notation.scorecard.*`.

2. Builder de contexte:
   - charger session/messages/scenario;
   - charger methode + etapes;
   - charger scorecard + criteres;
   - charger skills + dimension items;
   - construire `criterionMap`.

3. Mode scorecard dans `/api/notation`:
   - detection `scenario.scorecard_id`;
   - loader prompts `notation.scorecard.*`;
   - appel `methodo` en premier;
   - validation refs/points;
   - calcul score global serveur.

4. Persistence:
   - sauvegarder `sessions.notation_json`;
   - mettre a jour `sessions.notation_status`, `notation_source`, `notation_generated_at`, `notation_error`;
   - remplacer les lignes normalisees de la session de facon idempotente.

5. Lecture pages:
   - page evaluation simulation depuis session/resultats;
   - page progression depuis agregations;
   - garder fallback mock tant que l'ecran n'est pas entierement branche.

6. Nettoyage futur:
   - quand Figma Make/legacy PDF n'est plus utilise, retirer le fallback legacy;
   - conserver `notation_json` comme archive complete.

## Tests

Tests unitaires:

- resolution mode `scorecard` vs `legacy_pdf`;
- loader prompts `notation.scorecard.*`;
- builder de contexte;
- criterionMap;
- validation ref inconnue;
- validation `points_obtenus > points_max`;
- calcul score global avec total different de 100;
- mapping `notation_json` vers lignes normalisees.

Tests integration:

- `POST /api/notation` legacy continue de sauvegarder `sessions.notation_json`;
- `POST /api/notation` scorecard sauvegarde `notation_json` + resultats normalises;
- erreur OpenAI met `notation_status = failed`;
- route iframe sans utilisateur connecte continue de fonctionner.

Tests manuels:

- scenario sans scorecard: notation PDF actuelle;
- scenario avec scorecard: notation scorecard;
- page evaluation simulation d'une session;
- page detail progression apres 1 session;
- page detail progression apres plusieurs sessions;
- progression competence/item.

## Decisions ouvertes

- Affichage de la dimension `savoir` si aucun quiz n'est disponible.
- Strategie si l'IA oublie un critere: mettre 0 ou relancer l'appel.
- Statut exact affiche pendant `notation_status = processing`.
- Quand remplacer `progression = meilleure note` par `moyenne des 3 meilleures performances sur les 6 dernieres`.
