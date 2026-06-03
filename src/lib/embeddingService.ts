/**
 * embeddingService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Génère des embeddings sémantiques via l'API Gemini.
 * Utilise l'API REST directe (plus fiable que le SDK pour les embeddings).
 *
 * Modèle : gemini-embedding-2 — 3072 dimensions
 * Usage  : côté serveur uniquement (nécessite GEMINI_API_KEY)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Product } from '../types';
import { PRODUCT_COLUMNS_EMBEDDING } from './columns';

// ── Configuration ─────────────────────────────────────────────────────────────
export const EMBEDDING_MODEL = 'gemini-embedding-2';
export const EMBEDDING_DIMENSIONS = 1536; // Tronqué via outputDimensionality — max HNSW pgvector = 2000
const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 300;

// ── Types ─────────────────────────────────────────────────────────────────────
export interface VectorizationResult {
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{ productId: string; error: string }>;
}

export interface SemanticSearchResult {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categories: string[];
  effects: string[];
  image: string;
  similarity: number;
}

// ── Texte d'embedding d'un produit ────────────────────────────────────────────
export function buildProductEmbeddingText(product: Product): string {
  const parts: string[] = [
    `Produit: ${product.name}`,
    `Description: ${product.description}`,
  ];
  if (product.categories?.length) parts.push(`Catégories: ${product.categories.join(', ')}`);
  if (product.effects?.length) parts.push(`Caractéristiques: ${product.effects.join(', ')}`);
  if (product.specs?.length) {
    parts.push(`Détails: ${product.specs.map(s => `${s.title}: ${s.content}`).join('. ')}`);
  }
  if (product.price) parts.push(`Prix: ${product.price.toFixed(2)} euros`);
  return parts.join('. ');
}

// ── Génération d'un embedding via REST ───────────────────────────────────────
export async function generateEmbedding(
  apiKey: string,
  text: string
): Promise<number[]> {
  const url = `https://generativelanguage.googleapis.com/v1/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      outputDimensionality: EMBEDDING_DIMENSIONS, // Tronque à 1536 (limite HNSW pgvector)
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(`Embedding API error ${response.status}: ${err?.error?.message ?? response.statusText}`);
  }

  const data = await response.json() as { embedding?: { values?: number[] } };
  const values = data.embedding?.values;

  if (!values?.length) {
    throw new Error(`Embedding vide reçu pour le modèle ${EMBEDDING_MODEL}`);
  }

  return values;
}

// ── Vectorisation d'un seul produit ──────────────────────────────────────────
export async function vectorizeProduct(
  apiKey: string,
  supabase: SupabaseClient,
  product: Product
): Promise<void> {
  const text = buildProductEmbeddingText(product);
  const embedding = await generateEmbedding(apiKey, text);

  const { error } = await supabase
    .from('products')
    .update({
      embedding: `[${embedding.join(',')}]`,
      embedding_updated_at: new Date().toISOString(),
    })
    .eq('id', product.id);

  if (error) {
    throw new Error(`Supabase update failed for ${product.id}: ${error.message}`);
  }
}

// ── Vectorisation de tous les produits (batch) ────────────────────────────────
export async function vectorizeAllProducts(
  apiKey: string,
  supabase: SupabaseClient,
  options: {
    onlyMissing?: boolean;
    onProgress?: (done: number, total: number) => void;
  } = {}
): Promise<VectorizationResult> {
  const result: VectorizationResult = { success: 0, failed: 0, skipped: 0, errors: [] };

  let query = supabase.from('products').select(PRODUCT_COLUMNS_EMBEDDING) as any;
  if (options.onlyMissing) query = query.is('embedding', null);

  const { data: products, error: fetchError } = await query;
  if (fetchError) throw new Error(`Impossible de charger les produits: ${fetchError.message}`);
  if (!products?.length) return result;

  const total = products.length;

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (product) => {
        try {
          await vectorizeProduct(apiKey, supabase, product as Product);
          result.success++;
        } catch (err) {
          result.failed++;
          result.errors.push({
            productId: product.id,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      })
    );

    options.onProgress?.(Math.min(i + BATCH_SIZE, total), total);

    if (i + BATCH_SIZE < products.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  return result;
}

// ── Recherche sémantique ──────────────────────────────────────────────────────
export async function semanticSearchProducts(
  apiKey: string,
  supabase: SupabaseClient,
  query: string,
  options: {
    matchThreshold?: number;
    matchCount?: number;
    filterInStock?: boolean;
  } = {}
): Promise<SemanticSearchResult[]> {
  const { matchThreshold = 0.5, matchCount = 5, filterInStock = true } = options;

  const queryEmbedding = await generateEmbedding(apiKey, query);

  const { data, error } = await supabase.rpc('match_products', {
    query_embedding: `[${queryEmbedding.join(',')}]`,
    match_threshold: matchThreshold,
    match_count: matchCount,
    filter_in_stock: filterInStock,
  });

  if (error) throw new Error(`Recherche sémantique échouée: ${error.message}`);
  return (data ?? []) as SemanticSearchResult[];
}

// ── Formatage pour Ava ────────────────────────────────────────────────────────
export function formatSemanticResultsForAva(results: SemanticSearchResult[]): string {
  if (!results.length) return 'Aucun produit pertinent trouvé dans le catalogue.';
  return results
    .map(p =>
      `${p.id}: ${p.name} (${p.price.toFixed(2)}€) — ${p.description}` +
      (p.categories?.length ? ` | Catégories: ${p.categories.join(', ')}` : '') +
      (p.effects?.length ? ` | ${p.effects.join(', ')}` : '')
    )
    .join(' || ');
}
