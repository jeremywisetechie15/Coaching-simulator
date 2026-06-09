# Revue de code — Feature « Groupes d'organisation » (Codex)

> Date : 2026-06-07 · Branche : `main` (changements non commités dans l'arbre de travail)
> Revue **statique** (pas de `tsc`/build lancé : ~50 fichiers non liés modifiés en parallèle bruiteraient le résultat).

## Périmètre revu (18 fichiers)

Migration + serveur + route API + UI de la feature groupes, et intégration au flux d'invitation.

**Nouveaux fichiers**
- `supabase/migrations/20260607231517_create_organization_groups.sql`
- `src/app/api/organizations/[organizationId]/groups/route.ts`
- `src/features/organizations/dto/create-organization-group.dto.ts`
- `src/features/organizations/server/create-organization-group.ts`
- `src/features/organizations/server/list-organization-groups.ts`
- `src/features/organizations/server/organization-group.mapper.ts`
- `src/features/users/server/list-users.ts`

**Fichiers modifiés**
- `src/features/organizations/components/CreateGroupModal.tsx`
- `src/features/organizations/components/OrganizationDetailContent.tsx`
- `src/features/organizations/components/OrganizationDetailGroups.tsx`
- `src/features/organizations/components/OrganizationDetailUsers.tsx`
- `src/features/organizations/domain/organization-detail.ts`
- `src/features/organizations/dto/invite-organization-user.dto.ts`
- `src/features/organizations/server/get-organization-detail.ts`
- `src/features/organizations/server/index.ts`
- `src/features/organizations/server/invite-organization-user.ts`
- `src/features/organizations/server/list-organizations.ts`
- `src/features/organizations/server/organization.mapper.ts`

## Ce qui a été fait

Implémentation complète des groupes d'organisation : migration SQL (`groups` + `group_members` avec RLS), services serveur (`createOrganizationGroup`, `listOrganizationGroups`, mapper, DTO), route API `GET/POST /api/organizations/[id]/groups`, branchement UI réel dans `OrganizationDetailGroups` (chargement/création), affectation à un groupe dans le flux d'invitation, mutualisation de la modale d'invitation (`UserInviteModal`), et calcul des compteurs réels `userCount`/`groupCount` dans `listOrganizations` + `getOrganizationDetail`. Nouveau `listUsers` agrégé.

## Points forts

- **Migration soignée** : index unique `(organization_id, lower(name))` insensible à la casse, correctement rattrapé côté serveur via code Postgres `23505` → `409 GROUP_ALREADY_EXISTS`. Trigger `updated_at`, RLS `security definer` avec `search_path = ''` et noms qualifiés.
- **Gestion d'erreurs cohérente** : `jsonError` sérialise `ZodError.issues`, le front les ré-agrège (`issues.map(...).join(" ")`). Bon bout-en-bout.
- **États UI complets** : loading / vide / erreur, `isSubmitting`, désactivation des boutons, `aria-live`.
- Profil `upsert` **avant** l'insert `group_members` → FK `group_members.user_id → profiles.id` satisfaite. Pas de violation FK.

---

## Problèmes à traiter

### 🔴 Élevé

- [ ] **#1 — `userCount` compte les membres `removed`/`suspended`**
  `list-organizations.ts:769` et `get-organization-detail.ts:31` ne filtrent pas par statut, alors que les groupes sont filtrés `status = 'active'`. Statuts possibles : `invited | active | suspended | removed`. Un membre **retiré** est donc compté.
  → Décider du périmètre puis filtrer, p. ex. `.in("status", ["invited","active"])`. (Prêt à appliquer ce correctif.)

- [ ] **#2 — Onglet « Utilisateurs » du détail org reste sur des données démo**
  `OrganizationDetailUsers.tsx:386` → `useState(demoOrganizationUsers)`. Les groupes sont réels (fetch API) mais la liste users est hardcodée. L'invitation fait `setUsers([...demo, nouveau])` et invalide `["users"]`/`["organizations"]` — sans effet (la vue ne lit pas react-query). `listUsers()` existe déjà → câbler la vraie liste filtrée par org.

### 🟠 Moyen

- [ ] **#3 — Changement d'autorisation silencieux sur l'invitation** *(décision produit)*
  `invite-organization-user.ts:29` : `requireAuth() + canManageOrganization()` → `requireAdmin()`. Les **managers d'org ne peuvent plus inviter** (réservé admins plateforme, cohérent avec la RLS groupes). Probablement intentionnel, mais à valider explicitement.

- [ ] **#4 — Invitation non atomique**
  `invite-organization-user.ts` : `inviteUserByEmail` → upsert profil → membership → upsert group_member, sans transaction. Échec tardif = état partiel (email parti sans membership, etc.). Le step groupe ajoute un point de défaillance. Corrigeable via RPC/transaction.

- [ ] **#5 — Plafond silencieux à 1000 utilisateurs**
  `list-users.ts:154` : `listUsers({ page: 1, perPage: 1000 })` sans pagination → troncature silencieuse au-delà de 1000. De plus `get-user-by-id.ts` appelle `listUsers()` pour résoudre **un seul** user → recharge tout (profils + auth users + memberships + groupes) à chaque lookup.

- [ ] **#6 — Comptage en mémoire à l'échelle de toute la base**
  `list-organizations.ts:769` charge **toutes** les lignes `organization_members` + `groups` (toutes orgs) pour compter en JS. OK petite échelle ; préférer une agrégation DB (vue/`count`) à terme.

### 🟡 Mineur / cohérence

- [ ] **#7 — Incohérence client Supabase** : `list-organizations.ts` → `createAdminClient` (bypass RLS) ; `get-organization-detail.ts:15` garde `createClient` (session, RLS). Si la RLS `organization_members` ne laisse pas l'admin tout lire, le détail sous-compterait. Uniformiser.
- [ ] **#8 — `OrganizationDetailGroups.tsx:145`** : branche `!response.ok` → `setListError` non gardé par `isMounted` (alors que le succès l'est). Bénin mais asymétrique.
- [ ] **#9 — Patterns de data-fetching mélangés** : `useQueryClient` importé juste pour `invalidateQueries`, mais fetch en `useEffect + useState` au lieu de `useQuery`. `OrganizationDetailGroups` et `OrganizationDetailUsers` refont chacun le même `GET .../groups`. Factoriser en hook react-query partagé.
- [ ] **#10 — Actions de groupe factices** : icônes Eye/Pencil/Trash2 et colonnes Membres/Formations/Progression à 0/sans handler. La RLS prévoit update/delete admin. UI présente mais non fonctionnelle.
- [ ] **#11 — `programCount` toujours à 0** (`organization.mapper.ts:55`) : champ `program_count?` ajouté mais jamais alimenté. Cohérent avec le retrait des Programmes du MVP. À garder en tête.
- [ ] **#12 — Nom de table générique** `public.groups` : non réservé en Postgres, fonctionnel mais générique. Acceptable.

---

## Recommandation

Le cœur (migration, route, DTO, création de groupe) est **solide et mergeable**. Avant merge, prioriser :
1. **#1** — faux `userCount` (correctif simple, prêt à appliquer).
2. **#2** — liste users démo dans le détail org.
3. **#3** — trancher la question managers/invitation (produit).

Le reste = dette acceptable à tracker.

## Reprise demain — TODO

- [ ] Lancer un typecheck ciblé / build pour valider la compilation de ces fichiers.
- [ ] Appliquer #1 (filtrage des statuts dans les compteurs).
- [ ] Décider #2 et #3.
