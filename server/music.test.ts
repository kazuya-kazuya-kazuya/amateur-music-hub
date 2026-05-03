import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createAuthContext(userId = 1, name = "Test User"): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `user-${userId}`,
      email: `user${userId}@example.com`,
      name,
      loginMethod: "manus",
      role: "user",
      bio: null,
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

// ─── tracks ──────────────────────────────────────────────────────────────────

describe("tracks.list", () => {
  it("returns an array without authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.tracks.list({ sort: "new" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("accepts sort=popular", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.tracks.list({ sort: "popular" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("accepts genre filter", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.tracks.list({ genre: "Rock" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("accepts search query", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.tracks.list({ search: "test" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("each item has liked=false for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.tracks.list({ sort: "new", limit: 5 });
    result.forEach((t) => expect(t.liked).toBe(false));
  });
});

describe("tracks.get", () => {
  it("throws NOT_FOUND for non-existent track", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.tracks.get({ id: 999999 })).rejects.toThrow();
  });
});

describe("tracks.upload", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.tracks.upload({
        title: "Test",
        audioBase64: "dGVzdA==",
        audioMime: "audio/mpeg",
        audioFileName: "test.mp3",
      })
    ).rejects.toThrow();
  });
});

describe("tracks.delete", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.tracks.delete({ id: 1 })).rejects.toThrow();
  });
});

// ─── comments ────────────────────────────────────────────────────────────────

describe("comments.list", () => {
  it("returns an array for any trackId", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.comments.list({ trackId: 9999 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("comments.create", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.comments.create({ trackId: 1, content: "hello" })).rejects.toThrow();
  });

  it("rejects empty content", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.comments.create({ trackId: 1, content: "" })).rejects.toThrow();
  });
});

describe("comments.delete", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.comments.delete({ id: 1 })).rejects.toThrow();
  });
});

// ─── likes ───────────────────────────────────────────────────────────────────

describe("likes.myLikedIds", () => {
  it("returns empty array for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.likes.myLikedIds();
    expect(result).toEqual([]);
  });

  it("returns an array for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.likes.myLikedIds();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("likes.toggle", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.likes.toggle({ trackId: 1 })).rejects.toThrow();
  });
});

// ─── users ───────────────────────────────────────────────────────────────────

describe("users.profile", () => {
  it("throws NOT_FOUND for non-existent user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.users.profile({ userId: 999999 })).rejects.toThrow();
  });
});

describe("users.tracks", () => {
  it("returns an array for any userId", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.users.tracks({ userId: 999999 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("users.updateProfile", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.users.updateProfile({ name: "Test" })).rejects.toThrow();
  });
});

// ─── auth ─────────────────────────────────────────────────────────────────────

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
    const ctx: TrpcContext = {
      user: {
        id: 1,
        openId: "sample-user",
        email: "sample@example.com",
        name: "Sample User",
        loginMethod: "manus",
        role: "user",
        bio: null,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
  });
});
