import { Product } from '../types';

export const SITE_NAME = 'Véridian';
export const DEFAULT_SITE_DESCRIPTION =
  "Boutique e-commerce premium Véridian : produits intemporels, sélection soignée et expérience d'achat assistée par IA.";
export const DEFAULT_ORIGIN = 'https://veridian.example.com';

export type SeoMetadata = {
  title: string;
  description: string;
  canonicalPath?: string;
  image?: string;
  type?: 'website' | 'product';
  noIndex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

export function getSiteOrigin() {
  const viteEnv: Partial<ImportMetaEnv> = import.meta.env ?? {};
  const configuredOrigin = viteEnv.VITE_SITE_URL;
  if (configuredOrigin) return configuredOrigin.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location.origin) return window.location.origin;
  return DEFAULT_ORIGIN;
}

export function normalizeDescription(description: string, maxLength = 155) {
  const normalized = description.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getProductSlug(product: Product) {
  return product.slug || `${slugify(product.name)}-${product.id}`;
}

export function getProductPath(product: Product) {
  return `/product/${getProductSlug(product)}`;
}

export function findProductByRouteParam(products: Product[], routeParam: string | undefined) {
  if (!routeParam) return null;
  return products.find(product => product.id === routeParam || getProductSlug(product) === routeParam) ?? null;
}

export function getCanonicalUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteOrigin()}${normalizedPath}`;
}

export function buildProductTitle(product: Product) {
  return `${product.name} | ${SITE_NAME}`;
}

export function buildProductDescription(product: Product) {
  const categories = product.categories.length > 0 ? ` Catégorie : ${product.categories.join(', ')}.` : '';
  return normalizeDescription(`${product.description}${categories}`);
}

export function buildHomeJsonLd() {
  const origin = getSiteOrigin();
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: origin,
      logo: `${origin}/vite.svg`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: origin,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${origin}/?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ];
}

export function buildProductJsonLd(product: Product) {
  const productUrl = getCanonicalUrl(getProductPath(product));
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: buildProductDescription(product),
    image: product.image,
    sku: product.id,
    category: product.categories.join(', '),
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'EUR',
      price: product.price.toFixed(2),
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };
}

export function buildProductBreadcrumbJsonLd(product: Product) {
  const origin = getSiteOrigin();
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Accueil',
        item: origin,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: product.categories[0] || 'Collection',
        item: `${origin}/#collection`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: getCanonicalUrl(getProductPath(product)),
      },
    ],
  };
}

export function buildProductSeo(product: Product): SeoMetadata {
  return {
    title: buildProductTitle(product),
    description: buildProductDescription(product),
    canonicalPath: getProductPath(product),
    image: product.image,
    type: 'product',
    jsonLd: [buildProductJsonLd(product), buildProductBreadcrumbJsonLd(product)],
  };
}

export function buildStorefrontSeo(): SeoMetadata {
  return {
    title: `${SITE_NAME} | Boutique premium IA-first`,
    description: DEFAULT_SITE_DESCRIPTION,
    canonicalPath: '/',
    type: 'website',
    jsonLd: buildHomeJsonLd(),
  };
}
