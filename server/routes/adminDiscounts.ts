import { Router } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdminOrStaff, requireAdminOnly } from "../middleware/adminAuth";
import type { AuthenticatedRequest } from "../middleware/adminAuth";
import type { Response } from "express";

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

export function createAdminDiscountsRouter(
  supabaseAuth: SupabaseClient | null,
  supabaseAdmin: SupabaseClient | null,
  log: (level: "info" | "warn" | "error", msg: string, meta?: Record<string, unknown>) => void
) {
  const router = Router();
  const authMiddleware = requireAdminOrStaff(supabaseAuth, supabaseAdmin);

  // POST /api/admin/discounts — Create discount (admin only)
  router.post("/", authMiddleware, requireAdminOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!supabaseAdmin) { res.status(503).json({ error: "Service non configuré" }); return; }

    const { code, type, value } = req.body;
    if (!code?.trim()) { res.status(400).json({ error: "Le champ 'code' est obligatoire" }); return; }
    if (!["percentage", "fixed"].includes(type)) { res.status(400).json({ error: "Le type doit être 'percentage' ou 'fixed'" }); return; }
    if (typeof value !== "number" || value <= 0) { res.status(400).json({ error: "La valeur doit être un nombre positif" }); return; }

    const payload: any = {
      code: String(code).trim().toUpperCase(),
      type,
      value: Number(value),
      is_active: req.body.is_active ?? true,
      current_uses: 0,
      valid_from: req.body.valid_from || new Date().toISOString(),
    };
    if (req.body.min_order_amount != null) payload.min_order_amount = Number(req.body.min_order_amount);
    if (req.body.max_uses != null) payload.max_uses = Number(req.body.max_uses);
    if (req.body.valid_until) payload.valid_until = req.body.valid_until;

    try {
      const { data, error } = await supabaseAdmin.from("discounts").insert([payload]).select().single();
      if (error) throw error;

      await writeAuditEvent(supabaseAdmin, req.user.id, "create_discount", "discount", data.id, null, data);
      log("info", "admin_discount_created", { actorId: req.user.id, discountId: data.id, code: data.code });
      res.status(201).json({ ok: true, discount: data });
    } catch (err) {
      log("error", "admin_discount_create_failed", { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: "Erreur lors de la création du code promo" });
    }
  });

  // PUT /api/admin/discounts/:id — Update discount (admin only)
  router.put("/:id", authMiddleware, requireAdminOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!supabaseAdmin) { res.status(503).json({ error: "Service non configuré" }); return; }
    const { id } = req.params;

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("discounts").select("*").eq("id", id).single();
    if (fetchError || !existing) { res.status(404).json({ error: "Code promo introuvable" }); return; }

    const payload: any = {};
    const allowed = ["code", "type", "value", "is_active", "min_order_amount", "max_uses", "valid_from", "valid_until"];
    for (const key of allowed) {
      if (key in req.body) payload[key] = req.body[key];
    }
    if (payload.code) payload.code = String(payload.code).toUpperCase();

    try {
      const { data, error } = await supabaseAdmin.from("discounts").update(payload).eq("id", id).select().single();
      if (error) throw error;

      await writeAuditEvent(supabaseAdmin, req.user.id, "update_discount", "discount", id, existing, data);
      log("info", "admin_discount_updated", { actorId: req.user.id, discountId: id });
      res.json({ ok: true, discount: data });
    } catch (err) {
      log("error", "admin_discount_update_failed", { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: "Erreur lors de la mise à jour du code promo" });
    }
  });

  // DELETE /api/admin/discounts/:id — Delete discount (admin only)
  router.delete("/:id", authMiddleware, requireAdminOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!supabaseAdmin) { res.status(503).json({ error: "Service non configuré" }); return; }
    const { id } = req.params;

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("discounts").select("*").eq("id", id).single();
    if (fetchError || !existing) { res.status(404).json({ error: "Code promo introuvable" }); return; }

    try {
      const { error } = await supabaseAdmin.from("discounts").delete().eq("id", id);
      if (error) throw error;

      await writeAuditEvent(supabaseAdmin, req.user.id, "delete_discount", "discount", id, existing, null);
      log("info", "admin_discount_deleted", { actorId: req.user.id, discountId: id });
      res.json({ ok: true });
    } catch (err) {
      log("error", "admin_discount_delete_failed", { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: "Erreur lors de la suppression du code promo" });
    }
  });

  return router;
}
