import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  GripVertical,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Package,
  FileText,
  ExternalLink,
  Copy,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { MegaMenuItem, MegaMenuColumn, MegaMenuLink, MegaMenuLinkType } from '../../types';
import { useStore } from '../../store';

export default function MegaMenuManager() {
  const { categories, products } = useStore();
  const [menuItems, setMenuItems] = useState<MegaMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchMegaMenu();
  }, []);

  const fetchMegaMenu = async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      // Récupérer les items
      const { data: items, error: itemsError } = await supabase
        .from('mega_menu_items')
        .select('*')
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
      toast.error('Erreur lors du chargement du mega menu');
    } finally {
      setIsLoading(false);
    }
  };

  const createMenuItem = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('mega_menu_items')
        .insert({
          label: 'Nouveau menu',
          is_active: true,
          order: menuItems.length,
        })
        .select()
        .single();

      if (error) throw error;

      setMenuItems([...menuItems, { ...data, columns: [] } as MegaMenuItem]);
      toast.success('Menu créé');
    } catch (error) {
      console.error('Error creating menu item:', error);
      toast.error('Erreur lors de la création');
    }
  };

  const updateMenuItem = async (id: string, updates: Partial<MegaMenuItem>) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('mega_menu_items')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setMenuItems(menuItems.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ));
      toast.success('Menu mis à jour');
    } catch (error) {
      console.error('Error updating menu item:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const deleteMenuItem = async (id: string) => {
    if (!supabase) return;
    if (!confirm('Supprimer ce menu ?')) return;

    try {
      const { error } = await supabase
        .from('mega_menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMenuItems(menuItems.filter(item => item.id !== id));
      toast.success('Menu supprimé');
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const duplicateMenuItem = async (item: MegaMenuItem) => {
    if (!supabase) return;
    try {
      // 1. Créer le nouvel item de menu
      const { data: newItem, error: itemError } = await supabase
        .from('mega_menu_items')
        .insert({
          label: `${item.label} (Copie)`,
          category_id: item.category_id || null,
          is_active: item.is_active,
          order: menuItems.length,
        })
        .select()
        .single();

      if (itemError) throw itemError;

      const duplicatedColumns: MegaMenuColumn[] = [];

      // 2. Parcourir et dupliquer chaque colonne et ses liens
      if (item.columns && item.columns.length > 0) {
        for (const col of item.columns) {
          const { data: newCol, error: colError } = await supabase
            .from('mega_menu_columns')
            .insert({
              menu_item_id: newItem.id,
              title: col.title,
              order: col.order,
              highlight: col.highlight,
              background_color: col.background_color,
            })
            .select()
            .single();

          if (colError) throw colError;

          const duplicatedLinks: MegaMenuLink[] = [];

          if (col.links && col.links.length > 0) {
            for (const link of col.links) {
              const { data: newLink, error: linkError } = await supabase
                .from('mega_menu_links')
                .insert({
                  column_id: newCol.id,
                  label: link.label,
                  type: link.type,
                  url: link.url,
                  category_id: link.category_id,
                  product_id: link.product_id,
                  icon: link.icon,
                  description: link.description,
                  image_url: link.image_url,
                  order: link.order,
                })
                .select()
                .single();

              if (linkError) throw linkError;
              duplicatedLinks.push(newLink as MegaMenuLink);
            }
          }

          duplicatedColumns.push({
            ...newCol,
            links: duplicatedLinks,
          } as MegaMenuColumn);
        }
      }

      setMenuItems([
        ...menuItems,
        {
          ...newItem,
          columns: duplicatedColumns,
        } as MegaMenuItem,
      ]);
      toast.success('Menu dupliqué avec succès');
    } catch (error) {
      console.error('Error duplicating menu item:', error);
      toast.error('Erreur lors de la duplication du menu');
    }
  };

  const moveMenuItem = async (index: number, direction: 'up' | 'down') => {
    if (!supabase) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= menuItems.length) return;

    const itemA = menuItems[index];
    const itemB = menuItems[targetIndex];

    try {
      // Swapper les ordres dans Supabase
      const { error: errorA } = await supabase
        .from('mega_menu_items')
        .update({ order: itemB.order })
        .eq('id', itemA.id);

      if (errorA) throw errorA;

      const { error: errorB } = await supabase
        .from('mega_menu_items')
        .update({ order: itemA.order })
        .eq('id', itemB.id);

      if (errorB) throw errorB;

      // Mettre à jour l'état local
      const newItems = [...menuItems];
      const tempOrder = itemA.order;
      itemA.order = itemB.order;
      itemB.order = tempOrder;
      
      newItems[index] = itemB;
      newItems[targetIndex] = itemA;

      newItems.sort((a, b) => a.order - b.order);
      setMenuItems(newItems);
      toast.success('Ordre mis à jour');
    } catch (error) {
      console.error('Error moving menu item:', error);
      toast.error('Erreur lors du changement d\'ordre');
    }
  };

  const createColumn = async (menuItemId: string) => {
    if (!supabase) return;
    try {
      const item = menuItems.find(i => i.id === menuItemId);
      if (!item) return;

      const { data, error } = await supabase
        .from('mega_menu_columns')
        .insert({
          menu_item_id: menuItemId,
          title: 'Nouvelle colonne',
          order: item.columns.length,
        })
        .select()
        .single();

      if (error) throw error;

      setMenuItems(menuItems.map(i =>
        i.id === menuItemId
          ? { ...i, columns: [...i.columns, { ...data, links: [] }] }
          : i
      ));
      toast.success('Colonne créée');
    } catch (error) {
      console.error('Error creating column:', error);
      toast.error('Erreur lors de la création');
    }
  };

  const updateColumn = async (columnId: string, updates: Partial<MegaMenuColumn>) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('mega_menu_columns')
        .update(updates)
        .eq('id', columnId);

      if (error) throw error;

      setMenuItems(menuItems.map(item => ({
        ...item,
        columns: item.columns.map(col =>
          col.id === columnId ? { ...col, ...updates } : col
        ),
      })));
      toast.success('Colonne mise à jour');
    } catch (error) {
      console.error('Error updating column:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const deleteColumn = async (columnId: string) => {
    if (!supabase) return;
    if (!confirm('Supprimer cette colonne ?')) return;

    try {
      const { error } = await supabase
        .from('mega_menu_columns')
        .delete()
        .eq('id', columnId);

      if (error) throw error;

      setMenuItems(menuItems.map(item => ({
        ...item,
        columns: item.columns.filter(col => col.id !== columnId),
      })));
      toast.success('Colonne supprimée');
    } catch (error) {
      console.error('Error deleting column:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const createLink = async (columnId: string) => {
    if (!supabase) return;
    try {
      const column = menuItems
        .flatMap(i => i.columns)
        .find(c => c.id === columnId);
      if (!column) return;

      const { data, error } = await supabase
        .from('mega_menu_links')
        .insert({
          column_id: columnId,
          label: 'Nouveau lien',
          type: 'page',
          url: '/',
          order: column.links.length,
        })
        .select()
        .single();

      if (error) throw error;

      setMenuItems(menuItems.map(item => ({
        ...item,
        columns: item.columns.map(col =>
          col.id === columnId
            ? { ...col, links: [...col.links, data as MegaMenuLink] }
            : col
        ),
      })));
      toast.success('Lien créé');
    } catch (error) {
      console.error('Error creating link:', error);
      toast.error('Erreur lors de la création');
    }
  };

  const updateLink = async (linkId: string, updates: Partial<MegaMenuLink>) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('mega_menu_links')
        .update(updates)
        .eq('id', linkId);

      if (error) throw error;

      setMenuItems(menuItems.map(item => ({
        ...item,
        columns: item.columns.map(col => ({
          ...col,
          links: col.links.map(link =>
            link.id === linkId ? { ...link, ...updates } : link
          ),
        })),
      })));
      toast.success('Lien mis à jour');
    } catch (error) {
      console.error('Error updating link:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const deleteLink = async (linkId: string) => {
    if (!supabase) return;
    if (!confirm('Supprimer ce lien ?')) return;

    try {
      const { error } = await supabase
        .from('mega_menu_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      setMenuItems(menuItems.map(item => ({
        ...item,
        columns: item.columns.map(col => ({
          ...col,
          links: col.links.filter(link => link.id !== linkId),
        })),
      })));
      toast.success('Lien supprimé');
    } catch (error) {
      console.error('Error deleting link:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const getLinkTypeIcon = (type: MegaMenuLinkType) => {
    switch (type) {
      case 'category': return LinkIcon;
      case 'product': return Package;
      case 'page': return FileText;
      case 'external': return ExternalLink;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-ink/50">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion du Mega Menu</h2>
          <p className="text-sm text-ink/60 mt-1">
            Personnalisez les menus de navigation avec des liens vers catégories, produits et pages
          </p>
        </div>
        <button
          onClick={createMenuItem}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau menu
        </button>
      </div>

      <div className="space-y-4">
        {menuItems.map((item, index) => (
          <div
            key={item.id}
            className="bg-white border border-ink/10 rounded-xl overflow-hidden"
          >
            {/* Header du menu item */}
            <div className="flex items-center gap-3 p-4 bg-ink/5">
              <div className="flex items-center gap-1">
                <button className="cursor-grab text-ink/40 hover:text-ink mr-1">
                  <GripVertical className="w-5 h-5" />
                </button>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveMenuItem(index, 'up')}
                    disabled={index === 0}
                    className="p-0.5 text-ink/40 hover:text-ink hover:bg-ink/5 rounded disabled:opacity-20 disabled:pointer-events-none"
                    title="Monter"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveMenuItem(index, 'down')}
                    disabled={index === menuItems.length - 1}
                    className="p-0.5 text-ink/40 hover:text-ink hover:bg-ink/5 rounded disabled:opacity-20 disabled:pointer-events-none"
                    title="Descendre"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => toggleExpanded(item.id)}
                className="flex-1 flex items-center gap-3 text-left"
              >
                {expandedItems.has(item.id) ? (
                  <ChevronUp className="w-5 h-5 text-ink/60" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-ink/60" />
                )}
                <div className="flex-1">
                  {editingItem === item.id ? (
                    <div className="flex flex-col gap-2 p-2 bg-ink/5 rounded-lg border border-ink/10 mt-2">
                      <div>
                        <label className="text-xs font-bold text-ink/60 block mb-1">Nom du menu</label>
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) =>
                            setMenuItems(menuItems.map(i =>
                              i.id === item.id ? { ...i, label: e.target.value } : i
                            ))
                          }
                          className="w-full px-3 py-1 border border-ink/20 rounded-lg text-sm font-bold bg-white"
                          autoFocus
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-bold text-ink/60 block mb-1">Type</label>
                          <select
                            value={item.category_id?.startsWith('link:') ? 'simple' : 'mega'}
                            onChange={(e) => {
                              const type = e.target.value;
                              setMenuItems(menuItems.map(i => {
                                if (i.id === item.id) {
                                  return {
                                    ...i,
                                    category_id: type === 'simple' ? 'link:/' : null
                                  };
                                }
                                return i;
                              }));
                            }}
                            className="w-full px-3 py-1 border border-ink/20 rounded-lg text-sm bg-white"
                          >
                            <option value="mega">Mega Menu (avec colonnes)</option>
                            <option value="simple">Lien simple (ex: Accueil)</option>
                          </select>
                        </div>
                        {item.category_id?.startsWith('link:') && (
                          <div>
                            <label className="text-xs font-bold text-ink/60 block mb-1">URL du lien</label>
                            <input
                              type="text"
                              value={item.category_id.substring(5)}
                              onChange={(e) =>
                                setMenuItems(menuItems.map(i =>
                                  i.id === item.id ? { ...i, category_id: `link:${e.target.value}` } : i
                                ))
                              }
                              className="w-full px-3 py-1 border border-ink/20 rounded-lg text-sm bg-white"
                              placeholder="/"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        {item.label}
                        {item.category_id?.startsWith('link:') && (
                          <span className="text-xs font-medium px-2 py-0.5 bg-accent/10 text-accent rounded-full normal-case">
                            Lien simple: {item.category_id.substring(5)}
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-ink/50 mt-0.5">
                        {item.category_id?.startsWith('link:')
                          ? 'Redirige directement vers l\'URL'
                          : `${item.columns ? item.columns.length : 0} colonne${item.columns && item.columns.length > 1 ? 's' : ''}`
                        }
                      </p>
                    </div>
                  )}
                </div>
              </button>

              <button
                onClick={() =>
                  updateMenuItem(item.id, { is_active: !item.is_active })
                }
                className={`p-2 rounded-lg transition-colors ${
                  item.is_active
                    ? 'text-emerald-600 hover:bg-emerald-50'
                    : 'text-ink/40 hover:bg-ink/5'
                }`}
                title={item.is_active ? 'Actif' : 'Inactif'}
              >
                {item.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>

              <button
                onClick={() => duplicateMenuItem(item)}
                className="p-2 text-ink/60 hover:bg-ink/5 rounded-lg transition-colors"
                title="Dupliquer"
              >
                <Copy className="w-5 h-5" />
              </button>

              {editingItem === item.id ? (
                <button
                  onClick={() => {
                    updateMenuItem(item.id, { label: item.label, category_id: item.category_id });
                    setEditingItem(null);
                  }}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  <Save className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => setEditingItem(item.id)}
                  className="p-2 text-ink/60 hover:bg-ink/5 rounded-lg transition-colors"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={() => deleteMenuItem(item.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Colonnes */}
            <AnimatePresence>
              {expandedItems.has(item.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-ink/10"
                >
                  <div className="p-4 space-y-4">
                    {item.columns.map((column) => (
                      <ColumnEditor
                        key={column.id}
                        column={column}
                        categories={categories}
                        products={products}
                        onUpdate={(updates) => updateColumn(column.id, updates)}
                        onDelete={() => deleteColumn(column.id)}
                        onCreateLink={() => createLink(column.id)}
                        onUpdateLink={updateLink}
                        onDeleteLink={deleteLink}
                      />
                    ))}

                    <button
                      onClick={() => createColumn(item.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-ink/20 rounded-lg text-sm font-bold text-ink/60 hover:border-accent hover:text-accent transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter une colonne
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {menuItems.length === 0 && (
        <div className="text-center py-12 bg-white border border-ink/10 rounded-xl">
          <p className="text-ink/50 mb-4">Aucun menu configuré</p>
          <button
            onClick={createMenuItem}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Créer le premier menu
          </button>
        </div>
      )}
    </div>
  );
}

// Composant pour éditer une colonne
function ColumnEditor({
  column,
  categories,
  products,
  onUpdate,
  onDelete,
  onCreateLink,
  onUpdateLink,
  onDeleteLink,
}: {
  column: MegaMenuColumn;
  categories: any[];
  products: any[];
  onUpdate: (updates: Partial<MegaMenuColumn>) => void;
  onDelete: () => void;
  onCreateLink: () => void;
  onUpdateLink: (linkId: string, updates: Partial<MegaMenuLink>) => void;
  onDeleteLink: (linkId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-ink/5 rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-ink/60"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={column.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          onBlur={() => onUpdate({ title: column.title })}
          className="flex-1 px-3 py-1 bg-white border border-ink/20 rounded-lg text-sm font-bold"
        />

        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={column.highlight || false}
            onChange={(e) => onUpdate({ highlight: e.target.checked })}
            className="rounded accent-accent"
          />
          Highlight
        </label>

        <button
          onClick={onDelete}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {isExpanded && (
        <div className="p-3 pt-0 space-y-2">
          {column.links.map((link) => (
            <LinkEditor
              key={link.id}
              link={link}
              categories={categories}
              products={products}
              onUpdate={(updates) => onUpdateLink(link.id, updates)}
              onDelete={() => onDeleteLink(link.id)}
            />
          ))}

          <button
            onClick={onCreateLink}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-ink/20 rounded-lg text-xs font-bold text-ink/60 hover:border-accent hover:text-accent transition-colors"
          >
            <Plus className="w-3 h-3" />
            Ajouter un lien
          </button>
        </div>
      )}
    </div>
  );
}

// Composant pour éditer un lien
function LinkEditor({
  link,
  categories,
  products,
  onUpdate,
  onDelete,
}: {
  link: MegaMenuLink;
  categories: any[];
  products: any[];
  onUpdate: (updates: Partial<MegaMenuLink>) => void;
  onDelete: () => void;
}) {
  const Icon = getLinkTypeIcon(link.type);

  return (
    <div className="bg-white border border-ink/10 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-ink/40" />
        <input
          type="text"
          value={link.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          onBlur={() => onUpdate({ label: link.label })}
          className="flex-1 px-2 py-1 border border-ink/20 rounded text-sm"
          placeholder="Label"
        />
        <select
          value={link.type}
          onChange={(e) => onUpdate({ type: e.target.value as MegaMenuLinkType })}
          className="px-2 py-1 border border-ink/20 rounded text-xs"
        >
          <option value="category">Catégorie</option>
          <option value="product">Produit</option>
          <option value="page">Page</option>
          <option value="external">Externe</option>
        </select>
        <button
          onClick={onDelete}
          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {link.type === 'category' && (
        <select
          value={link.category_id || ''}
          onChange={(e) => onUpdate({ category_id: e.target.value })}
          className="w-full px-2 py-1 border border-ink/20 rounded text-sm"
        >
          <option value="">Sélectionner une catégorie</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      )}

      {link.type === 'product' && (
        <select
          value={link.product_id || ''}
          onChange={(e) => onUpdate({ product_id: e.target.value })}
          className="w-full px-2 py-1 border border-ink/20 rounded text-sm"
        >
          <option value="">Sélectionner un produit</option>
          {products.map((prod) => (
            <option key={prod.id} value={prod.id}>
              {prod.name}
            </option>
          ))}
        </select>
      )}

      {(link.type === 'page' || link.type === 'external') && (
        <input
          type="text"
          value={link.url || ''}
          onChange={(e) => onUpdate({ url: e.target.value })}
          onBlur={() => onUpdate({ url: link.url })}
          className="w-full px-2 py-1 border border-ink/20 rounded text-sm"
          placeholder="URL"
        />
      )}

      <input
        type="text"
        value={link.description || ''}
        onChange={(e) => onUpdate({ description: e.target.value })}
        onBlur={() => onUpdate({ description: link.description })}
        className="w-full px-2 py-1 border border-ink/20 rounded text-sm"
        placeholder="Description (optionnel)"
      />
    </div>
  );
}

function getLinkTypeIcon(type: MegaMenuLinkType) {
  switch (type) {
    case 'category': return LinkIcon;
    case 'product': return Package;
    case 'page': return FileText;
    case 'external': return ExternalLink;
  }
}
