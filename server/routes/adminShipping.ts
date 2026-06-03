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

const ALLOWED_CARRIER_TYPES = new Set(["home", "relay", "express", "international"]);

export function createAdminShippingRouter(
  supabaseAuth: SupabaseClient | null,
  supabaseAdmin: SupabaseClient | null,
  log: (level: "info" | "warn" | "error", msg: string, meta?: Record<string, unknown>) => void
) {
  const router = Router();
  const authMiddleware = requireAdminOrStaff(supabaseAuth, supabaseAdmin);

  // POST /api/admin/shipping — Create carrier (admin only)
  router.post("/", authMiddleware, requireAdminOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!supabaseAdmin) { res.status(503).json({ error: "Service non configuré" }); return; }

    const { name, slug, carrier_type, base_price, min_days, max_days } = req.body;
    if (!name?.trim()) { res.status(400).json({ error: "Le champ 'name' est obligatoire" }); return; }
    if (!slug?.trim()) { res.status(400).json({ error: "Le champ 'slug' est obligatoire" }); return; }
    if (!ALLOWED_CARRIER_TYPES.has(carrier_type)) {
      res.status(400).json({ error: "Type de transporteur invalide" }); return;
    }
    if (typeof base_price !== "number" || base_price < 0) {
      res.status(400).json({ error: "'base_price' doit être un nombre positif" }); return;
    }

    const payload: any = { ...req.body };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    payload.name = String(name).trim();
    payload.slug = String(slug).trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    payload.base_price = Number(base_price);
    payload.min_days = Number(min_days) || 1;
    payload.max_days = Number(max_days) || 3;
    payload.is_active = req.body.is_active ?? true;

    try {
      const { data, error } = await supabaseAdmin.from("shipping_carriers").insert([payload]).select().single();
      if (error) throw error;

      await writeAuditEvent(supabaseAdmin, req.user.id, "create_shipping_carrier", "shipping_carrier", data.id, null, data);
      log("info", "admin_shipping_carrier_created", { actorId: req.user.id, carrierId: data.id });
      res.status(201).json({ ok: true, carrier: data });
    } catch (err) {
      log("error", "admin_shipping_carrier_create_failed", { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: "Erreur lors de la création du transporteur" });
    }
  });

  // PUT /api/admin/shipping/:id — Update carrier (admin only)
  router.put("/:id", authMiddleware, requireAdminOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!supabaseAdmin) { res.status(503).json({ error: "Service non configuré" }); return; }
    const { id } = req.params;

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("shipping_carriers").select("*").eq("id", id).single();
    if (fetchError || !existing) { res.status(404).json({ error: "Transporteur introuvable" }); return; }

    const payload: any = { ...req.body };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    if (payload.slug) payload.slug = String(payload.slug).toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (payload.base_price != null) payload.base_price = Number(payload.base_price);
    if (payload.min_days != null) payload.min_days = Number(payload.min_days);
    if (payload.max_days != null) payload.max_days = Number(payload.max_days);
    if (payload.carrier_type && !ALLOWED_CARRIER_TYPES.has(payload.carrier_type)) {
      res.status(400).json({ error: "Type de transporteur invalide" }); return;
    }

    try {
      const { data, error } = await supabaseAdmin.from("shipping_carriers").update(payload).eq("id", id).select().single();
      if (error) throw error;

      await writeAuditEvent(supabaseAdmin, req.user.id, "update_shipping_carrier", "shipping_carrier", id, existing, data);
      log("info", "admin_shipping_carrier_updated", { actorId: req.user.id, carrierId: id });
      res.json({ ok: true, carrier: data });
    } catch (err) {
      log("error", "admin_shipping_carrier_update_failed", { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: "Erreur lors de la mise à jour du transporteur" });
    }
  });

  // DELETE /api/admin/shipping/:id — Delete carrier (admin only)
  router.delete("/:id", authMiddleware, requireAdminOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!supabaseAdmin) { res.status(503).json({ error: "Service non configuré" }); return; }
    const { id } = req.params;

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("shipping_carriers").select("*").eq("id", id).single();
    if (fetchError || !existing) { res.status(404).json({ error: "Transporteur introuvable" }); return; }

    try {
      const { error } = await supabaseAdmin.from("shipping_carriers").delete().eq("id", id);
      if (error) throw error;

      await writeAuditEvent(supabaseAdmin, req.user.id, "delete_shipping_carrier", "shipping_carrier", id, existing, null);
      log("info", "admin_shipping_carrier_deleted", { actorId: req.user.id, carrierId: id });
      res.json({ ok: true });
    } catch (err) {
      log("error", "admin_shipping_carrier_delete_failed", { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: "Erreur lors de la suppression du transporteur" });
    }
  });

  return router;
}
