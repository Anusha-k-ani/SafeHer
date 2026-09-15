import * as React from "react";
import { cn } from "@/lib/utils";
import type { SafetyLevel } from "@/lib/types";
import { safetyLevelBg, safetyLevelColor } from "@/lib/colors";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  level?: SafetyLevel;
}

export function Badge({ className, level, children, ...props }: BadgeProps) {
  const style = level
    ? {
        backgroundColor: safetyLevelBg(level),
        color: safetyLevelColor(level),
        borderColor: safetyLevelColor(level),
      }
    : undefined;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        !level && "border-[#D1D5DB] bg-[#F9FAFB] text-[#374151]",
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </span>
  );
}

export function ScoreBadge({ score, level }: { score: number; level: SafetyLevel }) {
  return (
    <Badge level={level}>
      {score.toFixed(2)} · {level}
    </Badge>
  );
}
