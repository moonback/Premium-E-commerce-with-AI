# Guide d'Implémentation SEO - Référencement Naturel Google

## 📋 Vue d'ensemble

Ce guide explique comment le système SEO est implémenté pour optimiser le référencement naturel (SEO) de votre boutique e-commerce sur Google et les autres moteurs de recherche.

## 🎯 Objectifs SEO

- ✅ **Améliorer le classement Google** : Métadonnées optimisées pour chaque produit et catégorie
- ✅ **Partage sur réseaux sociaux** : Open Graph pour Facebook, Twitter, LinkedIn
- ✅ **Rich Snippets** : Données structurées JSON-LD pour les résultats enrichis
- ✅ **URLs canoniques** : Éviter le contenu dupliqué
- ✅ **Mots-clés ciblés** : Meta keywords pour chaque page

## 🏗️ Architecture

### 1. Types TypeScript (`src/types.ts`)

```typescript
export type SEOData = {
  meta_title?: string | null;           // Titre pour Google (50-60 caractères)
  meta_description?: string | null;     // Description pour Google (150-160 caractères)
  meta_keywords?: string | null;        // Mots-clés séparés par virgules
  og_title?: string | null;             // Titre pour réseaux sociaux
  og_description?: string | null;       // Description pour réseaux sociaux
  og_image?: string | null;             // Image pour réseaux sociaux (1200x630px)
  canonical_url?: string | null;        // URL canonique
};
```

### 2. Composant SEO (`src/components/SEO.tsx`)

Le composant SEO injecte dynamiquement les métadonnées dans le `<head>` du document :

```typescript
<SEO
  title="Nom du produit"
  description="Description du produit"
  path="/product/mon-produit"
  image="https://example.com/image.jpg"
  type="product"
  seoData={product.seo}        // Données SEO personnalisées
  keywords="mot1, mot2, mot3"
  jsonLd={productJsonLd}
/>
```

### 3. Métadonnées Injectées

Le composant SEO injecte automatiquement :

#### Meta Tags Basiques
```html
<title>Nom du produit | Véridian</title>
<meta name="description" content="Description optimisée pour Google">
<meta name="keywords" content="mot-clé1, mot-clé2, mot-clé3">
```

#### Open Graph (Facebook, LinkedIn)
```html
<meta property="og:title" content="Titre pour réseaux sociaux">
<meta property="og:description" content="Description pour réseaux sociaux">
<meta property="og:image" content="https://example.com/image.jpg">
<meta property="og:type" content="product">
<meta property="og:url" content="https://example.com/product/mon-produit">
<meta property="og:site_name" content="Véridian">
```

#### Twitter Card
```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Titre pour Twitter">
<meta name="twitter:description" content="Description pour Twitter">
<meta name="twitter:image" content="https://example.com/image.jpg">
```

#### URL Canonique
```html
<link rel="canonical" href="https://example.com/product/mon-produit">
```

#### JSON-LD (Données Structurées)
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Nom du produit",
  "description": "Description",
  "image": "https://example.com/image.jpg",
  "offers": {
    "@type": "Offer",
    "price": "29.99",
    "priceCurrency": "EUR"
  }
}
</script>
```

## 📝 Utilisation dans l'Admin

### Ajouter des Métadonnées SEO à un Produit

1. **Accéder à l'admin** : `/admin`
2. **Onglet Products** : Cliquer sur "Products"
3. **Éditer un produit** : Cliquer sur l'icône d'édition
4. **Section SEO** : Cliquer sur "Optimisation SEO (Optionnel)"
5. **Remplir les champs** :
   - **Meta Title** : Titre optimisé (50-60 caractères)
   - **Meta Description** : Description attractive (150-160 caractères)
   - **Meta Keywords** : Mots-clés séparés par virgules
   - **OG Title** : Titre pour réseaux sociaux
   - **OG Description** : Description pour réseaux sociaux
   - **OG Image** : URL de l'image (1200x630px recommandé)
   - **Canonical URL** : URL canonique (optionnel)

### Ajouter des Métadonnées SEO à une Catégorie

1. **Accéder à l'admin** : `/admin`
2. **Onglet Categories** : Cliquer sur "Categories"
3. **Ajouter/Éditer** : Cliquer sur "Ajouter une Catégorie" ou éditer une existante
4. **Section SEO** : Cliquer sur "Optimisation SEO (Optionnel)"
5. **Remplir les champs** : Même processus que pour les produits

## 🎨 Bonnes Pratiques SEO

### Meta Title
- ✅ **Longueur** : 50-60 caractères
- ✅ **Mots-clés** : Inclure les mots-clés principaux au début
- ✅ **Unique** : Chaque page doit avoir un titre unique
- ✅ **Attractif** : Inciter au clic
- ❌ **Éviter** : Bourrage de mots-clés, titres génériques

**Exemple** :
```
✅ Bon : "Montre Automatique Suisse - Luxe & Précision | Véridian"
❌ Mauvais : "Montre montre montre acheter montre pas cher"
```

### Meta Description
- ✅ **Longueur** : 150-160 caractères
- ✅ **Appel à l'action** : Inciter à cliquer
- ✅ **Mots-clés** : Inclure naturellement
- ✅ **Unique** : Chaque page doit avoir une description unique
- ❌ **Éviter** : Descriptions génériques, trop courtes ou trop longues

**Exemple** :
```
✅ Bon : "Découvrez notre montre automatique suisse en acier inoxydable. Mouvement précis, design élégant. Livraison gratuite et garantie 2 ans."
❌ Mauvais : "Montre"
```

### Meta Keywords
- ✅ **Pertinents** : Mots-clés liés au produit/catégorie
- ✅ **Variés** : Inclure synonymes et variations
- ✅ **Séparés** : Par des virgules
- ❌ **Éviter** : Trop de mots-clés (max 10-15)

**Exemple** :
```
✅ Bon : "montre automatique, montre suisse, montre luxe, horlogerie, cadeau homme"
❌ Mauvais : "montre, montre, montre, montre, montre, montre"
```

### Open Graph Image
- ✅ **Dimensions** : 1200x630px (ratio 1.91:1)
- ✅ **Format** : JPG ou PNG
- ✅ **Poids** : < 1MB
- ✅ **Qualité** : Haute résolution
- ✅ **Contenu** : Représentatif du produit/catégorie

### Canonical URL
- ✅ **Utiliser** : Pour éviter le contenu dupliqué
- ✅ **Format** : URL complète (https://example.com/page)
- ✅ **Cohérent** : Pointer vers la version principale

## 🔍 Vérification SEO

### Outils de Test

1. **Google Search Console** : https://search.google.com/search-console
   - Soumettre votre sitemap
   - Vérifier l'indexation
   - Voir les performances de recherche

2. **Google Rich Results Test** : https://search.google.com/test/rich-results
   - Tester les données structurées JSON-LD
   - Vérifier les rich snippets

3. **Facebook Sharing Debugger** : https://developers.facebook.com/tools/debug/
   - Tester les Open Graph tags
   - Voir l'aperçu du partage

4. **Twitter Card Validator** : https://cards-dev.twitter.com/validator
   - Tester les Twitter Cards
   - Voir l'aperçu du partage

5. **Lighthouse (Chrome DevTools)** :
   - Audit SEO complet
   - Recommandations d'amélioration

### Vérifier dans le Code Source

Ouvrir une page produit et faire `Ctrl+U` (ou clic droit > "Afficher le code source") :

```html
<!-- Vérifier que ces balises sont présentes -->
<title>Votre titre | Véridian</title>
<meta name="description" content="Votre description">
<meta name="keywords" content="vos, mots, clés">
<meta property="og:title" content="Votre titre OG">
<meta property="og:image" content="https://...">
<link rel="canonical" href="https://...">
<script type="application/ld+json">...</script>
```

## 📊 Impact SEO Attendu

### Court Terme (1-3 mois)
- ✅ Amélioration de l'apparence dans les résultats de recherche
- ✅ Meilleur taux de clic (CTR) depuis Google
- ✅ Partages plus attractifs sur réseaux sociaux

### Moyen Terme (3-6 mois)
- ✅ Amélioration du classement pour les mots-clés ciblés
- ✅ Augmentation du trafic organique
- ✅ Rich snippets dans les résultats Google

### Long Terme (6-12 mois)
- ✅ Positionnement sur des requêtes compétitives
- ✅ Augmentation significative du trafic SEO
- ✅ Meilleure autorité de domaine

## 🗄️ Base de Données

### Migration SQL

Exécuter le fichier `supabase_migration_seo.sql` dans Supabase :

```sql
-- Ajoute la colonne seo (JSONB) aux tables products et categories
ALTER TABLE products ADD COLUMN seo JSONB DEFAULT NULL;
ALTER TABLE categories ADD COLUMN seo JSONB DEFAULT NULL;

-- Crée des index pour améliorer les performances
CREATE INDEX idx_products_seo_gin ON products USING GIN (seo);
CREATE INDEX idx_categories_seo_gin ON categories USING GIN (seo);
```

### Structure des Données

```json
{
  "meta_title": "Titre optimisé pour Google",
  "meta_description": "Description attractive pour les résultats de recherche",
  "meta_keywords": "mot1, mot2, mot3",
  "og_title": "Titre pour réseaux sociaux",
  "og_description": "Description pour réseaux sociaux",
  "og_image": "https://example.com/image.jpg",
  "canonical_url": "https://example.com/page"
}
```

## 🚀 Prochaines Étapes

1. **Exécuter la migration SQL** : `supabase_migration_seo.sql`
2. **Ajouter des métadonnées SEO** : Pour vos produits et catégories phares
3. **Tester** : Utiliser les outils de vérification
4. **Soumettre à Google** : Via Google Search Console
5. **Monitorer** : Suivre les performances dans Google Analytics

## 📚 Ressources

- [Google SEO Starter Guide](https://developers.google.com/search/docs/beginner/seo-starter-guide)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Schema.org Product](https://schema.org/Product)
- [Google Rich Results](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)

---

**Date de création** : Juin 2026  
**Version** : 1.0.0  
**Auteur** : Kiro AI Assistant
