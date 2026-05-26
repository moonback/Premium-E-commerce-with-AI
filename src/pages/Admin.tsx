import React, { useState } from 'react';
import { Package, Users, ShoppingCart, BarChart3, Settings, DatabaseBackup, Plus, Trash2, Edit2, LayoutDashboard } from 'lucide-react';
import { useStore } from '../store';
import { Product } from '../types';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

export default function Admin() {
  const syncCatalogToDb = useStore((state) => state.syncCatalogToDb);
  const products = useStore((state) => state.products);
  const categories = useStore((state) => state.categories);
  const fetchProducts = useStore((state) => state.fetchProducts);
  const [activeTab, setActiveTab] = useState('Overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>({});
  
  // Category Form
  const [newCatName, setNewCatName] = useState('');
  const [newCatParent, setNewCatParent] = useState('');

  const stats = [
    { label: "Ventes du Jour", value: "0.00€", change: "0%" },
    { label: "Commandes Actives", value: "0", change: "0%" },
    { label: "Total Clients", value: "0", change: "0%" },
    { label: "Produits Catalogue", value: products.length.toString(), change: "Sync requis" }
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
      } as Product;

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

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return toast.error("Supabase requis");
    try {
      const parent = categories.find(c => c.id === newCatParent);
      const level = parent ? parent.level + 1 : 1;
      if (level > 3) return toast.error("Maximum 3 niveaux de catégories");
      
      const { error } = await supabase.from('categories').insert([{
         id: `cat_${Date.now()}`,
         name: newCatName,
         parent_id: newCatParent || null,
         level
      }]);
      if (error) throw error;
      toast.success("Catégorie ajoutée");
      setNewCatName('');
      setNewCatParent('');
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
            
            <div className="bg-transparent border border-ink/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-ink/10 bg-soft-green/30">
                <h2 className="font-serif">Recent Orders (Placeholder)</h2>
              </div>
              <div className="p-8 text-center text-ink/40 text-sm">
                 Activer la fonctionnalité checkout dans le panier pour voir les vraies commandes.
              </div>
            </div>
          </>
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
                    <td className="px-6 py-4 text-xs tracking-widest uppercase">{p.category}</td>
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
                <label className="block text-xs uppercase tracking-widest font-bold mb-1 opacity-50">Catégorie</label>
                 <select required value={editingProduct.category || ''} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} className="w-full border-b border-ink/20 py-2 focus:outline-none focus:border-ink bg-transparent uppercase text-xs">
                   <option value="">Sélectionner</option>
                   {categories.filter(c => c.level === 1).map(c1 => (
                     <optgroup key={c1.id} label={c1.name}>
                       {categories.filter(c => c.parent_id === c1.id).map(c2 => (
                         <React.Fragment key={c2.id}>
                           <option value={c2.name}>{c2.name}</option>
                           {categories.filter(c => c.parent_id === c2.id).map(c3 => (
                             <option key={c3.id} value={c3.name}>-- {c3.name}</option>
                           ))}
                         </React.Fragment>
                       ))}
                     </optgroup>
                   ))}
                   {/* Fallback old categories */}
                   <option value="Fruits">Fruits</option>
                   <option value="Gourmandise">Gourmandise</option>
                   <option value="Noix & Graines">Noix & Graines</option>
                 </select>
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
                     <div className="font-bold border-b border-ink/10 pb-1 mb-1">{c1.name} (Niv 1)</div>
                     <ul className="pl-4 space-y-1 mt-1">
                       {categories.filter(c => c.parent_id === c1.id).map(c2 => (
                         <li key={c2.id}>
                           L {c2.name} (Niv 2)
                           <ul className="pl-6 space-y-1 text-ink/60">
                             {categories.filter(c => c.parent_id === c2.id).map(c3 => (
                               <li key={c3.id}>-- {c3.name} (Niv 3)</li>
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
              <h3 className="font-bold text-sm uppercase tracking-widest mb-4">Ajouter une Catégorie</h3>
              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold mb-1 opacity-50">Nom</label>
                  <input required type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="w-full border-b border-ink/20 py-2 focus:outline-none focus:border-ink bg-transparent" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold mb-1 opacity-50">Catégorie Parente (Optionnel)</label>
                  <select value={newCatParent} onChange={e => setNewCatParent(e.target.value)} className="w-full border-b border-ink/20 py-2 focus:outline-none focus:border-ink bg-transparent uppercase text-xs">
                    <option value="">Aucune (Niveau 1)</option>
                    {categories.filter(c => c.level < 3).map(c => (
                      <option key={c.id} value={c.id}>{c.name} (Niveau {c.level})</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="px-6 py-3 bg-ink text-white hover:bg-ink/90 transition-colors text-xs font-bold uppercase tracking-widest w-full">Ajouter</button>
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
