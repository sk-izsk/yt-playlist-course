import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

// One family (Geist) for everything; Geist Mono only for times, counts and ids.
const sans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tubewise — YouTube playlists as routes you finish",
  description: "Turn YouTube videos and playlists into courses you finish, one station at a time.",
};

const RootLayout = ({ children }: LayoutProps<"/">) => (
  <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
    <body>
      <Providers>{children}</Providers>
    </body>
  </html>
);

export default RootLayout;
