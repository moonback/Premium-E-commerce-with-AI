Je vais d'abord faire une analyse exhaustive du codebase avant de te donner mes recommandations.

Let me do a comprehensive parallel exploration of the entire codebase.

Now let me read all the core source files in parallel batches.

Here's the comprehensive picture of this codebase:

---

## Véridian — Comprehensive Architecture Analysis

### 1. Overall Architecture & Folder Structure

This is a **full-stack monorepo** — a single repo runs both the Node/Express backend and the React frontend, served from one process via Vite middleware in dev.

```
root/
├── server.ts           # Express + WebSocket server (single entry point for dev+prod)
├── src/
│   ├── App.tsx         # Root: routes, lazy loading, session init
│   ├── store.ts        # Zustand global store (~500 lines)
│   ├── types.ts        # All shared TypeScript types
│   ├── main.tsx        # React DOM entry, BrowserRouter
│   ├── pages/          # 13 route-level pages (all lazy-loaded)
│   ├── components/     # 57 .tsx UI components
│   │   ├── admin/      # 10 admin-specific components
│   │   └── ui/         # 14 design system primitives
│   ├── lib/            # Core utilities and services
│   ├── services/       # Checkout + payment security (testable pure functions)
│   ├── hooks/          # 4 custom hooks
│   └── styles/tokens/  # Design token system
├── prompts/
│   ├── ava-system.md   # Ava's system prompt (hot-loaded from filesystem)
│   └── skills/         # 5 auto-triggered skill files (YAML+MD)
└── supabase/migrations/ # Versioned SQL migrations
```

**Dev mode**: `npm run dev` runs `tsx server.ts`, which starts Express on port 3000 and Vite as middleware — one process serves both API and frontend with HMR.  
**Prod**: Vite builds the SPA to `dist/`, Express serves the static bundle and handles API routes.

---

### 2. State Management

**Zustand v5** with the `persist` middleware. Everything is in a single store (`src/store.ts`).

```ts
export const useStore = create<AppState>()(
  persist(
    (set, get) => ({ ... }),
    {
      name: 'store-session',
      partialize: (state) => ({ cart: state.cart, favorites: state.favorites })
      // Only cart + favorites survive page refresh
    }
  )
);
```

**What's in the store:**
- `products` / `categories` — fetched from Supabase on mount
- `cart` / `favorites` / `wishlist` — cart + favorites persisted to localStorage
- `user` / `isSessionLoading` / `isAuthModalOpen` / `isCartOpen` — UI + auth state
- `checkoutInfo` / `discountCode` / `discountAmount` — checkout flow state
- `loyaltyPoints`, `addresses`, `lastOrderId`, `lastOrderNumber`
- All actions: `addToCart`, `checkout`, `initSession`, `fetchProducts`, `fetchWishlist`, etc.

No Redux, no React Context (except `ToastProvider`).

---

### 3. Key Components & Their Responsibilities

| Component | Role |
|---|---|
| `StoreLayout` | Shell wrapping storefront routes: Header + Footer + CartDrawer + BottomNav |
| `Header` | Sticky nav with MegaMenu, search modal, user dropdown, cart FAB, loyalty points |
| `VoiceAssistant` | Floating AI assistant (Ava) — WebSocket to Gemini Live, voice + text modes, function calling |
| `CartDrawer` | Side panel cart with promo codes, product recommendations, free shipping bar |
| `ProductCard` | Grid card with optimized image, quick view modal, wishlist, hover animations |
| `AuthModal` | Supabase email/password login or signup modal |
| `ProtectedRoute` | Route guard checking user + role from Zustand |
| `CheckoutStepper` | 3-step checkout orchestrator (cart → delivery → payment) |
| `PaymentForm` | Stripe Payment Element, creates PaymentIntent via `/api/payments/create-intent` |
| `ClientDeliveryForm` | Delivery address form (step 2 of checkout) |
| `SEO` | React-based meta tags injection (title, OG, JSON-LD, canonical) |
| `AdminDashboard` / `AdminOrdersList` / etc. | Full back-office UI with separate tab components |
| `VectorizationPanel` | Admin UI for triggering AI embedding generation with progress bars |
| `MegaMenu` | Dynamic mega menu loaded from `mega_menu_items` Supabase table |
| `PWAInstallPrompt` / `OfflineIndicator` | PWA install banner + offline status |
| `OptimizedImage` | Lazy-loaded image component |
| `ProductRecommendations` | Cross-sell block shown in cart |

**Admin sub-components** (`src/components/admin/`): `AdminSidebar`, `AdminHeader`, `AdminStatsCards`, `ProductsTable`, `ProductForm`, `CategoriesManager`, `MegaMenuManager`, `AdminShipping`, `CsvImportExport`, `VectorizationPanel`.

---

### 4. Routing Setup

**React Router v7**, all routes in `App.tsx`. All pages are `React.lazy()` + `<Suspense>` with `AnimatePresence` for transitions.

```
/                  → StoreFront         (public, inside StoreLayout)
/product/:id       → ProductDetail      (public, SEO slug or raw ID)
/checkout          → Checkout           (public)
/order-confirmation → OrderConfirmation (public)
/profile           → Profile            (ProtectedRoute: customer+)
/contact           → Contact            (public)
/mentions-legales  → MentionsLegales    (public)
/cgv               → CGV                (public)
/livraison         → Livraison          (public)
/pos               → POS                (ProtectedRoute: staff | admin)
/admin             → Admin              (ProtectedRoute: admin)
/screen            → StoreScreen        (ProtectedRoute: kiosk | admin)
*                  → NotFound
```

Route protection is role-based via `ProtectedRoute` which reads `user.role` from Zustand. Unauthenticated users are redirected to `/` with `state.from` preserved.

---

### 5. Supabase Integration

**`src/lib/supabase.ts`**: Creates a single browser-side Supabase client from `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`. Returns `null` gracefully if keys aren't set (full offline/local mode supported).

**Server-side** (`server.ts`): Two clients — `supabaseAuth` (anon key) for user verification, `supabaseAdmin` (service role key) for privileged writes (webhook reconciliation, vectorization). Admin key is optional — falls back to auth token propagation.

**Data access patterns:**
- Direct Supabase calls from the browser for: products, categories, orders, profiles, addresses, wishlist, reviews, discount codes
- Server-side Supabase calls for: Stripe webhook reconciliation, vectorization writes, event tracking

**Supabase features used:**
- `supabase.auth` — JWT sessions, `onAuthStateChange`
- `supabase.from()` — standard CRUD
- `supabase.rpc()` — `create_order_with_items`, `validate_discount_code`, `match_products` (pgvector ANN search)
- `supabase.storage` — product image uploads
- RLS policies on all sensitive tables (documented in `docs/`)

---

### 6. Performance Patterns

- **`React.lazy()` on all 13 pages** — zero-cost code splitting at route level
- **`<Suspense>` with fallback** — unified `RouteFallback` spinner
- **`AnimatePresence mode="wait"`** — page transitions don't double-render
- **`useReducedMotion` hook** — respects `prefers-reduced-motion`, skips all animations
- **`OptimizedImage` component** — lazy loading on images
- **`ProductCardSkeleton`** — skeleton screens during product loading
- **`useStoreSettings` + `useShippingCarriers`** — module-level memory cache (`let _cache`) prevents repeated Supabase round-trips across page navigations
- **`useIntersectionObserver`** — used in `ProductDetail` for sticky CTA visibility
- **`whileInView` animations** with `viewport={{ once: true }}` — only animates elements once
- **Embedding batches with `Promise.allSettled`** and 300ms delays between batches to avoid API rate limits

---

### 7. TypeScript Usage

TypeScript throughout — strict typing everywhere. Key patterns:

- **`src/types.ts`**: Single source of truth for all domain types: `Product`, `CartItem`, `User`, `UserRole`, `CheckoutInfo`, `MegaMenuItem`, `ShippingCarrier`, `StoreSettings`, `SEOData`, etc.
- **Services are typed with interfaces**: `CheckoutSupabaseClient` abstracts the Supabase client for testability, allowing unit tests without a real DB
- **`normalizeUserRole()`** guards against arbitrary role escalation from DB
- **Server types**: `StripePaymentIntent`, `LiveRateRecord`, `SitemapProductRow` — all explicit
- **`paymentSecurity.ts`**: Pure functions with full type signatures for testability
- Dev dependency: `typescript ~5.8.2`, `tsc --noEmit` as lint script

---

### 8. Package.json Dependencies

**Runtime:**
| Package | Purpose |
|---|---|
| `react@19` + `react-dom@19` | UI framework (latest) |
| `react-router-dom@7` | Routing |
| `zustand@5` | State management |
| `@supabase/supabase-js@2` | Database + Auth |
| `@google/genai@2` | Gemini AI (Live API + Embeddings) |
| `motion@12` | Animations (formerly Framer Motion) |
| `react-hot-toast@2` | Toast notifications |
| `lucide-react@0.546` | Icons |
| `tailwindcss@4` | CSS framework |
| `@tailwindcss/vite@4` | Tailwind v4 Vite integration |
| `tailwind-merge@3` + `clsx@2` | Conditional className utilities |
| `express@4` | HTTP server |
| `ws@8` | WebSocket server (Gemini Live relay) |
| `date-fns@4` | Date formatting |
| `dotenv@17` | Env file loading |

**Dev:**
| Package | Purpose |
|---|---|
| `vite@6` | Build tool + dev server |
| `@vitejs/plugin-react@5` | React Fast Refresh |
| `tsx@4` | TypeScript execution for server.ts |
| `esbuild@0.25` | Server bundle compilation |
| `typescript@5.8` | Type checking |
| `autoprefixer@10` | CSS vendor prefixes |

---

### 9. Vite Config

Vite is configured inline at runtime inside `server.ts` (no separate `vite.config.ts`):

```ts
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "spa",
});
app.use(vite.middlewares);
```

Tailwind v4 is loaded via the `@tailwindcss/vite` plugin (added automatically since it's a peer of `tailwindcss`). The entry point is `index.html` → `src/main.tsx`.

---

### 10. Hooks, Utilities, Services

**Hooks (`src/hooks/`):**
- `usePWA()` — `beforeinstallprompt` event, online/offline status, deferred install
- `useServiceWorker()` — SW registration + update detection
- `useStoreSettings()` — loads + caches `store_settings` from Supabase with fallback defaults
- `useShippingCarriers(cartTotal?)` — loads + caches active carriers, computes effective price with free shipping threshold
- `useReducedMotion()` — `prefers-reduced-motion` media query watcher

**Lib (`src/lib/`):**
- `supabase.ts` — browser Supabase client (nullable)
- `embeddingService.ts` — Gemini REST embedding generation, product vectorization batches, pgvector semantic search, Ava result formatter
- `skillsEngine.ts` — loads/parses skill `.md` files with YAML frontmatter, detects active skills from user messages via keyword matching (no external YAML parser)
- `seo.ts` — `slugify`, `getProductPath`, `buildProductJsonLd`, `buildStoreJsonLd`, `buildCanonicalUrl`, `findProductByRouteParam`
- `promotions.ts` — `getEffectivePrice`, `isPromotionActive`, `getDiscountPercentage`, `getPromotionLabel`, `isPromotionEndingSoon`, `getPromotionTimeRemaining`
- `utils.ts` — `cn(...)` (clsx + tailwind-merge)
- `errors.ts` — `getErrorMessage(error, fallback)` — safe error message extraction

**Services (`src/services/`):**
- `checkoutService.ts` — `createCheckoutOrder()` wraps Supabase RPC `create_order_with_items`, syncs profile address, fully testable via `CheckoutSupabaseClient` interface
- `paymentSecurity.ts` — server-side payment validation: `normalizePaymentItems`, `calculatePaymentAmountCents` (price verification from DB, not client), `createCartHash`, `getStripeWebhookPayload` (HMAC timing-safe verification), `createStripeIdempotencyKey`, `toPaymentStatus`

---

### 11. Authentication Flow

1. **Init**: On app mount, `App.tsx` calls `initSession()` → `supabase.auth.getSession()` checks for existing JWT
2. **Profile loading**: `fetchUserProfile(userId, email)` reads `profiles` table. If profile missing (new user) → inserts with `role: 'customer'`. Elevated roles can only be assigned server-side
3. **Auth state**: `supabase.auth.onAuthStateChange()` keeps Zustand in sync for all events (login, logout, token refresh)
4. **Login/Signup**: Via `AuthModal` → `supabase.auth.signInWithPassword()` or `signUp()`
5. **Logout**: `supabase.auth.signOut()` + `setUser(null)` in store
6. **Route protection**: `ProtectedRoute` reads `user` + `user.role` from Zustand. Shows loading state while `isSessionLoading` is true, redirects to `/` if unauthorized
7. **API auth**: Protected server endpoints extract `Authorization: Bearer <token>` header, verify with `supabaseAuth.auth.getUser(token)`, then check role in `profiles` table
8. **Fallback**: If Supabase is not configured, `AuthModal` creates a local `customer` user (no elevated roles possible locally)

---

### 12. AI Features

There are **three distinct AI systems** in this app:

#### A. Ava — Voice Assistant (Gemini Live API)
- **Transport**: WebSocket at `/live`, proxied by the Express server to Gemini Live API (`gemini-3.1-flash-live-preview`)
- **Voice**: Bidirectional audio — client sends PCM16 at 16kHz via `ScriptProcessorNode`, server streams back PCM16 at 24kHz (voice "Aoede")
- **Text fallback**: If mic is denied, falls back to text input mode (sends via the same WS)
- **Function calling**: `addToCart(productId, quantity)` declared as a Gemini tool. When Ava decides to add to cart, server relays a `functionCall` event to the client, client executes it on the Zustand store and sends back a `functionResponse`
- **Context injection**: On session open, client sends the in-stock catalog as text context. On each user message, the server:
  1. Detects active skills (keyword matching) and injects their Markdown instructions silently
  2. Runs pgvector semantic search and injects the top 6 matching products silently
- **Rate limiting**: 5 sessions per IP per 10 minutes, max 2 concurrent, max 2 minutes per session
- **System prompt**: Loaded from `prompts/ava-system.md` at server startup via `skillsEngine`
- **Quick suggestions**: 4 preset chips in the UI panel

#### B. Skills Engine (Contextual Instructions)
- **Location**: `src/lib/skillsEngine.ts` + `prompts/skills/*.md`
- **How it works**: Each skill is a Markdown file with a YAML frontmatter (`name`, `triggers[]`, `priority`). The engine loads them at startup, normalizes triggers (strips accents), and scans incoming user messages for keyword matches. Matching skills' content is injected as silent system context into the Gemini session
- **Skills**: `recommandation`, `panier`, `prix`, `stock`, `description`
- **Extensible**: Add a `.md` file to `prompts/skills/` — no code changes needed

#### C. AI Product Description Enhancement
- **Endpoint**: `POST /api/products/enhance-description` (admin/staff only)
- **Model**: OpenRouter → `openai/gpt-oss-120b:free` (separate from Gemini)
- **Prompt**: Premium e-commerce copywriter persona, strict format guidelines (80-150 words, French, SEO-optimized)

#### D. Semantic Search / pgvector Embeddings
- **Model**: `gemini-embedding-2`, 1536 dimensions (`outputDimensionality` truncated from 3072)
- **Storage**: `products.embedding vector(1536)` column, HNSW cosine index in Supabase
- **Vectorization**: Admin triggers via `VectorizationPanel` → `POST /api/products/vectorize`. Batches of 10 products, 300ms delay between batches
- **Search**: `match_products` SQL function (pgvector ANN via HNSW) exposed as Supabase RPC, called from `GET /api/products/search` and injected live into Ava's context
- **Admin UI**: `VectorizationPanel` shows coverage stats (vectorized vs. total), progress bar, per-product and bulk vectorization buttons

---

### Design System

The app uses a custom editorial aesthetic called "Véridian":
- **Colors**: `bg: #F9F7F2` (eggshell), `ink: #1C2B21` (dark green), `softGreen: #E8EDE8`, `accent: #B08D57` (golden)
- **Typography**: Playfair Display (serif) + Inter (sans-serif)
- **Motion**: Framer Motion v12 (`motion` package) — spring animations, `AnimatePresence`, `whileInView`, `layoutId` for shared layout transitions
- **Design tokens** in `src/styles/tokens/` — colors, typography, motion, layers — codified as TypeScript constants
- **Component library** in `src/components/ui/`: Button, Input, Textarea, Select, Badge, Dialog, Drawer, Tabs, Toast, Tooltip, Loading, Skeleton

J'ai maintenant une vision complète et détaillée de l'application. Voici l'audit exhaustif.

---

# 🔍 Audit Exhaustif — Véridian Premium E-commerce

## 1. Architecture & Structure du Code

### Points positifs
L'architecture est globalement solide pour un projet de cette taille. Monorepo fullstack (Express + Vite) sur un seul process, lazy-loading de toutes les pages, design system de tokens, services séparés (`checkoutService`, `paymentSecurity`).

### Problèmes identifiés

**🔴 Store Zustand monolithique (`store.ts` ~500 lignes)**
Un seul store contient tout : cart, user, produits, catégories, addresses, wishlist, checkout, loyaltyPoints. Tout composant qui `useStore()` re-render sur **n'importe quel** changement d'état non sélectionné.

```ts
// ❌ Actuel — subscribe à tout le store
const { products, cart, user, wishlist } = useStore();

// ✅ Correct — sélecteurs atomiques
const products = useStore(state => state.products);
const cart = useStore(state => state.cart);
```

La bonne nouvelle : `ProductCard`, `VoiceAssistant` et `Header` utilisent déjà la syntaxe sélecteur. Mais `StoreFront` fait encore `const { products, categories, searchQuery, isLoadingProducts } = useStore()` avec destructuring, ce qui est acceptable avec Zustand v5 (il utilise les sélecteurs internes) — mais le pattern mérite d'être uniformisé.

**🟡 `Admin.tsx` — God Component (~250 lignes)**
La page Admin orchestre 12+ onglets et contient des handlers métier (upload image, save product, delete category). Elle devrait être un routeur d'onglets pur, délégant toute la logique aux sous-composants.

```tsx
// ❌ Admin.tsx gère l'upload d'image directement
const handleImageUpload = async (file: File) => {
  const fileName = `${Math.random()}.${fileExt}`; // ⚠️ Math.random() non-crypto
  // ... 20 lignes de logique
};

// ✅ Déplacer dans ProductForm ou un hook useImageUpload()
```

**🟢 `src/lib/skillsEngine.ts` imbriqué dans le frontend mais utilisé côté serveur**
Ce fichier fait `readFileSync` et `readdirSync` — il ne peut pas tourner dans le browser. Il est importé uniquement depuis `server.ts`, donc OK, mais sa localisation dans `src/lib/` est trompeuse. Il devrait être dans `server/lib/` ou `lib/server/`.

---

## 2. Qualité du Code

### Anti-patterns trouvés

**🔴 `Math.random()` pour les noms de fichiers uploadés**
```ts
// Admin.tsx ligne ~130
const fileName = `${Math.random()}.${fileExt}`;
```
`Math.random()` n'est pas cryptographiquement sûr et peut produire des collisions. Utilise `crypto.randomUUID()` (disponible dans les browsers modernes) :
```ts
import { v4 as uuidv4 } from 'uuid'; // ou
const fileName = `${crypto.randomUUID()}.${fileExt}`;
```

**🟡 Type `any` explicite dans `CartDrawer.tsx`**
```ts
} catch (err: any) {
  setPromoError(err.message || 'Erreur de validation');
```
Utilise `getErrorMessage()` qui est déjà disponible dans `src/lib/errors.ts`.

**🟡 `window.confirm()` pour les suppressions dans `Admin.tsx`**
```ts
if (!window.confirm("Supprimer ce produit ?")) return;
```
`window.confirm()` est bloquant, non stylable, et mauvaise UX. Remplacer par un `Dialog` de confirmation — vous avez déjà `src/components/ui/Dialog.tsx`.

**🟡 Type `ProductUpsertPayload` déclaré mais jamais utilisé** (signalé par le linter)

**🟡 Testimonials hardcodés dans `StoreFront.tsx`**
```tsx
{[
  { name: 'Sophie Martin', role: 'Cliente fidèle', text: '...' },
  // ...
].map(...)}
```
Ces données devraient venir de Supabase (`reviews` table) ou a minima d'un fichier de constantes séparé.

**🟡 Newsletter handler avec `console.log` + `alert()`**
```ts
const handleNewsletterSubmit = (e: React.FormEvent) => {
  console.log('Newsletter subscription:', email); // ← à supprimer
  alert('Merci pour votre inscription !');        // ← remplacer par toast
};
```

**🟢 `useEffect` de deps manquantes dans `Admin.tsx`**
```tsx
React.useEffect(() => {
  fetchStats(); // fetchStats est défini dans l'effet donc OK
  const interval = setInterval(fetchStats, 10000);
  return () => clearInterval(interval);
}, []); // ← les dépendances de fetchStats (supabase) ne changent pas, acceptable
```

**🟢 `ShoppingBagIcon` inline dans `CartDrawer.tsx`**
Une SVG component custom qui réplique exactement `ShoppingBag` de Lucide, déjà importée dans d'autres fichiers. Supprimer et utiliser l'import Lucide.

---

## 3. Gestion de l'État

### Analyse

Le store Zustand est bien structuré globalement mais souffre de plusieurs problèmes :

**🔴 `loyaltyPoints: 1250` hardcodé comme valeur initiale**
```ts
loyaltyPoints: 1250, // ← valeur par défaut fictive
```
Si l'utilisateur n'est pas connecté, il voit 1250 points qui disparaissent à la connexion. La valeur initiale devrait être `0`.

**🟡 Duplication cart/favorites — deux systèmes de favoris**
Il existe `favorites: string[]` (IDs locaux, persistés) ET `wishlist: WishlistItem[]` (server-side). Le champ `favorites` semble être un vestige. Le composant `ProductCard` utilise uniquement `wishlist`, ce qui est correct — mais `favorites` reste dans le store, persiste en localStorage, et crée de la confusion.

**🟡 `checkoutInfo.clientInfo.address` — champ composite redondant**
`CheckoutClientInfo` a à la fois `address?: string` et `addressLine1/city/postalCode/country`. Le champ `address` est une string libre concaténée et coexiste avec les champs structurés, ce qui crée des incohérences.

**🟡 Pas de `useCallback`/`useMemo` sur les actions du store passées comme props**
Dans `Admin.tsx`, `fetchStats` est recréé à chaque render (défini dans `useEffect`). Bien que Zustand garantisse la stabilité des actions, certains composants reçoivent des callbacks inline :
```tsx
onEdit={(product) => { setEditingProduct(product); setIsEditing(true); }}
```
Ces callbacks inline causent des re-renders inutiles sur `ProductsTable`.

**🟢 Suggestion : découper le store en slices**
```ts
// Zustand recommande les slices pour les gros stores
const useCartStore = create<CartSlice>()(...);
const useUserStore = create<UserSlice>()(...);
const useProductStore = create<ProductSlice>()(...);
// ou combiner avec le pattern slice Zustand
```

---

## 4. Expérience Utilisateur (UX)

### Points de friction identifiés

**🔴 Pas de `@types/react` installé**
Le linter signale `Could not find a declaration file for module 'react'` dans `Admin.tsx`. Bien que l'app compile, c'est un signal que les types React ne sont pas correctement installés en devDependencies, ce qui dégrade l'autocomplétion IDE et peut provoquer des erreurs surprises.

```bash
npm install --save-dev @types/react @types/react-dom
```

**🟡 Checkout multilingue incohérent**
Le checkout mélange français et anglais :
- `"← Back to store"` (anglais)
- `"Please complete the required fields before continuing."` (anglais)
- `"✅ Order placed! Thank you for your purchase."` (anglais)
Tous ces strings devraient être en français pour correspondre au reste de l'app.

**🟡 Pas de confirmation avant suppression de produit (UI native)**
`window.confirm()` est utilisé, ce qui bloque le thread UI et ne permet pas de personnalisation visuelle. À remplacer par le `Dialog` déjà disponible.

**🟡 `ProductCard` re-anime à chaque render**
```tsx
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
```
Ces animations se déclenchent à chaque re-render du parent, pas seulement au mount. Utiliser `whileInView` avec `once: true` comme dans `StoreFront.tsx`.

**🟡 Pas de feedback visuel sur le formulaire de livraison**
`ClientDeliveryForm` n'a pas de validation en temps réel — les erreurs n'apparaissent qu'à la soumission. Ajouter de la validation `onBlur`.

**🟢 `Header.tsx` — liens "Nouveautés", "Collections", "Promotions" pointent tous vers `/`**
Ces liens sont des placeholders. Soit les câbler sur des routes réelles (ex: `/?category=nouveau`), soit les retirer pour éviter la confusion.

**🟢 Pagination trop simple avec pages numérotées**
Sur mobile, si 10+ pages existent, la pagination déborde. Utiliser un pattern ellipse : `[1] [2] ... [8] [9] [10]`.

---

## 5. Fonctionnalités à Ajouter (Priorisées)

| # | Fonctionnalité | Valeur | Complexité |
|---|----------------|--------|------------|
| 1 | **Historique de commandes client enrichi** avec suivi de livraison et timeline de statut | ⭐⭐⭐⭐⭐ | 🟡 Moyen |
| 2 | **Système de reviews produits** (déjà le type `ProductReview` en DB) — affichage + formulaire de soumission | ⭐⭐⭐⭐⭐ | 🟡 Moyen |
| 3 | **Notifications temps réel** (commande confirmée, stock faible, promo) via Supabase Realtime | ⭐⭐⭐⭐ | 🟡 Moyen |
| 4 | **Programme de fidélité visible** — page dédiée avec historique des points, paliers et récompenses | ⭐⭐⭐⭐ | 🟡 Moyen |
| 5 | **Comparateur de produits** (component `ProductComparison.tsx` existe déjà) — l'intégrer dans `ProductDetail` | ⭐⭐⭐⭐ | 🟢 Facile |
| 6 | **Newsletter réelle** via Supabase (table `subscribers`) ou intégration Mailchimp/Brevo | ⭐⭐⭐ | 🟢 Facile |
| 7 | **Recherche sémantique dans la barre principale** — brancher `semanticSearchProducts()` (déjà implémentée) dans `AdvancedSearchModal` | ⭐⭐⭐⭐ | 🟢 Facile |
| 8 | **Filtres avancés persistants dans l'URL** (`?category=accessoires&min=20&max=100`) pour partage et SEO | ⭐⭐⭐ | 🟡 Moyen |
| 9 | **Mode maintenance admin** (le toggle existe dans `StoreSettings`) — implémenter la page de maintenance côté serveur | ⭐⭐⭐ | 🟢 Facile |
| 10 | **Internationalisation (i18n)** — unifier les strings FR/EN et préparer une structure `react-i18next` | ⭐⭐⭐ | 🔴 Complexe |

---

## 6. Performance & Optimisation

**🔴 `featuredProducts` recalculé avec `.sort()` mutant à chaque render**
```tsx
// StoreFront.tsx
const featuredProducts = products
  .sort((a, b) => (b.rating || 0) - (a.rating || 0)) // ← .sort() mute le tableau original
  .slice(0, 4);
```
`.sort()` en JavaScript mute le tableau d'origine. Utiliser `[...products].sort(...)` et envelopper dans `useMemo`.

```tsx
const featuredProducts = useMemo(
  () => [...products].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 4),
  [products]
);
```

**🟡 `ProductCard` non memoïsé mais rendu dans une liste**
Avec 12+ produits par page, chaque changement de `searchQuery` ou de `activeTab` re-render tous les `ProductCard`. Ajouter `React.memo` :
```tsx
export default React.memo(ProductCard);
```

**🟡 `Header` re-render sur tout changement de store**
```tsx
const { cart, user, loyaltyPoints, wishlist, setUser, setAuthModalOpen, setCartOpen } = useStore();
```
Séparer en sélecteurs atomiques pour éviter les re-renders inutiles quand les `products` changent.

**🟡 Polling toutes les 10 secondes dans `Admin.tsx`**
```tsx
const interval = setInterval(fetchStats, 10000);
```
Pour un admin dashboard, Supabase Realtime (`supabase.from('orders').on('*', ...)`) serait plus efficace et sans polling.

**🟢 Images sans lazy-loading natif**
`OptimizedImage.tsx` existe mais certains composants utilisent encore `<img>` directement (CartDrawer, Checkout). Vérifier que `loading="lazy"` est systématiquement appliqué.

**🟢 Bundle analysis manquant**
Ajouter `rollup-plugin-visualizer` pour détecter les dépendances lourdes dans le bundle :
```ts
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';
plugins: [visualizer({ open: true })]
```

---

## 7. Sécurité & Bonnes Pratiques

### Points positifs notables
- Validation HMAC Stripe côté serveur avec `timingSafeEqual` ✅
- Rate limiting sur les connexions WebSocket Gemini Live ✅
- Sanitisation des inputs texte dans `VoiceAssistant` ✅
- Redaction des champs sensibles dans les logs ✅
- Rôles utilisateurs normalisés côté serveur ✅
- Prix recalculés côté serveur (pas de confiance au client) ✅

### Failles et améliorations

**🔴 Clés API dans `.env` sans validation au démarrage**
Si `STRIPE_SECRET_KEY` ou `GEMINI_API_KEY` ne sont pas définies, les endpoints tombent silencieusement. Ajouter une validation de config au démarrage :
```ts
const required = ['SUPABASE_SERVICE_ROLE_KEY', 'GEMINI_API_KEY', 'STRIPE_SECRET_KEY'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
}
```

**🔴 `supabase` client peut être `null` — pas toujours vérifié**
Dans `CartDrawer.tsx` :
```tsx
if (!supabase) { setPromoError('Service non disponible'); return; }
```
C'est bien géré ici. Mais dans `store.ts`, `updateOrderStatus` fait :
```ts
if (supabase && get().user) {
  await supabase.from('orders').update({ status }).eq('id', orderId);
}
// Pas de feedback si supabase est null — l'update est silencieusement ignoré
```

**🟡 Pas de Content Security Policy (CSP)**
Le serveur Express ne définit pas de headers CSP. En production, des images Unsplash et des CDN externes sont chargés sans whitelist. Ajouter `helmet` :
```ts
import helmet from 'helmet';
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      imgSrc: ["'self'", "https://images.unsplash.com", "data:"],
      // ...
    }
  }
}));
```

**🟡 Absence de validation de taille de fichier pour les uploads d'images**
```ts
const { error: uploadError } = await supabase.storage
  .from('product-images')
  .upload(fileName, file); // ← pas de vérification de file.size ou file.type
```
Ajouter :
```ts
if (file.size > 5 * 1024 * 1024) throw new Error('Fichier trop volumineux (max 5MB)');
if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
  throw new Error('Format non supporté');
}
```

**🟢 `@types/react` manquant en devDependencies**
Confirmé par les diagnostics linter. À installer immédiatement.

---

## 8. Tests & Qualité

### État actuel
Tests existants :
- `checkoutService.test.ts` ✅
- `paymentSecurity.test.ts` ✅  
- `seo.test.ts` ✅
- Runner : Node.js natif avec `tsx`

### Zones critiques non couvertes

**🔴 Pas de tests pour `store.ts`** — logique de cart (quantités, totaux), wishlist optimistic updates, et l'auth flow sont des chemins critiques sans filet.

**🟡 Pas de tests pour `embeddingService.ts`** — la fonction `buildProductEmbeddingText` est pure et testable facilement.

**🟡 Pas de tests E2E** — le tunnel checkout (panier → livraison → paiement → confirmation) est le flux le plus critique de l'app et n'a aucun test end-to-end.

Stratégie recommandée :
```
Tests unitaires (existants, étendre) → checkoutService, paymentSecurity, store actions
Tests de composants → ProductCard, CartDrawer (avec Vitest + Testing Library)
Tests E2E → tunnel checkout complet (Playwright)
```

---

## 9. Configuration & Tooling

**🔴 `@types/react` et `@types/react-dom` manquants en devDependencies**

Vérifier `package.json` — ces types ne sont pas listés, ce qui explique les warnings linter.

**🟡 Pas de linter ESLint configuré**
`"lint": "tsc --noEmit"` fait uniquement le type-checking. Un vrai linting ESLint avec `eslint-plugin-react`, `eslint-plugin-react-hooks`, et `eslint-plugin-jsx-a11y` attraperait les anti-patterns et problèmes d'accessibilité automatiquement.

**🟡 Pas de formatage Prettier**
Le code est visuellement cohérent mais sans configuration Prettier partagée, les contributions futures créeront des diffs cosmétiques.

**🟢 Pas de CI/CD configuré**
Ajouter un workflow GitHub Actions minimal :
```yaml
# .github/workflows/ci.yml
- run: npm run lint
- run: npm test
- run: npm run build
```

**🟢 `vite.config.ts` non visible dans les fichiers fournis**
À vérifier : les optimisations de build (`build.rollupOptions.output.manualChunks`) pour séparer Framer Motion (lourd) et `@google/genai` dans des chunks distincts.

---

## 🎯 Top 5 Actions Prioritaires

### 1. 🔴 Installer `@types/react` et `@types/react-dom`
Correction immédiate (30 secondes) qui élimine tous les warnings IDE et garantit la sécurité des types React.
```bash
npm install --save-dev @types/react @types/react-dom
```

### 2. 🔴 Corriger le `.sort()` mutant dans `StoreFront.tsx`
Bug subtil qui peut causer des comportements imprévisibles sur la liste produits. Ajouter `[...products]` + `useMemo` — 5 minutes.

### 3. 🟡 Brancher la recherche sémantique dans `AdvancedSearchModal`
La valeur AI de l'app (`semanticSearchProducts`) est déjà implémentée côté serveur mais pas exposée dans la recherche principale. C'est la fonctionnalité différenciatrice la plus impactante à relier en ~2h de travail.

### 4. 🟡 Remplacer `window.confirm()` par le `Dialog` de confirmation
Trois occurrences dans `Admin.tsx`. Le composant `Dialog` est déjà prêt. Amélioration UX visible en ~1h.

### 5. 🟡 Ajouter CSP headers avec `helmet` + validation de config au démarrage
Deux lignes de sécurité critiques pour la production qui protègent contre les injections XSS et révèlent les variables d'env manquantes au boot plutôt qu'au runtime.

---

**Résumé** : Véridian est une application bien architecturée avec des fonctionnalités AI réellement différenciantes (Gemini Live, pgvector, skills engine). La dette technique principale est concentrée sur des détails de qualité (types manquants, strings EN/FR mélangés, une logique non-crypto pour les filenames) plutôt que sur des problèmes structurels profonds. Les priorités immédiates sont le fix des types React, la correction du `.sort()` mutant, et l'exposition de la recherche sémantique aux utilisateurs — car c'est votre avantage concurrentiel le plus fort.