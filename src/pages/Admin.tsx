import React, { useState } from 'react';
import { Package, Users, ShoppingCart, BarChart3, Settings, DatabaseBackup, Plus, Trash2, Edit2, LayoutDashboard } from 'lucide-react';
import { useStore } from '../store';
import { Product } from '../types';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import AdminOrdersList from '../components/AdminOrdersList';
import KitchenOrders from '../components/KitchenOrders';

export default function Admin() {
  const syncCatalogToDb = useStore((state) => state.syncCatalogToDb);
  const products = useStore((state) => state.products);
  const categories = useStore((state) => state.categories);
  const fetchProducts = useStore((state) => state.fetchProducts);
  const [activeTab, setActiveTab] = useState('Overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>({});
  
  // Category Form
  const [catFormName, setCatFormName] = useState('');
  const [catFormParent, setCatFormParent] = useState('');
  const [catFormImageUrl, setCatFormImageUrl] = useState('');
  const [catImageUploading, setCatImageUploading] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

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
        effects: Array.isArray(editingProduct.effects) ? editingProduct.effects : (editingProduct.effects as any)?.split(',').map((e:string) => e.trim()) || [],
        specs: Array.isArray(editingProduct.specs) ? editingProduct.specs : (editingProduct.specs as any)?.split(';;').map((s:string) => {
          const [title, content] = s.split('::');
          return { title, content };
        }) || [],
      } as any;

      // Remove legacy field if it still exists in state
      delete p.category;

      const { error } = await supabase.from('products').upsert([p]);
      if (error) throw error;
      toast.success("Produit sauvegardé");
      setIsEditing(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;

    try {
      toast.loading("Upload de l'image...", { id: "upload" });
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      setEditingProduct({ ...editingProduct, image: publicUrl });
      toast.success("Image uploadée", { id: "upload" });
    } catch (err: any) {
      toast.error(err.message || "Erreur upload", { id: "upload" });
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
     } catch (err: any) {
       toast.error(err.message);
     }
  };

  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;
    try {
      setCatImageUploading(true);
      toast.loading("Upload de l'image...", { id: "cat-upload" });
      const fileExt = file.name.split('.').pop();
      const fileName = `cat_${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);
      setCatFormImageUrl(publicUrl);
      toast.success("Image uploadée", { id: "cat-upload" });
    } catch (err: any) {
      toast.error(err.message || "Erreur upload", { id: "cat-upload" });
    } finally {
      setCatImageUploading(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return toast.error("Supabase requis");
    try {
      const parent = categories.find(c => c.id === catFormParent);
      const newLevel = parent ? parent.level + 1 : 1;
      
      if (editingCategoryId) {
         if (catFormParent === editingCategoryId) return toast.error("Une catégorie ne peut être son propre parent.");
         
         const children = categories.filter(c => c.parent_id === editingCategoryId);
         const grandchildren = categories.filter(c => children.some(child => child.id === c.parent_id));
         
         if (children.some(c => c.id === catFormParent) || grandchildren.some(c => c.id === catFormParent)) {
             return toast.error("Impossible de déplacer dans l'une de ses sous-catégories.");
         }
         
         const maxDepthAdded = grandchildren.length > 0 ? 2 : (children.length > 0 ? 1 : 0);
         if (newLevel + maxDepthAdded > 3) {
             return toast.error("Action impossible : le déplacement ferait dépasser la limite de 3 niveaux.");
         }
         
         const { error } = await supabase.from('categories').update({
             name: catFormName,
             parent_id: catFormParent || null,
             level: newLevel,
             image_url: catFormImageUrl || null,
         }).eq('id', editingCategoryId);
         
         if (error) throw error;
         
         const oldCategory = categories.find(c => c.id === editingCategoryId);
         if (oldCategory && oldCategory.level !== newLevel) {
            const levelDiff = newLevel - oldCategory.level;
            for (const child of children) {
               await supabase.from('categories').update({ level: child.level + levelDiff }).eq('id', child.id);
            }
            for (const gc of grandchildren) {
               await supabase.from('categories').update({ level: gc.level + levelDiff }).eq('id', gc.id);
            }
         }
         toast.success("Catégorie modifiée");
      } else {
         if (newLevel > 3) return toast.error("Maximum 3 niveaux de catégories");
         const { error } = await supabase.from('categories').insert([{
            id: `cat_${Date.now()}`,
            name: catFormName,
            parent_id: catFormParent || null,
            level: newLevel,
            image_url: catFormImageUrl || null,
         }]);
         if (error) throw error;
         toast.success("Catégorie ajoutée");
      }
      
      setCatFormName('');
      setCatFormParent('');
      setCatFormImageUrl('');
      setEditingCategoryId(null);
      useStore.getState().fetchCategories();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEditCategoryClick = (cat: any) => {
    setEditingCategoryId(cat.id);
    setCatFormName(cat.name);
    setCatFormParent(cat.parent_id || '');
    setCatFormImageUrl(cat.image_url || '');
  };

  const handleCancelCategoryEdit = () => {
    setCatFormName('');
    setCatFormParent('');
    setCatFormImageUrl('');
    setEditingCategoryId(null);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Supprimer cette catégorie ? (Les sous-catégories seront aussi supprimées)")) return;
    if (!supabase) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      toast.success("Catégorie supprimée");
      useStore.getState().fetchCategories();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

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
            { icon: Package, label: "Products" },
            { icon: LayoutDashboard, label: "Categories" },
            { icon: ShoppingCart, label: "Orders" },
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

        {activeTab === 'Overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {stats.map((stat, i) => (
                <div key={i} className="bg-transparent p-6 border border-ink/10">
                  <p className="text-ink/50 text-xs font-bold uppercase tracking-widest mb-2">{stat.label}</p>
                  <p className="text-3xl font-serif tracking-tight mb-2">{stat.value}</p>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 inline-block border ${
                    stat.change.startsWith('+') ? 'border-ink/20 text-ink bg-soft-green' : 'border-ink/10 text-ink/60'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              ))}
            </div>
            
          </>
        )}

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
                  <th className="px-6 py-3 font-bold tracking-widest">Catégorie</th>
                  <th className="px-6 py-3 font-bold tracking-widest">Prix</th>
                  <th className="px-6 py-3 font-bold tracking-widest">Stock</th>
                  <th className="px-6 py-3 font-bold tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-soft-green/30">
                    <td className="px-6 py-4">
                      <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-full" />
                    </td>
                    <td className="px-6 py-4 font-serif font-bold text-lg">{p.name}</td>
                    <td className="px-6 py-4 text-xs tracking-widest uppercase">{(p.categories || []).join(', ')}</td>
                    <td className="px-6 py-4 font-semibold">{p.price.toFixed(2)}€</td>
                    <td className="px-6 py-4">{p.stock} pcs</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                       <button onClick={() => { setEditingProduct(p); setIsEditing(true); }} className="p-2 border border-ink/10 hover:bg-ink hover:text-white transition-colors"><Edit2 className="w-4 h-4"/></button>
                       <button onClick={() => handleDeleteProduct(p.id)} className="p-2 border border-ink/10 text-red-600 hover:bg-red-60 transition-colors"><Trash2 className="w-4 h-4"/></button>
                    </td>
                  </tr>
                ))}
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
                  <label className="block text-xs uppercase tracking-widest font-bold mb-1 opacity-50">Prix (€)</label>
                  <input required type="number" step="0.01" value={editingProduct.price || ''} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} className="w-full border-b border-ink/20 py-2 focus:outline-none focus:border-ink bg-transparent" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold mb-1 opacity-50">Stock</label>
                  <input required type="number" value={editingProduct.stock || ''} onChange={e => setEditingProduct({...editingProduct, stock: Number(e.target.value)})} className="w-full border-b border-ink/20 py-2 focus:outline-none focus:border-ink bg-transparent" />
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
                  {((editingProduct.specs as any) || []).map((spec: any, idx: number) => (
                    <div key={idx} className="border border-ink/10 p-4 rounded">
                      <input
                        type="text"
                        placeholder="Titre"
                        value={spec.title || ''}
                        onChange={e => {
                          const newSpecs = [...(editingProduct.specs as any)];
                          newSpecs[idx] = { ...newSpecs[idx], title: e.target.value };
                          setEditingProduct({ ...editingProduct, specs: newSpecs });
                        }}
                        className="w-full mb-2 border-b border-ink/20 py-1 focus:outline-none"
                      />
                      <textarea
                        placeholder="Contenu"
                        value={spec.content || ''}
                        onChange={e => {
                          const newSpecs = [...(editingProduct.specs as any)];
                          newSpecs[idx] = { ...newSpecs[idx], content: e.target.value };
                          setEditingProduct({ ...editingProduct, specs: newSpecs });
                        }}
                        className="w-full border-b border-ink/20 py-1 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newSpecs = (editingProduct.specs as any).filter((_s: any, i: number) => i !== idx);
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
                      const newSpecs = [...(editingProduct.specs as any), { title: '', content: '' }];
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
                <input type="text" value={Array.isArray(editingProduct.effects) ? editingProduct.effects.join(', ') : editingProduct.effects || ''} onChange={e => setEditingProduct({...editingProduct, effects: e.target.value as any})} className="w-full border-b border-ink/20 py-2 focus:outline-none focus:border-ink bg-transparent" />
              </div>
              <div className="flex gap-4 mt-8 pt-4 border-t border-ink/10 text-xs font-bold uppercase tracking-widest">
                <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-4 border border-ink hover:bg-ink hover:text-white transition-colors">Annuler</button>
                <button type="submit" className="px-6 py-4 bg-ink text-white hover:bg-ink/90 transition-colors">Enregistrer</button>
              </div>
            </form>
          </div>
        )}
        {activeTab === 'Categories' && (
          <div className="bg-transparent border border-ink/10 p-8 max-w-2xl">
            <h2 className="text-2xl font-serif mb-6">Gestion des Catégories (3 Niveaux)</h2>
            <div className="space-y-4 text-sm mb-8">
              <p className="text-ink/60">Gérez l'arborescence des catégories de votre boutique de manière indépendante.</p>
              
              <ul className="space-y-2 mt-4 font-mono text-xs">
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
            
            <div className="bg-soft-green/10 p-6 border border-ink/10 mt-8">
              <h3 className="font-bold text-sm uppercase tracking-widest mb-4">
                {editingCategoryId ? 'Modifier la Catégorie' : 'Ajouter une Catégorie'}
              </h3>
              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold mb-1 opacity-50">Nom</label>
                  <input required type="text" value={catFormName} onChange={e => setCatFormName(e.target.value)} className="w-full border-b border-ink/20 py-2 focus:outline-none focus:border-ink bg-transparent" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold mb-1 opacity-50">Catégorie Parente (Optionnel)</label>
                  <select value={catFormParent} onChange={e => setCatFormParent(e.target.value)} className="w-full border-b border-ink/20 py-2 focus:outline-none focus:border-ink bg-transparent uppercase text-xs">
                    <option value="">Aucune (Niveau 1)</option>
                    {categories.filter(c => c.level < 3).map(c => (
                      <option key={c.id} value={c.id} disabled={editingCategoryId === c.id}>{c.name} (Niveau {c.level})</option>
                    ))}
                  </select>
                </div>
                {/* ── Image de la catégorie ── */}
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold mb-2 opacity-50">
                    Image de la catégorie (optionnel)
                  </label>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="URL de l'image..."
                        value={catFormImageUrl}
                        onChange={e => setCatFormImageUrl(e.target.value)}
                        className="w-full border-b border-ink/20 py-2 focus:outline-none focus:border-ink bg-transparent text-sm"
                      />
                    </div>
                    <label className={`cursor-pointer px-4 py-2 border border-ink/20 hover:bg-ink/5 transition-colors text-xs font-bold uppercase tracking-widest flex-shrink-0 flex items-center gap-1 ${catImageUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                      {catImageUploading ? 'Upload...' : 'Upload'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleCategoryImageUpload} disabled={catImageUploading} />
                    </label>
                  </div>
                  {catFormImageUrl && (
                    <div className="mt-3 flex items-center gap-3">
                      <img
                        src={catFormImageUrl}
                        alt="Aperçu"
                        className="w-16 h-16 object-cover rounded-xl border border-ink/10"
                      />
                      <button
                        type="button"
                        onClick={() => setCatFormImageUrl('')}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Supprimer l'image
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                   {editingCategoryId && (
                     <button type="button" onClick={handleCancelCategoryEdit} className="px-6 py-3 border border-ink text-ink hover:bg-ink hover:text-white transition-colors text-xs font-bold uppercase tracking-widest w-full">Annuler</button>
                   )}
                   <button type="submit" className="px-6 py-3 bg-ink text-white hover:bg-ink/90 transition-colors text-xs font-bold uppercase tracking-widest w-full">
                     {editingCategoryId ? 'Enregistrer' : 'Ajouter'}
                   </button>
                </div>
              </form>
            </div>

            <div className="p-4 bg-soft-green/20 border border-ink/10 text-xs text-ink/70 mt-8">
              <p className="font-bold mb-2">Note sur la base de données :</p>
              <p>Ouvrez l'interface DB Supabase et créez une table <code>categories</code> avec <code>id</code> (text), <code>name</code> (text), <code>parent_id</code> (text nullable), <code>level</code> (int). Les catégories s'afficheront ici automatiquement.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
