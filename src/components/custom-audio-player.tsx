"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause } from "lucide-react";

interface CustomAudioPlayerProps {
  msgId: number;
  url: string;
}

export function CustomAudioPlayer({ msgId, url }: CustomAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    // Correct URL handling for host
    const fullUrl = url.startsWith("http") ? url : `http://localhost:3000${url}`;
    const audio = new Audio(fullUrl);
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const onPause = () => {
      setIsPlaying(false);
    };

    const onPlay = () => {
      setIsPlaying(true);
      if (typeof window !== "undefined") {
        const players = (window as any)._activeAudioPlayers || {};
        Object.keys(players).forEach((id) => {
          if (parseInt(id) !== msgId && players[id]) {
            players[id].pause();
          }
        });
        players[msgId] = audio;
        (window as any)._activeAudioPlayers = players;
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("play", onPlay);

    // Fetch meta immediately if already cached/preloaded
    if (audio.readyState >= 1) {
      setDuration(audio.duration);
    }

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("play", onPlay);
      if (typeof window !== "undefined" && (window as any)._activeAudioPlayers) {
        delete (window as any)._activeAudioPlayers[msgId];
      }
    };
  }, [url, msgId]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  };

  const handleSpeedChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    let nextRate = 1.0;
    if (playbackRate === 1.0) nextRate = 1.5;
    else if (playbackRate === 1.5) nextRate = 2.0;
    else nextRate = 1.0;

    audioRef.current.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progress = clickX / rect.width;
    audioRef.current.currentTime = progress * duration;
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const heights = [10, 16, 8, 12, 18, 22, 14, 10, 16, 20, 12, 8, 14, 18, 10, 12, 16, 22, 14, 8, 12, 16, 10];
  const progressRatio = duration ? currentTime / duration : 0;
  const activeBarIndex = Math.floor(progressRatio * heights.length);

  return (
    <div className="flex flex-col gap-1 w-full max-w-[280px]">
      <div className="flex items-center gap-3 bg-white/60 border border-slate-100/80 p-2 rounded-xl dark:bg-zinc-900/60 dark:border-zinc-800/80 backdrop-blur-sm">
        <button
          type="button"
          onClick={togglePlay}
          className="flex items-center justify-center h-8 w-8 rounded-full bg-[#0f62ac] text-white hover:bg-[#0d5494] active:scale-95 transition-all shadow-sm select-none shrink-0"
        >
          {isPlaying ? (
            <Pause className="h-3.5 w-3.5 fill-current" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
          )}
        </button>

        <div
          onClick={handleSeek}
          className="flex-1 h-6 flex items-center justify-between gap-[3px] cursor-pointer select-none"
        >
          {heights.map((h, idx) => {
            const isActive = idx <= activeBarIndex;
            return (
              <span
                key={idx}
                className={`w-[3px] rounded-full transition-all duration-200 ${
                  isActive
                    ? "bg-[#0f62ac] opacity-100"
                    : "bg-slate-300 opacity-60 dark:bg-zinc-700"
                }`}
                style={{ height: `${h}px` }}
              />
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleSpeedChange}
          className="text-[10px] font-bold px-1.5 py-1 rounded-md bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 transition-colors select-none shrink-0 w-8 text-center"
        >
          {playbackRate}x
        </button>
      </div>

      <div className="flex justify-between items-center px-1 text-[9px] text-slate-500/80 dark:text-slate-400/80 font-medium select-none">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration || 0)}</span>
      </div>
    </div>
  );
}
