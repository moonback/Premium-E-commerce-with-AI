import type { Request, Response, NextFunction } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface AuthenticatedRequest extends Request {
  user?: any;
  role?: string;
}

export function requireAdminOrStaff(supabaseAuth: SupabaseClient | null, supabaseAdmin: SupabaseClient | null) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!supabaseAuth) {
      res.status(503).json({ error: "Service d'authentification Supabase non configuré" });
      return;
    }

    const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) {
      res.status(401).json({ error: "Authentification requise" });
      return;
    }

    try {
      const { data: userData, error: authError } = await supabaseAuth.auth.getUser(token);
      if (authError || !userData.user) {
        res.status(401).json({ error: "Session d'authentification expirée ou invalide" });
        return;
      }

      const client = supabaseAdmin || supabaseAuth;
      const { data: profile, error: profileError } = await client
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();

      if (profileError || !profile || !["admin", "staff"].includes(profile.role)) {
        res.status(403).json({ error: "Accès refusé. Droits insuffisants." });
        return;
      }

      req.user = userData.user;
      req.role = profile.role;
      next();
    } catch (err) {
      console.error("Erreur requireAdminOrStaff:", err);
      res.status(500).json({ error: "Erreur lors de la validation des autorisations" });
    }
  };
}

export function requireAdminOnly(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (req.role !== "admin") {
    res.status(403).json({ error: "Accès réservé exclusivement aux administrateurs." });
    return;
  }
  next();
}
