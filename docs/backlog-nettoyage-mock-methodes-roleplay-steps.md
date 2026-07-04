# Backlog - Nettoyage mock methodes dans parcours roleplay

Date: 2026-06-29

## Constat

L'onglet Methodes principal est branche sur la DB:

- liste `/methods` via `listMethods()`;
- detail `/methods/:methodId` via `getMethodById()`;
- creation / edition via `/api/methods`.

Le fichier mock `src/features/methods/data/methods.ts` reste cependant utilise par le parcours roleplay, surtout pour afficher les etapes d'un roleplay.

Il reste aussi des donnees locales encore utilisees ailleurs dans l'application:

- roleplays / methodes / historique / dashboard sont encore partiellement en source temporaire;
- l'adapter roleplay garde un fallback local pendant la migration DB;
- ces donnees ne doivent pas etre supprimees tant que les ecrans concernes ne lisent pas completement la DB.

## Fichiers concernes

- `src/features/methods/data/methods.ts`
- `src/features/roleplays/data/roleplay-ui-adapter.ts`
- `src/features/roleplays/data/roleplays.ts`
- `src/features/roleplays/data/sessions.ts`
- `src/features/roleplays/data/evaluation.ts`
- `src/features/dashboard/data/dashboard.ts`
- `src/features/roleplays/components/RoleplayStepsPage.tsx`
- `src/features/roleplays/components/RoleplayStepsPageContent.tsx`
- `src/features/roleplays/components/RoleplayStepCoachPage.tsx`
- `src/features/roleplays/components/RoleplayStepCoachPageContent.tsx`
- `src/app/roleplays/[roleplayId]/steps/page.tsx`
- `src/app/roleplays/[roleplayId]/steps/[stepIndex]/page.tsx`

## Pourquoi ne pas supprimer directement

`methods.ts` fournit encore des donnees que les pages roleplay steps consomment:

- type `Method`;
- type `MethodStep`;
- `retenir`;
- `capsule`;
- `quizQuestions`;
- ancien fallback `objectifMetier`.

Supprimer ce fichier sans refactor casserait probablement `/roleplays/:roleplayId/steps` et `/roleplays/:roleplayId/steps/:stepIndex`.

## Plan de nettoyage

1. Remplacer les imports `features/methods/data/methods` par les types DB du domaine:
   - `MethodDetail`;
   - `MethodStepItem`.
2. Adapter les pages roleplay steps pour lire directement:
   - `method.steps`;
   - `step.resources`;
   - `step.takeaway`;
   - `step.summary`;
   - `step.objectives`;
   - `step.bestPractices`;
   - `step.pitfalls`;
   - `step.posture`;
   - `step.verbatims`.
3. Remplacer la notion mock `capsule` par les ressources d'etape:
   - `resourceType === "video"` pour video;
   - autres types possibles selon le rendu attendu.
4. Supprimer les fallbacks mock dans `mapMethodDetailToUi`.
5. Supprimer les dependances de `src/features/roleplays/data/roleplays.ts` vers `methods.ts`.
6. Supprimer `src/features/methods/data/methods.ts`.
7. Ajouter / ajuster les tests:
   - mapping DB method -> roleplay steps;
   - roleplay steps sans mock;
   - capsule video issue de `method_resources`;
   - comportement si aucune ressource d'etape.

## Decision temporaire

Tant que les pages roleplay steps n'ont pas ete refactorees, garder `src/features/methods/data/methods.ts`.
Tant que les pages roleplays, historique et dashboard ne sont pas entierement branchees DB, garder les fichiers locaux encore importes par ces ecrans.
Les mocks de test dans les fichiers `*.test.ts` et `*.integration.tsx` ne sont pas concernes par ce nettoyage.
