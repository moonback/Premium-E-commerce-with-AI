import type { TenantBranding } from './types';

export const DEFAULT_TENANT: TenantBranding = {
  tenantId: 'default',
  brandName: 'Premium Store',
  logoUrl: '/logo.svg',
  industry: 'fashion',
  locale: 'fr-FR',
  currency: 'EUR',
  theme: {
    colorBg: '#f8f8f7',
    colorInk: '#0f172a',
    colorAccent: '#0ea5e9',
    radius: '14px',
    fontBody: 'Inter, system-ui, sans-serif',
    fontDisplay: 'Playfair Display, Georgia, serif',
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
    theme: {
      ...DEFAULT_TENANT.theme,
      colorAccent: '#6366f1',
      radius: '10px',
    },
  },
};
