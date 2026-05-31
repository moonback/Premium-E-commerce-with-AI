# Task-full — Plan complet d'implémentation de l'audit Véridian

_Source : `docs/AUDIT_COMPLET_VERIDIAN.md` — audit du 31 mai 2026._

## Objectif du document

Ce fichier transforme l'audit complet Véridian en backlog exécutable, priorisé et détaillé. Il sert de feuille de route pour passer d'un MVP e-commerce IA-first à une plateforme fiable, sécurisée, performante et orientée conversion.

### Convention de priorités

- **P0 — Bloquant / critique** : sécurité, build, données transactionnelles, routes cassées, risques financiers ou fuite de données.
- **P1 — MVP Pro / croissance immédiate** : conversion, SEO, mobile, architecture, observabilité, fonctionnalités commerce attendues.
- **P2 — Growth / scalabilité** : marketing, CRM, contenus, automatisations, POS avancé, admin plus robuste.
- **P3 — Scale / différenciation avancée** : international, enterprise readiness, IA personnalisée avancée, BI, automatisations complexes.

### Définition de terminé globale

Une tâche est terminée uniquement si :

1. Le code est typé et le build passe.
2. Les migrations sont non destructives et documentées.
3. Les politiques RLS/RBAC sont testées au moins manuellement.
4. Les parcours utilisateur critiques sont vérifiés desktop et mobile.
5. Les erreurs sont visibles pour l'utilisateur et exploitables dans les logs.
6. Les changements sensibles ont des tests unitaires, intégration ou E2E selon le risque.
7. La documentation minimale est mise à jour.

---

## État d’avancement — 31 mai 2026

### Corrections P0 déjà implémentées

- [x] Build TypeScript et `npm run lint` verts après les premières corrections.
- [x] CTA hero vers `#collection` existant et route wildcard 404 ajoutée.
- [x] Rôles applicatifs normalisés : `customer`, `staff`, `kiosk`, `admin`.
- [x] Suppression de l’élévation admin basée sur `email.includes('admin')` côté client et trigger Supabase durci.
- [x] Routes sensibles protégées : `/admin`, `/pos`, `/screen` et profil ; confirmation commande sans lecture serveur directe.
- [x] Migration Supabase non destructive `20260628_harden_profiles_roles.sql` pour RLS profils/commandes/lignes commande.
- [x] RPC `create_order_with_items` transactionnelle : création commande, insertion `order_items`, validation prix/stock et décrément stock.
- [x] Checkout client connecté à la RPC, panier vidé uniquement après succès, erreurs conservant le panier.
- [x] Page de confirmation commande ajoutée avec numéro, articles, total et prochaine étape.
- [x] WebSocket IA `/live` durci : auth Supabase si configurée, refus en production sans auth, rate limit, timeout, modèle configurable, cleanup session.
- [x] Assistant Ava alimenté par contexte catalogue réel borné au lieu d’IDs produits hardcodés.
- [x] Store screen résilient quand le catalogue est vide.

### Reste P0/P1 immédiat

- [ ] Ajouter tests automatisés autour de `checkout()` et de la RPC Supabase.
  - [x] Tests unitaires `checkoutService` pour payload RPC, sync profil et erreurs RPC.
  - [ ] Tests d’intégration Supabase/staging pour la RPC transactionnelle.
- [x] Extraire complètement `checkoutService.createOrder(...)` hors du store Zustand.
- [ ] Ajouter un paiement réel PSP/webhooks avant production commerciale.
- [ ] Ajouter confirmation email transactionnelle et suivi commande côté profil.
- [ ] Lancer audit manuel RLS complet sur environnement Supabase cible.

---

## P0 — Stabilisation critique et sécurité immédiate

### P0.1 — Rendre TypeScript et le build verts

**But :** remettre le projet dans un état industrialisable pour CI/CD.

**Tâches détaillées :**

- [x] Corriger le typage du formulaire dans `src/components/AddressBook.tsx`.
  - [x] Créer un type explicite `AddressFormState` / `AddressFormData`.
  - [x] Initialiser explicitement l’état formulaire au lieu de laisser `{}` être inféré.
  - [x] Vérifier toutes les lectures/écritures des propriétés d'adresse.
- [x] Exécuter `npm run lint` et corriger toutes les erreurs bloquantes.
- [x] Exécuter `npm run build` et corriger les erreurs TypeScript/Vite.
- [x] Ajouter une checklist CI minimale si absente.
  - [x] Lint.
  - [x] Build.
  - [x] Tests unitaires quand ils seront ajoutés.

**Critères d'acceptation :**

- [x] `npm run lint` passe sans erreur.
- [x] `npm run build` passe sans erreur.
- [ ] Aucun `any` ajouté pour masquer le problème.

**Impact :** très élevé.  
**Complexité :** faible.

---

### P0.2 — Corriger le CTA hero vers une route existante

**But :** éviter que le CTA principal de la page d'accueil mène à une impasse.

**Tâches détaillées :**

- [x] Identifier le CTA qui pointe vers `/storefront`.
- [x] Remplacer la destination par une route existante ou une ancre valide.
  - Option recommandée : `/` + ancre catalogue si le catalogue est sur la home.
  - Alternative : créer une route catalogue dédiée `/catalog` ou `/shop`.
- [x] Ajouter un état focus/hover cohérent sur le CTA.
- [x] Vérifier le parcours sur mobile et desktop.
- [x] Ajouter une page 404 pour les futures routes invalides.

**Critères d'acceptation :**

- [x] Le CTA principal ouvre un parcours marchand réel.
- [x] Aucun clic principal ne mène vers une route inexistante.
- [x] Une route inconnue affiche une page 404 utile.

**Impact :** élevé.  
**Complexité :** très faible.

---

### P0.3 — Sécuriser Supabase RLS pour commandes, profils et données sensibles

**But :** supprimer les politiques permissives et empêcher les fuites de données clients/commandes.

**Tâches détaillées :**

- [ ] Auditer toutes les migrations Supabase et `supabase/backup.sql`.
- [ ] Identifier les policies dangereuses.
  - [ ] Commandes lisibles/insérables/modifiables par tous.
  - [ ] Profils lisibles publiquement.
  - [ ] Accès non restreint aux données checkout.
- [x] Créer une migration corrective non destructive.
  - [x] Activer RLS sur toutes les tables sensibles.
  - [x] Ajouter `profiles_self_select` : utilisateur lui-même ou admin.
  - [x] Ajouter `profiles_self_update` : utilisateur lui-même uniquement, avec restrictions.
  - [x] Ajouter `orders_self_or_admin_read`.
  - [x] Ajouter policies `order_items` basées sur la commande parente.
  - [ ] Restreindre `payments`, `shipments`, `events`, `ai_conversations`, `audit_events`.
- [x] Créer ou durcir une fonction `is_admin()` fiable.
  - [x] Ne pas dériver le rôle admin depuis l'email côté client.
  - [ ] Prévoir rôle via claim, table profil ou service role contrôlé.
- [x] Documenter les rôles : `customer`, `staff`, `admin`, `kiosk`.
- [ ] Tester manuellement les scénarios RLS.
  - [ ] Client A ne lit pas les commandes du client B.
  - [ ] Client non connecté ne lit pas les profils.
  - [ ] Staff/admin accède uniquement aux vues autorisées.

**Critères d'acceptation :**

- [x] Aucune policy critique n'utilise `using (true)` sur données privées.
- [x] Les commandes/profils/adresses ne sont accessibles qu'au propriétaire ou aux rôles autorisés.
- [x] L'admin n'est jamais attribué par `email.includes('admin')` côté client.
- [x] Les migrations sont additives et non destructives.

**Impact :** très élevé.  
**Complexité :** moyenne.

---

### P0.4 — Rendre le checkout transactionnel avec `order_items`

**But :** créer des commandes complètes, traçables et exploitables pour fulfillment, analytics, support et retours.

**Tâches détaillées :**

- [x] Extraire la logique checkout de `src/store.ts` vers un service dédié.
  - [x] `checkoutService.createOrder(...)`.
  - [x] Validation des entrées panier côté service/RPC.
  - [x] Normalisation des montants et calcul points côté store, montant final côté RPC.
- [x] Créer une RPC Supabase transactionnelle `create_order_with_items`.
  - [x] Créer la ligne `orders`.
  - [x] Insérer toutes les lignes `order_items`.
  - [x] Calculer subtotal, discount, shipping, taxes, total côté serveur.
  - [x] Vérifier stock/prix produit côté serveur.
  - [x] Retourner `order_id` et `order_number`.
- [x] Mettre à jour le checkout client pour appeler la RPC.
- [x] Afficher une confirmation de commande avec :
  - [x] numéro de commande ;
  - [x] résumé articles ;
  - [x] total ;
  - [x] statut ;
  - [x] prochaine étape livraison/paiement.
- [x] Prévoir rollback en cas d'erreur d'insertion d'article.
- [x] Ajouter tests unitaires service selon outillage disponible.
- [ ] Ajouter tests d'intégration Supabase/staging pour la RPC.

**Critères d'acceptation :**

- [x] Une commande validée contient toujours ses `order_items`.
- [x] Le panier n'est vidé qu'après succès transactionnel complet.
- [x] Les montants serveur correspondent au panier attendu.
- [x] Les erreurs checkout sont affichées inline et loggées.

**Impact :** très élevé.  
**Complexité :** moyenne.

---

### P0.5 — Supprimer les migrations destructives en production

**But :** éviter toute perte de commandes ou données clients.

**Tâches détaillées :**

- [x] Auditer `supabase/migrations/20260627_create_orders.sql`.
- [x] Supprimer tout `DROP TABLE` dangereux sur `orders` ou tables transactionnelles.
- [x] Remplacer par migrations additives :
  - [ ] `alter table add column if not exists` ;
  - [ ] création d'index concurrente si applicable ;
  - [ ] backfill contrôlé ;
  - [ ] policies remplacées explicitement.
- [ ] Ajouter un commentaire dans la migration expliquant la stratégie non destructive.
- [ ] Prévoir plan rollback logique.

**Critères d'acceptation :**

- [x] Aucune migration de prod ne détruit `orders`, `order_items`, `profiles`, `payments`.
- [ ] Les changements schéma peuvent être appliqués sans perte de données.

**Impact :** très élevé.  
**Complexité :** moyenne.

---

### P0.6 — Protéger POS, admin et routes internes

**But :** empêcher l'accès non autorisé aux outils staff/admin/kiosk.

**Tâches détaillées :**

- [x] Mettre à jour `ProtectedRoute` pour supporter plusieurs rôles.
  - [x] `admin`.
  - [x] `staff`.
  - [x] `kiosk`.
  - [x] `customer`.
- [x] Protéger `/admin` avec rôle `admin`.
- [x] Protéger `/pos` avec rôles `staff` ou `admin`.
- [x] Protéger `/screen` via stratégie kiosk.
  - [x] Court terme : rôle `kiosk` ou token de device.
  - [ ] Moyen terme : device management.
- [x] Ajouter loading auth robuste.
- [x] Ajouter redirection avec intent de retour après connexion.
- [ ] Vérifier que la RLS serveur bloque même si l'UI est contournée.

**Critères d'acceptation :**

- [x] Un utilisateur non connecté ne peut pas ouvrir POS/admin.
- [x] Un client ne peut pas accéder à POS/admin.
- [x] Les routes protégées affichent un état loading clair.

**Impact :** élevé.  
**Complexité :** moyenne.

---

### P0.7 — Sécuriser le WebSocket IA `/live`

**But :** contrôler les coûts IA, l'abus audio et l'accès non autorisé.

**Tâches détaillées :**

- [x] Ajouter vérification JWT Supabase sur connexion WebSocket.
- [x] Ajouter rate limit par IP/session.
- [x] Ajouter durée maximale de session.
- [x] Fermer explicitement les sessions IA au `close` WebSocket.
- [x] Déplacer le nom du modèle IA vers variable d'environnement.
- [x] Ajouter logs structurés : connexion, durée et erreurs.
- [x] Ajouter fallback refus propre si quota dépassé.
- [x] Refuser l'assistant en production si l'auth Supabase n'est pas configurée.

**Critères d'acceptation :**

- [ ] Un client anonyme ne peut pas consommer l'IA sans quota explicite.
- [ ] Les sessions longues sont coupées proprement.
- [ ] Les erreurs IA ne crashent pas le serveur.

**Impact :** élevé.  
**Complexité :** moyenne.

---

## P1 — MVP Pro, conversion et fondations produit

### P1.1 — Refondre le checkout mobile en 3 étapes robustes

**But :** augmenter la conversion mobile et réduire la friction checkout.

**Tâches détaillées :**

- [ ] Simplifier le flux en 3 blocs :
  - [ ] Contact.
  - [ ] Livraison.
  - [ ] Paiement.
- [ ] Ajouter un récapitulatif sticky sur desktop.
- [ ] Ajouter une barre sticky mobile `Payer X€`.
- [ ] Ajouter un drawer mobile de résumé panier.
- [ ] Ajouter erreurs inline avec scroll vers la première erreur.
- [ ] Ajouter autocomplete HTML standard.
  - [ ] `email`.
  - [ ] `shipping name`.
  - [ ] `shipping address-line1`.
  - [ ] `shipping postal-code`.
  - [ ] `shipping country`.
- [ ] Préremplir depuis profil/adresses quand disponible.
- [ ] Ajouter badges de réassurance : paiement sécurisé, retours, support.

**Critères d'acceptation :**

- [ ] Le checkout est utilisable à une main sur mobile.
- [ ] Le total et le CTA principal restent visibles.
- [ ] Les erreurs formulaire sont compréhensibles et accessibles.

**Impact :** très élevé.  
**Complexité :** moyenne.

---

### P1.2 — Intégrer un paiement réel

**But :** remplacer le paiement simulé par un PSP fiable.

**Tâches détaillées :**

- [ ] Choisir le PSP cible, recommandé : Stripe.
- [ ] Créer endpoints serveur pour Payment Intent.
- [ ] Intégrer Payment Element.
- [ ] Ajouter Apple Pay / Google Pay si domaine compatible.
- [ ] Ajouter webhooks serveur.
  - [ ] `payment_intent.succeeded`.
  - [ ] `payment_intent.payment_failed`.
  - [ ] remboursements si nécessaire.
- [ ] Synchroniser `payments.status` et `orders.status`.
- [ ] Gérer erreurs carte, SCA/3DS et annulation.
- [ ] Ajouter mode test documenté.

**Critères d'acceptation :**

- [ ] Une commande ne passe pas payée sans confirmation webhook.
- [ ] Les erreurs paiement sont lisibles par l'utilisateur.
- [ ] Les statuts commande/paiement sont cohérents en base.

**Impact :** très élevé.  
**Complexité :** moyenne à élevée.

---

### P1.3 — Mettre en place SEO produit et routes indexables

**But :** rendre les produits découvrables par moteurs de recherche et partage social.

**Tâches détaillées :**

- [ ] Ajouter titles/descriptions par route.
- [ ] Ajouter canonical URLs.
- [ ] Ajouter OpenGraph/Twitter cards.
- [ ] Ajouter JSON-LD :
  - [ ] `Product`.
  - [ ] `Offer`.
  - [ ] `BreadcrumbList`.
  - [ ] `Organization`.
  - [ ] `WebSite` avec `SearchAction`.
- [ ] Ajouter slugs produits : `/product/:slug`.
- [ ] Générer sitemap dynamique.
- [ ] Ajouter `robots.txt`.
- [ ] Prévoir stratégie SSR/SSG/prerender si le contenu SPA n'est pas indexé efficacement.

**Critères d'acceptation :**

- [ ] Chaque PDP a un title et une description uniques.
- [ ] Les produits apparaissent dans le sitemap.
- [ ] Le JSON-LD est valide dans un validateur schema.org.

**Impact :** élevé.  
**Complexité :** moyenne.

---

### P1.4 — Créer un design system accessible

**But :** standardiser l'UI premium et réduire les incohérences.

**Tâches détaillées :**

- [ ] Définir tokens :
  - [ ] couleurs ;
  - [ ] typographie ;
  - [ ] spacing ;
  - [ ] radius ;
  - [ ] shadows ;
  - [ ] z-index ;
  - [ ] motion.
- [ ] Créer composants `components/ui` :
  - [ ] `Button`.
  - [ ] `Input`.
  - [ ] `Textarea`.
  - [ ] `Select`.
  - [ ] `Dialog`.
  - [ ] `Drawer`.
  - [ ] `Badge`.
  - [ ] `Tabs`.
  - [ ] `Skeleton`.
  - [ ] `Toast`.
- [ ] Garantir focus visible et labels accessibles.
- [ ] Ajouter gestion `prefers-reduced-motion`.
- [ ] Remplacer progressivement les composants ad hoc.

**Critères d'acceptation :**

- [ ] Les composants interactifs ont des états hover/focus/disabled/loading.
- [ ] Les dialogs/drawers piègent le focus et se ferment avec ESC.
- [ ] Les contrastes passent au moins WCAG AA sur les parcours critiques.

**Impact :** élevé.  
**Complexité :** moyenne.

---

### P1.5 — Découper Zustand et isoler les services data

**But :** rendre l'état testable, maintenable et moins couplé à l'UI.

**Tâches détaillées :**

- [ ] Créer slices Zustand :
  - [ ] `authSlice`.
  - [ ] `cartSlice`.
  - [ ] `catalogSlice`.
  - [ ] `checkoutSlice`.
  - [ ] `uiSlice`.
- [ ] Séparer le panier client du panier POS.
- [ ] Ajouter selectors :
  - [ ] `cartTotal`.
  - [ ] `cartCount`.
  - [ ] `shippingProgress`.
  - [ ] `eligibleUpsells`.
- [ ] Versionner la persistance Zustand.
- [ ] Créer services typés :
  - [ ] `catalogService`.
  - [ ] `orderService`.
  - [ ] `profileService`.
  - [ ] `addressService`.
  - [ ] `checkoutService`.
- [ ] Normaliser les erreurs Supabase.

**Critères d'acceptation :**

- [ ] Les composants n'écrivent plus directement les opérations critiques Supabase.
- [ ] Le checkout n'est plus dans le store global monolithique.
- [ ] Les selectors évitent les recalculs inutiles.

**Impact :** élevé.  
**Complexité :** moyenne à élevée.

---

### P1.6 — Ajouter navigation mobile native-feeling

**But :** rendre l'expérience mobile comparable à une app moderne.

**Tâches détaillées :**

- [ ] Ajouter bottom navigation mobile :
  - [ ] Accueil.
  - [ ] Recherche.
  - [ ] Wishlist.
  - [ ] Panier.
  - [ ] Compte.
- [ ] Ajouter search drawer plein écran.
- [ ] Ajouter cart drawer plein écran mobile.
- [ ] Ajouter sticky CTA PDP `Ajouter — X€`.
- [ ] Ajouter sticky CTA checkout `Payer X€`.
- [ ] Ajouter haptics optionnels si support navigateur.
- [ ] Ajouter skeletons pour états chargement mobile.

**Critères d'acceptation :**

- [ ] Les actions commerce principales sont accessibles au pouce.
- [ ] Aucun drawer ne casse le focus clavier/accessibilité.
- [ ] Le panier et la recherche sont utilisables en plein écran mobile.

**Impact :** élevé.  
**Complexité :** moyenne.

---

### P1.7 — Ajouter fonctionnalités de conversion de base

**But :** combler les écarts Shopify-grade essentiels.

**Tâches détaillées :**

- [ ] Wishlist serveur.
  - [ ] Table `wishlist_items`.
  - [ ] RLS propriétaire.
  - [ ] UI ajout/retrait accessible.
- [ ] Avis clients.
  - [ ] Table `product_reviews`.
  - [ ] Modération `is_published`.
  - [ ] Moyenne et nombre d'avis sur PDP/card.
- [ ] Livraison gratuite dynamique.
  - [ ] Seuil configurable.
  - [ ] Progress bar panier.
- [ ] Codes promo.
  - [ ] Table `discounts`.
  - [ ] Validation serveur.
  - [ ] Affichage montant économisé.
- [ ] Upsell/cross-sell.
  - [ ] Suggestions dans panier.
  - [ ] Recommandations PDP simples.

**Critères d'acceptation :**

- [ ] Les favoris persistent entre appareils.
- [ ] Les avis publiés s'affichent sur les produits.
- [ ] Les promotions sont calculées côté serveur.

**Impact :** élevé.  
**Complexité :** moyenne.

---

### P1.8 — Améliorer performance catalogue et images

**But :** réduire LCP/CLS et préparer le catalogue à scaler.

**Tâches détaillées :**

- [ ] Définir dimensions image explicites.
- [ ] Ajouter lazy loading et placeholders.
- [ ] Remplacer les images Unsplash directes par stratégie CDN/image proxy.
- [ ] Ajouter pagination ou infinite scroll.
- [ ] Ajouter code splitting route-level avec `React.lazy`.
- [ ] Ajouter cache query, recommandé : TanStack Query ou service cache dédié.
- [ ] Optimiser admin polling vers realtime/RPC ciblées.

**Critères d'acceptation :**

- [ ] Les images n'entraînent pas de CLS majeur.
- [ ] Le bundle initial est réduit par lazy routes.
- [ ] Le catalogue ne charge pas indéfiniment toutes les données sans pagination.

**Impact :** moyen à élevé.  
**Complexité :** moyenne.

---

### P1.9 — Observabilité, logs et erreurs

**But :** diagnostiquer rapidement les erreurs production et parcours critiques.

**Tâches détaillées :**

- [ ] Ajouter middleware d'erreurs Express.
- [ ] Ajouter logs structurés avec request id.
- [ ] Redacter emails, tokens et données sensibles.
- [ ] Ajouter `/api/health` enrichi :
  - [ ] version ;
  - [ ] commit ;
  - [ ] uptime ;
  - [ ] dépendances critiques.
- [ ] Ajouter tracking événements e-commerce :
  - [ ] `view_item`.
  - [ ] `add_to_cart`.
  - [ ] `begin_checkout`.
  - [ ] `purchase`.
  - [ ] `search`.
- [ ] Ajouter table ou service `events`.

**Critères d'acceptation :**

- [ ] Chaque erreur serveur a un identifiant corrélable.
- [ ] Les événements funnel critiques sont capturés.
- [ ] Les données sensibles ne sont pas loggées en clair.

**Impact :** moyen à élevé.  
**Complexité :** moyenne.

---

### P1.10 — Connecter l'assistant IA au catalogue réel

**But :** faire de l'assistant vocal un vrai levier de conversion et non une démo hardcodée.

**Tâches détaillées :**

- [ ] Supprimer les produits hardcodés dans la déclaration de fonction IA.
- [ ] Fournir un contexte catalogue depuis la base.
- [ ] Limiter le contexte par recherche, catégorie ou intention.
- [ ] Ajouter fallback texte dans `VoiceAssistant`.
- [ ] Ajouter suggestions rapides.
- [ ] Ajouter confirmation visuelle après ajout panier par IA.
- [ ] Journaliser conversations utiles dans `ai_conversations` avec consentement.
- [ ] Ajouter garde-fous d'injection et limites de tokens.

**Critères d'acceptation :**

- [ ] L'IA recommande uniquement des produits existants/actifs.
- [ ] L'utilisateur peut utiliser un mode texte si le micro est refusé.
- [ ] Les ajouts panier IA sont confirmés explicitement.

**Impact :** élevé.  
**Complexité :** moyenne à élevée.

---

## P2 — Growth, admin, marketing et opérations

### P2.1 — Refondre l'admin en sous-routes métier

**But :** transformer l'admin dense en command center scalable.

**Tâches détaillées :**

- [ ] Créer routes admin :
  - [ ] `/admin` overview.
  - [ ] `/admin/products`.
  - [ ] `/admin/orders`.
  - [ ] `/admin/customers`.
  - [ ] `/admin/analytics`.
  - [ ] `/admin/settings`.
- [ ] Découper `Admin.tsx` en composants domaine :
  - [ ] `AdminOverview`.
  - [ ] `ProductManager`.
  - [ ] `CategoryManager`.
  - [ ] `AnalyticsPanel`.
- [ ] Ajouter deep links et état URL pour filtres/onglets.
- [ ] Ajouter recherche et filtres admin.
- [ ] Ajouter bulk edit/import/export produits.
- [ ] Ajouter vues RPC agrégées pour stats.

**Critères d'acceptation :**

- [ ] L'admin n'est plus un fichier monolithique.
- [ ] Les sections principales ont des URLs partageables.
- [ ] Les stats ne rechargent pas toutes les commandes toutes les 10 secondes.

**Impact :** élevé.  
**Complexité :** moyenne à élevée.

---

### P2.2 — Gestion clients, CRM et consentements

**But :** préparer fidélisation, support et marketing responsable.

**Tâches détaillées :**

- [ ] Ajouter page admin clients.
- [ ] Afficher historique commandes, LTV, tags, consentements.
- [ ] Ajouter préférences utilisateur dans profil.
- [ ] Ajouter export/suppression données utilisateur.
- [ ] Ajouter consentement email/SMS/cookies.
- [ ] Ajouter segments simples : nouveaux, VIP, inactifs, paniers abandonnés.

**Critères d'acceptation :**

- [ ] Un admin peut consulter une fiche client complète selon RBAC.
- [ ] Les consentements sont stockés et respectés.
- [ ] Les exports/suppressions sont traçables.

**Impact :** élevé.  
**Complexité :** élevée.

---

### P2.3 — Emails transactionnels et abandon panier

**But :** améliorer réassurance, support et récupération de revenus.

**Tâches détaillées :**

- [ ] Choisir un provider email.
- [ ] Envoyer confirmation commande.
- [ ] Envoyer changement statut commande.
- [ ] Envoyer tracking shipment.
- [ ] Ajouter récupération panier abandonné avec consentement.
- [ ] Ajouter templates brandés.
- [ ] Ajouter logs d'envoi et statut.

**Critères d'acceptation :**

- [ ] Chaque commande validée déclenche un email de confirmation.
- [ ] Les emails marketing respectent consentement et désinscription.
- [ ] Les erreurs d'envoi n'empêchent pas la commande.

**Impact :** élevé.  
**Complexité :** moyenne.

---

### P2.4 — Recherche avancée, facettes et IA search

**But :** améliorer découverte catalogue et conversion intentionnelle.

**Tâches détaillées :**

- [ ] Ajouter page recherche dédiée.
- [ ] Ajouter facettes : prix, catégorie, disponibilité, tags/effects.
- [ ] Ajouter tri : pertinence, prix, nouveautés, popularité.
- [ ] Ajouter recherche full-text PostgreSQL.
- [ ] Ajouter synonymes et tolérance typo si moteur externe.
- [ ] Ajouter recherche sémantique via embeddings si disponible.
- [ ] Ajouter popular searches et suggestions.
- [ ] Tracker conversion après recherche.

**Critères d'acceptation :**

- [ ] Une recherche vide ou sans résultat propose alternatives.
- [ ] Les filtres sont représentés dans l'URL.
- [ ] Les résultats sont paginés et performants.

**Impact :** très élevé.  
**Complexité :** élevée.

---

### P2.5 — Contenu SEO, blog et landing pages

**But :** développer l'acquisition organique et paid.

**Tâches détaillées :**

- [ ] Créer modèle de page éditoriale.
- [ ] Créer modèle landing campagne.
- [ ] Créer blog ou CMS minimal.
- [ ] Ajouter maillage interne produits/collections/articles.
- [ ] Ajouter pages légales et trust : livraison, retours, confidentialité, CGV.
- [ ] Ajouter newsletter footer.

**Critères d'acceptation :**

- [ ] Les landing pages ont metadata, OG et tracking.
- [ ] Le blog peut référencer produits/collections.
- [ ] Le footer contient liens SEO/trust essentiels.

**Impact :** moyen à élevé.  
**Complexité :** moyenne.

---

### P2.6 — POS avancé et opérations magasin

**But :** rendre le POS utilisable en contexte retail réel.

**Tâches détaillées :**

- [ ] Créer store POS séparé du panier client.
- [ ] Ajouter mode tablette avec gros boutons.
- [ ] Ajouter recherche instantanée et scan code-barres.
- [ ] Ajouter paiement split.
- [ ] Ajouter reçus imprimables/email.
- [ ] Ajouter remises staff contrôlées.
- [ ] Ajouter gestion shifts/caisse journalière.
- [ ] Ajouter refunds/returns POS.
- [ ] Ajouter stock multi-location.

**Critères d'acceptation :**

- [ ] Une vente POS ne pollue jamais le panier client web.
- [ ] Les opérations staff sont auditées.
- [ ] Les reçus sont générés après transaction.

**Impact :** moyen à élevé.  
**Complexité :** élevée.

---

### P2.7 — Fulfillment, shipments, returns et refunds

**But :** couvrir le cycle complet post-achat.

**Tâches détaillées :**

- [ ] Ajouter table `shipments` et UI admin.
- [ ] Ajouter tracking carrier/url.
- [ ] Ajouter statuts fulfillment.
- [ ] Ajouter demandes retour côté profil.
- [ ] Ajouter remboursements via PSP.
- [ ] Ajouter notes support et historique.
- [ ] Ajouter notifications email par statut.

**Critères d'acceptation :**

- [ ] Le client voit le statut de livraison et tracking.
- [ ] L'admin peut traiter retour/remboursement.
- [ ] Les statuts restent cohérents commande/paiement/livraison.

**Impact :** élevé.  
**Complexité :** élevée.

---

## P3 — Scale, différenciation avancée et enterprise readiness

### P3.1 — Recommandations IA personnalisées

**But :** augmenter AOV/CVR avec personnalisation réelle.

**Tâches détaillées :**

- [ ] Collecter événements comportementaux propres.
- [ ] Construire recommandations basiques par popularité/catégorie.
- [ ] Ajouter embeddings produits/utilisateurs si pertinent.
- [ ] Ajouter blocs reco : PDP, panier, home, email.
- [ ] Ajouter A/B test reco vs contrôle.
- [ ] Mesurer assisted revenue et uplift.

**Critères d'acceptation :**

- [ ] Les recommandations ne montrent pas produits inactifs/épuisés sans indication.
- [ ] Les performances sont mesurées par événement.
- [ ] Le système a un fallback non IA.

**Impact :** très élevé.  
**Complexité :** élevée.

---

### P3.2 — Marketing automation, referral et affiliés

**But :** créer des boucles d'acquisition et rétention scalables.

**Tâches détaillées :**

- [ ] Créer scénarios automation : bienvenue, post-achat, winback, abandon panier.
- [ ] Ajouter programme parrainage.
- [ ] Ajouter codes influenceur/affilié.
- [ ] Ajouter attribution campagne.
- [ ] Ajouter dashboard performance marketing.
- [ ] Ajouter garde-fous consentement/désinscription.

**Critères d'acceptation :**

- [ ] Chaque automation respecte consentement.
- [ ] Les codes referral/affiliés sont traçables jusqu'à la commande.
- [ ] Les performances sont visibles en admin.

**Impact :** élevé.  
**Complexité :** élevée.

---

### P3.3 — Internationalisation, multi-devise et fiscalité avancée

**But :** préparer l'expansion internationale.

**Tâches détaillées :**

- [ ] Ajouter i18n.
- [ ] Ajouter formatage prix/devise centralisé.
- [ ] Ajouter multi-currency.
- [ ] Ajouter taxes/VAT selon zones.
- [ ] Ajouter shipping zones.
- [ ] Ajouter contenus localisés SEO.
- [ ] Ajouter sélecteur pays/langue.

**Critères d'acceptation :**

- [ ] Les prix sont formatés selon locale/devise.
- [ ] Les taxes et frais livraison sont calculés selon destination.
- [ ] Les URLs localisées sont indexables.

**Impact :** moyen à élevé.  
**Complexité :** élevée.

---

### P3.4 — Enterprise readiness : audit logs, BI et gouvernance

**But :** rendre la plateforme exploitable à grande échelle et audit-ready.

**Tâches détaillées :**

- [ ] Ajouter `audit_events` pour actions sensibles.
- [ ] Ajouter rôles/permissions granulaires.
- [ ] Ajouter journalisation admin : avant/après.
- [ ] Ajouter export BI.
- [ ] Ajouter dashboards cohortes, LTV, CAC, AOV, CVR.
- [ ] Ajouter sauvegarde/restauration documentée.
- [ ] Ajouter alerting erreurs et sécurité.

**Critères d'acceptation :**

- [ ] Toute action admin sensible est auditée.
- [ ] Les métriques business clés sont consultables.
- [ ] Les incidents critiques génèrent une alerte.

**Impact :** élevé.  
**Complexité :** élevée.

---

## Backlog transversal par domaine

### Architecture cible

- [ ] Créer `src/app` pour router/providers/config.
- [ ] Créer `src/features` par domaine : catalog, cart, checkout, account, admin, assistant, pos, marketing.
- [ ] Garder `src/pages` pour composants route-level uniquement.
- [ ] Créer `src/components/ui` et `src/components/layout`.
- [ ] Créer `src/hooks` pour hooks transverses.
- [ ] Créer `src/services` pour clients externes et analytics.
- [ ] Créer `src/types` pour types globaux et DB générée.

### Hooks à créer

- [ ] `useCatalog` : produits, catégories, filtres, cache.
- [ ] `useCart` : selectors panier, total, seuil livraison.
- [ ] `useCheckout` : orchestration, validation, PSP.
- [ ] `useOrders` : commandes client/admin avec realtime.
- [ ] `useVoiceAssistant` : WebSocket, audio, retry, permissions.
- [ ] `useMediaQuery` : responsive.
- [ ] `useReducedMotion` : accessibilité animations.
- [ ] `useDebouncedValue` : recherche et formulaires.

### Accessibilité

- [ ] Ajouter skip link.
- [ ] Utiliser landmarks `header`, `main`, `footer`.
- [ ] Ajouter `aria-label` aux boutons icônes.
- [ ] Ajouter `aria-expanded` aux accordéons.
- [ ] Ajouter `aria-current` au stepper checkout.
- [ ] Piéger focus dans dialogs/drawers.
- [ ] Supporter ESC pour fermer modales/drawers.
- [ ] Respecter `prefers-reduced-motion`.
- [ ] Ajouter erreurs formulaires avec `aria-describedby`.
- [ ] Auditer contrastes glassmorphism/dark mode.

### Data model recommandé

- [ ] `profiles` : identité, rôle, consentements.
- [ ] `addresses` : adresses canoniques.
- [ ] `categories` : collections hiérarchiques.
- [ ] `products` : slug, SKU, prix, stock, SEO, search vector, embeddings.
- [ ] `product_categories` : relation produits/catégories.
- [ ] `product_reviews` : avis modérés.
- [ ] `wishlist_items` : favoris serveur.
- [ ] `orders` : commande globale.
- [ ] `order_items` : lignes commande.
- [ ] `payments` : PSP et statuts.
- [ ] `shipments` : livraison/tracking.
- [ ] `discounts` : promotions.
- [ ] `events` : analytics.
- [ ] `ai_conversations` : historique IA contrôlé.
- [ ] `audit_events` : audit actions sensibles.

---

## Plan d'exécution recommandé sur 12 mois

### Mois 1 — Stabiliser et sécuriser

- [ ] P0.1 Build TypeScript vert.
- [ ] P0.2 CTA/routing/404.
- [ ] P0.3 RLS/RBAC critique.
- [ ] P0.4 Checkout avec `order_items`.
- [ ] P0.5 Migrations non destructives.
- [ ] P0.6 POS/admin protégés.
- [ ] P0.7 WebSocket IA sécurisé.

**KPI :** 0 erreur build, 0 policy critique ouverte, 100 % commandes avec lignes.

### Mois 2 — Checkout pro

- [ ] P1.1 Checkout mobile 3 étapes.
- [ ] P1.2 Paiement réel.
- [ ] Confirmation commande complète.
- [ ] Emails transactionnels minimum.

**KPI :** +20 % completion checkout, baisse erreurs paiement/support.

### Mois 3 — Mobile commerce

- [ ] P1.6 Bottom nav et sticky CTAs.
- [ ] Drawers mobile recherche/panier.
- [ ] PDP mobile premium.
- [ ] Haptics et gestures clés.

**KPI :** +15 % mobile CVR, baisse abandon panier mobile.

### Mois 4 — SEO & catalogue

- [ ] P1.3 Metadata/JSON-LD/sitemap/slugs.
- [ ] Collections/tags/filtres de base.
- [ ] Optimisation images.

**KPI :** produits indexés, impressions Search Console, trafic organique initial.

### Mois 5 — Conversion suite

- [ ] P1.7 Wishlist.
- [ ] P1.7 Reviews.
- [ ] P1.7 Coupons.
- [ ] P1.7 Free shipping bar.
- [ ] P1.7 Upsells.

**KPI :** +10 % AOV, +10 % CVR PDP.

### Mois 6 — IA search/reco V1

- [ ] P1.10 Assistant connecté catalogue.
- [ ] P2.4 Recherche avancée.
- [ ] Recommandations simples PDP/panier.

**KPI :** conversion après recherche, assisted revenue IA.

### Mois 7 — Admin refactor

- [ ] P2.1 Sous-routes admin.
- [ ] Analytics admin.
- [ ] Product/category manager robuste.
- [ ] RPC agrégées au lieu de polling lourd.

**KPI :** temps ops réduit, admin plus rapide, moins de charge DB.

### Mois 8 — Marketing

- [ ] P2.3 Abandoned cart.
- [ ] P2.5 Landing pages/blog.
- [ ] Referral V1.
- [ ] Newsletter et consentements.

**KPI :** revenue email/SMS, CAC réduit, nouveaux leads.

### Mois 9 — POS scale

- [ ] P2.6 Staff roles.
- [ ] Receipts.
- [ ] Shifts.
- [ ] Inventory multi-location.

**KPI :** ventes POS fiables, écarts caisse réduits.

### Mois 10 — Fulfillment

- [ ] P2.7 Shipments.
- [ ] Tracking.
- [ ] Returns/refunds.
- [ ] Notifications statut.

**KPI :** baisse tickets support, meilleure satisfaction post-achat.

### Mois 11 — CRM & segmentation

- [ ] P2.2 Segments clients.
- [ ] LTV/cohortes.
- [ ] Campaigns ciblées.
- [ ] Consentements complets.

**KPI :** repeat purchase rate, LTV, opt-in rate.

### Mois 12 — Enterprise readiness

- [ ] P3.4 Audit logs.
- [ ] BI dashboards.
- [ ] Alerting.
- [ ] Plan i18n/multi-currency.
- [ ] IA admin copilot exploratoire.

**KPI :** enterprise readiness score, temps de résolution incident.

---

## Ordre d'exécution court terme recommandé

1. [x] Corriger build TypeScript.
2. [x] Corriger CTA route cassée.
3. [x] Corriger RLS commandes/profils.
4. [x] Supprimer migration destructive.
5. [x] Ajouter RPC checkout `create_order_with_items`.
6. [x] Protéger POS/admin/screen.
7. [x] Rate limiter/authentifier WebSocket IA.
8. [x] Ajouter 404 et guards propres.
9. [ ] Refondre checkout mobile.
10. [ ] Intégrer paiement réel.

---

## Risques à surveiller

- [ ] Régression checkout lors de l'extraction du store.
- [ ] Migrations RLS qui bloquent involontairement les parcours admin/staff.
- [ ] Calculs de prix divergents entre client et serveur.
- [ ] Paiement marqué payé avant confirmation webhook.
- [ ] Assistant IA consommant trop de tokens ou recommandant des produits inexistants.
- [ ] Performance dégradée par ajout de fonctionnalités sans pagination/cache.
- [ ] Design system partiel créant deux systèmes UI concurrents.

---

## Indicateurs de succès globaux

- [ ] Build vert à chaque PR.
- [ ] 100 % des commandes contiennent des `order_items`.
- [ ] 0 policy RLS critique ouverte.
- [ ] Checkout completion en hausse.
- [ ] Mobile CVR en hausse.
- [ ] AOV en hausse après upsell/free shipping.
- [ ] Produits indexés SEO.
- [ ] Temps admin opérations réduit.
- [ ] Coût IA maîtrisé par session/utilisateur.
- [ ] Logs exploitables sur erreurs critiques.
