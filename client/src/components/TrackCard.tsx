import { Heart, Play, Clock, Music } from "lucide-react";
import { Link } from "wouter";
import { usePlayer } from "@/contexts/PlayerContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

interface TrackCardProps {
  track: {
    id: number;
    title: string;
    userName: string | null;
    userOpenId: string | null;
    userId: number;
    coverUrl: string | null;
    fileUrl: string;
    duration: number | null;
    genre: string | null;
    tags: string[];
    likeCount: number;
    playCount: number;
    liked: boolean;
    createdAt: Date;
  };
  onLikeToggle?: (id: number, liked: boolean, newCount: number) => void;
}

function formatDuration(s: number | null) {
  if (!s) return "--:--";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function TrackCard({ track, onLikeToggle }: TrackCardProps) {
  const { play, currentTrack, isPlaying, pause, resume } = usePlayer();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const isCurrentTrack = currentTrack?.id === track.id;

  const likeMutation = trpc.likes.toggle.useMutation({
    onMutate: () => {
      const newLiked = !track.liked;
      const newCount = track.likeCount + (newLiked ? 1 : -1);
      onLikeToggle?.(track.id, newLiked, newCount);
    },
    onError: () => {
      onLikeToggle?.(track.id, track.liked, track.likeCount);
      toast.error("いいねの更新に失敗しました");
    },
  });

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isCurrentTrack) {
      isPlaying ? pause() : resume();
    } else {
      play({
        id: track.id,
        title: track.title,
        userName: track.userName,
        fileUrl: track.fileUrl,
        coverUrl: track.coverUrl,
        duration: track.duration,
      });
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    likeMutation.mutate({ trackId: track.id });
  };

  return (
    <div className="group relative glass-card rounded-xl overflow-hidden hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
      {/* Cover image */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        {track.coverUrl ? (
          <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full gradient-neon opacity-30 flex items-center justify-center">
            <Music size={40} className="text-white/60" />
          </div>
        )}
        {/* Play overlay */}
        <button
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isCurrentTrack && isPlaying ? "gradient-neon neon-glow-purple" : "bg-white/20 backdrop-blur-sm hover:bg-white/30"}`}>
            {isCurrentTrack && isPlaying ? (
              <div className="flex gap-1 items-end h-5">
                <span className="w-1 bg-white rounded-full animate-bounce" style={{ height: "60%", animationDelay: "0ms" }} />
                <span className="w-1 bg-white rounded-full animate-bounce" style={{ height: "100%", animationDelay: "150ms" }} />
                <span className="w-1 bg-white rounded-full animate-bounce" style={{ height: "40%", animationDelay: "300ms" }} />
              </div>
            ) : (
              <Play size={22} className="text-white ml-1" />
            )}
          </div>
        </button>
        {/* Genre badge */}
        {track.genre && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-black/60 backdrop-blur-sm text-primary border border-primary/30">
              {track.genre}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <Link href={`/track/${track.id}`}>
          <h3 className="font-semibold text-sm text-foreground truncate hover:text-primary transition-colors cursor-pointer">
            {track.title}
          </h3>
        </Link>
        <Link href={`/profile/${track.userId}`}>
          <p className="text-xs text-muted-foreground truncate hover:text-foreground transition-colors cursor-pointer mt-0.5">
            {track.userName ?? "Unknown Artist"}
          </p>
        </Link>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Play size={11} />
              {track.playCount.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {formatDuration(track.duration)}
            </span>
          </div>
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 text-xs transition-all hover:scale-110 ${
              track.liked ? "text-pink-400 neon-text-pink" : "text-muted-foreground hover:text-pink-400"
            }`}
          >
            <Heart size={13} className={track.liked ? "fill-current" : ""} />
            <span>{track.likeCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
