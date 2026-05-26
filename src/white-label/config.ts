import type { TenantBranding } from './types';

export const DEFAULT_TENANT: TenantBranding = {
  tenantId: 'default',
  brandName: 'Premium Store',
  logoUrl: '/logo.svg',
  industry: 'fashion',
  locale: 'fr-FR',
  currency: 'EUR',
  heroBadge: 'Maison de Qualité',
  heroTitle: 'La Collection Essentielle',
  heroSubtitle: "Découvrez notre sélection de produits intemporels. L'alliance parfaite entre esthétique et utilité.",
  features: {
    adminEnabled: true,
    posEnabled: true,
    kitchenEnabled: true,
  },
  theme: {
    colorBg: '#f8f8f7',
    colorInk: '#0f172a',
    colorAccent: '#0ea5e9',
    radius: '14px',
    fontBody: 'Inter, system-ui, sans-serif',
    fontDisplay: 'Playfair Display, Georgia, serif',
    spacingMd: '1rem',
    shadowSoft: '0 10px 30px rgba(0,0,0,0.08)',
    motionFast: '180ms',
  },
};

export const TENANT_REGISTRY: Record<string, TenantBranding> = {
  'localhost': DEFAULT_TENANT,
  'premium.local': {
    ...DEFAULT_TENANT,
    tenantId: 'premium-fashion',
    brandName: 'Maison Premium',
    industry: 'luxe',
    locale: 'fr-FR',
    currency: 'EUR',
    heroBadge: 'Édition Luxe',
    heroTitle: 'Signature Maison Premium',
    heroSubtitle: 'Des pièces exclusives conçues pour une expérience retail haut de gamme.',
    features: {
      adminEnabled: true,
      posEnabled: true,
      kitchenEnabled: true,
    },
    theme: {
      ...DEFAULT_TENANT.theme,
      colorAccent: '#b89b72',
    },
  },
  'electro.local': {
    ...DEFAULT_TENANT,
    tenantId: 'electro-pro',
    brandName: 'Electro Pro',
    industry: 'electronics',
    locale: 'en-US',
    currency: 'USD',
    heroBadge: 'Next-Gen Tech',
    heroTitle: 'Electro Performance Line',
    heroSubtitle: 'High-performance devices engineered for modern commerce and everyday life.',
    features: {
      adminEnabled: true,
      posEnabled: true,
      kitchenEnabled: true,
    },
    theme: {
      ...DEFAULT_TENANT.theme,
      colorAccent: '#6366f1',
      radius: '10px',
    },
  },
};
