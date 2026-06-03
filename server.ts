import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { createServer, type IncomingMessage } from "http";
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { config as loadDotenv } from "dotenv";
import { DEFAULT_SITE_URL, getProductPath } from "./src/lib/seo";
import { createSkillsEngine } from "./src/lib/skillsEngine";
import {
  vectorizeAllProducts,
  vectorizeProduct,
  semanticSearchProducts,
  formatSemanticResultsForAva,
} from "./src/lib/embeddingService";

// Load .env before anything else (tsx doesn't auto-inject env files)
loadDotenv({ path: ".env" });
loadDotenv({ path: ".env.local", override: true }); // .env.local takes precedence

// ── Validate required environment variables at startup ────────────────────────
// Warn (not throw) so the app can still run in dev without all keys configured.
const REQUIRED_IN_PRODUCTION = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'GEMINI_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
] as const;

if (process.env.NODE_ENV === 'production') {
  const missing = REQUIRED_IN_PRODUCTION.filter(k => !process.env[k] && !process.env[`VITE_${k}`]);
  if (missing.length > 0) {
    console.error(JSON.stringify({
      ts: new Date().toISOString(),
      level: 'error',
      message: 'Missing required environment variables — server will not start',
      missing,
    }));
    process.exit(1);
  }
} else {
  const missing = REQUIRED_IN_PRODUCTION.filter(k => !process.env[k] && !process.env[`VITE_${k}`]);
  if (missing.length > 0) {
    console.warn(JSON.stringify({
      ts: new Date().toISOString(),
      level: 'warn',
      message: 'Some environment variables are not configured — related features will be disabled',
      missing,
    }));
  }
}
import {
  calculatePaymentAmountCents,
  createStripeIdempotencyKey,
  getPaymentIntentErrorStatus,
  getStripeWebhookPayload,
  normalizeCheckoutAttemptId,
  toPaymentStatus,
  toCheckoutAttemptStatus,
  validateWebhookAmountCents,
  validateWebhookCurrency,
  validateDiscount,
  normalizePaymentItems,
} from "./src/services/paymentSecurity";
import type { Request, Response, NextFunction } from "express";
import { randomUUID, randomBytes } from "crypto";
import { MemoryStore, SupabaseStore, rateLimiter, type RateLimitStore } from "./src/middleware/rateLimit";

import { createAdminProductsRouter } from "./server/routes/adminProducts";
import { createAdminCategoriesRouter } from "./server/routes/adminCategories";
import { createAdminSettingsRouter } from "./server/routes/adminSettings";
import { createAdminDiscountsRouter } from "./server/routes/adminDiscounts";
import { createAdminShippingRouter } from "./server/routes/adminShipping";

const LIVE_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const LIVE_MAX_CONNECTIONS_PER_WINDOW = 5;
const LIVE_MAX_ACTIVE_CONNECTIONS = 2;
const LIVE_SESSION_MAX_MS = Number(process.env.LIVE_SESSION_MAX_MS ?? 2 * 60 * 1000);
const GEMINI_LIVE_MODEL = process.env.GEMINI_LIVE_MODEL || "gemini-3.1-flash-live-preview";
const SERVER_STARTED_AT = Date.now();
const IS_PRODUCTION = process.env.NODE_ENV === "production";

type SitemapProductRow = {
  id: string;
  name: string;
  created_at?: string | null;
};

type StripePaymentIntent = {
  id: string;
  client_secret?: string;
  status: string;
  /** Amount in cents as stored by Stripe */
  amount?: number;
};

type LiveRateRecord = {
  windowStart: number;
  count: number;
  active: number;
};

const liveRateLimits = new Map<string, LiveRateRecord>();

// ─── Structured logger ────────────────────────────────────────────────────────
/** Redact sensitive fields before logging */
function redact(obj: Record<string, unknown>): Record<string, unknown> {
  const SENSITIVE = new Set(['email', 'token', 'password', 'authorization', 'secret', 'key', 'access_token']);
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    result[k] = SENSITIVE.has(k.toLowerCase()) ? '[REDACTED]' : v;
  }
  return result;
}

function log(level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>) {
  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ? redact(meta) : {}),
  });
  if (level === 'error') {
    console.error(entry);
  } else if (level === 'warn') {
    console.warn(entry);
  } else {
    console.log(entry);
  }
}

// ─── Request ID middleware ────────────────────────────────────────────────────
function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();
  (req as Request & { requestId: string }).requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}

// ─── Request logger middleware ────────────────────────────────────────────────
function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const requestId = (req as Request & { requestId?: string }).requestId;
    log(res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info', 'http_request', {
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: duration,
    });
  });
  next();
}

// ─── Global error handler ─────────────────────────────────────────────────────
function errorHandlerMiddleware(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const requestId = (req as Request & { requestId?: string }).requestId;
  const message = err instanceof Error ? err.message : 'Internal server error';
  log('error', 'unhandled_error', { requestId, message, path: req.path, method: req.method });
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error', requestId });
  }
}

function getClientIp(request: IncomingMessage) {
  const forwardedFor = request.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }
  return request.socket.remoteAddress || "unknown";
}

function registerLiveConnection(ip: string) {
  const now = Date.now();
  const current = liveRateLimits.get(ip);
  const record = !current || now - current.windowStart > LIVE_RATE_LIMIT_WINDOW_MS
    ? { windowStart: now, count: 0, active: 0 }
    : current;

  if (record.active >= LIVE_MAX_ACTIVE_CONNECTIONS) {
    liveRateLimits.set(ip, record);
    return { allowed: false, reason: "Trop de sessions vocales simultanées." };
  }

  if (record.count >= LIVE_MAX_CONNECTIONS_PER_WINDOW) {
    liveRateLimits.set(ip, record);
    return { allowed: false, reason: "Limite temporaire de sessions vocales atteinte." };
  }

  record.count += 1;
  record.active += 1;
  liveRateLimits.set(ip, record);

  return {
    allowed: true,
    release: () => {
      const latest = liveRateLimits.get(ip);
      if (latest) latest.active = Math.max(0, latest.active - 1);
    },
  };
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sitemapUrl(location: string, lastmod?: string | null) {
  const escapedLocation = escapeXml(location);
  const escapedLastmod = lastmod ? `<lastmod>${escapeXml(lastmod.slice(0, 10))}</lastmod>` : "";
  return `<url><loc>${escapedLocation}</loc>${escapedLastmod}</url>`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = createServer(app);

  // ── Security headers + per-request CSP nonce (TASK-P0-005) ──────────────
  // In production: strict CSP without unsafe-inline.
  //   - script-src: only 'self' + Stripe.js + per-request nonce (no unsafe-inline)
  //   - object-src, base-uri, frame-ancestors: locked down
  //   - connect-src: explicit allowlist including Stripe, Supabase, Gemini
  // In development: Vite HMR requires unsafe-inline/unsafe-eval — not restricted.
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (IS_PRODUCTION) {
      // Per-request nonce — injected into served HTML so any remaining
      // inline scripts (e.g. service worker registration) can be whitelisted
      const nonce = randomBytes(16).toString('base64');
      res.locals.cspNonce = nonce;
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      res.setHeader(
        'Content-Security-Policy',
        [
          "default-src 'self'",
          // No unsafe-inline — Vite production builds emit only external JS files.
          // Nonce is provided for any inline scripts that legitimately need one.
          `script-src 'self' 'nonce-${nonce}' https://js.stripe.com`,
          // Styles may include Stripe Payment Element inline styles — unsafe-inline required
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' https://images.unsplash.com data: blob:",
          "font-src 'self' data:",
          // Stripe requires api.stripe.com + js.stripe.com in connect-src
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://js.stripe.com https://generativelanguage.googleapis.com https://openrouter.ai wss:",
          // Stripe Payment Element renders in iframes from js.stripe.com and hooks.stripe.com
          "frame-src https://js.stripe.com https://hooks.stripe.com",
          // Prevent plugin/Flash injection
          "object-src 'none'",
          // Prevent base-tag hijacking
          "base-uri 'self'",
          // Prevent clickjacking via embedding (belt-and-suspenders with X-Frame-Options)
          "frame-ancestors 'self'",
        ].join('; ')
      );
    }
    next();
  });

  // ── Skills Engine — chargé une fois au démarrage ───────────────────────────
  const skillsEngine = createSkillsEngine(process.cwd());

  // ── Observability middlewares ──────────────────────────────────────────────
  app.use(requestIdMiddleware);
  app.use(requestLoggerMiddleware);

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseAuth = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    : null;
  const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    : null;

  // Mount admin API routes (TASK-P0-007)
  app.use("/api/admin/products", createAdminProductsRouter(supabaseAuth, supabaseAdmin, log));
  app.use("/api/admin/categories", createAdminCategoriesRouter(supabaseAuth, supabaseAdmin, log));
  app.use("/api/admin/settings", createAdminSettingsRouter(supabaseAuth, supabaseAdmin, log));
  app.use("/api/admin/discounts", createAdminDiscountsRouter(supabaseAuth, supabaseAdmin, log));
  app.use("/api/admin/shipping", createAdminShippingRouter(supabaseAuth, supabaseAdmin, log));

  // ── Rate Limiting (TASK-P0-006) ───────────────────────────────────────────
  const rateLimitBackend = process.env.RATE_LIMIT_BACKEND || (supabaseAdmin ? "supabase" : "memory");
  const rateLimitStore: RateLimitStore =
    rateLimitBackend === "supabase" && supabaseAdmin
      ? new SupabaseStore(supabaseAdmin)
      : new MemoryStore();

  const limitPaymentsMax = Number(process.env.RATE_LIMIT_PAYMENTS_LIMIT ?? 5);
  const limitPaymentsWindow = Number(process.env.RATE_LIMIT_PAYMENTS_WINDOW_MS ?? 60 * 1000);

  const limitEventsMax = Number(process.env.RATE_LIMIT_EVENTS_LIMIT ?? 60);
  const limitEventsWindow = Number(process.env.RATE_LIMIT_EVENTS_WINDOW_MS ?? 60 * 1000);

  const limitSearchMax = Number(process.env.RATE_LIMIT_SEARCH_LIMIT ?? 30);
  const limitSearchWindow = Number(process.env.RATE_LIMIT_SEARCH_WINDOW_MS ?? 60 * 1000);

  const limitEnhanceMax = Number(process.env.RATE_LIMIT_ENHANCE_LIMIT ?? 10);
  const limitEnhanceWindow = Number(process.env.RATE_LIMIT_ENHANCE_WINDOW_MS ?? 60 * 1000);

  const limitVectorizeMax = Number(process.env.RATE_LIMIT_VECTORIZE_LIMIT ?? 10);
  const limitVectorizeWindow = Number(process.env.RATE_LIMIT_VECTORIZE_WINDOW_MS ?? 60 * 1000);

  const paymentsRateLimiter = rateLimiter({
    windowMs: limitPaymentsWindow,
    max: limitPaymentsMax,
    prefix: "payments",
    store: rateLimitStore,
    message: "Trop de tentatives de paiement. Veuillez réessayer dans une minute.",
    log,
  });

  const eventsRateLimiter = rateLimiter({
    windowMs: limitEventsWindow,
    max: limitEventsMax,
    prefix: "events",
    store: rateLimitStore,
    log,
  });

  const searchRateLimiter = rateLimiter({
    windowMs: limitSearchWindow,
    max: limitSearchMax,
    prefix: "search",
    store: rateLimitStore,
    message: "Trop de recherches de produits. Veuillez ralentir.",
    log,
  });

  const enhanceRateLimiter = rateLimiter({
    windowMs: limitEnhanceWindow,
    max: limitEnhanceMax,
    prefix: "enhance",
    store: rateLimitStore,
    message: "Trop de demandes d'amélioration de description. Veuillez patienter.",
    log,
  });

  const vectorizeRateLimiter = rateLimiter({
    windowMs: limitVectorizeWindow,
    max: limitVectorizeMax,
    prefix: "vectorize",
    store: rateLimitStore,
    message: "Trop de demandes de vectorisation. Veuillez patienter.",
    log,
  });

  app.post("/api/payments/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    if (!stripeWebhookSecret) {
      res.status(503).json({ error: "Stripe webhook secret is not configured" });
      return;
    }

    const signature = req.header("stripe-signature");
    if (!signature || !Buffer.isBuffer(req.body)) {
      res.status(400).json({ error: "Missing Stripe signature or raw body" });
      return;
    }

    try {
      const event = getStripeWebhookPayload(req.body, signature, stripeWebhookSecret);
      const paymentIntentId = event.data?.object?.id;
      const metadata = event.data?.object?.metadata;
      const checkoutAttemptId = metadata?.checkout_attempt_id;
      const metadataOrderId = metadata?.order_id;

      if (!supabaseAdmin && paymentIntentId && event.type.startsWith("payment_intent.")) {
        log('warn', 'webhook_no_supabase', { paymentIntentId, eventType: event.type });
        res.status(503).json({ error: "Payment reconciliation is not configured" });
        return;
      }

      if (supabaseAdmin && paymentIntentId && event.type.startsWith("payment_intent.")) {
        const status = toPaymentStatus(event.data?.object?.status);
        const requestId = (req as Request & { requestId?: string }).requestId;

        log('info', 'webhook_received', {
          requestId, eventType: event.type, paymentIntentId,
          checkoutAttemptId, metadataOrderId, status,
        });

        // ── Reconcile payments table ──────────────────────────────────────
        const { data: payments, error } = await supabaseAdmin
          .from("payments")
          .update({
            status,
            raw_provider_status: event.data?.object?.status || null,
            metadata: { stripe_event_id: event.id, stripe_event_type: event.type },
            reconciled_at: new Date().toISOString(),
          })
          .eq("provider", "stripe")
          .eq("provider_payment_id", paymentIntentId)
          .select("id, order_id");

        if (error) {
          log('error', 'webhook_payment_reconcile_failed', { requestId, paymentIntentId, error: error.message });
          res.status(500).json({ error: "Payment reconciliation failed" });
          return;
        }

        // ── Determine order ID from payments row or metadata fallback ─────
        let orderId: string | null = null;
        if (payments && payments.length > 0) {
          orderId = payments[0].order_id || null;
        }
        // Fallback: if webhook arrived before the payment row was created,
        // use the order_id from PaymentIntent metadata for reconciliation
        if (!orderId && metadataOrderId) {
          orderId = metadataOrderId;
          log('info', 'webhook_metadata_fallback', { requestId, paymentIntentId, orderId });
        }

        if (!orderId && status === 'paid' && !payments?.length) {
          // Webhook arrived before local payment row — 409 so Stripe retries
          log('warn', 'webhook_ahead_of_local', { requestId, paymentIntentId, eventId: event.id });
          res.status(409).json({ error: "Payment row not ready" });
          return;
        }

        // ── Handle payment outcomes ───────────────────────────────────────
        if (event.type === 'payment_intent.succeeded') {
          // ── Validate amount and currency ────────────────────────────────
          let order: any = null;
          if (orderId) {
            const { data, error: orderFetchError } = await supabaseAdmin
              .from("orders")
              .select("total, payment_status, discount_code")
              .eq("id", orderId)
              .single();

            if (orderFetchError || !data) {
              log('error', 'webhook_order_fetch_failed', { requestId, orderId, error: orderFetchError?.message });
              res.status(400).json({ error: "Linked order not found" });
              return;
            }
            order = data;

            const stripeAmount = event.data?.object?.amount_received;
            const stripeCurrency = event.data?.object?.currency;
            const expectedAmountCents = Math.round(Number(order.total) * 100);

            const isAmountValid = validateWebhookAmountCents(stripeAmount, expectedAmountCents);
            const isCurrencyValid = validateWebhookCurrency(stripeCurrency, 'eur');

            if (!isAmountValid || !isCurrencyValid) {
              log('error', 'payment_discrepancy_detected', {
                requestId,
                paymentIntentId,
                orderId,
                stripeAmount,
                stripeCurrency,
                expectedAmountCents,
              });

              // Write to audit_events
              const action = !isAmountValid ? 'stripe_amount_mismatch' : 'stripe_currency_mismatch';
              await supabaseAdmin.from("audit_events").insert({
                action,
                entity_type: 'order',
                entity_id: orderId,
                before: { total: order.total, currency: 'EUR', payment_status: order.payment_status },
                after: { amount_received: stripeAmount, currency: stripeCurrency, payment_intent_id: paymentIntentId },
                created_at: new Date().toISOString(),
              });

              // Mark order and payments as failed
              await supabaseAdmin
                .from("orders")
                .update({ payment_status: 'failed' as const })
                .eq("id", orderId);

              await supabaseAdmin
                .from("payments")
                .update({ status: 'failed' as const, raw_provider_status: 'failed_mismatch' })
                .eq("provider", "stripe")
                .eq("provider_payment_id", paymentIntentId);

              // Release stock reservations
              if (checkoutAttemptId) {
                await supabaseAdmin.rpc('release_stock_reservations', {
                  p_checkout_attempt_id: checkoutAttemptId,
                  p_new_status: 'failed',
                });
              }

              res.status(400).json({ error: "Payment amount or currency mismatch" });
              return;
            }
          }

          // Increment discount usage if discount_code is present
          if (orderId && order && order.discount_code) {
            const { error: incError } = await supabaseAdmin
              .rpc('increment_discount_usage', { p_code: order.discount_code });
            if (incError) {
              log('error', 'webhook_increment_discount_failed', { requestId, orderId, code: order.discount_code, error: incError.message });
            } else {
              log('info', 'webhook_discount_incremented', { requestId, orderId, code: order.discount_code });
            }
          }

          // Consume stock reservations (decrement real stock)
          if (checkoutAttemptId) {
            const { error: consumeError } = await supabaseAdmin
              .rpc('consume_stock_reservations', { p_checkout_attempt_id: checkoutAttemptId });
            if (consumeError) {
              log('error', 'webhook_consume_stock_failed', { requestId, checkoutAttemptId, error: consumeError.message });
            } else {
              log('info', 'webhook_stock_consumed', { requestId, checkoutAttemptId });
            }
          }

          // Update order status to 'Nouvelle' (confirmed) and payment_status to 'paid'
          if (orderId) {
            const { error: orderError } = await supabaseAdmin
              .from("orders")
              .update({
                payment_status: 'paid' as const,
                status: 'Nouvelle' as const,
              })
              .eq("id", orderId);
            if (orderError) {
              log('error', 'webhook_order_update_failed', { requestId, orderId, error: orderError.message });
              res.status(500).json({ error: "Order reconciliation failed" });
              return;
            }
          }
        } else if (event.type === 'payment_intent.payment_failed') {
          // Release stock reservations
          if (checkoutAttemptId) {
            const { error: releaseError } = await supabaseAdmin
              .rpc('release_stock_reservations', {
                p_checkout_attempt_id: checkoutAttemptId,
                p_new_status: 'failed',
              });
            if (releaseError) {
              log('error', 'webhook_release_stock_failed', { requestId, checkoutAttemptId, error: releaseError.message });
            } else {
              log('info', 'webhook_stock_released_failed', { requestId, checkoutAttemptId });
            }
          }
          if (orderId) {
            await supabaseAdmin
              .from("orders")
              .update({ payment_status: 'failed' as const })
              .eq("id", orderId);
          }
        } else if (event.type === 'payment_intent.canceled') {
          // Release stock reservations
          if (checkoutAttemptId) {
            const { error: releaseError } = await supabaseAdmin
              .rpc('release_stock_reservations', {
                p_checkout_attempt_id: checkoutAttemptId,
                p_new_status: 'cancelled',
              });
            if (releaseError) {
              log('error', 'webhook_release_stock_cancelled_failed', { requestId, checkoutAttemptId, error: releaseError.message });
            } else {
              log('info', 'webhook_stock_released_cancelled', { requestId, checkoutAttemptId });
            }
          }
          if (orderId) {
            await supabaseAdmin
              .from("orders")
              .update({ payment_status: 'cancelled' as const })
              .eq("id", orderId);
          }
        } else {
          // Other payment_intent events — just update the payment_status on the order
          if (orderId) {
            await supabaseAdmin
              .from("orders")
              .update({ payment_status: status })
              .eq("id", orderId);
          }
        }
      }

      res.json({ received: true });
    } catch (error) {
      log('warn', 'webhook_invalid', { error: error instanceof Error ? error.message : 'unknown' });
      res.status(400).json({ error: "Invalid webhook" });
    }
  });

  app.use(express.json());

  app.get("/robots.txt", (req, res) => {
    const siteUrl = (process.env.SITE_URL || `${req.protocol}://${req.get("host") || "localhost:3000"}`).replace(/\/$/, "");
    res.type("text/plain").send([
      "User-agent: *",
      "Allow: /",
      `Sitemap: ${siteUrl}/sitemap.xml`,
    ].join("\n"));
  });

  app.get("/sitemap.xml", async (req, res) => {
    const siteUrl = (process.env.SITE_URL || `${req.protocol}://${req.get("host") || DEFAULT_SITE_URL}`).replace(/\/$/, "");
    const staticUrls = [
      sitemapUrl(`${siteUrl}/`),
      sitemapUrl(`${siteUrl}/checkout`),
    ];

    let productUrls: string[] = [];
    if (supabaseAuth) {
      const { data, error } = await supabaseAuth
        .from("products")
        .select("id,name,created_at")
        .limit(500);

      if (error) {
        console.warn("Unable to build product sitemap entries", error);
      } else {
        const products = (data ?? []) as SitemapProductRow[];
        productUrls = products.map((product) => sitemapUrl(`${siteUrl}${getProductPath(product)}`, product.created_at));
      }
    }

    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...staticUrls, ...productUrls].join("")}</urlset>`);
  });


  app.post("/api/discounts/validate", async (req, res) => {
    if (!supabaseAdmin) {
      res.status(503).json({ error: "Supabase non configuré" });
      return;
    }

    const code = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '';
    const rawItems = req.body?.items;

    if (!code) {
      res.status(400).json({ error: "Code promo requis" });
      return;
    }

    try {
      const { data: discount, error: fetchError } = await supabaseAdmin
        .from('discounts')
        .select('*')
        .eq('code', code)
        .single();

      if (fetchError || !discount) {
        res.json({ valid: false, error: "Code promo invalide ou expiré" });
        return;
      }

      const items = normalizePaymentItems(rawItems);
      const productIds = items.map(item => item.productId);
      const { data: dbProducts, error: productsError } = await supabaseAdmin
        .from('products')
        .select('id,price,stock,categories')
        .in('id', productIds);

      if (productsError || !dbProducts) {
        res.status(500).json({ error: "Impossible de charger les produits du panier" });
        return;
      }

      const productsMap = new Map(dbProducts.map((p: any) => [p.id, p]));
      const subtotal = items.reduce((sum, item) => {
        const prod = productsMap.get(item.productId);
        return sum + (prod ? Number(prod.price) * item.quantity : 0);
      }, 0);

      const validation = validateDiscount({
        discount: discount as any,
        items,
        products: productsMap as any,
        subtotal,
      });

      res.json(validation);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : "Erreur lors de la validation" });
    }
  });

  app.post("/api/payments/create-intent", paymentsRateLimiter, async (req, res) => {
    if (!stripeSecretKey) {
      res.status(503).json({ error: "Stripe is not configured on the server" });
      return;
    }

    let authenticatedUserId: string | null = null;
    if (supabaseAuth) {
      const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
      if (!token) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }
      const { data, error } = await supabaseAuth.auth.getUser(token);
      if (error || !data.user) {
        res.status(401).json({ error: "Invalid authentication token" });
        return;
      }
      authenticatedUserId = data.user.id;
    }

    const currency = String(req.body?.currency || "eur").toLowerCase();
    const customer = req.body?.customer as { name?: string; email?: string } | undefined;
    const checkoutData = req.body?.checkoutData as {
      clientInfo?: Record<string, string>;
      deliveryMethod?: string;
    } | undefined;
    const discountCode = typeof req.body?.discountCode === 'string' ? req.body.discountCode.trim().toUpperCase() : '';

    if (!/^[a-z]{3}$/.test(currency)) {
      res.status(400).json({ error: "Invalid currency" });
      return;
    }

    const requestId = (req as Request & { requestId?: string }).requestId;

    try {
      const catalogClient = supabaseAdmin || supabaseAuth;
      const { amountCents, itemCount, cartHash, products } = await calculatePaymentAmountCents(catalogClient, req.body?.items);

      const checkoutAttemptId = normalizeCheckoutAttemptId(req.body?.checkoutAttemptId);
      if (!checkoutAttemptId) {
        res.status(400).json({ error: "checkoutAttemptId is required" });
        return;
      }

      // ── Step 0b: Idempotency — reuse existing PaymentIntent if present ────
      // Handles double-clicks, browser refreshes, and network retries.
      // If a PaymentIntent already exists for this checkoutAttemptId and is
      // still in a payable state, return it directly without creating a new one.
      if (supabaseAdmin) {
        const { data: existingAttempt } = await supabaseAdmin
          .from('checkout_attempts')
          .select('payment_intent_id, order_id, status')
          .eq('checkout_attempt_id', checkoutAttemptId)
          .single();

        if (existingAttempt?.payment_intent_id && existingAttempt.status === 'pending') {
          const stripeGetRes = await fetch(
            `https://api.stripe.com/v1/payment_intents/${existingAttempt.payment_intent_id}`,
            { headers: { Authorization: `Bearer ${stripeSecretKey}` } }
          );
          if (stripeGetRes.ok) {
            const existingIntent = await stripeGetRes.json() as StripePaymentIntent;
            // Only reuse if the intent is still in a payable, non-terminal state
            const isReusable =
              existingIntent.client_secret &&
              !['succeeded', 'canceled'].includes(existingIntent.status);

            if (isReusable) {
              const existingOrderId = (existingAttempt.order_id as string | null) ?? null;
              let existingOrderNumber: string | null = null;
              if (existingOrderId) {
                const { data: existingOrder } = await supabaseAdmin
                  .from('orders')
                  .select('order_number')
                  .eq('id', existingOrderId)
                  .single();
                existingOrderNumber = existingOrder?.order_number ?? null;
              }
              log('info', 'create_intent_idempotent_hit', {
                requestId,
                checkoutAttemptId,
                paymentIntentId: existingIntent.id,
                status: existingIntent.status,
              });
              res.json({
                clientSecret: existingIntent.client_secret,
                paymentIntentId: existingIntent.id,
                // Prefer the amount Stripe knows about; fall back to current catalog price
                amountCents: existingIntent.amount ?? amountCents,
                orderId: existingOrderId,
                orderNumber: existingOrderNumber,
                checkoutAttemptId,
                idempotent: true,
              });
              return;
            }
          }
        }
      }

      // ── Step 1: Validate discount if present ──────────────────────────
      let discountAmountCents = 0;
      let validatedDiscountCode = '';

      if (discountCode && supabaseAdmin) {
        const { data: discount } = await supabaseAdmin
          .from('discounts')
          .select('*')
          .eq('code', discountCode)
          .single();

        if (discount) {
          const items = normalizePaymentItems(req.body?.items);
          const subtotal = items.reduce((sum, item) => {
            const prod = products.get(item.productId);
            return sum + (prod ? Number(prod.price) * item.quantity : 0);
          }, 0);

          const validation = validateDiscount({
            discount: discount as any,
            items,
            products: products as any,
            subtotal,
          });

          if (validation.valid && validation.discountAmountCents) {
            discountAmountCents = validation.discountAmountCents;
            validatedDiscountCode = discount.code;
            log('info', 'discount_validated_for_intent', { requestId, discountCode, discountAmountCents });
          } else {
            log('warn', 'discount_invalid_for_intent', { requestId, discountCode, error: validation.error });
          }
        }
      }

      const finalAmountCents = Math.max(amountCents - discountAmountCents, 50);

      // ── Step 2: Create pending order with stock reservations ──────────
      let orderId: string | null = null;
      let orderNumber: string | null = null;

      if (supabaseAdmin && authenticatedUserId) {
        const rpcItems = (req.body?.items as Array<{ product_id: string; quantity: number }> || [])
          .map((item: { product_id: string; quantity: number }) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          }));

        const { data: pendingResult, error: pendingError } = await supabaseAdmin
          .rpc('create_pending_order_with_items', {
            p_checkout_attempt_id: checkoutAttemptId,
            p_user_id: authenticatedUserId,
            p_items: rpcItems,
            p_checkout: {
              clientInfo: checkoutData?.clientInfo || {},
              deliveryMethod: checkoutData?.deliveryMethod || 'courier',
              discount_code: validatedDiscountCode || null,
              discount_total: discountAmountCents / 100,
            },
          });

        if (pendingError) {
          log('error', 'pending_order_failed', { requestId, checkoutAttemptId, error: pendingError.message });
          const status = pendingError.message.includes('Insufficient stock') ? 400 : 500;
          res.status(status).json({ error: pendingError.message });
          return;
        }

        const result = pendingResult as { order_id?: string; order_number?: string; idempotent?: boolean } | null;
        orderId = result?.order_id || null;
        orderNumber = result?.order_number || null;

        if (result?.idempotent) {
          log('info', 'pending_order_idempotent', { requestId, checkoutAttemptId, orderId });
        } else {
          log('info', 'pending_order_created', { requestId, checkoutAttemptId, orderId, orderNumber });
        }
      }

      // ── Step 3: Create Stripe PaymentIntent with order metadata ────────
      const body = new URLSearchParams({
        amount: String(finalAmountCents),
        currency,
        "automatic_payment_methods[enabled]": "true",
        "automatic_payment_methods[allow_redirects]": "never",
        "metadata[source]": "veridian_checkout",
        "metadata[item_count]": String(itemCount),
        "metadata[cart_hash]": cartHash,
        "metadata[checkout_attempt_id]": checkoutAttemptId,
      });
      if (orderId) body.set("metadata[order_id]", orderId);
      if (orderNumber) body.set("metadata[order_number]", orderNumber);
      if (customer?.email) body.set("receipt_email", customer.email);
      if (customer?.name) body.set("metadata[customer_name]", customer.name);
      if (validatedDiscountCode) body.set("metadata[discount_code]", validatedDiscountCode);

      const idempotencyKey = createStripeIdempotencyKey({
        userId: authenticatedUserId,
        attemptId: checkoutAttemptId,
        cartHash,
      });

      const stripeResponse = await fetch("https://api.stripe.com/v1/payment_intents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
          ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
        },
        body,
      });
      const paymentIntent = await stripeResponse.json() as StripePaymentIntent & { error?: { message?: string } };

      if (!stripeResponse.ok || !paymentIntent.client_secret) {
        if (supabaseAdmin && checkoutAttemptId) {
          await supabaseAdmin.rpc('release_stock_reservations', {
            p_checkout_attempt_id: checkoutAttemptId,
            p_new_status: 'failed',
          });
          log('warn', 'stripe_intent_failed_stock_released', { requestId, checkoutAttemptId });
        }
        res.status(stripeResponse.status).json({ error: paymentIntent.error?.message || "Stripe payment intent failed" });
        return;
      }

      // ── Step 4: Link PaymentIntent to checkout attempt ─────────────────
      if (supabaseAdmin && checkoutAttemptId) {
        await supabaseAdmin
          .from('checkout_attempts')
          .update({ payment_intent_id: paymentIntent.id, updated_at: new Date().toISOString() })
          .eq('checkout_attempt_id', checkoutAttemptId);

        if (orderId) {
          await supabaseAdmin
            .from('payments')
            .upsert({
              order_id: orderId,
              provider: 'stripe',
              provider_payment_id: paymentIntent.id,
              status: 'requires_payment',
              raw_provider_status: 'requires_payment_method',
              amount: finalAmountCents / 100,
              currency: currency.toUpperCase(),
              metadata: { source: 'create_intent', checkout_attempt_id: checkoutAttemptId, discount_code: validatedDiscountCode || null },
              reconciled_at: new Date().toISOString(),
            }, { onConflict: 'provider_payment_id' });
        }
      }

      log('info', 'payment_intent_created', { requestId, paymentIntentId: paymentIntent.id, orderId, checkoutAttemptId, amountCents: finalAmountCents });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amountCents: finalAmountCents,
        orderId,
        orderNumber,
        checkoutAttemptId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Payment provider unavailable";
      const status = getPaymentIntentErrorStatus(message);
      if (status < 500 || message === "Catalog pricing is not configured") {
        res.status(status).json({ error: message });
        return;
      }
      log('error', 'create_intent_failed', { requestId, message });
      res.status(status).json({ error: "Payment provider unavailable" });
    }
  });

  app.get("/api/health", (req, res) => {
    const requestId = (req as Request & { requestId?: string }).requestId;
    res.json({
      status: "ok",
      version: process.env.npm_package_version || "0.0.0",
      uptimeSeconds: Math.floor((Date.now() - SERVER_STARTED_AT) / 1000),
      requestId,
      dependencies: {
        geminiLive: Boolean(process.env.GEMINI_API_KEY),
        supabaseAuth: Boolean(supabaseAuth),
        supabaseAdmin: Boolean(supabaseAdmin),
        stripePayments: Boolean(stripeSecretKey),
      },
    });
  });

  // ── E-commerce event tracking endpoint (P1.9) ─────────────────────────────
  const ALLOWED_EVENT_TYPES = new Set([
    'view_item', 'add_to_cart', 'remove_from_cart',
    'begin_checkout', 'purchase', 'search',
  ]);

  app.post("/api/events", eventsRateLimiter, async (req, res) => {
    const { event_type, payload, anonymous_id } = req.body as {
      event_type?: string;
      payload?: Record<string, unknown>;
      anonymous_id?: string;
    };
    if (!event_type || !ALLOWED_EVENT_TYPES.has(event_type)) {
      res.status(400).json({ error: "Invalid or missing event_type" });
      return;
    }
    const requestId = (req as Request & { requestId?: string }).requestId;
    log('info', 'ecommerce_event', { requestId, event_type });

    if (supabaseAdmin) {
      const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
      let userId: string | null = null;
      if (token && supabaseAuth) {
        const { data } = await supabaseAuth.auth.getUser(token);
        userId = data.user?.id ?? null;
      }

      // Check max size of properties to protect database
      const propertiesJson = payload ?? {};
      const propertiesStr = JSON.stringify(propertiesJson);
      if (propertiesStr.length > 50000) {
        res.status(400).json({ error: "Properties payload size limit exceeded (max 50KB)" });
        return;
      }

      const { error } = await supabaseAdmin.from("events").insert({
        event_name: event_type,
        user_id: userId,
        anonymous_id: anonymous_id || null,
        properties: propertiesJson,
        created_at: new Date().toISOString(),
      });
      if (error) {
        log('warn', 'event_persist_failed', { requestId, event_type, error: error.message });
      }
    }
    res.json({ ok: true });
  });

  // ── Amélioration IA des descriptions produits (OpenRouter) ────────────────

  /**
   * POST /api/products/enhance-description
   * Améliore la description d'un produit via OpenRouter (modèle gratuit).
   * Body JSON : { name, description, categories?, effects?, price? }
   * Auth : admin/staff uniquement
   */
  app.post("/api/products/enhance-description", enhanceRateLimiter, async (req, res) => {
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      res.status(503).json({ error: "OPENROUTER_API_KEY non configurée. Ajoutez-la dans votre .env." });
      return;
    }
    if (!supabaseAuth) {
      res.status(503).json({ error: "Supabase non configuré" });
      return;
    }

    // Auth admin/staff
    const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) {
      res.status(401).json({ error: "Authentification requise" });
      return;
    }
    const { data: userData, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !userData.user) {
      res.status(401).json({ error: "Token invalide" });
      return;
    }
    const catalogClient = supabaseAdmin || supabaseAuth;
    const { data: profile } = await catalogClient
      .from("profiles").select("role").eq("id", userData.user.id).single();
    if (!profile || !["admin", "staff"].includes(profile.role)) {
      res.status(403).json({ error: "Accès réservé aux administrateurs" });
      return;
    }

    // Validation du body
    const { name, description, categories, effects, price } = req.body as {
      name?: string;
      description?: string;
      categories?: string[];
      effects?: string[];
      price?: number;
    };

    if (!name?.trim() || !description?.trim()) {
      res.status(400).json({ error: "name et description sont requis" });
      return;
    }
    if (description.length > 3000) {
      res.status(400).json({ error: "Description trop longue (max 3000 caractères)" });
      return;
    }

    const requestId = (req as Request & { requestId?: string }).requestId;

    // Construction du prompt
    const context = [
      categories?.length ? `Catégories : ${categories.join(", ")}` : null,
      effects?.length ? `Caractéristiques : ${effects.join(", ")}` : null,
      price ? `Prix : ${price.toFixed(2)}€` : null,
    ].filter(Boolean).join("\n");

    const systemPrompt = `Tu es un expert en rédaction e-commerce premium pour la boutique Véridian.
Tu améliores les descriptions produits en respectant ces normes :
- Longueur : 80 à 150 mots, ni trop court ni trop long
- Ton : premium, élégant, persuasif mais honnête
- Structure : accroche forte (1 phrase), bénéfices clés (2-3 phrases), appel à l'action implicite (1 phrase)
- SEO : intègre naturellement les mots-clés du nom et des catégories
- Langue : français impeccable, pas de jargon technique excessif
- Interdits : superlatifs vides ("le meilleur", "incroyable"), majuscules abusives, emojis
- Retourne UNIQUEMENT la description améliorée, sans commentaire ni explication.`;

    const userPrompt = `Produit : ${name.trim()}
${context ? context + "\n" : ""}Description actuelle :
${description.trim()}

Améliore cette description en respectant les normes Véridian.`;

    try {
      log("info", "enhance_description_start", { requestId, productName: name });

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
          "X-Title": "Véridian Admin",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b:free",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({})) as { error?: { message?: string } };
        const msg = errBody?.error?.message ?? `OpenRouter error ${response.status}`;
        log("warn", "enhance_description_api_error", { requestId, status: response.status, msg });
        res.status(response.status >= 500 ? 502 : response.status).json({ error: msg });
        return;
      }

      const data = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>;
        error?: { message?: string };
      };

      const enhanced = data.choices?.[0]?.message?.content?.trim();
      if (!enhanced) {
        res.status(502).json({ error: "Réponse vide du modèle IA" });
        return;
      }

      log("info", "enhance_description_ok", { requestId, productName: name, chars: enhanced.length });
      res.json({ enhanced });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      log("error", "enhance_description_failed", { requestId, message });
      res.status(500).json({ error: message });
    }
  });

  // ── Vectorisation des produits avec pgvector ───────────────────────────────

  /**
   * POST /api/products/vectorize
   * Vectorise tous les produits (ou seulement ceux sans embedding).
   * Body JSON : { onlyMissing?: boolean }
   * Auth : admin uniquement (Bearer token)
   */
  app.post("/api/products/vectorize", vectorizeRateLimiter, async (req, res) => {
    if (!geminiApiKey) {
      res.status(503).json({ error: "GEMINI_API_KEY non configurée" });
      return;
    }
    if (!supabaseAuth) {
      res.status(503).json({ error: "Supabase non configuré" });
      return;
    }

    // Auth admin — on crée un client Supabase avec le token de l'admin
    // pour que les opérations s'exécutent avec ses droits RLS
    const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) {
      res.status(401).json({ error: "Authentification requise" });
      return;
    }
    const { data: userData, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !userData.user) {
      res.status(401).json({ error: "Token invalide" });
      return;
    }

    // Vérifier le rôle admin via le client anon (lecture publique du profil)
    const catalogClient = supabaseAdmin || supabaseAuth;
    const { data: profile } = await catalogClient
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();
    if (!profile || !["admin", "staff"].includes(profile.role)) {
      res.status(403).json({ error: "Accès réservé aux administrateurs" });
      return;
    }

    // Client authentifié avec le token admin pour les écritures
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
    const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
    const authedClient = supabaseAdmin || createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const onlyMissing = req.body?.onlyMissing !== false;
    const requestId = (req as Request & { requestId?: string }).requestId;

    log("info", "vectorize_start", { requestId, onlyMissing });

    try {
      const result = await vectorizeAllProducts(geminiApiKey, authedClient, {
        onlyMissing,
        onProgress: (done, total) => {
          log("info", "vectorize_progress", { requestId, done, total });
        },
      });

      log("info", "vectorize_complete", { requestId, ...result });
      res.json({ ok: true, ...result });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      log("error", "vectorize_failed", { requestId, message });
      res.status(500).json({ error: message });
    }
  });

  /**
   * POST /api/products/:id/vectorize
   * Vectorise un seul produit par son ID.
   * Auth : admin uniquement
   */
  app.post("/api/products/:id/vectorize", vectorizeRateLimiter, async (req, res) => {
    if (!geminiApiKey) {
      res.status(503).json({ error: "GEMINI_API_KEY non configurée" });
      return;
    }
    if (!supabaseAuth) {
      res.status(503).json({ error: "Supabase non configuré" });
      return;
    }

    const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) {
      res.status(401).json({ error: "Authentification requise" });
      return;
    }
    const { data: userData, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !userData.user) {
      res.status(401).json({ error: "Token invalide" });
      return;
    }

    const catalogClient = supabaseAdmin || supabaseAuth;
    const { data: profile } = await catalogClient
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();
    if (!profile || !["admin", "staff"].includes(profile.role)) {
      res.status(403).json({ error: "Accès réservé aux administrateurs" });
      return;
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
    const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
    const authedClient = supabaseAdmin || createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const productId = req.params.id;
    const { data: product, error: fetchError } = await authedClient
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (fetchError || !product) {
      res.status(404).json({ error: "Produit introuvable" });
      return;
    }

    try {
      await vectorizeProduct(geminiApiKey, authedClient, product);
      log("info", "vectorize_product_ok", { productId });
      res.json({ ok: true, productId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      log("error", "vectorize_product_failed", { productId, message });
      res.status(500).json({ error: message });
    }
  });

  /**
   * GET /api/products/search?q=...&limit=5&threshold=0.5
   * Recherche sémantique dans le catalogue.
   * Auth : utilisateur connecté
   */
  app.get("/api/products/search", searchRateLimiter, async (req, res) => {
    if (!geminiApiKey) {
      res.status(503).json({ error: "GEMINI_API_KEY non configurée" });
      return;
    }
    const catalogClient = supabaseAdmin || supabaseAuth;
    if (!catalogClient) {
      res.status(503).json({ error: "Supabase non configuré" });
      return;
    }

    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!query || query.length < 2) {
      res.status(400).json({ error: "Paramètre q requis (min 2 caractères)" });
      return;
    }

    const limit = Math.min(Number(req.query.limit) || 5, 20);
    const threshold = Math.min(Math.max(Number(req.query.threshold) || 0.5, 0), 1);

    try {
      const results = await semanticSearchProducts(geminiApiKey, catalogClient, query, {
        matchCount: limit,
        matchThreshold: threshold,
        filterInStock: req.query.inStock !== "false",
      });
      res.json({ results, count: results.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      log("error", "semantic_search_failed", { query, message });
      res.status(500).json({ error: message });
    }
  });

  // ---- WebSocket handler for Gemini Live API ----
  const wss = new WebSocketServer({ server, path: "/live" });

  const geminiApiKey = process.env.GEMINI_API_KEY;
  const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;
  wss.on("connection", async (clientWs: WebSocket, request: IncomingMessage) => {
    const clientIp = getClientIp(request);
    const rateLimit = registerLiveConnection(clientIp);
    if (!rateLimit.allowed) {
      clientWs.send(JSON.stringify({ error: rateLimit.reason }));
      clientWs.close(1008, "Rate limit exceeded");
      return;
    }
    clientWs.once("close", () => rateLimit.release?.());

    console.log("Client connected to WebSocket", { clientIp });

    let liveSession: (Awaited<ReturnType<GoogleGenAI['live']['connect']>> & { close?: () => void }) | null = null;
    let sessionTimeout: NodeJS.Timeout | null = null;

    const cleanupLiveSession = () => {
      if (sessionTimeout) {
        clearTimeout(sessionTimeout);
        sessionTimeout = null;
      }
      liveSession?.close?.();
      liveSession = null;
    };

    try {
      if (!ai) {
        clientWs.send(JSON.stringify({ error: "AI voice service is not configured" }));
        clientWs.close(1013, "AI service unavailable");
        return;
      }
      if (!supabaseAuth && IS_PRODUCTION) {
        clientWs.send(JSON.stringify({ error: "Voice authentication is not configured" }));
        clientWs.close(1011, "Authentication unavailable");
        return;
      }

      if (supabaseAuth) {
        const token = new URL(request.url || "/live", "http://localhost").searchParams.get("token");
        if (!token) {
          clientWs.send(JSON.stringify({ error: "Authentication required" }));
          clientWs.close(1008, "Authentication required");
          return;
        }

        const { data, error } = await supabaseAuth.auth.getUser(token);
        if (error || !data.user) {
          clientWs.send(JSON.stringify({ error: "Invalid authentication token" }));
          clientWs.close(1008, "Invalid authentication token");
          return;
        }
      }

      const session = await ai.live.connect({
        model: GEMINI_LIVE_MODEL,
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              clientWs.send(JSON.stringify({ audio: audioData }));
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.functionCall) {
                  clientWs.send(JSON.stringify({ functionCall: part.functionCall }));
                }
              }
            }
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
          },
          // Prompt système chargé depuis prompts/ava-system.md
          systemInstruction: skillsEngine.systemPrompt,
          tools: [{
            functionDeclarations: [{
              name: "addToCart",
              description: "Ajoute un produit au panier du client ou propose un achat.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  productId: {
                    type: Type.STRING, 
                    description: "L'identifiant exact du produit choisi dans le contexte catalogue fourni pour la session."
                  },
                  quantity: { type: Type.INTEGER, description: "La quantité souhaitée par le client" }
                },
                required: ["productId", "quantity"]
              }
            }]
          }]
        },
      });

      liveSession = session;
      sessionTimeout = setTimeout(() => {
        clientWs.send(JSON.stringify({ error: "Session vocale terminée: durée maximale atteinte." }));
        clientWs.close(1000, "Session duration limit reached");
        cleanupLiveSession();
      }, LIVE_SESSION_MAX_MS);

      // Handle messages coming from the client
      clientWs.on("message", (data: string) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: {
                mimeType: "audio/pcm;rate=16000",
                data: parsed.audio,
              }
            });
          } else if (parsed.text) {
            // ── Skills auto-injection ──────────────────────────────────────
            const isCatalogContext = (parsed.text as string).startsWith('Contexte catalogue');
            if (!isCatalogContext) {
              const activeSkills = skillsEngine.getActiveSkills(parsed.text as string);
              if (activeSkills.length > 0) {
                const skillNames = activeSkills.map(s => s.name).join(', ');
                log('info', 'skills_activated', { skills: skillNames });
                const skillsContext = activeSkills
                  .map(s => `[Skill actif: ${s.name}]\n${s.content}`)
                  .join('\n\n');
                session.sendRealtimeInput({ text: `[Instructions contextuelles — ne pas lire à voix haute]\n${skillsContext}` });
              }

              // ── Semantic search injection ────────────────────────────────
              // Si pgvector est disponible, enrichit le contexte avec les
              // produits sémantiquement proches de la requête du client
              const catalogClient = supabaseAdmin || supabaseAuth;
              if (geminiApiKey && catalogClient) {
                semanticSearchProducts(geminiApiKey, catalogClient, parsed.text as string, {
                  matchCount: 6,
                  matchThreshold: 0.45,
                  filterInStock: true,
                })
                  .then(results => {
                    if (results.length > 0) {
                      const context = formatSemanticResultsForAva(results);
                      log('info', 'semantic_context_injected', { count: results.length });
                      session.sendRealtimeInput({
                        text: `[Produits pertinents trouvés dans le catalogue — ne pas lire à voix haute, utiliser pour répondre]\n${context}`,
                      });
                    }
                  })
                  .catch(err => {
                    // Silencieux : si pgvector n'est pas encore activé, on continue sans
                    log('warn', 'semantic_search_unavailable', {
                      reason: err instanceof Error ? err.message : String(err),
                    });
                  });
              }
            }

            session.sendRealtimeInput({ text: parsed.text });
          } else if (parsed.functionResponse) {
             session.sendToolResponse({ functionResponses: [parsed.functionResponse] });
          }
        } catch (e) {
          console.error("Error processing client message", e);
        }
      });

      clientWs.on("close", () => {
        log('info', 'ws_client_disconnected', { clientIp });
        cleanupLiveSession();
      });
    } catch (e) {
      cleanupLiveSession();
      console.error("Failed to start Gemini Live Session:", e);
      clientWs.send(JSON.stringify({ error: "Failed to connect to AI server" }));
      clientWs.close();
    }
  });

  // ---- Vite Middleware ----
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Serve static assets (JS, CSS, images) — no CSP nonce needed in asset headers
    app.use(express.static(distPath, { index: false }));
    // SPA fallback: serve index.html with the per-request CSP nonce injected.
    // This ensures the nonce in the CSP header matches the one in the HTML, allowing
    // any inline scripts that are nonce-whitelisted to execute.
    app.get('*', async (req, res) => {
      try {
        const fs = await import('node:fs/promises');
        let html = await fs.readFile(path.join(distPath, 'index.html'), 'utf-8');
        const nonce = res.locals.cspNonce as string | undefined;
        if (nonce) {
          // Inject nonce into <head> as a meta tag so client-side code can read it
          // if it ever needs to create script elements dynamically.
          html = html.replace(
            '</head>',
            `  <meta name="csp-nonce" content="${nonce}" />\n  </head>`
          );
        }
        res.type('html').send(html);
      } catch {
        res.status(500).send('Application unavailable');
      }
    });
  }

  // ── Global error handler (must be last middleware) ────────────────────────
  app.use(errorHandlerMiddleware);

  server.listen(PORT, "0.0.0.0", () => {
    log('info', 'server_started', { port: PORT, env: process.env.NODE_ENV || 'development' });
  });
}

startServer();
