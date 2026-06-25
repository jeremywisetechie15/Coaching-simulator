# Décision produit - Quiz, méthodes, roleplays et scorecards

Date : 21 juin 2026

## Décision

Il existe deux familles de quiz :

| Famille | Rôle | Méthode associée | Association roleplay |
|---|---|---|---|
| Quiz de méthode | Vérifier que l'apprenant connaît une méthode. | Obligatoire. | Peut être proposé dans un roleplay, mais reste le quiz de connaissance de la méthode. |
| Quiz contextuel | Vérifier une connaissance produit, document, offre, cas client ou contexte métier. | Optionnelle. | Peut être associé à un ou plusieurs roleplays. |

Règles retenues :

- un quiz peut exister sans méthode ;
- une méthode publiée doit avoir un quiz de méthode actif/publié ;
- un roleplay peut avoir plusieurs quiz ;
- les quiz associés à un roleplay ne sont pas obligés d'avoir la même méthode que le roleplay ;
- la scorecard reste séparée des quiz : elle note le `savoir_faire` et le `savoir_etre` après le roleplay.

Exemple client/Figma Make :

```txt
Roleplay Rachid HAMRANI
  -> méthode/playbook : DAGO
  -> quiz proposés : DEEPMARK Fondamentaux, DEEPMARK Avancé, Auto-évaluation DEEPMARK
```

Ce cas confirme qu'un roleplay peut utiliser une méthode conversationnelle, tout en demandant des quiz sur un produit ou un document différent.

## Source de vérité cible

| Besoin | Source de vérité | Commentaire |
|---|---|---|
| Méthode du roleplay | `roleplays.method_id` ou `scenarios.method_id` | Préparation pédagogique et compatibilité scorecard. |
| Scorecard du roleplay | `roleplays.scorecard_id` ou `scenarios.scorecard_id` | Évaluation post-roleplay. |
| Quiz de méthode | `quizzes.quiz_kind = method_knowledge` + `quizzes.method_id` non nul | Alimente la dimension `savoir` de la méthode. |
| Quiz contextuel | `quizzes.quiz_kind = contextual` + `quizzes.method_id` nullable | Produit, document, offre, cas client, contexte métier. |
| Quiz associés au roleplay | `roleplay_quizzes` | Association N-N avec ordre, obligation et règles de déblocage. |
| Documents de méthode | `method_resources` + Supabase Storage `notation_pdf` | URL externe dans `external_url`, fichier uploadé dans `bucket/path`; bucket historique à garder pour l'instant. |

Conséquence SSOT :

- ne pas ajouter un champ `quiz_id` persistant sur la méthode ;
- ne pas se limiter à un champ `quiz_id` sur le roleplay si plusieurs quiz sont possibles ;
- porter l'association méthode -> quiz depuis `quizzes.method_id` ;
- porter l'association roleplay -> quiz depuis `roleplay_quizzes`.

## Impact formulaires

Formulaire méthode :

- afficher le champ "Quiz associé" pour rester aligné avec la maquette Figma Make ;
- tant que le CRUD quiz n'est pas branché, ne pas envoyer ce champ dans l'écriture `methods` ;
- bloquer côté UI la publication d'une nouvelle méthode tant qu'aucun quiz n'est sélectionné ;
- à terme, le champ doit sélectionner/créer un quiz de méthode dont la vraie association est `quizzes.method_id` ;
- afficher ensuite l'état du quiz de méthode : `absent`, `brouillon` ou `publié`.
- gérer plusieurs documents globaux via `method_resources` avec `step_id = null`.
- pour l'upload, garder le fichier sélectionné dans l'état du formulaire et l'envoyer seulement au submit de la méthode.
- au submit, le serveur crée d'abord la méthode et les étapes, puis upload les fichiers dans `notation_pdf` avec des chemins finaux basés sur les IDs réels (`methods/{methodId}/resources/{resourceId}/...` ou `methods/{methodId}/steps/{stepId}/resources/{resourceId}/...`).
- si l'utilisateur abandonne le formulaire avant validation, aucun fichier Storage ni ligne DB n'est créé.
- limiter les ressources complémentaires uploadées aux documents de référence (`pdf`, `doc`, `docx`, `md`, `txt`, `csv`, `ppt`, `pptx`, `xls`, `xlsx`).
- créer automatiquement la ligne `notation_method_files` pour tout document global uploadé, puis relier `method_resources.notation_file_id` à ce fichier.
- pour les capsules e-learning d'étapes, autoriser URL ou upload (`video`, `audio`, `image`, `document`) et stocker uniquement dans `method_resources` avec `step_id`.
- en édition, supprimer les anciens objets Storage seulement après sauvegarde DB et uniquement s'ils ne sont plus référencés par `method_resources` ni `notation_method_files`.
- si une ressource complémentaire est supprimée/remplacée, détacher/supprimer aussi la ligne `notation_method_files` devenue inutile ; si une capsule d'étape est supprimée/remplacée, ne jamais toucher à la notation.

Formulaire création quiz :

- garder "Méthode associée" optionnel ;
- ajouter le type métier `Quiz de méthode` ou `Quiz contextuel` ;
- rendre la méthode obligatoire uniquement pour `Quiz de méthode`.

Formulaire roleplay :

- remplacer le select quiz unique par une sélection multiple ;
- stocker `required/optional`, ordre et règle de déblocage dans l'association ;
- ajouter un champ distinct `Scorecard d'évaluation roleplay`.

## État actuel constaté

Déjà en place :

- `methods`, `method_steps` dans Supabase ;
- `scenarios.method_id` existe ;
- tables techniques `notation_methods`, `notation_method_steps`, `notation_output_schemas` ;
- UI création quiz avec champ "Méthode associée" optionnel ;
- UI création roleplay avec méthode/playbook ;
- le formulaire méthode local affiche le select "Quiz associé" pour rester aligné avec Figma Make, sans encore écrire ce champ dans `methods` ;
- le formulaire méthode local permet plusieurs documents globaux, créés au submit dans `method_resources` ;
- l'upload partagé garde les fichiers côté navigateur avant submit, puis le serveur stocke dans Supabase Storage et conserve la référence SSOT dans `method_resources.bucket/path`.
- les fichiers existants AC/DC et DAGO utilisent `notation_pdf` et sont aussi liés à `notation_method_files` via `notation_file_id`;
- décision temporaire : tout document global uploadé depuis "Ressources complémentaires" sert à la notation et crée donc automatiquement une ligne `notation_method_files`.
- les fichiers uploadés dans une capsule d'étape ne créent pas de ligne `notation_method_files` par défaut.

Manquant pour cette logique :

- tables quiz produit : `quizzes`, `quiz_steps`, `quiz_step_competencies`, `quiz_questions`, `quiz_question_choices` ;
- tables tentatives/résultats quiz ;
- table `roleplay_quizzes` ;
- tables scorecard produit : `scorecards`, `scorecard_steps`, `scorecard_criteria` ;
- champ `scorecard_id` sur le roleplay/scenario cible ;
- persistance du formulaire création quiz ;
- sélection multiple de quiz dans le formulaire roleplay ;
- distinction UI entre `Quiz de méthode` et `Quiz contextuel`.
