// Génération dynamique du sitemap.xml
import { Product } from '../types';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export function generateSitemap(products: Product[], baseUrl: string = 'https://veridian.com'): string {
  const urls: SitemapUrl[] = [
    // Pages statiques
    {
      loc: `${baseUrl}/`,
      changefreq: 'daily',
      priority: 1.0,
      lastmod: new Date().toISOString(),
    },
    {
      loc: `${baseUrl}/profile`,
      changefreq: 'weekly',
      priority: 0.5,
    },
    // Pages produits
    ...products.map(product => ({
      loc: `${baseUrl}/product/${product.id}`,
      changefreq: 'weekly' as const,
      priority: 0.8,
      lastmod: new Date().toISOString(),
    })),
  ];

  const xmlUrls = urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority !== undefined ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>`;
}

// Fonction pour télécharger le sitemap
export function downloadSitemap(products: Product[]) {
  const sitemap = generateSitemap(products);
  const blob = new Blob([sitemap], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sitemap.xml';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
