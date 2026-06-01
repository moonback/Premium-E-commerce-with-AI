/**
 * csvService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Import / Export CSV pour les produits et catégories.
 * Pas de dépendance externe — parsing CSV maison robuste (gère les guillemets,
 * les virgules dans les valeurs, les sauts de ligne dans les cellules).
 */

import type { Product, Category, Spec } from '../types';

// ── Helpers CSV ───────────────────────────────────────────────────────────────

/** Échappe une valeur pour CSV (guillemets si nécessaire) */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Guillemets si la valeur contient virgule, guillemet ou saut de ligne
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Construit une ligne CSV à partir d'un tableau de valeurs */
function csvRow(values: unknown[]): string {
  return values.map(csvCell).join(',');
}

/** Parse un fichier CSV en tableau de lignes (tableau de strings) */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  let i = 0;

  // Normalise les fins de ligne
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  while (i < normalized.length) {
    const ch = normalized[i];

    if (inQuotes) {
      if (ch === '"') {
        if (normalized[i + 1] === '"') {
          // Guillemet échappé
          cell += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        cell += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        row.push(cell);
        cell = '';
        i++;
      } else if (ch === '\n') {
        row.push(cell);
        cell = '';
        if (row.some(c => c !== '')) rows.push(row);
        row = [];
        i++;
      } else {
        cell += ch;
        i++;
      }
    }
  }

  // Dernière cellule / ligne
  row.push(cell);
  if (row.some(c => c !== '')) rows.push(row);

  return rows;
}

/** Convertit un tableau de lignes CSV en tableau d'objets (première ligne = headers) */
export function csvToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.trim().toLowerCase());
  return rows.slice(1).map(row => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = (row[i] ?? '').trim(); });
    return obj;
  });
}

// ── PRODUITS — Export ─────────────────────────────────────────────────────────

export const PRODUCT_CSV_HEADERS = [
  'id', 'name', 'description', 'price', 'purchase_price', 'stock',
  'image', 'categories', 'effects', 'badges',
  'is_batch_product', 'batch_size', 'batch_unit',
  'specs',
  'seo_meta_title', 'seo_meta_description', 'seo_meta_keywords',
  'promo_price', 'promo_start_date', 'promo_end_date', 'promo_label',
  'rating',
];

/**
 * Exporte un tableau de produits en chaîne CSV.
 * - categories / effects / badges : séparés par "|"
 * - specs : format "Titre::Contenu;;Titre2::Contenu2"
 */
export function exportProductsToCSV(products: Product[]): string {
  const lines: string[] = [csvRow(PRODUCT_CSV_HEADERS)];

  for (const p of products) {
    lines.push(csvRow([
      p.id,
      p.name,
      p.description,
      p.price,
      p.purchase_price ?? '',
      p.stock,
      p.image,
      (p.categories ?? []).join('|'),
      (p.effects ?? []).join('|'),
      (p.badges ?? []).join('|'),
      p.is_batch_product ? '1' : '0',
      p.batch_size ?? '',
      p.batch_unit ?? '',
      (p.specs ?? []).map(s => `${s.title}::${s.content}`).join(';;'),
      p.seo?.meta_title ?? '',
      p.seo?.meta_description ?? '',
      p.seo?.meta_keywords ?? '',
      p.promotion?.promo_price ?? '',
      p.promotion?.promo_start_date ?? '',
      p.promotion?.promo_end_date ?? '',
      p.promotion?.promo_label ?? '',
      p.rating ?? 0,
    ]));
  }

  return lines.join('\n');
}

// ── PRODUITS — Import ─────────────────────────────────────────────────────────

export interface ImportResult<T> {
  imported: T[];
  errors: Array<{ row: number; message: string }>;
  skipped: number;
}

/** Parse une ligne CSV produit en objet Product partiel */
export function importProductsFromCSV(csvText: string): ImportResult<Partial<Product>> {
  const rows = parseCSV(csvText);
  const objects = csvToObjects(rows);
  const imported: Partial<Product>[] = [];
  const errors: Array<{ row: number; message: string }> = [];

  objects.forEach((obj, idx) => {
    const rowNum = idx + 2; // +2 car ligne 1 = headers

    const name = obj['name']?.trim();
    const priceRaw = obj['price']?.trim();

    if (!name) {
      errors.push({ row: rowNum, message: 'Colonne "name" manquante ou vide' });
      return;
    }
    if (!priceRaw || isNaN(Number(priceRaw))) {
      errors.push({ row: rowNum, message: `Prix invalide : "${priceRaw}"` });
      return;
    }

    // Parse specs : "Titre::Contenu;;Titre2::Contenu2"
    const specsRaw = obj['specs']?.trim() ?? '';
    const specs: Spec[] = specsRaw
      ? specsRaw.split(';;').map(s => {
          const [title = '', content = ''] = s.split('::');
          return { title: title.trim(), content: content.trim() };
        }).filter(s => s.title || s.content)
      : [];

    // Parse promotion
    const promoPrice = obj['promo_price'] ? Number(obj['promo_price']) : null;
    const promotion = promoPrice && obj['promo_start_date'] && obj['promo_end_date']
      ? {
          promo_price: promoPrice,
          promo_start_date: obj['promo_start_date'],
          promo_end_date: obj['promo_end_date'],
          promo_label: obj['promo_label'] || undefined,
        }
      : null;

    // Parse SEO
    const hasSeo = obj['seo_meta_title'] || obj['seo_meta_description'] || obj['seo_meta_keywords'];
    const seo = hasSeo ? {
      meta_title: obj['seo_meta_title'] || null,
      meta_description: obj['seo_meta_description'] || null,
      meta_keywords: obj['seo_meta_keywords'] || null,
    } : null;

    const product: Partial<Product> = {
      id: obj['id']?.trim() || `prod_${Date.now()}_${idx}`,
      name,
      description: obj['description']?.trim() ?? '',
      price: Number(priceRaw),
      purchase_price: obj['purchase_price'] ? Number(obj['purchase_price']) : undefined,
      stock: obj['stock'] ? Number(obj['stock']) : 0,
      image: obj['image']?.trim() ?? '',
      categories: obj['categories'] ? obj['categories'].split('|').map(c => c.trim()).filter(Boolean) : [],
      effects: obj['effects'] ? obj['effects'].split('|').map(e => e.trim()).filter(Boolean) : [],
      badges: obj['badges']
        ? (obj['badges'].split('|').map(b => b.trim()).filter(Boolean) as Product['badges'])
        : [],
      is_batch_product: obj['is_batch_product'] === '1' || obj['is_batch_product'] === 'true',
      batch_size: obj['batch_size'] ? Number(obj['batch_size']) : undefined,
      batch_unit: obj['batch_unit']?.trim() || undefined,
      specs,
      seo,
      promotion,
      rating: obj['rating'] ? Number(obj['rating']) : 0,
    };

    imported.push(product);
  });

  return { imported, errors, skipped: 0 };
}

// ── CATÉGORIES — Export ───────────────────────────────────────────────────────

export const CATEGORY_CSV_HEADERS = [
  'id', 'name', 'parent_id', 'level', 'image_url',
  'seo_meta_title', 'seo_meta_description',
];

export function exportCategoriesToCSV(categories: Category[]): string {
  const lines: string[] = [csvRow(CATEGORY_CSV_HEADERS)];
  for (const c of categories) {
    lines.push(csvRow([
      c.id,
      c.name,
      c.parent_id ?? '',
      c.level,
      c.image_url ?? '',
      c.seo?.meta_title ?? '',
      c.seo?.meta_description ?? '',
    ]));
  }
  return lines.join('\n');
}

// ── CATÉGORIES — Import ───────────────────────────────────────────────────────

export function importCategoriesFromCSV(csvText: string): ImportResult<Partial<Category>> {
  const rows = parseCSV(csvText);
  const objects = csvToObjects(rows);
  const imported: Partial<Category>[] = [];
  const errors: Array<{ row: number; message: string }> = [];

  objects.forEach((obj, idx) => {
    const rowNum = idx + 2;
    const name = obj['name']?.trim();

    if (!name) {
      errors.push({ row: rowNum, message: 'Colonne "name" manquante ou vide' });
      return;
    }

    const hasSeo = obj['seo_meta_title'] || obj['seo_meta_description'];
    imported.push({
      id: obj['id']?.trim() || undefined,
      name,
      parent_id: obj['parent_id']?.trim() || null,
      level: obj['level'] ? Number(obj['level']) : 1,
      image_url: obj['image_url']?.trim() || null,
      seo: hasSeo ? {
        meta_title: obj['seo_meta_title'] || null,
        meta_description: obj['seo_meta_description'] || null,
      } : null,
    });
  });

  return { imported, errors, skipped: 0 };
}

// ── Téléchargement côté client ────────────────────────────────────────────────

export function downloadCSV(content: string, filename: string): void {
  // BOM UTF-8 pour Excel
  const bom = '\uFEFF';
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
