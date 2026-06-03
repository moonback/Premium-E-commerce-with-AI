import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../store';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import SEO from '../components/SEO';
import { slugify } from '../lib/slugify';
import { motion } from 'motion/react';
import { ArrowLeft, Package, LayoutGrid } from 'lucide-react';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { products, categories, isLoadingProducts } = useStore();

  // Find the matching category by slug
  const category = useMemo(
    () => categories.find((c) => slugify(c.name) === slug),
    [categories, slug]
  );

  // Filter products that belong to this category
  const filteredProducts = useMemo(() => {
    if (!category) return [];
    return products.filter((p) =>
      (p.categories || []).includes(category.name)
    );
  }, [products, category]);

  const categoryName = category?.name ?? slug ?? 'Catégorie';

  return (
    <>
      <SEO
        title={`${categoryName} — Véridian`}
        description={`Découvrez tous nos produits de la catégorie ${categoryName}.`}
      />

      <div className="min-h-screen bg-bg text-ink">
        {/* Hero Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-surface via-surface/80 to-bg border-b border-ink/8">
          {category?.image_url && (
            <div
              className="absolute inset-0 opacity-10 bg-cover bg-center"
              style={{ backgroundImage: `url(${category.image_url})` }}
            />
          )}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-ink/50 hover:text-ink transition-colors mb-8 group"
            >
              <ArrowLeft
                size={16}
                className="transition-transform group-hover:-translate-x-1"
              />
              Retour à la boutique
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent/10 text-accent">
                  <LayoutGrid size={24} />
                </span>
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-widest text-ink/40 font-medium">
                    Catégorie
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
                    {categoryName}
                  </h1>
                </div>
              </div>

              {category?.description && (
                <p className="mt-4 max-w-xl text-ink/60 text-base leading-relaxed">
                  {category.description}
                </p>
              )}

              <p className="mt-3 text-sm text-ink/40">
                {isLoadingProducts
                  ? 'Chargement des produits…'
                  : `${filteredProducts.length} produit${filteredProducts.length !== 1 ? 's' : ''}`}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Products Grid */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12" id="main-content">
          {isLoadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <div className="w-20 h-20 rounded-3xl bg-ink/5 flex items-center justify-center mb-6">
                <Package size={36} className="text-ink/30" />
              </div>
              <h2 className="text-xl font-semibold text-ink/70 mb-2">
                Aucun produit trouvé
              </h2>
              <p className="text-ink/40 text-sm mb-8 max-w-sm">
                Il n'y a pas encore de produits dans cette catégorie. Revenez bientôt !
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                <ArrowLeft size={16} />
                Voir tous les produits
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.35 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </main>
      </div>
    </>
  );
}
