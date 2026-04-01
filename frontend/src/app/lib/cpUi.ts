/**
 * ClearPath UI — black + neon green (#DFFF00) brand system
 * Shared across marketing, auth, and app routes.
 */
export const cp = {
  bgPage: 'bg-neutral-100',
  bgCanvas: 'bg-white',
  text: 'text-neutral-900',
  textMuted: 'text-neutral-600',
  textSubtle: 'text-neutral-500',
  /** Use as: className={`border ${cp.borderHairline}`} */
  borderHairline: 'border-neutral-200',
  /** Use as: className={`border ${cp.border}`} */
  border: 'border-neutral-300',

  /** Stat / content card — light surface, black hairline, neon hint on hover */
  card:
    'rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition-all duration-200 hover:border-black/15 hover:shadow-[0_12px_40px_-20px_rgba(0,0,0,0.12)]',
  cardInteractive:
    'rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition-all duration-200 hover:border-[#DFFF00]/40 hover:shadow-[0_16px_48px_-24px_rgba(0,0,0,0.14)]',

  /** Auth & marketing forms */
  panel:
    'relative overflow-hidden rounded-2xl border border-black/10 bg-white p-6 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.12)] sm:p-10',
  label: 'mb-2 block text-left text-[10px] font-mono font-semibold uppercase tracking-widest text-neutral-700',
  input:
    'h-12 w-full rounded-xl border border-black/15 bg-white pl-12 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 transition-all duration-200 focus:border-black focus:outline-none focus:ring-2 focus:ring-[#DFFF00]/40',
  inputNoIcon:
    'h-12 w-full rounded-xl border border-black/15 bg-white px-4 text-sm text-neutral-900 placeholder:text-neutral-400 transition-all duration-200 focus:border-black focus:outline-none focus:ring-2 focus:ring-[#DFFF00]/40',
  inputMultiline:
    'min-h-[120px] w-full resize-y rounded-xl border border-black/15 bg-white py-3 pl-12 pr-4 text-sm font-light leading-relaxed text-neutral-900 placeholder:text-neutral-400 transition-all duration-200 focus:border-black focus:outline-none focus:ring-2 focus:ring-[#DFFF00]/40',

  btnPrimary:
    'inline-flex items-center justify-center gap-2 rounded-xl border border-black bg-[#DFFF00] px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-black transition-all duration-200 hover:bg-[#c8e800] hover:shadow-[0_8px_28px_-6px_rgba(223,255,0,0.45)] active:translate-y-px',
  btnPrimaryBlock:
    'inline-flex w-full items-center justify-center gap-2 rounded-xl border border-black bg-[#DFFF00] px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-black transition-all duration-200 hover:bg-[#c8e800] hover:shadow-[0_8px_28px_-6px_rgba(223,255,0,0.45)] active:translate-y-px',

  linkBack:
    'inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-neutral-600 transition-colors duration-200 hover:text-black',

  /** Ambient decoration */
  blobAccent:
    'pointer-events-none absolute -right-20 top-0 -z-10 h-[min(500px,90vw)] w-[min(500px,90vw)] rounded-full bg-[#DFFF00]/18 blur-[100px]',
  blobNeutral:
    'pointer-events-none absolute -bottom-10 -left-20 -z-10 h-[min(500px,90vw)] w-[min(500px,90vw)] rounded-full bg-black/[0.07] blur-[100px]',

  container: 'mx-auto w-full min-w-0 max-w-7xl px-6',
} as const;
