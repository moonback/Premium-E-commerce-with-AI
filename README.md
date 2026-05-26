# Véridian - L'Illusion Gourmande

Véridian est une plateforme e‑commerce premium. Conçue avec une approche **"Editorial Aesthetic"**, l'application offre une expérience omnicanale complète, allant de la boutique en ligne à la caisse en magasin (POS), en passant par un assistant vocal IA temps réel.

## 🌟 Fonctionnalités Principales

L'application est divisée en 4 environnements distincts, accessibles via la barre de navigation rapide en bas à gauche :

1. **Boutique en Ligne (Client)** `/`
   - Catalogue premium avec filtres par catégorie (ex : Vêtements, Accessoires, Maison). 
   - Recherche sémantique par saveurs et textures. 
   - Tiroir de panier élégant et fluide. 
   - **Nouveauté** : les produits peuvent appartenir à **plusieurs catégories** grâce à un tableau `categories` (ex : `["Vêtements","Maison"]`).
   - Design "Editorial", minimaliste et sophistiqué.

2. **Ava - Conseillère Vocale IA** `Widget Global`
   - Intégration de l'API **Gemini Live** via WebSockets.
   - Assistant vocal en temps réel qui dialogue avec l'utilisateur.
   - Recommandations intelligentes basées sur les préférences de goût (fruité, chocolaté, textures).

3. **Point of Sale (POS - Caisse)** `/pos`
   - Interface de caisse optimisée pour le magasin physique.
   - Ajout rapide au panier, recherche de produits et encaissement.
   - Gestion des paiements Espèces ou Carte bancaire.

4. **Dashboard Admin** `/admin`
   - Vue d'ensemble des ventes et des performances.
   - Tableau de bord avec indicateurs clés (CA, commandes actives, clients).
   - Historique des commandes récentes.
   - **Gestion avancée des catégories** : création, édition, déplacement (changement de parent) et suppression, avec support de **3 niveaux** maximum.
   - **Gestion des produits** : ajout/édition avec sélection de **plusieurs catégories** via des cases à cocher.
   - **Upload d'images** : résolu grâce à la création du bucket Supabase `product-images` et aux politiques RLS adéquates.

5. **Écran Magasin (Digital Signage)** `/screen`
   - Affichage dynamique pour la vitrine ou l'intérieur du magasin physique.
   - Rotation automatique des produits phares en plein écran avec une esthétique cinématographique.

## 🛠 Stack Technique

- **Frontend** : React 19, TypeScript, Vite.
- **Styling** : Tailwind CSS v4, typographie (Playfair Display, Inter) et concept "Editorial Aesthetic" avec couleurs douces, glassmorphism et micro‑animations (Framer Motion).
- **State Management** : Zustand (gestion du panier, produits, favoris).
- **Routing** : React Router DOM.
- **Backend & AI** : Serveur Express.js, WebSockets (`ws`), API Google GenAI (Live Realtime API "Gemini 3.1 Flash").
- **Base de données** : Supabase (PostgreSQL) avec table `products` contenant `categories TEXT[]` et bucket `product-images` pour le stockage des images.

## 🚀 Installation & Lancement

### Prérequis
- Node.js (v18+)
- Une clé API Google Gemini

### Configuration
1. Clonez le dépôt et installez les dépendances :
```bash
npm install
```
2. Créez le fichier `.env` à la racine et ajoutez votre clé API Gemini :
```env
GEMINI_API_KEY="votre_cle_api_gemini"
```
3. Appliquez les migrations Supabase (ou exécutez le script `supabase-schema.sql`) :
   - Le script crée la table `products` avec la colonne `categories TEXT[]`.
   - Il crée le bucket `product-images` et les politiques RLS nécessaires.

### Lancement (développement)
```bash
npm run dev
```
L'application sera accessible sur `http://localhost:3000`.

## 📦 Build pour la Production
```bash
npm run build
npm start
```
Le build compile le client React via Vite et le serveur Express via esbuild pour une exécution optimisée dans un conteneur Node.js.

## 🤝 Architecture & Thème
Le thème visuel repose sur le concept **Editorial Aesthetic** :
- **Couleurs** : Fond coquille d'œuf (`#F9F7F2`), texte Encre (`#1C2B21`), accents dorés/terre (`#B08D57`) et vert doux (`#E8EDE8`).
- **Composants "Glassmorphism"** : Navigation et widgets semi‑transparents avec flou d'arrière-plan.
- **Micro‑interactions** : Animations fluides sur les ajouts au panier, survols des produits et l'onde vocale de l'IA.

---
*© 2026 Véridian – Tous droits réservés.*
