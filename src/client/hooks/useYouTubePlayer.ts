import { useCallback, useEffect, useRef } from "react";

// Minimal surface of the IFrame Player API we actually use.
interface YTPlayer {
  seekTo(sec: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  getCurrentTime(): number;
  destroy(): void;
}
interface YTNamespace {
  Player: new (el: HTMLElement, opts: object) => YTPlayer;
  PlayerState: { ENDED: number };
}
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | undefined;
const loadApi = (): Promise<YTNamespace> => {
  apiPromise ??= new Promise((resolve) => {
    if (window.YT?.Player) return resolve(window.YT);
    window.onYouTubeIframeAPIReady = () => resolve(window.YT!);
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  });
  return apiPromise;
}

interface Options {
  videoId: string;
  startSec?: number | null;
  endSec?: number | null;
  onEnded?: () => void;
}

/** Mounts a YouTube player into `ref` and exposes seek / currentTime for notes, quiz and summary links. */
export const useYouTubePlayer = ({ videoId, startSec, endSec, onEnded }: Options) => {
  const ref = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const endedRef = useRef(onEnded);
  useEffect(() => {
    endedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    let cancelled = false;
    loadApi().then((YT) => {
      if (cancelled || !ref.current) return;
      const mount = document.createElement("div"); // YT replaces the node it's given
      ref.current.replaceChildren(mount);
      player.current = new YT.Player(mount, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: { start: startSec ?? undefined, end: endSec ?? undefined, rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (e: { data: number }) => e.data === YT.PlayerState.ENDED && endedRef.current?.(),
        },
      });
    });
    return () => {
      cancelled = true;
      player.current?.destroy();
      player.current = null;
    };
  }, [videoId, startSec, endSec]);

  const seek = useCallback((sec: number) => {
    player.current?.seekTo(sec, true);
    player.current?.playVideo();
    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const currentTime = useCallback(() => Math.floor(player.current?.getCurrentTime() ?? 0), []);

  return { ref, seek, currentTime };
}

export type PlayerControls = Pick<ReturnType<typeof useYouTubePlayer>, "seek" | "currentTime">;
