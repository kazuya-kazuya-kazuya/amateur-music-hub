import { useState } from "react";
import { useParams } from "wouter";
import { Music2, Calendar, Edit2, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import TrackCard from "@/components/TrackCard";
import { toast } from "sonner";

type TrackItem = {
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

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  const { user: currentUser, isAuthenticated } = useAuth();
  const isOwner = isAuthenticated && currentUser?.id === userId;

  const [sort, setSort] = useState<"new" | "popular">("new");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [tracks, setTracks] = useState<TrackItem[]>([]);

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = trpc.users.profile.useQuery({ userId });
  const { data: userTracks = [], isLoading: tracksLoading } = trpc.users.tracks.useQuery({ userId, sort });

  const displayTracks: TrackItem[] = tracks.length > 0 ? tracks : (userTracks as TrackItem[]);

  const updateMutation = trpc.users.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("プロフィールを更新しました");
      setIsEditing(false);
      refetchProfile();
    },
    onError: () => toast.error("更新に失敗しました"),
  });

  const startEdit = () => {
    setEditName(profile?.name ?? "");
    setEditBio(profile?.bio ?? "");
    setIsEditing(true);
  };

  const saveEdit = () => {
    updateMutation.mutate({
      name: editName.trim() || undefined,
      bio: editBio.trim() || undefined,
    });
  };

  const handleLikeToggle = (id: number, liked: boolean, count: number) => {
    const source = tracks.length > 0 ? tracks : (userTracks as TrackItem[]);
    setTracks(source.map((t) => (t.id === id ? { ...t, liked, likeCount: count } : t)));
  };

  if (profileLoading) {
    return (
      <div className="container py-20 flex justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container py-20 text-center text-muted-foreground">
        <p>ユーザーが見つかりませんでした</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Profile header */}
      <div className="glass-card rounded-2xl p-6 md:p-8 mb-8 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <Avatar className="w-20 h-20 ring-2 ring-primary/30">
            <AvatarImage src={profile.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
              {profile.name?.[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="表示名"
                  className="bg-secondary border-border/50 focus:border-primary/50 max-w-xs"
                />
                <Textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="自己紹介..."
                  className="bg-secondary border-border/50 focus:border-primary/50 resize-none max-w-lg"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={saveEdit}
                    disabled={updateMutation.isPending}
                    className="gradient-neon text-white border-0"
                  >
                    {updateMutation.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : <Check size={14} className="mr-1" />}
                    保存
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="border-border/50">
                    <X size={14} className="mr-1" />
                    キャンセル
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold mb-1">{profile.name ?? "Unknown Artist"}</h1>
                {profile.bio && <p className="text-muted-foreground text-sm mb-3 max-w-lg">{profile.bio}</p>}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(profile.createdAt).toLocaleDateString("ja-JP", { year: "numeric", month: "long" })}から
                  </span>
                  <span className="flex items-center gap-1">
                    <Music2 size={12} />
                    {displayTracks.length}曲
                  </span>
                </div>
              </>
            )}
          </div>

          {isOwner && !isEditing && (
            <Button
              size="sm"
              variant="outline"
              onClick={startEdit}
              className="border-border/50 hover:border-primary/50 flex-shrink-0"
            >
              <Edit2 size={14} className="mr-1.5" />
              編集
            </Button>
          )}
        </div>
      </div>

      {/* Tracks section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            <span className="gradient-neon-text">投稿楽曲</span>
          </h2>
          <div className="flex rounded-lg overflow-hidden border border-border/50">
            {(["new", "popular"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  sort === s ? "gradient-neon text-white" : "text-muted-foreground hover:text-foreground bg-secondary"
                }`}
              >
                {s === "new" ? "新着順" : "人気順"}
              </button>
            ))}
          </div>
        </div>

        {tracksLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : displayTracks.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Music2 size={40} className="mx-auto mb-3 opacity-20" />
            <p>まだ楽曲がありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {displayTracks.map((track) => (
              <TrackCard key={track.id} track={track} onLikeToggle={handleLikeToggle} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
