import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Upload, X } from 'lucide-react';
import { Product, Category, Spec } from '../../types';
import SEOFields from '../SEOFields';
import ProductBadgesManager from '../ProductBadgesManager';
import ProductPromotionManager from '../ProductPromotionManager';

type EditableProduct = Partial<Omit<Product, 'effects' | 'specs'>> & {
  effects?: string[] | string;
  specs?: Spec[] | string;
  category?: string;
};

interface ProductFormProps {
  product: EditableProduct;
  categories: Category[];
  onSave: (product: EditableProduct) => void;
  onCancel: () => void;
  onImageUpload: (file: File) => void;
}

export default function ProductForm({ 
  product, 
  categories, 
  onSave, 
  onCancel, 
  onImageUpload 
}: ProductFormProps) {
  const [editingProduct, setEditingProduct] = useState<EditableProduct>(product);
  const [showSEO, setShowSEO] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [showPromotion, setShowPromotion] = useState(false);

  const editingSpecs = Array.isArray(editingProduct.specs) ? editingProduct.specs : [];
  const editingEffectsValue = Array.isArray(editingProduct.effects)
    ? editingProduct.effects.join(', ')
    : editingProduct.effects || '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editingProduct);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImageUpload(file);
  };

  return (
    <div className="bg-white border border-ink/10 rounded-xl p-8 shadow-lg max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-serif font-light text-ink mb-2">
          {editingProduct.id ? 'Modifier le Produit' : 'Nouveau Produit'}
        </h2>
        <p className="text-ink/60">Remplissez les informations du produit ci-dessous</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informations de base */}
        <section className="space-y-6">
          <h3 className="text-lg font-bold text-ink uppercase tracking-widest border-b border-ink/10 pb-2">
            Informations de base
          </h3>
          
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold mb-2 text-ink/70">
              Nom du produit *
            </label>
            <input
              required
              type="text"
              value={editingProduct.name || ''}
              onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
              className="w-full border border-ink/20 rounded-lg px-4 py-3 focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/20 bg-white transition-all"
              placeholder="Ex: Huile de CBD Premium"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest font-bold mb-2 text-ink/70">
              Description *
            </label>
            <textarea
              required
              value={editingProduct.description || ''}
              onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
              className="w-full border border-ink/20 rounded-lg px-4 py-3 focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/20 bg-white transition-all min-h-[120px] resize-y"
              placeholder="Description détaillée du produit..."
            />
          </div>
        </section>

        {/* Prix et Stock */}
        <section className="space-y-6">
          <h3 className="text-lg font-bold text-ink uppercase tracking-widest border-b border-ink/10 pb-2">
            Prix et Stock
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold mb-2 text-ink/70">
                Prix de vente (€) *
              </label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={editingProduct.price || ''}
                onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
                className="w-full border border-ink/20 rounded-lg px-4 py-3 focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/20 bg-white transition-all"
              />
            </div>
            
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold mb-2 text-ink/70">
                Prix d'achat (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editingProduct.purchase_price || ''}
                onChange={e => setEditingProduct({...editingProduct, purchase_price: e.target.value ? Number(e.target.value) : undefined})}
                className="w-full border border-ink/20 rounded-lg px-4 py-3 focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/20 bg-white transition-all"
                placeholder="Optionnel"
              />
            </div>
            
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold mb-2 text-ink/70">
                Stock *
              </label>
              <input
                required
                type="number"
                min="0"
                value={editingProduct.stock || ''}
                onChange={e => setEditingProduct({...editingProduct, stock: Number(e.target.value)})}
                className="w-full border border-ink/20 rounded-lg px-4 py-3 focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/20 bg-white transition-all"
              />
            </div>
          </div>

          {/* Produit en lot */}
          <div className="bg-soft-green/10 rounded-lg p-4 border border-soft-green/30">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={editingProduct.is_batch_product || false}
                onChange={e => setEditingProduct({
                  ...editingProduct, 
                  is_batch_product: e.target.checked,
                  batch_size: e.target.checked ? (editingProduct.batch_size || 1) : undefined,
                  batch_unit: e.target.checked ? (editingProduct.batch_unit || 'pièces') : undefined
                })}
                className="w-5 h-5 accent-ink"
              />
              <span className="text-sm font-bold text-ink">Ce produit est vendu en lot</span>
            </label>
            
            {editingProduct.is_batch_product && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold mb-2 text-ink/70">
                    Quantité par lot
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingProduct.batch_size || 1}
                    onChange={e => setEditingProduct({...editingProduct, batch_size: Number(e.target.value)})}
                    className="w-full border border-ink/20 rounded-lg px-4 py-3 focus:outline-none focus:border-ink bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold mb-2 text-ink/70">
                    Unité
                  </label>
                  <input
                    type="text"
                    value={editingProduct.batch_unit || 'pièces'}
                    onChange={e => setEditingProduct({...editingProduct, batch_unit: e.target.value})}
                    className="w-full border border-ink/20 rounded-lg px-4 py-3 focus:outline-none focus:border-ink bg-white"
                    placeholder="Ex: pièces, grammes, ml"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Image */}
        <section className="space-y-6">
          <h3 className="text-lg font-bold text-ink uppercase tracking-widest border-b border-ink/10 pb-2">
            Image du produit
          </h3>
          
          <div className="flex gap-6 items-start">
            <div className="flex-1">
              <label className="block text-xs uppercase tracking-widest font-bold mb-2 text-ink/70">
                URL de l'image *
              </label>
              <input
                required
                type="text"
                placeholder="https://..."
                value={editingProduct.image || ''}
                onChange={e => setEditingProduct({...editingProduct, image: e.target.value})}
                className="w-full border border-ink/20 rounded-lg px-4 py-3 focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/20 bg-white transition-all"
              />
            </div>
            
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold mb-2 text-ink/70">
                Ou uploader
              </label>
              <label className="cursor-pointer px-6 py-3 border-2 border-dashed border-ink/20 hover:border-ink/40 rounded-lg transition-all flex items-center gap-2 text-sm font-bold text-ink/70 hover:text-ink bg-white">
                <Upload className="w-4 h-4" />
                Choisir
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          </div>
          
          {editingProduct.image && (
            <div className="relative inline-block">
              <img
                src={editingProduct.image}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-lg border-2 border-ink/10 shadow-md"
              />
              <button
                type="button"
                onClick={() => setEditingProduct({...editingProduct, image: ''})}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>

        {/* Catégories */}
        <section className="space-y-6">
          <h3 className="text-lg font-bold text-ink uppercase tracking-widest border-b border-ink/10 pb-2">
            Catégories
          </h3>
          
          <div className="border border-ink/10 rounded-lg p-4 max-h-64 overflow-y-auto bg-white">
            {categories.filter(c => c.level === 1).map(c1 => (
              <div key={c1.id} className="mb-4">
                <label className="flex items-center gap-3 text-sm font-bold cursor-pointer hover:bg-soft-green/10 p-2 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={(editingProduct.categories || []).includes(c1.name)}
                    onChange={(e) => {
                      const cats = editingProduct.categories || [];
                      if (e.target.checked) {
                        setEditingProduct({...editingProduct, categories: [...cats, c1.name]});
                      } else {
                        setEditingProduct({...editingProduct, categories: cats.filter(c => c !== c1.name)});
                      }
                    }}
                    className="w-4 h-4 accent-ink"
                  />
                  {c1.name}
                </label>
                
                <div className="pl-8 space-y-1 mt-1">
                  {categories.filter(c => c.parent_id === c1.id).map(c2 => (
                    <div key={c2.id}>
                      <label className="flex items-center gap-3 text-sm cursor-pointer hover:bg-soft-green/10 p-2 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={(editingProduct.categories || []).includes(c2.name)}
                          onChange={(e) => {
                            const cats = editingProduct.categories || [];
                            if (e.target.checked) {
                              setEditingProduct({...editingProduct, categories: [...cats, c2.name]});
                            } else {
                              setEditingProduct({...editingProduct, categories: cats.filter(c => c !== c2.name)});
                            }
                          }}
                          className="w-4 h-4 accent-ink"
                        />
                        {c2.name}
                      </label>
                      
                      <div className="pl-8 space-y-1">
                        {categories.filter(c => c.parent_id === c2.id).map(c3 => (
                          <label key={c3.id} className="flex items-center gap-3 text-sm text-ink/70 cursor-pointer hover:bg-soft-green/10 p-2 rounded transition-colors">
                            <input
                              type="checkbox"
                              checked={(editingProduct.categories || []).includes(c3.name)}
                              onChange={(e) => {
                                const cats = editingProduct.categories || [];
                                if (e.target.checked) {
                                  setEditingProduct({...editingProduct, categories: [...cats, c3.name]});
                                } else {
                                  setEditingProduct({...editingProduct, categories: cats.filter(c => c !== c3.name)});
                                }
                              }}
                              className="w-4 h-4 accent-ink"
                            />
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
        </section>

        {/* Effets */}
        <section className="space-y-6">
          <h3 className="text-lg font-bold text-ink uppercase tracking-widest border-b border-ink/10 pb-2">
            Effets
          </h3>
          
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold mb-2 text-ink/70">
              Effets (séparés par virgule)
            </label>
            <input
              type="text"
              value={editingEffectsValue}
              onChange={e => setEditingProduct({...editingProduct, effects: e.target.value})}
              className="w-full border border-ink/20 rounded-lg px-4 py-3 focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/20 bg-white transition-all"
              placeholder="Ex: Relaxant, Anti-stress, Sommeil"
            />
          </div>
        </section>

        {/* Spécifications */}
        <section className="space-y-6">
          <h3 className="text-lg font-bold text-ink uppercase tracking-widest border-b border-ink/10 pb-2">
            Spécifications (Accordéons)
          </h3>
          
          <div className="space-y-4">
            {editingSpecs.map((spec, idx) => (
              <div key={idx} className="border border-ink/10 rounded-lg p-4 bg-white">
                <input
                  type="text"
                  placeholder="Titre de la spécification"
                  value={spec.title || ''}
                  onChange={e => {
                    const newSpecs = [...editingSpecs];
                    newSpecs[idx] = { ...newSpecs[idx], title: e.target.value };
                    setEditingProduct({ ...editingProduct, specs: newSpecs });
                  }}
                  className="w-full mb-3 border border-ink/20 rounded-lg px-4 py-2 focus:outline-none focus:border-ink"
                />
                <textarea
                  placeholder="Contenu de la spécification"
                  value={spec.content || ''}
                  onChange={e => {
                    const newSpecs = [...editingSpecs];
                    newSpecs[idx] = { ...newSpecs[idx], content: e.target.value };
                    setEditingProduct({ ...editingProduct, specs: newSpecs });
                  }}
                  className="w-full border border-ink/20 rounded-lg px-4 py-2 focus:outline-none focus:border-ink min-h-[80px]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newSpecs = editingSpecs.filter((_s, i) => i !== idx);
                    setEditingProduct({ ...editingProduct, specs: newSpecs });
                  }}
                  className="mt-3 text-xs text-red-600 hover:text-red-800 font-bold uppercase tracking-widest"
                >
                  Supprimer cette spécification
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={() => {
                const newSpecs = [...editingSpecs, { title: '', content: '' }];
                setEditingProduct({ ...editingProduct, specs: newSpecs });
              }}
              className="w-full px-6 py-4 border-2 border-dashed border-ink/20 hover:border-ink/40 rounded-lg transition-all text-sm font-bold text-ink/70 hover:text-ink"
            >
              + Ajouter une spécification
            </button>
          </div>
        </section>

        {/* SEO */}
        <section>
          <button
            type="button"
            onClick={() => setShowSEO(!showSEO)}
            className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-soft-green/20 to-soft-green/10 hover:from-soft-green/30 hover:to-soft-green/20 transition-all rounded-lg border border-soft-green/30"
          >
            <span className="text-sm font-bold uppercase tracking-widest text-ink">
              Optimisation SEO (Optionnel)
            </span>
            {showSEO ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {showSEO && (
            <div className="mt-4 p-6 border border-ink/10 rounded-lg bg-white">
              <SEOFields
                seo={editingProduct.seo || {}}
                onChange={(seo) => setEditingProduct({...editingProduct, seo})}
              />
            </div>
          )}
        </section>

        {/* Badges */}
        <section>
          <button
            type="button"
            onClick={() => setShowBadges(!showBadges)}
            className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-soft-green/20 to-soft-green/10 hover:from-soft-green/30 hover:to-soft-green/20 transition-all rounded-lg border border-soft-green/30"
          >
            <span className="text-sm font-bold uppercase tracking-widest text-ink">
              Badges Produit (Optionnel)
            </span>
            {showBadges ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {showBadges && (
            <div className="mt-4 p-6 border border-ink/10 rounded-lg bg-white">
              <ProductBadgesManager
                badges={editingProduct.badges || []}
                onChange={(badges) => setEditingProduct({...editingProduct, badges})}
              />
            </div>
          )}
        </section>

        {/* Promotion */}
        <section>
          <button
            type="button"
            onClick={() => setShowPromotion(!showPromotion)}
            className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-soft-green/20 to-soft-green/10 hover:from-soft-green/30 hover:to-soft-green/20 transition-all rounded-lg border border-soft-green/30"
          >
            <span className="text-sm font-bold uppercase tracking-widest text-ink">
              Prix Promotionnel (Optionnel)
            </span>
            {showPromotion ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {showPromotion && (
            <div className="mt-4 p-6 border border-ink/10 rounded-lg bg-white">
              <ProductPromotionManager
                promotion={editingProduct.promotion}
                originalPrice={editingProduct.price || 0}
                onChange={(promotion) => setEditingProduct({...editingProduct, promotion})}
              />
            </div>
          )}
        </section>

        {/* Actions */}
        <div className="flex gap-4 pt-6 border-t border-ink/10">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-8 py-4 border-2 border-ink/20 hover:border-ink hover:bg-ink/5 transition-all text-sm font-bold uppercase tracking-widest text-ink rounded-lg"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="flex-1 px-8 py-4 bg-ink text-white hover:bg-ink/90 transition-all text-sm font-bold uppercase tracking-widest rounded-lg shadow-lg hover:shadow-xl"
          >
            Enregistrer le produit
          </button>
        </div>
      </form>
    </div>
  );
}
