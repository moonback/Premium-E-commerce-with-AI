# Plan d'Implémentation et Analyse UI/UX - Véridian

Ce document propose une analyse complète de l'application **Véridian** (pâtisserie premium trompe-l'œil), page par page, en identifiant les composants manquants, les optimisations UI (Interface Utilisateur) et UX (Expérience Utilisateur) nécessaires pour atteindre un standard de qualité de production.

## 1. Améliorations Globales (Système de Design)
- **UI** :
  - Ajouter des **Skeleton Loaders** (écrans de chargement fantômes) pendant la récupération des données (vers Supabase) pour éviter la page vide avant affichage.
  - Implémenter des **Toasts / Notifications** élégantes pour les succès/erreurs (ex: "Produit ajouté au panier", "Connexion réussie").
  - Ajouter un menu mobile coulissant (Mobile Drawer Menu) pour la navigation, le `Header` étant actuellement surtout pensé pour desktop.
- **UX** :
  - Rendre les erreurs de formulaires de connexion plus lisibles et contextualisées.
  - Animations de transitions de pages fluides (`motion` entre le Store et la vue détaillée).

---

## 2. Analyse page par page

### 2.1. StoreFront (Boutique principale - `/`)
- **Existant** : Grille de produits, barre de recherche textuelle.
- **Manquant (UI/UX)** :
  - **Hero Banner** : Une grande bannière immersive en haut de page (vidéo/image cinématique d'un coulis au centre de la pâtisserie).
  - **Catégorisation Visuelle** : Remplacer les onglets simples par de belles icônes ou photos miniatures de catégories (Fruits, Chocolat, Créations Signature).
  - **Section "Recommandations du Chef"** : Mettre en évidence 3 ou 4 produits clés.

### 2.2. ProductDetail (Détail Produit - `/product/:id`)
- **Existant** : Image principale, description, ajout au panier, stock, ingrédients.
- **Manquant (UI/UX)** :
  - **Galerie Multi-Images** : Afficher le produit sous différents angles et montrer la "coupe" transversale du trompe-l'œil.
  - **Système d'onglets (Accordéons)** : Pour ranger proprement "Allergènes", "Conseils de conservation", et "Valeurs nutritionnelles".
  - **Cross-Selling** : Carrousel "S'accorde parfaitement avec..." (thé, café, autre pâtisserie).
  - **Breadcrumbs (Fil d'Ariane)** : Navigation facilitée (`Accueil > Fruits > Le Citron`).

### 2.3. Profile (Espace Client - `/profile`)
- **Existant** : Informations basiques, points de fidélité, placeholder historique.
- **Manquant (UI/UX)** :
  - **Véritable Historique de Commandes** : Lier l'UI à la table `orders` et `order_items` de Supabase avec suivi de statut (En préparation, Terminée, Annulée).
  - **Gestion de Compte** : Modification du mot de passe, ajout du nom, prénom, numéro de téléphone.
  - **Carnet d'Adresses** : Ajouter, modifier des adresses de facturation et de livraison.
  - **Jauge VIP** : Barre de progression animée pour le programme Céleste ("Plus que 150 points pour obtenir le rang Or").

### 2.4. Admin (Tableau de Bord - `/admin`)
- **Existant** : Métriques factices, layout basique, bouton "Synchroniser Catalogue".
- **Manquant (UI/UX)** :
  - **CRUD Complet Produits** : Interface pour Ajouter, Modifier (prix, image, description) et Supprimer une pâtisserie.
  - **Upload d'Images** : Sélecteur de fichiers connecté à Supabase Storage pour les photos des pâtisseries.
  - **Gestion des Commandes en direct** : Une vue type Kanban (Nouvelle -> En préparation -> Prête) pour les cuisiniers.
  - **Graphiques réels** : Raccorder les charts statiques aux vraies ventes enregistrées.

### 2.5. POS (Caisse Magasin - `/pos`)
- **Existant** : Calcul global, liste de produits, layout orienté caisse.
- **Manquant (UI/UX)** :
  - **Pavé Tactile Numérique** : Boutons élargis pour un usage facile sur tablette en magasin.
  - **Intégration Fidélité Client** : Input ou lecteur (QR code mockup) pour identifier le client en physique et lui créditer ses points.
  - **Ticket de caisse virtuel** : Bloc UI simulant l'impression du reçu ou l'envoi par email après l'encaissement.

### 2.6. StoreScreen (Écran Client - `/screen`)
- **Existant** : Vidéo vitrine et QR Code.
- **Manquant (UI/UX)** :
  - **État des commandes en direct** : Une bande en haut / en bas de l'écran qui affiche les commandes "En préparation" et "Prêtes à collecter" pour le Click&Collect.
  - **Scénarios temporels** : Changer les couleurs ou la publicité diffusée selon le moment de la journée (ex: sombre le soir, lumineux le matin).

---

## 3. Analyse des Composants Isolés

### 3.1. Header & Footer
- **Header** : 
  - Il manque le design responsive poussé (Menu burger sur mobile). 
  - La clarté du panier (ajouter les micro-animations quand un article y "tombe").
- **Footer** : 
  - Ajouter un champ input "Newsletter" pour inciter l'engagement.
  - Liens vers réseaux sociaux stylisés.

### 3.2. CartDrawer (Panier latéral)
- **Manquant** :
  - **Champ "Code de réduction"**.
  - **Barre "Livraison gratuite"** (ex: "Ajoutez 15€ pour obtenir la livraison offerte").
  - Paramètres de livraison (retrait en magasin vs. coursier).
  - Vraie intégration Checkout (qui écrit dans Supabase).

### 3.3. Assistant Vocal "Ava" (VoiceAssistant.tsx)
- **Manquant** :
  - **Onboarding (Bulle info)** : Au premier chargement, faire rebondir l'icône micro avec un texte "Besoin d'un conseil ?".
  - **Onde Vocale (Visualizer)** : Animation du cercle micro quand Ava parle ou écoute pour donner vie à l'IA.
  - **Confirmation Visuelle** : Quand Ava déclenche l'action `addToCart`, afficher un feedback flottant ("Ava a ajouté 'La Noisette' à votre panier").

---

## 4. Feuille de Route Immédiate (Priorités)
Si nous devons prioriser le développement pour combler ces manques ui/ux et logiques :

1. **UX Globale** : Créer le `ToastManager` pour des retours d'actions clairs, et les `Skeletons` pour les listes.
2. **Page Profil** : Activer le checkout du panier pour générer de vraies commandes et peupler l'historique du profil.
3. **Responsive Menu** : Adapter le Header pour mobile (`Menu` icône).
4. **Boutique UI** : Construire une **Hero Banner** sublime sur la page d'accueil pour refléter le côté "premium" de la marque.
5. **Back-office Admin** : Développer le formulaire de création de produits afin de vous rendre autonome sur le catalogue.
