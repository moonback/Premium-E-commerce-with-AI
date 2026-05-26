import assert from 'node:assert/strict';
import { resolveTenantBranding, resolveTenantBrandingFromLocation } from '../src/white-label/tenant';

function run() {
  const premium = resolveTenantBranding('PREMIUM.LOCAL:5173');
  assert.equal(premium.tenantId, 'premium-fashion');
  assert.equal(premium.brandName, 'Maison Premium');

  const electro = resolveTenantBranding('electro.local');
  assert.equal(electro.industry, 'electronics');

  const fallback = resolveTenantBranding('unknown.example.com');
  assert.equal(fallback.tenantId, 'default');

  const preview = resolveTenantBrandingFromLocation('unknown.example.com', '?tenant=electro.local');
  assert.equal(preview.tenantId, 'electro-pro');

  const invalidPreview = resolveTenantBrandingFromLocation('premium.local', '?tenant=does-not-exist');
  assert.equal(invalidPreview.tenantId, 'premium-fashion');

  console.log('tenant-branding tests passed');
}

run();
