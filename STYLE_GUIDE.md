# Guide de Style Véridian - Editorial Aesthetic

Ce document définit les standards de design et de code pour maintenir la cohérence visuelle et technique de la plateforme Véridian.

---

## 🎨 Design Tokens

Tous les tokens de design sont centralisés dans `src/styles/tokens.ts`. **Toujours utiliser les tokens plutôt que des valeurs hardcodées.**

### Couleurs

```typescript
import { tokens } from '@/styles/tokens';

// Base
tokens.colors.bg        // #F9F7F2 - Coquille d'œuf
tokens.colors.ink       // #1C2B21 - Encre
tokens.colors.softGreen // #E8EDE8 - Vert doux
tokens.colors.accent    // #B08D57 - Doré/Terre

// Semantic
tokens.colors.success   // #10B981
tokens.colors.error     // #EF4444
tokens.colors.warning   // #F59E0B
tokens.colors.info      // #3B82F6
```

### Typographie

```typescript
// Font Families
tokens.typography.fontFamily.serif // Playfair Display (titres)
tokens.typography.fontFamily.sans  // Inter (corps de texte)

// Font Sizes
tokens.typography.fontSize.xs   // 12px
tokens.typography.fontSize.base // 16px
tokens.typography.fontSize['4xl'] // 36px

// Font Weights
tokens.typography.fontWeight.light    // 300
tokens.typography.fontWeight.normal   // 400
tokens.typography.fontWeight.bold     // 700
```

### Spacing

Basé sur une grille de 4px :

```typescript
tokens.spacing[1]  // 4px
tokens.spacing[4]  // 16px
tokens.spacing[8]  // 32px
tokens.spacing[16] // 64px
```

### Border Radius

```typescript
tokens.radius.sm   // 4px
tokens.radius.base // 8px
tokens.radius.lg   // 16px
tokens.radius['2xl'] // 32px
tokens.radius.full // 9999px (cercle)
```

### Shadows

```typescript
tokens.shadows.sm   // Ombre légère
tokens.shadows.base // Ombre standard
tokens.shadows.xl   // Ombre prononcée
```

### Z-Index

```typescript
tokens.zIndex.base          // 0
tokens.zIndex.dropdown      // 10
tokens.zIndex.sticky        // 20
tokens.zIndex.fixed         // 30
tokens.zIndex.modalBackdrop // 40
tokens.zIndex.modal         // 50
tokens.zIndex.tooltip       // 70
```

---

## 🧩 Composants UI

### Utilisation

Toujours importer depuis `@/components/ui` :

```typescript
import { Button, Input, Dialog, Toast } from '@/components/ui';
```

### Composants Disponibles

#### Button
```tsx
<Button variant="primary" size="md" disabled={false}>
  Cliquez ici
</Button>
```

Variants: `primary`, `secondary`, `ghost`, `danger`  
Sizes: `sm`, `md`, `lg`

#### Input
```tsx
<Input
  type="text"
  placeholder="Entrez votre email"
  error="Email invalide"
/>
```

#### Dialog
```tsx
<Dialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirmation"
>
  Contenu du dialog
</Dialog>
```

#### Toast
```tsx
import { toast } from '@/components/ui';

toast.success('Opération réussie');
toast.error('Une erreur est survenue');
toast.loading('Chargement...');
```

#### Tooltip
```tsx
<Tooltip content="Information utile" side="top">
  <button>Survolez-moi</button>
</Tooltip>
```

#### Loading
```tsx
<Loading size="md" text="Chargement..." />
<LoadingSpinner />
<LoadingDots />
```

---

## 📐 Conventions de Code

### Nommage

- **Composants**: PascalCase (`ProductCard.tsx`)
- **Hooks**: camelCase avec préfixe `use` (`useReducedMotion.ts`)
- **Utilitaires**: camelCase (`formatPrice.ts`)
- **Types**: PascalCase (`Product`, `CartItem`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_ITEMS`)

### Structure de Fichier

```
src/
├── components/
│   ├── ui/              # Composants réutilisables
│   ├── ProductCard.tsx  # Composants métier
│   └── ...
├── pages/               # Pages route-level
├── hooks/               # Hooks personnalisés
├── lib/                 # Utilitaires
├── services/            # Services API
├── styles/              # Tokens et styles globaux
└── types/               # Types TypeScript
```

### TypeScript

**Toujours typer explicitement :**

```typescript
// ✅ Bon
interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

// ❌ Mauvais
function ProductCard(props: any) { ... }
```

**Éviter `any` :**

```typescript
// ✅ Bon
catch (error: unknown) {
  const message = getErrorMessage(error);
}

// ❌ Mauvais
catch (error: any) { ... }
```

---

## 🎭 Animations

### Respect des Préférences Utilisateur

Toujours utiliser le hook `useReducedMotion` :

```typescript
import { useReducedMotion } from '@/hooks/useReducedMotion';

function MyComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0 }}
      animate={prefersReducedMotion ? {} : { opacity: 1 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
    >
      Contenu
    </motion.div>
  );
}
```

### Durées Standards

```typescript
tokens.motion.duration.fast   // 150ms - Micro-interactions
tokens.motion.duration.base   // 200ms - Transitions standard
tokens.motion.duration.slow   // 300ms - Animations complexes
tokens.motion.duration.slower // 500ms - Animations narratives
```

---

## ♿ Accessibilité

### Labels et ARIA

```tsx
// ✅ Bon
<button aria-label="Fermer le menu">
  <X className="w-4 h-4" />
</button>

<input
  type="email"
  id="email"
  aria-describedby="email-error"
/>
<span id="email-error" role="alert">Email invalide</span>
```

### Focus Visible

Tous les éléments interactifs doivent avoir un état focus visible :

```css
.button:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 2px;
}
```

### Contraste

Minimum WCAG AA (4.5:1 pour texte normal, 3:1 pour texte large) :

- Texte sur fond clair : `text-ink` (#1C2B21)
- Texte secondaire : `text-ink/60` (60% opacité)
- Texte désactivé : `text-ink/40` (40% opacité)

---

## 📱 Responsive Design

### Breakpoints

```typescript
sm:  640px  // Mobile large
md:  768px  // Tablette
lg:  1024px // Desktop
xl:  1280px // Desktop large
2xl: 1536px // Desktop XL
```

### Mobile First

Toujours coder mobile-first :

```tsx
// ✅ Bon
<div className="text-sm md:text-base lg:text-lg">
  Texte responsive
</div>

// ❌ Mauvais
<div className="text-lg md:text-sm">
  Texte responsive
</div>
```

---

## 🔒 Sécurité

### Validation Côté Serveur

**Toujours valider côté serveur**, même si validation côté client :

```typescript
// Client: validation UX
if (!email.includes('@')) {
  toast.error('Email invalide');
  return;
}

// Serveur: validation sécurité (RPC/API)
const { data, error } = await supabase.rpc('validate_email', { email });
```

### Sanitization

```typescript
import { sanitizeTextInput } from '@/lib/utils';

const cleanInput = sanitizeTextInput(userInput);
```

---

## 🧪 Tests

### Nommage

```typescript
describe('ProductCard', () => {
  it('should display product name', () => { ... });
  it('should call onAddToCart when button clicked', () => { ... });
});
```

### Couverture Minimale

- Composants UI : 80%
- Services critiques : 90%
- Utilitaires : 100%

---

## 📦 Performance

### Code Splitting

Utiliser `React.lazy` pour les routes :

```typescript
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
```

### Images

```tsx
<img
  src={product.image}
  alt={product.name}
  width="400"
  height="500"
  loading="lazy"
/>
```

### Memoization

```typescript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

---

## 🎯 Bonnes Pratiques

### 1. Composants Petits et Focalisés

Un composant = une responsabilité

### 2. Props Explicites

```typescript
// ✅ Bon
interface Props {
  productId: string;
  onSuccess: (orderId: string) => void;
}

// ❌ Mauvais
interface Props {
  data: any;
  callback: Function;
}
```

### 3. Gestion d'Erreurs

```typescript
try {
  await riskyOperation();
} catch (error: unknown) {
  const message = getErrorMessage(error);
  toast.error(message);
  console.error('Operation failed:', error);
}
```

### 4. Loading States

Toujours afficher un état de chargement :

```tsx
{isLoading ? (
  <Loading text="Chargement des produits..." />
) : (
  <ProductList products={products} />
)}
```

---

## 📚 Ressources

- [Tokens de Design](./src/styles/tokens.ts)
- [Composants UI](./src/components/ui/)
- [Hooks](./src/hooks/)
- [Task Full](./task-full.md)
- [Progress Report](./PROGRESS_REPORT.md)

---

**Dernière mise à jour:** 2 Juin 2026  
**Version:** 1.0.0
