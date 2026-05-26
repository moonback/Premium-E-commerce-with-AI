import { useEffect, useMemo } from 'react';
import { applyTenantTheme, resolveTenantBranding } from './tenant';

export function useTenantBranding() {
  const branding = useMemo(() => resolveTenantBranding(window.location.hostname), []);

  useEffect(() => {
    applyTenantTheme(branding.theme);
    document.title = branding.brandName;
  }, [branding]);

  return branding;
}
