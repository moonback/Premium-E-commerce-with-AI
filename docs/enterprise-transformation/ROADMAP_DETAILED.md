# Roadmap détaillée de transformation

## Phase 0 — Discovery & Guardrails (1-2 semaines)
- [x] Audit technique finalisé.
- [ ] KPI baseline: conversion, LCP, INP, CLS, taux d’erreurs.
- [ ] Setup qualité: strict TS, ESLint, Prettier, Husky, lint-staged.
- [ ] Setup tests: Vitest + RTL + Playwright.

## Phase 1 — Architecture Foundation (2-4 semaines)
- [ ] Mise en place structure FSD.
- [ ] Introduire couches `services/repositories/use-cases`.
- [ ] Découper store global en slices/domain stores.
- [ ] Router composition par domaines.

## Phase 2 — Data & Security Hardening (2-4 semaines)
- Schéma SQL multi-tenant propre + migrations.
- RLS exhaustive, indexes, triggers, fonctions.
- Audit logs, activity logs.
- RBAC permissions côté DB + UI.

## Phase 3 — White-label Engine (3-5 semaines)
- [ ] Tenant config loader dynamique (DB/API).
- [x] Theme engine runtime (base) implémenté.
- [ ] Templates storefront/admin/POS/checkout.
- [~] Branding dynamique (partiel: logo/nom/couleurs/format devise).

## Phase 4 — Commerce Enterprise Capabilities (4-8 semaines)
- Catalogue: variantes, bundles, subscriptions, digital.
- Inventory: multi-entrepôts, réservations, alerting.
- Checkout: guest, express, providers paiement.
- Marketing: coupons, promotions, loyalty, referral, gift cards.

## Phase 5 — Admin Enterprise & CMS (3-6 semaines)
- Dashboard analytics temps réel.
- Tables avancées, bulk ops, imports/exports.
- CMS builder (blocs dynamiques + SEO editor).

## Phase 6 — UX Premium, SEO & Performance (continu)
- Design system enterprise (tokens + components).
- SEO: schema.org, metadata dynamiques, sitemap/robots/canonicals.
- Lighthouse 95+ ciblé.

## Phase 7 — DevOps & Production Readiness (2-3 semaines)
- Docker + CI/CD + environnements staging/prod.
- Monitoring/alerting/error tracking.
- Backup & recovery + security scans.

## Definition of Done (plateforme)
- Isolation multi-tenant validée par tests.
- 0 vulnérabilité critique connue.
- Couverture de tests cible atteinte sur domaines critiques.
- SLO disponibilité + p95 performance documentés.
