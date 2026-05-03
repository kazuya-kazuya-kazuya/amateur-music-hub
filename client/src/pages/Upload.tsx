import { useCallback, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Upload as UploadIcon, Music, Image, X, Tag, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const GENRES = ["Pop", "Rock", "Jazz", "Classical", "Electronic", "Hip-Hop", "R&B", "Folk", "Metal", "Ambient", "Other"];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    audio.onloadedmetadata = () => {
      resolve(audio.duration);
      URL.revokeObjectURL(url);
    };
    audio.onerror = () => resolve(0);
    audio.src = url;
  });
}

export default function Upload() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.tracks.upload.useMutation({
    onSuccess: () => {
      toast.success("楽曲をアップロードしました！");
      navigate("/explore");
    },
    onError: (err) => {
      toast.error(`アップロードに失敗しました: ${err.message}`);
      setIsUploading(false);
    },
  });

  const handleAudioDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("audio/")) {
      setAudioFile(file);
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
    } else {
      toast.error("音声ファイルを選択してください");
    }
  }, [title]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const url = URL.createObjectURL(file);
      setCoverPreview(url);
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) { toast.error("音楽ファイルを選択してください"); return; }
    if (!title.trim()) { toast.error("タイトルを入力してください"); return; }

    setIsUploading(true);
    try {
      const audioBase64 = await fileToBase64(audioFile);
      const duration = await getAudioDuration(audioFile);

      let coverBase64: string | undefined;
      let coverMime: string | undefined;
      let coverFileName: string | undefined;
      if (coverFile) {
        coverBase64 = await fileToBase64(coverFile);
        coverMime = coverFile.type;
        coverFileName = coverFile.name;
      }

      await uploadMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        genre: genre || undefined,
        tags,
        audioBase64,
        audioMime: audioFile.type || "audio/mpeg",
        audioFileName: audioFile.name,
        duration: duration || undefined,
        coverBase64,
        coverMime,
        coverFileName,
      });
    } catch {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-20 flex justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center">
        <Music size={48} className="mx-auto mb-4 text-primary opacity-60" />
        <h2 className="text-xl font-bold mb-2">ログインが必要です</h2>
        <p className="text-muted-foreground mb-6">楽曲をアップロードするにはログインしてください</p>
        <Button onClick={() => (window.location.href = getLoginUrl())} className="gradient-neon text-white border-0">
          ログイン
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">
        楽曲を<span className="gradient-neon-text">投稿</span>
      </h1>
      <p className="text-muted-foreground mb-8">あなたの音楽を世界に届けましょう</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Audio file drop zone */}
        <div>
          <Label className="text-sm font-medium mb-2 block">音楽ファイル *</Label>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleAudioDrop}
            onClick={() => audioInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-primary bg-primary/10 neon-glow-purple"
                : audioFile
                ? "border-primary/50 bg-primary/5"
                : "border-border/50 hover:border-primary/40 hover:bg-secondary/50"
            }`}
          >
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setAudioFile(file);
                  if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
                }
              }}
            />
            {audioFile ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-lg gradient-neon flex items-center justify-center">
                  <Music size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">{audioFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(audioFile.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setAudioFile(null); }}
                  className="ml-auto text-muted-foreground hover:text-destructive"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <UploadIcon size={32} className="mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium mb-1">ドラッグ&ドロップ または クリックして選択</p>
                <p className="text-sm text-muted-foreground">MP3, WAV, OGG, M4A など (最大 50MB)</p>
              </>
            )}
          </div>
        </div>

        {/* Cover image */}
        <div>
          <Label className="text-sm font-medium mb-2 block">カバー画像（任意）</Label>
          <div className="flex items-center gap-4">
            <div
              onClick={() => coverInputRef.current?.click()}
              className="w-24 h-24 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/40 cursor-pointer overflow-hidden flex items-center justify-center bg-secondary/50 transition-colors"
            >
              {coverPreview ? (
                <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
              ) : (
                <Image size={24} className="text-muted-foreground" />
              )}
            </div>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
            <div className="text-sm text-muted-foreground">
              <p>JPG, PNG, WebP</p>
              <p>推奨: 500×500px 以上</p>
            </div>
          </div>
        </div>

        {/* Title */}
        <div>
          <Label htmlFor="title" className="text-sm font-medium mb-2 block">タイトル *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="楽曲のタイトル"
            className="bg-secondary border-border/50 focus:border-primary/50"
            maxLength={255}
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="desc" className="text-sm font-medium mb-2 block">説明（任意）</Label>
          <Textarea
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="楽曲の説明、制作背景など..."
            className="bg-secondary border-border/50 focus:border-primary/50 resize-none"
            rows={3}
          />
        </div>

        {/* Genre */}
        <div>
          <Label className="text-sm font-medium mb-2 block">ジャンル（任意）</Label>
          <Select value={genre} onValueChange={setGenre}>
            <SelectTrigger className="bg-secondary border-border/50 focus:border-primary/50">
              <SelectValue placeholder="ジャンルを選択" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {GENRES.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tags */}
        <div>
          <Label className="text-sm font-medium mb-2 block">タグ（任意・最大10個）</Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="タグを入力してEnter"
              className="bg-secondary border-border/50 focus:border-primary/50"
            />
            <Button type="button" onClick={addTag} variant="outline" size="sm" className="flex-shrink-0 border-border/50">
              <Plus size={16} />
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs border border-primary/20">
                  <Tag size={10} />
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive ml-0.5">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isUploading || !audioFile || !title.trim()}
          className="w-full gradient-neon text-white border-0 neon-glow-purple hover:opacity-90 h-11"
        >
          {isUploading ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              アップロード中...
            </>
          ) : (
            <>
              <UploadIcon size={16} className="mr-2" />
              楽曲を投稿する
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
