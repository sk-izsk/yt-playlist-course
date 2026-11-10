import { useCallback, useEffect, useRef } from "react";
import { clearPos, readPos, resumeAt, savePos } from "../lib/resume";
import { loadApi, type YTPlayer } from "../lib/youtube-api";

interface Options {
  videoId: string;
  /** Lesson UUID: resume position is saved per lesson. */
  resumeKey: string;
  startSec?: number | null;
  endSec?: number | null;
  speed: number;
  onEnded?: () => void;
  /** Speed changed from YouTube's own menu, so the app remembers it too. */
  onSpeedChange?: (rate: number) => void;
}

const useLatest = <T,>(value: T) => {
  const r = useRef(value);
  useEffect(() => {
    r.current = value;
  }, [value]);
  return r;
};

/** Mounts a YouTube player into `ref`: resumes where you stopped, keeps your speed, exposes controls. */
export const useYouTubePlayer = ({ videoId, resumeKey, startSec, endSec, speed, onEnded, onSpeedChange }: Options) => {
  const ref = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const ready = useRef(false);
  const endedRef = useLatest(onEnded);
  const speedRef = useLatest(speed);
  const speedChangeRef = useLatest(onSpeedChange);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    loadApi().then((YT) => {
      if (cancelled || !ref.current) return;
      const mount = document.createElement("div"); // YT replaces the node it's given
      ref.current.replaceChildren(mount);
      const start = resumeAt(readPos(resumeKey), startSec, endSec) ?? startSec ?? undefined;
      const p = new YT.Player(mount, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: { start, end: endSec ?? undefined, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => {
            ready.current = true;
            p.setPlaybackRate(speedRef.current);
          },
          onStateChange: (e: { data: number }) => {
            if (e.data !== YT.PlayerState.ENDED) return;
            clearPos(resumeKey);
            endedRef.current?.();
          },
          onPlaybackRateChange: (e: { data: number }) => speedChangeRef.current?.(e.data),
        },
      });
      player.current = p;
      // ponytail: polls every 5s; at worst you resume 5s early.
      timer = setInterval(() => {
        if (ready.current && p.getPlayerState() === YT.PlayerState.PLAYING) savePos(resumeKey, p.getCurrentTime());
      }, 5000);
    });
    return () => {
      cancelled = true;
      clearInterval(timer);
      ready.current = false;
      player.current?.destroy();
      player.current = null;
    };
  }, [videoId, resumeKey, startSec, endSec, endedRef, speedRef, speedChangeRef]);

  useEffect(() => {
    if (ready.current) player.current?.setPlaybackRate(speed);
  }, [speed]);

  const seek = useCallback((sec: number) => {
    player.current?.seekTo(sec, true);
    player.current?.playVideo();
    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const currentTime = useCallback(() => Math.floor(player.current?.getCurrentTime() ?? 0), []);

  const togglePlay = useCallback(() => {
    const p = player.current;
    if (!ready.current || !p) return;
    if (p.getPlayerState() === 1) p.pauseVideo();
    else p.playVideo();
  }, []);

  const skip = useCallback((delta: number) => {
    const p = player.current;
    if (ready.current && p) p.seekTo(Math.max(0, p.getCurrentTime() + delta), true);
  }, []);

  return { ref, seek, currentTime, togglePlay, skip };
};

export type PlayerControls = Pick<ReturnType<typeof useYouTubePlayer>, "seek" | "currentTime">;
