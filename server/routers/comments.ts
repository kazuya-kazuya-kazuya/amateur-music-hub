import { z } from "zod";
import { createComment, deleteComment, getCommentsByTrackId } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const commentsRouter = router({
  list: publicProcedure
    .input(z.object({ trackId: z.number() }))
    .query(async ({ input }) => {
      return getCommentsByTrackId(input.trackId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        trackId: z.number(),
        content: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await createComment({
        trackId: input.trackId,
        userId: ctx.user.id,
        content: input.content,
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await deleteComment(input.id, ctx.user.id);
      return { success: true };
    }),
});
