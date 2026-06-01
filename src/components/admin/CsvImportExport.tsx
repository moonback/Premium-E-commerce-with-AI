// src/components/admin/CsvImportExport.tsx
// Panneau d'import / export CSV pour produits et catégories
import React, { useState, useRef } from 'react';
import {
  Download, Upload, FileText, AlertCircle,
  CheckCircle, Loader2, ChevronDown, ChevronUp, X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store';
import toast from 'react-hot-toast';
import {
  exportProductsToCSV,
  exportCategoriesToCSV,
  importProductsFromCSV,
  importCategoriesFromCSV,
  downloadCSV,
  type ImportResult,
} from '../../lib/csvService';
import type { Product, Category } from '../../types';

// ── Types ─────────────────────────────────────────────────────────────────────
type Mode = 'products' | 'categories';

interface ImportState {
  status: 'idle' | 'preview' | 'importing' | 'done' | 'error';
  result: ImportResult<Partial<Product>> | ImportResult<Partial<Category>> | null;
  fileName: string;
  rowCount: number;
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function CsvImportExport() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mode, setMode] = useState<Mode>('products');
  const [importState, setImportState] = useState<ImportState>({
    status: 'idle', result: null, fileName: '', rowCount: 0,
  });
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const products = useStore(s => s.products);
  const categories = useStore(s => s.categories);
  const fetchProducts = useStore(s => s.fetchProducts);
  const fetchCategories = useStore(s => s.fetchCategories);

  // ── Export ──────────────────────────────────────────────────────────────────
  const handleExport = () => {
    setIsExporting(true);
    try {
      if (mode === 'products') {
        const csv = exportProductsToCSV(products);
        downloadCSV(csv, `veridian_produits_${new Date().toISOString().slice(0, 10)}.csv`);
        toast.success(`${products.length} produit(s) exporté(s)`);
      } else {
        const csv = exportCategoriesToCSV(categories);
        downloadCSV(csv, `veridian_categories_${new Date().toISOString().slice(0, 10)}.csv`);
        toast.success(`${categories.length} catégorie(s) exportée(s)`);
      }
    } catch (err) {
      toast.error('Erreur lors de l\'export');
    } finally {
      setIsExporting(false);
    }
  };

  // ── Télécharger exemple ─────────────────────────────────────────────────────
  const handleDownloadExample = () => {
    const file = mode === 'products' ? 'products_example.csv' : 'categories_example.csv';
    const a = document.createElement('a');
    a.href = `/examples/${file}`;
    a.download = file;
    a.click();
  };

  // ── Lecture du fichier CSV ──────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Seuls les fichiers .csv sont acceptés');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 5 Mo)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        const result = mode === 'products'
          ? importProductsFromCSV(text)
          : importCategoriesFromCSV(text);

        setImportState({
          status: 'preview',
          result,
          fileName: file.name,
          rowCount: result.imported.length + result.errors.length,
        });
      } catch {
        toast.error('Impossible de lire le fichier CSV');
      }
    };
    reader.readAsText(file, 'UTF-8');

    // Reset input pour permettre re-sélection du même fichier
    e.target.value = '';
  };

  // ── Import en base ──────────────────────────────────────────────────────────
  const handleConfirmImport = async () => {
    if (!supabase || !importState.result) return;
    setImportState(s => ({ ...s, status: 'importing' }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Session expirée'); return; }

      const items = importState.result.imported;
      if (!items.length) {
        toast.error('Aucune ligne valide à importer');
        return;
      }

      if (mode === 'products') {
        const { error } = await supabase
          .from('products')
          .upsert(items as Product[], { onConflict: 'id' });
        if (error) throw error;
        await fetchProducts();
        toast.success(`${items.length} produit(s) importé(s) avec succès`);
      } else {
        const { error } = await supabase
          .from('categories')
          .upsert(items as Category[], { onConflict: 'id' });
        if (error) throw error;
        await fetchCategories();
        toast.success(`${items.length} catégorie(s) importée(s) avec succès`);
      }

      setImportState(s => ({ ...s, status: 'done' }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur import';
      toast.error(msg);
      setImportState(s => ({ ...s, status: 'error' }));
    }
  };

  const resetImport = () => {
    setImportState({ status: 'idle', result: null, fileName: '', rowCount: 0 });
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="border border-ink/10 rounded-xl overflow-hidden bg-white mb-4">
      {/* Header toggle */}
      <button
        onClick={() => setIsExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-soft-green/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-ink flex items-center justify-center rounded-lg">
            <FileText className="w-4 h-4 text-accent" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-ink">Import / Export CSV</p>
            <p className="text-xs text-ink/50">Produits et catégories</p>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-ink/40" /> : <ChevronDown className="w-4 h-4 text-ink/40" />}
      </button>

      {isExpanded && (
        <div className="border-t border-ink/10 p-5 space-y-5">

          {/* Sélecteur mode */}
          <div className="flex gap-2">
            {(['products', 'categories'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); resetImport(); }}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg border transition-colors ${
                  mode === m
                    ? 'bg-ink text-white border-ink'
                    : 'border-ink/20 text-ink/60 hover:border-ink/40 hover:text-ink'
                }`}
              >
                {m === 'products' ? '📦 Produits' : '🗂 Catégories'}
              </button>
            ))}
          </div>

          {/* Actions export + exemple */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExport}
              disabled={isExporting || (mode === 'products' ? products.length === 0 : categories.length === 0)}
              className="flex items-center gap-2 px-4 py-2.5 bg-ink text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-ink/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Exporter {mode === 'products' ? `(${products.length})` : `(${categories.length})`}
            </button>

            <button
              onClick={handleDownloadExample}
              className="flex items-center gap-2 px-4 py-2.5 border border-ink/20 text-ink text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-ink/5 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Fichier exemple
            </button>

            <label className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-ink/30 text-ink/60 text-xs font-bold uppercase tracking-widest rounded-lg hover:border-ink/60 hover:text-ink transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              Importer CSV
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {/* Aperçu import */}
          {importState.status === 'preview' && importState.result && (
            <div className="border border-ink/10 rounded-xl overflow-hidden">
              {/* Header aperçu */}
              <div className="flex items-center justify-between px-4 py-3 bg-soft-green/20 border-b border-ink/10">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-ink/60" />
                  <span className="text-sm font-bold text-ink">{importState.fileName}</span>
                </div>
                <button onClick={resetImport} className="text-ink/40 hover:text-ink transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 divide-x divide-ink/10 border-b border-ink/10">
                <div className="px-4 py-3 text-center">
                  <p className="text-lg font-bold font-mono text-emerald-600">{importState.result.imported.length}</p>
                  <p className="text-[10px] uppercase tracking-widest text-ink/50">Valides</p>
                </div>
                <div className="px-4 py-3 text-center">
                  <p className={`text-lg font-bold font-mono ${importState.result.errors.length > 0 ? 'text-red-500' : 'text-ink/30'}`}>
                    {importState.result.errors.length}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-ink/50">Erreurs</p>
                </div>
                <div className="px-4 py-3 text-center">
                  <p className="text-lg font-bold font-mono text-ink/40">{importState.rowCount}</p>
                  <p className="text-[10px] uppercase tracking-widest text-ink/50">Total lignes</p>
                </div>
              </div>

              {/* Erreurs détaillées */}
              {importState.result.errors.length > 0 && (
                <div className="p-4 bg-red-50 border-b border-red-100">
                  <p className="text-xs font-bold text-red-600 mb-2 uppercase tracking-widest">Lignes ignorées</p>
                  <ul className="space-y-1">
                    {importState.result.errors.slice(0, 8).map((e, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-red-600">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>Ligne {e.row} : {e.message}</span>
                      </li>
                    ))}
                    {importState.result.errors.length > 8 && (
                      <li className="text-xs text-red-400">… et {importState.result.errors.length - 8} autre(s)</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Aperçu des premières lignes */}
              {importState.result.imported.length > 0 && (
                <div className="p-4 border-b border-ink/10">
                  <p className="text-xs font-bold text-ink/50 uppercase tracking-widest mb-2">Aperçu (5 premières lignes)</p>
                  <div className="space-y-1">
                    {(importState.result.imported as Array<Partial<Product> & Partial<Category>>).slice(0, 5).map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-ink/70 bg-ink/3 rounded px-3 py-1.5">
                        <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span className="font-medium">{item.name}</span>
                        {(item as Partial<Product>).price !== undefined && (
                          <span className="text-ink/40 ml-auto">{(item as Partial<Product>).price?.toFixed(2)}€</span>
                        )}
                      </div>
                    ))}
                    {importState.result.imported.length > 5 && (
                      <p className="text-xs text-ink/40 px-3">… et {importState.result.imported.length - 5} autre(s)</p>
                    )}
                  </div>
                </div>
              )}

              {/* Actions confirmation */}
              <div className="flex gap-2 p-4">
                <button
                  onClick={handleConfirmImport}
                  disabled={importState.result.imported.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4" />
                  Confirmer l'import ({importState.result.imported.length} lignes)
                </button>
                <button
                  onClick={resetImport}
                  className="px-4 py-2.5 border border-ink/20 text-ink/60 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-ink/5 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Importing */}
          {importState.status === 'importing' && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <Loader2 className="w-5 h-5 text-amber-600 animate-spin shrink-0" />
              <p className="text-sm text-amber-700 font-medium">Import en cours…</p>
            </div>
          )}

          {/* Done */}
          {importState.status === 'done' && (
            <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-sm text-emerald-700 font-medium">Import terminé avec succès</p>
              </div>
              <button onClick={resetImport} className="text-emerald-600 hover:text-emerald-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Format info */}
          <div className="text-xs text-ink/40 space-y-1 pt-1 border-t border-ink/5">
            <p>• Encodage UTF-8 · Séparateur virgule · Première ligne = en-têtes</p>
            <p>• Champs multi-valeurs (catégories, effets, badges) séparés par <code className="bg-ink/5 px-1 rounded">|</code></p>
            <p>• Specs : format <code className="bg-ink/5 px-1 rounded">Titre::Contenu;;Titre2::Contenu2</code></p>
            <p>• L'import utilise <strong>upsert</strong> — les produits existants (même ID) sont mis à jour</p>
          </div>
        </div>
      )}
    </div>
  );
}
