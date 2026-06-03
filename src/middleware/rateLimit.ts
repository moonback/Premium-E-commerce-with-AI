import type { Request, Response, NextFunction } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface RateLimitStore {
  check(key: string, windowMs: number, max: number): Promise<{ allowed: boolean; count: number; resetTime: number }>;
}

/**
 * MemoryStore implements an in-memory sliding window rate limiter.
 */
export class MemoryStore implements RateLimitStore {
  private hits = new Map<string, number[]>();

  constructor(cleanupIntervalMs = 5 * 60 * 1000) {
    if (typeof setInterval !== "undefined") {
      const interval = setInterval(() => this.cleanup(), cleanupIntervalMs);
      if (interval && typeof interval.unref === "function") {
        interval.unref(); // Prevent blocking process exit in tests
      }
    }
  }

  async check(key: string, windowMs: number, max: number): Promise<{ allowed: boolean; count: number; resetTime: number }> {
    const now = Date.now();
    let timestamps = this.hits.get(key) || [];
    const windowStart = now - windowMs;

    // Filter out timestamps outside the current window
    timestamps = timestamps.filter((t) => t > windowStart);

    const oldest = timestamps.length > 0 ? timestamps[0] : now;
    const resetTime = oldest + windowMs;

    if (timestamps.length >= max) {
      return { allowed: false, count: timestamps.length, resetTime };
    }

    timestamps.push(now);
    this.hits.set(key, timestamps);

    return { allowed: true, count: timestamps.length, resetTime };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.hits.entries()) {
      // Keep only timestamps not older than 10 minutes
      const validTimestamps = timestamps.filter((t) => t > now - 10 * 60 * 1000);
      if (validTimestamps.length === 0) {
        this.hits.delete(key);
      } else {
        this.hits.set(key, validTimestamps);
      }
    }
  }
}

/**
 * SupabaseStore implements a database-backed rate limiter using Supabase RPC.
 */
export class SupabaseStore implements RateLimitStore {
  constructor(private supabaseAdmin: SupabaseClient) {}

  async check(key: string, windowMs: number, max: number): Promise<{ allowed: boolean; count: number; resetTime: number }> {
    const windowSeconds = Math.max(1, Math.round(windowMs / 1000));
    
    const { data, error } = await this.supabaseAdmin.rpc("check_rate_limit", {
      p_key: key,
      p_max_requests: max,
      p_window_seconds: windowSeconds,
    });

    if (error || !data || data.length === 0) {
      // Fail-open to avoid blocking legitimate customers if database is under load
      console.error("Supabase check_rate_limit failed, falling back to allowed:", error);
      return { allowed: true, count: 1, resetTime: Date.now() + windowMs };
    }

    const result = data[0] as { allowed: boolean; current_count: number; reset_time: string };
    return {
      allowed: result.allowed,
      count: result.current_count,
      resetTime: new Date(result.reset_time).getTime(),
    };
  }
}

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

export function extractUserIdFromJwt(authHeader?: string): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = match[1];
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payloadJson = Buffer.from(parts[1], "base64").toString("utf8");
    const payload = JSON.parse(payloadJson);
    return payload.sub || null;
  } catch {
    return null;
  }
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  prefix: string;
  store: RateLimitStore;
  message?: string;
  log?: (level: "info" | "warn" | "error", msg: string, meta?: Record<string, unknown>) => void;
}

export function rateLimiter(options: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ip = getClientIp(req);
    const userId = extractUserIdFromJwt(req.header("authorization"));
    
    // Key by user_id if authenticated, otherwise by IP
    const identifier = userId ? `user:${userId}` : `ip:${ip}`;
    const key = `rate_limit:${options.prefix}:${identifier}`;

    try {
      const { allowed, count, resetTime } = await options.store.check(
        key,
        options.windowMs,
        options.max
      );

      const remaining = Math.max(0, options.max - count);
      res.setHeader("X-RateLimit-Limit", options.max);
      res.setHeader("X-RateLimit-Remaining", remaining);
      res.setHeader("X-RateLimit-Reset", Math.ceil(resetTime / 1000));

      if (!allowed) {
        const now = Date.now();
        const retryAfterSeconds = Math.max(1, Math.ceil((resetTime - now) / 1000));

        res.setHeader("Retry-After", retryAfterSeconds);

        if (options.log) {
          options.log("warn", "rate_limit_exceeded", {
            key,
            prefix: options.prefix,
            ip,
            userId,
            retryAfterSeconds,
            count,
            limit: options.max,
          });
        }

        res.status(429).json({
          error: options.message || "Too many requests, please try again later.",
          retryAfterSeconds,
        });
        return;
      }

      next();
    } catch (err) {
      if (options.log) {
        options.log("error", "rate_limiter_internal_error", {
          error: err instanceof Error ? err.message : String(err),
          key,
        });
      }
      next(); // Fail-open
    }
  };
}
