// src/components/MegaMenu.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { ChevronDown, TrendingUp, Sparkles, Tag, Package, FileText, ExternalLink, Link as LinkIcon } from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import { layers } from '../styles/tokens/layers';
import { OptimizedImage } from './OptimizedImage';
import { supabase } from '../lib/supabase';
import { MegaMenuItem, MegaMenuLink } from '../types';
import * as LucideIcons from 'lucide-react';

export interface MegaMenuProps {
  className?: string;
}

export default function MegaMenu({ className }: MegaMenuProps) {
  const { categories, products } = useStore();
  const [menuItems, setMenuItems] = useState<MegaMenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetchMegaMenu();
  }, []);

  const fetchMegaMenu = async () => {
    if (!supabase) {
      // Fallback: utiliser les catégories par défaut
      return;
    }

    try {
      // Récupérer les items actifs
      const { data: items, error: itemsError } = await supabase
        .from('mega_menu_items')
        .select('*')
        .eq('is_active', true)
        .order('order');

      if (itemsError) throw itemsError;

      // Pour chaque item, récupérer les colonnes et liens
      const itemsWithData = await Promise.all(
        (items || []).map(async (item) => {
          const { data: columns, error: columnsError } = await supabase
            .from('mega_menu_columns')
            .select('*')
            .eq('menu_item_id', item.id)
            .order('order');

          if (columnsError) throw columnsError;

          const columnsWithLinks = await Promise.all(
            (columns || []).map(async (column) => {
              const { data: links, error: linksError } = await supabase
                .from('mega_menu_links')
                .select('*')
                .eq('column_id', column.id)
                .order('order');

              if (linksError) throw linksError;

              return {
                ...column,
                links: links || [],
              };
            })
          );

          return {
            ...item,
            columns: columnsWithLinks,
          };
        })
      );

      setMenuItems(itemsWithData as MegaMenuItem[]);
    } catch (error) {
      console.error('Error fetching mega menu:', error);
    }
  };

  const handleMouseEnter = (itemLabel: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setActiveCategory(itemLabel);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setActiveCategory(null);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Fallback: utiliser les catégories si pas de mega menu configuré
  const mainCategories = menuItems.length > 0
    ? menuItems
    : categories.filter((c) => c.level === 1).map(c => ({
        id: c.id,
        label: c.name,
        category_id: c.id,
        columns: [],
        is_active: true,
        order: 0,
        created_at: '',
        updated_at: '',
      }));

  const activeItem = menuItems.find(item => item.label === activeCategory);

  // Résoudre les liens (catégorie, produit, etc.)
  const resolveLink = (link: MegaMenuLink): { url: string; label: string; description?: string; image?: string } => {
    switch (link.type) {
      case 'category': {
        const category = categories.find(c => c.id === link.category_id);
        return {
          url: `/?category=${encodeURIComponent(category?.name || '')}`,
          label: link.label || category?.name || '',
          description: link.description,
        };
      }
      case 'product': {
        const product = products.find(p => p.id === link.product_id);
        return {
          url: `/product/${link.product_id}`,
          label: link.label || product?.name || '',
          description: link.description || product?.description,
          image: product?.image,
        };
      }
      case 'page':
      case 'external':
        return {
          url: link.url || '/',
          label: link.label,
          description: link.description,
        };
      default:
        return {
          url: '/',
          label: link.label,
          description: link.description,
        };
    }
  };

  // Obtenir l'icône Lucide dynamiquement
  const getIcon = (iconName?: string) => {
    if (!iconName) return null;
    const Icon = (LucideIcons as any)[iconName];
    return Icon ? <Icon className="w-4 h-4" /> : null;
  };

  return (
    <nav className={cn('relative', className)} onMouseLeave={handleMouseLeave}>
      {/* Navigation principale */}
      <ul className="flex items-center gap-1">
        {mainCategories.map((item) => (
          <li key={item.id}>
            <button
              onMouseEnter={() => handleMouseEnter(item.label)}
              className={cn(
                'flex items-center gap-1 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors rounded-lg',
                activeCategory === item.label
                  ? 'text-ink bg-ink/5'
                  : 'text-ink/70 hover:text-ink hover:bg-ink/5'
              )}
            >
              {item.label}
              <ChevronDown
                className={cn(
                  'w-3 h-3 transition-transform',
                  activeCategory === item.label && 'rotate-180'
                )}
              />
            </button>
          </li>
        ))}
      </ul>

      {/* Mega Menu Dropdown */}
      <AnimatePresence>
        {isOpen && activeItem && activeItem.columns.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
            className="absolute left-0 right-0 top-full mt-2 bg-bg border border-ink/10 rounded-2xl shadow-2xl overflow-hidden"
            style={{ zIndex: layers.dropdown }}
            onMouseEnter={() => {
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }
            }}
          >
            <div className={cn(
              'grid gap-8 p-8 max-w-7xl mx-auto',
              activeItem.columns.length === 1 && 'grid-cols-1',
              activeItem.columns.length === 2 && 'grid-cols-2',
              activeItem.columns.length === 3 && 'grid-cols-3',
              activeItem.columns.length >= 4 && 'grid-cols-12'
            )}>
              {activeItem.columns.map((column, index) => (
                <div
                  key={column.id}
                  className={cn(
                    activeItem.columns.length >= 4 && index === 0 && 'col-span-4',
                    activeItem.columns.length >= 4 && index === 1 && 'col-span-5',
                    activeItem.columns.length >= 4 && index === 2 && 'col-span-3',
                    column.highlight && 'bg-gradient-to-br rounded-xl p-6',
                    column.background_color || (column.highlight && 'from-accent/10 to-accent/5')
                  )}
                >
                  <h3 className={cn(
                    'text-xs font-bold uppercase tracking-widest mb-4',
                    column.highlight ? 'text-accent' : 'text-ink/50'
                  )}>
                    {column.title}
                  </h3>

                  {/* Liens de la colonne */}
                  <div className="space-y-2">
                    {column.links.map((link) => {
                      const resolved = resolveLink(link);
                      const icon = getIcon(link.icon);

                      // Si c'est un produit avec image
                      if (link.type === 'product' && resolved.image) {
                        return (
                          <Link
                            key={link.id}
                            to={resolved.url}
                            className="flex gap-4 p-3 hover:bg-ink/5 rounded-lg transition-colors group"
                            onClick={() => setIsOpen(false)}
                          >
                            <div className="relative w-20 h-20 flex-shrink-0 bg-soft-green rounded-lg overflow-hidden">
                              <OptimizedImage
                                src={resolved.image}
                                alt={resolved.label}
                                width={80}
                                height={80}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-serif text-sm mb-1 truncate group-hover:text-accent transition-colors">
                                {resolved.label}
                              </h4>
                              {resolved.description && (
                                <p className="text-xs text-ink/60 line-clamp-2">
                                  {resolved.description}
                                </p>
                              )}
                            </div>
                          </Link>
                        );
                      }

                      // Lien standard
                      return (
                        <Link
                          key={link.id}
                          to={resolved.url}
                          className={cn(
                            'block px-3 py-2 rounded-lg transition-colors',
                            column.highlight
                              ? 'hover:bg-white/50'
                              : 'hover:bg-ink/5'
                          )}
                          onClick={() => setIsOpen(false)}
                        >
                          <div className="flex items-center gap-2">
                            {icon && <span className={column.highlight ? 'text-accent' : 'text-ink/60'}>{icon}</span>}
                            <div className="flex-1">
                              <p className="text-sm font-semibold">{resolved.label}</p>
                              {resolved.description && (
                                <p className="text-xs text-ink/60 mt-0.5">
                                  {resolved.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
