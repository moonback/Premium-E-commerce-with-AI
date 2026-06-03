# Rapport d’audit professionnel — Véridian / Premium E-commerce with AI

> Audit réalisé sur le code réel du dépôt, pas sur les README uniquement.
>
> Date d’audit : 2026-06-03.

---

## 1. Score global

| Domaine | Score | Justification synthétique |
|---|---:|---|
| Architecture | **7/10** | Architecture fullstack cohérente React/Vite/Express/Supabase/Stripe/Gemini, mais backend monolithique dans `server.ts`, gros composants UI et logique métier dispersée. |
| Sécurité | **6/10** | Plusieurs garde-fous existent : RLS, webhook Stripe signé, validation serveur des prix, CSP partielle. Risques restants : flux paiement non atomique PSP→commande, CSP avec `unsafe-inline`, endpoint events cassé, admin fortement client-side. |
| Performance | **5.5/10** | Code splitting par routes présent, mais chunk `vendor-icons` très lourd, composants/pages très volumineux, listes non virtualisées, store global large. |
| Scalabilité | **5.5/10** | Supabase RPC transactionnelle utile pour le stock, pgvector HNSW présent, mais vectorisation batch synchrone, WebSocket en mémoire, polling admin toutes les 10 s, absence de jobs/queues. |
| UX | **7/10** | UX premium riche, checkout guidé, PWA, assistant IA, SEO. Risques : surcharge d’animations, composants denses, PWA incomplète, checkout fragile si webhook/commande désynchronisés. |
| Maintenabilité | **5.5/10** | TypeScript compile, tests passent, mais `noUnused*` désactivé, nombreux imports inutilisés, fichiers >600–900 lignes, logique métier dans composants. |

---

## 2. Cartographie du projet

### 2.1 Architecture globale

```text
Navigateur
  ├─ React 19 + Vite
  │   ├─ Routes React Router
  │   ├─ Zustand global store
  │   ├─ Supabase browser client
  │   ├─ Stripe.js Payment Element
  │   ├─ PWA Service Worker
  │   └─ VoiceAssistant WebSocket
  │
  ├─ /api/* HTTP
  │   └─ Express server.ts
  │       ├─ Stripe PaymentIntent + Webhook
  │       ├─ Supabase anon/admin clients
  │       ├─ Gemini / OpenRouter endpoints
  │       ├─ pgvector semantic search
  │       └─ sitemap/robots/health/events
  │
  └─ /live WebSocket
      └─ Gemini Live API
          ├─ prompt système Ava
          ├─ skills markdown dynamiques
          ├─ injection contexte catalogue
          └─ function call addToCart côté client
```

Le frontend initialise la session, charge produits et catégories au démarrage via `initSession`, `fetchProducts` et `fetchCategories` dans `AppContent`. Les routes principales sont lazy-loadées (`StoreFront`, `ProductDetail`, `Checkout`, `Admin`, etc.), ce qui donne une base correcte de code splitting. Les routes admin/POS/screen sont protégées par `ProtectedRoute` avec rôle côté client.

### 2.2 Frontend

- **React 19 + TypeScript + Vite** : dépendances déclarées dans `package.json`.
- **Routing** : `React Router` avec routes publiques, profil protégé, admin/POS/screen protégés par rôle.
- **Store global** : un seul store Zustand persistant partiellement (`cart`, `favorites`).
- **Supabase browser client** : initialisé uniquement si `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` existent.

### 2.3 Backend

- Serveur Express lancé via `tsx server.ts` en dev et bundlé avec esbuild en prod.
- Middleware sécurité maison : headers `nosniff`, `SAMEORIGIN`, HSTS en production, CSP en production.
- Observabilité minimale : request id + logs JSON.
- WebSocket Gemini Live sur `/live`.

### 2.4 Base de données

- Tables transactionnelles `orders`, `order_items` avec RLS et index.
- Profils, rôles, commandes et items renforcés via migration RLS.
- Paiements, expéditions, événements, conversations IA et audit events créés avec RLS.
- pgvector activé avec colonne `embedding vector(1536)` et index HNSW.

### 2.5 Paiement Stripe

```text
Checkout React
  → PaymentForm
    → POST /api/payments/create-intent
      → serveur recalcule prix depuis Supabase
      → Stripe PaymentIntent
  → Stripe.js confirmPayment
  → onSuccess()
    → checkout()
      → RPC create_order_with_items
      → stock décrémenté + commande + payment row
  → webhook Stripe
    → mise à jour payments + orders.payment_status
```

Le serveur recalcule le montant à partir du catalogue, pas du total client, via `calculatePaymentAmountCents`. La signature webhook Stripe est vérifiée avec HMAC et `timingSafeEqual`.

### 2.6 IA / Gemini / pgvector

- Gemini Live utilise `GEMINI_LIVE_MODEL` et un prompt système chargé depuis `prompts/ava-system.md`.
- Le prompt Ava interdit les produits inventés et les injections de prompt.
- Les embeddings utilisent `gemini-embedding-2` avec `outputDimensionality = 1536`.
- La recherche sémantique appelle `match_products`.

### 2.7 Authentification

- Auth Supabase côté client.
- `ProtectedRoute` ne fait qu’un contrôle UX côté client basé sur le `user.role` du store.
- Les endpoints sensibles serveur revérifient le token Supabase et le rôle dans `profiles` pour vectorisation et amélioration description.

### 2.8 WebSocket

- Rate limiting en mémoire par IP : 5 connexions / 10 min, max 2 actives.
- Auth WebSocket par token Supabase en query string.
- Messages text/audio transmis à Gemini.

### 2.9 PWA

- Manifest présent avec icônes SVG, shortcuts catalogue/panier/profil.
- Service Worker précache `/`, `/index.html`, `/offline.html`.
- Stratégie runtime network-first, images cache-first.

---

## 3. Failles critiques

### C1 — Flux paiement non atomique : paiement Stripe confirmé avant création de commande

**Gravité : Critique — CVSS estimé 8.6**

Le PaymentIntent est créé puis confirmé côté client. Ensuite seulement, `handlePaymentSuccess` appelle `checkout()` pour créer la commande. Si la confirmation Stripe réussit mais que la RPC Supabase échoue, le client peut être débité sans commande locale, stock non réservé ou panier non vidé. Le webhook tente de réconcilier un `payments` row existant, mais si la commande n’a pas encore créé la ligne payment, le webhook renvoie 409 pour `paid`.

**Scénario d’exploitation / incident :**

1. Client paie.
2. Stripe retourne `succeeded`.
3. Réseau ou RPC Supabase échoue dans `checkout()`.
4. Pas de `orders`, pas de `payments`, webhook en avance ou impossible à rattacher.
5. Support manuel nécessaire.

**Correction recommandée :**

Créer une **commande pending avant confirmation Stripe**, avec réservation de stock ou stock hold expirant, puis créer le PaymentIntent avec `order_id` en metadata. Le webhook devient source d’autorité pour passer `paid`.

```sql
create table if not exists public.checkout_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  order_id uuid references public.orders(id),
  stripe_payment_intent_id text unique,
  status text not null check (status in ('created','requires_payment','paid','failed','expired')),
  cart_hash text not null,
  amount numeric(10,2) not null,
  expires_at timestamptz not null default now() + interval '15 minutes',
  created_at timestamptz not null default now()
);
```

```ts
// POST /api/checkout/create
// 1. Auth user
// 2. RPC create_pending_order_with_items(cart)
// 3. Stripe PaymentIntent(metadata: { order_id, checkout_attempt_id })
// 4. return clientSecret

// webhook payment_intent.succeeded
// 1. verify signature
// 2. retrieve metadata.order_id
// 3. update payment/order paid idempotently
```

### C2 — Endpoint `/api/events` incompatible avec le schéma SQL

**Gravité : Élevée — CVSS estimé 7.1**

Le serveur insère dans `events` les colonnes `event_type` et `payload`. Les migrations créent `events` avec `event_name` et `properties`. Résultat : persistance des événements probablement en erreur permanente, analytics partiellement inutilisables.

**Impact :**

- Perte d’observabilité business.
- Données funnel checkout/search/purchase absentes.
- Alerting et analyses IA faussés.

**Correction :**

```ts
await supabaseAdmin.from("events").insert({
  event_name: event_type,
  user_id: userId,
  properties: payload ?? {},
  created_at: new Date().toISOString(),
});
```

### C3 — CSP production trop permissive (`unsafe-inline`)

**Gravité : Élevée — CVSS estimé 7.0**

La CSP de production autorise `script-src 'self' 'unsafe-inline'`. Cela réduit fortement la protection contre XSS si une injection HTML/JS apparaît dans un composant ou du contenu admin.

**Correction :**

- Retirer `unsafe-inline` en production.
- Utiliser nonce par requête ou hashes.
- Ajouter `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'self'`.
- Ajouter `script-src 'self' https://js.stripe.com`.

```ts
const nonce = randomUUID();
res.setHeader(
  "Content-Security-Policy",
  [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://js.stripe.com`,
    "style-src 'self' 'unsafe-inline'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'self'",
    "img-src 'self' https://images.unsplash.com data: blob:",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com https://generativelanguage.googleapis.com wss:",
    "frame-src https://js.stripe.com",
  ].join("; ")
);
```

### C4 — Admin et mutations catalogue exposées côté client

**Gravité : Élevée — CVSS estimé 7.4**

L’interface admin effectue directement des `upsert`, `delete`, upload storage et lectures massives depuis le client Supabase. La sécurité dépend donc entièrement de RLS/policies et grants. C’est acceptable pour Supabase si parfaitement configuré, mais fragile pour un backoffice premium : audit, validation serveur, rate limiting, contrôles métier et journalisation sont incomplets.

**Correction :**

- Remplacer mutations admin critiques par endpoints serveur `/api/admin/products`.
- Vérifier token + rôle côté serveur.
- Valider payload avec schéma.
- Écrire `audit_events`.
- Utiliser service role uniquement côté serveur.

---

## 4. Failles importantes

### I1 — `SELECT *` répétés côté client et serveur

Exemples : produits, catégories, adresses, wishlist, commandes admin, vectorisation.

**Impact :**

- Surconsommation réseau.
- Risque fuite de champs sensibles si colonnes ajoutées.
- Dégradation progressive avec la taille du catalogue/commandes.

**Correction :**

```ts
.from("products")
.select("id,name,description,price,stock,image,categories,effects,badges,promotion,rating")
```

Pour admin stats :

```sql
create or replace function public.admin_dashboard_stats()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'today_sales', coalesce(sum(total) filter (where created_at >= date_trunc('day', now())), 0),
    'active_orders', count(*) filter (where status not in ('Livrée', 'Terminée')),
    'total_orders', count(*)
  )
  from public.orders;
$$;
```

### I2 — Zustand global trop large, sélecteurs parfois larges

`useStore` contient produits, catégories, panier, adresses, wishlist, user, checkout, UI state, actions async et logique métier dans un seul store. Certains composants lisent tout le store au lieu de sélecteurs fins. `Checkout` destructure beaucoup de propriétés en une seule souscription.

**Impact :**

- Re-renders inutiles.
- Couplage élevé.
- Mémoire persistée potentiellement lourde si le panier stocke les objets produits complets.

**Refactor recommandé :**

- `useCartStore`
- `useCatalogStore`
- `useAuthStore`
- `useCheckoutStore`
- `useUiStore`
- Stocker dans le panier `{ productId, quantity, priceSnapshot }`, pas l’objet produit complet.

### I3 — Stock décrémenté après paiement, pas de libération automatique

La RPC décrémente le stock dans la transaction de création de commande. Mais le statut initial peut rester `processing` jusqu’au webhook. Il n’y a pas de logique visible de libération de stock en cas de paiement échoué/cancelled.

**Correction :**

- Introduire `stock_reservations`.
- Expiration automatique.
- Libération sur webhook `payment_intent.payment_failed` / `canceled`.

### I4 — WebSocket rate limiting en mémoire

Le rate limit est une `Map` en mémoire. En multi-instance, chaque instance a ses compteurs. Après redémarrage, les compteurs disparaissent.

**Correction :**

- Redis / Upstash / Supabase table TTL.
- Rate limit par `user_id` + IP.
- Limite messages/audio bytes par minute.

### I5 — PWA : bug logique et assets notification inexistants

La condition `!request.destination === 'image'` est incorrecte à cause de la précédence opérateur. Les notifications référencent des `.png`, alors que le manifest liste des `.svg`.

```js
if (url.origin !== location.origin && request.destination !== 'image') {
  return;
}
```

---

## 5. Audit architecture

| Problème | Gravité | Impact | Solution |
|---|---:|---|---|
| Backend monolithique `server.ts` | Élevée | Difficile à tester, scaler, sécuriser. | Découper en `routes/payments`, `routes/ai`, `routes/catalog`, `ws/live`, `middleware/security`. |
| Store Zustand unique | Élevée | Couplage, re-render, dette. | Slices/stores séparés + sélecteurs fins. |
| Pages énormes | Moyenne/Élevée | Maintenance et bundle par route. | Extraire sections, hooks, services. |
| Admin polling brut | Moyenne | Charge DB croissante. | RPC stats agrégées + realtime ciblé. |
| Vectorisation synchrone | Moyenne | Timeout, coût API, pas de reprise robuste. | Job queue + table `vectorization_jobs`. |

---

## 6. Qualité du code / dead code / imports inutilisés

Le `tsconfig` ne force ni `noUnusedLocals` ni `noUnusedParameters`. Le contrôle `npx tsc --noEmit --noUnusedLocals --noUnusedParameters --pretty false` a détecté de nombreux problèmes.

| Fichier | Problème | Correction |
|---|---|---|
| `src/App.tsx` | Import `React` inutilisé. | Supprimer `React` ou désactiver règle uniquement si nécessaire. |
| `src/components/VoiceAssistant.tsx` | `MicOff` inutilisé. | Supprimer l’import. |
| `src/store.ts` | `getErrorMessage` inutilisé. | Supprimer l’import. |
| `src/pages/Checkout.tsx` | `X` inutilisé. | Supprimer l’import. |
| `src/pages/StoreFront.tsx` | Plusieurs icônes inutilisées (`Truck`, `Shield`, `Headphones`, etc.). | Nettoyer imports ou utiliser un fichier de config icons. |
| `server.ts` | Paramètre `req` inutilisé dans fallback prod. | Remplacer par `_req`. |
| `src/components/admin/MegaMenuManager.tsx` | Fonction `getLinkTypeIcon` inutilisée selon TypeScript. | Supprimer ou brancher dans UI. |
| `src/components/admin/VectorizationPanel.tsx` | `handleVectorizeOne` inutilisée selon TypeScript. | Supprimer ou exposer action par ligne produit. |

---

## 7. Audit React

### 7.1 Re-renders inutiles

- Store global trop large, et certains appels à `useStore()` sans sélecteur fin.
- `Checkout` calcule `subtotal` à chaque render sans `useMemo`.
- `VoiceAssistant` reconstruit `buildCatalogContext` depuis tous les produits à chaque session et injecte les 20 premiers produits.
- Nombreux composants non `React.memo`, notamment cartes/listes.

**Gain estimé :**

- Store slicing + sélecteurs : **15–30 %** de re-renders en moins sur checkout/header/cart.
- `React.memo` sur cards/items + callbacks stables : **10–20 %** sur catalogue.
- `useMemo` pour filtrage/pagination : gain variable, utile si catalogue >500 produits.

### 7.2 Performance UI

- Le catalogue pagine à 12 produits, ce qui limite le besoin immédiat de virtualisation, mais les pages marketing de `StoreFront` sont très lourdes et animées.
- Chunk icons énorme : build indique `vendor-icons` à **852.68 kB minifié / 157.62 kB gzip**.
- `motion` est séparé mais encore **138.86 kB minifié / 45.92 kB gzip**.
- CSS global atteint **116.23 kB / 16.55 kB gzip**.

**Optimisation prioritaire :**

- Remplacer import direct massif `lucide-react` par imports ciblés si possible.
- Charger l’assistant IA uniquement après interaction.
- Charger composants admin lourds par sous-route / dynamic import par tab.

---

## 8. Audit Zustand

### Anti-patterns détectés

1. Store omniscient : catalogue, auth, UI, checkout, wishlist, addresses.
2. Persistence partielle avec objets produits dans panier.
3. Actions async Supabase dans le store : `fetchProducts`, `fetchCategories`, `checkout`, addresses, wishlist.
4. Subscription auth non désinscrite : `onAuthStateChange` est appelé dans `initSession`, mais la subscription retournée n’est pas stockée/nettoyée.

### Refactor recommandé

```ts
// useCartStore.ts
type CartLine = {
  productId: string;
  quantity: number;
  priceSnapshot: number;
  nameSnapshot: string;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      addLine: (...) => ...
    }),
    { name: "cart-v1" }
  )
);
```

```ts
// useCatalogStore.ts
export const useCatalogStore = create<CatalogState>()((set) => ({
  productsById: {},
  productIds: [],
  fetchProducts: async () => { /* select explicit columns */ }
}));
```

---

## 9. Audit Supabase

### Points positifs

- RLS activé sur `profiles`, `orders`, `order_items`.
- Politique profil : self ou admin.
- Politique commandes : self ou admin.
- RPC `create_order_with_items` en `SECURITY DEFINER`, avec `search_path = public`, vérification `auth.uid()`, validation items, `FOR UPDATE` sur produits et décrément stock.
- Tables sensibles créées avec RLS + grants explicites.

### Risques

| Risque | Gravité | Correction |
|---|---:|---|
| `match_products` exécutable par `authenticated`, retourne prix/stock/descriptions. | Moyenne | Si données catalogue publiques OK ; sinon limiter colonnes ou créer fonction public-only. |
| Migration corrective destructive pour embeddings | Moyenne | Marquer migration comme coûteuse et planifier backfill. |
| Events endpoint cassé | Élevée | Corriger serveur : `event_name` / `properties`. |
| `SELECT *` | Moyenne | Colonnes explicites. |

### SQL optimisé recommandé

```sql
create index if not exists products_stock_idx
on public.products(stock)
where stock > 0;

create index if not exists products_categories_gin_idx
on public.products using gin(categories);

create index if not exists orders_created_at_idx
on public.orders(created_at desc);

create index if not exists product_reviews_product_published_created_idx
on public.product_reviews(product_id, created_at desc)
where is_published = true;
```

---

## 10. Audit Stripe

### Points positifs

- Montant recalculé côté serveur depuis `products.id, price, stock`.
- Quantités validées et dédupliquées.
- Idempotency key Stripe basée sur user/attempt/cart hash.
- Webhook Stripe signé et timestamp toléré 5 min.
- Webhook met à jour `payments` puis `orders.payment_status`.

### Risques Stripe

| Risque | Niveau | Correction |
|---|---:|---|
| Paiement confirmé avant commande | Critique | Précréer commande pending avant PaymentIntent. |
| Webhook en avance sans row payment | Élevé | Metadata `order_id` + upsert par PaymentIntent metadata. |
| Pas de vérification serveur du montant webhook vs commande | Élevé | Vérifier `amount_received === order.total * 100`. |
| Discount client non transmis à RPC | Moyen | Valider discounts serveur et les passer à RPC. |

---

## 11. Audit IA / Gemini / Voice Assistant

### Points positifs

- Prompt système explicite : catalogue uniquement, pas de produits inventés, ignorer injections.
- Input texte limité à 300 caractères et caractères de contrôle supprimés.
- WebSocket exige une session Supabase si Supabase configuré.
- Function calling limité à `addToCart`.

### Risques IA

| Risque | Gravité | Correction |
|---|---:|---|
| Injection catalogue depuis client | Élevée | Le serveur doit construire le contexte catalogue, pas le client. |
| Function response client non authentifiée | Moyenne | Corréler IDs et n’accepter réponses attendues ; idéalement exécuter tool côté serveur. |
| Recherche sémantique publique authentifiée sans rate limit HTTP | Moyenne | Ajouter rate limit + auth optionnelle + quota. |
| Vectorisation HTTP longue | Moyenne | Job queue + progress persisted. |

### Correction majeure IA recommandée

- Déplacer `addToCart` côté serveur ou signer les tool calls.
- Construire le contexte catalogue côté serveur depuis Supabase.
- Ajouter un “prompt firewall” simple : refuser instructions contenant `ignore previous`, `system prompt`, `developer message`, etc. Ce n’est pas suffisant seul, mais utile en défense en profondeur.

---

## 12. Audit sécurité OWASP

| Catégorie OWASP | Statut | Risque |
|---|---|---|
| Broken Access Control | Partiellement maîtrisé : RLS + policies, mais admin mutations client-side. | Moyen/Élevé |
| Cryptographic Failures | Correct côté Stripe avec HMAC webhook. | Faible |
| Injection SQL | Faible côté app : Supabase query builder/RPC, pas SQL concat côté TS. | Faible |
| XSS | CSP `unsafe-inline`. | Élevé si contenu injecté |
| SSRF | Fetchs vers Stripe/OpenRouter/Gemini constants, pas URL utilisateur. | Faible |
| Security Misconfiguration | `vercel.json` ne définit que cache assets, pas headers sécurité si Express non utilisé. | Moyen |
| Vulnerable Components | Non vérifiable : `npm audit` bloqué 403. | Inconnu |
| Auth Failures | Auth Supabase correcte, WebSocket token en query string. | Moyen |
| Software/Data Integrity | PWA cache runtime tous GET same-origin. | Moyen |
| Logging/Monitoring | Logs JSON mais pas Sentry/tracing. | Moyen |

---

## 13. Audit performance

### Mesures observées

Build production réussi, mais avertissement chunks >500 kB :

- `vendor-icons`: **852.68 kB minifié / 157.62 kB gzip**
- `vendor-react`: **232.52 kB / 74.28 kB gzip**
- `vendor-data`: **213.27 kB / 55.72 kB gzip**
- `Admin`: **222.34 kB / 51.19 kB gzip**
- CSS : **116.23 kB / 16.55 kB gzip**

### Top 20 optimisations par ROI

| Rang | Optimisation | ROI | Effort |
|---:|---|---:|---:|
| 1 | Réduire `lucide-react` / imports icônes / lazy icons admin | Très élevé | Moyen |
| 2 | Corriger `/api/events` pour restaurer analytics | Très élevé | Faible |
| 3 | Remplacer admin `.select('*')` + polling par RPC stats | Très élevé | Moyen |
| 4 | Précréer commande pending avant Stripe | Très élevé | Élevé |
| 5 | Slices Zustand + cart par IDs | Élevé | Moyen |
| 6 | Supprimer imports inutilisés et activer `noUnused*` | Élevé | Faible |
| 7 | Lazy-load VoiceAssistant uniquement après ouverture | Élevé | Moyen |
| 8 | Découper `StoreFront`, `Profile`, `MegaMenuManager` | Élevé | Moyen |
| 9 | Colonnes explicites Supabase | Élevé | Faible |
| 10 | Rate limiting HTTP sur IA/search/payments/events | Élevé | Moyen |
| 11 | Job queue vectorisation | Moyen/Élevé | Élevé |
| 12 | Service worker : corriger condition origine/images | Moyen | Faible |
| 13 | Ajouter cache TTL et versioning SW | Moyen | Moyen |
| 14 | Mémoriser calculs checkout/catalogue | Moyen | Faible |
| 15 | Virtualiser tables admin longues | Moyen | Moyen |
| 16 | Optimiser images avec dimensions/lazy/placeholder | Moyen | Moyen |
| 17 | Ajouter indexes produits catégories/stock | Moyen | Faible |
| 18 | Remplacer `ScriptProcessorNode` par AudioWorklet | Moyen | Moyen |
| 19 | Ajouter CDN/cache headers images | Moyen | Moyen |
| 20 | Observabilité Sentry + tracing API | Moyen | Moyen |

---

## 14. Audit DevOps

### Points existants

- Scripts `dev`, `build`, `start`, `lint`, `test`.
- Validation env en production pour Supabase, Gemini et Stripe.
- `.env.example` documente les clés nécessaires.
- `vercel.json` définit rewrite SPA et cache immutable pour assets.

### Manques

- Pas de CI visible dans le dépôt.
- Pas de Sentry.
- Pas de métriques Prometheus/OpenTelemetry.
- Pas de tracing distribué.
- Pas de stratégie backup Supabase automatisée visible.
- Pas de secret scanning.
- Pas de `npm audit` exploitable dans l’environnement actuel.
- Pas de tests e2e checkout/webhook.

---

## 15. Audit UX

### Points forts

- Checkout en étapes clair.
- Récapitulatif commande sticky avec garanties.
- Assistant vocal + fallback texte.
- PWA install prompt + offline indicator via `usePWA`/`useServiceWorker`.

### Frictions

- Si Supabase est configuré mais utilisateur non connecté, Ava exige connexion. Pour un e-commerce, cela réduit la découverte anonyme.
- Paiement réel dépend d’un backend Stripe configuré ; message local OK, mais pas de fallback “demande de devis / réserver”.
- Le checkout peut afficher total remisé côté UI mais le flux Stripe calcule depuis items catalogue sans discount serveur.
- PWA offline ne synchronise pas réellement le panier ; `syncCart()` est placeholder.

---

## 16. Roadmap technique

### Top 20 correctifs immédiats

| # | Problème | Gravité | Effort | Impact |
|---:|---|---|---:|---|
| 1 | Précréer commande pending avant PaymentIntent | Critique | Élevé | Très élevé |
| 2 | Corriger `/api/events` colonnes `event_name/properties` | Élevée | Faible | Élevé |
| 3 | Comparer montant Stripe webhook vs commande | Élevée | Moyen | Très élevé |
| 4 | Retirer `unsafe-inline` de CSP prod | Élevée | Moyen | Élevé |
| 5 | Ajouter rate limits HTTP `/api/products/search`, `/api/events`, `/api/payments/create-intent` | Élevée | Moyen | Élevé |
| 6 | Ne plus envoyer contexte catalogue depuis client | Élevée | Moyen | Élevé |
| 7 | Remplacer admin mutations directes par endpoints serveur critiques | Élevée | Élevé | Très élevé |
| 8 | Corriger bug Service Worker origine/images | Moyenne | Faible | Moyen |
| 9 | Corriger icônes PWA notification `.png` inexistantes | Moyenne | Faible | Moyen |
| 10 | Colonnes explicites Supabase | Moyenne | Faible | Élevé |
| 11 | Activer `noUnusedLocals` progressivement | Moyenne | Faible | Moyen |
| 12 | Nettoyer imports inutilisés | Faible/Moyenne | Faible | Moyen |
| 13 | RPC admin stats au lieu de polling `.select('*')` | Moyenne | Moyen | Élevé |
| 14 | Ajouter tests webhook paiement en avance | Élevée | Moyen | Élevé |
| 15 | Ajouter tests e2e checkout | Élevée | Moyen | Élevé |
| 16 | Ajouter Sentry backend/frontend | Moyenne | Moyen | Élevé |
| 17 | Ajouter audit_events sur mutations admin | Moyenne | Moyen | Élevé |
| 18 | Expiration/libération stock reservations | Élevée | Élevé | Très élevé |
| 19 | Job queue vectorisation | Moyenne | Élevé | Moyen |
| 20 | Secret scanning CI | Moyenne | Faible | Élevé |

### Top 20 refactors recommandés

| # | Refactor | Difficulté | Gain |
|---:|---|---:|---:|
| 1 | Découper `server.ts` par domaines | Moyen | Très élevé |
| 2 | Slices Zustand | Moyen | Très élevé |
| 3 | Panier par IDs + snapshots | Moyen | Élevé |
| 4 | Services API frontend centralisés | Moyen | Élevé |
| 5 | Hooks Supabase par ressource | Moyen | Élevé |
| 6 | Admin route tabs en lazy imports | Moyen | Élevé |
| 7 | `StoreFront` en sections composées | Moyen | Élevé |
| 8 | `Profile` en sous-pages/cards | Moyen | Élevé |
| 9 | `MegaMenuManager` en sous-composants | Moyen | Élevé |
| 10 | `ProductForm` en sections contrôlées | Moyen | Élevé |
| 11 | Schémas validation partagés | Moyen | Élevé |
| 12 | Layer repository Supabase côté serveur | Moyen | Élevé |
| 13 | Payment state machine | Élevé | Très élevé |
| 14 | Event tracking typed | Faible | Moyen |
| 15 | Queue vectorization | Élevé | Élevé |
| 16 | Rate limiter distribué | Moyen | Élevé |
| 17 | AudioWorklet | Moyen | Moyen |
| 18 | Tests de policies RLS par scénario | Moyen | Très élevé |
| 19 | Observability middleware OpenTelemetry | Moyen | Élevé |
| 20 | Feature flags premium | Moyen | Moyen |

---

## 17. Top 5 fonctionnalités premium réalistes

### 17.1 Concierge IA personnalisé avec mémoire d’achat

**Description** : assistant Ava qui recommande selon historique commandes, wishlist, tailles/préférences, budget, allergies/contraintes.

**Cas d’usage** : “Je veux un cadeau similaire à ma dernière commande, mais plus premium.”

**Impact business** : hausse conversion, panier moyen, réachat.

**Impact UX** : expérience boutique haut de gamme, conseils contextualisés.

**Architecture technique** :

- Backend `/api/ai/recommendations`.
- Supabase : `customer_preferences`, `recommendation_events`.
- pgvector : embeddings produits + préférences.
- RLS stricte self/admin.

**Tables SQL :**

```sql
create table public.customer_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_categories text[] default '{}',
  budget_min numeric(10,2),
  budget_max numeric(10,2),
  notes text,
  updated_at timestamptz default now()
);

alter table public.customer_preferences enable row level security;

create policy customer_preferences_self
on public.customer_preferences
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

**Sécurité** : minimisation PII, pas de prompt brut stocké, opt-out.

**Estimation** : 7–10 jours.  
**Priorité** : P1.

### 17.2 Réservation de stock premium / paiement garanti

**Description** : réserver le stock pendant 15 minutes pendant le paiement.

**Impact business** : réduit ventes perdues et incidents paiement/stock.

**Architecture** :

- `stock_reservations`.
- `checkout_attempts`.
- Cron expiration.
- Webhooks Stripe libèrent/confirment.

```sql
create table public.stock_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  product_id text not null references public.products(id),
  quantity int not null check (quantity > 0),
  status text not null check (status in ('held','confirmed','released','expired')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index stock_reservations_active_idx
on public.stock_reservations(product_id, expires_at)
where status = 'held';
```

**Estimation** : 8–12 jours.  
**Priorité** : P0/P1.

### 17.3 Checkout VIP avec livraison premium planifiée

**Description** : choix créneau livraison, emballage cadeau, message personnalisé, suivi premium.

**Frontend** : étape livraison enrichie, upsell gift wrap.

**Backend** : `/api/shipping/slots`, `/api/orders/:id/delivery-options`.

**Supabase** : `delivery_slots`, `gift_options`, `shipments`.

**Sécurité** : créneaux validés serveur, anti double réservation.

**Estimation** : 6–9 jours.  
**Priorité** : P2.

### 17.4 Recherche multimodale IA premium

**Description** : recherche “trouve-moi une pièce comme cette photo” ou “style minimaliste vert”.

**Architecture** :

- Upload image temporaire.
- Embeddings texte/image.
- Matching pgvector.
- Moderation image.

**Frontend** : bouton recherche image, résultats avec explication.

**Backend** : `/api/search/multimodal`, quotas par user.

**Supabase** : `search_events`, `visual_embeddings` optionnel.

**Sécurité** : validation MIME, taille, antivirus si production, suppression automatique.

**Estimation** : 10–15 jours.  
**Priorité** : P2.

### 17.5 Programme fidélité premium avec statuts

**Description** : tiers Bronze/Silver/Gold/Private Client, avantages, early access, cadeaux.

**Frontend** : dashboard fidélité profil, badges statut, avantages checkout.

**Backend** : calcul points après paiement webhook uniquement, rules engine promotions.

```sql
create table public.loyalty_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  order_id uuid references public.orders(id),
  points int not null,
  reason text not null,
  created_at timestamptz default now()
);

create index loyalty_ledger_user_time_idx
on public.loyalty_ledger(user_id, created_at desc);
```

**Sécurité** : points attribués uniquement via webhook signé / serveur, jamais client.

**Estimation** : 7–11 jours.  
**Priorité** : P1/P2.

---

## 18. Dépendances critiques

Les dépendances principales incluent React 19, Vite 6, Express 4, Supabase JS, Gemini SDK, Stripe via fetch/Stripe.js externe, Zustand, ws, motion et lucide-react.

### Risques dépendances

- `lucide-react` est isolé en chunk `vendor-icons`, mais le build montre un chunk très lourd.
- `express` 4 fonctionne mais migration future vers Express 5 à planifier.
- Stripe SDK serveur n’est pas utilisé ; webhook est implémenté manuellement. C’est acceptable mais augmente la responsabilité de maintenance.
- `npm audit` et `npm outdated` n’ont pas pu vérifier les vulnérabilités/versions à cause d’erreurs registry 403.

---

## 19. Diagrammes logiques des flux

### 19.1 Flux utilisateur catalogue

```text
App mount
  → initSession()
  → fetchProducts()
  → fetchCategories()
  → StoreFront
  → ProductCard
  → addToCart()
  → cart persisté Zustand
```

### 19.2 Flux API

```text
Frontend
  → /api/health
  → /api/payments/create-intent
  → /api/payments/webhook
  → /api/events
  → /api/products/enhance-description
  → /api/products/vectorize
  → /api/products/search
```

### 19.3 Flux paiement

```text
PaymentForm
  → create-intent
    → calculatePaymentAmountCents()
    → Stripe PaymentIntent
  → Stripe.js confirmPayment()
  → checkout()
    → create_order_with_items RPC
    → payments row
  → webhook
    → update payments
    → update orders.payment_status
```

### 19.4 Flux IA

```text
VoiceAssistant
  → WebSocket /live?token=
  → serveur vérifie token
  → Gemini Live session
  → prompt système Ava
  → message utilisateur
  → skillsEngine trigger
  → semanticSearchProducts
  → contexte injecté
  → functionCall addToCart
  → client exécute addToCart
```

### 19.5 Flux base de données

```text
Browser Supabase client
  → products/categories public-ish reads
  → profiles self
  → addresses self
  → wishlist self
  → checkout RPC

Server Supabase admin/anon
  → payment amount validation
  → webhook reconciliation
  → events insert
  → vectorization
  → semantic search
```

---

## 20. Tests et commandes exécutés pendant l’audit

- `npm run lint` — succès.
- `npm test` — succès.
- `npm run build` — succès, avec avertissement chunks >500 kB.
- `npx tsc --noEmit --noUnusedLocals --noUnusedParameters --pretty false` — échec volontaire de contrôle qualité : nombreux imports/variables inutilisés détectés.
- `npx depcheck --json` — impossible : registry npm retourne `403 Forbidden`.
- `npm audit --omit=dev --json` — impossible : endpoint audit npm retourne `403 Forbidden`.
- `npm outdated --json` — impossible : registry npm retourne `403 Forbidden`.
- Script Python local de comptage des fichiers TypeScript/TSX volumineux — succès.
- `rg --files -g '!node_modules' -g '!dist' -g '!build'` — succès.
- `rg -n "API_KEY|SECRET|SERVICE_ROLE|STRIPE|OPENROUTER|SUPABASE|password|sk_|pk_|whsec|Bearer" -g '!package-lock.json' -g '!dist' -g '!node_modules' .` — succès.
- `rg -n "event_type|event_name|properties|payload" supabase src server.ts` — succès.
- `git status --short` — utilisé avant création de ce fichier.
