import { DEFAULT_TENANT } from './config';
import type { TenantBranding } from './types';

const TENANT_STORAGE_KEY = 'wl:tenant-branding';

type TenantPayload = {
  tenants?: Record<string, TenantBranding>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function loadDynamicTenantRegistry(): Promise<Record<string, TenantBranding>> {
  if (typeof window === 'undefined') return {};

  const sourceUrl = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_TENANT_CONFIG_URL;
  if (!sourceUrl) return {};

  try {
    const response = await fetch(sourceUrl, { method: 'GET' });
    if (!response.ok) return {};
    const payload = (await response.json()) as TenantPayload;
    if (!isRecord(payload) || !isRecord(payload.tenants)) return {};

    const tenants = payload.tenants as Record<string, TenantBranding>;
    const validatedTenants = Object.fromEntries(
      Object.entries(tenants).filter(([, value]) => isTenantBranding(value))
    ) as Record<string, TenantBranding>;
    window.localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(validatedTenants));
    return validatedTenants;
  } catch {
    return getCachedTenantRegistry();
  }
}

function isTenantBranding(value: unknown): value is TenantBranding {
  if (!isRecord(value) || !isRecord(value.theme)) return false;
  return typeof value.tenantId === 'string'
    && typeof value.brandName === 'string'
    && typeof value.logoUrl === 'string'
    && typeof value.locale === 'string'
    && typeof value.currency === 'string'
    && typeof value.heroBadge === 'string'
    && typeof value.heroTitle === 'string'
    && typeof value.heroSubtitle === 'string'
    && typeof value.theme.colorBg === 'string'
    && typeof value.theme.colorInk === 'string'
    && typeof value.theme.colorAccent === 'string'
    && typeof value.theme.radius === 'string'
    && typeof value.theme.fontBody === 'string'
    && typeof value.theme.fontDisplay === 'string';
}

export function getCachedTenantRegistry(): Record<string, TenantBranding> {
  if (typeof window === 'undefined') return {};

  const raw = window.localStorage.getItem(TENANT_STORAGE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return {};
    return parsed as Record<string, TenantBranding>;
  } catch {
    return {};
  }
}

export function withFallbackTenant(branding: Partial<TenantBranding>): TenantBranding {
  return {
    ...DEFAULT_TENANT,
    ...branding,
    theme: {
      ...DEFAULT_TENANT.theme,
      ...(branding.theme ?? {}),
    },
  };
}
