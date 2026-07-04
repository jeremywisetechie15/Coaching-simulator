# Contrat runtime iframe public

Date : 29 juin 2026

## Objectif

Les iframes MaiaCoach utilises par le client dans Figma Make et en demo doivent continuer a fonctionner sans utilisateur connecte.

Ce contrat concerne le runtime d'entrainement public, pas le back-office admin. Les ecrans admin, CRUD et formulaires internes peuvent rester proteges par authentification/admin, mais le parcours iframe doit rester accessible sans session utilisateur tant que le modele d'embed signe n'est pas implemente.

## Routes publiques a conserver sans login

Ces routes ne doivent pas appeler `requireAuth`, `requireAdmin`, `getCurrentUserOrThrow`, ni rediriger vers la page de connexion.

| Route | Usage | Remarque |
|---|---|---|
| `GET /iframe?scenario_id=...` | Lancer une simulation persona standard. | `scenario_id` est obligatoire en mode standard. |
| `GET /iframe?mode=coach&coach_mode=before_training&scenario_id=...` | Coach avant entrainement. | Lit le scenario et les etapes de preparation. |
| `GET /iframe?mode=coach&coach_mode=after_training&scenario_id=...` | Coach apres entrainement. | Lit la derniere session completee du scenario ou `ref_session_id`. |
| `GET /iframe?mode=coach&coach_mode=notation&scenario_id=...` | Coach sur la synthese de notation. | Lit la derniere session completee avec `notation_json`. |
| `GET /iframe?variant=coach&scenario_id=...` | Variante ou le persona donne son feedback. | Utilise la voix/avatar du persona. |
| `POST /api/realtime-session` | Creer une session voix OpenAI Realtime. | Public temporaire, cle API jamais exposee au client. |
| `POST /api/heygen-session` | Creer une session LiveAvatar/persona legacy. | Public temporaire pour les demos. |
| `POST /api/coach-heygen-session` | Creer une session LiveAvatar coach. | Public temporaire pour les modes coach. |
| `POST /api/save-session` | Sauvegarder une nouvelle session terminee. | Ecrit `sessions` et `messages`. |
| `POST /api/update-session` | Completer une session existante. | Ecrit `sessions` et `messages`. |
| `POST /api/notation` | Generer et sauvegarder une notation. | Public temporaire, utilise la cle service cote serveur. |
| `GET /api/notation?scenario_id=...` | Recuperer la derniere notation d'un scenario. | Utilise des headers CORS pour les integrations externes. |

## Routes back-office separees

Les routes admin/CRUD peuvent etre protegees :

- `GET/POST /api/roleplays`
- `GET/PATCH/DELETE /api/roleplays/:roleplayId`
- routes CRUD methodes, quiz, scorecards, competences, organisations, utilisateurs, personas, coaches.

La regle est simple : une page back-office connectee utilise les routes CRUD protegees ; une iframe embarquee utilise le runtime public liste ci-dessus.

## Tables et donnees attendues par l'iframe

Le runtime iframe s'appuie encore sur les tables historiques suivantes :

| Table | Usage runtime |
|---|---|
| `scenarios` | Source du scenario, titre, description, persona, methode/notation et etapes de coaching. |
| `personas` | Identite, voix, avatar et instructions systeme du persona. |
| `coaches` | Identite, voix, avatar et instructions systeme du coach. |
| `sessions` | Creation, statut, duree et `notation_json`. |
| `messages` | Transcript de session. |
| `prompts` | Prompts coach et notation, avec fallback cote code si certains prompts manquent. |
| `notation_methods`, `notation_method_steps`, `notation_method_files`, `notation_output_schemas` | Configuration de notation liee au scenario, avec fallback AC/DC si indisponible. |

Lors de la migration roleplay/scenario, ne pas supprimer ou renommer les champs consommes par l'iframe sans adapter explicitement `src/app/iframe/actions.ts` et les routes API runtime.

## Regles de migration roleplays

1. Garder `scenarios` compatible avec l'iframe tant que le client utilise les URLs Figma Make.
2. Si les nouveaux roleplays deviennent la source produit, prevoir un mapping stable vers `scenarios` ou une couche de lecture qui expose le meme contrat a l'iframe.
3. Ne pas remplacer directement `scenario_id` par `roleplay_id` dans les URLs publiques sans periode de compatibilite.
4. Ne pas proteger le runtime iframe par login utilisateur tant qu'un vrai systeme d'embed public signe n'est pas en place.
5. Les controles organisation/groupe/user du back-office ne doivent pas bloquer les demos iframe existantes.

## Securite actuelle et durcissement cible

Etat actuel accepte pour le MVP/demo :

- les routes iframe sont publiques ;
- les cles OpenAI, LiveAvatar et Supabase service role restent uniquement cote serveur ;
- `/api/notation` expose CORS car il est consomme depuis des contextes externes ;
- les routes ecrivent/consultent uniquement via les identifiants fournis (`scenario_id`, `session_id`, `persona_id`).

Durcissement futur recommande, sans exiger de login utilisateur :

- ajouter un token d'embed signe et expire, par exemple `embed_token`, associe a un scenario et a des droits runtime limites ;
- valider ce token dans `/iframe` et dans les routes runtime ;
- limiter les appels par IP/scenario pour les endpoints couteux (`realtime-session`, `coach-heygen-session`, `notation`) ;
- journaliser les erreurs et usages publics ;
- quand le token d'embed est en place, reduire progressivement l'acces public brut par `scenario_id` seul.

## Checklist avant toute modification roleplay/iframe

- [ ] Tester `/iframe?scenario_id=<scenario_id>` dans une fenetre sans session connectee.
- [ ] Tester `/iframe?mode=coach&coach_mode=before_training&scenario_id=<scenario_id>` sans session connectee.
- [ ] Tester `/iframe?mode=coach&coach_mode=after_training&scenario_id=<scenario_id>` apres une session completee.
- [ ] Tester `/iframe?mode=coach&coach_mode=notation&scenario_id=<scenario_id>` apres une notation sauvegardee.
- [ ] Verifier que `POST /api/save-session` cree encore `sessions` et `messages`.
- [ ] Verifier que `POST /api/update-session` complete encore une session existante.
- [ ] Verifier que `POST /api/notation` sauvegarde encore `sessions.notation_json`.
- [ ] Verifier que `GET /api/notation?scenario_id=<scenario_id>` retourne la derniere notation.
- [ ] Verifier qu'aucune de ces routes ne retourne `401`, `403` ou une redirection login pour un visiteur non connecte.

## Tests automatises a ajouter

Quand on branchera la suite roleplay, ajouter des tests d'integration sur le contrat public :

- `/iframe` rend une page sans utilisateur authentifie ;
- `prepareIframeSession` retourne une configuration standard pour un `scenario_id` valide ;
- `prepareIframeSession` retourne une configuration coach `before_training`, `after_training`, `notation` sans utilisateur authentifie ;
- les routes `save-session`, `update-session` et `notation` ne dependent pas de `requireAuth`;
- les routes CRUD admin roleplay restent protegees separement.

## A ne pas faire

- Ne pas ajouter `requireAdmin` ou `requireAuth` dans `src/app/iframe/actions.ts`.
- Ne pas ajouter un middleware global qui bloque `/iframe` ou les routes runtime publiques.
- Ne pas supprimer `scenarios` au profit de `roleplays` sans adapter le runtime et garder une compatibilite URL.
- Ne pas exposer les cles service/API au navigateur pour compenser l'absence de login.
