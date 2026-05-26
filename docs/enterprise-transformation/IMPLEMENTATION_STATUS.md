# Statut d'implémentation — Transformation White-Label

> Dernière mise à jour: 2026-05-26

## ✅ Déjà implémenté

### Foundation white-label
- [x] Module `src/white-label` créé (`types.ts`, `config.ts`, `tenant.ts`, `format.ts`, `useTenantBranding.ts`).
- [x] Résolution tenant par hostname avec normalisation (`lowercase`, suppression du port).
- [x] Fallback tenant par défaut.
- [x] Preview tenant via query string (`?tenant=...`).
- [x] Application runtime de tokens thème tenant (couleurs, typo, radius).
- [x] Bridge tokens tenant -> tokens existants (`--color-bg`, `--color-ink`, `--color-accent`).

### Intégration UI
- [x] Branding initialisé globalement dans `App` via `useTenantBranding()`.
- [x] Header tenant-aware (logo + brand name + format locale des points fidélité).
- [x] Prix tenant-aware sur `ProductCard`.
- [x] Prix tenant-aware sur `ProductDetail`.
- [x] Prix tenant-aware sur `CartReview`.
- [x] Correctifs d’accès catégorie (`product.categories?.[0]`) sur vues concernées.

### Qualité & typage
- [x] `AppState` exposant `updateOrderStatus`.
- [x] `KitchenOrders` typé (`KitchenOrder[]`) + guard Supabase.
- [x] Typecheck global passe (`npm run lint`).

### Tests
- [x] Script `test:tenant` ajouté.
- [x] Tests de résolution tenant (host connu/inconnu, host + port, preview valide/invalide).
- [x] Tests de format devise (EUR/USD) sur tenants.

### Documentation
- [x] Audit complet (`AUDIT_REPORT.md`).
- [x] Architecture cible (`TARGET_ARCHITECTURE.md`).
- [x] Roadmap détaillée (`ROADMAP_DETAILED.md`).

## ⚠️ Partiellement implémenté
- [~] Engine white-label branché à une source de config dynamique (support `VITE_TENANT_CONFIG_URL` + cache localStorage ajouté, source Supabase/API dédiée à finaliser).
- [~] Engine white-label branché à une source de config dynamique (support `VITE_TENANT_CONFIG_URL` + cache localStorage + validation de schéma frontend, migration SQL `tenant_config` ajoutée).
- [~] Theming complet de tous les composants (migration étendue avec tokens tenant sur surfaces produit/panier/header + PaymentForm + POS pricing, mais d'autres composants legacy restent à migrer).
- [~] Centralisation tokens design (ajout tokens spacing/shadow/motion dans thème tenant, déploiement global en cours).
- [~] Feature flags tenant introduits (`adminEnabled`, `posEnabled`, `kitchenEnabled`) avec activation conditionnelle sur routes/modules.
- [ ] Couverture de test enterprise (actuellement smoke tests ciblés tenant).
- [~] Fallback UX chargement config tenant (indicateur visuel “config par défaut” ajouté dans le header, UX globale d’erreur à enrichir).
