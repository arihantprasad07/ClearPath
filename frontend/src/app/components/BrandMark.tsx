import React from "react";
import { Route } from "lucide-react";

export function BrandMark({
  compact = false,
  dark = false,
}: {
  compact?: boolean;
  dark?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex items-center justify-center rounded-2xl border ${
          dark
            ? "border-white/10 bg-[#111111] text-[#AAFF45] shadow-[0_0_26px_rgba(170,255,69,0.18)]"
            : "border-black/10 bg-black text-[#AAFF45]"
        } ${compact ? "h-10 w-10 rounded-xl" : "h-12 w-12"}`}
      >
        <Route className={compact ? "h-4 w-4" : "h-5 w-5"} strokeWidth={2.2} />
      </div>
      <div>
        <p className={`font-['Outfit'] font-semibold tracking-tight ${compact ? "text-lg" : "text-2xl"} ${dark ? "text-white" : "text-black"}`}>
          ClearPath
        </p>
        {!compact ? (
          <p className={`text-xs uppercase tracking-[0.28em] ${dark ? "text-white/45" : "text-neutral-500"}`}>
            AI Supply Chain Co-pilot
          </p>
        ) : null}
      </div>
    </div>
  );
}
