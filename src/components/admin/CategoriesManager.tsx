import React from 'react';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { Category } from '../../types';

interface CategoriesManagerProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export default function CategoriesManager({ 
  categories, 
  onEdit, 
  onDelete, 
  onAdd 
}: CategoriesManagerProps) {
  return (
    <div className="bg-white border border-ink/10 rounded-xl p-8 shadow-sm max-w-5xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-3xl font-serif font-light text-ink mb-2">
            Gestion des Catégories
          </h2>
          <p className="text-ink/60">
            Gérez l'arborescence des catégories de votre boutique (3 niveaux maximum)
          </p>
        </div>
        <button
          onClick={onAdd}
          className="px-6 py-4 bg-ink text-white font-bold text-xs uppercase tracking-widest hover:bg-ink/90 transition-all rounded-lg shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouvelle Catégorie
        </button>
      </div>

      <div className="space-y-3">
        {categories.filter(c => c.level === 1).map(c1 => (
          <div key={c1.id} className="border border-ink/10 rounded-lg overflow-hidden">
            {/* Niveau 1 */}
            <div className="bg-gradient-to-r from-soft-green/30 to-soft-green/10 p-4 flex items-center gap-4">
              {c1.image_url ? (
                <img
                  src={c1.image_url}
                  alt={c1.name}
                  className="w-12 h-12 rounded-lg object-cover border border-ink/10 shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-ink/10 flex items-center justify-center text-2xl">
                  📁
                </div>
              )}
              
              <div className="flex-1">
                <h3 className="font-bold text-lg text-ink">{c1.name}</h3>
                <p className="text-xs text-ink/50 uppercase tracking-widest">Niveau 1</p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(c1)}
                  className="p-2 rounded-lg border border-ink/10 hover:bg-ink hover:text-white transition-all"
                  title="Modifier"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(c1.id)}
                  className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Niveau 2 */}
            {categories.filter(c => c.parent_id === c1.id).length > 0 && (
              <div className="bg-white p-4 pl-8 space-y-2">
                {categories.filter(c => c.parent_id === c1.id).map(c2 => (
                  <div key={c2.id}>
                    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-soft-green/10 transition-colors">
                      {c2.image_url ? (
                        <img
                          src={c2.image_url}
                          alt={c2.name}
                          className="w-10 h-10 rounded-lg object-cover border border-ink/10"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-ink/5 flex items-center justify-center text-xl">
                          📂
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <h4 className="font-semibold text-ink">↳ {c2.name}</h4>
                        <p className="text-xs text-ink/50 uppercase tracking-widest">Niveau 2</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => onEdit(c2)}
                          className="p-2 rounded-lg border border-ink/10 hover:bg-ink hover:text-white transition-all"
                          title="Modifier"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onDelete(c2.id)}
                          className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Niveau 3 */}
                    {categories.filter(c => c.parent_id === c2.id).length > 0 && (
                      <div className="pl-12 space-y-1 mt-2">
                        {categories.filter(c => c.parent_id === c2.id).map(c3 => (
                          <div
                            key={c3.id}
                            className="flex items-center gap-4 p-2 rounded-lg hover:bg-soft-green/10 transition-colors"
                          >
                            {c3.image_url ? (
                              <img
                                src={c3.image_url}
                                alt={c3.name}
                                className="w-8 h-8 rounded object-cover border border-ink/10"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded bg-ink/5 flex items-center justify-center text-sm">
                                📄
                              </div>
                            )}
                            
                            <div className="flex-1">
                              <h5 className="text-sm text-ink/80">-- {c3.name}</h5>
                              <p className="text-xs text-ink/40 uppercase tracking-widest">Niveau 3</p>
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => onEdit(c3)}
                                className="p-1.5 rounded border border-ink/10 hover:bg-ink hover:text-white transition-all"
                                title="Modifier"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => onDelete(c3.id)}
                                className="p-1.5 rounded border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {categories.filter(c => c.level === 1).length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-ink/10 rounded-lg">
          <div className="text-6xl mb-4">📁</div>
          <p className="text-ink/60 text-lg mb-2">Aucune catégorie créée</p>
          <p className="text-ink/40 text-sm">Cliquez sur "Nouvelle Catégorie" pour commencer</p>
        </div>
      )}

      <div className="mt-8 p-6 bg-soft-green/10 border border-soft-green/30 rounded-lg">
        <h4 className="font-bold text-sm text-ink mb-2 uppercase tracking-widest">
          💡 Note importante
        </h4>
        <p className="text-sm text-ink/70 leading-relaxed">
          Les catégories sont organisées sur 3 niveaux maximum. Assurez-vous que votre table 
          <code className="mx-1 px-2 py-0.5 bg-white rounded text-xs font-mono">categories</code> 
          dans Supabase contient les colonnes : 
          <code className="mx-1 px-2 py-0.5 bg-white rounded text-xs font-mono">id</code>, 
          <code className="mx-1 px-2 py-0.5 bg-white rounded text-xs font-mono">name</code>, 
          <code className="mx-1 px-2 py-0.5 bg-white rounded text-xs font-mono">parent_id</code>, 
          <code className="mx-1 px-2 py-0.5 bg-white rounded text-xs font-mono">level</code>, 
          <code className="mx-1 px-2 py-0.5 bg-white rounded text-xs font-mono">image_url</code>.
        </p>
      </div>
    </div>
  );
}
