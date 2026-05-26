import { useEffect, useMemo } from 'react';
import { applyTenantTheme, resolveTenantBrandingFromLocation } from './tenant';
import { DEFAULT_TENANT } from './config';
import type { TenantBranding } from './types';

export function useTenantBranding(): TenantBranding {
  const branding = useMemo<TenantBranding>(() => {
    if (typeof window === 'undefined') return DEFAULT_TENANT;
    return resolveTenantBrandingFromLocation(window.location.hostname, window.location.search);
  }, []);

  useEffect(() => {
    applyTenantTheme(branding.theme);
    document.title = branding.brandName;
  }, [branding]);

  return branding;
}
