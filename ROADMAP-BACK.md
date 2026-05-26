# ⚙️ Roadmap Backend & Admin - Véridian

Ce document détaille l'évolution de l'infrastructure logicielle (Supabase, API, WebSockets) ainsi que la gestion interne pour la boutique via le Back-Office (Admin).

## 🟢 Phase 1 : Base de Données (Supabase) & Authentification
- [x] Schéma initial : `products`, `profiles`, `orders`, `order_items`.
- [x] Triggers automatiques : Création de profil auto lors de l'inscription via Auth.
- [x] Fonction de synchronisation du catalogue ("Sync Catalogue").
- [ ] **Gestion des Images (Storage)** : Créer un bucket `product-images` sur Supabase pour remplacer les URLs en dur par des fichiers hébergés et gérés par l'admin.
- [ ] **Politiques RLS Avancées** : Renforcer la Row Level Security pour empêcher un client de voir les commandes d'un autre client, même via l'API.

## 🟡 Phase 2 : Tableau de Bord Administrateur (CRUD)
- [x] Layout Dashboard avec statistiques factices.
- [x] Interface simple de gestion des Produits (Ajout, Modification, Suppression).
- [ ] **Upload d'Images (UI)** : Intégration du composant uploader depuis l'Admin vers Supabase Storage.
- [ ] **Gestion des Commandes (Kanban)** : Transformer la liste des commandes en un véritable outil de préparation en cuisine : "Nouvelle" -> "En Préparation" -> "Prête" -> "Livrée".
- [ ] **Statistiques Réelles** : Connecter les 4 cartes du haut (Ventes du jour, Commandes actives, Total Clients) aux véritables agrégations de la table `orders`.
- [ ] **Gestion des Stocks Automatisée** : Décrémentation automatique du stock produit lors d'une commande passée et terminée. Alertes de stock faible.

## 🟠 Phase 3 : APIs Internes & Externes
- [ ] **Paiement (Stripe)** : Intégrer l'API Stripe pour générer des Payment Intents et récupérer les événements de réussite de paiement via Webhooks.
- [ ] **Notifications Emails (Resend/SendGrid)** : Envoi d'emails transactionnels :
  - "Bienvenue chez Véridian"
  - "Votre commande #123 est confirmée"
  - "Votre commande est prête à être retirée"
- [ ] **Endpoints Serveurs Sécurisés** : Protéger `/api/checkout` et `/api/loyalty` en vérifiant le JWT utilisateur côté serveur Node (Express) avant manipulation des données sensibles.

## 🔴 Phase 4 : Temps Réel (WebSockets) & Sync Magasin
- [ ] **Supabase Realtime** : Activer le temps réel sur la table `orders`.
- [ ] **Sync Cuisine / Écran Client** : Lorsqu'une commande passe au statut "Prête" dans le `/admin` ou le `/pos`, le `/screen` doit se mettre à jour instantanément.
- [ ] **Assistant Vocal "Ava" Multi-écrans** : Connecter le retour de l'assistant de sorte qu'il sache quelles pâtisseries sont en rupture de stock en interrogeant la BD en temps réel pendant le dialogue client.

## 🚨 Phase 5 : Sécurité & Déploiement
- [ ] **Sauvegardes Automatiques (Backups)** : Automatisation des snapshots de la base de données (Produits & Profils clients).
- [ ] **Tests d'Intégration** : Mettre en place Jest / Supertest sur le backend Express pour éviter les régressions financières.
- [ ] **Logs d'Audits** : Tracer qui (quel admin) a modifié le prix ou le stock de quel produit (table `audit_logs`).
