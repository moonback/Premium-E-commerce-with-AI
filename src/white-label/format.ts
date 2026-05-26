import type { TenantBranding } from './types';

export function formatTenantCurrency(amount: number, branding: TenantBranding): string {
  return new Intl.NumberFormat(branding.locale, {
    style: 'currency',
    currency: branding.currency,
    maximumFractionDigits: 2,
  }).format(amount);
}
