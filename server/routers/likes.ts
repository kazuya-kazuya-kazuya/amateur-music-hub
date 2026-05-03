import { z } from "zod";
import { addLike, getLike, getLikedTrackIds, removeLike } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const likesRouter = router({
  toggle: protectedProcedure
    .input(z.object({ trackId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const existing = await getLike(input.trackId, ctx.user.id);
      if (existing) {
        await removeLike(input.trackId, ctx.user.id);
        return { liked: false };
      } else {
        await addLike(input.trackId, ctx.user.id);
        return { liked: true };
      }
    }),

  myLikedIds: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return [];
    return getLikedTrackIds(ctx.user.id);
  }),
});
