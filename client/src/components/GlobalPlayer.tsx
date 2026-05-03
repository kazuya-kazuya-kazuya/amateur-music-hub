import { useEffect, useRef } from "react";
import { Link } from "wouter";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { trpc } from "@/lib/trpc";

function formatTime(s: number) {
  if (!isFinite(s) || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function GlobalPlayer() {
  const { currentTrack, isPlaying, volume, currentTime, duration, audioRef, pause, resume, setVolume, seek, setCurrentTime, setDuration } = usePlayer();
  const progressRef = useRef<HTMLInputElement>(null);
  const incrementPlay = trpc.tracks.incrementPlay.useMutation();
  const hasCountedRef = useRef<number | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    audio.src = currentTrack.fileUrl;
    audio.volume = volume;
    audio.play().catch(() => {});

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration);
    const onEnded = () => pause();

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
    };
  }, [currentTrack]);

  // Count play after 10 seconds
  useEffect(() => {
    if (currentTrack && currentTime >= 10 && hasCountedRef.current !== currentTrack.id) {
      hasCountedRef.current = currentTrack.id;
      incrementPlay.mutate({ id: currentTrack.id });
    }
  }, [currentTime, currentTrack]);

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/50">
      {/* Progress bar */}
      <div className="relative h-1 bg-muted cursor-pointer group">
        <div
          className="h-full gradient-neon transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
        <input
          ref={progressRef}
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={(e) => seek(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-1"
        />
      </div>

      <div className="flex items-center gap-4 px-4 py-3">
        {/* Track info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-muted">
            {currentTrack.coverUrl ? (
              <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full gradient-neon opacity-60 flex items-center justify-center text-white text-xs">♪</div>
            )}
          </div>
          <div className="min-w-0">
            <Link href={`/track/${currentTrack.id}`}>
              <p className="text-sm font-medium text-foreground truncate hover:neon-text-purple transition-colors cursor-pointer">
                {currentTrack.title}
              </p>
            </Link>
            <p className="text-xs text-muted-foreground truncate">{currentTrack.userName ?? "Unknown Artist"}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={isPlaying ? pause : resume}
            className="w-9 h-9 rounded-full gradient-neon flex items-center justify-center text-white neon-glow-purple hover:scale-105 transition-transform"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>
        </div>

        {/* Time */}
        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>/</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Volume */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-20"
          />
        </div>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} preload="metadata" />
    </div>
  );
}
