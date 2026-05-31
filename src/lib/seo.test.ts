import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildProductDescription,
  buildProductJsonLd,
  findProductByRouteParam,
  getProductPath,
  getProductSlug,
  slugify,
} from './seo';
import { Product } from '../types';

const product: Product = {
  id: 'prod_test',
  name: 'Écharpe Cachemire Signature',
  description: 'Une pièce douce et intemporelle pour compléter une silhouette premium.',
  price: 129,
  image: 'https://example.com/scarf.jpg',
  categories: ['Accessoires'],
  effects: ['Cachemire'],
  stock: 3,
  specs: [],
};

test('slugify creates stable accent-free product slugs', () => {
  assert.equal(slugify('Écharpe Cachemire Signature'), 'echarpe-cachemire-signature');
  assert.equal(getProductSlug(product), 'echarpe-cachemire-signature-prod_test');
  assert.equal(getProductPath(product), '/product/echarpe-cachemire-signature-prod_test');
});

test('findProductByRouteParam supports legacy ids and SEO slugs', () => {
  const products = [product];

  assert.equal(findProductByRouteParam(products, 'prod_test'), product);
  assert.equal(findProductByRouteParam(products, 'echarpe-cachemire-signature-prod_test'), product);
  assert.equal(findProductByRouteParam(products, 'missing'), null);
});

test('product SEO payload includes Product and Offer JSON-LD fields', () => {
  const jsonLd = buildProductJsonLd(product);

  assert.equal(jsonLd['@type'], 'Product');
  assert.equal(jsonLd.name, product.name);
  assert.equal(jsonLd.sku, product.id);
  assert.equal(jsonLd.offers.price, '129.00');
  assert.equal(jsonLd.offers.priceCurrency, 'EUR');
  assert.equal(jsonLd.offers.availability, 'https://schema.org/InStock');
});

test('product meta descriptions stay concise', () => {
  assert.ok(buildProductDescription(product).length <= 155);
});
