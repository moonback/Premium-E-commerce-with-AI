/**
 * Explicit column lists for Supabase select() queries.
 *
 * Security:  prevents future sensitive columns from being auto-exposed.
 * Performance: reduces wire payload to only what the UI needs.
 *
 * Convention: RESOURCE_COLUMNS  = all columns the frontend ever needs.
 *            RESOURCE_COLUMNS_LITE = minimal subset for lists/catalogs.
 */

// ── Products ─────────────────────────────────────────────────────────────────
export const PRODUCT_COLUMNS = [
  'id', 'name', 'description', 'price', 'purchase_price', 'image',
  'categories', 'effects', 'stock', 'isNew', 'specs', 'rating',
  'is_batch_product', 'batch_size', 'batch_unit',
  'seo', 'badges', 'promotion', 'total_sales',
  'embedding_updated_at',
].join(',');

/** Lightweight product columns for inventory views (no SEO, no specs). */
export const PRODUCT_COLUMNS_INVENTORY = [
  'id', 'name', 'price', 'stock', 'image', 'categories',
].join(',');

/** Product columns used by the embedding/vectorization service. */
export const PRODUCT_COLUMNS_EMBEDDING = [
  'id', 'name', 'description', 'price', 'categories', 'effects',
  'specs', 'embedding_updated_at',
].join(',');

// ── Categories ───────────────────────────────────────────────────────────────
export const CATEGORY_COLUMNS = [
  'id', 'name', 'parent_id', 'level', 'image_url', 'description', 'seo',
].join(',');

// ── Profiles ─────────────────────────────────────────────────────────────────
export const PROFILE_COLUMNS = [
  'id', 'email', 'role', 'address', 'phone', 'loyalty_points',
  'address_line1', 'address_line2', 'city', 'postal_code', 'country',
].join(',');

/** Admin customer list — includes metadata columns. */
export const PROFILE_COLUMNS_ADMIN = [
  'id', 'email', 'role', 'address', 'phone', 'loyalty_points',
  'address_line1', 'address_line2', 'city', 'postal_code', 'country',
  'created_at', 'updated_at',
].join(',');

// ── Addresses ────────────────────────────────────────────────────────────────
export const ADDRESS_COLUMNS = [
  'id', 'user_id', 'label', 'address_line1', 'address_line2',
  'city', 'postal_code', 'country', 'is_default',
].join(',');

// ── Wishlist ─────────────────────────────────────────────────────────────────
export const WISHLIST_COLUMNS = [
  'id', 'user_id', 'product_id', 'created_at',
].join(',');

// ── Orders ───────────────────────────────────────────────────────────────────
export const ORDER_COLUMNS = [
  'id', 'user_id', 'order_number', 'status', 'payment_status',
  'total', 'items', 'created_at', 'client_info', 'delivery_method',
  'discount_code', 'discount_total',
].join(',');

// ── Discounts ────────────────────────────────────────────────────────────────
export const DISCOUNT_COLUMNS = [
  'id', 'code', 'type', 'value', 'is_active',
  'valid_from', 'valid_until', 'max_uses', 'current_uses',
  'min_order_amount', 'eligible_products', 'eligible_categories',
  'created_at', 'updated_at',
].join(',');

// ── Store Settings ───────────────────────────────────────────────────────────
export const STORE_SETTINGS_COLUMNS = [
  'id', 'store_name', 'store_email', 'store_phone', 'store_address',
  'store_description', 'store_logo_url',
  'currency', 'tax_rate', 'shipping_fee', 'free_shipping_threshold', 'low_stock_threshold',
  'enable_notifications', 'enable_email_notifications', 'enable_sms_notifications', 'notification_email',
  'enable_analytics', 'google_analytics_id', 'facebook_pixel_id',
  'default_meta_title', 'default_meta_description', 'default_meta_keywords',
  'facebook_url', 'instagram_url', 'twitter_url', 'linkedin_url',
  'maintenance_mode', 'maintenance_message',
  'auto_publish_products', 'require_product_approval', 'enable_product_reviews', 'enable_wishlist',
  'enable_stripe', 'stripe_public_key', 'enable_paypal', 'paypal_client_id',
  'created_at', 'updated_at',
].join(',');

// ── Shipping Carriers ────────────────────────────────────────────────────────
export const SHIPPING_CARRIER_COLUMNS = [
  'id', 'name', 'slug', 'logo_url', 'carrier_type', 'description',
  'base_price', 'free_above', 'extra_kg_price',
  'min_days', 'max_days', 'is_active', 'available_countries',
  'max_weight_kg', 'tracking_url_template', 'display_order',
  'created_at', 'updated_at',
].join(',');

// ── Product Reviews ──────────────────────────────────────────────────────────
export const REVIEW_COLUMNS = [
  'id', 'product_id', 'user_id', 'rating', 'body',
  'is_published', 'created_at',
].join(',');

// ── Mega Menu ────────────────────────────────────────────────────────────────
export const MEGA_MENU_ITEM_COLUMNS = [
  'id', 'label', 'category_id', 'is_active', 'order', 'created_at', 'updated_at',
].join(',');

export const MEGA_MENU_COLUMN_COLUMNS = [
  'id', 'menu_item_id', 'title', 'order', 'highlight', 'background_color', 'created_at', 'updated_at',
].join(',');

export const MEGA_MENU_LINK_COLUMNS = [
  'id', 'column_id', 'label', 'type', 'url', 'category_id', 'product_id', 'icon', 'description', 'image_url', 'order', 'created_at', 'updated_at',
].join(',');

// ── Audit Events ─────────────────────────────────────────────────────────────
export const AUDIT_EVENT_COLUMNS = [
  'id', 'actor_id', 'action', 'entity_type', 'entity_id', 'before', 'after', 'created_at',
].join(',');
