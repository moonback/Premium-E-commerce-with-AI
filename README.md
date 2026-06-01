# Véridian — Premium E-commerce with AI

Boutique e-commerce premium full-stack avec assistante vocale IA, recherche sémantique pgvector, et back-office complet. Construit sur React 19, Express, Supabase et Gemini AI.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS v4, Motion |
| Routing | React Router v7 |
| State | Zustand v5 (persist) |
| Backend | Express 4 + Node.js (tsx) |
| Base de données | Supabase (PostgreSQL + pgvector) |
| Auth | Supabase Auth (JWT) |
| IA vocale | Gemini Live API (`gemini-3.1-flash-live-preview`) via WebSocket |
| Embeddings | Gemini REST API (`gemini-embedding-2`, 3072 dims) |
| Paiement | Stripe (Payment Intents) |
| Build | Vite 6 + esbuild |
| PWA | Service Worker, manifest, install prompt |

---

## Fonctionnalités

### Vitrine client
- Catalogue produits avec filtres avancés, recherche, comparaison
- Fiches produit détaillées avec avis, badges, promotions
- Panier persistant, codes de réduction, barre livraison gratuite
- Checkout multi-étapes (livraison + paiement Stripe)
- Confirmation de commande, historique profil
- Wishlist serveur, carnet d'adresses
- Mega menu configurable, navigation mobile
- Pages légales (CGV, mentions légales, livraison, contact)
- SEO : balises meta, Open Graph, sitemap XML dynamique, robots.txt
- PWA : installable, mode hors-ligne, Service Worker

### Assistante vocale Ava
- Conversation vocale temps réel via Gemini Live (WebSocket)
- Voix féminine naturelle (`Aoede`, 24 kHz)
- Mode texte en fallback (si micro refusé)
- Ajout au panier par la voix (`addToCart` function calling)
- Suggestions rapides, confirmation visuelle panier
- **Skills automatiques** : détection par mots-clés, injection contextuelle dynamique
- **Recherche sémantique** : pgvector enrichit le contexte Ava à chaque message
- Prompt système chargé depuis `prompts/ava-system.md`
- Rate limiting par IP (5 sessions/10 min, 2 simultanées max)

### Back-office admin
- Dashboard KPIs temps réel (ventes, commandes, clients)
- Gestion produits : CRUD, upload image, badges, promotions, lots
- **Vectorisation IA** : panneau de suivi avec barre de progression par produit
- Gestion catégories avec arborescence
- Mega Menu builder visuel
- Gestion commandes avec statuts
- Gestion clients et profils
- Codes de réduction et promotions
- Transporteurs et règles de livraison
- Analyse des marges
- Journal d'activité
- Paramètres boutique complets (SEO, paiement, notifications, réseaux sociaux)
- Mode maintenance

### Modes d'accès
| Route | Rôle requis | Description |
|---|---|---|
| `/` | Public | Vitrine |
| `/product/:id` | Public | Fiche produit |
| `/checkout` | Public | Tunnel d'achat |
| `/profile` | `customer`+ | Profil & commandes |
| `/admin` | `admin` | Back-office complet |
| `/pos` | `staff`, `admin` | Point de vente |
| `/screen` | `kiosk`, `admin` | Écran kiosque |

---

## Architecture

```
├── server.ts              # Serveur Express + WebSocket Gemini Live
├── src/
│   ├── App.tsx            # Routing, lazy loading, init session
│   ├── store.ts           # État global Zustand
│   ├── types.ts           # Types TypeScript partagés
│   ├── pages/             # Pages (StoreFront, Admin, Checkout, Profile…)
│   ├── components/        # Composants UI
│   │   ├── admin/         # Composants back-office
│   │   └── ui/            # Design system (Button, Dialog, Input…)
│   ├── lib/
│   │   ├── supabase.ts    # Client Supabase browser
│   │   ├── embeddingService.ts  # Vectorisation + recherche sémantique
│   │   ├── skillsEngine.ts      # Moteur de skills Ava
│   │   ├── seo.ts         # Helpers SEO
│   │   ├── promotions.ts  # Logique promotions
│   │   └── utils.ts       # Utilitaires
│   ├── services/
│   │   ├── checkoutService.ts   # Création commandes
│   │   └── paymentSecurity.ts   # Validation paiements Stripe
│   ├── hooks/
│   │   ├── usePWA.ts
│   │   ├── useShippingCarriers.ts
│   │   └── useStoreSettings.ts
│   └── styles/tokens/     # Design tokens (couleurs, typo, motion)
├── prompts/
│   ├── ava-system.md      # Prompt système d'Ava
│   └── skills/            # Skills auto-déclenchés par mots-clés
│       ├── recommandation.md
│       ├── panier.md
│       ├── prix.md
│       ├── stock.md
│       └── description.md
└── supabase/migrations/   # Migrations SQL versionnées
```

---

## API Routes

### Paiement
| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/payments/create-intent` | Crée un Stripe PaymentIntent |
| `POST` | `/api/payments/webhook` | Webhook Stripe (réconciliation) |

### Produits & Vectorisation
| Méthode | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/products/vectorize` | Admin | Vectorise tout le catalogue |
| `POST` | `/api/products/:id/vectorize` | Admin | Vectorise un produit |
| `GET` | `/api/products/search?q=...` | Connecté | Recherche sémantique |

### Système
| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/health` | Statut serveur + dépendances |
| `POST` | `/api/events` | Tracking événements e-commerce |
| `GET` | `/sitemap.xml` | Sitemap dynamique |
| `GET` | `/robots.txt` | Robots |
| `WS` | `/live` | Session vocale Gemini Live |

---

## Schéma base de données

### Tables principales
| Table | Description |
|---|---|
| `products` | Catalogue avec `embedding vector(3072)` |
| `categories` | Arborescence catégories |
| `orders` | Commandes clients |
| `order_items` | Lignes de commande |
| `profiles` | Profils utilisateurs (rôles) |
| `addresses` | Carnet d'adresses |
| `payments` | Paiements Stripe |
| `shipments` | Expéditions |
| `discounts` | Codes de réduction |
| `wishlist_items` | Favoris |
| `product_reviews` | Avis produits |
| `shipping_carriers` | Transporteurs |
| `store_settings` | Paramètres boutique |
| `mega_menu_items` | Navigation mega menu |
| `events` | Tracking comportemental |
| `ai_conversations` | Historique sessions Ava |
| `audit_events` | Journal d'audit |

### Fonction SQL
```sql
match_products(query_embedding vector(3072), match_threshold float, match_count int, filter_in_stock boolean)
-- Recherche ANN via index HNSW (cosinus)
```

---

## Variables d'environnement

Copier `.env.example` en `.env` et renseigner :

```env
# Gemini AI (obligatoire)
GEMINI_API_KEY=AIza...

# Supabase (obligatoire)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...

# Stripe (optionnel — requis pour les paiements réels)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase Service Role (optionnel — améliore la vectorisation)
# Dashboard → Settings → API → service_role
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Divers
APP_URL=https://votre-domaine.com
```

---

## Installation & démarrage

```bash
# Installer les dépendances
npm install

# Développement (Express + Vite en un seul process)
npm run dev

# Build production
npm run build

# Démarrer en production
npm start

# Vérification TypeScript
npm run lint

# Tests
npm test
```

> En développement, le serveur Express tourne sur le port **3000** et Vite proxifie automatiquement `/api` et `/live` vers lui.

---

## Migrations Supabase

Appliquer dans l'ordre depuis le **SQL Editor** de Supabase Dashboard :

```
supabase/migrations/
├── create_addresses_table.sql
├── 20260531_add_image_url_to_categories.sql
├── 20260601_create_mega_menu_tables.sql
├── 20260627_create_orders.sql
├── 20260628_harden_profiles_roles.sql
├── 20260629_restrict_sensitive_commerce_tables.sql
├── 20260629_secure_sensitive_tables.sql
├── 20260630_add_stripe_payment_reconciliation.sql
├── 20260701_add_wishlist_and_reviews.sql
├── 20260701_fix_discounts_schema.sql
├── 20260702_add_discounts_table.sql
├── 20260702_add_pgvector_products.sql       ← Active pgvector, vector(3072), index HNSW
└── 20260702_allow_admin_update_embedding.sql ← RLS pour la vectorisation sans service_role
```

> La migration `add_pgvector_products` nécessite l'extension `vector` activée dans Supabase (disponible par défaut sur tous les projets Supabase).

---

## Système de Skills Ava

Les skills sont des fichiers Markdown dans `prompts/skills/` avec un frontmatter YAML. Ils s'activent automatiquement selon les mots-clés du message client.

```markdown
---
name: recommandation
triggers: [recommande, conseil, cadeau, meilleur]
priority: 1
---
# Instructions contextuelles pour ce skill...
```

**Skills inclus :**
- `recommandation` — conseils produits, cadeaux
- `panier` — ajout, gestion du panier
- `prix` — budget, promotions, comparaison de prix
- `stock` — disponibilité, délais
- `description` — détails produit, composition

Pour ajouter un skill : créer un fichier `.md` dans `prompts/skills/` — aucune modification du code nécessaire.

---

## Vectorisation pgvector

1. Appliquer les migrations `20260702_*.sql`
2. Aller dans **Admin → Produits**
3. Cliquer sur le panneau **"Vectorisation IA"** (en haut de la liste)
4. Cliquer **"Vectoriser les nouveaux produits"**

Ava utilise automatiquement la recherche sémantique dès que les embeddings sont générés. Si pgvector n'est pas encore configuré, Ava continue de fonctionner normalement avec le catalogue brut.

**Modèle :** `gemini-embedding-2` · **Dimensions :** 3072 · **Index :** HNSW cosinus

---

## Rôles utilisateurs

| Rôle | Accès |
|---|---|
| `customer` | Vitrine, profil, commandes |
| `staff` | + POS (point de vente) |
| `kiosk` | Écran kiosque |
| `admin` | Tout + back-office complet |

Les rôles sont assignés côté serveur uniquement (table `profiles`, colonne `role`). Un nouveau compte est toujours créé avec le rôle `customer`.

---

## PWA

L'application est installable sur mobile et desktop. Elle fonctionne hors-ligne pour la navigation de base grâce au Service Worker (`public/sw.js`).

---

## Licence

Projet privé — tous droits réservés.
