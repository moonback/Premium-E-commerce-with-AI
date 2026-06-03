// src/components/MegaMenu.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import { layers } from '../styles/tokens/layers';
import { OptimizedImage } from './OptimizedImage';
import { slugify } from '../lib/slugify';
import { supabase } from '../lib/supabase';
import { MegaMenuItem, MegaMenuLink } from '../types';
import * as LucideIcons from 'lucide-react';

export interface MegaMenuProps {
  className?: string;
  onOpenChange?: (isOpen: boolean) => void;
}

export default function MegaMenu({ className, onOpenChange }: MegaMenuProps) {
  const { categories, products } = useStore();
  const [menuItems, setMenuItems] = useState<MegaMenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMegaMenu();
  }, []);

  // Notify parent of open/close changes
  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  const fetchMegaMenu = async () => {
    if (!supabase) {
      return;
    }

    try {
      const { data: items, error: itemsError } = await supabase
        .from('mega_menu_items')
        .select('*')
        .eq('is_active', true)
        .order('order');

      if (itemsError) throw itemsError;

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

  const handleMouseEnter = useCallback((itemLabel: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setActiveCategory(itemLabel);
    setIsOpen(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setActiveCategory(null);
    }, 250);
  }, []);

  const handleDropdownEnter = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setActiveCategory(null);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const mainCategories = menuItems;

  const activeItem = menuItems.find(item => item.label === activeCategory);

  // Resolve links (category, product, etc.)
  const resolveLink = (link: MegaMenuLink): { url: string; label: string; description?: string; image?: string } => {
    switch (link.type) {
      case 'category': {
        const category = categories.find(c => c.id === link.category_id);
        const catSlug = category ? slugify(category.name) : (link.label ? slugify(link.label) : '');
        return {
          url: `/category/${catSlug}`,
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

  // Get Lucide icon dynamically
  const getIcon = (iconName?: string) => {
    if (!iconName) return null;
    const Icon = (LucideIcons as any)[iconName];
    return Icon ? <Icon className="w-4 h-4" /> : null;
  };

  return (
    <div ref={menuRef} className={cn('relative', className)} onMouseLeave={handleMouseLeave}>
      {/* Main category navigation — inline buttons */}
      <ul className="flex items-center gap-1">
        {mainCategories.map((item) => {
          const isSimpleLink = item.category_id?.startsWith('link:');
          const linkUrl = isSimpleLink ? item.category_id.substring(5) : null;

          return (
            <li key={item.id}>
              {isSimpleLink && linkUrl ? (
                <Link
                  to={linkUrl}
                  onClick={closeMenu}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-ink/50 hover:text-ink transition-all duration-200 rounded-none relative"
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  onMouseEnter={() => handleMouseEnter(item.label)}
                  onClick={() => {
                    if (activeCategory === item.label && isOpen) {
                      closeMenu();
                    } else {
                      handleMouseEnter(item.label);
                    }
                  }}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] transition-all duration-200 rounded-none relative',
                    activeCategory === item.label
                      ? 'text-ink'
                      : 'text-ink/50 hover:text-ink'
                  )}
                >
                  {item.label}
                  <ChevronDown
                    className={cn(
                      'w-3 h-3 transition-transform duration-300',
                      activeCategory === item.label && isOpen && 'rotate-180'
                    )}
                  />
                  {/* Active indicator line */}
                  {activeCategory === item.label && isOpen && (
                    <motion.span
                      layoutId="mega-menu-indicator"
                      className="absolute bottom-0 left-2 right-2 h-[2px] bg-accent"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {/* Mega Menu Dropdown — Full width under header */}
      <AnimatePresence>
        {isOpen && activeItem && activeItem.columns.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 -translate-x-1/2 top-full w-[100vw] bg-white border-t border-ink/10 shadow-2xl overflow-hidden"
            style={{ zIndex: layers.dropdown }}
            onMouseEnter={handleDropdownEnter}
          >
            <div className="max-w-7xl mx-auto">
              <div className={cn(
                'grid gap-8 p-10',
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
                    {/* Column title — editorial serif style */}
                    <h3 className={cn(
                      'text-[11px] font-bold uppercase tracking-[0.2em] mb-5 pb-3 border-b',
                      column.highlight ? 'text-accent border-accent/20' : 'text-ink/40 border-ink/10'
                    )}>
                      {column.title}
                    </h3>

                    {/* Column links */}
                    <div className="space-y-1">
                      {column.links.map((link) => {
                        const resolved = resolveLink(link);
                        const icon = getIcon(link.icon);

                        // Product with image
                        if (link.type === 'product' && resolved.image) {
                          return (
                            <Link
                              key={link.id}
                              to={resolved.url}
                              className="flex gap-4 p-3 hover:bg-ink/5 rounded-lg transition-all duration-200 group"
                              onClick={closeMenu}
                            >
                              <div className="relative w-20 h-20 flex-shrink-0 bg-soft-green rounded-lg overflow-hidden">
                                <OptimizedImage
                                  src={resolved.image}
                                  alt={resolved.label}
                                  width={80}
                                  height={80}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-serif text-sm mb-1 truncate group-hover:text-accent transition-colors">
                                  {resolved.label}
                                </h4>
                                {resolved.description && (
                                  <p className="text-xs text-ink/50 line-clamp-2 leading-relaxed">
                                    {resolved.description}
                                  </p>
                                )}
                              </div>
                              <ChevronRight className="w-4 h-4 text-ink/20 group-hover:text-accent group-hover:translate-x-1 transition-all self-center flex-shrink-0" />
                            </Link>
                          );
                        }

                        // Standard link
                        return (
                          <Link
                            key={link.id}
                            to={resolved.url}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                              column.highlight
                                ? 'hover:bg-white/50'
                                : 'hover:bg-ink/5'
                            )}
                            onClick={closeMenu}
                          >
                            {icon && <span className={cn('transition-colors', column.highlight ? 'text-accent' : 'text-ink/40 group-hover:text-accent')}>{icon}</span>}
                            <div className="flex-1">
                              <p className="text-sm font-medium group-hover:text-accent transition-colors">{resolved.label}</p>
                              {resolved.description && (
                                <p className="text-xs text-ink/50 mt-0.5">
                                  {resolved.description}
                                </p>
                              )}
                            </div>
                            <ChevronRight className="w-3 h-3 text-ink/20 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                          </Link>
                        );
                      })}
                    </div>

                    {/* "View all" CTA at bottom of non-highlight columns */}
                    {!column.highlight && column.links.length > 0 && (() => {
                      // Build a "Voir tout" link pointing to the first category link's page, or homepage
                      const firstCatLink = column.links.find(l => l.type === 'category');
                      const firstCat = firstCatLink ? categories.find(c => c.id === firstCatLink.category_id) : null;
                      const viewAllUrl = firstCat ? `/category/${slugify(firstCat.name)}` : '/';
                      return (
                        <Link
                          to={viewAllUrl}
                          onClick={closeMenu}
                          className="flex items-center gap-2 mt-4 pt-4 border-t border-ink/10 text-[11px] font-bold uppercase tracking-[0.15em] text-accent hover:text-accent/80 transition-colors group"
                        >
                          <span>Voir tout</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
