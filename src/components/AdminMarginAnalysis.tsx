import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { TrendingUp, TrendingDown, DollarSign, Package } from 'lucide-react';

interface MarginStats {
  averageMargin: number;
  totalPotentialProfit: number;
  productsWithMargin: number;
  lowMarginProducts: number;
}

export default function AdminMarginAnalysis() {
  const products = useStore((state) => state.products);
  const [stats, setStats] = useState<MarginStats>({
    averageMargin: 0,
    totalPotentialProfit: 0,
    productsWithMargin: 0,
    lowMarginProducts: 0,
  });

  useEffect(() => {
    const productsWithPurchasePrice = products.filter(p => p.purchase_price && p.purchase_price > 0);
    
    if (productsWithPurchasePrice.length === 0) {
      setStats({
        averageMargin: 0,
        totalPotentialProfit: 0,
        productsWithMargin: 0,
        lowMarginProducts: 0,
      });
      return;
    }

    const margins = productsWithPurchasePrice.map(p => {
      const margin = ((p.price - p.purchase_price!) / p.price) * 100;
      const profit = (p.price - p.purchase_price!) * p.stock;
      return { margin, profit };
    });

    const avgMargin = margins.reduce((sum, m) => sum + m.margin, 0) / margins.length;
    const totalProfit = margins.reduce((sum, m) => sum + m.profit, 0);
    const lowMargin = margins.filter(m => m.margin < 20).length;

    setStats({
      averageMargin: avgMargin,
      totalPotentialProfit: totalProfit,
      productsWithMargin: productsWithPurchasePrice.length,
      lowMarginProducts: lowMargin,
    });
  }, [products]);

  const productsWithMargins = products
    .filter(p => p.purchase_price && p.purchase_price > 0)
    .map(p => ({
      ...p,
      margin: ((p.price - p.purchase_price!) / p.price) * 100,
      profit: (p.price - p.purchase_price!) * p.stock,
    }))
    .sort((a, b) => a.margin - b.margin);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-ink/10 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-widest text-ink/60 font-bold">Marge Moyenne</span>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-serif font-bold text-ink">
            {stats.averageMargin.toFixed(1)}%
          </div>
        </div>

        <div className="bg-white border border-ink/10 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-widest text-ink/60 font-bold">Profit Potentiel</span>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-serif font-bold text-ink">
            {stats.totalPotentialProfit.toFixed(0)}€
          </div>
          <div className="text-xs text-ink/60 mt-1">Sur stock actuel</div>
        </div>

        <div className="bg-white border border-ink/10 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-widest text-ink/60 font-bold">Produits Suivis</span>
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-serif font-bold text-ink">
            {stats.productsWithMargin}
          </div>
          <div className="text-xs text-ink/60 mt-1">Sur {products.length} total</div>
        </div>

        <div className="bg-white border border-ink/10 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-widest text-ink/60 font-bold">Marge Faible</span>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-3xl font-serif font-bold text-ink">
            {stats.lowMarginProducts}
          </div>
          <div className="text-xs text-ink/60 mt-1">Moins de 20%</div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-ink/10 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-ink/10">
          <h3 className="text-xl font-serif font-bold">Analyse des Marges par Produit</h3>
          <p className="text-sm text-ink/60 mt-1">
            Produits triés par marge croissante (les moins rentables en premier)
          </p>
        </div>
        
        {productsWithMargins.length === 0 ? (
          <div className="p-8 text-center text-ink/60">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm">Aucun produit avec prix d'achat configuré</p>
            <p className="text-xs mt-2">Ajoutez des prix d'achat pour voir l'analyse des marges</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-soft-green/20 text-ink/50 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 text-left font-bold tracking-widest">Produit</th>
                  <th className="px-6 py-3 text-right font-bold tracking-widest">Prix Achat</th>
                  <th className="px-6 py-3 text-right font-bold tracking-widest">Prix Vente</th>
                  <th className="px-6 py-3 text-right font-bold tracking-widest">Marge %</th>
                  <th className="px-6 py-3 text-right font-bold tracking-widest">Marge €</th>
                  <th className="px-6 py-3 text-right font-bold tracking-widest">Stock</th>
                  <th className="px-6 py-3 text-right font-bold tracking-widest">Profit Potentiel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {productsWithMargins.map((p) => (
                  <tr key={p.id} className="hover:bg-soft-green/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-full" />
                        <div>
                          <div className="font-serif font-bold">{p.name}</div>
                          {p.is_batch_product && (
                            <div className="text-xs text-ink/60">
                              📦 Lot de {p.batch_size} {p.batch_unit}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-ink/60">
                      {p.purchase_price?.toFixed(2)}€
                    </td>
                    <td className="px-6 py-4 text-right font-semibold">
                      {p.price.toFixed(2)}€
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${
                        p.margin > 40 ? 'text-green-600' : 
                        p.margin > 25 ? 'text-emerald-600' : 
                        p.margin > 15 ? 'text-yellow-600' : 
                        'text-red-600'
                      }`}>
                        {p.margin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold">
                      {(p.price - p.purchase_price!).toFixed(2)}€
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.stock} {p.is_batch_product ? 'lots' : 'pcs'}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-700">
                      {p.profit.toFixed(2)}€
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {stats.lowMarginProducts > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <TrendingDown className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-yellow-900 mb-2">Recommandations</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• {stats.lowMarginProducts} produit(s) ont une marge inférieure à 20%</li>
                <li>• Considérez augmenter les prix ou négocier avec les fournisseurs</li>
                <li>• Analysez si ces produits sont des produits d'appel stratégiques</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
