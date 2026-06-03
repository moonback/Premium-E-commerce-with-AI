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

export function createAdminCategoriesRouter(
  supabaseAuth: SupabaseClient | null,
  supabaseAdmin: SupabaseClient | null,
  log: (level: "info" | "warn" | "error", msg: string, meta?: Record<string, unknown>) => void
) {
  const router = Router();
  const authMiddleware = requireAdminOrStaff(supabaseAuth, supabaseAdmin);

  // POST /api/admin/categories — Create category (admin only)
  router.post("/", authMiddleware, requireAdminOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!supabaseAdmin) { res.status(503).json({ error: "Service non configuré" }); return; }

    const { name, parent_id, image_url, seo } = req.body;
    if (!name?.trim()) { res.status(400).json({ error: "Le champ 'name' est obligatoire" }); return; }

    try {
      // Fetch parent to compute level
      let level = 1;
      if (parent_id) {
        const { data: parent } = await supabaseAdmin.from("categories").select("level").eq("id", parent_id).single();
        if (parent) level = parent.level + 1;
      }
      if (level > 3) { res.status(400).json({ error: "Maximum 3 niveaux de catégories" }); return; }

      const payload = {
        id: `cat_${Date.now()}`,
        name: String(name).trim(),
        parent_id: parent_id || null,
        level,
        image_url: image_url || null,
        seo: seo && Object.keys(seo).length > 0 ? seo : null,
      };

      const { data, error } = await supabaseAdmin.from("categories").insert([payload]).select().single();
      if (error) throw error;

      await writeAuditEvent(supabaseAdmin, req.user.id, "create_category", "category", data.id, null, data);
      log("info", "admin_category_created", { actorId: req.user.id, categoryId: data.id });
      res.status(201).json({ ok: true, category: data });
    } catch (err) {
      log("error", "admin_category_create_failed", { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: "Erreur lors de la création de la catégorie" });
    }
  });

  // PUT /api/admin/categories/:id — Update category (admin only)
  router.put("/:id", authMiddleware, requireAdminOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!supabaseAdmin) { res.status(503).json({ error: "Service non configuré" }); return; }
    const { id } = req.params;
    const { name, parent_id, image_url, seo } = req.body;

    // Load all categories for validation
    const { data: allCategories, error: catError } = await supabaseAdmin
      .from("categories").select("id,parent_id,level,name,image_url,seo");
    if (catError || !allCategories) { res.status(500).json({ error: "Impossible de charger les catégories" }); return; }

    const existing = allCategories.find((c: any) => c.id === id);
    if (!existing) { res.status(404).json({ error: "Catégorie introuvable" }); return; }

    // Guard: cannot be its own parent
    if (parent_id === id) { res.status(400).json({ error: "Une catégorie ne peut pas être son propre parent" }); return; }

    // Guard: cannot move into one of its own descendants
    const children = allCategories.filter((c: any) => c.parent_id === id);
    const grandchildren = allCategories.filter((c: any) => children.some((child: any) => child.id === c.parent_id));
    const descendantIds = new Set([...children.map((c: any) => c.id), ...grandchildren.map((c: any) => c.id)]);
    if (parent_id && descendantIds.has(parent_id)) {
      res.status(400).json({ error: "Impossible de déplacer dans une sous-catégorie de cette catégorie" });
      return;
    }

    // Compute new level
    let newLevel = 1;
    if (parent_id) {
      const parent = allCategories.find((c: any) => c.id === parent_id);
      if (parent) newLevel = parent.level + 1;
    }

    // Guard: max depth check
    const maxDepthAdded = grandchildren.length > 0 ? 2 : children.length > 0 ? 1 : 0;
    if (newLevel + maxDepthAdded > 3) {
      res.status(400).json({ error: "Ce déplacement ferait dépasser la limite de 3 niveaux" });
      return;
    }

    try {
      const payload: any = {
        name: name?.trim() || existing.name,
        parent_id: parent_id ?? existing.parent_id,
        level: newLevel,
        image_url: image_url ?? existing.image_url,
        seo: seo && Object.keys(seo).length > 0 ? seo : (seo === null ? null : existing.seo),
      };

      const { data: updated, error } = await supabaseAdmin.from("categories").update(payload).eq("id", id).select().single();
      if (error) throw error;

      // Recursively update child/grandchild levels if level changed
      if (existing.level !== newLevel) {
        const levelDiff = newLevel - existing.level;
        for (const child of children) {
          await supabaseAdmin.from("categories").update({ level: child.level + levelDiff }).eq("id", child.id);
        }
        for (const gc of grandchildren) {
          await supabaseAdmin.from("categories").update({ level: gc.level + levelDiff }).eq("id", gc.id);
        }
      }

      await writeAuditEvent(supabaseAdmin, req.user.id, "update_category", "category", id, existing, updated);
      log("info", "admin_category_updated", { actorId: req.user.id, categoryId: id });
      res.json({ ok: true, category: updated });
    } catch (err) {
      log("error", "admin_category_update_failed", { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: "Erreur lors de la mise à jour de la catégorie" });
    }
  });

  // DELETE /api/admin/categories/:id — Delete category (admin only)
  router.delete("/:id", authMiddleware, requireAdminOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!supabaseAdmin) { res.status(503).json({ error: "Service non configuré" }); return; }
    const { id } = req.params;

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("categories").select("*").eq("id", id).single();
    if (fetchError || !existing) { res.status(404).json({ error: "Catégorie introuvable" }); return; }

    try {
      const { error } = await supabaseAdmin.from("categories").delete().eq("id", id);
      if (error) throw error;

      await writeAuditEvent(supabaseAdmin, req.user.id, "delete_category", "category", id, existing, null);
      log("info", "admin_category_deleted", { actorId: req.user.id, categoryId: id });
      res.json({ ok: true });
    } catch (err) {
      log("error", "admin_category_delete_failed", { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: "Erreur lors de la suppression de la catégorie" });
    }
  });

  return router;
}
