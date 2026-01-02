# 🏥 Infirmerie PWA - Système de Gestion du Ministère

Progressive Web App (PWA) pour la gestion de l'infirmerie du ministère avec support offline complet.

## 📋 Statut du Projet

**Sprint 0:** ✅ COMPLETÉ - Authentification et fondations
**Version:** 0.1.0
**Dernière mise à jour:** 26 Décembre 2025

## 🎯 Fonctionnalités Actuelles

### ✅ Sprint 0 - Fondations (COMPLETÉ)
- [x] Authentification JWT avec 2 rôles (Infirmier, Personnel)
- [x] Dashboard adaptatif selon le rôle utilisateur
- [x] Routes protégées avec React Router
- [x] Gestion d'état global avec Zustand
- [x] UI moderne avec Shadcn/ui + Tailwind CSS v4
- [x] API client configuré avec Axios

### 🚧 À Venir
- Sprint 1: Dashboard & Navigation (4-5 jours)
- Sprint 2: CRUD Patients + Consultations offline
- Sprint 3: Gestion Médicaments & Stocks
- Sprint 4: Vaccinations & Rendez-vous
- Sprint 5: Rapports & Statistiques
- Sprint 6: PWA & Service Workers

## 🛠️ Stack Technique

- **Frontend:** React 19.2.0 + TypeScript 5.9.3
- **Build Tool:** Vite 7.2.4
- **Routing:** React Router v7.11.0
- **State Management:** Zustand 5.0.9
- **Data Fetching:** TanStack Query (React Query) v5.90.12
- **HTTP Client:** Axios 1.13.2
- **UI Library:** Shadcn/ui + Tailwind CSS 4.1.18
- **Forms:** React Hook Form 7.69.0 + Zod 4.2.1
- **Icons:** Lucide React 0.562.0
- **Dates:** date-fns 4.1.0
- **Notifications:** Sonner 2.0.7

## 📦 Installation

```bash
# Cloner le repository
git clone <repo-url>
cd infirmerie-pwa

# Installer les dépendances (pnpm recommandé)
pnpm install

# Copier le fichier d'environnement
cp .env.example .env.development

# Lancer le serveur de développement
pnpm dev
```

## 🚀 Scripts Disponibles

```bash
# Développement
pnpm dev             # Lance le serveur de développement (http://localhost:5173)

# Build
pnpm build           # Compile TypeScript et build pour production

# Linting & Formatting
pnpm lint            # Vérifie le code avec ESLint
pnpm lint:fix        # Corrige automatiquement les erreurs ESLint
pnpm format          # Formate le code avec Prettier
pnpm format:check    # Vérifie le formatage sans modifier

# Preview
pnpm preview         # Prévisualise le build de production
```

## 🔐 Authentification

L'application utilise JWT Bearer Token pour l'authentification.

### Rôles Utilisateurs

1. **INFIRMIER (Gestionnaire)**
   - Accès complet à tous les modules
   - CRUD patients, consultations, médicaments, stocks
   - Vaccinations, rendez-vous, rapports
   - Mode offline COMPLET

2. **PATIENT (Personnel)**
   - Vue lecture seule de son dossier médical
   - Historique consultations personnelles
   - Historique vaccinations personnelles
   - Rendez-vous personnels
   - Mode en ligne uniquement

### Comptes de Test

```
Infirmier:
Email: infirmier@ministere.gov
Password: password123

Personnel:
Email: personnel@ministere.gov
Password: password123
```

## 📁 Structure du Projet

```
infirmerie-pwa/
├── public/              # Assets statiques
├── src/
│   ├── components/      # Composants React
│   │   ├── ui/          # Composants UI (Shadcn)
│   │   ├── auth/        # Authentification
│   │   ├── layout/      # Layout (Header, Sidebar, etc.)
│   │   └── ...          # Modules métier
│   ├── pages/           # Pages routes
│   ├── lib/
│   │   ├── api/         # API clients
│   │   ├── hooks/       # Custom hooks
│   │   ├── stores/      # Zustand stores
│   │   ├── types/       # Types TypeScript
│   │   └── utils/       # Utilitaires
│   ├── workers/         # Service Workers (PWA)
│   ├── App.tsx          # App principale
│   └── main.tsx         # Point d'entrée
├── .env.development     # Variables d'environnement dev
├── .env.production      # Variables d'environnement prod
├── vite.config.ts       # Configuration Vite
├── tsconfig.json        # Configuration TypeScript
└── tailwind.config.js   # Configuration Tailwind
```

## 🌐 API Backend

L'application se connecte à l'API REST backend:
- **URL:** https://infirmerie-api.onrender.com
- **Documentation:** https://infirmerie-api.onrender.com/api/docs

## 🎨 Design System

L'application utilise Shadcn/ui pour les composants UI avec Tailwind CSS v4 pour le styling.

### Thème
- Mode clair/sombre supporté
- Variables CSS personnalisables
- Design responsive (mobile-first)

### Composants Disponibles
- Button, Input, Label, Card
- Plus de composants à ajouter selon les besoins

## 🔧 Configuration

### Variables d'Environnement

```env
VITE_API_BASE_URL=https://infirmerie-api.onrender.com
```

### TypeScript

Le projet utilise TypeScript en mode strict avec:
- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `verbatimModuleSyntax: true`

### ESLint & Prettier

Configuration stricte pour assurer la qualité du code:
- ESLint avec TypeScript
- Prettier pour le formatage
- Pre-commit hooks (à configurer)

## 📱 PWA (À venir - Sprint 6)

Le projet sera transformé en PWA avec:
- Service Workers pour le cache
- Mode offline complet avec IndexedDB
- Synchronisation bidirectionnelle
- Installation sur mobile/desktop

## 🧪 Tests (À venir)

- Tests unitaires avec Vitest
- Tests composants avec Testing Library
- Tests E2E avec Playwright (optionnel)

## 📄 Documentation

- [Plan de développement complet](../PLAN_FRONTEND_PWA_INFIRMERIE.md)
- [Suivi Sprint 0](../SPRINT0_PROGRESS.md)

## 🤝 Contribution

Ce projet est développé en solo. Pour toute question ou suggestion, consulter la documentation ou créer une issue.

## 📝 License

Propriété du Ministère - Usage interne uniquement

---

**Développé avec ❤️ pour le Ministère**
