import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTrack,
  deleteTrack,
  getLikedTrackIds,
  getTrackWithUser,
  getTracksWithUser,
  incrementPlayCount,
} from "../db";
import { storagePut } from "../storage";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const tracksRouter = router({
  list: publicProcedure
    .input(
      z.object({
        sort: z.enum(["new", "popular"]).optional().default("new"),
        genre: z.string().optional(),
        search: z.string().optional(),
        userId: z.number().optional(),
        limit: z.number().min(1).max(50).optional().default(20),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const tracks = await getTracksWithUser(input);
      const likedIds = ctx.user ? await getLikedTrackIds(ctx.user.id) : [];
      return tracks.map((t) => ({
        ...t,
        tags: t.tags ? (JSON.parse(t.tags) as string[]) : [],
        liked: likedIds.includes(t.id),
      }));
    }),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const track = await getTrackWithUser(input.id);
      if (!track) throw new TRPCError({ code: "NOT_FOUND" });
      const likedIds = ctx.user ? await getLikedTrackIds(ctx.user.id) : [];
      return {
        ...track,
        tags: track.tags ? (JSON.parse(track.tags) as string[]) : [],
        waveformData: track.waveformData ? (JSON.parse(track.waveformData) as number[]) : [],
        liked: likedIds.includes(track.id),
      };
    }),

  upload: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        genre: z.string().optional(),
        tags: z.array(z.string()).optional(),
        // base64 encoded audio file
        audioBase64: z.string(),
        audioMime: z.string().default("audio/mpeg"),
        audioFileName: z.string(),
        duration: z.number().optional(),
        waveformData: z.array(z.number()).optional(),
        // optional cover image
        coverBase64: z.string().optional(),
        coverMime: z.string().optional(),
        coverFileName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const timestamp = Date.now();

      // Upload audio file
      const audioBuffer = Buffer.from(input.audioBase64, "base64");
      const audioKey = `tracks/${userId}/${timestamp}-${input.audioFileName}`;
      const { url: fileUrl } = await storagePut(audioKey, audioBuffer, input.audioMime);

      // Upload cover image if provided
      let coverKey: string | undefined;
      let coverUrl: string | undefined;
      if (input.coverBase64 && input.coverMime && input.coverFileName) {
        const coverBuffer = Buffer.from(input.coverBase64, "base64");
        const ck = `covers/${userId}/${timestamp}-${input.coverFileName}`;
        const { url: cu } = await storagePut(ck, coverBuffer, input.coverMime);
        coverKey = ck;
        coverUrl = cu;
      }

      await createTrack({
        userId,
        title: input.title,
        description: input.description,
        genre: input.genre,
        tags: input.tags,
        fileKey: audioKey,
        fileUrl,
        duration: input.duration,
        waveformData: input.waveformData,
        coverKey,
        coverUrl,
      });

      return { success: true };
    }),

  incrementPlay: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await incrementPlayCount(input.id);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await deleteTrack(input.id, ctx.user.id);
      return { success: true };
    }),
});
