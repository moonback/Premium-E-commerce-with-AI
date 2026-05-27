# Véridian — Task List

> Audit généré le 27/05/2026 · 28 fichiers analysés · 24 améliorations identifiées

---

## 🔴 Haute priorité — Impact immédiat

### 1. Hero Banner StoreFront
**Fichiers :** `src/pages/StoreFront.tsx`
- [x] Créer une section `HeroBanner` en haut de la page avec image plein-largeur
- [x] Intégrer la typographie Playfair Display immersive + sous-titre éditorial
- [x] Ajouter un CTA principal "Découvrir la collection"
- [x] Animer l'apparition avec Framer Motion (`motion.div` + `initial/animate`)
- [x] Rendre responsive (hauteur réduite sur mobile)

---

### 2. ProductCard redesign premium
**Fichiers :** `src/components/ProductCard.tsx`
- [x] Ajouter un overlay gradient au hover avec AnimatePresence
- [x] Implémenter un badge "Nouveau" / "Rupture de stock" conditionnel
- [x] Micro-animation scale (`whileHover={{ scale: 1.03 }}`) sur la carte
- [x] Animation "article ajouté" au clic sur le bouton panier (scale spring)
- [x] Afficher le nombre de stock restant si < 5

---

### 3. Catégories visuelles (icônes/miniatures)
**Fichiers :** `src/pages/StoreFront.tsx`
- [ ] Remplacer les onglets texte par des pills visuelles avec icônes Lucide
- [ ] Assigner une couleur d'accent par famille de catégorie
- [ ] Animer l'indicateur actif avec `layoutId` Framer Motion
- [ ] Adapter le rendu mobile (scroll horizontal)

---

### 4. Code promo + jauge livraison gratuite
**Fichiers :** `src/components/CartDrawer.tsx` · `src/store.ts`
- [ ] Ajouter un champ input "Code de réduction" avec bouton "Appliquer"
- [ ] Créer la logique de validation des codes promo dans le store Zustand
- [ ] Implémenter la barre de progression "Plus que X€ pour la livraison offerte"
- [ ] Définir le seuil de livraison gratuite (ex. 50€) comme constante configurable
- [ ] Afficher le montant réduit dans le récapitulatif

---

### 5. Menu mobile responsive (hamburger drawer)
**Fichiers :** `src/components/Header.tsx`
- [ ] Ajouter un bouton hamburger visible sur mobile (`md:hidden`)
- [ ] Créer un drawer latéral avec navigation complète
- [ ] Animer l'ouverture/fermeture avec `AnimatePresence` + slide-in
- [ ] Inclure liens : Boutique, Mon Compte, Panier, POS (si admin)
- [ ] Fermer le drawer au clic extérieur et à la navigation

---

## 🟡 Priorité moyenne — Qualité utilisateur

### 6. Skeleton loaders sur grille produits
**Fichiers :** `src/pages/StoreFront.tsx` · `src/components/ProductCard.tsx`
- [x] Créer un composant `ProductCardSkeleton` (pulse animation CSS)
- [x] Afficher 8 skeletons quand `isLoadingProducts === true` dans le store
- [x] Ajouter skeleton sur la page ProductDetail pendant le fetch
- [x] Utiliser `animate-pulse` Tailwind ou keyframes CSS custom

---

### 7. Micro-animation panier (badge animé Header)
**Fichiers :** `src/components/Header.tsx` · `src/components/ProductCard.tsx`
- [x] Animer le badge numérique du panier au changement (scale bounce)
- [x] Ajouter un effet "flying item" optionnel de la carte vers le panier
- [x] Utiliser `useEffect` + `motion.span` avec `key={cartCount}` pour re-trigger

---

### 8. Jauge fidélité VIP animée
**Fichiers :** `src/components/ProfileInfo.tsx` · `src/pages/Profile.tsx`
- [ ] Définir les seuils : Bronze (0), Argent (500), Or (1500), Céleste (3000)
- [ ] Créer une barre de progression animée (`motion.div` width transition)
- [ ] Afficher "Plus que X points pour le rang Or"
- [ ] Ajouter les badges de rang avec icônes

---

### 9. Transitions de pages fluides
**Fichiers :** `src/App.tsx` · `src/components/StoreLayout.tsx`
- [x] Wrapper les `<Routes>` avec `AnimatePresence mode="wait"`
- [x] Créer un composant `PageTransition` réutilisable (`opacity` + `y` slide)
- [x] Appliquer sur StoreFront → ProductDetail notamment
- [x] Durée courte (0.2s) pour ne pas ralentir la navigation

---

### 10. Kanban commandes Admin
**Fichiers :** `src/components/AdminOrdersList.tsx` · `src/components/KitchenOrders.tsx`
- [ ] Transformer le tableau en colonnes Kanban : Nouvelle / En préparation / Prête / Livrée
- [ ] Implémenter le drag-and-drop (ou boutons fléchés comme fallback)
- [ ] Maintenir le realtime Supabase `postgres_changes` existant
- [ ] Couleur par colonne (bleu / orange / vert / violet)

---

### 11. Onde vocale Ava (visualiseur audio)
**Fichiers :** `src/components/VoiceAssistant.tsx`
- [ ] Créer un visualiseur SVG animé avec barres ou cercles pulsants
- [ ] Activer l'animation quand `isRecording === true`
- [ ] Ajouter une bulle d'onboarding au premier chargement ("Besoin d'un conseil ?")
- [ ] Toast flottant quand Ava déclenche `addToCart` ("Ava a ajouté X au panier")

---

### 12. Carnet d'adresses sauvegardées
**Fichiers :** `src/pages/Profile.tsx` · `src/store.ts`
- [ ] Créer une section "Mes adresses" dans la page Profil
- [ ] CRUD complet connecté à la table `profiles` Supabase
- [ ] Pré-remplir le checkout avec l'adresse par défaut
- [ ] Formulaire d'ajout/modification d'adresse avec validation

---

### 13. Graphiques Admin avec vraies données
**Fichiers :** `src/pages/Admin.tsx`
- [ ] Brancher les charts Recharts (déjà importés) sur les vraies données orders
- [ ] Graphique CA par jour (7 derniers jours)
- [ ] Graphique répartition statuts commandes (pie/donut)
- [ ] Ajouter un sélecteur de période (7j / 30j / 90j)

---

### 14. Paramètres de compte (modifier profil)
**Fichiers :** `src/pages/Profile.tsx` · `src/components/ProfileInfo.tsx`
- [ ] Formulaire éditable : Nom, Prénom, Téléphone
- [ ] Bouton "Changer le mot de passe" via `supabase.auth.updateUser`
- [ ] Sauvegarde dans la table `profiles` avec feedback toast

---

## 🔵 Amélioration progressive

### 15. Newsletter footer
**Fichiers :** `src/components/Footer.tsx`
- [ ] Ajouter un champ email + bouton "S'abonner"
- [ ] Icônes réseaux sociaux (Instagram, Facebook, TikTok) avec liens
- [ ] Validation email simple côté client

---

### 16. Fil d'Ariane (breadcrumbs) sur ProductDetail
**Fichiers :** `src/pages/ProductDetail.tsx`
- [ ] Construire dynamiquement : Accueil > Catégorie > Nom du produit
- [ ] Utiliser `useParams` + le store pour résoudre la catégorie
- [ ] Liens cliquables vers chaque niveau

---

### 17. Swipe-to-delete panier mobile
**Fichiers :** `src/components/CartDrawer.tsx`
- [ ] Implémenter le swipe horizontal sur les lignes panier avec `motion.div`
- [ ] Seuil de suppression à 80px de déplacement
- [ ] Animation de disparition à la suppression

---

### 18. POS pavé tactile tablette
**Fichiers :** `src/pages/POS.tsx`
- [ ] Agrandir toutes les zones de touche (min 48px height)
- [ ] Ajouter un numpad dédié pour la saisie des quantités
- [ ] Layout optimisé landscape tablette (2 colonnes produits + récap)

---

### 19. StoreScreen — état commandes temps réel
**Fichiers :** `src/pages/StoreScreen.tsx`
- [ ] Ajouter un bandeau en bas avec commandes "En préparation" et "Prêtes"
- [ ] Connexion Supabase Realtime sur la table `orders`
- [ ] Animation défilement horizontal si plusieurs commandes

---

### 20. RLS Supabase — sécurisation orders
**Fichiers :** `supabase/migrations/`
- [ ] Créer une migration pour restreindre `SELECT orders` à `user_id = auth.uid()`
- [ ] Garder l'accès total pour le rôle `service_role` (admin)
- [ ] Tester la politique avec un compte non-admin

---

## 🔧 Bugs & Dette technique

- [ ] **`window.confirm`** dans Admin.tsx et AdminOrdersList.tsx — remplacer par des modales de confirmation custom (UX mobile cassée avec `window.confirm`)
- [ ] **`any` TypeScript** dans plusieurs composants (`store.ts`, `Admin.tsx`) — typer correctement les retours Supabase
- [ ] **`Math.random()` pour les noms de fichiers** dans l'upload image — utiliser `crypto.randomUUID()` à la place
- [ ] **Loyauté hardcodée à 1250** dans `store.ts` — s'assurer que la valeur Supabase écrase toujours la valeur par défaut
- [ ] **Erreur silencieuse** dans `fetchUserProfile` — logger et afficher un toast si le profil ne peut pas être créé

---

## ✅ Déjà implémenté

- [x] Toasts `react-hot-toast` sur toutes les actions
- [x] Mode sombre automatique (`prefers-color-scheme`) avec variables CSS
- [x] Galerie multi-images + accordéons animés sur ProductDetail
- [x] Historique commandes réel (Supabase) dans le Profil
- [x] CRUD produits Admin + upload image Supabase Storage
- [x] Stats Admin en temps réel (ventes, commandes, clients)
- [x] Checkout multi-étapes connecté Supabase + points fidélité
- [x] Catégories hiérarchiques 3 niveaux avec validation
- [x] Assistant vocal Ava (Gemini Live API via WebSockets)
- [x] Realtime commandes via `supabase.channel` dans AdminOrdersList
- [x] Framer Motion installé + AccordionItem animé
- [x] Glassmorphism + palette éditoriale (bg coquille d'œuf, ink, accent doré)

---

*Véridian · Premium E-commerce with AI · 2026*