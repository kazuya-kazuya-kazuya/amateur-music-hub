import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "wouter";
import {
  Heart, Play, Pause, Volume2, VolumeX, MessageCircle,
  Clock, Music2, Tag, User, ArrowLeft, Loader2, Send, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { usePlayer } from "@/contexts/PlayerContext";
import { toast } from "sonner";
import WaveSurfer from "wavesurfer.js";

function formatTime(s: number) {
  if (!isFinite(s) || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

export default function TrackDetail() {
  const { id } = useParams<{ id: string }>();
  const trackId = Number(id);
  const { user, isAuthenticated } = useAuth();
  const { play: globalPlay, currentTrack, isPlaying: globalPlaying, pause: globalPause, resume: globalResume } = usePlayer();

  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [wsReady, setWsReady] = useState(false);
  const [wsPlaying, setWsPlaying] = useState(false);
  const [wsTime, setWsTime] = useState(0);
  const [wsDuration, setWsDuration] = useState(0);
  const [wsVolume, setWsVolume] = useState(0.8);
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const { data: track, isLoading, error } = trpc.tracks.get.useQuery({ id: trackId });
  const { data: comments = [], refetch: refetchComments } = trpc.comments.list.useQuery({ trackId });
  const utils = trpc.useUtils();

  const likeMutation = trpc.likes.toggle.useMutation({
    onMutate: () => {
      const newLiked = !liked;
      setLiked(newLiked);
      setLikeCount((c) => c + (newLiked ? 1 : -1));
    },
    onError: () => {
      setLiked(liked);
      setLikeCount(likeCount);
      toast.error("いいねの更新に失敗しました");
    },
  });

  const commentMutation = trpc.comments.create.useMutation({
    onSuccess: () => {
      setCommentText("");
      refetchComments();
      toast.success("コメントを投稿しました");
    },
    onError: () => toast.error("コメントの投稿に失敗しました"),
  });

  const deleteCommentMutation = trpc.comments.delete.useMutation({
    onSuccess: () => refetchComments(),
  });

  const incrementPlay = trpc.tracks.incrementPlay.useMutation();

  useEffect(() => {
    if (track) {
      setLiked(track.liked);
      setLikeCount(track.likeCount);
    }
  }, [track]);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!track || !waveformRef.current) return;

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "oklch(0.35 0.05 300)",
      progressColor: "oklch(0.65 0.28 300)",
      cursorColor: "oklch(0.75 0.28 300)",
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 80,
      normalize: true,
      url: track.fileUrl,
    });

    wavesurferRef.current = ws;

    ws.on("ready", () => {
      setWsReady(true);
      setWsDuration(ws.getDuration());
    });
    ws.on("timeupdate", (t) => setWsTime(t));
    ws.on("play", () => setWsPlaying(true));
    ws.on("pause", () => setWsPlaying(false));
    ws.on("finish", () => setWsPlaying(false));

    return () => {
      ws.destroy();
      wavesurferRef.current = null;
    };
  }, [track?.fileUrl]);

  const handleWsPlay = () => {
    const ws = wavesurferRef.current;
    if (!ws || !wsReady) return;
    if (wsPlaying) {
      ws.pause();
    } else {
      ws.play();
      if (track && !wsPlaying) {
        incrementPlay.mutate({ id: track.id });
      }
    }
  };

  const handleLike = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    likeMutation.mutate({ trackId });
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    commentMutation.mutate({ trackId, content: commentText.trim() });
  };

  if (isLoading) {
    return (
      <div className="container py-20 flex justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (error || !track) {
    return (
      <div className="container py-20 text-center">
        <Music2 size={48} className="mx-auto mb-4 opacity-20" />
        <p className="text-muted-foreground">楽曲が見つかりませんでした</p>
        <Link href="/explore">
          <Button variant="outline" className="mt-4 border-border/50">探索に戻る</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      {/* Back */}
      <Link href="/explore">
        <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground hover:text-foreground -ml-2">
          <ArrowLeft size={16} className="mr-1" />
          戻る
        </Button>
      </Link>

      <div className="grid md:grid-cols-[280px_1fr] gap-8">
        {/* Left: Cover + info */}
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-muted mb-4 neon-glow-purple">
            {track.coverUrl ? (
              <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full gradient-neon opacity-40 flex items-center justify-center">
                <Music2 size={64} className="text-white/60" />
              </div>
            )}
          </div>

          {/* Artist */}
          <Link href={`/profile/${track.userId}`}>
            <div className="flex items-center gap-3 p-3 glass-card rounded-xl hover:border-primary/30 transition-colors cursor-pointer mb-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src={track.userAvatar ?? undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-sm">
                  {track.userName?.[0]?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{track.userName ?? "Unknown Artist"}</p>
                <p className="text-xs text-muted-foreground">アーティスト</p>
              </div>
            </div>
          </Link>

          {/* Stats */}
          <div className="glass-card rounded-xl p-4 space-y-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5"><Play size={13} />再生数</span>
              <span className="font-medium text-foreground">{track.playCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5"><Heart size={13} />いいね</span>
              <span className="font-medium text-foreground">{likeCount.toLocaleString()}</span>
            </div>
            {track.duration && (
              <div className="flex justify-between text-muted-foreground">
                <span className="flex items-center gap-1.5"><Clock size={13} />時間</span>
                <span className="font-medium text-foreground">{formatTime(track.duration)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>投稿日</span>
              <span className="font-medium text-foreground">{formatDate(track.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Right: Player + details */}
        <div>
          {/* Title & genre */}
          <div className="mb-4">
            {track.genre && (
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 mb-2">
                {track.genre}
              </span>
            )}
            <h1 className="text-2xl md:text-3xl font-bold mb-1">{track.title}</h1>
            <Link href={`/profile/${track.userId}`}>
              <p className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                {track.userName ?? "Unknown Artist"}
              </p>
            </Link>
          </div>

          {/* Waveform player */}
          <div className="glass-card rounded-xl p-4 mb-4">
            <div ref={waveformRef} className="mb-3" />
            {!wsReady && (
              <div className="flex items-center justify-center h-20 text-muted-foreground">
                <Loader2 size={20} className="animate-spin mr-2" />
                読み込み中...
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={handleWsPlay}
                disabled={!wsReady}
                className="w-10 h-10 rounded-full gradient-neon flex items-center justify-center text-white neon-glow-purple hover:scale-105 transition-transform disabled:opacity-50"
              >
                {wsPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
              </button>
              <div className="text-xs font-mono text-muted-foreground">
                {formatTime(wsTime)} / {formatTime(wsDuration)}
              </div>
              <div className="flex-1" />
              <button
                onClick={() => {
                  const newVol = wsVolume > 0 ? 0 : 0.8;
                  setWsVolume(newVol);
                  wavesurferRef.current?.setVolume(newVol);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {wsVolume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={wsVolume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setWsVolume(v);
                  wavesurferRef.current?.setVolume(v);
                }}
                className="w-20"
              />
            </div>
          </div>

          {/* Like button */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all hover:scale-105 ${
                liked
                  ? "bg-pink-500/10 border-pink-500/40 text-pink-400 neon-glow-pink"
                  : "border-border/50 text-muted-foreground hover:border-pink-500/40 hover:text-pink-400"
              }`}
            >
              <Heart size={16} className={liked ? "fill-current" : ""} />
              <span className="font-medium text-sm">{likeCount}</span>
            </button>
            <button
              onClick={() => globalPlay({
                id: track.id,
                title: track.title,
                userName: track.userName,
                fileUrl: track.fileUrl,
                coverUrl: track.coverUrl,
                duration: track.duration,
              })}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
            >
              <Play size={16} />
              <span className="text-sm">グローバルプレイヤーで再生</span>
            </button>
          </div>

          {/* Description */}
          {track.description && (
            <div className="glass-card rounded-xl p-4 mb-4">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{track.description}</p>
            </div>
          )}

          {/* Tags */}
          {track.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {track.tags.map((tag) => (
                <Link key={tag} href={`/explore?q=${encodeURIComponent(tag)}`}>
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer border border-border/30">
                    <Tag size={10} />
                    {tag}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* Comments */}
          <div>
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <MessageCircle size={18} className="text-primary" />
              コメント
              <span className="text-sm font-normal text-muted-foreground">({comments.length})</span>
            </h2>

            {/* Comment form */}
            {isAuthenticated ? (
              <form onSubmit={handleComment} className="flex gap-3 mb-6">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {user?.name?.[0]?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="コメントを入力..."
                    className="bg-secondary border-border/50 focus:border-primary/50 resize-none text-sm"
                    rows={2}
                  />
                  <Button
                    type="submit"
                    disabled={!commentText.trim() || commentMutation.isPending}
                    size="sm"
                    className="gradient-neon text-white border-0 self-end"
                  >
                    {commentMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="glass-card rounded-xl p-4 mb-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">コメントするにはログインが必要です</p>
                <Button
                  size="sm"
                  onClick={() => (window.location.href = getLoginUrl())}
                  className="gradient-neon text-white border-0"
                >
                  ログイン
                </Button>
              </div>
            )}

            {/* Comment list */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">まだコメントがありません</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={comment.userAvatar ?? undefined} />
                      <AvatarFallback className="bg-secondary text-xs">
                        {comment.userName?.[0]?.toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{comment.userName ?? "Unknown"}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                        {user?.id === comment.userId && (
                          <button
                            onClick={() => deleteCommentMutation.mutate({ id: comment.id })}
                            className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
