import test from "node:test";
import assert from "node:assert/strict";
import {
  MemoryStore,
  getClientIp,
  extractUserIdFromJwt,
  rateLimiter,
} from "./rateLimit";
import type { Request, Response } from "express";

test("extractUserIdFromJwt parses valid Supabase JWTs", () => {
  // Mock JWT payload: {"sub":"user_123_abc","role":"authenticated"}
  const payload = Buffer.from(
    JSON.stringify({ sub: "user_123_abc", role: "authenticated" })
  ).toString("base64");
  const validToken = `header.${payload}.signature`;

  assert.equal(extractUserIdFromJwt(`Bearer ${validToken}`), "user_123_abc");
  assert.equal(extractUserIdFromJwt(`bearer ${validToken}`), "user_123_abc");
  assert.equal(extractUserIdFromJwt(undefined), null);
  assert.equal(extractUserIdFromJwt("invalid_format"), null);
  assert.equal(extractUserIdFromJwt("Bearer badtoken"), null);
});

test("getClientIp extracts IP correctly", () => {
  const req1 = {
    headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18" },
    ip: "127.0.0.1",
    socket: { remoteAddress: "127.0.0.1" },
  } as unknown as Request;

  const req2 = {
    headers: {},
    ip: "192.168.1.1",
    socket: { remoteAddress: "192.168.1.1" },
  } as unknown as Request;

  const req3 = {
    headers: {},
    socket: { remoteAddress: "10.0.0.1" },
  } as unknown as Request;

  assert.equal(getClientIp(req1), "203.0.113.195");
  assert.equal(getClientIp(req2), "192.168.1.1");
  assert.equal(getClientIp(req3), "10.0.0.1");
});

test("MemoryStore enforces sliding window limits correctly", async () => {
  const store = new MemoryStore();
  const key = "test_key";
  const windowMs = 200; // short window for test
  const max = 3;

  // 1st request
  const r1 = await store.check(key, windowMs, max);
  assert.equal(r1.allowed, true);
  assert.equal(r1.count, 1);
  assert.ok(r1.resetTime > Date.now());

  // 2nd request
  const r2 = await store.check(key, windowMs, max);
  assert.equal(r2.allowed, true);
  assert.equal(r2.count, 2);

  // 3rd request
  const r3 = await store.check(key, windowMs, max);
  assert.equal(r3.allowed, true);
  assert.equal(r3.count, 3);

  // 4th request (exceeding limit)
  const r4 = await store.check(key, windowMs, max);
  assert.equal(r4.allowed, false);
  assert.equal(r4.count, 3); // count shouldn't increase for rejected requests

  // Wait for the window to clear
  await new Promise((resolve) => setTimeout(resolve, windowMs + 20));

  // 5th request (should be allowed again)
  const r5 = await store.check(key, windowMs, max);
  assert.equal(r5.allowed, true);
  assert.equal(r5.count, 1);
});

test("rateLimiter middleware allows request within limits", async () => {
  const store = new MemoryStore();
  const middleware = rateLimiter({
    windowMs: 1000,
    max: 5,
    prefix: "test",
    store,
  });

  const req = {
    headers: {},
    socket: { remoteAddress: "127.0.0.1" },
    header: () => undefined,
  } as unknown as Request;

  const headers = new Map<string, any>();
  const res = {
    setHeader: (name: string, value: any) => {
      headers.set(name.toLowerCase(), value);
    },
  } as unknown as Response;

  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  await middleware(req, res, next);

  assert.equal(nextCalled, true);
  assert.equal(headers.get("x-ratelimit-limit"), 5);
  assert.equal(headers.get("x-ratelimit-remaining"), 4);
});

test("rateLimiter middleware blocks request when limit is exceeded", async () => {
  const store = new MemoryStore();
  const middleware = rateLimiter({
    windowMs: 1000,
    max: 2,
    prefix: "test",
    store,
    message: "Rate limit reached.",
  });

  const req = {
    headers: {},
    socket: { remoteAddress: "127.0.0.1" },
    header: () => undefined,
  } as unknown as Request;

  const headers = new Map<string, any>();
  let responseStatus = 0;
  let responseBody: any = null;

  const res = {
    setHeader: (name: string, value: any) => {
      headers.set(name.toLowerCase(), value);
    },
    status: (code: number) => {
      responseStatus = code;
      return {
        json: (body: any) => {
          responseBody = body;
        },
      };
    },
  } as unknown as Response;

  // Request 1
  await middleware(req, res, () => {});
  assert.equal(headers.get("x-ratelimit-remaining"), 1);

  // Request 2
  await middleware(req, res, () => {});
  assert.equal(headers.get("x-ratelimit-remaining"), 0);

  // Request 3 (blocked)
  let nextCalled = false;
  await middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(responseStatus, 429);
  assert.equal(headers.has("retry-after"), true);
  assert.equal(responseBody.error, "Rate limit reached.");
});

test("rateLimiter middleware fails open on store error", async () => {
  const failingStore = {
    check: async () => {
      throw new Error("DB connection timeout");
    },
  };

  let loggedError = false;
  const middleware = rateLimiter({
    windowMs: 1000,
    max: 5,
    prefix: "test",
    store: failingStore,
    log: (level) => {
      if (level === "error") loggedError = true;
    },
  });

  const req = {
    headers: {},
    socket: { remoteAddress: "127.0.0.1" },
    header: () => undefined,
  } as unknown as Request;

  const res = {
    setHeader: () => {},
  } as unknown as Response;

  let nextCalled = false;
  await middleware(req, res, () => {
    nextCalled = true;
  });

  // Should fail-open and call next() despite store error
  assert.equal(nextCalled, true);
  assert.equal(loggedError, true);
});
