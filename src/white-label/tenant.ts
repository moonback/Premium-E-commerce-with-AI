import { DEFAULT_TENANT, TENANT_REGISTRY } from './config';
import type { TenantBranding } from './types';

export function resolveTenantBranding(hostname: string): TenantBranding {
  return TENANT_REGISTRY[hostname] ?? DEFAULT_TENANT;
}

export function applyTenantTheme(theme: TenantBranding['theme']) {
  const root = document.documentElement;
  root.style.setProperty('--tenant-bg', theme.colorBg);
  root.style.setProperty('--tenant-ink', theme.colorInk);
  root.style.setProperty('--tenant-accent', theme.colorAccent);
  root.style.setProperty('--tenant-radius', theme.radius);
  root.style.setProperty('--tenant-font-body', theme.fontBody);
  root.style.setProperty('--tenant-font-display', theme.fontDisplay);
}
