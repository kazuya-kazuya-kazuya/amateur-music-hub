import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface EditTrackDialogProps {
  trackId: number;
  title: string;
  description?: string;
  genre?: string;
  tags?: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function EditTrackDialog({
  trackId,
  title: initialTitle,
  description: initialDescription,
  genre: initialGenre,
  tags: initialTags,
  open,
  onOpenChange,
  onSuccess,
}: EditTrackDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription || "");
  const [genre, setGenre] = useState(initialGenre || "");
  const [tagsInput, setTagsInput] = useState((initialTags || []).join(", "));

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setDescription(initialDescription || "");
      setGenre(initialGenre || "");
      setTagsInput((initialTags || []).join(", "));
    }
  }, [trackId, open, initialTitle, initialDescription, initialGenre, initialTags]);

  const updateMutation = trpc.tracks.update.useMutation({
    onSuccess: () => {
      toast.success("楽曲を更新しました");
      onOpenChange(false);
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "更新に失敗しました");
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("タイトルを入力してください");
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    updateMutation.mutate({
      id: trackId,
      title: title.trim(),
      description: description.trim() || undefined,
      genre: genre.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>楽曲を編集</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-sm font-medium">
              タイトル
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="楽曲のタイトル"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              説明
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="楽曲の説明（オプション）"
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="genre" className="text-sm font-medium">
              ジャンル
            </Label>
            <Input
              id="genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="例: Rock, Pop, Jazz"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="tags" className="text-sm font-medium">
              タグ
            </Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="カンマで区切って入力（例: acoustic, original）"
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="gradient-neon text-white"
          >
            {updateMutation.isPending ? "更新中..." : "更新"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
