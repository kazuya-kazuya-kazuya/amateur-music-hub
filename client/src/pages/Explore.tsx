import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import TrackCard from "@/components/TrackCard";

const GENRES = ["すべて", "Pop", "Rock", "Jazz", "Classical", "Electronic", "Hip-Hop", "R&B", "Folk", "Metal", "Ambient", "Other"];

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

export default function Explore() {
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const initialQ = params.get("q") ?? "";
  const initialSort = (params.get("sort") as "new" | "popular") ?? "new";

  const [sort, setSort] = useState<"new" | "popular">(initialSort);
  const [genre, setGenre] = useState<string>("");
  const [search, setSearch] = useState(initialQ);
  const [inputValue, setInputValue] = useState(initialQ);
  const [tracks, setTracks] = useState<TrackItem[]>([]);

  const { data, isLoading, refetch } = trpc.tracks.list.useQuery({
    sort,
    genre: genre || undefined,
    search: search || undefined,
    limit: 40,
  });

  useEffect(() => {
    if (data) setTracks(data as TrackItem[]);
  }, [data]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(inputValue);
  };

  const handleLikeToggle = (id: number, liked: boolean, count: number) => {
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, liked, likeCount: count } : t)));
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          楽曲を<span className="gradient-neon-text">探索</span>
        </h1>
        <p className="text-muted-foreground">アマチュアアーティストの音楽を発見しよう</p>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="タイトル・タグで検索..."
              className="pl-9 bg-secondary border-border/50 focus:border-primary/50"
            />
          </div>
          <Button type="submit" size="sm" className="gradient-neon text-white border-0">
            検索
          </Button>
        </form>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-muted-foreground flex-shrink-0" />
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
      </div>

      {/* Genre filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {GENRES.map((g) => {
          const value = g === "すべて" ? "" : g;
          const active = genre === value;
          return (
            <button
              key={g}
              onClick={() => setGenre(value)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all border ${
                active
                  ? "gradient-neon text-white border-transparent neon-glow-purple"
                  : "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground bg-secondary/50"
              }`}
            >
              {g}
            </button>
          );
        })}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="glass-card rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-square bg-muted" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Search size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">楽曲が見つかりませんでした</p>
          <p className="text-sm mt-1">検索条件を変えてみてください</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">{tracks.length}件の楽曲</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {tracks.map((track) => (
              <TrackCard key={track.id} track={track} onLikeToggle={handleLikeToggle} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
