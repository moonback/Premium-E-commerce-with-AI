# 🏗️ Architecture Système - Véridian E-commerce

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  React 19 + TypeScript + Vite                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Store    │  │  Admin   │  │   POS    │  │  Kiosk   │       │
│  │ Front    │  │Dashboard │  │  (Staff) │  │  Screen  │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │             │              │              │              │
│       └─────────────┴──────────────┴──────────────┘              │
│                          │                                       │
│                    Zustand Store                                 │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API / SERVER LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  Express Server (server.ts)                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   HTTP API   │  │  WebSocket   │  │   Webhooks   │         │
│  │   Routes     │  │   Real-time  │  │   (Stripe)   │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                  │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND SERVICES                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Supabase   │  │    Stripe    │  │Google Gemini │         │
│  │  PostgreSQL  │  │   Payments   │  │      AI      │         │
│  │  Auth + RLS  │  │   Webhooks   │  │Recommendations│        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                  │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
    [Database]          [Payment]          [AI Model]
```

---

## Frontend Architecture

### Structure des Composants

```
src/
├── App.tsx                    # Root component, routing
├── main.tsx                   # Entry point
├── store.ts                   # Zustand global state
│
├── pages/                     # Route components
│   ├── StoreFront.tsx        # Homepage + catalog
│   ├── ProductDetail.tsx     # Product page
│   ├── Checkout.tsx          # Checkout flow
│   ├── Profile.tsx           # User dashboard
│   ├── Admin.tsx             # Admin dashboard
│   ├── POS.tsx               # Point of sale
│   └── StoreScreen.tsx       # Kiosk display
│
├── components/                # Reusable components
│   ├── ui/                   # Base UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Toast.tsx
│   ├── ProductCard.tsx       # Product display
│   ├── Cart.tsx              # Shopping cart
│   ├── Header.tsx            # Navigation
│   ├── Footer.tsx            # Footer
│   ├── TrustBadges.tsx       # Trust elements
│   ├── SocialProof.tsx       # Social proof
│   └── ...
│
├── hooks/                     # Custom React hooks
│   ├── usePWA.ts             # PWA functionality
│   ├── useReducedMotion.ts   # Accessibility
│   └── ...
│
├── services/                  # Business logic
│   ├── checkoutService.ts    # Checkout flow
│   ├── paymentSecurity.ts    # Payment validation
│   └── ...
│
└── lib/                       # Utilities
    ├── supabase.ts           # Supabase client
    ├── stripe.ts             # Stripe client
    ├── seo.ts                # SEO helpers
    └── utils.ts              # General utilities
```

### Routing

**React Router v7** avec lazy loading :

```typescript
<Routes>
  <Route path="/" element={<StoreFront />} />
  <Route path="/product/:id" element={<ProductDetail />} />
  <Route path="/checkout" element={<Checkout />} />
  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
  <Route path="/admin" element={<ProtectedRoute role="admin"><Admin /></ProtectedRoute>} />
  <Route path="/pos" element={<ProtectedRoute role={["staff", "admin"]}><POS /></ProtectedRoute>} />
  <Route path="/screen" element={<ProtectedRoute role={["kiosk", "admin"]}><StoreScreen /></ProtectedRoute>} />
</Routes>
```

### State Management

**Zustand** pour le state global :

```typescript
interface AppState {
  // Products & Catalog
  products: Product[];
  categories: Category[];
  searchQuery: string;
  
  // Cart & Checkout
  cart: CartItem[];
  checkoutInfo: CheckoutInfo;
  discountCode: string | null;
  
  // User & Auth
  user: User | null;
  loyaltyPoints: number;
  wishlist: WishlistItem[];
  addresses: Address[];
  
  // UI State
  isAuthModalOpen: boolean;
  isCartOpen: boolean;
  
  // Actions
  addToCart: (product: Product) => void;
  checkout: () => Promise<string | null>;
  fetchProducts: () => Promise<void>;
  // ...
}
```

**Persistence** : Cart et favorites persistés dans localStorage via Zustand middleware.

---

## Backend / API

### Server Architecture (server.ts)

**Express** + **WebSocket** pour temps réel :

```typescript
// HTTP Server
app.use(express.json());
app.use(express.static('dist'));

// Routes
app.post('/api/stripe/webhook', handleStripeWebhook);
app.get('/api/health', healthCheck);

// WebSocket Server
wss.on('connection', (ws) => {
  // Real-time updates (orders, stock, notifications)
});
```

### Middlewares

1. **CORS** : Configuration pour domaines autorisés
2. **Body Parser** : JSON parsing
3. **Error Handler** : Gestion centralisée des erreurs
4. **Rate Limiting** : Protection DDoS (à implémenter)
5. **Logging** : Winston/Morgan (à implémenter)

### Authentication Flow

```
1. User submits credentials
   ↓
2. Supabase Auth validates
   ↓
3. JWT token returned
   ↓
4. Token stored in Zustand + localStorage
   ↓
5. Token sent in Authorization header
   ↓
6. Supabase RLS validates token
   ↓
7. Access granted/denied
```

---

## Base de Données

### Supabase PostgreSQL

**Tables principales** :

- `profiles` : Utilisateurs (extends auth.users)
- `products` : Catalogue produits
- `categories` : Catégories hiérarchiques
- `orders` : Commandes
- `order_items` : Lignes de commande
- `addresses` : Adresses de livraison
- `wishlist_items` : Liste de souhaits
- `product_reviews` : Avis produits
- `discounts` : Codes promo
- `stripe_payment_intents` : Réconciliation paiements

### Row Level Security (RLS)

**Principe** : Chaque table a des policies RLS pour sécuriser l'accès.

**Exemples** :

```sql
-- Users can only read their own orders
CREATE POLICY "orders_select_own_or_admin"
  ON orders FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Users can only insert their own wishlist items
CREATE POLICY "wishlist_self_insert"
  ON wishlist_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Migrations Strategy

**Additive only** : Jamais de DROP TABLE en production.

**Ordre d'exécution** :
1. Create tables
2. Add columns (IF NOT EXISTS)
3. Create indexes
4. Set RLS policies
5. Grant permissions

---

## Services Externes

### Stripe (Paiements)

**Flow** :
1. Client crée PaymentIntent (frontend)
2. Stripe retourne client_secret
3. Client confirme paiement (Stripe.js)
4. Webhook `payment_intent.succeeded` → serveur
5. Serveur valide signature webhook
6. Serveur crée commande en DB
7. Confirmation envoyée au client

**Sécurité** :
- Clés API séparées (publishable/secret)
- Webhook signature validation
- Idempotency keys
- Réconciliation via `stripe_payment_intents` table

### Google Gemini (IA)

**Utilisation** :
- Recommandations produits personnalisées
- Analyse des préférences utilisateur
- Génération de descriptions produits
- Chatbot support (à venir)

**API** :
```typescript
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
const result = await model.generateContent(prompt);
```

### Supabase Storage

**Utilisation** :
- Images produits
- Photos avis clients
- Documents (factures, etc.)

**Buckets** :
- `products` : Images produits (public)
- `reviews` : Photos avis (public)
- `documents` : Factures, etc. (private)

---

## Décisions d'Architecture

### Pourquoi React 19 ?

- **Concurrent rendering** : Meilleures performances
- **Server Components** : Prêt pour le futur
- **Automatic batching** : Moins de re-renders
- **Transitions** : UX fluide

### Pourquoi Zustand vs Redux ?

- **Simplicité** : Moins de boilerplate
- **Performance** : Sélecteurs optimisés
- **TypeScript** : Support natif excellent
- **Bundle size** : 1KB vs 10KB (Redux)

### Pourquoi Supabase vs Firebase ?

- **PostgreSQL** : SQL relationnel puissant
- **RLS** : Sécurité au niveau base de données
- **Open source** : Pas de vendor lock-in
- **Prix** : Plus économique à l'échelle

### Pourquoi Tailwind CSS ?

- **Utility-first** : Développement rapide
- **Purge CSS** : Bundle optimisé
- **Responsive** : Mobile-first par défaut
- **Customization** : Thème cohérent

### Pourquoi Vite vs Webpack ?

- **Vitesse** : HMR instantané
- **ESM natif** : Pas de bundling en dev
- **Build optimisé** : Rollup sous le capot
- **DX** : Configuration minimale

---

## Patterns & Best Practices

### Component Patterns

**Composition over inheritance** :
```typescript
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

**Custom hooks** pour logique réutilisable :
```typescript
const { isOnline, isInstalled } = usePWA();
const prefersReducedMotion = useReducedMotion();
```

### Error Handling

**Try/catch** avec messages utilisateur :
```typescript
try {
  await checkout();
  toast.success('Commande validée !');
} catch (error) {
  toast.error(getErrorMessage(error));
  console.error('Checkout failed:', error);
}
```

### Performance Optimization

1. **Code splitting** : Lazy loading des routes
2. **Image optimization** : WebP + lazy loading
3. **Memoization** : React.memo, useMemo, useCallback
4. **Virtual scrolling** : Pour longues listes
5. **Debouncing** : Recherche, filtres

### Security Best Practices

1. **Never trust client** : Validation serveur
2. **RLS everywhere** : Sécurité DB
3. **Sanitize inputs** : XSS prevention
4. **HTTPS only** : En production
5. **Secrets management** : Variables d'environnement

---

## Scalabilité

### Horizontal Scaling

- **Stateless server** : Peut être répliqué
- **Database pooling** : Supabase gère
- **CDN** : Assets statiques
- **Load balancer** : Nginx/Cloudflare

### Caching Strategy

1. **Browser cache** : Assets statiques (1 an)
2. **Service Worker** : PWA offline
3. **Supabase cache** : Queries fréquentes
4. **Redis** : Sessions, cart (à implémenter)

### Monitoring

**À implémenter** :
- **Sentry** : Error tracking
- **Google Analytics** : User behavior
- **Supabase Dashboard** : DB metrics
- **Stripe Dashboard** : Payment metrics

---

## Déploiement

### Environnements

1. **Development** : Local (localhost:5173)
2. **Staging** : Vercel/Netlify preview
3. **Production** : Vercel/Netlify + custom domain

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
on: [push]
jobs:
  build:
    - npm install
    - npm run lint
    - npm test
    - npm run build
  deploy:
    - Deploy to Vercel/Netlify
```

### Environment Variables

**Gestion** :
- Development : `.env.local`
- Staging : Vercel/Netlify dashboard
- Production : Vercel/Netlify dashboard

---

## Roadmap Technique

### Court terme (Q3 2026)
- [ ] Redis caching
- [ ] Rate limiting
- [ ] Monitoring (Sentry)
- [ ] E2E tests (Playwright)

### Moyen terme (Q4 2026)
- [ ] GraphQL API
- [ ] Server-side rendering (Next.js)
- [ ] Mobile apps (React Native)
- [ ] Advanced analytics

### Long terme (2027)
- [ ] Microservices architecture
- [ ] Kubernetes deployment
- [ ] Multi-region
- [ ] AI chatbot avancé

---

**Dernière mise à jour** : Juin 2026  
**Mainteneur** : Équipe Véridian
