import React from "react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f3f1ec] px-3 py-3 sm:px-4 sm:py-4">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1800px] flex-col overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-[0_30px_100px_-40px_rgba(0,0,0,0.35)] sm:min-h-[calc(100vh-2rem)]">
        <div className="flex items-center justify-between gap-4 border-b border-black/10 bg-white/90 px-5 py-4 backdrop-blur">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-neutral-500">ClearPath frontend</div>
            <h1 className="mt-1 font-['DM_Serif_Display'] text-2xl leading-none text-neutral-950 sm:text-3xl">
              Figma-driven interface
            </h1>
          </div>
          <a
            href="https://www.figma.com/design/VQSzgSv570en1dzf3vbQph/Untitled?node-id=1-516"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-black bg-[#DFFF00] px-5 py-2 text-sm font-semibold text-black transition hover:bg-[#c8e800]"
          >
            Open in Figma
          </a>
        </div>

        <div className="flex-1 bg-[#f6f4ef]">
          <iframe
            title="ClearPath Figma Design"
            src="https://embed.figma.com/design/VQSzgSv570en1dzf3vbQph/Untitled?node-id=1-516&embed-host=share"
            allowFullScreen
            className="h-full min-h-[calc(100vh-7rem)] w-full"
            style={{ border: "0" }}
          />
        </div>
      </div>
    </div>
  );
}
