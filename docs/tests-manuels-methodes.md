# Tests manuels - Méthodes

Date de création : 21 juin 2026

Objectif : centraliser les tests manuels à faire sur la feature `Méthodes`. Ce fichier servira ensuite de modèle pour les autres features.

## Prérequis

- Être connecté avec un utilisateur admin.
- Avoir au moins une organisation existante pour tester le scope privé organisation.
- Avoir accès au dashboard Supabase ou à un client SQL pour vérifier :
  - `methods`
  - `method_steps`
  - `method_resources`
  - `notation_method_files`
  - Storage bucket `notation_pdf`
- Préparer ces fichiers de test :
  - `guide-methode-test.pdf` inférieur à 25 Mo
  - `guide-methode-test.docx` ou `.md`
  - `capsule-test.mp4` inférieur à 25 Mo
  - `capsule-test.png` ou `.mp3`
  - un fichier interdit, par exemple `.zip`
  - un fichier supérieur à 25 Mo si possible
- Utiliser un nom unique par campagne, par exemple `Méthode QA 2026-06-21 14h30`.

## Requêtes Supabase utiles

Remplacer `<method_id>` par l'ID de la méthode créée.

```sql
select id, name, status, scope, organization_id, notation_method_id, is_active
from public.methods
where id = '<method_id>';

select id, method_id, step_order, title, step_key
from public.method_steps
where method_id = '<method_id>'
order by step_order;

select id, method_id, step_id, bucket, path, external_url, resource_type, notation_file_id, sort_order
from public.method_resources
where method_id = '<method_id>'
order by sort_order;

select id, method_id, bucket, path, label, file_type, sort_order, is_active
from public.notation_method_files
where method_id = '<method_id>';
```

Règle importante :

- `method_resources.step_id = null` : ressource globale de méthode.
- `method_resources.step_id != null` : ressource d'étape, dont capsule e-learning.
- Seuls les documents globaux uploadés doivent créer une ligne `notation_method_files`.
- Les capsules d'étape ne doivent jamais créer de ligne `notation_method_files`.

## Tests P0

### MTH-001 - Accès liste et détail

- [ ] Ouvrir `/methods` connecté en admin.
- [ ] Vérifier que la liste charge sans erreur.
- [ ] Vérifier que chaque carte affiche nom, statut, nombre d'étapes et scope.
- [ ] Ouvrir une méthode existante.
- [ ] Vérifier que le détail affiche les informations principales, objectifs, enjeux, étapes et ressources si présentes.

Résultat attendu :

- La page liste et la page détail ne crashent pas.
- Les méthodes privées affichent `Privé - {nom organisation}` quand l'organisation est connue.

### MTH-002 - Création brouillon publique minimale

- [ ] Aller sur `/methods/new`.
- [ ] Saisir un nom unique.
- [ ] Renseigner domaine, catégorie, description.
- [ ] Ajouter une étape avec un titre.
- [ ] Laisser la visibilité sur `Public`.
- [ ] Cliquer `Enregistrer en brouillon`.

Résultat attendu UI :

- Redirection vers le détail de la méthode créée.
- Le statut affiché est `Brouillon`.

Contrôles Supabase :

- `methods.status = draft`.
- `methods.scope = public`.
- `methods.organization_id is null`.
- Une ligne existe dans `method_steps`.
- Aucune ligne `method_resources` n'est créée si aucune ressource n'a été renseignée.

### MTH-003 - Blocage publication sans quiz sur nouvelle méthode

- [ ] Aller sur `/methods/new`.
- [ ] Remplir le minimum requis sans sélectionner `Quiz associé`.
- [ ] Vérifier l'état du bouton `Publier la méthode`.
- [ ] Sélectionner un quiz dans `Quiz associé`.
- [ ] Vérifier à nouveau l'état du bouton.

Résultat attendu :

- Sans quiz sélectionné, le bouton de publication est désactivé.
- Après sélection d'un quiz, le bouton de publication devient disponible si le reste du formulaire est valide.
- Le quiz n'est pas encore persisté dans `methods` : c'est temporaire tant que le CRUD quiz n'est pas branché.

### MTH-004 - Création publiée publique

- [ ] Créer une nouvelle méthode.
- [ ] Sélectionner un `Quiz associé`.
- [ ] Remplir au moins une étape.
- [ ] Cliquer `Publier la méthode`.

Résultat attendu :

- Redirection vers le détail.
- Le statut affiché est `Publié`.

Contrôles Supabase :

- `methods.status = published`.
- Aucun champ `quiz_id` ne doit être écrit dans `methods`.

### MTH-005 - Création privée organisation

- [ ] Aller sur `/methods/new`.
- [ ] Choisir visibilité `Privé`.
- [ ] Ne pas choisir d'organisation.
- [ ] Vérifier que l'enregistrement n'est pas possible.
- [ ] Choisir une organisation.
- [ ] Enregistrer en brouillon.

Résultat attendu UI :

- Le formulaire exige une organisation pour une méthode privée.
- Sur liste et détail, le scope affiche `Privé - {nom organisation}`.

Contrôles Supabase :

- `methods.scope = organization`.
- `methods.organization_id` correspond à l'organisation sélectionnée.

### MTH-006 - Ressource complémentaire URL

- [ ] Créer ou éditer une méthode.
- [ ] Ajouter une ressource complémentaire.
- [ ] Choisir `URL`.
- [ ] Saisir un nom et une URL valide.
- [ ] Enregistrer.

Résultat attendu :

- La ressource apparaît sur le détail si l'UI détail l'affiche.

Contrôles Supabase :

- Une ligne `method_resources` existe avec `step_id is null`.
- `external_url` contient l'URL.
- `bucket` et `path` sont `null`.
- Aucune ligne `notation_method_files` n'est créée pour cette URL.

### MTH-007 - Ressource complémentaire fichier document

- [ ] Créer ou éditer une méthode.
- [ ] Ajouter une ressource complémentaire.
- [ ] Choisir `Fichier`.
- [ ] Sélectionner un PDF ou DOCX inférieur à 25 Mo.
- [ ] Avant submit, vérifier si possible qu'aucun objet Storage n'est créé.
- [ ] Enregistrer.

Résultat attendu UI :

- Le fichier sélectionné apparaît dans le champ avant submit.
- Après submit, la méthode est enregistrée.

Contrôles Supabase :

- Une ligne `method_resources` existe avec `step_id is null`.
- `bucket = notation_pdf`.
- `path` suit le format `methods/{methodId}/resources/{resourceId}/{fileName}`.
- `notation_file_id` est renseigné.
- Une ligne `notation_method_files` existe avec le même `bucket/path`.
- L'objet existe dans Storage bucket `notation_pdf`.

### MTH-008 - Ressource complémentaire fichier invalide

- [ ] Dans `Ressources complémentaires`, choisir `Fichier`.
- [ ] Sélectionner un `.zip` ou une vidéo.
- [ ] Sélectionner un fichier supérieur à 25 Mo si possible.

Résultat attendu :

- Le fichier est refusé côté UI.
- Message attendu pour type interdit : `Format de fichier non supporté.` ou `Les ressources complémentaires acceptent uniquement des documents.`
- Message attendu pour taille : `Le fichier ne doit pas dépasser 25 Mo.`
- Aucun objet Storage ni ligne DB ne doit être créé tant que le submit n'a pas lieu.

### MTH-009 - Capsule e-learning URL

- [ ] Ajouter ou éditer une étape.
- [ ] Dans `Capsule e-learning`, choisir le type média `URL`.
- [ ] Saisir un titre de média.
- [ ] Saisir une URL vidéo.
- [ ] Enregistrer.

Contrôles Supabase :

- Une ligne `method_resources` existe avec `step_id` renseigné.
- `external_url` contient l'URL.
- `resource_type = video`.
- `notation_file_id is null`.
- Aucune ligne `notation_method_files` n'est créée.

### MTH-010 - Capsule e-learning fichier

- [ ] Ajouter ou éditer une étape.
- [ ] Dans `Capsule e-learning`, choisir `Téléchargement`.
- [ ] Sélectionner un fichier vidéo, audio, image ou document autorisé.
- [ ] Enregistrer.

Contrôles Supabase :

- Une ligne `method_resources` existe avec `step_id` renseigné.
- `bucket = notation_pdf`.
- `path` suit le format `methods/{methodId}/steps/{stepId}/resources/{resourceId}/{fileName}`.
- `resource_type` correspond au type du fichier : `video`, `audio`, `image` ou `document`.
- `notation_file_id is null`.
- Aucune ligne `notation_method_files` n'est créée pour cette capsule.
- L'objet existe dans Storage bucket `notation_pdf`.

### MTH-011 - Édition simple méthode

- [ ] Ouvrir le détail d'une méthode.
- [ ] Cliquer `Modifier`.
- [ ] Modifier nom, description, objectifs, enjeux.
- [ ] Ajouter une étape.
- [ ] Retirer une étape.
- [ ] Enregistrer.

Résultat attendu :

- Les changements apparaissent sur le détail.
- Les étapes sont dans le bon ordre.
- Les anciennes étapes retirées ne sont plus présentes en DB.

Contrôles Supabase :

- `methods.updated_at` est modifié.
- `method_steps` reflète les étapes conservées.

### MTH-012 - Cleanup ressource complémentaire remplacée

- [ ] Créer une méthode avec une ressource complémentaire PDF.
- [ ] Relever l'ancien `method_resources.path` et l'ancien `notation_method_files.id`.
- [ ] Éditer la méthode.
- [ ] Remplacer ce PDF par un autre document.
- [ ] Enregistrer.

Résultat attendu :

- Le nouveau document est présent.
- L'ancien document ne doit plus être référencé.

Contrôles Supabase :

- L'ancien `path` n'existe plus dans `method_resources`.
- L'ancien `path` n'existe plus dans `notation_method_files`, sauf s'il est encore référencé volontairement ailleurs.
- L'ancien objet Storage est supprimé du bucket `notation_pdf` si plus aucune référence DB ne l'utilise.
- Le nouveau document a une ligne `method_resources` globale et une ligne `notation_method_files`.

### MTH-013 - Cleanup ressource complémentaire supprimée

- [ ] Créer une méthode avec une ressource complémentaire PDF.
- [ ] Relever le `path`.
- [ ] Éditer la méthode.
- [ ] Supprimer la ressource complémentaire.
- [ ] Enregistrer.

Contrôles Supabase :

- La ligne `method_resources` correspondante est supprimée.
- La ligne `notation_method_files` correspondante est supprimée si elle n'est plus utilisée.
- L'objet Storage est supprimé si plus référencé.

### MTH-014 - Cleanup capsule d'étape remplacée

- [ ] Créer une méthode avec une capsule fichier vidéo sur une étape.
- [ ] Relever l'ancien `method_resources.path`.
- [ ] Éditer la méthode.
- [ ] Remplacer la capsule par un autre fichier.
- [ ] Enregistrer.

Contrôles Supabase :

- L'ancien `path` n'existe plus dans `method_resources`.
- L'ancien objet Storage est supprimé si plus référencé.
- Aucune suppression ou création de `notation_method_files` n'est liée à cette capsule.
- La nouvelle capsule existe uniquement dans `method_resources` avec `step_id` renseigné.

### MTH-015 - Cleanup capsule d'étape supprimée

- [ ] Créer une méthode avec une capsule fichier sur une étape.
- [ ] Relever le `path`.
- [ ] Éditer la méthode.
- [ ] Retirer la capsule ou repasser la capsule en URL vide.
- [ ] Enregistrer.

Contrôles Supabase :

- La ligne `method_resources` de capsule est supprimée.
- L'objet Storage est supprimé si plus référencé.
- `notation_method_files` n'est pas modifié par cette suppression.

### MTH-016 - Archivage méthode

- [ ] Ouvrir une méthode.
- [ ] Cliquer `Archiver`.
- [ ] Cliquer `Confirmer l'archivage`.

Résultat attendu :

- Redirection vers `/methods`.
- La méthode passe en statut archivé.

Contrôles Supabase :

- `methods.status = archived`.
- `methods.is_active = false`.

Point à valider produit :

- Aujourd'hui, la liste charge toutes les méthodes. Vérifier si les méthodes archivées doivent rester visibles avec badge `Archivé` ou être filtrées.

## Tests P1

### MTH-017 - Responsive formulaire méthode

- [ ] Tester `/methods/new` en desktop.
- [ ] Tester en largeur mobile.
- [ ] Vérifier que les champs, boutons, menus select et uploads ne débordent pas.
- [ ] Vérifier que le texte des boutons reste lisible.

### MTH-018 - Cohérence UI avec Figma Make

- [ ] Comparer la structure du formulaire méthode avec la maquette Figma Make.
- [ ] Vérifier que les composants existants sont réutilisés : inputs, textarea, select, listes éditables, upload.
- [ ] Vérifier que les cartes/champs ne sont pas trop grands par rapport à la maquette.
- [ ] Vérifier que les ressources complémentaires proposent bien `Fichier` et `URL`.
- [ ] Vérifier que les capsules e-learning proposent bien `URL` et `Téléchargement`.

### MTH-019 - Multiples ressources complémentaires

- [ ] Ajouter au moins trois ressources complémentaires :
  - un PDF uploadé
  - un DOCX ou MD uploadé
  - une URL
- [ ] Enregistrer.

Contrôles Supabase :

- Les ressources globales ont `step_id is null`.
- Les fichiers uploadés ont `bucket/path`.
- L'URL a `external_url`.
- Seuls les fichiers globaux uploadés ont une ligne `notation_method_files`.

### MTH-020 - Multiples étapes avec capsules différentes

- [ ] Créer une méthode avec trois étapes.
- [ ] Étape 1 : capsule URL.
- [ ] Étape 2 : capsule vidéo uploadée.
- [ ] Étape 3 : capsule image ou audio uploadée.
- [ ] Enregistrer.

Contrôles Supabase :

- Chaque ressource d'étape a le bon `step_id`.
- Les ressources d'étapes uploadées ont un path qui contient `steps/{stepId}`.
- Aucune capsule ne crée de `notation_method_files`.

### MTH-021 - Erreurs API

- [ ] Désactiver temporairement le réseau ou simuler une erreur serveur si possible.
- [ ] Tenter un enregistrement.
- [ ] Vérifier que le formulaire affiche une erreur claire.
- [ ] Vérifier que le bouton repasse dans un état utilisable après erreur.

## Tests P2 / à compléter plus tard

### MTH-022 - Permissions utilisateur non-admin

- [ ] Connecter un utilisateur authentifié non-admin.
- [ ] Vérifier accès lecture liste/détail selon règles produit.
- [ ] Vérifier que création, édition et archivage sont refusés si l'utilisateur n'est pas admin.

Note : les routes d'écriture méthodes utilisent `requireAdmin()`.

### MTH-023 - Quiz méthode persisté

À compléter quand le CRUD quiz et `quizzes.method_id` seront branchés.

À vérifier plus tard :

- un quiz de méthode peut être lié à une méthode ;
- une méthode publiée exige un quiz de méthode valide côté serveur ;
- le select `Quiz associé` ne reste pas seulement UI ;
- le statut du quiz de méthode est visible : absent, brouillon, publié.

### MTH-024 - Méthodes dans roleplays

À compléter quand le formulaire roleplay et les tables quiz/scorecard seront branchés.

## Checklist de fin de campagne

- [ ] Toutes les créations test ont un nom identifiable.
- [ ] Les fichiers inutiles ont été nettoyés ou conservés volontairement.
- [ ] Aucun objet orphelin évident dans `notation_pdf`.
- [ ] Aucun fichier de capsule n'a créé de `notation_method_files`.
- [ ] Les bugs trouvés ont un ticket ou une note avec ID de scénario `MTH-xxx`.
