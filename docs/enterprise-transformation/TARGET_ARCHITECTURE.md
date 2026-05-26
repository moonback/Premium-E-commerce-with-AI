# Architecture cible — SaaS White-Label E-commerce

## Structure cible

```txt
src/
├── app/
├── core/
├── shared/
├── entities/
├── features/
├── widgets/
├── pages/
├── processes/
├── services/
├── lib/
├── hooks/
├── store/
├── theme/
├── config/
├── types/
├── styles/
├── ai/
├── ecommerce/
├── checkout/
├── analytics/
├── auth/
├── admin/
├── pos/
├── cms/
└── white-label/
```

## Principes
- Feature-Sliced Design pour le frontend.
- Clean Architecture (UI -> use-cases -> repositories -> infra).
- DDD light: bounded contexts (`catalog`, `cart`, `checkout`, `orders`, `customers`, `pricing`, `inventory`).
- Multi-tenant by design.

## Multi-tenant model
- `tenant_id` obligatoire sur entités métier.
- Résolution tenant via host/subdomain + fallback path.
- Configuration tenant servie par `tenant_config` + cache edge.
- RLS Supabase avec isolation stricte par `tenant_id`.

## White-label engine
- `theme_registry`: tokens + composants variants + layouts.
- `brand_pack`: logos, palettes, typographies, motion profile.
- `template_registry`: storefront/admin/POS/checkouts variants.
- Feature flags par tenant.

## Couches logiques
1. **Presentation**: pages/widgets/features.
2. **Application**: use-cases, orchestration, policies.
3. **Domain**: entities/value objects/domain services.
4. **Infrastructure**: Supabase adapters, payment providers, analytics providers.

## Sécurité
- RLS complète + policies testées.
- RBAC + permissions granulaire (admin, manager, staff, support).
- Audit logs et journaux d’activité immuables.

## Performance & SEO
- SSR/hybrid recommandé (migration future vers framework SSR-ready si requis).
- Découpage chunks par route + lazy domains.
- Images optimisées, caching HTTP + app-level cache.
- Structured data e-commerce.

