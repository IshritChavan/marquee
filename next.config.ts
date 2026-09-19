import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // TMDB serves every image from this host. Only this path is allowed
    // through the Next.js image optimizer.
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org", pathname: "/t/p/**" },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
