import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Music, TrendingUp, Heart, MessageCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

export default function MyStats() {
  const { user, loading: authLoading } = useAuth();
  const { data: stats, isLoading: statsLoading, error: statsError } = trpc.stats.getTrackStats.useQuery();

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
        <p className="text-muted-foreground">ログインして統計を表示してください</p>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="container py-20 flex justify-center">
        <div className="text-red-400">統計の読み込みに失敗しました</div>
      </div>
    );
  }

  if (statsLoading || !stats) {
    return (
      <div className="container py-20 flex justify-center">
        <div className="text-muted-foreground">統計を読み込み中...</div>
      </div>
    );
  }

  const COLORS = ["#a855f7", "#06b6d4", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

  // 楽曲別いいね数データ
  const trackLikesData = stats.tracks
    .sort((a: any, b: any) => b.likeCount - a.likeCount)
    .slice(0, 10)
    .map((t: any) => ({
      name: t.title.length > 15 ? t.title.substring(0, 15) + "..." : t.title,
      likes: t.likeCount,
    }));

  // 楽曲別再生数データ
  const trackPlaysData = stats.tracks
    .sort((a: any, b: any) => b.playCount - a.playCount)
    .slice(0, 10)
    .map((t: any) => ({
      name: t.title.length > 15 ? t.title.substring(0, 15) + "..." : t.title,
      plays: t.playCount,
    }));

  // ジャンル別再生数データ
  const genreData = Object.entries(stats.byGenre).map(([genre, data]: any) => ({
    name: genre,
    value: data.plays,
  }));

  return (
    <div className="container py-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">統計ダッシュボード</h1>
          <p className="text-muted-foreground">投稿楽曲のパフォーマンスを確認します</p>
        </div>
        <a href="/mymusic">
          <Button variant="outline">← マイ楽曲に戻る</Button>
        </a>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 border-border/50 bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">投稿楽曲</p>
              <p className="text-3xl font-bold text-purple-400">{stats.summary.totalTracks}</p>
            </div>
            <Music size={32} className="text-purple-400/50" />
          </div>
        </Card>

        <Card className="p-6 border-border/50 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">総再生数</p>
              <p className="text-3xl font-bold text-cyan-400">{stats.summary.totalPlays.toLocaleString()}</p>
            </div>
            <TrendingUp size={32} className="text-cyan-400/50" />
          </div>
        </Card>

        <Card className="p-6 border-border/50 bg-gradient-to-br from-pink-500/10 to-pink-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">総いいね数</p>
              <p className="text-3xl font-bold text-pink-400">{stats.summary.totalLikes.toLocaleString()}</p>
            </div>
            <Heart size={32} className="text-pink-400/50" />
          </div>
        </Card>

        <Card className="p-6 border-border/50 bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">総コメント数</p>
              <p className="text-3xl font-bold text-amber-400">{stats.summary.totalComments.toLocaleString()}</p>
            </div>
            <MessageCircle size={32} className="text-amber-400/50" />
          </div>
        </Card>
      </div>

      {/* Timeline Chart */}
      {stats.timeline && stats.timeline.length > 0 && (
        <Card className="p-6 border-border/50 mb-8">
          <h3 className="text-lg font-semibold mb-4">再生数・いいね数の推移</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a2e",
                  border: "1px solid #333",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="plays" stroke="#06b6d4" strokeWidth={2} name="再生数" />
              <Line type="monotone" dataKey="likes" stroke="#ec4899" strokeWidth={2} name="いいね数" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Liked Tracks */}
        <Card className="p-6 border-border/50">
          <h3 className="text-lg font-semibold mb-4">いいね数が多い楽曲 TOP 10</h3>
          {trackLikesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trackLikesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" style={{ fontSize: "12px" }} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#888" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a2e",
                    border: "1px solid #333",
                    borderRadius: "8px",
                  }}
                  cursor={{ fill: "rgba(168, 85, 247, 0.1)" }}
                />
                <Bar dataKey="likes" fill="#ec4899" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">データなし</div>
          )}
        </Card>

        {/* Top Played Tracks */}
        <Card className="p-6 border-border/50">
          <h3 className="text-lg font-semibold mb-4">再生数が多い楽曲 TOP 10</h3>
          {trackPlaysData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trackPlaysData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" style={{ fontSize: "12px" }} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#888" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a2e",
                    border: "1px solid #333",
                    borderRadius: "8px",
                  }}
                  cursor={{ fill: "rgba(6, 182, 212, 0.1)" }}
                />
                <Bar dataKey="plays" fill="#06b6d4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">データなし</div>
          )}
        </Card>
      </div>

      {/* Genre Distribution */}
      {genreData.length > 0 && (
        <Card className="p-6 border-border/50">
          <h3 className="text-lg font-semibold mb-4">ジャンル別再生数分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={genreData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {genreData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a2e",
                  border: "1px solid #333",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Detailed Track Table */}
      <Card className="p-6 border-border/50 mt-8">
        <h3 className="text-lg font-semibold mb-4">楽曲詳細</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">楽曲名</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium">再生数</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium">いいね数</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium">コメント数</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">ジャンル</th>
              </tr>
            </thead>
            <tbody>
              {stats.tracks.map((track: any) => (
                <tr key={track.id} className="border-b border-border/20 hover:bg-background/50 transition-colors">
                  <td className="py-3 px-3 font-medium truncate">{track.title}</td>
                  <td className="text-right py-3 px-3 text-cyan-400">{track.playCount.toLocaleString()}</td>
                  <td className="text-right py-3 px-3 text-pink-400">{track.likeCount.toLocaleString()}</td>
                  <td className="text-right py-3 px-3 text-amber-400">{track.commentCount.toLocaleString()}</td>
                  <td className="py-3 px-3 text-muted-foreground text-sm">{track.genre || "未設定"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
