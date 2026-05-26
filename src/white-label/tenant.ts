import { DEFAULT_TENANT, TENANT_REGISTRY } from './config';
import type { TenantBranding } from './types';

export function resolveTenantBranding(hostname: string): TenantBranding {
  const normalizedHost = hostname.toLowerCase().split(':')[0];
  return TENANT_REGISTRY[normalizedHost] ?? DEFAULT_TENANT;
}

export function getCurrentTenantBranding(): TenantBranding {
  if (typeof window === 'undefined') return DEFAULT_TENANT;
  return resolveTenantBrandingFromLocation(window.location.hostname, window.location.search);
}

export function resolveTenantBrandingFromLocation(hostname: string, search: string): TenantBranding {
  const params = new URLSearchParams(search);
  const tenantPreview = params.get('tenant');
  if (tenantPreview) {
    const normalizedPreview = tenantPreview.toLowerCase().split(':')[0];
    if (TENANT_REGISTRY[normalizedPreview]) {
      return TENANT_REGISTRY[normalizedPreview];
    }
  }
  return resolveTenantBranding(hostname);
}

export function applyTenantTheme(theme: TenantBranding['theme']) {
  const root = document.documentElement;
  // White-label tokens
  root.style.setProperty('--tenant-bg', theme.colorBg);
  root.style.setProperty('--tenant-ink', theme.colorInk);
  root.style.setProperty('--tenant-accent', theme.colorAccent);
  root.style.setProperty('--tenant-radius', theme.radius);
  root.style.setProperty('--tenant-font-body', theme.fontBody);
  root.style.setProperty('--tenant-font-display', theme.fontDisplay);

  // Bridge existing app tokens to tenant tokens (incremental migration)
  root.style.setProperty('--color-bg', theme.colorBg);
  root.style.setProperty('--color-ink', theme.colorInk);
  root.style.setProperty('--color-accent', theme.colorAccent);
}
