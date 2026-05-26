export type IndustryMode =
  | 'luxe'
  | 'fashion'
  | 'electronics'
  | 'food'
  | 'furniture'
  | 'beauty'
  | 'events'
  | 'b2b';

export type TenantThemeTokens = {
  colorBg: string;
  colorInk: string;
  colorAccent: string;
  radius: string;
  fontBody: string;
  fontDisplay: string;
};

export type TenantBranding = {
  tenantId: string;
  brandName: string;
  logoUrl: string;
  industry: IndustryMode;
  locale: string;
  currency: string;
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  theme: TenantThemeTokens;
};
