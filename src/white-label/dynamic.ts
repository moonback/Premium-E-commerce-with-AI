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
    window.localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(tenants));
    return tenants;
  } catch {
    return getCachedTenantRegistry();
  }
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
