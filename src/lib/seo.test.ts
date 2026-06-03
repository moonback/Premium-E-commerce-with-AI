import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCanonicalUrl, buildProductJsonLd, findProductByRouteParam, getProductPath, getProductSlug, slugify } from './seo';
import { Product } from '../types';

const product: Product = {
  id: 'prod_123',
  name: 'Éclat Café & Crème',
  description: 'Produit premium pour test SEO',
  price: 19.9,
  image: 'https://example.com/product.jpg',
  categories: ['Café'],
  effects: ['Énergie'],
  stock: 4,
  rating: 0,
  specs: [],
};

test('slugify normalizes accents and punctuation for product URLs', () => {
  assert.equal(slugify('Éclat Café & Crème'), 'eclat-cafe-creme');
});

test('getProductPath builds stable slug URLs that keep the product id', () => {
  assert.equal(getProductSlug(product), 'eclat-cafe-creme-prod_123');
  assert.equal(getProductPath(product), '/product/eclat-cafe-creme-prod_123');
});

test('findProductByRouteParam supports both legacy ids and new slugs', () => {
  assert.equal(findProductByRouteParam([product], 'prod_123')?.id, 'prod_123');
  assert.equal(findProductByRouteParam([product], 'eclat-cafe-creme-prod_123')?.id, 'prod_123');
});

test('buildProductJsonLd exposes Product and Offer schema data', () => {
  const jsonLd = buildProductJsonLd(product, 'https://shop.example');

  const [productSchema, breadcrumbSchema] = jsonLd['@graph'];

  assert.equal(productSchema['@type'], 'Product');
  assert.equal(productSchema.offers['@type'], 'Offer');
  assert.equal(productSchema.offers.url, 'https://shop.example/product/eclat-cafe-creme-prod_123');
  assert.equal(productSchema.offers.availability, 'https://schema.org/InStock');
  assert.equal(breadcrumbSchema['@type'], 'BreadcrumbList');
});

test('buildCanonicalUrl normalizes origin and path slashes', () => {
  assert.equal(buildCanonicalUrl('checkout', 'https://shop.example/'), 'https://shop.example/checkout');
});
