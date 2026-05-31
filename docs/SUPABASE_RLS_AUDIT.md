# Audit RLS Supabase — commandes, profils et données sensibles

_Date : 31 mai 2026._

## Périmètre audité

- `supabase/migrations/20260627_create_orders.sql`
- `supabase/migrations/20260628_harden_profiles_roles.sql`
- `supabase/migrations/20260629_restrict_sensitive_commerce_tables.sql`
- `supabase/backup.sql` comme snapshot historique de référence, non comme migration à rejouer en production.

## Findings historiques dans `supabase/backup.sql`

Le backup contient des policies permissives héritées qui expliquent les corrections P0 :

| Policy historique | Table | Risque | Correction attendue |
| --- | --- | --- | --- |
| `Anyone can read orders` | `orders` | Lecture globale de données de commande. | Remplacée par lecture propriétaire ou admin. |
| `Public profiles are viewable by everyone.` | `profiles` | Exposition de profils clients. | Remplacée par lecture profil personnel ou admin. |
| `Users can read their own orders` | `orders` | Correcte seule, mais insuffisante si la policy globale reste active. | Conserver uniquement la policy restrictive consolidée. |

Les policies publiques sur `products` et `categories` restent acceptables pour le catalogue public tant que les écritures restent admin-only.

## Migrations correctives en place

### `20260628_harden_profiles_roles.sql`

- Durcit `public.is_admin()` autour du rôle stocké dans `profiles`.
- Force les nouveaux profils en rôle `customer` au lieu de dériver un rôle depuis l'email.
- Active RLS sur `profiles`, `orders` et `order_items`.
- Remplace les anciennes policies permissives par :
  - `profiles_select_self_or_admin`
  - `profiles_update_self`
  - `orders_select_own_or_admin`
  - `orders_insert_own`
  - `orders_update_admin`
  - `order_items_select_own_or_admin`
  - `order_items_insert_own_order`
  - `order_items_admin_all`

### `20260629_restrict_sensitive_commerce_tables.sql`

- Crée sans suppression les tables sensibles encore absentes : `payments`, `shipments`, `events`, `ai_conversations`, `audit_events`.
- Active RLS sur chaque table.
- Révoque les accès par défaut `anon` et `authenticated` avant de réattribuer des grants minimaux.
- Ajoute des policies propriétaire/admin pour les paiements, livraisons, conversations IA et audit, plus une insertion bornée pour les événements analytiques.
- Documente une stratégie additive et un rollback logique par migration de suivi, sans `DROP TABLE` de production.

## Contrôles automatisés ajoutés

Le test `supabase/securityMigrations.test.ts` vérifie maintenant que :

1. Les migrations de production ne contiennent pas de `DROP TABLE` visant les tables privées ou transactionnelles.
2. Les policies créées sur tables privées ne contiennent pas `USING (true)` ou `WITH CHECK (true)`.
3. La migration des tables sensibles crée bien les tables, active RLS, révoque l'accès anonyme et installe les policies attendues.
4. Les findings historiques du backup restent documentés et reliés aux migrations correctives.

## Scénarios manuels restants sur environnement cible

À exécuter avec deux comptes client distincts et un compte admin réel :

- Client A ne peut pas lire les commandes, `order_items`, paiements, livraisons ou conversations IA du client B.
- Client non connecté ne peut pas lire `profiles`, `orders`, `payments`, `shipments`, `events`, `ai_conversations` ou `audit_events`.
- Admin lit les données nécessaires au support et au fulfillment.
- Un client ne peut pas modifier son rôle via `profiles.update`.
- Les webhooks/service role peuvent encore créer et réconcilier paiements/livraisons sans passer par les policies utilisateur.
