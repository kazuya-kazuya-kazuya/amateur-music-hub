import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Music2, Headphones, Upload, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import TrackCard from "@/components/TrackCard";

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

function TrackGrid({ tracks, onLikeToggle }: { tracks: TrackItem[]; onLikeToggle: (id: number, liked: boolean, count: number) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {tracks.map((track) => (
        <TrackCard key={track.id} track={track} onLikeToggle={onLikeToggle} />
      ))}
    </div>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();

  const { data: newTracks = [], refetch: refetchNew } = trpc.tracks.list.useQuery({ sort: "new", limit: 10 });
  const { data: popularTracks = [], refetch: refetchPopular } = trpc.tracks.list.useQuery({ sort: "popular", limit: 10 });

  const [newTracksState, setNewTracksState] = useState<TrackItem[]>([]);
  const [popularTracksState, setPopularTracksState] = useState<TrackItem[]>([]);

  const displayNew = newTracksState.length > 0 ? newTracksState : (newTracks as TrackItem[]);
  const displayPopular = popularTracksState.length > 0 ? popularTracksState : (popularTracks as TrackItem[]);

  const handleLikeToggle = (
    list: TrackItem[],
    setList: (t: TrackItem[]) => void,
    fallback: TrackItem[],
    id: number,
    liked: boolean,
    count: number
  ) => {
    const source = list.length > 0 ? list : fallback;
    setList(source.map((t) => (t.id === id ? { ...t, liked, likeCount: count } : t)));
  };

  const features = [
    { icon: Upload, title: "簡単アップロード", desc: "MP3などの音楽ファイルをドラッグ&ドロップで投稿" },
    { icon: Headphones, title: "高品質プレイヤー", desc: "ブラウザで直接再生、波形表示付き" },
    { icon: Users, title: "コミュニティ", desc: "コメントやいいねでアーティストを応援" },
    { icon: Music2, title: "ジャンル検索", desc: "好みのジャンルやタグで楽曲を発見" },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-48 h-48 rounded-full bg-accent/5 blur-3xl pointer-events-none" />

        <div className="container py-20 md:py-28 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <Music2 size={14} />
              アマチュアミュージシャンのための音楽プラットフォーム
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              あなたの音楽を
              <br />
              <span className="gradient-neon-text">世界に届けよう</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              誰でも無料で音楽を投稿・共有できるプラットフォーム。
              アマチュアアーティストが繋がり、音楽を発見できる場所。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {isAuthenticated ? (
                <Link href="/upload">
                  <Button size="lg" className="gradient-neon text-white neon-glow-purple border-0 hover:opacity-90 w-full sm:w-auto">
                    <Upload size={18} className="mr-2" />
                    楽曲を投稿する
                  </Button>
                </Link>
              ) : (
                <Button
                  size="lg"
                  onClick={() => (window.location.href = getLoginUrl())}
                  className="gradient-neon text-white neon-glow-purple border-0 hover:opacity-90 w-full sm:w-auto"
                >
                  無料で始める
                </Button>
              )}
              <Link href="/explore">
                <Button size="lg" variant="outline" className="border-border/50 hover:border-primary/50 w-full sm:w-auto">
                  楽曲を探す
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-12 border-t border-border/30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="glass-card rounded-xl p-4 text-center hover:border-primary/30 transition-colors">
              <div className="w-10 h-10 rounded-lg gradient-neon mx-auto mb-3 flex items-center justify-center">
                <f.icon size={20} className="text-white" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* New Tracks */}
      <section className="container py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            <span className="neon-text-cyan">新着</span>楽曲
          </h2>
          <Link href="/explore?sort=new">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              すべて見る <ArrowRight size={14} className="ml-1" />
            </Button>
          </Link>
        </div>
        {displayNew.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Music2 size={40} className="mx-auto mb-3 opacity-30" />
            <p>まだ楽曲がありません。最初の投稿者になりましょう！</p>
          </div>
        ) : (
          <TrackGrid
            tracks={displayNew}
            onLikeToggle={(id, liked, count) =>
              handleLikeToggle(newTracksState, setNewTracksState, newTracks as TrackItem[], id, liked, count)
            }
          />
        )}
      </section>

      {/* Popular Tracks */}
      {displayPopular.length > 0 && (
        <section className="container py-10 border-t border-border/30">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">
              <span className="neon-text-pink">人気</span>楽曲
            </h2>
            <Link href="/explore?sort=popular">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                すべて見る <ArrowRight size={14} className="ml-1" />
              </Button>
            </Link>
          </div>
          <TrackGrid
            tracks={displayPopular}
            onLikeToggle={(id, liked, count) =>
              handleLikeToggle(popularTracksState, setPopularTracksState, popularTracks as TrackItem[], id, liked, count)
            }
          />
        </section>
      )}
    </div>
  );
}
