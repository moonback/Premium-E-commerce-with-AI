import { useEffect } from 'react';
import { getCanonicalUrl, getSiteOrigin, SeoMetadata, SITE_NAME } from './seo';

const MANAGED_META_SELECTOR = 'meta[data-seo="managed"]';
const MANAGED_JSON_LD_SELECTOR = 'script[data-seo="json-ld"]';

function setMeta(nameOrProperty: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${nameOrProperty}="${key}"]`;
  const existing = document.head.querySelector<HTMLMetaElement>(selector);
  const meta = existing ?? document.createElement('meta');
  meta.setAttribute(nameOrProperty, key);
  meta.setAttribute('content', content);
  meta.setAttribute('data-seo', 'managed');
  if (!existing) document.head.appendChild(meta);
}

function setCanonical(href: string) {
  const existing = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const link = existing ?? document.createElement('link');
  link.setAttribute('rel', 'canonical');
  link.setAttribute('href', href);
  if (!existing) document.head.appendChild(link);
}

function clearManagedSeo() {
  document.head.querySelectorAll(MANAGED_META_SELECTOR).forEach(element => element.remove());
  document.head.querySelectorAll(MANAGED_JSON_LD_SELECTOR).forEach(element => element.remove());
}

function appendJsonLd(jsonLd: SeoMetadata['jsonLd']) {
  const entries = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
  for (const entry of entries) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo', 'json-ld');
    script.textContent = JSON.stringify(entry);
    document.head.appendChild(script);
  }
}

export function useSeo(metadata: SeoMetadata) {
  useEffect(() => {
    const title = metadata.title || SITE_NAME;
    const canonical = getCanonicalUrl(metadata.canonicalPath || window.location.pathname);
    const image = metadata.image ? new URL(metadata.image, getSiteOrigin()).toString() : undefined;

    document.title = title;
    clearManagedSeo();
    setCanonical(canonical);
    setMeta('name', 'description', metadata.description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', metadata.description);
    setMeta('property', 'og:type', metadata.type === 'product' ? 'product' : 'website');
    setMeta('property', 'og:url', canonical);
    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', metadata.description);

    if (image) {
      setMeta('property', 'og:image', image);
      setMeta('name', 'twitter:image', image);
    }

    if (metadata.noIndex) {
      setMeta('name', 'robots', 'noindex, nofollow');
    }

    appendJsonLd(metadata.jsonLd);
  }, [metadata]);
}
