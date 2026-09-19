"use client";

import Image from "next/image";
import { useState } from "react";
import { Clapperboard, User } from "lucide-react";
import { initials, tmdbImage, type ImageSize } from "@/lib/utils/images";

/**
 * A TMDB image that fills its (relatively positioned) parent, with a graceful fallback.
 * Fallback shows when: there's no path, or the image fails to load.
 *
 * Uses next/image, so images are resized, converted to AVIF/WebP and lazy-loaded automatically.
 */
export function TmdbImage({
  path,
  size,
  alt,
  sizes,
  kind = "poster",
  label,
  className = "",
  preload = false,
  quiet = false,
}: {
  path: string | null | undefined;
  size: ImageSize;
  alt: string;
  /** The `sizes` attribute — tells the browser how wide the image will render. */
  sizes: string;
  kind?: "poster" | "person" | "backdrop";
  /** Used for the person fallback initials. */
  label?: string;
  className?: string;
  preload?: boolean;
  /** For decorative images: when missing or broken, render nothing instead of an icon placeholder. */
  quiet?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const src = tmdbImage(path, size);

  if (!src || failed) {
    if (quiet) return null;
    return (
      <div
        role="img"
        aria-label={alt}
        className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-lift to-panel text-dim"
      >
        {kind === "person" ? (
          label ? (
            <span className="font-display text-[clamp(1.25rem,30%,3.5rem)] text-mist">{initials(label)}</span>
          ) : (
            <User className="size-1/3" strokeWidth={1.25} />
          )
        ) : (
          <Clapperboard className="size-1/4 max-w-10" strokeWidth={1.25} />
        )}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      preload={preload}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
