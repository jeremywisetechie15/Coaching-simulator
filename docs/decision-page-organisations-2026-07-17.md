# SSOT — Page Organisations

Date : 17 juillet 2026

Statut : actif

Portée : liste des organisations, fiche organisation et fiche groupe

Ce document contient les décisions produit et techniques à conserver. Les
éléments de la section « Écarts connus » ne sont pas des règles métier.

## 1. Définitions

| Terme | Définition |
|---|---|
| Administrateur plateforme | Profil avec `profiles.platform_role = admin` |
| Roster | Membres `active`, `invited` ou `suspended` d'une organisation ; `removed` est exclu |
| Cohorte active | Membres `active` d'une organisation elle-même `active` |
| Contenu affecté | Roleplay ou quiz `published`, `is_active = true`, relié au contexte par une portée ou une assignation explicite |
| Assignation explicite | Ligne dans `scenario_user_assignments` ou `quiz_user_assignments` |
| Désactivation | Passage d'une organisation à `suspended`, sans suppression de données |
| Archivage groupe | Passage d'un groupe à `archived`, sans suppression de données |

## 2. Sécurité

- Le back-office Organisations est réservé aux administrateurs plateforme.
- Le rôle `manager` d'une organisation ne donne pas accès à ce back-office.
- Chaque service privilégié appelle `requireAdmin()` avant de créer un client
  Supabase service role.
- Un utilisateur authentifié ne peut pas modifier lui-même
  `profiles.platform_role`.
- Une organisation suspendue ne donne plus d'accès par portée organisation ou
  groupe. Ses données et assignations directes restent conservées.
- Un groupe archivé ne donne plus d'accès par portée groupe.
- L'administrateur plateforme conserve son accès administratif.

Sources : [require-auth.ts](../src/features/auth/server/require-auth.ts),
[20260717071140_harden_profile_update_privileges.sql](../supabase/migrations/20260717071140_harden_profile_update_privileges.sql),
[20260713120000_enforce_suspended_organization_access.sql](../supabase/migrations/20260713120000_enforce_suspended_organization_access.sql)
et
[20260717085528_revoke_archived_group_content_access.sql](../supabase/migrations/20260717085528_revoke_archived_group_content_access.sql).

## 3. SSOT des compteurs

### Règles communes

- Un contenu compte seulement s'il est `published` et `is_active = true`.
- Les IDs sont dédupliqués : plusieurs chemins vers le même contenu comptent
  pour un seul.
- Le catalogue `public` global ne compte jamais à lui seul.
- Un contenu public compte uniquement lorsqu'une assignation explicite le relie
  au contexte.
- Les groupes archivés et les membres `removed` sont exclus.

### Périmètre par vue

| Compteur | Ce qui est inclus |
|---|---|
| Organisation | Portée `organization`, portée `group` de ses groupes actifs, portée `user` vers son roster, assignations explicites vers son roster |
| Utilisateur dans une organisation | Portée organisation, groupes actifs de cette organisation auxquels il appartient, portée `user`, assignations explicites |
| Groupe | Uniquement la portée `group` avec le `group_id` exact |
| Utilisateur dans un groupe | Uniquement les contenus de portée `group` de ce groupe |

Pour les quiz, une assignation explicite de roleplay ajoute aussi :

- les quiz liés par `scenario_quizzes` ;
- le quiz `method_knowledge` de la méthode du roleplay.

Ces quiz dérivés doivent eux-mêmes être publiés et actifs.

### Compteurs structurels

| Compteur | Règle |
|---|---|
| Utilisateurs | Taille dédupliquée du roster, donc `active + invited + suspended` |
| Groupes | Uniquement les groupes `active` |
| Roleplays / Quizzes | Nombre de contenus affectés uniques selon le contexte ci-dessus |

Les invités et suspendus conservent leurs affectations administratives dans les
compteurs, mais ne participent pas à la progression.

Suspendre une organisation conserve ses compteurs structurels et ses contenus
affectés ; seule sa cohorte active devient vide.

### Limite MVP assumée

Les tables d'assignations explicites n'ont pas d'`organization_id`. Si un
utilisateur appartient à plusieurs organisations, son assignation personnelle
apparaît donc dans chacune d'elles. Une attribution stricte nécessiterait
d'ajouter le contexte organisationnel aux assignations.

Sources :
[organization-content-scope.ts](../src/features/organizations/domain/organization-content-scope.ts)
et
[list-organization-content-scope.ts](../src/features/organizations/server/list-organization-content-scope.ts).

## 4. Cohortes et progression

### Audience d'un contenu

| Cible | Apprenants pris en compte |
|---|---|
| Organisation | Tous les membres `active` si l'organisation est `active` |
| Groupe | Membres du groupe également `active` dans l'organisation, si le groupe et l'organisation sont actifs |
| Utilisateur | Cet utilisateur seulement s'il appartient à la cohorte active |
| Assignation explicite | Chaque utilisateur explicitement ciblé s'il appartient à la cohorte active |
| Organisation suspendue | Cohorte vide |

Les invités, suspendus, retirés et membres d'un groupe archivé ne participent
jamais à `learnerCount`.

Les chemins d'audience se cumulent : la portée native et les assignations
explicites forment une union, puis les apprenants sont dédupliqués.

Un contenu reste compté comme affecté même lorsque sa cohorte active est vide ;
seule sa progression devient `not_started`.

### Statut collectif

| Situation | Statut |
|---|---|
| Cohorte vide ou aucune activité admissible | `not_started` |
| Au moins une activité, mais tous les ciblés n'ont pas terminé | `in_progress` |
| Chaque apprenant ciblé a au moins une activité `completed` | `completed` |

Décisions complémentaires :

- une seule complétion ne termine pas une activité destinée à plusieurs
  apprenants ;
- plusieurs activités du même utilisateur ne le font compter qu'une fois ;
- les sessions et tentatives d'utilisateurs hors cible sont ignorées ;
- une session roleplay de moins de 30 secondes est ignorée via
  `MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS` ;
- pour un quiz de groupe, seules les tentatives des membres actifs de ce groupe
  sont prises en compte.

Sources : [organization-activity.ts](../src/features/organizations/domain/organization-activity.ts)
et
[list-organization-activity.ts](../src/features/organizations/server/list-organization-activity.ts).

## 5. Règles par écran

| Écran / onglet | Décision |
|---|---|
| Liste Organisations | Affiche les vrais compteurs SSOT ; recherche locale par nom ; tri par création décroissante |
| Informations de base | Modifie nom, secteur, statut, contact, téléphone et région ; les compteurs sont en lecture seule |
| Groupes | Liste uniquement les groupes actifs avec leurs membres du roster et leurs contenus strictement affectés au groupe |
| Utilisateurs | Liste le roster, permet invitation, ouverture, modification et retrait du rattachement |
| Roleplays | Consolide les roleplays affectés à l'organisation et calcule leur cohorte exacte |
| Évaluations | Consolide les quiz affectés, y compris les quiz dérivés des roleplays explicites |
| Fiche groupe | Applique la portée stricte du groupe pour membres, roleplays, quiz et progression |

La navigation conserve l'onglet dans `?tab=` et utilise les liens contextuels de
retour. Les cinq onglets de la fiche organisation proviennent de
[OrganizationDetailTabs.tsx](../src/features/organizations/components/OrganizationDetailTabs.tsx).

## 6. Cycle de vie des organisations

### Modification

- `PATCH /api/organizations/:id` utilise le même DTO que la création.
- La réponse recharge le snapshot SSOT complet.
- Modifier une organisation ne remet donc jamais ses compteurs à zéro.
- Un changement `active ↔ suspended` déclenche un refresh serveur pour
  recalculer les cohortes Roleplays et Évaluations.

### Suppression ou désactivation

| Données à conserver | Membres restants | Action |
|---|---:|---|
| Oui | Oui ou non | Désactivation en `suspended` |
| Non | Oui | Suppression bloquée |
| Non | Non | Suppression physique autorisée |

Décisions :

- une organisation avec du contenu ou de l'historique n'est jamais supprimée ;
- tous les utilisateurs doivent être retirés avant une suppression physique ;
- le serveur recompte les membres juste avant le `DELETE` ;
- la FK `ON DELETE RESTRICT` protège aussi les suppressions concurrentes ou
  directes ;
- une dépendance inconnue conduit à la désactivation, jamais à une perte de
  données.

Message métier :
`Retirez tous les utilisateurs de l’organisation avant de pouvoir la supprimer.`

Source : [organization-deletion.ts](../src/features/organizations/domain/organization-deletion.ts).

## 7. Cycle de vie des groupes

- Créer un groupe produit un groupe `active` au nom unique dans l'organisation.
- Modifier change uniquement son nom et sa description.
- L'action métier « supprimer » archive le groupe : aucune relation ni donnée
  historique n'est effacée.
- Un groupe archivé disparaît de l'administration et ne fournit plus d'accès,
  de contenu compté ni d'apprenant.
- Un contenu peut rester accessible par une autre portée valide ou une
  assignation directe indépendante.
- Les métadonnées du groupe archivé peuvent encore être lisibles par la Data
  API pour un membre autorisé ; ses contenus ne le sont plus par ce seul groupe.

Source : [organization-group-detail.ts](../src/features/organizations/server/organization-group-detail.ts).

## 8. Cycle de vie des utilisateurs

### Invitation

Ordre actuel :

1. vérifier l'organisation et le groupe demandé ;
2. inviter dans Supabase Auth ;
3. créer ou mettre à jour le profil avec `platform_role = user` ;
4. créer ou mettre à jour le rattachement en `invited` ;
5. ajouter éventuellement l'utilisateur au groupe.

Le succès recharge les utilisateurs, actualise la fiche et demande de vérifier
la boîte de réception, les indésirables ou les spams.

### Retrait d'une organisation

- Le retrait supprime uniquement `organization_members(organization_id,
  user_id)`.
- Le compte Auth et le profil sont conservés.
- Un trigger supprime les `group_members` de cette organisation seulement.
- Les autres organisations et groupes de l'utilisateur ne sont pas touchés.
- Les assignations explicites, liées au profil, restent en place.
- Le retrait ne suspend pas automatiquement le compte.
- Si un historique protège le rattachement, le retrait entier échoue en `409`
  et le nettoyage des groupes est annulé dans la même transaction.

Couper tout accès nécessiterait une action distincte de suspension du compte et
de révocation des assignations.

Source : [remove-organization-user.ts](../src/features/organizations/server/remove-organization-user.ts).

## 9. Actualisation et cache

Clés uniques :

- `ORGANIZATIONS_QUERY_KEY` pour la liste des organisations ;
- `USERS_QUERY_KEY` pour la liste générale des utilisateurs.

| Mutation | Actualisation obligatoire |
|---|---|
| Créer une organisation | Ajouter la réponse au cache, puis invalider Organisations |
| Modifier, suspendre ou supprimer une organisation | Mettre à jour l'état local si nécessaire, invalider Organisations, puis refresh serveur |
| Créer, modifier ou archiver un groupe | Actualiser le groupe, invalider Organisations, puis refresh du parent |
| Inviter ou retirer un utilisateur | Actualiser les lignes, invalider Organisations et Utilisateurs, puis refresh du parent |
| Modifier nom, rôle, statut ou groupes d'un utilisateur | Invalider les vues Utilisateurs et Organisations concernées |
| Créer, modifier, publier, changer la cible ou archiver un roleplay/quiz | Invalider Organisations, puis refresh serveur |

Règle : une mutation doit synchroniser les quatre niveaux concernés — état
local, cache React Query, props serveur et plan de suppression.

Source : [organization-query.ts](../src/features/organizations/domain/organization-query.ts).

## 10. Contrat d'erreur

Les routes utilisent `jsonError()` :

| HTTP | Signification |
|---|---|
| `400` | DTO invalide, avec erreurs de champs |
| `401` | Session absente |
| `403` | Administrateur requis |
| `404` | Ressource introuvable |
| `409` | Doublon ou invariant métier bloquant |
| `500` | Erreur interne sans détail technique exposé |

## 11. Garanties PostgreSQL

| Garantie | Protection |
|---|---|
| Auto-promotion admin impossible | Privilèges `UPDATE` par colonne sur `profiles` |
| Organisation suspendue sans accès dérivé | Fonctions RLS vérifiant l'organisation active |
| Groupe archivé sans accès dérivé | `private.can_read_group` exige `groups.status = active` |
| Organisation avec membres non supprimable | FK restrictive sur `organization_members.organization_id` |
| Retrait utilisateur cohérent | Trigger transactionnel nettoyant ses groupes de la même organisation |

Les fonctions `security definer` utilisent le schéma `private`, un
`search_path` vide et des droits d'exécution limités.

Migrations de référence :

- [20260713120000_enforce_suspended_organization_access.sql](../supabase/migrations/20260713120000_enforce_suspended_organization_access.sql) ;
- [20260717071140_harden_profile_update_privileges.sql](../supabase/migrations/20260717071140_harden_profile_update_privileges.sql) ;
- [20260717085528_revoke_archived_group_content_access.sql](../supabase/migrations/20260717085528_revoke_archived_group_content_access.sql) ;
- [20260717085539_restrict_organization_deletion_with_members.sql](../supabase/migrations/20260717085539_restrict_organization_deletion_with_members.sql).

## 12. Écarts connus

Ces points ne doivent pas être copiés comme règles métier :

1. Le filtre de statut et la pagination de `/organizations` sont visuels mais
   non fonctionnels.
2. Les boutons Modifier/Archiver des lignes de l'onglet Groupes n'ont pas de
   handler ; ces actions fonctionnent depuis la fiche groupe.
3. Le libellé « Supprimer » et `window.confirm` décrivent mal l'archivage d'un
   groupe.
4. Les dates d'assignation affichent encore `created_at` du contenu ;
   `assigned_at` des assignations explicites n'est pas exploité.
5. L'invitation Auth → profil → organisation → groupe n'est pas transactionnelle
   et ne vérifie pas encore explicitement que le groupe sélectionné est actif.
6. Une erreur de chargement des groupes du formulaire d'invitation devient une
   liste vide sans message.
7. L'onglet actif n'est pas resynchronisé avec l'historique navigateur.
8. La fiche d'une organisation inexistante ne produit pas encore toujours une
   page Next.js `404` dédiée.
9. Les onglets Roleplays et Évaluations n'ont ni actions Voir/Modifier ni états
   autonomes de chargement/erreur ; certains textes vides mentionnent à tort un
   groupe.
10. Tous les statuts utilisateur utilisent le même badge vert et la liste des
    utilisateurs ne protège pas encore contre une réponse réseau ancienne.
11. L'overview de la fiche groupe reçoit `quizCount` mais ne l'affiche pas.
12. Les horodatages de deux migrations distantes diffèrent de leurs noms locaux
    malgré un SQL équivalent ; l'historique doit être réaligné avant un futur
    `supabase db push`.
13. Une cible mixte, par exemple un groupe et un utilisateur assigné hors de ce
    groupe, est correctement calculée mais son libellé n'affiche que le groupe.
14. Après archivage depuis la fiche groupe, la redirection revient sur l'overview
    Organisation sans conserver l'onglet Groupes ni le contexte de retour.

## 13. Règles d'évolution

- Réutiliser les enums, DTO, seuil de 30 secondes et clés de cache existants.
- Conserver la séparation route API → DTO/service serveur → domaine → UI.
- Exécuter `requireAdmin()` avant tout client service role.
- Ajouter toute nouvelle table organisationnelle au plan de suppression et la
  protéger par une FK adaptée.
- Définir explicitement le périmètre de tout nouveau compteur.
- Invalider toutes les vues affectées après une mutation.
- Ajouter un test de domaine, un test serveur et, si nécessaire, un test SQL.
- Ajouter tout nouvel écart à ce registre : aucune dette silencieuse.

## 14. Tests de référence

- Compteurs SSOT :
  [organization-content-scope.test.ts](../src/features/organizations/domain/organization-content-scope.test.ts)
  et
  [list-organization-content-scope.test.ts](../src/features/organizations/server/list-organization-content-scope.test.ts).
- Cohortes et progression :
  [organization-activity.test.ts](../src/features/organizations/domain/organization-activity.test.ts)
  et
  [list-organization-activity.test.ts](../src/features/organizations/server/list-organization-activity.test.ts).
- Organisations, groupes et utilisateurs :
  [list-organizations.test.ts](../src/features/organizations/server/list-organizations.test.ts),
  [update-organization.test.ts](../src/features/organizations/server/update-organization.test.ts),
  [list-organization-groups.test.ts](../src/features/organizations/server/list-organization-groups.test.ts)
  et
  [list-organization-user-assignment-counts.test.ts](../src/features/organizations/server/list-organization-user-assignment-counts.test.ts).
- Suppression et sécurité :
  [delete-organization.test.ts](../src/features/organizations/server/delete-organization.test.ts),
  [remove-organization-user.test.ts](../src/features/organizations/server/remove-organization-user.test.ts),
  [organization-deletion-constraint.test.ts](../src/features/organizations/server/organization-deletion-constraint.test.ts)
  et
  [archived-group-access-privileges.test.ts](../src/features/organizations/server/archived-group-access-privileges.test.ts).

Le cycle de vie général des contenus reste défini dans
[decision-cycle-vie-contenus-et-dependances-2026-07-13.md](./decision-cycle-vie-contenus-et-dependances-2026-07-13.md).
