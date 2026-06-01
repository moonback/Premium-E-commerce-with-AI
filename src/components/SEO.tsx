import { useEffect } from 'react';
import { buildCanonicalUrl, DEFAULT_SEO_DESCRIPTION, SITE_NAME } from '../lib/seo';
import { SEOData } from '../types';

type SEOProps = {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  jsonLd?: unknown;
  seoData?: SEOData | null; // Données SEO personnalisées depuis la DB
  keywords?: string;
};

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }

  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
}

function upsertCanonical(url: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  element.setAttribute('href', url);
}

export default function SEO({
  title,
  description = DEFAULT_SEO_DESCRIPTION,
  path = '/',
  image,
  type = 'website',
  jsonLd,
  seoData,
  keywords,
}: SEOProps) {
  useEffect(() => {
    // Utiliser les données SEO personnalisées si disponibles, sinon les valeurs par défaut
    const metaTitle = seoData?.meta_title || title;
    const metaDescription = seoData?.meta_description || description;
    const metaKeywords = seoData?.meta_keywords || keywords;
    const ogTitle = seoData?.og_title || metaTitle;
    const ogDescription = seoData?.og_description || metaDescription;
    const ogImage = seoData?.og_image || image;
    const canonicalUrl = seoData?.canonical_url || buildCanonicalUrl(path, window.location.origin);
    
    const fullTitle = metaTitle.includes(SITE_NAME) ? metaTitle : `${metaTitle} | ${SITE_NAME}`;

    // Title
    document.title = fullTitle;
    
    // Meta Description
    upsertMeta('meta[name="description"]', { name: 'description', content: metaDescription });
    
    // Meta Keywords
    if (metaKeywords) {
      upsertMeta('meta[name="keywords"]', { name: 'keywords', content: metaKeywords });
    }
    
    // Open Graph
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: ogTitle });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: ogDescription });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME });
    
    // Twitter Card
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: ogImage ? 'summary_large_image' : 'summary' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: ogTitle });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: ogDescription });

    // Images
    if (ogImage) {
      upsertMeta('meta[property="og:image"]', { property: 'og:image', content: ogImage });
      upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt', content: ogTitle });
      upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: ogImage });
      upsertMeta('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt', content: ogTitle });
    }

    // Canonical URL
    upsertCanonical(canonicalUrl);

    // JSON-LD Structured Data
    const scriptId = 'route-json-ld';
    document.getElementById(scriptId)?.remove();
    if (jsonLd) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [description, image, jsonLd, path, title, type, seoData, keywords]);

  return null;
}
