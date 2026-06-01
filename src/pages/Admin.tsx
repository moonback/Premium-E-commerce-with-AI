import React, { useState } from 'react';
import { Package, Users, ShoppingCart, BarChart3, Settings, DatabaseBackup, Plus, Trash2, Edit2, LayoutDashboard, TrendingUp, Warehouse, Activity, Tag, Menu, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../store';
import { Category, Product, Spec } from '../types';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import AdminOrdersList from '../components/AdminOrdersList';
import KitchenOrders from '../components/KitchenOrders';
import AdminAnalytics from '../components/AdminAnalytics';
import AdminCustomers from '../components/AdminCustomers';
import AdminInventory from '../components/AdminInventory';
import AdminSettings from '../components/AdminSettings';
import AdminActivityLog from '../components/AdminActivityLog';
import AdminDashboard from '../components/AdminDashboard';
import AdminDiscounts from '../components/AdminDiscounts';
import AdminMarginAnalysis from '../components/AdminMarginAnalysis';
import MegaMenuManager from '../components/admin/MegaMenuManager';
import CategoryModal from '../components/CategoryModal';
import SEOFields from '../components/SEOFields';
import ProductBadgesManager from '../components/ProductBadgesManager';
import ProductPromotionManager from '../components/ProductPromotionManager';
import { getErrorMessage } from '../lib/errors';

type EditableProduct = Partial<Omit<Product, 'effects' | 'specs'>> & {
  effects?: string[] | string;
  specs?: Spec[] | string;
  category?: string;
};

type ProductUpsertPayload = Product & { category?: string };

const parseListField = (value: string[] | string | undefined): string[] => {
  if (Array.isArray(value)) return value;
  return value?.split(',').map(item => item.trim()).filter(Boolean) ?? [];
};

const parseSpecsField = (value: Spec[] | string | undefined): Spec[] => {
  if (Array.isArray(value)) return value;
  return value?.split(';;').map(item => {
    const [title = '', content = ''] = item.split('::');
    return { title: title.trim(), content: content.trim() };
  }).filter(spec => spec.title || spec.content) ?? [];
};

export default function Admin() {
  const syncCatalogToDb = useStore((state) => state.syncCatalogToDb);
  const products = useStore((state) => state.products);
  const categories = useStore((state) => state.categories);
  const fetchProducts = useStore((state) => state.fetchProducts);
  const [activeTab, setActiveTab] = useState('Overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EditableProduct>({});
  
  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // SEO State for Products
  const [showProductSEO, setShowProductSEO] = useState(false);
  const [showProductBadges, setShowProductBadges] = useState(false);
  const [showProductPromotion, setShowProductPromotion] = useState(false);

  const [todaySales, setTodaySales] = React.useState(0);
  const [activeOrdersCount, setActiveOrdersCount] = React.useState(0);
  const [totalCustomers, setTotalCustomers] = React.useState(0);

  React.useEffect(() => {
    if (supabase) {
      const fetchStats = async () => {
        try {
          // Fetch all orders
          const { data: allOrders, error: ordersError } = await supabase
            .from('orders')
            .select('*');

          if (!ordersError && allOrders) {
            // 1. Calculate today's sales
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const todayOrders = allOrders.filter(o => new Date(o.created_at) >= startOfToday);
            const salesSum = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
            setTodaySales(salesSum);

            // 2. Active orders count (status is not Livrée and not Terminée)
            const active = allOrders.filter(o => !['Livrée', 'Terminée'].includes(o.status));
            setActiveOrdersCount(active.length);
          }

          // 3. Fetch profiles count
          const { count: profileCount, error: profileError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

          if (!profileError && profileCount !== null) {
            setTotalCustomers(profileCount);
          } else if (allOrders) {
            const uniqueUsers = new Set(allOrders.map(o => o.user_id));
            setTotalCustomers(uniqueUsers.size);
          }
        } catch (e) {
          console.error("Error fetching stats:", e);
        }
      };

      fetchStats();
      const interval = setInterval(fetchStats, 10000);
      return () => clearInterval(interval);
    }
  }, []);

  const stats = [
    { label: "Ventes du Jour", value: `${todaySales.toFixed(2)}€`, change: todaySales > 0 ? "Actif" : "0%" },
    { label: "Commandes Actives", value: activeOrdersCount.toString(), change: activeOrdersCount > 0 ? "En cours" : "Aucune" },
    { label: "Total Clients", value: totalCustomers.toString(), change: totalCustomers > 0 ? "Inscrits" : "0" },
    { label: "Produits Catalogue", value: products.length.toString(), change: products.length > 0 ? "Synchronisé" : "Sync requis" }
  ];

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return toast.error("Supabase non configuré");
    try {
      const p = {
        ...editingProduct,
        id: editingProduct.id || `prod_${Date.now()}`,
        name: editingProduct.name || "",
        price: Number(editingProduct.price) || 0,
        stock: Number(editingProduct.stock) || 0,
        image: editingProduct.image || '',
        description: editingProduct.description || '',
        categories: editingProduct.categories || [],
        effects: parseListField(editingProduct.effects),
        specs: parseSpecsField(editingProduct.specs),
        seo: editingProduct.seo || null,
        badges: editingProduct.badges || [],
        promotion: editingProduct.promotion || null,
      } satisfies ProductUpsertPayload;

      // Remove legacy field if it still exists in state
      delete p.category;

      const { error } = await supabase.from('products').upsert([p]);
      if (error) throw error;
      toast.success("Produit sauvegardé");
      setIsEditing(false);
      fetchProducts();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;

    try {
      toast.loading("Upload de l'image...", { id: "upload" });
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      setEditingProduct({ ...editingProduct, image: publicUrl });
      toast.success("Image uploadée", { id: "upload" });
    } catch (err) {
      toast.error(getErrorMessage(err, "Erreur upload"), { id: "upload" });
    }
  };

  const handleDeleteProduct = async (id: string) => {
     if (!window.confirm("Supprimer ce produit ?")) return;
     if (!supabase) return;
     try {
       const { error } = await supabase.from('products').delete().eq('id', id);
       if (error) throw error;
       toast.success("Produit supprimé");
       fetchProducts();
     } catch (err) {
       toast.error(getErrorMessage(err));
     }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Supprimer cette catégorie ? (Les sous-catégories seront aussi supprimées)")) return;
    if (!supabase) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      toast.success("Catégorie supprimée");
      useStore.getState().fetchCategories();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleEditCategoryClick = (cat: Category) => {
    setEditingCategory(cat);
    setIsCategoryModalOpen(true);
  };

  const handleAddCategoryClick = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleCloseCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  };

  const editingSpecs = Array.isArray(editingProduct.specs) ? editingProduct.specs : [];
  const editingEffectsValue = Array.isArray(editingProduct.effects)
    ? editingProduct.effects.join(', ')
    : editingProduct.effects || '';

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar */}
      <div className="w-64 bg-transparent border-r border-ink/10 p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-12">
          <span className="font-bold text-2xl font-serif italic text-ink tracking-tighter">Admin Boutique</span>
        </div>

        <nav className="flex flex-col gap-2">
          {[ 
            { icon: BarChart3, label: "Overview" },
            { icon: TrendingUp, label: "Analytics" },
            { icon: DollarSign, label: "Marges" },
            { icon: Package, label: "Products" },
            { icon: Warehouse, label: "Inventory" },
            { icon: LayoutDashboard, label: "Categories" },
            { icon: Menu, label: "Mega Menu" },
            { icon: ShoppingCart, label: "Orders" },
            { icon: Users, label: "Customers" },
            { icon: Tag, label: "Discounts" },
            { icon: Activity, label: "Activity" },
            { icon: Settings, label: "Settings" },
          ].map((item, i) => (
            <button 
              key={i}
              onClick={() => setActiveTab(item.label)}
              className={`flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest font-bold transition-colors ${
                activeTab === item.label ? 'bg-ink text-white' : 'text-ink/60 hover:bg-soft-green hover:text-ink'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 overflow-y-auto w-full">
        <header className="mb-10 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-light font-serif tracking-tight mb-2">{activeTab}</h1>
            <p className="text-ink/60">Gérez votre boutique, métriques et catalogue.</p>
          </div>
          <button 
            onClick={() => {
              if (activeTab === 'Products') {
                setEditingProduct({});
                setIsEditing(true);
              } else {
                syncCatalogToDb();
              }
            }}
            className="px-6 py-4 bg-ink text-white font-bold text-xs uppercase tracking-widest hover:bg-ink/90 transition-colors flex items-center gap-2"
          >
            {activeTab === 'Products' ? <Plus className="w-4 h-4"/> : <DatabaseBackup className="w-4 h-4" />}
            {activeTab === 'Products' ? "Nouveau Produit" : "Sync Catalogue"}
          </button>
        </header>

        {activeTab === 'Overview' && <AdminDashboard />}

        {activeTab === 'Analytics' && <AdminAnalytics />}

        {activeTab === 'Marges' && <AdminMarginAnalysis />}

        {activeTab === 'Customers' && <AdminCustomers />}

        {activeTab === 'Discounts' && <AdminDiscounts />}

        {activeTab === 'Inventory' && <AdminInventory />}

        {activeTab === 'Activity' && <AdminActivityLog />}

        {activeTab === 'Settings' && <AdminSettings />}

        {activeTab === 'Mega Menu' && <MegaMenuManager />}

        {activeTab === 'Orders' && (
          <div className="bg-transparent border border-ink/10 overflow-hidden">
            <AdminOrdersList />
          </div>
        )}

        {activeTab === 'Products' && !isEditing && (
           <div className="bg-transparent border border-ink/10 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-soft-green/20 text-ink/50 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 font-bold tracking-widest">Image</th>
                  <th className="px-6 py-3 font-bold tracking-widest">Nom</th>
                  <th className="px-6 py-3 font-bold tracking-widest">Badges</th>
                  <th className="px-6 py-3 font-bold tracking-widest">Catégorie</th>
                  <th className="px-6 py-3 font-bold tracking-widest">Prix</th>
                  <th className="px-6 py-3 font-bold tracking-widest">Prix Achat</th>
                  <th className="px-6 py-3 font-bold tracking-widest">Marge</th>
                  <th className="px-6 py-3 font-bold tracking-widest">Stock</th>
                  <th className="px-6 py-3 font-bold tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {products.map((p) => {
                  const margin = p.purchase_price ? ((p.price - p.purchase_price) / p.price * 100).toFixed(1) : null;
                  return (
                  <tr key={p.id} className="hover:bg-soft-green/30">
                    <td className="px-6 py-4">
                      <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-full" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-serif font-bold text-lg">{p.name}</div>
                      {p.is_batch_product && (
                        <div className="text-xs text-ink/60 mt-1">
                          📦 Lot de {p.batch_size} {p.batch_unit}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(p.badges || []).map((badge) => {
                          const badgeConfig: Record<string, { label: string; color: string; icon: string }> = {
                            featured: { label: 'Vedette', color: 'bg-yellow-100 text-yellow-800', icon: '⭐' },
                            bestseller: { label: 'Best', color: 'bg-purple-100 text-purple-800', icon: '🏆' },
                            top_sales: { label: 'Top', color: 'bg-green-100 text-green-800', icon: '📈' },
                            new: { label: 'Nouveau', color: 'bg-blue-100 text-blue-800', icon: '✨' },
                            limited: { label: 'Limité', color: 'bg-red-100 text-red-800', icon: '⏰' },
                          };
                          const config = badgeConfig[badge] || { label: badge, color: 'bg-gray-100 text-gray-800', icon: '🏷️' };
                          return (
                            <span key={badge} className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${config.color}`}>
                              {config.icon} {config.label}
                            </span>
                          );
                        })}
                        {p.promotion && (() => {
                          const now = new Date();
                          const start = new Date(p.promotion.promo_start_date);
                          const end = new Date(p.promotion.promo_end_date);
                          const isActive = now >= start && now <= end;
                          return isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-800">
                              🔥 {p.promotion.promo_label || 'Promo'}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs tracking-widest uppercase">{(p.categories || []).join(', ')}</td>
                    <td className="px-6 py-4">
                      {p.promotion && (() => {
                        const now = new Date();
                        const start = new Date(p.promotion.promo_start_date);
                        const end = new Date(p.promotion.promo_end_date);
                        const isActive = now >= start && now <= end;
                        return isActive ? (
                          <div>
                            <div className="font-bold text-red-600">{p.promotion.promo_price.toFixed(2)}€</div>
                            <div className="text-xs text-ink/40 line-through">{p.price.toFixed(2)}€</div>
                          </div>
                        ) : (
                          <div className="font-semibold">{p.price.toFixed(2)}€</div>
                        );
                      })() || <div className="font-semibold">{p.price.toFixed(2)}€</div>}
                    </td>
                    <td className="px-6 py-4">
                      {p.purchase_price ? (
                        <span className="text-ink/60">{p.purchase_price.toFixed(2)}€</span>
                      ) : (
                        <span className="text-ink/30 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {margin ? (
                        <span className={`font-semibold ${Number(margin) > 30 ? 'text-green-600' : Number(margin) > 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {margin}%
                        </span>
                      ) : (
                        <span className="text-ink/30 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{p.stock} {p.is_batch_product ? 'lots' : 'pcs'}</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                       <button onClick={() => { setEditingProduct(p); setIsEditing(true); }} className="p-2 border border-ink/10 hover:bg-ink hover:text-white transition-colors"><Edit2 className="w-4 h-4"/></button>
                       <button onClick={() => handleDeleteProduct(p.id)} className="p-2 border border-ink/10 text-red-600 hover:bg-red-60 transition-colors"><Trash2 className="w-4 h-4"/></button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Products' && isEditing && (
          <div className="bg-transparent border border-ink/10 p-8 max-w-2xl">
            <h2 className="text-2xl font-serif mb-6">{editingProduct.id ? 'Modifier le Produit' : 'Nouveau Produit'}</h2>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold mb-1 opacity-50">Nom</label>
                <input required type="text" value={editingProduct.name || ''} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full border-b border-ink/20 py-2 focus:outline-none focus:border-ink bg-transparent" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold mb-1 opacity-50">Prix de vente (€)</label>
                  <input required type="number" step="0.01" value={editingProduct.price || ''} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} className="w-full border-b border-ink/20 py-2 focus:outline-none focus:border-ink bg-transparent" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold mb-1 opacity-50">Prix d'achat (€)</label>
                  <input type="number" step="0.01" value={editingProduct.purchase_price || ''} onChange={e => setEditingProduct({...editingProduct, purchase_price: e.target.value ? Number(e.target.value) : undefined})} className="w-full border-b border-ink/20 py-2 focus:outline-none focus:border-ink bg-transparent" placeholder="Optionnel" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold mb-1 opacity-50">Stock</label>
                  <input required type="number" value={editingProduct.stock || ''} onChange={e => setEditingProduct({...editingProduct, stock: Number(e.target.value)})} className="w-full border-b border-ink/20 py-2 focus:outline-none focus:border-ink bg-transparent" />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold mb-1 opacity-50 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={editingProduct.is_batch_product || false} 
                      onChange={e => setEditingProduct({...editingProduct, is_batch_product: e.target.checked, batch_size: e.target.checked ? (editingProduct.batch_size || 1) : undefined, batch_unit: e.target.checked ? (editingProduct.batch_unit || 'pièces') : undefined})} 
                      className="accent-ink" 
                    />
                    Produit en lot
                  </label>
                  {editingProduct.is_batch_product && (
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        min="1"
                        value={editingProduct.batch_size || 1} 
                        onChange={e => setEditingProduct({...editingProduct, batch_size: Number(e.target.value)})} 
                        className="w-20 border-b border-ink/20 py-2 focus:outline-none focus:border-ink bg-transparent" 
                        placeholder="Qté"
                      />
                      <input 
                        type="text" 
                        value={editingProduct.batch_unit || 'pièces'} 
                        onChange={e => setEditingProduct({...editingProduct, batch_unit: e.target.value})} 
                        className="flex-1 border-b border-ink/20 py-2 focus:outline-none focus:border-ink bg-transparent" 
                        placeholder="Unité"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold mb-2 opacity-50">Catégories</label>
                <div className="space-y-2 border border-ink/10 p-4 max-h-48 overflow-y-auto">
                  {categories.filter(c => c.level === 1).map(c1 => (
                    <div key={c1.id}>
                      <label className="flex items-center gap-2 text-sm font-bold mt-2 cursor-pointer">
                        <input type="checkbox" checked={(editingProduct.categories || []).includes(c1.name)} onChange={(e) => {
                          const cats = editingProduct.categories || [];
                          if (e.target.checked) setEditingProduct({...editingProduct, categories: [...cats, c1.name]});
                          else setEditingProduct({...editingProduct, categories: cats.filter(c => c !== c1.name)});
                        }} className="accent-ink" />
                        {c1.name}
                      </label>
                      <div className="pl-4 space-y-1 mt-1">
                        {categories.filter(c => c.parent_id === c1.id).map(c2 => (
                           <div key={c2.id}>
                             <label className="flex items-center gap-2 text-sm cursor-pointer">
                               <input type="checkbox" checked={(editingProduct.categories || []).includes(c2.name)} onChange={(e) => {
                                 const cats = editingProduct.categories || [];
                                 if (e.target.checked) setEditingProduct({...editingProduct, categories: [...cats, c2.name]});
                                 else setEditingProduct({...editingProduct, categories: cats.filter(c => c !== c2.name)});
                               }} className="accent-ink" />
                               {c2.name}
                             </label>
                             <div className="pl-6 space-y-1">
                               {categories.filter(c => c.parent_id === c2.id).map(c3 => (
                                 <label key={c3.id} className="flex items-center gap-2 text-sm text-ink/60 cursor-pointer">
                                   <input type="checkbox" checked={(editingProduct.categories || []).includes(c3.name)} onChange={(e) => {
                                     const cats = editingProduct.categories || [];
                                     if (e.target.checked) setEditingProduct({...editingProduct, categories: [...cats, c3.name]});
                                     else setEditingProduct({...editingProduct, categories: cats.filter(c => c !== c3.name)});
                                   }} className="accent-ink" />
                                   {c3.name}
                                 </label>
                               ))}
                             </div>
                           </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Spécifications (Accordéons) */}
              <div className="mt-10 space-y-4">
                  {editingSpecs.map((spec, idx) => (
                    <div key={idx} className="border border-ink/10 p-4 rounded">
                      <input
                        type="text"
                        placeholder="Titre"
                        value={spec.title || ''}
                        onChange={e => {
                          const newSpecs = [...editingSpecs];
                          newSpecs[idx] = { ...newSpecs[idx], title: e.target.value };
                          setEditingProduct({ ...editingProduct, specs: newSpecs });
                        }}
                        className="w-full mb-2 border-b border-ink/20 py-1 focus:outline-none"
                      />
                      <textarea
                        placeholder="Contenu"
                        value={spec.content || ''}
                        onChange={e => {
                          const newSpecs = [...editingSpecs];
                          newSpecs[idx] = { ...newSpecs[idx], content: e.target.value };
                          setEditingProduct({ ...editingProduct, specs: newSpecs });
                        }}
                        className="w-full border-b border-ink/20 py-1 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newSpecs = editingSpecs.filter((_s, i) => i !== idx);
                          setEditingProduct({ ...editingProduct, specs: newSpecs });
                        }}
                        className="mt-2 text-xs text-red-600 hover:underline"
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const newSpecs = [...editingSpecs, { title: '', content: '' }];
                      setEditingProduct({ ...editingProduct, specs: newSpecs });
                    }}
                    className="px-4 py-2 border border-ink text-ink hover:bg-ink hover:text-white transition-colors"
                  >
                    + Ajouter une spécification
                  </button>
                </div>
              
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold mb-1 opacity-50">Description</label>
                <textarea required value={editingProduct.description || ''} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} className="w-full border-b border-ink/20 py-2 focus:outline-none focus:border-ink bg-transparent italic" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold mb-1 opacity-50">Image Produit</label>
                <div className="flex gap-4 items-end">
                   <div className="flex-1">
                     <input required type="text" placeholder="URL ou upload..." value={editingProduct.image || ''} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} className="w-full border-b border-ink/20 py-2 focus:outline-none focus:border-ink bg-transparent" />
                   </div>
                   <label className="cursor-pointer px-4 py-2 border border-ink/20 hover:bg-ink/5 transition-colors text-xs font-bold uppercase tracking-widest flex-shrink-0">
                     Upload
                     <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                   </label>
                </div>
                {editingProduct.image && (
                   <img src={editingProduct.image} alt="Preview" className="w-20 h-20 object-cover mt-4 border border-ink/10" />
                )}
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold mb-1 opacity-50">Effets (séparés par virgule)</label>
                <input type="text" value={editingEffectsValue} onChange={e => setEditingProduct({...editingProduct, effects: e.target.value})} className="w-full border-b border-ink/20 py-2 focus:outline-none focus:border-ink bg-transparent" />
              </div>

              {/* SEO Section */}
              <div className="border-t border-ink/10 pt-6 mt-6">
                <button
                  type="button"
                  onClick={() => setShowProductSEO(!showProductSEO)}
                  className="flex items-center justify-between w-full px-4 py-3 bg-soft-green/10 hover:bg-soft-green/20 transition-colors rounded"
                >
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Optimisation SEO (Optionnel)
                  </span>
                  {showProductSEO ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showProductSEO && (
                  <div className="mt-4">
                    <SEOFields 
                      seo={editingProduct.seo || {}} 
                      onChange={(seo) => setEditingProduct({...editingProduct, seo})} 
                    />
                  </div>
                )}
              </div>

              {/* Badges Section */}
              <div className="border-t border-ink/10 pt-6 mt-6">
                <button
                  type="button"
                  onClick={() => setShowProductBadges(!showProductBadges)}
                  className="flex items-center justify-between w-full px-4 py-3 bg-soft-green/10 hover:bg-soft-green/20 transition-colors rounded"
                >
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Badges Produit (Optionnel)
                  </span>
                  {showProductBadges ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showProductBadges && (
                  <div className="mt-4">
                    <ProductBadgesManager 
                      badges={editingProduct.badges || []} 
                      onChange={(badges) => setEditingProduct({...editingProduct, badges})} 
                    />
                  </div>
                )}
              </div>

              {/* Promotion Section */}
              <div className="border-t border-ink/10 pt-6 mt-6">
                <button
                  type="button"
                  onClick={() => setShowProductPromotion(!showProductPromotion)}
                  className="flex items-center justify-between w-full px-4 py-3 bg-soft-green/10 hover:bg-soft-green/20 transition-colors rounded"
                >
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Prix Promotionnel (Optionnel)
                  </span>
                  {showProductPromotion ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showProductPromotion && (
                  <div className="mt-4">
                    <ProductPromotionManager 
                      promotion={editingProduct.promotion} 
                      originalPrice={editingProduct.price || 0}
                      onChange={(promotion) => setEditingProduct({...editingProduct, promotion})} 
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-8 pt-4 border-t border-ink/10 text-xs font-bold uppercase tracking-widest">
                <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-4 border border-ink hover:bg-ink hover:text-white transition-colors">Annuler</button>
                <button type="submit" className="px-6 py-4 bg-ink text-white hover:bg-ink/90 transition-colors">Enregistrer</button>
              </div>
            </form>
          </div>
        )}
        {activeTab === 'Categories' && (
          <div className="bg-transparent border border-ink/10 p-8 max-w-4xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-serif">Gestion des Catégories (3 Niveaux)</h2>
                <p className="text-ink/60 text-sm mt-2">Gérez l'arborescence des catégories de votre boutique de manière indépendante.</p>
              </div>
              <button
                onClick={handleAddCategoryClick}
                className="px-6 py-4 bg-ink text-white font-bold text-xs uppercase tracking-widest hover:bg-ink/90 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter une Catégorie
              </button>
            </div>
            
            <div className="space-y-4 text-sm">
              <ul className="space-y-2 font-mono text-xs">
                {categories.filter(c => c.level === 1).map(c1 => (
                   <li key={c1.id}>
                     <div className="font-bold border-b border-ink/10 pb-1 mb-1 flex justify-between items-center gap-2">
                       {c1.image_url
                         ? <img src={c1.image_url} alt={c1.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-ink/10" />
                         : <span className="w-8 h-8 rounded-lg bg-ink/5 flex items-center justify-center flex-shrink-0 text-ink/30 text-base">📁</span>
                       }
                       <span className="flex-1">{c1.name} <span className="text-ink/40">(Niv 1)</span></span>
                       <div className="flex gap-1">
                         <button onClick={() => handleEditCategoryClick(c1)} className="text-ink/60 hover:text-ink hover:bg-ink/5 p-1"><Edit2 className="w-3 h-3"/></button>
                         <button onClick={() => handleDeleteCategory(c1.id)} className="text-red-600 hover:bg-red-50 p-1"><Trash2 className="w-3 h-3"/></button>
                       </div>
                     </div>
                     <ul className="pl-4 space-y-1 mt-1">
                       {categories.filter(c => c.parent_id === c1.id).map(c2 => (
                         <li key={c2.id}>
                           <div className="flex justify-between items-center gap-2">
                             {c2.image_url
                               ? <img src={c2.image_url} alt={c2.name} className="w-6 h-6 rounded object-cover flex-shrink-0 border border-ink/10" />
                               : <span className="w-6 h-6 rounded bg-ink/5 flex items-center justify-center flex-shrink-0 text-ink/30 text-xs">📂</span>
                             }
                             <span className="flex-1">↳ {c2.name} <span className="text-ink/40">(Niv 2)</span></span>
                             <div className="flex gap-1">
                               <button onClick={() => handleEditCategoryClick(c2)} className="text-ink/60 hover:text-ink hover:bg-ink/5 p-1"><Edit2 className="w-3 h-3"/></button>
                               <button onClick={() => handleDeleteCategory(c2.id)} className="text-red-600 hover:bg-red-50 p-1"><Trash2 className="w-3 h-3"/></button>
                             </div>
                           </div>
                           <ul className="pl-6 space-y-1 text-ink/60">
                             {categories.filter(c => c.parent_id === c2.id).map(c3 => (
                               <li key={c3.id} className="flex justify-between items-center gap-2">
                                 {c3.image_url
                                   ? <img src={c3.image_url} alt={c3.name} className="w-5 h-5 rounded object-cover flex-shrink-0 border border-ink/10" />
                                   : <span className="w-5 h-5 rounded bg-ink/5 flex items-center justify-center flex-shrink-0 text-ink/30 text-xs">—</span>
                                 }
                                 <span className="flex-1">-- {c3.name} <span className="text-ink/40">(Niv 3)</span></span>
                                 <div className="flex gap-1">
                                   <button onClick={() => handleEditCategoryClick(c3)} className="text-ink/60 hover:text-ink hover:bg-ink/5 p-1"><Edit2 className="w-3 h-3"/></button>
                                   <button onClick={() => handleDeleteCategory(c3.id)} className="text-red-600 hover:bg-red-50 p-1"><Trash2 className="w-3 h-3"/></button>
                                 </div>
                               </li>
                             ))}
                           </ul>
                         </li>
                       ))}
                     </ul>
                   </li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-soft-green/20 border border-ink/10 text-xs text-ink/70 mt-8">
              <p className="font-bold mb-2">Note sur la base de données :</p>
              <p>Ouvrez l'interface DB Supabase et créez une table <code>categories</code> avec <code>id</code> (text), <code>name</code> (text), <code>parent_id</code> (text nullable), <code>level</code> (int). Les catégories s'afficheront ici automatiquement.</p>
            </div>
          </div>
        )}
      </div>

      {/* Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={handleCloseCategoryModal}
        editingCategory={editingCategory}
        categories={categories}
      />
    </div>
  );
}
