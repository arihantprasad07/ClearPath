import React from "react";
import { Sparkles } from "lucide-react";

export function PoweredByGeminiBadge({ dark = true }: { dark?: boolean }) {
  return (
    <div
      className={`pointer-events-none fixed bottom-4 right-4 z-[70] flex items-center gap-3 rounded-full border px-4 py-2 text-xs shadow-[0_18px_40px_-20px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:bottom-6 sm:right-6 ${
        dark
          ? "border-white/10 bg-black/75 text-white"
          : "border-black/10 bg-white/90 text-black"
      }`}
      aria-label="Powered by Gemini 2.0 Flash"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4285F4_0%,#34A853_35%,#FBBC05_68%,#EA4335_100%)] text-white">
        <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
      </span>
      <span className="font-medium tracking-tight">Powered by Gemini 2.0 Flash</span>
    </div>
  );
}
