# Audit complet Véridian — e-commerce IA-first

_Date d'audit : 31 mai 2026. Périmètre : React 19 + Vite + TypeScript, Zustand, Supabase, Express/WebSocket, Gemini Live, routes client/POS/admin/screen._

## 1. Synthèse exécutive

### Verdict global

Véridian possède une base visuelle premium et une ambition omnicanale rare pour un MVP : boutique, checkout, profil, POS, écran magasin, admin et assistant vocal IA. Le produit n'est toutefois pas encore au niveau Apple/Stripe/Shopify/Linear/Snapchat/Airbnb, car les fondations critiques e-commerce, sécurité, data, SEO, accessibilité et fiabilité transactionnelle sont incomplètes.

### Scores globaux

| Axe | Score | Diagnostic |
| --- | ---: | --- |
| UX globale | 62/100 | Belle direction éditoriale, mais navigation incomplète, feedback transactionnel limité, parcours mobile non natif, checkout trop fragile. |
| UI globale | 72/100 | Identité cohérente, typographies premium, mais composants hétérogènes, densité admin élevée, absence de design system strict. |
| Technique | 48/100 | TypeScript échoue, routes limitées, état global monolithique, absence de tests, schéma DB partiel, RLS permissive sur commandes. |
| Conversion | 39/100 | Pas d'avis, bundles, promo, livraison gratuite dynamique, recommandations, relance panier, tracking funnel, moyens de paiement réels. |
| Mobile | 45/100 | Responsive basique, mais pas de bottom navigation, gestures, haptics, sticky checkout mobile ou native-feeling. |
| Sécurité | 35/100 | RLS commandes ouverte dans une migration, rôle admin dérivé de l'email côté logique profil, WebSocket IA sans auth/rate limit. |
| SEO | 30/100 | SPA sans meta par produit, pas de structured data, pas de sitemap, pas de blog/landing pages, images distantes non optimisées. |
| Performance | 52/100 | App petite, mais images Unsplash directes, polling admin, aucune pagination, pas de lazy routes, pas de cache serveur. |

### Top 10 priorités absolues

| Priorité | Recommandation | Pourquoi | Impact business | Impact utilisateur | Difficulté |
| --- | --- | --- | --- | --- | --- |
| P0 | Corriger TypeScript et stabiliser le build | `npm run lint` échoue sur `AddressBook` ; impossible d'industrialiser CI/CD. | Évite régressions et blocages de déploiement. | Moins de bugs profil/adresse. | Faible |
| P0 | Sécuriser Supabase RLS commandes/profils | Une migration autorise SELECT/INSERT/UPDATE commandes à tous. | Réduit risque fuite données et fraude. | Confiance, conformité. | Moyen |
| P0 | Persister les `order_items` au checkout | `checkout()` crée une commande mais pas les lignes panier. | Rend fulfillment, analytics, retours et support possibles. | Commande traçable. | Moyen |
| P0 | Remplacer le CTA hero `/storefront` inexistant | La route n'existe pas ; le CTA principal mène à une impasse. | Évite perte de conversion sur le premier clic. | Parcours clair. | Très faible |
| P1 | Refondre checkout mobile sticky en 3 étapes | Le checkout actuel manque de livraison, paiement réel, récap sticky et erreurs robustes. | Hausse conversion mobile. | Moins de friction. | Moyen |
| P1 | Ajouter SEO produit + JSON-LD + sitemap | Les pages produits sont invisibles pour Google Shopping/SEO. | Acquisition organique. | Découverte produit. | Moyen |
| P1 | Créer design system tokens/composants | UI premium mais non systématisée. | Vitesse feature, cohérence marque. | Expérience plus fiable. | Moyen |
| P1 | Ajouter wishlist, avis, recommandations IA | Fonctionnalités attendues d'un e-commerce moderne. | Augmente AOV, retour client, confiance. | Meilleure décision achat. | Moyen |
| P1 | Authentifier/rate-limiter le WebSocket IA | Le pont `/live` peut coûter cher et être abusé. | Contrôle coût IA et sécurité. | IA plus fiable. | Moyen |
| P2 | Découper architecture par features | Pages/components/store sont plats et couplés. | Scalabilité équipe/produit. | Livraison plus rapide. | Élevé |

---

## 2. Architecture actuelle

### Structure observée

```txt
src/
  App.tsx
  main.tsx
  index.css
  store.ts
  types.ts
  lib/
    supabase.ts
    utils.ts
  pages/
    Admin.tsx
    Checkout.tsx
    POS.tsx
    ProductDetail.tsx
    Profile.tsx
    StoreFront.tsx
    StoreScreen.tsx
  components/
    AccordionItem.tsx
    AddressBook.tsx
    AdminOrders.tsx
    AdminOrdersList.tsx
    AuthModal.tsx
    CartDrawer.tsx
    CartReview.tsx
    CheckoutStepper.tsx
    ClientDeliveryForm.tsx
    Footer.tsx
    Header.tsx
    KitchenOrders.tsx
    PageTransition.tsx
    PaymentForm.tsx
    ProductCard.tsx
    ProductCardSkeleton.tsx
    ProfileInfo.tsx
    ProtectedRoute.tsx
    StoreLayout.tsx
    VoiceAssistant.tsx
server.ts
supabase/
  migrations/
  backup.sql
```

### Diagnostic architecture

| Sujet | État actuel | Problème | Recommandation | Priorité |
| --- | --- | --- | --- | --- |
| Routing | Routes déclarées dans `App.tsx` uniquement. | Pas de lazy loading, pas de 404, pas de route dédiée admin sous-pages. | `routes/` centralisé + lazy imports + route guards + NotFound. | P1 |
| State | `store.ts` centralise panier, auth, produits, catégories, checkout, adresses, commandes. | Store monolithique, difficile à tester et à optimiser. | Slices Zustand : `cartSlice`, `authSlice`, `catalogSlice`, `checkoutSlice`, `uiSlice`. | P1 |
| Data access | Appelle Supabase directement depuis pages/store/composants. | Couplage UI/data, duplications, erreurs non normalisées. | `services/` ou `repositories/` typés : catalog, orders, profiles, addresses. | P1 |
| Admin | `Admin.tsx` fait 569 lignes avec stats, produits, catégories, UI. | Composant trop gros, logique métier non isolée. | Découper en `AdminOverview`, `ProductManager`, `CategoryManager`, `AnalyticsPanel`. | P1 |
| Backend | Express sert santé, Vite et WebSocket IA. | Pas d'auth, rate limit, logs structurés, validation, metrics. | API server avec middleware auth, validation Zod, observabilité. | P0/P1 |
| DB | Migrations partielles + backup divergent. | `orders` peut être détruite par migration, RLS inconsistante, order_items non utilisé côté checkout. | Migrations idempotentes, versionnées, testées, RLS stricte. | P0 |
| Types | Types manuels. | Divergence possible avec Supabase. | Générer types Supabase (`database.types.ts`) et mapper domaine. | P1 |
| Tests | Aucun test automatisé détecté. | Risque de régression élevé. | Vitest + Testing Library + Playwright checkout. | P1 |

---

## 3. Analyse des routes existantes

Routes déclarées : `/`, `/product/:id`, `/checkout`, `/profile`, `/pos`, `/admin`, `/screen`.

| Route | Rôle | Objectif | Problèmes détectés | Améliorations | Priorité |
| --- | --- | --- | --- | --- | --- |
| `/` | Client | Landing + catalogue. | CTA hero pointe vers `/storefront`, route inexistante ; filtres limités au niveau 1 ; recherche uniquement nom/effects ; pas de SEO dynamique. | CTA vers `#catalogue` ou `/collections`; recherche IA/facettes; sections trust, best-sellers, avis; structured data. | P0 |
| `/product/:id` | Client | Détail produit, découverte, ajout panier. | Pas d'avis, stock/variantes faibles, meta SEO absentes, recommandations faibles, image non optimisée. | Galerie, variantes, disponibilité, livraison/retour, reviews, upsell, JSON-LD Product. | P1 |
| `/checkout` | Client | Conversion panier -> commande. | Pas de paiement réel, pas de lignes commande, validation incomplète, pas de guest checkout cadré, peu de garanties. | Checkout 1 page mobile-first, Stripe/Adyen, order_items, anti-fraude, emails transactionnels. | P0 |
| `/profile` | Client protégé | Compte, profil, adresses, commandes. | Build TS cassé sur `AddressBook`, données profil/adresses dupliquées, pas de préférences marketing. | Typage strict, onglets compte, retours, remboursements, fidélité, consentements. | P0 |
| `/pos` | Staff | Vente magasin. | Non protégé par rôle admin/staff, mélange panier global client, pas de paiement/receipt réels. | Route protégée `staff|admin`, panier POS séparé, tickets, remises, scan code-barres. | P0 |
| `/admin` | Admin | Pilotage boutique. | Protégé admin mais backend/RLS doivent confirmer ; stats par polling toutes les 10s ; page monolithique. | Sous-routes `/admin/products`, `/admin/orders`, `/admin/customers`, `/admin/analytics`. | P1 |
| `/screen` | Public écran magasin | Digital signage. | Non protégé, dépend catalogue chargé côté client, pas de fallback si produits vides. | Mode kiosk tokenisé, playlist média, cache offline, planning par magasin. | P2 |

### Routes manquantes critiques

| Route cible | Pourquoi | Impact | Priorité |
| --- | --- | --- | --- |
| `/collections/:slug` | SEO + merchandising par collection. | Acquisition et navigation. | P1 |
| `/search` | Recherche dédiée avec filtres. | Conversion catalogue. | P1 |
| `/cart` | Panier partageable/fallback drawer. | Conversion et SEO non concerné. | P2 |
| `/wishlist` | Intention d'achat. | Rétention, relance. | P1 |
| `/orders/:id` | Suivi commande. | Support réduit. | P1 |
| `/blog`, `/blog/:slug` | Acquisition SEO. | Trafic organique. | P2 |
| `/landing/:slug` | Campagnes ads/influence. | CAC plus bas. | P2 |
| `/admin/products`, `/admin/orders`, `/admin/customers`, `/admin/analytics`, `/admin/marketing`, `/admin/settings` | Scalabilité admin. | Productivité ops. | P1 |
| `/api/webhooks/stripe`, `/api/recommendations`, `/api/search`, `/api/assistant/session` | Backend de production. | Paiement, IA, analytics. | P0/P1 |

---

## 4. Audit page par page

### 4.1 Accueil/catalogue `/` — `StoreFront.tsx`

Scores : UX 68, UI 78, Technique 58, Conversion 45, Mobile 55.

| Axe | Observations | Recommandations |
| --- | --- | --- |
| Bugs | Le CTA principal `Découvrir` pointe vers `/storefront`, qui n'est pas déclaré. | Remplacer par ancre `#catalogue`, `/collections/all` ou scroll programmatique. |
| UX | Le hero est immersif mais n'explique pas immédiatement bénéfices, livraison, preuves sociales. | Ajouter barre USP : livraison, retours, qualité, support IA. |
| UI | Direction premium claire : serif, grandes images, espace. | Ajouter grille éditoriale plus riche : cards “curated by Ava”, stories, collections. |
| Responsive | Catégories en horizontal scroll, correct mais sans affordance. | Ajouter gradients de débordement, snap, chips tactiles 44px min. |
| Accessibilité | Background image en CSS sans alternative ; CTA peu descriptif ; pas de landmarks catalogues. | Ajouter `aria-label`, titre section catalogue, textes alternatifs via images réelles quand informatives. |
| SEO | SPA hero/catalogue sans H2 riches, pas de metadata. | React Helmet/SSR ou prerender, title/description, JSON-LD ItemList. |
| Performance | Image Unsplash CSS non dimensionnée/optimisée. | CDN images, responsive `srcset`, blur placeholder. |

### 4.2 Produit `/product/:id` — `ProductDetail.tsx`

Scores : UX 64, UI 76, Technique 54, Conversion 43, Mobile 50.

| Axe | Observations | Recommandations |
| --- | --- | --- |
| Bugs | Risque si produit absent/chargement : l'expérience dépend fortement du store client. | États loading/not found robustes + fallback fetch direct par id. |
| UX | Présentation éditoriale, accordéons utiles. | Ajouter “Pourquoi l'acheter”, livraison estimée, disponibilité, retours, garanties, guide taille/usage. |
| UI | Esthétique premium mais manque de composants transactionnels Shopify-like. | Ajouter sticky ATC, badges stock, recommandations, bundle. |
| Conversion | Pas d'avis, pas de quantité persistante claire, pas d'upsell/cross-sell. | Reviews, UGC, produits similaires, bundle automatique. |
| Accessibilité | Vérifier labels boutons favoris/quantité, focus visible, alt image. | Standardiser composants interactifs accessibles. |
| SEO | Pas de meta produit ni Product schema. | JSON-LD Product/Offer/Review + OpenGraph. |

### 4.3 Checkout `/checkout` — `Checkout.tsx`

Scores : UX 55, UI 70, Technique 42, Conversion 35, Mobile 42.

| Axe | Observations | Recommandations |
| --- | --- | --- |
| Bugs | `checkout()` crée l'ordre sans créer `order_items`; le détail panier disparaît après validation. | Transaction DB RPC `create_order_with_items`. |
| UX | Stepper + récap donne une bonne structure. | Réduire à 3 blocs : Contact, Livraison, Paiement ; afficher erreurs inline. |
| Paiement | `PaymentForm` semble simulé, pas de PSP réel. | Stripe Payment Element, Apple Pay/Google Pay, webhooks. |
| Conversion | Pas de livraison gratuite progress bar, promo code, garanties, guest checkout optimisé. | Ajouter seuil livraison gratuite, coupons, badges sécurité, relance abandon. |
| Mobile | Manque total sticky summary/CTA. | Bottom sticky “Payer X€” + drawer récap. |
| Sécurité | Données client écrites côté client vers Supabase. | Valider côté serveur/RPC, audit consentement, anti-fraude. |

### 4.4 Profil `/profile` — `Profile.tsx`, `AddressBook.tsx`, `ProfileInfo.tsx`

Scores : UX 56, UI 66, Technique 35, Conversion 30, Mobile 45.

| Axe | Observations | Recommandations |
| --- | --- | --- |
| Bug bloquant | TypeScript échoue dans `AddressBook.tsx` car `useState({})` infère `{}` et les propriétés adresse sont ensuite lues. | Typer l'état formulaire `AddressFormState`. |
| UX | Profil utile mais limité à informations/adresses/commandes. | Ajouter fidélité, préférences, wishlist, retours, remboursements. |
| Data | Adresse stockée à la fois dans `profiles` et `addresses`. | Normaliser : `addresses` canonique, profile pour identité uniquement. |
| Sécurité | Politiques backup rendent profiles publiquement lisibles. | RLS : self + admin seulement. |

### 4.5 POS `/pos` — `POS.tsx`

Scores : UX 60, UI 62, Technique 45, Conversion magasin 45, Mobile/tablette 50.

| Axe | Observations | Recommandations |
| --- | --- | --- |
| Sécurité | Route non protégée. | `ProtectedRoute role="staff|admin"`; RLS/RBAC serveur. |
| UX | Interface caisse simple. | Mode tablette : gros boutons, scan, recherche instantanée, paiement split, reçu. |
| Data | Utilise probablement le même panier global que client. | Créer store POS séparé pour éviter collisions. |
| Business | Pas de taxes, remises, fermeture caisse, caisse journalière. | Ajouter cash drawer, receipts, refunds, shifts. |

### 4.6 Admin `/admin` — `Admin.tsx`, `AdminOrdersList.tsx`, `KitchenOrders.tsx`

Scores : UX 52, UI 58, Technique 38, Conversion ops 55, Mobile 25.

| Axe | Observations | Recommandations |
| --- | --- | --- |
| Technique | `Admin.tsx` fait 569 lignes et contient stats, forms, catégories, produits. | Découpage par domaine + hooks data. |
| Performance | Stats re-fetchent toutes les commandes toutes les 10s côté client. | Vues SQL/RPC agrégées, Supabase realtime ciblé. |
| Sécurité | Suppression/édition dépend de RLS, mais migration orders permissive ; POS/screen non protégés. | RBAC complet : admin, staff, customer, kiosk. |
| UX | Pas de sous-routes ; onglets internes peu profonds. | Admin IA-first : command center, tâches, alerts stock, insights. |
| Mobile | Admin desktop-only. | Assumer desktop ou créer views responsive essentielles. |

### 4.7 Screen `/screen` — `StoreScreen.tsx`

Scores : UX 70, UI 80, Technique 50, Conversion magasin 50, Mobile N/A 40.

| Axe | Observations | Recommandations |
| --- | --- | --- |
| UX | Belle expérience signage cinématique. | Ajouter planning, QR code produit, CTA “scanner pour acheter”. |
| Technique | Dépend du store products ; si vide, écran probablement fragile. | Cache offline, fallback playlist, préchargement images. |
| Sécurité | Route publique. | Kiosk token + device management. |

---

## 5. Analyse des composants

| Composant | Utilité | Qualité code | Réutilisabilité | Dette/optimisations | Note /10 |
| --- | --- | --- | --- | --- | ---: |
| `AccordionItem` | Accordéon détail produit/FAQ. | Simple. | Bonne. | Ajouter ARIA `button`, `aria-expanded`, animation hauteur accessible. | 7 |
| `AddressBook` | CRUD adresses. | Build cassé par typage état. | Moyenne. | Type form, validations, optimistic UI, adresse par défaut unique. | 3 |
| `AdminOrders` | Placeholder/wrapper très court. | Faible valeur. | Faible. | Supprimer ou fusionner avec `AdminOrdersList`. | 4 |
| `AdminOrdersList` | Liste commandes admin. | Correct. | Moyenne. | Pagination, realtime, détails order_items, filtres, skeleton. | 6 |
| `AuthModal` | Auth email/password Supabase. | Correct MVP. | Bonne. | Magic link/OAuth, erreurs inline, protection brute-force, accessibilité dialog. | 6 |
| `CartDrawer` | Panier latéral. | Important et visuel. | Bonne. | Piège focus, ESC close, stock, promo, livraison gratuite, cross-sell. | 6 |
| `CartReview` | Récap checkout. | Simple. | Bonne. | Sticky mobile, taxes/shipping, coupon, edits inline. | 6 |
| `CheckoutStepper` | Indicateur étapes. | Simple. | Moyenne. | ARIA current step, état erreur/complet, mobile compact. | 6 |
| `ClientDeliveryForm` | Formulaire livraison. | Volumineux. | Moyenne. | Schéma validation, autocompletion adresse, composants field. | 5 |
| `Footer` | Pied de page. | Minimal. | Moyenne. | SEO links, newsletter, trust, legal. | 5 |
| `Header` | Navigation/recherche/panier/auth. | Bon MVP. | Forte. | Mobile bottom bar, search overlay, focus management, debounce. | 6 |
| `KitchenOrders` | Vue préparation commandes. | Utile ops. | Moyenne. | Realtime, SLA timers, son, statuts standardisés. | 6 |
| `PageTransition` | Animation route. | Simple. | Bonne. | Respect `prefers-reduced-motion`. | 7 |
| `PaymentForm` | Paiement simulé. | MVP seulement. | Moyenne. | Stripe Payment Element, wallets, erreurs PSP. | 4 |
| `ProductCard` | Card produit catalogue. | Élément clé. | Forte. | Optimiser image, badges, wishlist accessible, quick add, analytics. | 7 |
| `ProductCardSkeleton` | Skeleton catalogue. | Correct. | Bonne. | Dimensions cohérentes avec card. | 7 |
| `ProfileInfo` | Infos compte. | Correct. | Moyenne. | Validation, consentements, sécurité compte. | 5 |
| `ProtectedRoute` | Guard role minimal. | Simple. | Bonne. | Loading auth, redirect intent, rôles multiples, serveur/RLS. | 6 |
| `StoreLayout` | Header/footer/cart layout. | Clair. | Bonne. | Skip link, landmarks, route-level layout variants. | 7 |
| `VoiceAssistant` | Widget IA vocal. | Ambitieux. | Moyenne. | Permissions micro, auth/rate limit, fallback texte, coûts, observabilité. | 6 |

---

## 6. Hooks, Zustand, Supabase, API, WebSocket, IA

### Hooks

Aucun dossier `hooks/` dédié. La logique est dispersée dans pages/composants/store.

| Hook cible | Rôle | Priorité |
| --- | --- | --- |
| `useCatalog` | Fetch produits/catégories, filtres, cache. | P1 |
| `useCart` | Sélecteurs panier optimisés, AOV, shipping threshold. | P1 |
| `useCheckout` | Orchestration checkout + validation + PSP. | P0 |
| `useOrders` | Commandes client/admin avec realtime. | P1 |
| `useVoiceAssistant` | WebSocket, audio, permissions, retry. | P1 |
| `useMediaQuery` | UX responsive et drawers. | P2 |
| `useReducedMotion` | Accessibilité animations. | P1 |

### Zustand

Problèmes principaux :

1. Store monolithique.
2. `checkout()` mélange calcul, DB write, profil, toast et reset panier.
3. Persistance uniquement `cart`/`favorites`, sans version/migration.
4. Pas de sélecteurs memo dédiés.
5. Pas de séparation panier client/POS.

Backlog :

- P0 : extraire `checkoutService.createOrder(cart, customer, delivery, payment)`.
- P1 : créer slices et tests unitaires.
- P1 : versionner la persistance Zustand.
- P1 : ajouter selectors `cartTotal`, `cartCount`, `shippingProgress`, `eligibleUpsells`.

### Supabase

Points critiques :

- Migration `20260627_create_orders.sql` supprime `orders` (`DROP TABLE`) : dangereux en prod.
- Politiques commandes permissives dans cette migration.
- Backup contient `order_items`, mais le checkout ne les écrit pas.
- `profiles` public read dans backup : fuite potentielle emails/adresses.
- Pas de tables marketing, reviews, wishlist serveur, payments, shipments, returns, coupons.

### API Express

| Élément | État | Recommandation |
| --- | --- | --- |
| `/api/health` | OK minimal. | Ajouter version, commit, uptime, dependencies. |
| Validation | Absente. | Zod/Valibot pour REST/WS payloads. |
| Auth | Absente. | Vérification JWT Supabase sur API/WS. |
| Rate limit | Absent. | `express-rate-limit`, quotas IA. |
| Logs | `console.log/error`. | Pino + request id + redaction. |
| Erreurs | Génériques. | Error middleware standard. |

### WebSocket IA / VoiceAssistant

| Risque | Pourquoi | Correction |
| --- | --- | --- |
| Coût IA non borné | Tout client peut ouvrir `/live`. | Auth optionnelle + quotas session/IP/user. |
| Modèle hardcodé | `gemini-3.1-flash-live-preview` fixé dans server. | Config env + feature flags. |
| Produits hardcodés | Function declaration liste seulement 4 ids pâtisserie, alors catalogue app est générique vêtements/accessoires/maison. | Générer contexte catalogue depuis DB, limiter tokens. |
| Pas de fermeture session | `close` ne ferme pas explicitement session. | Fermer session, cleanup timers, metrics. |
| Pas de fallback texte | Assistant vocal peut être bloqué par permission micro. | Mode chat texte visible, suggestions rapides. |

---

## 7. Sécurité

| Risque | Gravité | Détail | Remédiation |
| --- | --- | --- | --- |
| RLS commandes ouverte | Critique | Migration autorise SELECT/INSERT/UPDATE à tous. | Policies self/admin ; service role seulement côté serveur. |
| Profils lisibles publiquement | Critique | Backup contient policy `Public profiles are viewable by everyone`. | Self/admin only ; vues publiques anonymisées si besoin. |
| POS public | Élevée | `/pos` non protégé. | Role guard + RLS + staff role. |
| Screen public | Moyenne | `/screen` exposé. | Kiosk token par device. |
| Admin rôle fragile | Élevée | Création profil fallback utilise `email.includes('admin')`. | Claims/role assignés serveur uniquement. |
| WebSocket IA sans auth | Élevée | Coût, abus audio, injection. | JWT, rate limit, content filtering, audit logs. |
| Upload image | Moyenne | Validation type/taille non visible côté client. | Bucket policies, scanning, mime whitelist, resize server. |
| Données checkout | Moyenne | Écritures client directes. | RPC transactionnelle + validation serveur. |

---

## 8. Performance

| Problème | Impact | Correction | Priorité |
| --- | --- | --- | --- |
| Images distantes Unsplash non optimisées | LCP lourd, CLS possible. | Image CDN, dimensions, lazy, blurhash. | P1 |
| Pas de code splitting routes | Bundle initial plus gros à terme. | `React.lazy` par route. | P1 |
| Admin polling toutes commandes 10s | Charge DB et latence. | SQL views/RPC + realtime events. | P1 |
| Fetch produits sans pagination | Catalogue ne scale pas. | Pagination/infinite scroll/search index. | P1 |
| Pas de cache query | Refetchs et états manuels. | TanStack Query ou cache service. | P1 |
| Animations sans reduced motion global | Accessibilité + perf. | `prefers-reduced-motion`. | P1 |

---

## 9. SEO

Manques :

- Titles/descriptions par route.
- Canonical URLs.
- OpenGraph/Twitter cards.
- Product JSON-LD, Offer, BreadcrumbList, ItemList, Organization, WebSite SearchAction.
- Sitemap dynamique et robots.txt.
- Blog/landing pages.
- URLs slugs (`/product/:slug` au lieu d'id technique seul).
- Optimisation images produits.
- SSR/SSG/prerender pour contenu catalogue.

Priorité SEO :

1. P1 : metadata route + JSON-LD Product.
2. P1 : sitemap/robots.
3. P2 : collections/blog/landing pages.
4. P2 : schema reviews + FAQ.

---

## 10. Accessibilité

| Sujet | Problème | Recommandation |
| --- | --- | --- |
| Dialogs | Auth/cart/voice doivent piéger le focus. | Composant Dialog accessible ou Radix. |
| Boutons icônes | Plusieurs icônes ont seulement `title` ou visuel. | `aria-label` explicite. |
| Motion | Transitions globales. | Respect `prefers-reduced-motion`. |
| Contrastes | Glassmorphism peut réduire contraste. | Audit axe, tokens contrastés. |
| Formulaires | Validation peu structurée. | Labels, descriptions, erreurs `aria-describedby`. |
| Navigation clavier | Drawers, tabs admin, categories. | Focus visible, roving tabindex pour tabs/chips. |
| Landmarks | Layout simple. | `header`, `main`, `footer`, skip link. |

---

## 11. Analyse UX

### Frictions principales

1. CTA hero cassé.
2. Recherche trop faible et non conversationnelle malgré promesse IA.
3. Panier drawer sans leviers conversion avancés.
4. Checkout sans paiement réel et sans réassurance forte.
5. Profil incomplet et build cassé.
6. Admin trop dense et non guidé par tâches.
7. POS accessible sans protection.
8. Assistant IA déconnecté du catalogue réel.

### Clics/étapes inutiles

- Admin : onglets internes sans deep links ; revenir à un état précis est impossible.
- Checkout : informations profil/adresses peuvent être réutilisées automatiquement.
- Product detail : absence quick add depuis catalogue oblige parfois navigation complète.

### Feedback manquant

- États stock, livraison, paiement, sauvegarde profil, erreurs Supabase détaillées.
- Confirmation commande avec numéro, ETA, suivi.
- Feedback IA : écoute, réflexion, recommandation, ajout panier avec confirmation visuelle.

### Micro-interactions à ajouter

- Add-to-cart morph card -> cart.
- Haptic mobile sur ajout/suppression panier.
- Progress bar livraison gratuite.
- Skeletons sur tous fetchs.
- “Ava recommends” chips animés.
- Swipe product image/gallery.
- Pull-to-refresh catalogue mobile.

### Parcours utilisateur idéal

1. Arrivée sur landing avec promesse claire, best-sellers, preuves sociales.
2. Recherche IA ou navigation collection.
3. Product detail avec avis, stock, livraison, recommandations.
4. Ajout panier + upsell contextualisé.
5. Checkout express : contact prérempli, livraison, wallet/paiement.
6. Confirmation avec suivi, points fidélité, partage/referral.
7. Emails/SMS transactionnels et relance fidélité.

### Parcours mobile idéal

1. Header compact + bottom nav : Accueil, Recherche, Wishlist, Panier, Compte.
2. Recherche plein écran avec suggestions IA.
3. Cards swipeables, quick add, wishlist haptics.
4. PDP : galerie swipe, sticky “Ajouter — X€” en bas.
5. Checkout : sticky “Payer”, wallet natif prioritaire, récap drawer.
6. Suivi commande en timeline native.

### Parcours desktop idéal

1. Header premium avec mega menu collections + search command palette.
2. Landing éditoriale façon Apple/Airbnb.
3. PDP 2 colonnes sticky, recommandations latérales.
4. Cart drawer Shopify-like avec upsells.
5. Checkout centré, récap sticky à droite.
6. Compte dashboard avec commandes/fidélité/wishlist.

---

## 12. Analyse UI

### Typographie

- Actuel : Inter + Playfair Display. Excellent pour premium éditorial.
- Problème : hiérarchie parfois extrême (très grands titres) et petites uppercase à faible lisibilité.
- Recommandation : échelle typographique tokenisée : Display, H1-H4, Body, Caption, Button.

### Couleurs

- Actuel : bg coquille, ink vert noir, accent doré, soft green.
- Problème : glassmorphism et dark mode peuvent créer contrastes instables.
- Recommandation : tokens `surface`, `surface-elevated`, `border-subtle`, `text-muted`, `success/warning/danger`.

### Spacing

- Actuel : généreux, premium.
- Problème : admin et mobile demandent densités alternatives.
- Recommandation : système 4/8px + density modes `marketing`, `commerce`, `admin`.

### Hiérarchie visuelle

- Forte en marketing, plus faible en admin/checkout.
- Ajouter sections réassurance, badges, CTA sticky, surfaces de priorité.

### Animations

- Bon usage Motion.
- Ajouter motion principles : 120-180ms micro, 240-320ms page, reduced motion.

### Comparaison benchmarks

| Benchmark | Ce qu'ils font | Écart Véridian | Action |
| --- | --- | --- | --- |
| Apple Store | Storytelling produit + specs utiles + CTA clair. | Véridian a l'esthétique mais pas la pédagogie produit. | PDP éditorial, comparaison, vidéos. |
| Shopify | Checkout robuste, admin structuré, écosystème conversion. | Fonctionnalités commerce manquantes. | Paiement, promos, reviews, analytics. |
| Snapchat | Gestes, instantanéité, caméra/voix, haptics. | Assistant IA vocal mais UI mobile pas native. | Gestures, haptics, voice-first search. |
| Airbnb | Trust, filtres, cartes claires, réservation fluide. | Peu de preuves sociales et filtres. | Avis, filtres, politiques claires. |
| Linear | Admin rapide, raccourcis, states précis. | Admin dense, peu guidé. | Command palette, keyboard shortcuts, realtime. |
| Stripe | Docs/flows clairs, erreurs excellentes, sécurité. | Paiement simulé et erreurs génériques. | PSP réel + UX erreur premium. |

---

## 13. Analyse mobile native-feeling

### Header

- Actuel : probablement responsive, mais pas assez app-like.
- Cible : header collapsible, search prominent, compte/panier en bottom nav.

### Navigation

- Ajouter bottom bar 5 items : Home, Search, Wishlist, Cart, Account.
- Admin/POS : navigation tablette séparée.

### Gestes tactiles

| Geste | Usage | Priorité |
| --- | --- | --- |
| Swipe image PDP | Galerie produit. | P1 |
| Swipe card | Wishlist/quick add. | P2 |
| Pull to refresh | Catalogue, commandes. | P2 |
| Long press | Preview produit / actions admin. | P3 |
| Haptics | Ajout panier, favori, paiement succès. | P2 |

### Drawers

- Cart drawer plein écran mobile avec focus trap.
- Search drawer plein écran avec suggestions IA.
- Checkout summary drawer sticky.

### Checkout mobile

- Apple Pay/Google Pay en première option.
- Sticky CTA bas.
- Champs avec autocomplete (`shipping address-line1`, etc.).
- Erreurs inline et scroll to first error.

---

## 14. Analyse e-commerce vs Shopify

### Fonctionnalités manquantes exhaustives

| Domaine | Manques |
| --- | --- |
| Catalogue | Collections, tags, vendor/brand, variants/options, SKUs, inventory multi-location, prix comparé, badges, merchandising rules. |
| Recherche | Search page, facettes, tri, synonymes, typo tolerance, recherche sémantique IA, popular searches. |
| Produit | Reviews, UGC, bundles, subscriptions, recommendations, back-in-stock, size guide, stock ETA. |
| Panier | Discounts, coupons, gift cards, free shipping bar, upsell, cross-sell, shipping estimator. |
| Checkout | PSP réel, wallets, taxes, shipping rates, addresses, fraud, guest/account, order confirmation. |
| Commandes | Order items, fulfillment, shipments, tracking, invoices, refunds, returns, cancellations. |
| Clients | CRM, segments, tags, lifetime value, consentements, support timeline. |
| Marketing | Email/SMS campaigns, referral, affiliates, abandoned cart, landing pages, A/B tests. |
| Analytics | Funnel, cohorts, AOV, CAC/LTV, product performance, stock alerts, POS analytics. |
| Admin | Bulk edit/import/export, roles/staff, audit logs, settings, taxes, shipping zones. |
| IA | Reco IA, search IA, support IA, content generation, voice shopping, agent admin. |
| International | Multi-currency, multi-language, tax/VAT, localization. |
| Compliance | GDPR/CCPA, cookie consent, data export/delete, accessibility. |

---

## 15. Fonctionnalités à ajouter par catégorie

### Acquisition

| Feature | Pourquoi | Impact business | Impact utilisateur | Difficulté | Priorité |
| --- | --- | --- | --- | --- | --- |
| SEO technique complet | Indexation produits/collections. | Trafic organique durable. | Trouver les produits via Google. | Moyen | P1 |
| Blog éditorial | Créer demande et expertise. | Top funnel, backlinks. | Inspiration. | Moyen | P2 |
| Landing pages campagnes | Ads/influence ciblés. | Conversion paid. | Message pertinent. | Moyen | P2 |
| Referral | Boucle virale. | CAC réduit. | Récompenses. | Moyen | P2 |
| Affiliés | Créateurs/influence. | Acquisition scalable. | Codes personnalisés. | Élevé | P3 |

### Conversion

| Feature | Pourquoi | Impact business | Impact utilisateur | Difficulté | Priorité |
| --- | --- | --- | --- | --- | --- |
| Wishlist serveur | Sauver intention. | Relance, conversion différée. | Retrouver favoris. | Moyen | P1 |
| Avis clients | Preuve sociale. | CVR + confiance. | Décision plus sûre. | Moyen | P1 |
| Upsell/cross-sell | Augmenter AOV. | Marge/AOV. | Découverte utile. | Moyen | P1 |
| Bundles | Paniers composés. | AOV fort. | Offre simple. | Moyen | P2 |
| Codes promo | Campagnes. | Conversion ciblée. | Économie. | Moyen | P1 |
| Livraison gratuite dynamique | Motivation panier. | AOV. | Objectif clair. | Faible | P1 |

### Fidélisation

| Feature | Pourquoi | Impact business | Impact utilisateur | Difficulté | Priorité |
| --- | --- | --- | --- | --- | --- |
| Programme fidélité | Réachat. | LTV. | Points/récompenses. | Moyen | P2 |
| Cashback | Incitation retour. | Retention. | Valeur perçue. | Moyen | P3 |
| Parrainage | Acquisition + fidélité. | CAC bas. | Récompenses duo. | Moyen | P2 |
| Gamification | Engagement. | Fréquence. | Progression ludique. | Moyen | P3 |

### IA

| Feature | Pourquoi | Impact business | Impact utilisateur | Difficulté | Priorité |
| --- | --- | --- | --- | --- | --- |
| Assistant vocal sécurisé | Différenciation. | Conversion assistée. | Conseils instantanés. | Moyen | P1 |
| Recommandation IA | Personnalisation. | AOV/CVR. | Produits pertinents. | Élevé | P1 |
| Recherche IA | Intent matching. | Conversion catalogue. | Recherche naturelle. | Élevé | P1 |
| Support IA | Réduction support. | Coûts bas. | Réponses rapides. | Moyen | P2 |
| Génération contenu IA | Accélérer admin. | Productivité. | Fiches plus claires. | Moyen | P2 |

### Admin

| Feature | Pourquoi | Impact business | Impact utilisateur | Difficulté | Priorité |
| --- | --- | --- | --- | --- | --- |
| Analytics funnel | Décisions data. | CVR/AOV. | Indirect. | Moyen | P1 |
| CRM client | Segmentation. | LTV. | Offres pertinentes. | Élevé | P2 |
| Gestion clients | Support. | Réduction churn. | Service meilleur. | Moyen | P1 |
| Marketing automation | Growth. | Revenue. | Messages utiles. | Élevé | P2 |

---

## 16. Roadmap produit

### Phase 1 — MVP Pro (0-8 semaines)

| Initiative | Temps | Impact | Complexité |
| --- | ---: | --- | --- |
| Corriger build TS + CI | 2-3 jours | Très élevé | Faible |
| Checkout fiable avec order_items | 1-2 semaines | Très élevé | Moyen |
| RLS/RBAC Supabase | 1 semaine | Très élevé | Moyen |
| CTA/routing/404 | 1-2 jours | Élevé | Faible |
| SEO product basics | 1 semaine | Élevé | Moyen |
| Mobile sticky PDP/cart/checkout | 2 semaines | Élevé | Moyen |
| POS protected + store séparé | 1 semaine | Moyen | Moyen |
| Observabilité erreurs/logs | 3-5 jours | Moyen | Moyen |

### Phase 2 — Growth (2-4 mois)

| Initiative | Temps | Impact | Complexité |
| --- | ---: | --- | --- |
| Wishlist serveur + reviews | 3 semaines | Élevé | Moyen |
| Coupons/free shipping/upsell | 3 semaines | Très élevé | Moyen |
| Search IA + facettes | 4-6 semaines | Très élevé | Élevé |
| Admin sous-routes + analytics | 4 semaines | Élevé | Moyen |
| Landing/blog CMS | 3-4 semaines | Moyen/élevé | Moyen |
| Email transactionnel + abandon panier | 3 semaines | Élevé | Moyen |

### Phase 3 — Scale (4-8 mois)

| Initiative | Temps | Impact | Complexité |
| --- | ---: | --- | --- |
| CRM segments + marketing automation | 6-8 semaines | Très élevé | Élevé |
| Reco IA personnalisée | 6 semaines | Très élevé | Élevé |
| Multi-location inventory/POS | 6 semaines | Élevé | Élevé |
| Returns/refunds/fulfillment | 4-6 semaines | Élevé | Moyen/élevé |
| A/B testing et experimentation | 4 semaines | Moyen | Moyen |

### Phase 4 — Enterprise (8-12 mois)

| Initiative | Temps | Impact | Complexité |
| --- | ---: | --- | --- |
| Multi-tenant/brands | 8-12 semaines | Très élevé | Très élevé |
| Internationalization multi-currency | 6-10 semaines | Élevé | Élevé |
| RBAC avancé/audit logs | 4-6 semaines | Élevé | Moyen |
| Data warehouse + BI | 6 semaines | Élevé | Élevé |
| IA agent admin autonome | 8 semaines | Différenciant | Très élevé |

---

## 17. Roadmap technique — backlog Epic/Feature/Task/Subtask

### Epic 1 — Fondations qualité

- Feature : Type safety
  - Task : Corriger `AddressBook` form state.
  - Task : Générer types Supabase.
  - Task : Activer `strict` TypeScript si non actif.
- Feature : CI
  - Task : `npm run lint`, `npm run build`, tests unitaires.
  - Task : Prettier/ESLint.
- Feature : Tests
  - Task : Vitest store/services.
  - Task : Testing Library composants critiques.
  - Task : Playwright checkout/PDP/cart.

### Epic 2 — Sécurité et data

- Feature : RLS production
  - Task : Supprimer policies permissives.
  - Task : Policies self/admin pour orders/profiles/addresses.
  - Task : Staff/kiosk roles.
- Feature : Checkout transactionnel
  - Task : Tables `orders`, `order_items`, `payments`, `shipments`.
  - Task : RPC `create_order` transactionnelle.
  - Task : Stripe webhook.
- Feature : Audit logs
  - Task : Table `audit_events`.
  - Task : Log admin product/order changes.

### Epic 3 — Architecture frontend

- Feature : Découpage features
  - Task : Créer `features/catalog`, `features/cart`, `features/checkout`, `features/account`, `features/admin`, `features/assistant`.
  - Task : Déplacer services/hooks/types.
- Feature : Routing moderne
  - Task : Lazy routes.
  - Task : NotFound.
  - Task : Admin nested routes.
- Feature : Design system
  - Task : Tokens couleur/type/spacing.
  - Task : Button, Input, Dialog, Drawer, Badge, Card, Tabs.

### Epic 4 — Conversion

- Feature : Product experience
  - Task : Reviews, recommendations, stock badges.
  - Task : PDP sticky CTA mobile.
- Feature : Cart growth
  - Task : Free shipping progress.
  - Task : Coupons.
  - Task : Upsell/cross-sell.
- Feature : Checkout pro
  - Task : PSP réel.
  - Task : Wallets.
  - Task : Emails confirmation.

### Epic 5 — IA-first

- Feature : Voice assistant safe
  - Task : JWT auth WS.
  - Task : Rate limits.
  - Task : Dynamic catalog tools.
- Feature : AI search
  - Task : Embeddings produits.
  - Task : Hybrid search Postgres/vector.
  - Task : UI conversational search.
- Feature : Admin AI copilot
  - Task : Generate product copy.
  - Task : Explain analytics anomalies.
  - Task : Draft campaigns.

---

## 18. Schéma base de données cible complet

> Le schéma ci-dessous est une cible produit. Il doit être transformé en migrations incrémentales idempotentes et adapté aux extensions Supabase disponibles.

```sql
-- Extensions
create extension if not exists pgcrypto;
create extension if not exists vector;

-- Enums
create type public.user_role as enum ('customer', 'staff', 'admin', 'kiosk');
create type public.order_status as enum ('draft', 'pending_payment', 'paid', 'fulfillment_pending', 'preparing', 'ready', 'shipped', 'delivered', 'cancelled', 'refunded');
create type public.payment_status as enum ('requires_payment', 'authorized', 'paid', 'failed', 'refunded', 'partially_refunded');
create type public.discount_type as enum ('percentage', 'fixed_amount', 'free_shipping');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  first_name text,
  last_name text,
  phone text,
  role public.user_role not null default 'customer',
  loyalty_points integer not null default 0 check (loyalty_points >= 0),
  marketing_email_opt_in boolean not null default false,
  marketing_sms_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text,
  recipient_name text,
  phone text,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  region text,
  postal_code text not null,
  country text not null default 'FR',
  is_default_shipping boolean not null default false,
  is_default_billing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index addresses_user_id_idx on public.addresses(user_id);
create unique index one_default_shipping_per_user on public.addresses(user_id) where is_default_shipping;
create unique index one_default_billing_per_user on public.addresses(user_id) where is_default_billing;

-- Catalog
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  parent_id uuid references public.categories(id) on delete cascade,
  level integer not null default 1 check (level between 1 and 4),
  sort_order integer not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index categories_parent_idx on public.categories(parent_id);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  sku text unique,
  name text not null,
  description text,
  short_description text,
  price numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2) check (compare_at_price is null or compare_at_price >= price),
  currency text not null default 'EUR',
  image_url text,
  gallery jsonb not null default '[]'::jsonb,
  effects text[] not null default '{}',
  specs jsonb not null default '[]'::jsonb,
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  is_featured boolean not null default false,
  is_new boolean not null default false,
  seo_title text,
  seo_description text,
  search_vector tsvector generated always as (
    setweight(to_tsvector('french', coalesce(name,'')), 'A') ||
    setweight(to_tsvector('french', coalesce(description,'')), 'B')
  ) stored,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_active_idx on public.products(is_active);
create index products_search_idx on public.products using gin(search_vector);
create index products_effects_idx on public.products using gin(effects);

create table public.product_categories (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (product_id, category_id)
);
create index product_categories_category_idx on public.product_categories(category_id);

create table public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text,
  is_verified_purchase boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);
create index product_reviews_product_idx on public.product_reviews(product_id, is_published);

-- Wishlist/cart intent
create table public.wishlist_items (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- Commerce
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references public.profiles(id) on delete set null,
  email text not null,
  status public.order_status not null default 'draft',
  subtotal numeric(10,2) not null default 0,
  discount_total numeric(10,2) not null default 0,
  shipping_total numeric(10,2) not null default 0,
  tax_total numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  currency text not null default 'EUR',
  shipping_address jsonb,
  billing_address jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_idx on public.orders(user_id, created_at desc);
create index orders_status_idx on public.orders(status, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  sku text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  total numeric(10,2) not null check (total >= 0),
  metadata jsonb not null default '{}'::jsonb
);
create index order_items_order_idx on public.order_items(order_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null,
  provider_payment_id text unique,
  status public.payment_status not null default 'requires_payment',
  amount numeric(10,2) not null,
  currency text not null default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_order_idx on public.payments(order_id);

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  carrier text,
  tracking_number text,
  tracking_url text,
  status text not null default 'pending',
  estimated_delivery_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.discounts (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  type public.discount_type not null,
  value numeric(10,2) not null,
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer,
  used_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Marketing/analytics/AI
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  anonymous_id text,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index events_name_time_idx on public.events(event_name, created_at desc);
create index events_user_time_idx on public.events(user_id, created_at desc);

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  channel text not null default 'voice',
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

-- RLS baseline
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_reviews enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.shipments enable row level security;
alter table public.discounts enable row level security;
alter table public.events enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.audit_events enable row level security;

-- Helper
create or replace function public.is_admin()
returns boolean language sql stable security definer as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Example policies
create policy profiles_self_select on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy profiles_self_update on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy addresses_self_all on public.addresses for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
create policy products_public_read on public.products for select using (is_active = true or public.is_admin());
create policy products_admin_write on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy categories_public_read on public.categories for select using (true);
create policy categories_admin_write on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy wishlist_self_all on public.wishlist_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy orders_self_or_admin_read on public.orders for select using (auth.uid() = user_id or public.is_admin());
create policy order_items_self_or_admin_read on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
);
```

---

## 19. Architecture cible

```txt
src/
  app/
    App.tsx
    router.tsx
    providers.tsx
    config.ts
  pages/
    HomePage.tsx
    ProductPage.tsx
    CheckoutPage.tsx
    AccountPage.tsx
    PosPage.tsx
    ScreenPage.tsx
    admin/
      AdminLayout.tsx
      AdminOverviewPage.tsx
      AdminProductsPage.tsx
      AdminOrdersPage.tsx
      AdminCustomersPage.tsx
      AdminAnalyticsPage.tsx
  features/
    catalog/
      components/
      hooks/
      services/
      types.ts
    cart/
      components/
      store.ts
      selectors.ts
    checkout/
      components/
      hooks/
      services/
      validation.ts
    account/
    admin/
    assistant/
    pos/
    marketing/
  components/
    ui/
      Button.tsx
      Input.tsx
      Dialog.tsx
      Drawer.tsx
      Badge.tsx
      Tabs.tsx
      Skeleton.tsx
    layout/
      Header.tsx
      Footer.tsx
      MobileBottomNav.tsx
  hooks/
    useMediaQuery.ts
    useReducedMotion.ts
    useDebouncedValue.ts
  services/
    supabaseClient.ts
    apiClient.ts
    analytics.ts
  lib/
    utils.ts
    money.ts
    seo.ts
  types/
    database.types.ts
    commerce.ts
  store/
    index.ts
    authSlice.ts
    cartSlice.ts
    checkoutSlice.ts
    uiSlice.ts
```

### Pourquoi chaque dossier existe

| Dossier | Rôle |
| --- | --- |
| `app/` | Bootstrap global : router, providers, config, error boundaries. |
| `pages/` | Composants route-level seulement, sans logique métier lourde. |
| `features/` | Domaines produit autonomes avec composants, hooks, services, types. |
| `components/ui/` | Design system réutilisable et accessible. |
| `components/layout/` | Shells d'application, navigation, footer, bottom nav. |
| `hooks/` | Hooks transverses non métier. |
| `services/` | Clients externes et intégrations partagées. |
| `lib/` | Fonctions pures utilitaires. |
| `types/` | Types globaux et types DB générés. |
| `store/` | Zustand slices et selectors globaux minimaux. |

---

## 20. Plan d'exécution 12 mois

| Mois | Objectifs | Livrables | KPI |
| --- | --- | --- | --- |
| 1 | Stabiliser et sécuriser | Build vert, RLS stricte, checkout order_items, CTA fix, route 404. | 0 erreur build, 0 policy ouverte critique. |
| 2 | Checkout pro | Stripe, wallets, emails, confirmation order detail. | +20% checkout completion. |
| 3 | Mobile commerce | Bottom nav, sticky PDP/cart/checkout, haptics, gestures clés. | +15% mobile CVR. |
| 4 | SEO & catalogue | Metadata, JSON-LD, sitemap, collections, slugs. | Indexation produits, impressions Search Console. |
| 5 | Conversion suite | Wishlist, reviews, coupons, free shipping progress. | +10% AOV, +10% CVR PDP. |
| 6 | IA search/reco V1 | Recherche hybride, reco PDP/cart, assistant catalogue dynamique. | Search conversion, assisted revenue. |
| 7 | Admin refactor | Sous-routes, analytics, product/category manager robuste. | Temps ops réduit. |
| 8 | Marketing | Abandoned cart, landing pages, referral V1. | Revenue email/SMS, CAC. |
| 9 | POS scale | Staff roles, receipts, shifts, inventory location. | Ventes POS fiables. |
| 10 | Fulfillment | Shipments, tracking, returns/refunds. | Tickets support baisse. |
| 11 | CRM & segmentation | Segments, LTV, campaigns, consentements. | Repeat purchase rate. |
| 12 | Enterprise readiness | Audit logs, BI, i18n/multi-currency plan, IA admin copilot. | Enterprise readiness score. |

---

## 21. Bugs détectés et dette technique

### Bugs détectés

| Bug | Fichier | Gravité | Correction |
| --- | --- | --- | --- |
| TypeScript échoue sur `AddressBook` form state. | `src/components/AddressBook.tsx` | P0 | Typer `useState<AddressFormState>`. |
| CTA `/storefront` inexistant. | `src/pages/StoreFront.tsx` | P0 | Corriger route/ancre. |
| Checkout ne persiste pas lignes commande. | `src/store.ts` | P0 | Insérer `order_items` transactionnellement. |
| POS non protégé. | `src/App.tsx` | P0 | Ajouter `ProtectedRoute role`. |
| Migration orders destructive. | `supabase/migrations/20260627_create_orders.sql` | P0 | Retirer `DROP TABLE`, migrer non destructif. |
| RLS orders permissive. | `supabase/migrations/20260627_create_orders.sql` | P0 | Policies self/admin. |
| Rôle admin fallback basé sur email. | `src/store.ts` | P0 | Rôle attribué serveur/admin uniquement. |
| WS IA sans auth/rate limit. | `server.ts` | P0/P1 | Auth JWT + rate limit. |

### Dette technique

- Store global trop gros.
- Pages admin/checkout trop couplées aux services.
- Pas de tests ni CI.
- Pas de typed Supabase generated schema.
- Pas de design system accessible.
- Pas de séparation client/POS/admin/kiosk au niveau permissions.
- Pas de stratégie images/SEO/performance.

---

## 22. Conclusion

Le produit a un socle de marque fort et une différenciation IA vocale prometteuse. Pour devenir “le meilleur e-commerce IA-first de sa catégorie”, il faut d'abord rendre le commerce fiable : sécurité RLS, checkout transactionnel, paiement réel, order items, build vert, mobile checkout. Ensuite, la croissance viendra des fonctionnalités Shopify-grade (reviews, wishlist, promos, analytics, CRM) et de l'IA réellement connectée au catalogue, à la recherche et à l'admin.

La séquence gagnante est : **stabilité + sécurité → conversion mobile → SEO/acquisition → IA personnalisée → admin/ops scale → enterprise readiness**.
