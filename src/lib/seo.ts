import { Product } from '../types';

export const SITE_NAME = 'Véridian';
export const DEFAULT_SITE_URL = 'https://veridian.example';
export const DEFAULT_SEO_DESCRIPTION =
  'Véridian sélectionne des produits premium intemporels, pensés pour une expérience e-commerce élégante, rapide et personnalisée.';

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'produit';
}

export function getProductSlug(product: Pick<Product, 'id' | 'name'>): string {
  return `${slugify(product.name)}-${product.id}`;
}

export function getProductPath(product: Pick<Product, 'id' | 'name'>): string {
  return `/product/${getProductSlug(product)}`;
}

export function findProductByRouteParam(products: Product[], routeParam: string | undefined): Product | null {
  if (!routeParam) return null;
  const decodedParam = decodeURIComponent(routeParam);
  return products.find((product) => product.id === decodedParam || getProductSlug(product) === decodedParam) ?? null;
}

export function buildCanonicalUrl(path: string, origin: string = DEFAULT_SITE_URL): string {
  const normalizedOrigin = origin.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedOrigin}${normalizedPath}`;
}

export function buildProductJsonLd(product: Product, origin: string = DEFAULT_SITE_URL) {
  const productUrl = buildCanonicalUrl(getProductPath(product), origin);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image: [product.image],
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
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Accueil',
            item: buildCanonicalUrl('/', origin),
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: product.name,
            item: productUrl,
          },
        ],
      },
    ],
  };
}

export function buildStoreJsonLd(origin: string = DEFAULT_SITE_URL) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: buildCanonicalUrl('/', origin),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: buildCanonicalUrl('/', origin),
      potentialAction: {
        '@type': 'SearchAction',
        target: `${buildCanonicalUrl('/', origin)}?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ];
}
