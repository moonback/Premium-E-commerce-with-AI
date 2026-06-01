import React from 'react';
import { Globe, Search } from 'lucide-react';
import { SEOData } from '../types';

interface SEOFieldsProps {
  seo: SEOData | null | undefined;
  onChange: (seo: SEOData) => void;
}

export default function SEOFields({ seo, onChange }: SEOFieldsProps) {
  const seoData = seo || {};

  const handleChange = (field: keyof SEOData, value: string) => {
    onChange({
      ...seoData,
      [field]: value || null,
    });
  };

  return (
    <div className="space-y-4 border border-ink/10 p-6 bg-soft-green/5">
      <div className="flex items-center gap-2 mb-4">
        <Search className="w-5 h-5 text-ink/60" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-ink/70">
          Optimisation SEO
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Meta Title */}
        <div>
          <label className="block text-xs uppercase tracking-widest font-bold mb-2 opacity-50">
            Meta Title
          </label>
          <input
            type="text"
            value={seoData.meta_title || ''}
            onChange={(e) => handleChange('meta_title', e.target.value)}
            className="w-full border-b border-ink/20 py-2 focus:outline-none focus:border-ink bg-transparent text-sm"
            placeholder="Titre optimisé pour les moteurs de recherche (50-60 caractères)"
            maxLength={60}
          />
          <p className="text-xs text-ink/40 mt-1">
            {seoData.meta_title?.length || 0}/60 caractères
          </p>
        </div>

        {/* Meta Description */}
        <div>
          <label className="block text-xs uppercase tracking-widest font-bold mb-2 opacity-50">
            Meta Description
          </label>
          <textarea
            value={seoData.meta_description || ''}
            onChange={(e) => handleChange('meta_description', e.target.value)}
            className="w-full border border-ink/20 p-3 focus:outline-none focus:border-ink bg-transparent text-sm rounded"
            placeholder="Description pour les résultats de recherche (150-160 caractères)"
            rows={3}
            maxLength={160}
          />
          <p className="text-xs text-ink/40 mt-1">
            {seoData.meta_description?.length || 0}/160 caractères
          </p>
        </div>

        {/* Meta Keywords */}
        <div>
          <label className="block text-xs uppercase tracking-widest font-bold mb-2 opacity-50">
            Meta Keywords
          </label>
          <input
            type="text"
            value={seoData.meta_keywords || ''}
            onChange={(e) => handleChange('meta_keywords', e.target.value)}
            className="w-full border-b border-ink/20 py-2 focus:outline-none focus:border-ink bg-transparent text-sm"
            placeholder="mots-clés, séparés, par, virgules"
          />
          <p className="text-xs text-ink/40 mt-1">
            Séparez les mots-clés par des virgules
          </p>
        </div>

        {/* Open Graph Title */}
        <div>
          <label className="block text-xs uppercase tracking-widest font-bold mb-2 opacity-50">
            OG Title (Réseaux Sociaux)
          </label>
          <input
            type="text"
            value={seoData.og_title || ''}
            onChange={(e) => handleChange('og_title', e.target.value)}
            className="w-full border-b border-ink/20 py-2 focus:outline-none focus:border-ink bg-transparent text-sm"
            placeholder="Titre pour le partage sur les réseaux sociaux"
          />
        </div>

        {/* Open Graph Description */}
        <div>
          <label className="block text-xs uppercase tracking-widest font-bold mb-2 opacity-50">
            OG Description
          </label>
          <textarea
            value={seoData.og_description || ''}
            onChange={(e) => handleChange('og_description', e.target.value)}
            className="w-full border border-ink/20 p-3 focus:outline-none focus:border-ink bg-transparent text-sm rounded"
            placeholder="Description pour le partage sur les réseaux sociaux"
            rows={2}
          />
        </div>

        {/* Open Graph Image */}
        <div>
          <label className="block text-xs uppercase tracking-widest font-bold mb-2 opacity-50">
            OG Image URL
          </label>
          <input
            type="url"
            value={seoData.og_image || ''}
            onChange={(e) => handleChange('og_image', e.target.value)}
            className="w-full border-b border-ink/20 py-2 focus:outline-none focus:border-ink bg-transparent text-sm"
            placeholder="https://example.com/image.jpg"
          />
          {seoData.og_image && (
            <img
              src={seoData.og_image}
              alt="OG Preview"
              className="mt-3 w-32 h-32 object-cover rounded border border-ink/10"
            />
          )}
        </div>

        {/* Canonical URL */}
        <div>
          <label className="block text-xs uppercase tracking-widest font-bold mb-2 opacity-50">
            Canonical URL
          </label>
          <input
            type="url"
            value={seoData.canonical_url || ''}
            onChange={(e) => handleChange('canonical_url', e.target.value)}
            className="w-full border-b border-ink/20 py-2 focus:outline-none focus:border-ink bg-transparent text-sm"
            placeholder="https://example.com/page-canonique"
          />
          <p className="text-xs text-ink/40 mt-1">
            URL canonique pour éviter le contenu dupliqué
          </p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-soft-green/20 border border-ink/10 rounded text-xs text-ink/60">
        <p className="font-bold mb-1">💡 Conseils SEO :</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Le Meta Title doit être unique et contenir les mots-clés principaux</li>
          <li>La Meta Description doit inciter au clic</li>
          <li>Les données OG améliorent l'apparence sur les réseaux sociaux</li>
        </ul>
      </div>
    </div>
  );
}
