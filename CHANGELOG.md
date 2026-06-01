# Changelog - Véridian E-commerce

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

---

## [1.1.0] - 2026-06-02

### 🎉 Nouvelles Fonctionnalités

#### E-commerce Avancé
- **Wishlist Serveur** : Favoris synchronisés entre appareils avec optimistic updates
- **Avis Clients** : Système complet avec notation, modération et affichage moyenne
- **Codes Promo** : Validation serveur avec types percentage/fixed et règles métier
- **Recommandations** : Suggestions intelligentes basées sur catégorie et prix similaire

#### UI/UX
- **Design System** : Tokens centralisés (couleurs, typo, spacing, radius, shadows, z-index, motion)
- **Composants UI** : Toast, Tooltip, Loading (Spinner/Dots/FullScreen)
- **Checkout Mobile** : Drawer résumé panier + barre sticky "Payer X€"
- **Recherche Avancée** : Filtres catégorie, prix, tri avec réinitialisation

#### Performance
- **Pagination** : Catalogue paginé (12 produits/page)
- **Lazy Loading** : Images chargées à la demande avec dimensions explicites
- **Bundle Optimisé** : 29.97 KB main (gzipped), code splitting actif

#### Accessibilité
- **Reduced Motion** : Hook `useReducedMotion` respectant préférences utilisateur
- **ARIA Labels** : Labels accessibles sur tous éléments interactifs
- **Focus Trap** : Dialog/Drawer piègent le focus, ESC pour fermer

### 🔒 Sécurité

- **RLS Policies** : Wishlist, avis et codes promo avec politiques restrictives
- **Validation Serveur** : RPC `validate_discount_code` avec règles métier complètes
- **Optimistic Updates** : Rollback automatique en cas d'erreur

### 📦 Migrations Supabase

- `20260701_add_wishlist_and_reviews.sql` - Tables wishlist_items et product_reviews
- `20260702_add_discounts_table.sql` - Table discounts avec RPC validation

### 📚 Documentation

- `PROGRESS_REPORT.md` - Rapport détaillé des progrès
- `STYLE_GUIDE.md` - Guide de style pour développeurs
- `SESSION_SUMMARY.md` - Résumé de session d'implémentation
- `CHANGELOG.md` - Ce fichier

### 🐛 Corrections

- Wishlist locale remplacée par wishlist serveur
- Toast par défaut remplacé par composant personnalisé
- Animations respectent maintenant `prefers-reduced-motion`

### 🔧 Améliorations Techniques

- TypeScript strict : 0 erreur, 0 `any`
- Lint propre : 0 warning
- Build time : ~6.5s
- Bundle size : 221 KB total (gzipped)

---

## [1.0.0] - 2026-05-31

### 🎉 Version Initiale

#### Fonctionnalités P0 (Critique)
- Build TypeScript vert
- RLS Supabase sur profils, commandes, tables sensibles
- Checkout transactionnel avec RPC `create_order_with_items`
- Paiement Stripe avec webhooks
- Migrations non-destructives
- WebSocket IA sécurisé
- Observabilité (logs structurés, requestId, health endpoint)

#### Fonctionnalités P1 (MVP Pro)
- SEO complet (JSON-LD, slugs, sitemap, robots.txt)
- Navigation mobile (bottom nav, search drawer, sticky CTAs)
- Assistant IA connecté au catalogue réel
- Code splitting route-level
- Vendor chunks séparés

#### Sécurité
- Rôles normalisés : customer, staff, kiosk, admin
- Routes protégées : /admin, /pos, /screen
- Suppression élévation admin côté client
- RLS sur toutes tables sensibles

#### Documentation
- `docs/SUPABASE_RLS_AUDIT.md`
- `docs/RLS_AUDIT_2026-05-31.md`
- `task-full.md`

---

## Format

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

### Types de Changements

- **🎉 Nouvelles Fonctionnalités** - Ajout de nouvelles fonctionnalités
- **🔒 Sécurité** - Corrections de vulnérabilités
- **🐛 Corrections** - Corrections de bugs
- **🔧 Améliorations** - Améliorations de fonctionnalités existantes
- **📦 Dépendances** - Mises à jour de dépendances
- **📚 Documentation** - Changements dans la documentation
- **⚠️ Déprécié** - Fonctionnalités bientôt supprimées
- **🗑️ Supprimé** - Fonctionnalités supprimées

---

**Dernière mise à jour:** 2 Juin 2026
