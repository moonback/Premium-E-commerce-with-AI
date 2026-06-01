import React, { useState, useEffect } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { Category } from '../types';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../lib/errors';
import { useStore } from '../store';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory?: Category | null;
  categories: Category[];
}

export default function CategoryModal({ isOpen, onClose, editingCategory, categories }: CategoryModalProps) {
  const [catFormName, setCatFormName] = useState('');
  const [catFormParent, setCatFormParent] = useState('');
  const [catFormImageUrl, setCatFormImageUrl] = useState('');
  const [catImageUploading, setCatImageUploading] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editingCategory) {
      setCatFormName(editingCategory.name);
      setCatFormParent(editingCategory.parent_id || '');
      setCatFormImageUrl(editingCategory.image_url || '');
    } else {
      // Reset form when adding new
      setCatFormName('');
      setCatFormParent('');
      setCatFormImageUrl('');
    }
  }, [editingCategory, isOpen]);

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
    } catch (err) {
      toast.error(getErrorMessage(err, "Erreur upload"), { id: "cat-upload" });
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
      
      if (editingCategory) {
         if (catFormParent === editingCategory.id) return toast.error("Une catégorie ne peut être son propre parent.");
         
         const children = categories.filter(c => c.parent_id === editingCategory.id);
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
         }).eq('id', editingCategory.id);
         
         if (error) throw error;
         
         const oldCategory = categories.find(c => c.id === editingCategory.id);
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
      
      // Refresh categories
      useStore.getState().fetchCategories();
      
      // Close modal and reset form
      onClose();
      setCatFormName('');
      setCatFormParent('');
      setCatFormImageUrl('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-bg border border-ink/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-bg border-b border-ink/10 px-8 py-6 flex justify-between items-center">
          <h2 className="text-2xl font-serif">
            {editingCategory ? 'Modifier la Catégorie' : 'Ajouter une Catégorie'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-ink/5 transition-colors rounded-full"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSaveCategory} className="p-8 space-y-6">
          {/* Nom */}
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold mb-2 opacity-50">
              Nom de la catégorie *
            </label>
            <input
              required
              type="text"
              value={catFormName}
              onChange={e => setCatFormName(e.target.value)}
              className="w-full border-b border-ink/20 py-3 focus:outline-none focus:border-ink bg-transparent text-lg"
              placeholder="Ex: Électronique, Vêtements..."
              autoFocus
            />
          </div>

          {/* Catégorie Parente */}
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold mb-2 opacity-50">
              Catégorie Parente (Optionnel)
            </label>
            <select
              value={catFormParent}
              onChange={e => setCatFormParent(e.target.value)}
              className="w-full border-b border-ink/20 py-3 focus:outline-none focus:border-ink bg-transparent uppercase text-xs"
            >
              <option value="">Aucune (Niveau 1)</option>
              {categories.filter(c => c.level < 3).map(c => (
                <option
                  key={c.id}
                  value={c.id}
                  disabled={editingCategory?.id === c.id}
                >
                  {c.name} (Niveau {c.level})
                </option>
              ))}
            </select>
            <p className="text-xs text-ink/50 mt-2">
              Sélectionnez une catégorie parente pour créer une sous-catégorie (max 3 niveaux)
            </p>
          </div>

          {/* Image de la catégorie */}
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
              <label
                className={`cursor-pointer px-4 py-2 border border-ink/20 hover:bg-ink/5 transition-colors text-xs font-bold uppercase tracking-widest flex-shrink-0 flex items-center gap-2 ${
                  catImageUploading ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                {catImageUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Upload...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCategoryImageUpload}
                  disabled={catImageUploading}
                />
              </label>
            </div>
            {catFormImageUrl && (
              <div className="mt-4 flex items-center gap-4 p-4 bg-soft-green/10 border border-ink/10 rounded-lg">
                <img
                  src={catFormImageUrl}
                  alt="Aperçu"
                  className="w-20 h-20 object-cover rounded-xl border border-ink/10"
                />
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-1">
                    Aperçu de l'image
                  </p>
                  <p className="text-xs text-ink/60 truncate">{catFormImageUrl}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCatFormImageUrl('')}
                  className="text-xs text-red-500 hover:underline font-bold uppercase tracking-widest"
                >
                  Supprimer
                </button>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="p-4 bg-soft-green/20 border border-ink/10 text-xs text-ink/70 rounded-lg">
            <p className="font-bold mb-2">💡 Conseils :</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Les catégories de niveau 1 apparaissent dans le menu principal</li>
              <li>Vous pouvez créer jusqu'à 3 niveaux de catégories</li>
              <li>L'image est optionnelle mais recommandée pour une meilleure présentation</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-ink/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 border border-ink text-ink hover:bg-ink hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-4 bg-ink text-white hover:bg-ink/90 transition-colors text-xs font-bold uppercase tracking-widest"
            >
              {editingCategory ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
