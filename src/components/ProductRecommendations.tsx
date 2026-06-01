import React from 'react';
import { Product } from '../types';
import { Link } from 'react-router-dom';
import { getProductPath } from '../lib/seo';
import { motion } from 'motion/react';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface ProductRecommendationsProps {
  currentProduct?: Product;
  products: Product[];
  title?: string;
  maxItems?: number;
}

/**
 * Simple product recommendations based on:
 * - Same category
 * - Similar price range
 * - Excludes current product
 */
export default function ProductRecommendations({
  currentProduct,
  products,
  title = "Vous aimerez aussi",
  maxItems = 3,
}: ProductRecommendationsProps) {
  const prefersReducedMotion = useReducedMotion();

  const getRecommendations = (): Product[] => {
    if (!currentProduct) {
      // If no current product, return popular items (highest stock or first items)
      return products.slice(0, maxItems);
    }

    // Filter products in same category
    const sameCategory = products.filter(
      p => p.id !== currentProduct.id &&
      p.categories?.some(cat => currentProduct.categories?.includes(cat))
    );

    // Filter products in similar price range (±30%)
    const priceMin = currentProduct.price * 0.7;
    const priceMax = currentProduct.price * 1.3;
    const similarPrice = products.filter(
      p => p.id !== currentProduct.id &&
      p.price >= priceMin &&
      p.price <= priceMax
    );

    // Combine and deduplicate
    const combined = [...new Set([...sameCategory, ...similarPrice])];
    
    // If not enough, add random products
    if (combined.length < maxItems) {
      const remaining = products.filter(
        p => p.id !== currentProduct.id && !combined.includes(p)
      );
      combined.push(...remaining);
    }

    return combined.slice(0, maxItems);
  };

  const recommendations = getRecommendations();

  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-serif text-ink">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((product, i) => (
          <motion.div
            key={product.id}
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3, delay: prefersReducedMotion ? 0 : i * 0.1 }}
          >
            <Link
              to={getProductPath(product)}
              className="group block border border-ink/10 p-4 hover:border-ink/20 hover:shadow-lg transition-all"
            >
              <div className="aspect-square bg-soft-green mb-4 overflow-hidden rounded-lg relative">
                <img
                  src={product.image}
                  alt={product.name}
                  width="300"
                  height="300"
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {product.stock === 0 && (
                  <span className="absolute top-2 right-2 bg-red-600 text-white px-2 py-0.5 text-xs font-bold rounded">
                    Rupture
                  </span>
                )}
                {product.stock > 0 && product.stock < 5 && (
                  <span className="absolute top-2 right-2 bg-amber-500 text-bg px-2 py-0.5 text-xs font-bold rounded">
                    Stock: {product.stock}
                  </span>
                )}
              </div>
              <h4 className="font-serif text-lg mb-1 text-ink group-hover:text-ink/70 transition-colors">
                {product.name}
              </h4>
              <p className="text-sm text-ink/60 mb-2 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-ink">{product.price.toFixed(2)}€</p>
                {product.effects.length > 0 && (
                  <span className="text-xs text-ink/40 uppercase tracking-wider">
                    {product.effects[0]}
                  </span>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
