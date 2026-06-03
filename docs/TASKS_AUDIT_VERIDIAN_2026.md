# Véridian — Tasks complètes issues de l’audit professionnel 2026

> Fichier de pilotage opérationnel basé sur `docs/AUDIT_PROFESSIONNEL_VERIDIAN_2026.md`.
>
> Objectif : transformer l’audit en backlog exécutable, priorisé et vérifiable.
>
> Convention :
>
> - **P0** : bloquant production / risque critique.
> - **P1** : haute priorité, amélioration sécurité/performance majeure.
> - **P2** : amélioration structurante ou UX/business importante.
> - **P3** : optimisation ou dette technique non bloquante.

---

## Sommaire

1. [P0 — Paiement, commandes et stock](#p0--paiement-commandes-et-stock)
2. [P0 — Sécurité applicative](#p0--sécurité-applicative)
3. [P1 — Supabase, RLS et données](#p1--supabase-rls-et-données)
4. [P1 — IA, Gemini, Voice Assistant et pgvector](#p1--ia-gemini-voice-assistant-et-pgvector)
5. [P1 — Frontend React et Zustand](#p1--frontend-react-et-zustand)
6. [P1 — Performance frontend/backend](#p1--performance-frontendbackend)
7. [P2 — DevOps, observabilité et qualité](#p2--devops-observabilité-et-qualité)
8. [P2 — UX e-commerce premium](#p2--ux-e-commerce-premium)
9. [P2 — Fonctionnalités premium](#p2--fonctionnalités-premium)
10. [P3 — Nettoyage et dette technique](#p3--nettoyage-et-dette-technique)
11. [Plan de livraison recommandé](#plan-de-livraison-recommandé)
12. [Definition of Done globale](#definition-of-done-globale)

---

## P0 — Paiement, commandes et stock

### TASK-P0-001 — Rendre le flux Stripe atomique avec commande pending avant paiement

**Problème :** le paiement Stripe est confirmé avant la création locale de la commande. Une erreur RPC après paiement peut créer un débit sans commande.

**Fichiers concernés :**

- `src/components/PaymentForm.tsx`
- `src/pages/Checkout.tsx`
- `src/services/checkoutService.ts`
- `src/services/paymentSecurity.ts`
- `server.ts`
- `supabase/migrations/20260630_add_stripe_payment_reconciliation.sql`

**Tâches :**

- [ ] Créer une migration `checkout_attempts`.
- [ ] Créer une table `stock_reservations` ou un mécanisme équivalent de hold stock.
- [ ] Créer une RPC `create_pending_order_with_items`.
- [ ] Déplacer la création de commande avant `confirmPayment`.
- [ ] Créer le PaymentIntent serveur avec `metadata.order_id` et `metadata.checkout_attempt_id`.
- [ ] Retourner `clientSecret`, `orderId`, `checkoutAttemptId` au frontend.
- [ ] Modifier `PaymentForm` pour confirmer un PaymentIntent déjà lié à une commande.
- [ ] Modifier le webhook pour passer la commande `paid` uniquement depuis l’événement signé.
- [ ] Gérer `payment_intent.payment_failed` et `payment_intent.canceled`.
- [ ] Libérer les réservations de stock à l’échec ou à l’expiration.
- [ ] Ajouter une tâche de nettoyage des `checkout_attempts` expirés.

**Critères d’acceptation :**

- [ ] Un paiement réussi possède toujours une commande locale associée.
- [ ] Un webhook Stripe en avance peut réconcilier via `metadata.order_id`.
- [ ] Aucun stock n’est définitivement décrémenté si le paiement échoue.
- [ ] Les tests couvrent paiement réussi, paiement échoué, webhook en avance, double webhook.

**Gravité :** critique.  
**Effort :** élevé.  
**Impact :** très élevé.

---

### TASK-P0-002 — Vérifier le montant Stripe dans le webhook

**Problème :** le webhook met à jour les statuts mais ne compare pas explicitement le montant Stripe reçu avec le total local de commande.

**Fichiers concernés :**

- `server.ts`
- `src/services/paymentSecurity.ts`
- migrations `payments` / `orders`

**Tâches :**

- [ ] Lire `amount_received`, `currency`, `payment_intent.id` depuis l’événement Stripe.
- [ ] Charger la commande liée au PaymentIntent.
- [ ] Comparer `amount_received` à `orders.total * 100`.
- [ ] Comparer la devise Stripe à la devise attendue.
- [ ] Marquer le paiement `failed` ou `requires_review` si incohérence.
- [ ] Écrire un événement d’audit en cas d’incohérence.
- [ ] Ajouter tests unitaires et tests webhook.

**Critères d’acceptation :**

- [ ] Un webhook avec montant inférieur ne peut jamais marquer une commande `paid`.
- [ ] Une devise inattendue bloque la réconciliation.
- [ ] Les écarts sont journalisés avec `requestId` et `paymentIntentId`.

**Gravité :** élevée.  
**Effort :** moyen.  
**Impact :** très élevé.

---

### TASK-P0-003 — Corriger la gestion serveur des remises au checkout

**Problème :** le total UI peut inclure une remise, mais le PaymentIntent est calculé depuis les items catalogue sans validation serveur complète du code promo.

**Fichiers concernés :**

- `src/pages/Checkout.tsx`
- `src/components/DiscountCodeInput.tsx`
- `src/components/PaymentForm.tsx`
- `src/services/checkoutService.ts`
- `server.ts`
- migrations `discounts`

**Tâches :**

- [ ] Créer un endpoint serveur `POST /api/discounts/validate`.
- [ ] Valider le code, les dates, le nombre d’utilisations, le minimum de commande et les produits/catégories éligibles côté serveur.
- [ ] Inclure `discount_code` et `discount_total` dans la création de PaymentIntent.
- [ ] Inclure la remise validée dans la RPC de commande.
- [ ] Empêcher le client de fixer arbitrairement `discountAmount`.
- [ ] Décrémenter/incrémenter l’usage de remise de façon transactionnelle.
- [ ] Ajouter tests unitaires pour remise expirée, usage max, panier non éligible, remise valide.

**Critères d’acceptation :**

- [ ] Stripe facture le total serveur après remise validée.
- [ ] La commande stocke `discount_code` et `discount_total` vérifiés.
- [ ] Une remise modifiée côté client est ignorée/refusée.

**Gravité :** élevée.  
**Effort :** moyen.  
**Impact :** élevé.

---

### TASK-P0-004 — Ajouter idempotence complète côté commande locale

**Problème :** l’idempotence Stripe existe partiellement, mais la commande locale doit aussi être idempotente par tentative checkout.

**Fichiers concernés :**

- `server.ts`
- `src/services/checkoutService.ts`
- migrations orders/payments

**Tâches :**

- [ ] Ajouter une clé unique `checkout_attempt_id` côté commande ou table dédiée.
- [ ] Rendre la RPC de création commande idempotente.
- [ ] Empêcher deux commandes pour le même `checkoutAttemptId`.
- [ ] Gérer les doubles clics et refresh navigateur.
- [ ] Ajouter tests de double soumission.

**Critères d’acceptation :**

- [ ] Deux appels identiques retournent la même commande.
- [ ] Le stock n’est pas décrémenté deux fois.
- [ ] Stripe et Supabase convergent sur un seul paiement.

**Gravité :** élevée.  
**Effort :** moyen.  
**Impact :** élevé.

---

## P0 — Sécurité applicative

### TASK-P0-005 — Durcir la CSP de production

**Problème :** la CSP autorise `unsafe-inline` pour les scripts.

**Fichiers concernés :**

- `server.ts`
- `index.html`
- éventuellement `vite.config.ts`

**Tâches :**

- [ ] Retirer `unsafe-inline` de `script-src` en production.
- [ ] Ajouter nonce par requête ou hashes.
- [ ] Ajouter `object-src 'none'`.
- [ ] Ajouter `base-uri 'self'`.
- [ ] Ajouter `frame-ancestors 'self'`.
- [ ] Autoriser explicitement `https://js.stripe.com`.
- [ ] Vérifier Supabase, Gemini, Stripe dans `connect-src`.
- [ ] Tester checkout Stripe après durcissement.

**Critères d’acceptation :**

- [ ] Aucun script inline non autorisé en production.
- [ ] Stripe Payment Element fonctionne.
- [ ] Les violations CSP sont visibles en logs/report-uri ou report-to.

**Gravité :** élevée.  
**Effort :** moyen.  
**Impact :** élevé.

---

### TASK-P0-006 — Ajouter rate limiting HTTP sur endpoints sensibles

**Endpoints concernés :**

- `POST /api/payments/create-intent`
- `POST /api/events`
- `GET /api/products/search`
- `POST /api/products/enhance-description`
- `POST /api/products/vectorize`
- `POST /api/products/:id/vectorize`

**Tâches :**

- [ ] Introduire un middleware rate limit générique.
- [ ] Utiliser un backend distribué en production : Redis, Upstash ou table Supabase TTL.
- [ ] Limiter par IP + `user_id` si authentifié.
- [ ] Ajouter limites spécifiques par endpoint.
- [ ] Retourner `429` avec message exploitable.
- [ ] Journaliser les dépassements.
- [ ] Ajouter tests de rate limiting.

**Critères d’acceptation :**

- [ ] Un client ne peut pas spammer PaymentIntent.
- [ ] Un client ne peut pas abuser Gemini/pgvector.
- [ ] Les limites sont configurables par variables d’environnement.

**Gravité :** élevée.  
**Effort :** moyen.  
**Impact :** élevé.

---

### TASK-P0-007 — Migrer les mutations admin critiques vers API serveur

**Problème :** les mutations produits/catégories/settings se font directement depuis le client Supabase.

**Fichiers concernés :**

- `src/pages/Admin.tsx`
- `src/components/admin/ProductForm.tsx`
- `src/components/AdminSettings.tsx`
- `src/components/AdminDiscounts.tsx`
- `src/components/admin/AdminShipping.tsx`
- `server.ts`

**Tâches :**

- [ ] Créer `server/routes/adminProducts.ts`.
- [ ] Créer `server/routes/adminCategories.ts`.
- [ ] Créer `server/routes/adminSettings.ts`.
- [ ] Créer `server/routes/adminDiscounts.ts`.
- [ ] Vérifier token Supabase et rôle admin/staff côté serveur.
- [ ] Utiliser service role uniquement côté serveur.
- [ ] Valider chaque payload avec schéma TypeScript ou validation runtime.
- [ ] Écrire `audit_events` pour create/update/delete.
- [ ] Remplacer les appels client directs par `fetch('/api/admin/...')`.
- [ ] Ajouter tests d’accès : customer interdit, staff limité, admin autorisé.

**Critères d’acceptation :**

- [ ] Les mutations critiques ne dépendent plus uniquement du client Supabase.
- [ ] Toutes les mutations admin sont auditées.
- [ ] Les erreurs de validation sont lisibles dans l’UI.

**Gravité :** élevée.  
**Effort :** élevé.  
**Impact :** très élevé.

---

## P1 — Supabase, RLS et données

### TASK-P1-001 — Corriger `/api/events` avec le schéma réel

**Problème :** le serveur insère `event_type` et `payload`, mais la table attend `event_name` et `properties`.

**Fichiers concernés :**

- `server.ts`
- `supabase/migrations/20260629_restrict_sensitive_commerce_tables.sql`
- `supabase/migrations/20260629_secure_sensitive_tables.sql`

**Tâches :**

- [ ] Remplacer `event_type` par `event_name` dans l’insert.
- [ ] Remplacer `payload` par `properties`.
- [ ] Ajouter `anonymous_id` si aucun utilisateur n’est authentifié.
- [ ] Valider la taille maximale de `properties`.
- [ ] Ajouter test serveur ou test unitaire mock Supabase.
- [ ] Documenter les événements autorisés.

**Critères d’acceptation :**

- [ ] Les événements sont persistés sans erreur de colonne.
- [ ] Les événements invalides retournent `400`.
- [ ] Les événements anonymes ne contiennent pas de PII inutile.

**Gravité :** élevée.  
**Effort :** faible.  
**Impact :** élevé.

---

### TASK-P1-002 — Remplacer tous les `select('*')` par colonnes explicites

**Fichiers concernés :**

- `src/store.ts`
- `src/pages/Admin.tsx`
- `src/lib/embeddingService.ts`
- `server.ts`
- composants admin Supabase

**Tâches :**

- [ ] Inventorier tous les `.select('*')`.
- [ ] Définir des constantes de colonnes par ressource.
- [ ] Remplacer les lectures catalogue publiques par colonnes publiques.
- [ ] Remplacer les lectures admin par colonnes nécessaires uniquement.
- [ ] Adapter les types TypeScript.
- [ ] Ajouter tests TypeScript.

**Critères d’acceptation :**

- [ ] Aucun `.select('*')` ne reste hors cas justifié.
- [ ] Les pages catalogue et admin continuent de fonctionner.
- [ ] Les champs sensibles futurs ne seront pas exposés automatiquement.

**Gravité :** moyenne/élevée.  
**Effort :** moyen.  
**Impact :** élevé.

---

### TASK-P1-003 — Ajouter tests RLS de scénarios réels

**Scénarios :**

- Client A ne lit pas les commandes de client B.
- Client non connecté ne lit pas les profils.
- Customer ne modifie pas les produits.
- Staff accède uniquement aux opérations autorisées.
- Admin accède aux backoffice policies.

**Tâches :**

- [ ] Créer fixtures utilisateurs : customer A, customer B, staff, admin.
- [ ] Créer script de test Supabase staging/local.
- [ ] Tester `profiles`, `orders`, `order_items`, `payments`, `addresses`, `wishlist_items`.
- [ ] Tester `match_products` selon le niveau d’exposition souhaité.
- [ ] Ajouter ces tests au pipeline CI si Supabase local disponible.

**Critères d’acceptation :**

- [ ] Les scénarios RLS critiques sont automatisés.
- [ ] Toute policy permissive échoue en CI.

**Gravité :** élevée.  
**Effort :** moyen/élevé.  
**Impact :** très élevé.

---

### TASK-P1-004 — Ajouter indexes DB orientés production

**Tâches SQL :**

- [ ] Ajouter index partiel `products(stock) where stock > 0`.
- [ ] Ajouter index GIN sur `products.categories` si requêtes par catégorie fréquentes.
- [ ] Ajouter index `orders(created_at desc)`.
- [ ] Ajouter index reviews publiées par produit/date.
- [ ] Vérifier les plans d’exécution des requêtes admin.
- [ ] Documenter les indexes et leur usage.

**Critères d’acceptation :**

- [ ] Les requêtes catalogue et admin ne font pas de scans inutiles sur grosses tables.
- [ ] Les indexes sont idempotents et compatibles migrations Supabase.

**Gravité :** moyenne.  
**Effort :** faible/moyen.  
**Impact :** moyen/élevé.

---

## P1 — IA, Gemini, Voice Assistant et pgvector

### TASK-P1-005 — Construire le contexte catalogue Ava côté serveur

**Problème :** le client envoie un texte `Contexte catalogue...`, ce qui ouvre une surface d’injection et rend le serveur dépendant d’un contexte fourni par le client.

**Fichiers concernés :**

- `src/components/VoiceAssistant.tsx`
- `server.ts`
- `src/lib/embeddingService.ts`

**Tâches :**

- [ ] Supprimer l’envoi client du contexte catalogue complet.
- [ ] Charger côté serveur les produits autorisés en stock.
- [ ] Limiter les colonnes injectées au modèle.
- [ ] Ajouter un format serveur strict : `id`, `name`, `price`, résumé court.
- [ ] Ajouter cache court côté serveur pour catalogue vocal.
- [ ] Tester qu’un client ne peut pas injecter de faux produit.

**Critères d’acceptation :**

- [ ] Ava ne reçoit jamais un catalogue fourni par le navigateur.
- [ ] `addToCart` ne peut cibler qu’un productId réel et disponible.

**Gravité :** élevée.  
**Effort :** moyen.  
**Impact :** élevé.

---

### TASK-P1-006 — Sécuriser le function calling Ava

**Tâches :**

- [ ] Corréler les `functionCall.id` attendus côté serveur.
- [ ] Refuser les `functionResponse` non attendues.
- [ ] Valider `quantity` min/max côté client et serveur.
- [ ] Vérifier le stock avant ajout panier ou avant checkout.
- [ ] Étudier exécution du tool `addToCart` côté serveur avec session panier signée.
- [ ] Ajouter logs d’usage tool calling.

**Critères d’acceptation :**

- [ ] Une réponse tool forgée ne perturbe pas la session Gemini.
- [ ] La quantité est bornée.
- [ ] Les tool calls sont traçables.

**Gravité :** moyenne/élevée.  
**Effort :** moyen.  
**Impact :** moyen/élevé.

---

### TASK-P1-007 — Transformer la vectorisation produits en jobs asynchrones

**Problème :** `/api/products/vectorize` lance un batch HTTP synchrone qui peut timeout et surconsommer Gemini.

**Fichiers concernés :**

- `server.ts`
- `src/lib/embeddingService.ts`
- `src/components/admin/VectorizationPanel.tsx`

**Tâches :**

- [ ] Créer table `vectorization_jobs`.
- [ ] Créer table optionnelle `vectorization_job_items`.
- [ ] Endpoint `POST /api/products/vectorization-jobs`.
- [ ] Endpoint `GET /api/products/vectorization-jobs/:id`.
- [ ] Worker backend ou cron pour traiter les jobs.
- [ ] Gestion retry/backoff.
- [ ] UI progress persistée dans `VectorizationPanel`.
- [ ] Quotas par admin/staff.

**Critères d’acceptation :**

- [ ] Une vectorisation de gros catalogue ne bloque pas une requête HTTP longue.
- [ ] Un job peut reprendre après erreur partielle.
- [ ] Le coût et le nombre d’échecs sont visibles.

**Gravité :** moyenne.  
**Effort :** élevé.  
**Impact :** moyen/élevé.

---

## P1 — Frontend React et Zustand

### TASK-P1-008 — Découper le store Zustand en slices/stores spécialisés

**Fichiers concernés :**

- `src/store.ts`
- `src/pages/Checkout.tsx`
- `src/components/Header.tsx`
- `src/components/CartDrawer.tsx`
- composants wishlist/profile/catalogue

**Tâches :**

- [ ] Créer `src/stores/useAuthStore.ts`.
- [ ] Créer `src/stores/useCatalogStore.ts`.
- [ ] Créer `src/stores/useCartStore.ts`.
- [ ] Créer `src/stores/useCheckoutStore.ts`.
- [ ] Créer `src/stores/useWishlistStore.ts`.
- [ ] Créer `src/stores/useUiStore.ts`.
- [ ] Migrer les composants progressivement.
- [ ] Conserver une couche de compatibilité temporaire si nécessaire.
- [ ] Ajouter tests des actions critiques cart/checkout.

**Critères d’acceptation :**

- [ ] Les composants ne souscrivent qu’aux données nécessaires.
- [ ] Le panier reste persisté.
- [ ] Les re-renders checkout/header diminuent.

**Gravité :** moyenne/élevée.  
**Effort :** moyen/élevé.  
**Impact :** élevé.

---

### TASK-P1-009 — Stocker le panier par IDs et snapshots légers

**Problème :** le panier persiste des objets produits complets.

**Tâches :**

- [ ] Remplacer `CartItem.product` par `productId` + snapshots nécessaires.
- [ ] Ajouter migration locale de version `cart-v1` vers `cart-v2`.
- [ ] Recalculer affichage panier depuis `productsById` si disponible.
- [ ] Gérer produit supprimé ou indisponible.
- [ ] Ajouter tests d’hydratation panier.

**Critères d’acceptation :**

- [ ] Le localStorage panier est compact.
- [ ] Un changement de prix/stock serveur est correctement traité au checkout.
- [ ] L’UI reste lisible si un produit n’existe plus.

**Gravité :** moyenne.  
**Effort :** moyen.  
**Impact :** élevé.

---

### TASK-P1-010 — Découper les gros composants/pages

**Fichiers prioritaires :**

- `src/pages/StoreFront.tsx`
- `src/pages/Profile.tsx`
- `src/components/admin/MegaMenuManager.tsx`
- `src/components/admin/ProductForm.tsx`
- `src/components/admin/AdminShipping.tsx`
- `src/components/WishlistManager.tsx`
- `src/components/AdminSettings.tsx`

**Tâches :**

- [ ] Extraire sections de `StoreFront` : hero, catégories, grille, newsletter, valeurs.
- [ ] Extraire sections de `Profile` : info, commandes, adresses, wishlist, fidélité.
- [ ] Extraire sous-composants de `ProductForm` : pricing, inventory, SEO, badges, promotions, specs.
- [ ] Extraire hooks de chargement et mutation admin.
- [ ] Ajouter index exports si utile.
- [ ] Vérifier les chunks après découpage.

**Critères d’acceptation :**

- [ ] Aucun fichier UI principal ne dépasse idéalement 300–400 lignes hors cas justifié.
- [ ] Les composants extraits sont testables/réutilisables.
- [ ] Le comportement visuel reste identique.

**Gravité :** moyenne.  
**Effort :** élevé.  
**Impact :** élevé.

---

## P1 — Performance frontend/backend

### TASK-P1-011 — Réduire le chunk `vendor-icons`

**Problème :** le build montre `vendor-icons` très volumineux.

**Fichiers concernés :**

- imports `lucide-react` dans `src/`
- `vite.config.ts`

**Tâches :**

- [ ] Auditer les imports d’icônes.
- [ ] Supprimer les icônes inutilisées.
- [ ] Lazy-loader les modules admin très chargés en icônes.
- [ ] Étudier alternative : wrapper d’icônes internes ou imports ciblés.
- [ ] Mesurer `npm run build` avant/après.

**Critères d’acceptation :**

- [ ] Le chunk icons diminue significativement.
- [ ] Aucun écran ne perd d’icône.
- [ ] Le build ne déclenche plus ou déclenche moins d’alertes chunk.

**Gravité :** moyenne.  
**Effort :** moyen.  
**Impact :** élevé.

---

### TASK-P1-012 — Lazy-load VoiceAssistant après interaction

**Problème :** l’assistant IA est monté globalement dans `App`.

**Tâches :**

- [ ] Remplacer import direct par `lazy(() => import('./components/VoiceAssistant'))`.
- [ ] Charger le composant après idle ou après clic utilisateur.
- [ ] Ne pas initialiser WebSocket/audio avant ouverture.
- [ ] Vérifier accessibilité du bouton Ava.
- [ ] Mesurer le chunk initial.

**Critères d’acceptation :**

- [ ] Le bundle initial diminue.
- [ ] Ava reste disponible sans régression UX.
- [ ] Aucun appel micro/WebSocket n’est fait avant interaction.

**Gravité :** moyenne.  
**Effort :** faible/moyen.  
**Impact :** moyen/élevé.

---

### TASK-P1-013 — Remplacer le polling admin par RPC agrégée + realtime ciblé

**Problème :** l’admin lit toutes les commandes toutes les 10 secondes.

**Tâches :**

- [ ] Créer RPC `admin_dashboard_stats`.
- [ ] Remplacer `.select('*')` par appel RPC.
- [ ] Ajouter realtime Supabase sur commandes actives si nécessaire.
- [ ] Ajouter fallback refresh manuel.
- [ ] Tester avec dataset volumineux.

**Critères d’acceptation :**

- [ ] Le dashboard n’a pas besoin de charger toutes les commandes pour les stats.
- [ ] Les stats restent à jour.
- [ ] La charge DB diminue.

**Gravité :** moyenne.  
**Effort :** moyen.  
**Impact :** élevé.

---

## P2 — DevOps, observabilité et qualité

### TASK-P2-001 — Ajouter CI complète

**Tâches :**

- [ ] Ajouter workflow GitHub Actions ou équivalent.
- [ ] Étape `npm ci`.
- [ ] Étape `npm run lint`.
- [ ] Étape `npm test`.
- [ ] Étape `npm run build`.
- [ ] Étape migration validation `scripts/validate-migrations.mjs` si applicable.
- [ ] Cache npm.
- [ ] Upload artifacts build si nécessaire.

**Critères d’acceptation :**

- [ ] Toute PR exécute lint, tests, build.
- [ ] Un échec bloque la fusion.

**Gravité :** moyenne.  
**Effort :** faible/moyen.  
**Impact :** élevé.

---

### TASK-P2-002 — Ajouter Sentry ou équivalent

**Tâches :**

- [ ] Installer SDK frontend.
- [ ] Installer SDK backend Express.
- [ ] Configurer DSN via env.
- [ ] Ajouter `requestId` aux traces.
- [ ] Masquer PII : emails, tokens, secrets.
- [ ] Ajouter source maps production si politique acceptée.
- [ ] Créer alertes erreurs paiement et webhook.

**Critères d’acceptation :**

- [ ] Les erreurs frontend critiques remontent.
- [ ] Les erreurs backend critiques remontent.
- [ ] Les secrets ne remontent pas.

**Gravité :** moyenne.  
**Effort :** moyen.  
**Impact :** élevé.

---

### TASK-P2-003 — Ajouter OpenTelemetry / métriques API

**Tâches :**

- [ ] Instrumenter Express.
- [ ] Mesurer latence endpoints `/api/payments/*`, `/api/products/search`, `/live`.
- [ ] Compter erreurs par endpoint.
- [ ] Mesurer temps Supabase et Stripe.
- [ ] Ajouter dashboard minimal.
- [ ] Ajouter alertes latence et erreurs 5xx.

**Critères d’acceptation :**

- [ ] Latence p95 API visible.
- [ ] Erreurs paiement visibles.
- [ ] WebSocket live surveillé.

**Gravité :** moyenne.  
**Effort :** moyen/élevé.  
**Impact :** moyen/élevé.

---

### TASK-P2-004 — Activer progressivement `noUnusedLocals` et `noUnusedParameters`

**Tâches :**

- [ ] Supprimer imports React inutiles là où le JSX transform moderne suffit.
- [ ] Supprimer icônes inutilisées.
- [ ] Supprimer variables inutilisées.
- [ ] Renommer paramètres volontairement inutilisés en `_param`.
- [ ] Activer `noUnusedLocals` dans `tsconfig`.
- [ ] Activer `noUnusedParameters` dans `tsconfig`.
- [ ] Ajouter check CI.

**Critères d’acceptation :**

- [ ] `npx tsc --noEmit --noUnusedLocals --noUnusedParameters` passe.
- [ ] Aucun import mort ne reste dans les fichiers audités.

**Gravité :** faible/moyenne.  
**Effort :** moyen.  
**Impact :** moyen.

---

### TASK-P2-005 — Ajouter secret scanning et audit dépendances

**Tâches :**

- [ ] Ajouter secret scanning CI.
- [ ] Ajouter `npm audit` si registry disponible.
- [ ] Ajouter Dependabot/Renovate.
- [ ] Définir politique de mise à jour dépendances.
- [ ] Documenter exceptions.

**Critères d’acceptation :**

- [ ] Aucun secret réel n’est commité.
- [ ] Les dépendances critiques ont un suivi.

**Gravité :** moyenne.  
**Effort :** faible/moyen.  
**Impact :** élevé.

---

## P2 — UX e-commerce premium

### TASK-P2-006 — Améliorer le checkout en cas d’échec paiement/commande

**Tâches :**

- [ ] Ajouter états explicites : `payment_pending`, `order_pending`, `reconciliation_pending`, `failed`.
- [ ] Afficher page de reprise si paiement accepté mais commande en attente.
- [ ] Ajouter bouton “Contacter le support avec référence paiement”.
- [ ] Ajouter retry sécurisé de création commande si possible.
- [ ] Ajouter messages d’erreurs contextualisés.

**Critères d’acceptation :**

- [ ] Le client n’est jamais bloqué sans explication après paiement.
- [ ] Le support dispose d’une référence exploitable.

**Gravité :** élevée.  
**Effort :** moyen.  
**Impact :** élevé.

---

### TASK-P2-007 — Finaliser PWA offline et sync panier

**Tâches :**

- [ ] Corriger la condition Service Worker image/origine.
- [ ] Corriger les icônes notification `.png` ou créer les assets.
- [ ] Implémenter réellement `syncCart` ou supprimer le placeholder.
- [ ] Versionner les caches.
- [ ] Ajouter stratégie de purge runtime cache.
- [ ] Tester offline : home, catalogue en cache, panier, retour online.

**Critères d’acceptation :**

- [ ] Le mode offline est prévisible.
- [ ] Aucune notification ne référence un asset inexistant.
- [ ] Le cache ne grossit pas sans limite.

**Gravité :** moyenne.  
**Effort :** moyen.  
**Impact :** moyen.

---

### TASK-P2-008 — Améliorer l’accès Ava pour visiteurs anonymes

**Tâches :**

- [ ] Définir mode Ava anonyme limité.
- [ ] Autoriser recommandations catalogue sans compte.
- [ ] Bloquer actions personnelles sans login.
- [ ] Ajouter CTA login contextuel pour ajout panier vocal si nécessaire.
- [ ] Limiter quota anonyme par IP.

**Critères d’acceptation :**

- [ ] Un visiteur peut découvrir les produits avec Ava.
- [ ] Les actions sensibles restent authentifiées.

**Gravité :** moyenne.  
**Effort :** moyen.  
**Impact :** moyen/élevé.

---

## P2 — Fonctionnalités premium

### TASK-P2-009 — Concierge IA personnalisé avec mémoire d’achat

**Tâches :**

- [ ] Créer table `customer_preferences`.
- [ ] Créer table `recommendation_events`.
- [ ] Ajouter UI préférences client.
- [ ] Ajouter endpoint `/api/ai/recommendations`.
- [ ] Utiliser historique commandes, wishlist et préférences avec minimisation PII.
- [ ] Ajouter opt-out personnalisation.
- [ ] Ajouter tests prompt injection et privacy.

**Critères d’acceptation :**

- [ ] Les recommandations sont personnalisées et explicables.
- [ ] Le client peut désactiver la personnalisation.

**Priorité business :** P1/P2.  
**Effort :** élevé.

---

### TASK-P2-010 — Réservation de stock premium

**Tâches :**

- [ ] Créer `stock_reservations`.
- [ ] Afficher timer de réservation au checkout.
- [ ] Expirer les réservations.
- [ ] Confirmer les réservations au paiement réussi.
- [ ] Libérer les réservations au paiement échoué.

**Critères d’acceptation :**

- [ ] Le stock est réservé pendant le paiement.
- [ ] Le stock est libéré automatiquement si abandon.

**Priorité business :** P0/P1.  
**Effort :** élevé.

---

### TASK-P2-011 — Checkout VIP livraison planifiée

**Tâches :**

- [ ] Créer table `delivery_slots`.
- [ ] Créer table `gift_options`.
- [ ] Ajouter choix créneau dans checkout.
- [ ] Ajouter option emballage cadeau.
- [ ] Valider créneau serveur.
- [ ] Ajouter suivi premium dans profil.

**Critères d’acceptation :**

- [ ] Un client peut réserver un créneau disponible.
- [ ] Un créneau ne peut pas être surbooké.

**Priorité business :** P2.  
**Effort :** moyen/élevé.

---

### TASK-P2-012 — Recherche multimodale IA

**Tâches :**

- [ ] Ajouter upload image temporaire.
- [ ] Valider MIME, taille, dimensions.
- [ ] Générer embedding image ou description contrôlée.
- [ ] Matcher produits via pgvector.
- [ ] Supprimer l’image temporaire après traitement.
- [ ] Ajouter quotas et logs.

**Critères d’acceptation :**

- [ ] Le client peut rechercher par image.
- [ ] Les uploads dangereux sont rejetés.

**Priorité business :** P2.  
**Effort :** élevé.

---

### TASK-P2-013 — Programme fidélité premium avec ledger

**Tâches :**

- [ ] Créer table `loyalty_ledger`.
- [ ] Attribuer les points uniquement via webhook signé.
- [ ] Créer statuts Bronze/Argent/Or/Private Client.
- [ ] Afficher progression dans profil.
- [ ] Ajouter avantages checkout selon statut.
- [ ] Ajouter audit des ajustements manuels admin.

**Critères d’acceptation :**

- [ ] Les points ne sont jamais attribués côté client.
- [ ] Le client voit son statut et le prochain palier.

**Priorité business :** P1/P2.  
**Effort :** moyen/élevé.

---

## P3 — Nettoyage et dette technique

### TASK-P3-001 — Nettoyer imports et variables inutilisés

**Tâches :**

- [ ] Nettoyer `src/App.tsx`.
- [ ] Nettoyer `src/components/VoiceAssistant.tsx`.
- [ ] Nettoyer `src/store.ts`.
- [ ] Nettoyer `src/pages/Checkout.tsx`.
- [ ] Nettoyer `src/pages/StoreFront.tsx`.
- [ ] Nettoyer composants admin signalés par `tsc --noUnused*`.
- [ ] Relancer `npx tsc --noEmit --noUnusedLocals --noUnusedParameters --pretty false`.

**Critères d’acceptation :**

- [ ] Le check noUnused passe.
- [ ] Le bundle diminue légèrement.

**Priorité :** P3.  
**Effort :** faible/moyen.

---

### TASK-P3-002 — Renommer le package

**Problème :** `package.json` utilise `react-example`, peu professionnel pour Véridian.

**Tâches :**

- [ ] Renommer `name` en `veridian-premium-ecommerce` ou équivalent.
- [ ] Mettre à jour metadata si nécessaire.
- [ ] Vérifier lockfile.

**Critères d’acceptation :**

- [ ] Le nom package reflète le projet.
- [ ] Build/test restent verts.

**Priorité :** P3.  
**Effort :** faible.

---

### TASK-P3-003 — Documenter variables d’environnement production

**Tâches :**

- [ ] Compléter `.env.example` avec `OPENROUTER_API_KEY`, `LIVE_SESSION_MAX_MS`, `GEMINI_LIVE_MODEL`, `SITE_URL` si requis.
- [ ] Documenter variables obligatoires vs optionnelles.
- [ ] Ajouter guide de rotation secrets.
- [ ] Ajouter guide Stripe webhook local/staging/prod.

**Critères d’acceptation :**

- [ ] Un développeur peut configurer local/staging/prod sans ambiguïté.
- [ ] Les secrets serveur ne sont jamais préfixés `VITE_`.

**Priorité :** P3.  
**Effort :** faible.

---

## Plan de livraison recommandé

### Sprint 1 — Stabilisation paiement/sécurité critique

- [ ] TASK-P0-001 — Flux Stripe atomique.
- [ ] TASK-P0-002 — Vérification montant webhook.
- [ ] TASK-P0-003 — Remises serveur.
- [ ] TASK-P1-001 — Correction `/api/events`.
- [ ] TASK-P0-005 — CSP production.

### Sprint 2 — Backoffice et données

- [ ] TASK-P0-007 — Mutations admin serveur.
- [ ] TASK-P1-002 — Suppression `select('*')`.
- [ ] TASK-P1-003 — Tests RLS.
- [ ] TASK-P1-004 — Index DB production.
- [ ] TASK-P1-013 — Stats admin RPC.

### Sprint 3 — IA sécurisée et scalable

- [ ] TASK-P1-005 — Contexte catalogue Ava serveur.
- [ ] TASK-P1-006 — Function calling sécurisé.
- [ ] TASK-P1-007 — Vectorisation asynchrone.
- [ ] TASK-P0-006 — Rate limiting distribué.
- [ ] TASK-P2-008 — Ava anonyme limitée.

### Sprint 4 — Frontend performance et maintenabilité

- [ ] TASK-P1-008 — Store Zustand découpé.
- [ ] TASK-P1-009 — Panier IDs/snapshots.
- [ ] TASK-P1-010 — Découpage gros composants.
- [ ] TASK-P1-011 — Réduction icons chunk.
- [ ] TASK-P1-012 — Lazy-load VoiceAssistant.

### Sprint 5 — DevOps et premium features

- [ ] TASK-P2-001 — CI complète.
- [ ] TASK-P2-002 — Sentry.
- [ ] TASK-P2-003 — OpenTelemetry/métriques.
- [ ] TASK-P2-009 — Concierge IA personnalisé.
- [ ] TASK-P2-013 — Fidélité premium ledger.

---

## Definition of Done globale

Une task est terminée uniquement si :

- [ ] Le code est implémenté.
- [ ] Les types TypeScript passent.
- [ ] `npm run lint` passe.
- [ ] `npm test` passe.
- [ ] `npm run build` passe si la task touche runtime/frontend/backend.
- [ ] Les migrations SQL sont idempotentes et non destructives sauf exception explicitement documentée.
- [ ] Les politiques RLS sont testées si la task touche Supabase.
- [ ] Les endpoints sensibles vérifient auth, rôle, validation payload et rate limit si applicable.
- [ ] Les erreurs utilisateur sont compréhensibles.
- [ ] Les événements critiques sont loggés avec `requestId`.
- [ ] La documentation ou ce fichier de tasks est mis à jour.
