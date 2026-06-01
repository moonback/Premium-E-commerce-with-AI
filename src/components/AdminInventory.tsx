import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertTriangle, Package, TrendingDown, RefreshCw, Plus, Minus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Product } from '../types';

type InventoryProduct = Product & {
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
};

export default function AdminInventory() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'low_stock' | 'out_of_stock'>('all');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('stock', { ascending: true });

      if (error) throw error;

      const productsWithStatus = data?.map(p => ({
        ...p,
        stock_status: p.stock === 0 ? 'out_of_stock' : p.stock < 10 ? 'low_stock' : 'in_stock'
      })) as InventoryProduct[];

      setProducts(productsWithStatus || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      toast.error('Erreur lors du chargement du stock');
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (productId: string, newStock: number) => {
    if (newStock < 0) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId);

      if (error) throw error;
      toast.success('Stock mis à jour');
      fetchInventory();
    } catch (err) {
      console.error('Error updating stock:', err);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const adjustStock = async (productId: string, currentStock: number, adjustment: number) => {
    await updateStock(productId, currentStock + adjustment);
  };

  const filteredProducts = products.filter(p => {
    if (filter === 'all') return true;
    return p.stock_status === filter;
  });

  const stats = {
    total: products.length,
    lowStock: products.filter(p => p.stock_status === 'low_stock').length,
    outOfStock: products.filter(p => p.stock_status === 'out_of_stock').length,
    totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0),
  };

  if (loading) {
    return <div className="p-8 text-center text-ink/50">Chargement du stock...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-transparent p-4 border border-ink/10">
          <p className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-1">Total Produits</p>
          <p className="text-2xl font-serif">{stats.total}</p>
        </div>
        <div className="bg-transparent p-4 border border-orange-200 bg-orange-50">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-1">Stock Faible</p>
          <p className="text-2xl font-serif text-orange-600">{stats.lowStock}</p>
        </div>
        <div className="bg-transparent p-4 border border-red-200 bg-red-50">
          <p className="text-xs font-bold uppercase tracking-widest text-red-600 mb-1">Rupture</p>
          <p className="text-2xl font-serif text-red-600">{stats.outOfStock}</p>
        </div>
        <div className="bg-transparent p-4 border border-ink/10">
          <p className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-1">Valeur Stock</p>
          <p className="text-2xl font-serif">{stats.totalValue.toFixed(2)}€</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-widest ${
            filter === 'all' ? 'bg-ink text-white' : 'bg-transparent border border-ink/10 text-ink/60'
          }`}
        >
          Tous
        </button>
        <button
          onClick={() => setFilter('low_stock')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-widest ${
            filter === 'low_stock' ? 'bg-orange-500 text-white' : 'bg-transparent border border-orange-200 text-orange-600'
          }`}
        >
          Stock Faible
        </button>
        <button
          onClick={() => setFilter('out_of_stock')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-widest ${
            filter === 'out_of_stock' ? 'bg-red-500 text-white' : 'bg-transparent border border-red-200 text-red-600'
          }`}
        >
          Rupture
        </button>
        <button
          onClick={fetchInventory}
          className="ml-auto px-4 py-2 text-xs font-bold uppercase tracking-widest bg-transparent border border-ink/10 text-ink/60 hover:bg-soft-green flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-transparent border border-ink/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-soft-green/10 text-ink/50 uppercase text-xs">
            <tr>
              <th className="px-6 py-3 text-left font-bold tracking-widest">Produit</th>
              <th className="px-6 py-3 text-left font-bold tracking-widest">Prix</th>
              <th className="px-6 py-3 text-left font-bold tracking-widest">Stock</th>
              <th className="px-6 py-3 text-left font-bold tracking-widest">Statut</th>
              <th className="px-6 py-3 text-left font-bold tracking-widest">Valeur</th>
              <th className="px-6 py-3 text-right font-bold tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-ink/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {product.image && (
                      <img src={product.image} alt={product.name} className="w-12 h-12 object-cover" />
                    )}
                    <div>
                      <p className="font-bold">{product.name}</p>
                      <p className="text-xs text-ink/60">ID: {product.id.slice(0, 8)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-serif">{product.price.toFixed(2)}€</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-ink/40" />
                    <span className="font-bold text-lg">{product.stock}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {product.stock_status === 'out_of_stock' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-bold uppercase tracking-widest border border-red-200">
                      <AlertTriangle className="w-3 h-3" />
                      Rupture
                    </span>
                  )}
                  {product.stock_status === 'low_stock' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-bold uppercase tracking-widest border border-orange-200">
                      <TrendingDown className="w-3 h-3" />
                      Faible
                    </span>
                  )}
                  {product.stock_status === 'in_stock' && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold uppercase tracking-widest border border-green-200">
                      En Stock
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 font-serif">
                  {(product.price * product.stock).toFixed(2)}€
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => adjustStock(product.id, product.stock, -1)}
                      className="p-2 hover:bg-red-50 transition-colors"
                      title="Retirer 1"
                    >
                      <Minus className="w-4 h-4 text-red-600" />
                    </button>
                    <input
                      type="number"
                      value={product.stock}
                      onChange={(e) => updateStock(product.id, parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 text-center border border-ink/10 focus:border-ink/30 focus:outline-none"
                    />
                    <button
                      onClick={() => adjustStock(product.id, product.stock, 1)}
                      className="p-2 hover:bg-green-50 transition-colors"
                      title="Ajouter 1"
                    >
                      <Plus className="w-4 h-4 text-green-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
