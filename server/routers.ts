import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { tracksRouter } from "./routers/tracks";
import { commentsRouter } from "./routers/comments";
import { likesRouter } from "./routers/likes";
import { usersRouter } from "./routers/users";
import { statsRouter } from "./routers/stats";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  tracks: tracksRouter,
  comments: commentsRouter,
  likes: likesRouter,
  users: usersRouter,
  stats: statsRouter,
});

export type AppRouter = typeof appRouter;
