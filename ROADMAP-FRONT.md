# 🎨 Roadmap Frontend - Véridian

Ce document détaille les prochaines étapes de développement pour l'interface client (Frontend), en se concentrant sur l'UI/UX, le parcours d'achat et l'expérience en Point de Vente.

## 🟢 Phase 1 : Système de Design & UX Globale
- [x] Implémentation du système de notifications (Toasts avec `react-hot-toast`).
- [x] Menu de navigation Mobile (Menu Burger).
- [x] **Skeletons Loaders** : Afficher des "fantômes" de chargement pendant la récupération des produits Supabase pour éviter les sauts d'interface.
- [x] **Micro-Interactions** : Animations au survol plus poussées (effets magnétiques sur les boutons principaux, apparition en fondu des éléments au scroll avec `motion`).
- [x] **Thème Sombre** : Mode "Nuit" automatique respectant la charte éditoriale (fond charcoal, texte crème).

## 🟡 Phase 2 : Vitrine (StoreFront) & Découverte
- [x] Hero Banner avec image d'ambiance et typographie immersive.
- [ ] **Filtres Avancés** : Remplacer les boutons "Catégories" textuels par une navigation par icônes ou images miniatures.
- [ ] **Recommandations Dynamiques** : Section "Les créations du mois" ou "Sélection du Chef" mise en avant dynamiquement.
- [ ] **Animations de Transition** : Transistions fluides (Page Transitions) entre l'accueil et le détail d'un produit.

## 🟡 Phase 3 : Page Produit (Product Detail)
- [x] Layout principal avec description, prix, ajout au panier, stock.
- [x] **Galerie Multimédia** : Carrousel d'images permettant d'afficher le produit sous plusieurs angles et une vue "à la coupe" du trompe-l'œil.
- [x] **Fiches Techniques (Accordéons)** : Sections dépliantes pour "Allergènes", "Conseils de dégustation", "Valeurs nutritionnelles".
- [x] **Cross-Selling** : Ajout d'une section "S'accorde parfaitement avec..." (suggestions de thés/cafés ou autres produits).
- [x] **Avis Clients** : Affichage d'étoiles et commentaires vérifiés.

## 🟠 Phase 4 : Panier & Checkout (Expérience d'Achat)
- [x] Panier latéral (CartDrawer) avec jauge de livraison gratuite.
- [ ] **Parcours de Checkout Multi-étapes** : Transformer le bouton actuel en un vrai tunnel : 
  1. Panier (actuel)
  2. Informations Client & Livraison (Click & Collect vs Coursier)
  3. Paiement
- [ ] **Swipe-to-delete** : Permettre de supprimer un article du panier en swipant sur mobile.
- [ ] **Codes Promo** : Champ de saisie dynamique dans le panier.

## 🟠 Phase 5 : Espace Client (Profile)
- [x] Page Profil basique avec statut VIP et historique vide.
- [x] Branchement réel de l'historique des commandes Supabase.
- [ ] **Jauge de Fidélité Interactive** : Barre de progression animée indiquant le nombre de points manquants avant le prochain pallier/cadeau.
- [ ] **Paramètres du Compte** : Formulaires pour modifier nom, prénom, téléphone et mot de passe.
- [ ] **Carnet d'Adresses** : Gestion des adresses sauvegardées.

## 🔴 Phase 6 : Point de Vente (POS) & Vitrine (Screen)
- [ ] **POS - Pavé Tactile Numérique** : Rendre le `/pos` 100% "Tablet-friendly" avec de gros boutons d'action.
- [ ] **POS - Identification Client** : Mode scan (QR Code virtuel) pour identifier un client en boutique et lui créditer ses points Céleste.
- [ ] **Screen - État des Commandes Temps Réel** : Affichage dynamique des commandes en cours de préparation (sync WebSockets).
