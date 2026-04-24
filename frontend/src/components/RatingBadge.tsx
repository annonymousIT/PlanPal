"use client";

import { Rating } from "@/types";

const config: Record<string, { icon: string; bg: string; text: string }> = {
  circle: { icon: "◯", bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-600 dark:text-emerald-400" },
  triangle: { icon: "△", bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-600 dark:text-amber-400" },
  cross: { icon: "✕", bg: "bg-rose-100 dark:bg-rose-900/40", text: "text-rose-500 dark:text-rose-400" },
};

interface RatingBadgeProps {
  rating: Rating;
  size?: "sm" | "md" | "lg";
}

export default function RatingBadge({ rating, size = "sm" }: RatingBadgeProps) {
  if (!rating) return null;
  const c = config[rating];
  const sizeClass = {
    sm: "w-5 h-5 text-xs",
    md: "w-8 h-8 text-base",
    lg: "w-14 h-14 text-2xl",
  }[size];

  return (
    <span className={`inline-flex items-center justify-center rounded-full font-bold ${c.bg} ${c.text} ${sizeClass}`}>
      {c.icon}
    </span>
  );
}
