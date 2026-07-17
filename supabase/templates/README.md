# Modèles d’emails Supabase Auth

Ces fichiers sont la source de vérité des modèles d’emails Auth hébergés dans Supabase.

Pour un projet Supabase hébergé, ils ne sont pas déployés automatiquement. Après chaque modification, le contenu doit être synchronisé dans le Dashboard ou via la Management API.

## Réinitialisation du mot de passe

- Objet : `Réinitialisez votre mot de passe MaiaCoach`
- Modèle : `recovery.html`
- Emplacement Supabase : **Authentication → Email Templates → Reset password**

Le lien utilise `RedirectTo` et `TokenHash` afin que la vérification soit effectuée côté serveur avec `verifyOtp`. Il fonctionne donc sur un autre appareil que celui ayant demandé la réinitialisation.

`buildPasswordRecoveryRedirectUrl` ajoute toujours le paramètre `flow=recovery` à `RedirectTo`. Le modèle peut ainsi ajouter les paramètres `token_hash` et `type` avec `&` sans reconstruire ni dupliquer l’URL de l’application.

Le fournisseur SMTP doit avoir le suivi des liens désactivé afin de ne pas réécrire l’URL. Certains scanners d’emails peuvent également précharger les liens à usage unique ; une confirmation intermédiaire ou un OTP manuel pourra être ajouté si ce cas apparaît en production.
