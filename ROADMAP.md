# Roadmap - Véridian

Cette roadmap détaille les prochaines étapes de développement pour transformer Véridian d'un prototype fonctionnel premium en une plateforme e-commerce de production complète.

## 🟢 Phase 1 : Fondation & Esthétique (Terminée)
- [x] Structure Multi-Environnements (Store, POS, Admin, Screen).
- [x] Design "Editorial Aesthetic" (Polices Playfair/Inter, palette de couleurs premium).
- [x] Intégration du catalogue "Trompe-l'œil" (Mock DB).
- [x] Panier d'achat global géré avec Zustand.
- [x] **Ava** : Assistant vocal IA bidirectionnel implémenté avec Gemini Live API via WebSockets.
- [x] Configuration serveur Express Full-stack avec SSR/Serveur statique Vite combiné.

## 🟡 Phase 2 : Persistance & Authentification (En cours / Prochaines étapes)
L'objectif de cette phase est de remplacer les données statiques (Mocks) par une architecture Cloud.

- [ ] **Base de données Cloud (Supabase/PostgreSQL)**
  - Création des tables : `products`, `users`, `orders`, `loyalty_points`.
  - Migration des produits "mockés" vers la base de données.
- [ ] **Authentification Utilisateur (Client & Admin)**
  - Inscription et connexion par email/mot de passe ou réseaux sociaux.
  - Sauvegarde du panier et des favoris liés à la session utilisateur.
  - Accès sécurisé au tableau de bord `/admin` (RBAC).
- [ ] **Paiement et Intégration Stripe**
  - Ajout de Stripe Elements pour finaliser le checkout en ligne.
  - Génération de reçus dynamiques.
  - Webhooks pour mettre à jour le statut des commandes côté serveur.

## 🟠 Phase 3 : Enrichissement de l'Intelligence Artificielle (Ava 2.0)
Améliorer les capacités du "Chef Pâtissier IA" pour agir comme un vrai conseiller technique et commercial.

- [ ] **RAG (Retrieval-Augmented Generation) pour l'IA**
  - Connecter l'assistant vocal à la base de données réelle (Supabase) pour tenir compte de l'état des stocks en temps réel.
  - Personnalisation : Ava se souvient des achats précédents des clients connectés (ex: "Vous aviez aimé *La Noisette*, voulez-vous essayer *Le Grain de Café* aujourd'hui ?").
- [ ] **Actions Vocales (Function Calling)**
  - Permettre à l'IA d'ajouter directement un produit au panier via la voix ("Ava, ajoute deux Citrons Jaunes à ma commande").
  - Application de codes promotionnels via reconnaissance vocale.
- [ ] **Analyse des sentiments Magasin**
  - Analyser l'humeur du client via l'API audio pour adapter l'enthousiasme, le ton ou les recommandations.

## 🔴 Phase 4 : Opérations & Omnicanalité Avancées
- [ ] **Programme de Fidélité & Parrainage**
  - Système de points automatisé après chaque achat (en ligne ou POS).
  - Génération de liens de parrainage uniques via le tableau de bord client.
- [ ] **Amélioration du Point de Vente (POS)**
  - Intégration avec des périphériques matériels (Douchette Code-barres USB, Imprimante de reçus thermique).
  - Gestion des retours en magasin et annulation de commande express.
- [ ] **Logistique & Expédition**
  - Intégration des APIs de livraison (ex: ShipEngine) avec calcul des frais en direct.
  - Cartographie interactive pour sélectionner un magasin en "Click & Collect".
- [ ] **Tableau de bord Admin avancé**
  - Visualisation des ventes dynamiques avec `recharts` ou `d3`.
  - Suggestions intelligentes de réapprovisionnement basées sur des prédictions IA.
