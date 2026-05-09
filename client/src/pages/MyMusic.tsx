import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Edit2, Trash2, Music, Play, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { usePlayer } from "@/contexts/PlayerContext";
import EditTrackDialog from "@/components/EditTrackDialog";
import { Link } from "wouter";

interface TrackItem {
  id: number;
  title: string;
  description?: string;
  genre?: string;
  tags?: string[];
  fileUrl: string;
  coverUrl?: string;
  duration?: number;
  playCount: number;
  likeCount: number;
  isPublic: boolean;
  createdAt: Date;
}

export default function MyMusic() {
  const { user, loading: authLoading } = useAuth();
  const { play } = usePlayer();
  const [editingTrack, setEditingTrack] = useState<TrackItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteTrackId, setDeleteTrackId] = useState<number | null>(null);

  const { data: tracks = [], isLoading: tracksLoading, refetch } = trpc.tracks.getOwnTracks.useQuery({});

  const deleteMutation = trpc.tracks.delete.useMutation({
    onSuccess: () => {
      toast.success("楽曲を削除しました");
      setDeleteTrackId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "削除に失敗しました");
    },
  });

  if (authLoading) {
    return (
      <div className="container py-20 flex justify-center">
        <div className="text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-20 flex flex-col items-center justify-center gap-4">
        <Music size={48} className="text-muted-foreground" />
        <p className="text-muted-foreground">ログインしてマイページを表示してください</p>
      </div>
    );
  }

  const displayTracks: TrackItem[] = tracks.map((t: any) => ({
    ...t,
    createdAt: new Date(t.createdAt),
  }));

  return (
    <div className="container py-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">マイ楽曲</h1>
          <p className="text-muted-foreground">投稿した楽曲を管理します</p>
        </div>
        <a href="/mystats">
          <Button className="gradient-neon text-white">
            <BarChart3 size={16} className="mr-2" />
            統計を見る
          </Button>
        </a>
      </div>

      {tracksLoading ? (
        <div className="flex justify-center py-12">
          <div className="text-muted-foreground">読み込み中...</div>
        </div>
      ) : displayTracks.length === 0 ? (
        <Card className="p-12 text-center border-border/50">
          <Music size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">まだ楽曲を投稿していません</p>
          <Link href="/upload">
            <Button className="gradient-neon text-white">楽曲を投稿する</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayTracks.map((track) => (
            <Card key={track.id} className="p-4 border-border/50 hover:border-border/80 transition-colors">
              <div className="flex items-start gap-4">
                {/* Cover */}
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex-shrink-0 flex items-center justify-center border border-border/30">
                  {track.coverUrl ? (
                    <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <Music size={24} className="text-muted-foreground" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{track.title}</h3>
                  {track.description && <p className="text-sm text-muted-foreground truncate">{track.description}</p>}
                  <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                    {track.genre && <span className="px-2 py-1 rounded bg-background/50 border border-border/30">{track.genre}</span>}
                    <span className="px-2 py-1 rounded bg-background/50 border border-border/30">
                      再生: {track.playCount}
                    </span>
                    <span className="px-2 py-1 rounded bg-background/50 border border-border/30">
                      いいね: {track.likeCount}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() =>
                      play({
                        id: track.id,
                        title: track.title,
                        fileUrl: track.fileUrl,
                        duration: track.duration || 0,
                        userName: user?.name || null,
                        coverUrl: track.coverUrl || null,
                      })
                    }
                    className="p-2 rounded-lg hover:bg-background/50 transition-colors text-muted-foreground hover:text-foreground"
                    title="再生"
                  >
                    <Play size={18} className="fill-current" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingTrack(track);
                      setEditDialogOpen(true);
                    }}
                    className="p-2 rounded-lg hover:bg-background/50 transition-colors text-muted-foreground hover:text-foreground"
                    title="編集"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => setDeleteTrackId(track.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-500"
                    title="削除"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingTrack && (
        <EditTrackDialog
          trackId={editingTrack.id}
          title={editingTrack.title}
          description={editingTrack.description}
          genre={editingTrack.genre}
          tags={editingTrack.tags}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={() => refetch()}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteTrackId !== null} onOpenChange={(open) => !open && setDeleteTrackId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>楽曲を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。楽曲とそのコメント、いいねが削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTrackId) {
                  deleteMutation.mutate({ id: deleteTrackId });
                }
              }}
              disabled={deleteMutation.isPending}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteMutation.isPending ? "削除中..." : "削除"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
