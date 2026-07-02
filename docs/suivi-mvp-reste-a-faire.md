# Suivi MVP - reste a faire

Date de creation: 2026-07-01

Ce fichier est le suivi global operationnel du MVP. Les decisions metier et contrats techniques restent dans leurs docs dediees:

- `docs/decision-quiz-methodes-roleplays-scorecards-2026-06-21.md`
- `docs/plan-notation-scorecard-progression.md`
- `docs/contrat-runtime-iframe-public.md`
- `docs/backlog-nettoyage-mock-methodes-roleplay-steps.md`
- `docs/tests-manuels-methodes.md`

## Regles a respecter

- Garder la SSOT: pas de nouvelle liste locale si une taxonomie, un scope, un type de fichier ou un composant existe deja.
- Garder l'architecture actuelle: route API -> DTO/controller/server -> persistence/mapper -> domaine/UI.
- Ne pas casser le runtime iframe public: les URLs Figma Make doivent fonctionner sans utilisateur connecte tant que l'embed signe n'existe pas.
- Ne pas supprimer un mock/fallback tant que l'ecran concerne ne lit pas completement la DB.
- Ajouter des tests quand le changement touche la persistence, les DTO, un calcul metier ou une regle de securite.

## Deja verifie recemment

- Migrations Supabase presentes sur `zbhazzawzsofdxgswzmt`: quiz attempts, visibility competences, champs personas/coachs, suppression `methods.business_objective`.
- Realtime OpenAI aligne GA: `client_secrets` cote serveur et `realtime/calls` cote WebRTC.
- Audio dans les pieces jointes de quiz: type `audio`, bucket `quizzes`, MIME audio, rendu `<audio controls>`.
- Liste roleplays principale: lecture DB sans append automatique des anciens mocks historiques.

## Audit par onglet actif

Source de l'audit: `src/features/app-shell/components/appNavigation.ts`.
Les onglets `Academie` et `Programmes` sont commentes dans la navigation: pas dans le scope actif actuel.

| Onglet | Etat repo | Preuves | Reste reel |
|---|---|---|---|
| Tableau de bord | Partiel, encore local/mock. | Page `src/app/page.tsx`; composant `DashboardPageContent` importe `features/dashboard/data/dashboard` et `features/roleplays/data/roleplays`. | Brancher les stats, dernieres sessions, progression et roleplays recents sur DB; remplacer les couleurs hardcodees si on touche au composant. |
| Roleplays | Partiel. Liste DB et CRUD API en place, mais detail/steps/session gardent des fallbacks mocks. | `src/app/roleplays/page.tsx` utilise `listRoleplays()` + `mapDbRoleplayListToUi`; `src/app/api/roleplays/[roleplayId]/route.ts` expose GET/PATCH/DELETE; detail/steps/session utilisent encore `findMockRoleplayById`, `getRoleplayMethod`, `roleplay-ui-adapter`. | Nettoyer les fallbacks de `roleplay-ui-adapter`; brancher steps sur `method_resources`; remplacer `capsule` mock; verifier detail/preparation/documents/quiz/session/historique. |
| Methodes | CRUD DB/API/UI en place. Reste une dette roleplay sur l'ancien mock methodes. | `src/app/methods/page.tsx` -> `listMethods()`; `src/app/api/methods/[methodId]/route.ts` GET/PATCH/DELETE; detail charge `getMethodAssociatedQuizOption()`; form charge `listQuizOptions()`. | Mettre a jour `docs/tests-manuels-methodes.md`; validation manuelle CRUD/upload/quiz; supprimer `features/methods/data/methods.ts` seulement apres nettoyage roleplay steps. |
| Evaluations / Quiz | CRUD DB/API/UI en place, tentatives et fichiers en place. | `src/app/evaluations/page.tsx` -> `listQuizzes()`; API quizzes GET/POST/PATCH/DELETE; routes attempts/latest/answers/submit; `FilePreviewCard` supporte audio; bucket `quizzes` verifie. | Validation manuelle complete; confirmer regle produit du score partiel QCM; ajouter tests UI optionnels audio/correction. |
| Scorecards | CRUD DB/API/UI en place, detail et edition DB en place. | `src/app/scorecards/page.tsx` -> `listScorecards()`; detail -> `getScorecardById()`; edit -> `CreateScorecardPage` avec `initialScorecard`; API GET/POST/PATCH/DELETE. | Validation manuelle creation/detail/edition/archivage; verifier liaison methode -> etapes -> criteres -> competence -> item; verifier roleplay filtre les scorecards de la methode. |
| Competences | CRUD DB/API/UI en place. Detail a encore des scores apprenant non branches. | `src/app/skills/page.tsx` -> `listSkills()`; detail/edit -> `getSkillById()`; API GET/POST/PATCH/DELETE; `SkillDetailPageContent` contient un TODO sur les vrais scores. | Brancher les vrais scores/progression apprenant dans detail competence; validation manuelle CRUD/visibilite; verifier `dimension_item_id` dans quiz. |
| Mes Coachs IA | Liste, creation et edition DB en place. Pas de delete/archive expose. | `src/app/coaches/page.tsx` -> `listCoaches()`; new/edit -> `CreateCoachPage`; API coaches GET/POST et PATCH par id. | Decider si suppression/archive coach est dans le MVP; validation manuelle champs domaine/style/DISC/diplomes/certifications. |
| Mes Personas IA | Liste, creation et edition DB en place. Pas de delete/archive expose. | `src/app/personas/page.tsx` -> `listPersonas()`; new/edit -> `CreatePersonaPage`; API personas GET/POST et PATCH par id. | Decider si suppression/archive persona est dans le MVP; validation manuelle champs pro/perso/DISC/secteur. |
| Organisations | Liste/create/edit DB en place; detail org, groupes, users, roleplays, evaluations branches en grande partie. Pas de delete org expose. | `src/app/organizations/page.tsx` -> `listOrganizations()`; detail -> `getOrganizationDetail()`, `listOrganizationRoleplays()`, `listOrganizationEvaluations()`; API organizations GET/POST/PATCH; groupes GET/POST/PATCH/DELETE. | Validation manuelle detail groupe; verifier compteurs par statuts; valider regle invitation admin vs manager; pagination/agregations a terme. |
| Utilisateurs | Liste DB et detail partiellement DB. Groupes DB. Roleplays/evaluations assignes DB en entree, mais assign manuel, statistiques et competences restent locaux. | `src/app/users/page.tsx` -> `listUsers()`; detail -> `getUserById()`, `listUserAssignedRoleplays()`, `listUserAssignedQuizzes()`; `UserDetailPage` contient `initialAssignedRoleplays`, `initialAssignedQuizzes`, stats et `skillProgressRows` locaux; API users expose GET et groupes GET/POST/DELETE. | Brancher edition profil utilisateur au serveur ou retirer mode edit; brancher assign roleplay/quiz si requis; brancher statistiques et progression competences sur DB. |
| Compte / Profil | Profil DB en place; roles/permissions local seulement. | `ProfilePageContent` PATCH `/api/profile` et POST `/api/profile/avatar`; `RolesPermissionsPage` garde l'etat en React local. | Decider si roles/permissions est hors MVP ou a persister; validation manuelle profil/avatar. |

## Runtime iframe public

Etat repo:

- [x] Routes runtime publiques documentees dans `docs/contrat-runtime-iframe-public.md`.
- [x] Realtime OpenAI aligne sur GA (`/v1/realtime/client_secrets` + `/v1/realtime/calls`).
- [x] Les pages roleplay session embarquent le runtime public existant via iframe.

Reste reel:

- [ ] Tester `/iframe?scenario_id=<scenario_id>` sans session connectee.
- [ ] Tester les modes coach iframe: `before_training`, `after_training`, `notation`.
- [ ] Tester un parcours complet: demarrer simulation, terminer, loader notation, sauvegarde `sessions`/`messages`, redirection page session.
- [ ] Ajouter des tests d'integration minimaux pour proteger le contrat public iframe.
- [ ] Plus tard: remplacer l'acces public brut par `scenario_id` par un token d'embed signe et expire.

## Notation scorecard / progression

- [ ] Implementer le plan complet de `docs/plan-notation-scorecard-progression.md`.
- [ ] Ajouter les colonnes `sessions.notation_status`, `notation_error`, `notation_generated_at`, `notation_source`.
- [ ] Ajouter les tables normalisees de resultats roleplay pour alimenter evaluation, progression, competences et stats.
- [ ] Ajouter les prompts generiques `notation.scorecard.*` sans modifier les prompts legacy.
- [ ] Garder le fallback legacy PDF pour les scenarios sans `scorecard_id`.

## Nettoyage mocks / donnees locales

- [ ] P0: nettoyer roleplay/methodes selon `docs/backlog-nettoyage-mock-methodes-roleplay-steps.md`.
- [ ] P1: brancher le dashboard sur DB.
- [ ] P1: brancher statistiques utilisateur et progression competences utilisateur.
- [ ] P2: brancher roles/permissions si l'onglet reste dans le MVP.
- [ ] Ne pas supprimer les mocks de tests `*.test.ts` / `*.integration.tsx`.

## Tests avant validation MVP

- [ ] `tsc --noEmit`
- [ ] Tests unitaires cibler DTO/persistence/mappers touches.
- [ ] Tests manuels methodes depuis `docs/tests-manuels-methodes.md`.
- [ ] Tests manuels quiz/evaluations.
- [ ] Tests manuels scorecards.
- [ ] Tests manuels roleplays/iframe sans login.
- [ ] Verification Supabase: migrations appliquees sur la DB cible.
