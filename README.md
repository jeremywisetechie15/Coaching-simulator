# 🎤 Coaching Simulator - Iframe API

Simulateur de conversations vocales en temps réel avec l'IA. Conçu pour être intégré en **iframe** dans des applications tierces (Bubble, Figma, etc.).

## 🚀 Stack Technique

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **UI**: Tailwind CSS + Lucide React
- **AI**: OpenAI Realtime API via WebRTC
- **Modèle**: `gpt-realtime`

---

## 📦 Installation

```bash
npm install
```

---

## ⚙️ Configuration

### Variables d'environnement

Créez un fichier `.env.local` à la racine :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenAI (Server-side only - JAMAIS exposer côté client)
OPENAI_API_KEY=sk-your-openai-api-key

# Coach par défaut (optionnel - UUID du coach utilisé si coach_id n'est pas fourni)
DEFAULT_COACH_ID=uuid-du-coach-par-defaut
```

---

## 🗄️ Base de données Supabase

### Tables requises

#### 1. `personas` - Personnages pour le mode Standard

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | `uuid` | Clé primaire |
| `name` | `text` | Nom du persona (ex: "Claire Dubois") |
| `voice_id` | `text` | Voix OpenAI (alloy, ash, coral, etc.) |
| `system_instructions` | `text` | Prompt système du persona |
| `avatar_url` | `text` | URL de l'image avatar (optionnel) |
| `created_at` | `timestamptz` | Date de création |

#### 2. `coaches` - Coachs pour le mode Coach

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | `uuid` | Clé primaire |
| `name` | `text` | Nom du coach (ex: "Pierre Laurent") |
| `voice_id` | `text` | Voix OpenAI |
| `system_instructions` | `text` | Prompt système du coach |
| `avatar_url` | `text` | URL de l'image avatar (optionnel) |
| `created_at` | `timestamptz` | Date de création |

#### 3. `scenarios` - Scénarios de simulation

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | `uuid` | Clé primaire |
| `title` | `text` | Titre du scénario |
| `description` | `text` | Description |
| `persona_id` | `uuid` | FK vers `personas` |
| `created_at` | `timestamptz` | Date de création |

#### 4. `sessions` - Sessions de conversation

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | `uuid` | Clé primaire |
| `scenario_id` | `uuid` | FK vers `scenarios` |
| `status` | `text` | `active`, `completed`, `interrupted` |
| `duration_seconds` | `integer` | Durée en secondes |
| `created_at` | `timestamptz` | Date de création |

#### 5. `messages` - Messages de conversation

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | `uuid` | Clé primaire |
| `session_id` | `uuid` | FK vers `sessions` |
| `role` | `text` | `user` ou `assistant` |
| `content` | `text` | Contenu du message |
| `timestamp` | `timestamptz` | Horodatage |

### Images Avatar

Les images `avatar_url` peuvent être :
- URLs Supabase Storage : `https://xxx.supabase.co/storage/v1/object/public/avatars/coach.jpg`
- URLs externes (Unsplash, etc.)
- Si `null`, une image par défaut est utilisée

---

## 🎯 Utilisation de l'Iframe

### URL de base

```
https://votre-domaine.com/iframe
```

### Mode Standard (Persona)

Simule une conversation avec un persona (client, prospect, etc.)

```
/iframe?scenario_id=UUID
```

| Paramètre | Obligatoire | Description |
|-----------|-------------|-------------|
| `scenario_id` | ✅ Oui | UUID du scénario à jouer |
| `model` | Non | Modèle OpenAI (défaut: `gpt-realtime`) |

**Comportement** :
1. Charge le scénario et son persona associé
2. Utilise le `system_instructions` du persona
3. Utilise l'`avatar_url` du persona
4. L'IA démarre la conversation automatiquement

---

### Mode Coach (Débrief)

Permet à un coach IA de débriefer une session précédente

```
/iframe?mode=coach
```

| Paramètre | Obligatoire | Description |
|-----------|-------------|-------------|
| `mode` | ✅ Oui | Doit être `coach` |
| `ref_session_id` | Non | UUID de la session à analyser (sinon: dernière session) |
| `coach_id` | Non | UUID du coach (sinon: `DEFAULT_COACH_ID`) |
| `coach_mode` | Non | `before_training` ou `after_training` (voir ci-dessous) |
| `step` | Non | Étape de focus (1 à 4) |
| `model` | Non | Modèle OpenAI |

#### Sous-modes du Coach

**1. Mode par défaut** (`mode=coach` sans `coach_mode`) :
- Comportement actuel
- Récupère le transcript de la dernière session
- Contexte du scénario inclus

**2. Mode avant entraînement** (`mode=coach&coach_mode=before_training`) :
- Prépare l'utilisateur AVANT une session
- Pas de transcript (session pas encore effectuée)
- Focus sur la préparation et les techniques

**3. Mode après entraînement** (`mode=coach&coach_mode=after_training`) :
- Débrief détaillé APRÈS une session
- Transcript complet inclus
- Focus sur l'analyse et les axes d'amélioration

#### Paramètre `step` (Étapes de focus)

| Step | Description |
|------|-------------|
| 1 | Accroche & Introduction |
| 2 | Découverte des besoins |
| 3 | Argumentation & Valeur |
| 4 | Conclusion & Engagement |

#### Exemples d'URLs Coach

```bash
# Mode par défaut - Dernière session + coach par défaut
/iframe?mode=coach

# Session spécifique + coach par défaut
/iframe?mode=coach&ref_session_id=ea94846a-e876-47bf-882e-e8027051a89c

# Préparation avant entraînement (step 1)
/iframe?mode=coach&coach_mode=before_training&step=1

# Débrief après entraînement (step 2)
/iframe?mode=coach&coach_mode=after_training&step=2

# Session + coach spécifiques
/iframe?mode=coach&ref_session_id=XXX&coach_id=YYY
```

---

### Mode Persona avec Variante Coach

Permet d'obtenir du coaching sur la dernière session d'un persona spécifique

```
/iframe?scenario_id=UUID&variant=coach
```

| Paramètre | Obligatoire | Description |
|-----------|-------------|-------------|
| `scenario_id` | ✅ Oui | UUID du scénario |
| `variant` | ✅ Oui | Doit être `coach` |
| `coach_id` | Non | UUID du coach (sinon: `DEFAULT_COACH_ID`) |
| `model` | Non | Modèle OpenAI |

**Comportement** :
1. Charge le scénario et son persona associé
2. Récupère le transcript de la dernière session pour ce scénario
3. Injecte le contexte du persona + transcript dans le prompt du coach
4. Utilise l'UI du mode coach (gradient orange)

#### Exemple d'URL

```bash
# Coaching sur la dernière session du scénario ABC
/iframe?scenario_id=ABC&variant=coach
```

---

## 🏗️ Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── realtime-session/    # Génère les clés éphémères OpenAI
│   │   └── save-session/        # Sauvegarde session + messages en DB
│   ├── iframe/
│   │   ├── page.tsx             # Page d'entrée iframe (SSR)
│   │   ├── IframeClient.tsx     # Composant client WebRTC
│   │   └── actions.ts           # Server Actions (fetch DB)
│   └── layout.tsx
├── lib/
│   └── supabase/
│       ├── client.ts            # Client navigateur
│       └── server.ts            # Client serveur
└── types/
    └── index.ts                 # Types TypeScript
```

---


## 🎨 Voix Disponibles

| Voice ID | Description |
|----------|-------------|
| `alloy` | Neutre |
| `ash` | Masculine douce |
| `ballad` | Mélodique |
| `coral` | Féminine chaleureuse |
| `echo` | Masculine dynamique |
| `sage` | Féminine calme |
| `shimmer` | Féminine vive |
| `verse` | Narrative |

---

## 🐛 Dépannage

### Erreur "Microphone access denied"
→ Vérifiez les permissions du navigateur pour le microphone

### Erreur "Failed to get session token"
→ Vérifiez que `OPENAI_API_KEY` est définie dans `.env.local`

### Erreur "No coach available"
→ Définissez `DEFAULT_COACH_ID` dans `.env.local` ou passez `coach_id` dans l'URL

### Erreur "No completed session found"
→ Aucune session avec `status = completed` n'existe. Passez `ref_session_id` explicitement.

### Erreur "Scenario not found"
→ Le `scenario_id` fourni n'existe pas dans la table `scenarios`

---

## 🚀 Déploiement

### Vercel

1. Connectez votre repo à Vercel
2. Ajoutez les variables d'environnement :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
   - `DEFAULT_COACH_ID`

### Headers CORS pour iframe

Les headers sont configurés dans `next.config.ts` pour permettre l'intégration en iframe.

---

## 📄 License

MIT
