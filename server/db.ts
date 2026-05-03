import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, comments, likes, tracks, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User helpers ────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function updateUserProfile(userId: number, data: { name?: string; bio?: string; avatarUrl?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}

// ─── Track helpers ────────────────────────────────────────────────────────────

export async function createTrack(data: {
  userId: number;
  title: string;
  description?: string;
  genre?: string;
  tags?: string[];
  fileKey: string;
  fileUrl: string;
  duration?: number;
  waveformData?: number[];
  coverKey?: string;
  coverUrl?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(tracks).values({
    userId: data.userId,
    title: data.title,
    description: data.description ?? null,
    genre: data.genre ?? null,
    tags: data.tags ? JSON.stringify(data.tags) : null,
    fileKey: data.fileKey,
    fileUrl: data.fileUrl,
    duration: data.duration ?? null,
    waveformData: data.waveformData ? JSON.stringify(data.waveformData) : null,
    coverKey: data.coverKey ?? null,
    coverUrl: data.coverUrl ?? null,
  });
  return result;
}

export async function getTrackById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tracks).where(eq(tracks.id, id)).limit(1);
  return result[0];
}

export async function getTracks(opts: {
  sort?: "new" | "popular";
  genre?: string;
  search?: string;
  userId?: number;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const limit = opts.limit ?? 20;
  const offset = opts.offset ?? 0;

  let query = db.select().from(tracks).$dynamic();

  const conditions = [eq(tracks.isPublic, true)];
  if (opts.genre) conditions.push(eq(tracks.genre, opts.genre));
  if (opts.userId) conditions.push(eq(tracks.userId, opts.userId));
  if (opts.search) {
    conditions.push(
      or(
        like(tracks.title, `%${opts.search}%`),
        like(tracks.description, `%${opts.search}%`),
        like(tracks.tags, `%${opts.search}%`)
      )!
    );
  }

  query = query.where(and(...conditions));

  if (opts.sort === "popular") {
    query = query.orderBy(desc(tracks.likeCount), desc(tracks.playCount));
  } else {
    query = query.orderBy(desc(tracks.createdAt));
  }

  return query.limit(limit).offset(offset);
}

export async function incrementPlayCount(trackId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(tracks).set({ playCount: sql`${tracks.playCount} + 1` }).where(eq(tracks.id, trackId));
}

export async function deleteTrack(trackId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(tracks).where(and(eq(tracks.id, trackId), eq(tracks.userId, userId)));
}

// ─── Comment helpers ──────────────────────────────────────────────────────────

export async function createComment(data: { trackId: number; userId: number; content: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(comments).values(data);
}

export async function getCommentsByTrackId(trackId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      userId: comments.userId,
      userName: users.name,
      userAvatar: users.avatarUrl,
    })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.trackId, trackId))
    .orderBy(desc(comments.createdAt));
}

export async function deleteComment(commentId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(comments).where(and(eq(comments.id, commentId), eq(comments.userId, userId)));
}

// ─── Like helpers ─────────────────────────────────────────────────────────────

export async function getLike(trackId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(likes)
    .where(and(eq(likes.trackId, trackId), eq(likes.userId, userId)))
    .limit(1);
  return result[0];
}

export async function addLike(trackId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(likes).values({ trackId, userId });
  await db.update(tracks).set({ likeCount: sql`${tracks.likeCount} + 1` }).where(eq(tracks.id, trackId));
}

export async function removeLike(trackId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(likes).where(and(eq(likes.trackId, trackId), eq(likes.userId, userId)));
  await db
    .update(tracks)
    .set({ likeCount: sql`GREATEST(${tracks.likeCount} - 1, 0)` })
    .where(eq(tracks.id, trackId));
}

export async function getLikedTrackIds(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({ trackId: likes.trackId }).from(likes).where(eq(likes.userId, userId));
  return result.map((r) => r.trackId);
}

// ─── Track with user info ─────────────────────────────────────────────────────

export async function getTrackWithUser(trackId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({
      id: tracks.id,
      title: tracks.title,
      description: tracks.description,
      genre: tracks.genre,
      tags: tracks.tags,
      fileUrl: tracks.fileUrl,
      fileKey: tracks.fileKey,
      duration: tracks.duration,
      waveformData: tracks.waveformData,
      coverUrl: tracks.coverUrl,
      playCount: tracks.playCount,
      likeCount: tracks.likeCount,
      isPublic: tracks.isPublic,
      createdAt: tracks.createdAt,
      userId: tracks.userId,
      userName: users.name,
      userAvatar: users.avatarUrl,
      userOpenId: users.openId,
    })
    .from(tracks)
    .leftJoin(users, eq(tracks.userId, users.id))
    .where(eq(tracks.id, trackId))
    .limit(1);
  return result[0];
}

export async function getTracksWithUser(opts: {
  sort?: "new" | "popular";
  genre?: string;
  search?: string;
  userId?: number;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const limit = opts.limit ?? 20;
  const offset = opts.offset ?? 0;

  const conditions = [eq(tracks.isPublic, true)];
  if (opts.genre) conditions.push(eq(tracks.genre, opts.genre));
  if (opts.userId) conditions.push(eq(tracks.userId, opts.userId));
  if (opts.search) {
    conditions.push(
      or(
        like(tracks.title, `%${opts.search}%`),
        like(tracks.description, `%${opts.search}%`),
        like(tracks.tags, `%${opts.search}%`)
      )!
    );
  }

  let query = db
    .select({
      id: tracks.id,
      title: tracks.title,
      description: tracks.description,
      genre: tracks.genre,
      tags: tracks.tags,
      fileUrl: tracks.fileUrl,
      fileKey: tracks.fileKey,
      duration: tracks.duration,
      coverUrl: tracks.coverUrl,
      playCount: tracks.playCount,
      likeCount: tracks.likeCount,
      createdAt: tracks.createdAt,
      userId: tracks.userId,
      userName: users.name,
      userAvatar: users.avatarUrl,
      userOpenId: users.openId,
    })
    .from(tracks)
    .leftJoin(users, eq(tracks.userId, users.id))
    .where(and(...conditions))
    .$dynamic();

  if (opts.sort === "popular") {
    query = query.orderBy(desc(tracks.likeCount), desc(tracks.playCount));
  } else {
    query = query.orderBy(desc(tracks.createdAt));
  }

  return query.limit(limit).offset(offset);
}
