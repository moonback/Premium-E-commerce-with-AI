# Véridian - L'Illusion Gourmande

Véridian est une plateforme e-commerce premium spécialisée dans les pâtisseries trompe-l'œil artisanales. Conçue avec une approche "Editorial Aesthetic", l'application offre une expérience omnicanale complète, allant de la boutique en ligne à la caisse en magasin (POS), en passant par un assistant vocal IA temps réel.

## 🌟 Fonctionnalités Principales

L'application est divisée en 4 environnements distincts, accessibles via la barre de navigation rapide en bas à gauche :

1. **Boutique en Ligne (Client)** `/`
   - Catalogue premium avec filtres par catégorie (Fruits, Gourmandise, Noix & Graines).
   - Recherche sémantique par saveurs et textures.
   - Tiroir de panier élégant et fluide.
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

5. **Écran Magasin (Digital Signage)** `/screen`
   - Affichage dynamique pour la vitrine ou l'intérieur du magasin physique.
   - Rotation automatique des produits phares en plein écran avec une esthétique cinématographique.

## 🛠 Stack Technique

- **Frontend** : React 19, TypeScript, Vite.
- **Styling** : Tailwind CSS v4, conception "Editorial Aesthetic" avec typographie (Playfair Display, Inter).
- **Animations** : Motion (Framer Motion).
- **State Management** : Zustand (Gestion du panier, produits, favoris).
- **Routing** : React Router DOM.
- **Backend & AI** : Serveur Express.js, WebSockets (`ws`), API Google GenAI (Live Realtime API "Gemini 3.1 Flash").

## 🚀 Installation & Lancement

### Prérequis
- Node.js (v18+)
- Une clé API Google Gemini

### Configuration
1. Clonez le dépôt et installez les dépendances :
   ```bash
   npm install
   ```
2. Modifiez ou créez le fichier `.env` à la racine pour ajouter votre clé API Gemini :
   ```env
   GEMINI_API_KEY="votre_cle_api_gemini"
   ```

### Lancement (Dev server)
Lancez simultanément le serveur frontend (Vite) et backend (Express/WebSocket) :
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
Le thème visuel repose sur le concept **Editorial Aesthetic** :
- **Couleurs** : Fond coquille d'œuf (`#F9F7F2`), texte Encre (`#1C2B21`), accents dorés/terre (`#B08D57`) et vert doux (`#E8EDE8`).
- **Composants "Glassmorphism"** : Navigation et widgets semi-transparents avec flou d'arrière-plan.
- **Micro-interactions** : Animations fluides sur les ajouts au panier, survols des produits et l'onde vocale de l'IA.
