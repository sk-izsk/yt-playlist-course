import { Innertube, Log } from "youtubei.js";

// youtubei.js logs parser warnings for every unknown renderer; keep the console readable.
Log.setLevel(Log.Level.ERROR);

let instance: Promise<Innertube> | undefined;

/** One shared InnerTube session; creating it costs a network round trip. */
export const youtube = (): Promise<Innertube> => {
  instance ??= Innertube.create({ retrieve_player: false }).catch((err) => {
    instance = undefined; // let the next call retry
    throw err;
  });
  return instance;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
