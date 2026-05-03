import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getUserById, getTracksWithUser, updateUserProfile, getLikedTrackIds } from "../db";
import { storagePut } from "../storage";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const usersRouter = router({
  profile: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const user = await getUserById(input.userId);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      return {
        id: user.id,
        name: user.name,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      };
    }),

  tracks: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        sort: z.enum(["new", "popular"]).optional().default("new"),
        limit: z.number().optional().default(20),
        offset: z.number().optional().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const tracks = await getTracksWithUser({
        userId: input.userId,
        sort: input.sort,
        limit: input.limit,
        offset: input.offset,
      });
      const likedIds = ctx.user ? await getLikedTrackIds(ctx.user.id) : [];
      return tracks.map((t) => ({
        ...t,
        tags: t.tags ? (JSON.parse(t.tags) as string[]) : [],
        liked: likedIds.includes(t.id),
      }));
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        bio: z.string().max(500).optional(),
        avatarBase64: z.string().optional(),
        avatarMime: z.string().optional(),
        avatarFileName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      let avatarUrl: string | undefined;

      if (input.avatarBase64 && input.avatarMime && input.avatarFileName) {
        const buffer = Buffer.from(input.avatarBase64, "base64");
        const key = `avatars/${userId}/${Date.now()}-${input.avatarFileName}`;
        const { url } = await storagePut(key, buffer, input.avatarMime);
        avatarUrl = url;
      }

      await updateUserProfile(userId, {
        name: input.name,
        bio: input.bio,
        avatarUrl,
      });

      return { success: true };
    }),
});
