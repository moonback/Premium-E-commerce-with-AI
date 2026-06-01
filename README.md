# 🛍️ Véridian - E-commerce Premium avec IA

## Pitch

**Véridian** est une plateforme e-commerce premium full-stack construite avec React, TypeScript et Supabase. Elle offre une expérience d'achat moderne avec recommandations IA (Google Gemini), gestion avancée des commandes, programme de fidélité gamifié, et interface d'administration complète. Conçue pour les boutiques haut de gamme recherchant une solution professionnelle, scalable et sécurisée avec paiements Stripe intégrés.

**Public cible** : Boutiques premium, marques de luxe, retailers omnicanal nécessitant une plateforme e-commerce moderne avec IA, multi-rôles (client, staff, admin, kiosk) et expérience utilisateur exceptionnelle.

---

## 📊 Badges

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Version](https://img.shields.io/badge/version-1.0.0-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![React](https://img.shields.io/badge/React-19.0-61dafb)
![Supabase](https://img.shields.io/badge/Supabase-2.106-3ecf8e)

---

## 🛠️ Stack Technique

| Technologie | Rôle | Version |
|-------------|------|---------|
| **React** | Framework UI | 19.0.1 |
| **TypeScript** | Langage | 5.8.2 |
| **Vite** | Build tool & dev server | 6.2.3 |
| **Tailwind CSS** | Styling | 4.1.14 |
| **Framer Motion** | Animations | 12.23.24 |
| **Zustand** | State management | 5.0.13 |
| **React Router** | Routing | 7.15.1 |
| **Supabase** | Backend (PostgreSQL + Auth + Storage) | 2.106.2 |
| **Express** | Server HTTP/WebSocket | 4.21.2 |
| **Stripe** | Paiements | API v2024 |
| **Google Gemini** | IA recommandations | 2.4.0 |
| **Lucide React** | Icônes | 0.546.0 |
| **React Hot Toast** | Notifications | 2.6.0 |

---

## ✨ Fonctionnalités Principales

### 🛒 **Expérience Client**
- **Catalogue produits** avec filtres avancés, recherche, catégories hiérarchiques
- **Fiches produits enrichies** : galerie photos, spécifications, avis clients, recommandations IA
- **Panier intelligent** avec sauvegarde automatique et codes promo
- **Checkout optimisé** : paiement Stripe (cartes, Apple Pay, Google Pay), Click & Collect
- **Wishlist** synchronisée avec compte utilisateur
- **Programme de fidélité** : points, paliers (Bronze/Silver/Gold/Platinum), récompenses
- **Avis produits** avec modération admin
- **Notifications temps réel** : commandes, promotions, stock
- **PWA** : installation, mode offline, notifications push

### 👤 **Espace Utilisateur**
- **Authentification** Supabase (email/password, OAuth)
- **Profil complet** : informations personnelles, adresses multiples
- **Historique commandes** avec suivi détaillé
- **Gestion wishlist** et favoris
- **Tableau de bord fidélité** : points, palier, avantages
- **Paramètres** : préférences, notifications, sécurité (2FA)

### 🎯 **Administration**
- **Dashboard analytics** : CA, commandes, clients, KPIs temps réel
- **Gestion produits** : CRUD complet, stock, catégories, images
- **Gestion commandes** : statuts, suivi, facturation
- **Gestion clients** : profils, historique, segmentation
- **Codes promo** : création, règles, validité
- **Modération avis** : publication, suppression
- **Logs d'activité** : audit trail complet
- **Paramètres système** : configuration globale

### 🏪 **Point de Vente (POS)**
- **Interface caisse** optimisée tactile
- **Scan produits** rapide
- **Paiements multiples** : espèces, carte, mobile
- **Tickets de caisse** imprimables
- **Gestion stock** temps réel

### 📺 **Écran Magasin (Kiosk)**
- **Affichage produits** en boucle
- **Promotions** dynamiques
- **Mode autonome** sans interaction

### 🤖 **Intelligence Artificielle**
- **Recommandations produits** personnalisées (Google Gemini)
- **Assistant vocal** pour navigation
- **Analyse comportementale** pour suggestions
- **Chatbot** support client (à venir)

### 🔒 **Sécurité & Conformité**
- **Row Level Security (RLS)** Supabase sur toutes les tables
- **Authentification JWT** avec refresh tokens
- **Rôles utilisateurs** : admin, staff, kiosk, customer
- **Chiffrement** des données sensibles
- **Audit logs** complets
- **RGPD** : export données, droit à l'oubli
- **PCI DSS** : tokenisation Stripe

---

## 📋 Prérequis

### Versions minimales
- **Node.js** : ≥ 18.0.0
- **npm** : ≥ 9.0.0
- **Git** : ≥ 2.30.0

### Comptes requis
- **Supabase** : [supabase.com](https://supabase.com) (gratuit)
- **Stripe** : [stripe.com](https://stripe.com) (mode test gratuit)
- **Google AI Studio** : [aistudio.google.com](https://aistudio.google.com) (API Gemini gratuite)

### Outils recommandés
- **VS Code** avec extensions : ESLint, Prettier, Tailwind CSS IntelliSense
- **Postman** ou **Insomnia** pour tester l'API
- **Supabase CLI** : `npm install -g supabase` (optionnel)

---

## 🚀 Installation

### 1. Cloner le repository
```bash
git clone https://github.com/votre-username/veridian-ecommerce.git
cd veridian-ecommerce
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer Supabase

#### a. Créer un projet Supabase
1. Aller sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Noter l'URL et la clé anonyme (Settings → API)

#### b. Exécuter les migrations
```bash
# Copier les fichiers SQL depuis supabase/migrations/
# Les exécuter dans l'ordre dans le SQL Editor de Supabase
```

**Ordre des migrations** :
1. `20260627_create_orders.sql`
2. `20260628_harden_profiles_roles.sql`
3. `20260629_restrict_sensitive_commerce_tables.sql`
4. `20260629_secure_sensitive_tables.sql`
5. `20260630_add_stripe_payment_reconciliation.sql`
6. `20260701_add_wishlist_and_reviews.sql`
7. `20260701_fix_discounts_schema.sql`
8. `20260702_add_discounts_table.sql`
9. `create_addresses_table.sql`
10. `20260531_add_image_url_to_categories.sql`

### 4. Configurer Stripe

1. Créer un compte sur [stripe.com](https://stripe.com)
2. Activer le mode test
3. Récupérer les clés API (Developers → API keys)
4. Configurer le webhook :
   - URL : `https://votre-domaine.com/api/stripe/webhook`
   - Événements : `payment_intent.succeeded`, `payment_intent.payment_failed`

### 5. Configurer Google Gemini

1. Aller sur [aistudio.google.com](https://aistudio.google.com)
2. Créer une clé API
3. Activer l'API Gemini

### 6. Configuration des variables d'environnement

Copier `.env.example` vers `.env` et `.env.local` :

```bash
cp .env.example .env
cp .env.example .env.local
```

Éditer les fichiers avec vos valeurs (voir section Configuration ci-dessous).

---

## ⚙️ Configuration

### Variables d'environnement

| Variable | Description | Exemple | Obligatoire |
|----------|-------------|---------|-------------|
| `VITE_SUPABASE_URL` | URL du projet Supabase | `https://xxx.supabase.co` | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme Supabase (client) | `eyJhbGc...` | ✅ |
| `SUPABASE_URL` | URL Supabase (serveur) | `https://xxx.supabase.co` | ✅ |
| `SUPABASE_ANON_KEY` | Clé anonyme Supabase (serveur) | `eyJhbGc...` | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role (admin) | `eyJhbGc...` | ✅ |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe | `pk_test_...` | ✅ |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe | `sk_test_...` | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe | `whsec_...` | ✅ |
| `GEMINI_API_KEY` | Clé API Google Gemini | `AIza...` | ✅ |
| `APP_URL` | URL de l'application | `http://localhost:5173` | ✅ |

> ⚠️ **Sécurité** : Ne jamais committer les fichiers `.env` ou `.env.local`. Ils sont dans `.gitignore`.

---

## 🎬 Lancement

### Mode Développement

```bash
npm run dev
```

L'application sera accessible sur :
- **Frontend** : http://localhost:5173
- **Backend** : http://localhost:3000
- **WebSocket** : ws://localhost:3000

### Mode Production

#### 1. Build
```bash
npm run build
```

#### 2. Démarrer le serveur
```bash
npm start
```

L'application sera accessible sur le port configuré (défaut : 3000).

### Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Démarre le serveur de développement |
| `npm run build` | Build pour production |
| `npm start` | Démarre le serveur de production |
| `npm run lint` | Vérifie les erreurs TypeScript |
| `npm test` | Lance les tests unitaires |
| `npm run clean` | Nettoie le dossier dist |

---

## 📁 Structure du Projet

```
veridian-ecommerce/
├── public/                    # Assets statiques
│   ├── icons/                # Icônes PWA
│   ├── screenshots/          # Screenshots pour PWA
│   ├── manifest.json         # Manifest PWA
│   ├── sw.js                 # Service Worker
│   └── robots.txt            # SEO
├── src/
│   ├── components/           # Composants React réutilisables
│   │   ├── ui/              # Composants UI de base
│   │   ├── ProductCard.tsx  # Carte produit
│   │   ├── Header.tsx       # En-tête navigation
│   │   ├── Cart.tsx         # Panier
│   │   └── ...
│   ├── pages/               # Pages/Routes principales
│   │   ├── StoreFront.tsx   # Page d'accueil boutique
│   │   ├── ProductDetail.tsx # Détail produit
│   │   ├── Checkout.tsx     # Tunnel d'achat
│   │   ├── Profile.tsx      # Profil utilisateur
│   │   ├── Admin.tsx        # Dashboard admin
│   │   ├── POS.tsx          # Point de vente
│   │   └── StoreScreen.tsx  # Écran magasin
│   ├── services/            # Services métier
│   │   ├── checkoutService.ts    # Logique checkout
│   │   ├── paymentSecurity.ts    # Sécurité paiements
│   │   └── ...
│   ├── hooks/               # Custom React hooks
│   │   ├── usePWA.ts        # Hook PWA
│   │   ├── useReducedMotion.ts
│   │   └── ...
│   ├── lib/                 # Utilitaires & helpers
│   │   ├── supabase.ts      # Client Supabase
│   │   ├── stripe.ts        # Client Stripe
│   │   ├── seo.ts           # Helpers SEO
│   │   └── utils.ts         # Utilitaires généraux
│   ├── styles/              # Styles globaux
│   │   └── index.css        # CSS principal
│   ├── App.tsx              # Composant racine
│   ├── main.tsx             # Point d'entrée React
│   ├── store.ts             # Store Zustand global
│   └── types.ts             # Types TypeScript
├── supabase/
│   ├── migrations/          # Migrations SQL
│   └── backup.sql           # Backup schéma
├── scripts/                 # Scripts utilitaires
│   ├── generate-icons.mjs   # Génération icônes PWA
│   └── validate-migrations.mjs
├── docs/                    # Documentation
├── server.ts                # Serveur Express + WebSocket
├── vite.config.ts           # Configuration Vite
├── tsconfig.json            # Configuration TypeScript
├── tailwind.config.js       # Configuration Tailwind
├── package.json             # Dépendances npm
└── README.md                # Ce fichier
```

---

## 🤝 Contribuer

Nous accueillons les contributions ! Consultez [CONTRIBUTING.md](./CONTRIBUTING.md) pour :
- Workflow Git (branches, commits, PR)
- Standards de code
- Processus de review
- Comment lancer les tests

---

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](./LICENSE) pour plus de détails.

---

## 📚 Documentation Complémentaire

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture système détaillée
- [API_DOCS.md](./API_DOCS.md) - Documentation API complète
- [DB_SCHEMA.md](./DB_SCHEMA.md) - Schéma de base de données
- [ROADMAP.md](./ROADMAP.md) - Feuille de route produit
- [CHANGELOG.md](./CHANGELOG.md) - Historique des versions

---

## 🆘 Support

- **Issues** : [GitHub Issues](https://github.com/votre-username/veridian-ecommerce/issues)
- **Discussions** : [GitHub Discussions](https://github.com/votre-username/veridian-ecommerce/discussions)
- **Email** : support@veridian.com

---

## 🙏 Remerciements

- [Supabase](https://supabase.com) pour le backend
- [Stripe](https://stripe.com) pour les paiements
- [Google](https://ai.google.dev) pour l'API Gemini
- [Unsplash](https://unsplash.com) pour les images
- La communauté open-source

---

**Fait avec ❤️ par l'équipe Véridian**
