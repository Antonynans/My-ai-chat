import { getInitials, generateAvatarColor } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";

interface AvatarProps {
  name: string;
  photoURL?: string;
  size?: number;
  showPresence?: boolean;
  isOnline?: boolean;
  isAway?: boolean;
}

export function Avatar({
  name,
  photoURL,
  size = 32,
  showPresence,
  isOnline,
  isAway,
}: AvatarProps) {
  const initials = getInitials(name);
  const color = generateAvatarColor(name);
  const dotSize = Math.max(8, size * 0.28);
  const [imageError, setImageError] = useState(false);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {photoURL && photoURL.trim() && !imageError ? (
        <>
          <Image
            src={photoURL}
            alt={name}
            fill
            sizes={`${size}px`}
            onError={() => setImageError(true)}
            className="rounded-full object-cover"
          />

          <div
            className="avatar-fallback absolute inset-0 hidden items-center justify-center rounded-full text-white/90 font-semibold"
            style={{
              background: color,
              fontSize: size * 0.34,
              fontFamily: "var(--ff-display)",
            }}
          >
            {initials}
          </div>
        </>
      ) : (
        <div
          className="w-full h-full flex items-center justify-center rounded-full text-white/90 font-semibold"
          style={{
            background: color,
            fontSize: size * 0.34,
            fontFamily: "var(--ff-display)",
          }}
        >
          {initials}
        </div>
      )}

      {showPresence && (
        <div
          className="absolute rounded-full border-2"
          style={{
            bottom: -1,
            right: -1,
            width: dotSize,
            height: dotSize,
            background: isOnline
              ? "var(--online)"
              : isAway
                ? "var(--away)"
                : "var(--text3)",
            borderColor: "var(--sidebar)",
          }}
        />
      )}
    </div>
  );
}
