# Backlog restant — Implémentation à finaliser

## Priorité P0
- [ ] Brancher la configuration tenant dynamique à Supabase (table `tenant_config`) avec validation de schéma.
- [ ] Ajouter RLS sur tables multi-tenant (`tenant_id`) + tests de non-régression sécurité.
- [ ] Ajouter gestion d’erreur et fallback UX si chargement config tenant échoue.

## Priorité P1
- [ ] Migrer le theming tenant sur tous les composants legacy (checkout stepper, auth modal, admin cards, POS panels).
- [ ] Centraliser les tokens design (spacing, shadows, motion) par tenant et par mode secteur.
- [ ] Introduire feature flags tenant (modules activables/désactivables).

## Priorité P2
- [ ] Ajouter tests unitaires dédiés `useTenantBranding`.
- [ ] Ajouter tests d’intégration UI pour vérification locale/devise/couleurs par tenant.
- [ ] Ajouter tests E2E preview tenant (`?tenant=`) sur storefront.

## DevOps / Observabilité
- [ ] Instrumenter métriques de chargement config tenant (latence, taux d’erreur, fallback rate).
- [ ] Pipeline CI: exécuter `lint` + `test:tenant` + suite future Vitest/Playwright.
