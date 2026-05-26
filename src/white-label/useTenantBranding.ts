import { useEffect, useMemo } from 'react';
import { applyTenantTheme, resolveTenantBranding } from './tenant';
import { DEFAULT_TENANT } from './config';

export function useTenantBranding() {
  const branding = useMemo(() => {
    if (typeof window === 'undefined') return DEFAULT_TENANT;
    return resolveTenantBranding(window.location.hostname);
  }, []);

  useEffect(() => {
    applyTenantTheme(branding.theme);
    document.title = branding.brandName;
  }, [branding]);

  return branding;
}
