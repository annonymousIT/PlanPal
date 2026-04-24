"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Rating } from "@/types";

interface RatingButtonsProps {
  currentRating: Rating;
  onRate: (rating: Rating) => void;
}

const buttons: { value: Rating; icon: string; label: string; activeClass: string; activeBg: string }[] = [
  { value: "circle", icon: "◯", label: "まる", activeClass: "bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/50", activeBg: "#10B981" },
  { value: "triangle", icon: "△", label: "三角", activeClass: "bg-amber-500 text-white shadow-lg shadow-amber-200 dark:shadow-amber-900/50", activeBg: "#F59E0B" },
  { value: "cross", icon: "✕", label: "ばつ", activeClass: "bg-rose-500 text-white shadow-lg shadow-rose-200 dark:shadow-rose-900/50", activeBg: "#F43F5E" },
];

export default function RatingButtons({ currentRating, onRate }: RatingButtonsProps) {
  const [hovered, setHovered] = useState<Rating>(null);

  return (
    <div className="flex items-center gap-3">
      {buttons.map((btn) => {
        const isActive = currentRating === btn.value;
        return (
          <motion.button
            key={btn.value}
            onClick={() => onRate(isActive ? null : btn.value)}
            onHoverStart={() => setHovered(btn.value)}
            onHoverEnd={() => setHovered(null)}
            whileTap={{ scale: 0.9 }}
            animate={{
              scale: isActive ? 1.05 : hovered === btn.value ? 1.1 : 1,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={`
              flex flex-col items-center gap-1 px-4 py-3 rounded-2xl
              transition-colors duration-200 cursor-pointer
              ${isActive ? btn.activeClass : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}
            `}
          >
            <span className="text-2xl font-bold">{btn.icon}</span>
            <span className="text-[10px] font-medium tracking-wider">{btn.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
