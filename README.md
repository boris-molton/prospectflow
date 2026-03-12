# ProspectFlow

Application personnelle pour gérer tes candidatures spontanées de manière intelligente.

## Fonctionnalités MVP

- **Dashboard** : Vue d'ensemble (prospects, emails envoyés, réponses, taux)
- **Prospects** : CRUD complet, recherche, filtres
- **Fiche prospect** : Détails, historique, emails envoyés
- **Génération IA** : Emails personnalisés via OpenAI (sujet + corps)
- **Envoi Gmail** : Connexion OAuth, envoi manuel sur validation
- **Statuts** : Workflow complet (Nouveau → Envoyé → Réponse...)

## Stack

- Next.js 16 + TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- NextAuth (Google OAuth + Gmail scopes)
- OpenAI API
- Gmail API

## Installation

### 1. Dépendances

```bash
npm install
```

### 2. Base de données

Configure PostgreSQL (local, [Neon](https://neon.tech), [Supabase](https://supabase.com)...) et mets à jour `.env` :

```
DATABASE_URL="postgresql://user:password@host:5432/prospectflow?schema=public"
```

Puis :

```bash
npm run db:push
# ou
npm run db:migrate
```

### 3. Google OAuth (Gmail)

1. Va sur [Google Cloud Console](https://console.cloud.google.com/)
2. Crée un projet
3. APIs & Services → Credentials → Create Credentials → OAuth client ID
4. Type : Web application
5. Authorized redirect URIs : `http://localhost:3000/api/auth/callback/google`
6. Copie Client ID et Client Secret dans `.env`

### 4. OpenAI

Crée une clé API sur [platform.openai.com](https://platform.openai.com/api-keys) et ajoute-la dans `.env`.

### 5. NextAuth

Génère un secret :

```bash
openssl rand -base64 32
```

Mets-le dans `NEXTAUTH_SECRET`.

## Lancement

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000), connecte-toi avec Google, et commence à ajouter des prospects.

## Structure du projet

```
src/
├── app/
│   ├── (app)/           # Routes protégées
│   │   ├── page.tsx     # Dashboard
│   │   ├── prospects/
│   │   └── settings/
│   ├── api/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── email/
│   │   ├── prospects/
│   └── auth/signin/
├── components/
├── lib/
├── services/
└── types/
```

## Scripts

- `npm run dev` - Développement
- `npm run build` - Build production
- `npm run db:generate` - Génère le client Prisma
- `npm run db:push` - Pousse le schéma vers la DB (dev)
- `npm run db:migrate` - Migrations
- `npm run db:studio` - Interface Prisma Studio
