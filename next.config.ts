import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native / Node-heavy deps stay out of the bundle and load from node_modules.
  serverExternalPackages: ["pg", "youtubei.js", "youtube-transcript-plus"],
};

export default nextConfig;
