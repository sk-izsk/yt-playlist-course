// Minimal surface of the YouTube IFrame Player API we use. The official player stays
// underneath on purpose: YouTube's terms require it, and wrappers only re-skin it.

export interface YTPlayer {
  seekTo(sec: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  pauseVideo(): void;
  getPlayerState(): number;
  getCurrentTime(): number;
  setPlaybackRate(rate: number): void;
  destroy(): void;
}
export interface YTNamespace {
  Player: new (el: HTMLElement, opts: object) => YTPlayer;
  PlayerState: { ENDED: number; PLAYING: number };
}
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | undefined;
export const loadApi = (): Promise<YTNamespace> => {
  apiPromise ??= new Promise((resolve) => {
    if (window.YT?.Player) return resolve(window.YT);
    window.onYouTubeIframeAPIReady = () => resolve(window.YT!);
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  });
  return apiPromise;
};
