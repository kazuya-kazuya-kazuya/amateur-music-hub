import React, { createContext, useCallback, useContext, useRef, useState } from "react";

export interface PlayerTrack {
  id: number;
  title: string;
  userName: string | null;
  fileUrl: string;
  coverUrl: string | null;
  duration: number | null;
}

interface PlayerState {
  currentTrack: PlayerTrack | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
}

interface PlayerContextValue extends PlayerState {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  play: (track: PlayerTrack) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  setVolume: (v: number) => void;
  seek: (time: number) => void;
  setCurrentTime: (t: number) => void;
  setDuration: (d: number) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<PlayerTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const play = useCallback((track: PlayerTrack) => {
    setCurrentTrack(track);
    setCurrentTime(0);
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play();
    setIsPlaying(true);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) pause();
    else resume();
  }, [isPlaying, pause, resume]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        volume,
        currentTime,
        duration,
        audioRef,
        play,
        pause,
        resume,
        togglePlay,
        setVolume,
        seek,
        setCurrentTime,
        setDuration,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
