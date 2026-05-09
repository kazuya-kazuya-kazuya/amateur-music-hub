import { z } from "zod";
import { getTrackStats } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const statsRouter = router({
  getTrackStats: protectedProcedure.query(async ({ ctx }) => {
    const result = await getTrackStats(ctx.user.id);
    
    return {
      tracks: result.tracks,
      timeline: result.timeline,
      summary: {
        totalTracks: result.tracks.length,
        totalPlays: result.tracks.reduce((sum, t) => sum + t.playCount, 0),
        totalLikes: result.tracks.reduce((sum, t) => sum + t.likeCount, 0),
        totalComments: result.tracks.reduce((sum, t) => sum + t.commentCount, 0),
      },
      byGenre: result.tracks.reduce(
        (acc, track) => {
          const genre = track.genre || "その他";
          if (!acc[genre]) {
            acc[genre] = { plays: 0, likes: 0, comments: 0, trackCount: 0 };
          }
          acc[genre].plays += track.playCount;
          acc[genre].likes += track.likeCount;
          acc[genre].comments += track.commentCount;
          acc[genre].trackCount += 1;
          return acc;
        },
        {} as Record<string, { plays: number; likes: number; comments: number; trackCount: number }>
      ),
    };
  }),
});
