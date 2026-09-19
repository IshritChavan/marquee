import type { Metadata, Viewport } from "next";
// Fonts are bundled from npm (Fontsource) rather than fetched from Google at build time,
// so builds work offline and there is no layout shift from a late font swap.
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/instrument-sans";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

export const metadata: Metadata = {
  title: {
    default: "Marquee: the numbers behind the stars",
    template: "%s · Marquee",
  },
  description:
    "Explore actor careers through ratings, box office, genres, awards, collaborators and career trends.",
  openGraph: {
    title: "Marquee: the numbers behind the stars",
    description: "Actor careers, ratings, box office, awards and collaborations, analysed.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#121316",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
