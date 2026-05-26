import { useEffect, useState } from 'react';
import { applyTenantTheme, resolveTenantBrandingFromLocation } from './tenant';
import { DEFAULT_TENANT } from './config';
import type { TenantBranding } from './types';
import { getCachedTenantRegistry, loadDynamicTenantRegistry } from './dynamic';

export function useTenantBranding(): TenantBranding {
  const [branding, setBranding] = useState<TenantBranding>(() => {
    if (typeof window === 'undefined') return DEFAULT_TENANT;
    const cached = getCachedTenantRegistry();
    return resolveTenantBrandingFromLocation(window.location.hostname, window.location.search, {
      ...cached,
      localhost: DEFAULT_TENANT,
    });
  });

  useEffect(() => {
    loadDynamicTenantRegistry().then((dynamicRegistry) => {
      if (typeof window === 'undefined') return;
      const resolved = resolveTenantBrandingFromLocation(window.location.hostname, window.location.search, {
        ...dynamicRegistry,
        localhost: DEFAULT_TENANT,
      });
      setBranding(resolved);
    });
  }, []);

  useEffect(() => {
    applyTenantTheme(branding.theme);
    document.title = branding.brandName;
    (globalThis as { __TENANT_BRANDING__?: TenantBranding }).__TENANT_BRANDING__ = branding;
  }, [branding]);

  return branding;
}
