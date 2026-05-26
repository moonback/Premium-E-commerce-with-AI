import { useEffect, useMemo } from 'react';
import { applyTenantTheme, resolveTenantBranding } from './tenant';
import { DEFAULT_TENANT } from './config';
import type { TenantBranding } from './types';

export function useTenantBranding(): TenantBranding {
  const branding = useMemo<TenantBranding>(() => {
    if (typeof window === 'undefined') return DEFAULT_TENANT;
    return resolveTenantBranding(window.location.hostname);
  }, []);

  useEffect(() => {
    applyTenantTheme(branding.theme);
    document.title = branding.brandName;
  }, [branding]);

  return branding;
}
