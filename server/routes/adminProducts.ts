import { Router } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdminOrStaff, requireAdminOnly } from "../middleware/adminAuth";
import type { AuthenticatedRequest } from "../middleware/adminAuth";
import type { Response } from "express";

function logAdmin(
  log: (level: "info" | "warn" | "error", msg: string, meta?: Record<string, unknown>) => void,
  level: "info" | "warn" | "error",
  action: string,
  meta: Record<string, unknown>
) {
  log(level, action, meta);
}

async function writeAuditEvent(
  supabaseAdmin: SupabaseClient,
  actorId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  before: unknown,
  after: unknown
) {
  await supabaseAdmin.from("audit_events").insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    before: before ?? null,
    after: after ?? null,
    created_at: new Date().toISOString(),
  });
}

export function createAdminProductsRouter(
  supabaseAuth: SupabaseClient | null,
  supabaseAdmin: SupabaseClient | null,
  log: (level: "info" | "warn" | "error", msg: string, meta?: Record<string, unknown>) => void
) {
  const router = Router();
  const authMiddleware = requireAdminOrStaff(supabaseAuth, supabaseAdmin);

  // POST /api/admin/products — Create product (admin + staff)
  router.post("/", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!supabaseAdmin) { res.status(503).json({ error: "Service non configuré" }); return; }

    const { name, price, stock } = req.body;
    if (!name?.trim()) { res.status(400).json({ error: "Le champ 'name' est obligatoire" }); return; }
    if (typeof price !== "number" || price < 0) { res.status(400).json({ error: "Le champ 'price' doit être un nombre positif" }); return; }
    if (typeof stock !== "number" || stock < 0) { res.status(400).json({ error: "Le champ 'stock' doit être un nombre positif" }); return; }

    const payload = {
      ...req.body,
      name: String(name).trim(),
      price: Number(price),
      stock: Number(stock),
    };

    try {
      const { data, error } = await supabaseAdmin.from("products").upsert([payload]).select().single();
      if (error) throw error;

      await writeAuditEvent(supabaseAdmin, req.user.id, "create_product", "product", data.id, null, data);
      logAdmin(log, "info", "admin_product_created", { actorId: req.user.id, productId: data.id });
      res.status(201).json({ ok: true, product: data });
    } catch (err) {
      log("error", "admin_product_create_failed", { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: "Erreur lors de la création du produit" });
    }
  });

  // PUT /api/admin/products/:id — Update product (admin + staff)
  router.put("/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!supabaseAdmin) { res.status(503).json({ error: "Service non configuré" }); return; }
    const { id } = req.params;

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("products").select("*").eq("id", id).single();
    if (fetchError || !existing) { res.status(404).json({ error: "Produit introuvable" }); return; }

    const payload = { ...req.body };
    delete payload.id;
    if (typeof payload.price !== "undefined") payload.price = Number(payload.price);
    if (typeof payload.stock !== "undefined") payload.stock = Number(payload.stock);

    try {
      const { data, error } = await supabaseAdmin.from("products").update(payload).eq("id", id).select().single();
      if (error) throw error;

      await writeAuditEvent(supabaseAdmin, req.user.id, "update_product", "product", id, existing, data);
      logAdmin(log, "info", "admin_product_updated", { actorId: req.user.id, productId: id });
      res.json({ ok: true, product: data });
    } catch (err) {
      log("error", "admin_product_update_failed", { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: "Erreur lors de la mise à jour du produit" });
    }
  });

  // DELETE /api/admin/products/:id — Delete product (admin only)
  router.delete("/:id", authMiddleware, requireAdminOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!supabaseAdmin) { res.status(503).json({ error: "Service non configuré" }); return; }
    const { id } = req.params;

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("products").select("*").eq("id", id).single();
    if (fetchError || !existing) { res.status(404).json({ error: "Produit introuvable" }); return; }

    try {
      const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
      if (error) throw error;

      await writeAuditEvent(supabaseAdmin, req.user.id, "delete_product", "product", id, existing, null);
      logAdmin(log, "info", "admin_product_deleted", { actorId: req.user.id, productId: id });
      res.json({ ok: true });
    } catch (err) {
      log("error", "admin_product_delete_failed", { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: "Erreur lors de la suppression du produit" });
    }
  });

  return router;
}
