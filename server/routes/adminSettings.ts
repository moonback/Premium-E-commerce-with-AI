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

const FORBIDDEN_SETTINGS_KEYS = new Set(["id", "created_at", "updated_at"]);

export function createAdminSettingsRouter(
  supabaseAuth: SupabaseClient | null,
  supabaseAdmin: SupabaseClient | null,
  log: (level: "info" | "warn" | "error", msg: string, meta?: Record<string, unknown>) => void
) {
  const router = Router();
  const authMiddleware = requireAdminOrStaff(supabaseAuth, supabaseAdmin);

  // PUT /api/admin/settings — Upsert store settings (admin only)
  router.put("/", authMiddleware, requireAdminOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!supabaseAdmin) { res.status(503).json({ error: "Service non configuré" }); return; }

    // Load current settings for before snapshot
    const { data: existing } = await supabaseAdmin
      .from("store_settings").select("*").limit(1).maybeSingle();

    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(req.body)) {
      if (!FORBIDDEN_SETTINGS_KEYS.has(k)) payload[k] = v;
    }

    try {
      let updatedData: any;
      if (existing?.id) {
        const { data, error } = await supabaseAdmin
          .from("store_settings").update(payload).eq("id", existing.id).select().single();
        if (error) throw error;
        updatedData = data;
      } else {
        const { data, error } = await supabaseAdmin
          .from("store_settings").insert([payload]).select().single();
        if (error) throw error;
        updatedData = data;
      }

      await writeAuditEvent(
        supabaseAdmin, req.user.id,
        "update_settings", "store_settings",
        updatedData?.id ?? null,
        existing ?? null,
        updatedData
      );
      log("info", "admin_settings_updated", { actorId: req.user.id });
      res.json({ ok: true, settings: updatedData });
    } catch (err) {
      log("error", "admin_settings_update_failed", { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: "Erreur lors de la mise à jour des paramètres" });
    }
  });

  return router;
}
