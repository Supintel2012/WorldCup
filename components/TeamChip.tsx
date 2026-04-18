import Image from "next/image";
import { cn, flagUrl, confedColor } from "@/lib/utils";
import type { Team } from "@/types";

export function TeamChip({
  team,
  showConfed = false,
  size = "md",
  className,
}: {
  team: Team;
  showConfed?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: { img: 16, text: "text-xs", gap: "gap-1.5" },
    md: { img: 24, text: "text-sm", gap: "gap-2" },
    lg: { img: 32, text: "text-base", gap: "gap-3" },
  }[size];

  return (
    <span className={cn("inline-flex items-center", sizes.gap, sizes.text, className)}>
      <Image
        src={flagUrl(team.code)}
        alt={`${team.name} flag`}
        width={sizes.img}
        height={sizes.img * 0.66}
        className="rounded-sm shadow-sm"
        unoptimized
      />
      <span className="font-medium">{team.name}</span>
      {showConfed && (
        <span className={cn("chip text-white", confedColor(team.confederation))}>
          {team.confederation}
        </span>
      )}
    </span>
  );
}
