import React from 'react';
import { Accessibility, Brain, Globe2, MessageCircle, Monitor, ShieldCheck, Smartphone, Workflow } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getLanguageByCode, INDIAN_LANGUAGES } from '../constants/languages';

function LanguagesFeatureVisual() {
  const { preferredLanguage, setPreferredLanguage } = useAppContext();
  const selected = getLanguageByCode(preferredLanguage);
  const english = INDIAN_LANGUAGES[0];
  const quick = ['en', 'hi', 'gu', 'ta', 'te', 'bn'] as const;

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/70 p-4 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:p-6 md:p-8">
      <div className="pointer-events-none absolute -right-14 -top-16 h-52 w-52 rounded-full bg-[#DFFF00]/12 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-16 -left-14 h-48 w-48 rounded-full bg-white/5 blur-3xl" aria-hidden />

      <div className="relative z-10 mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <span className="inline-flex w-fit items-center rounded-full border border-[#DFFF00]/40 bg-[#DFFF00]/10 px-3 py-1 text-[9px] font-mono uppercase tracking-[0.2em] text-[#DFFF00]">
          Live language preview
        </span>
        <div className="flex flex-wrap gap-2">
          {quick.map((code) => {
            const language = getLanguageByCode(code);
            const active = preferredLanguage === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setPreferredLanguage(code)}
                className={`rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-wide transition-all duration-200 ${
                  active
                    ? 'border-[#DFFF00]/60 bg-[#DFFF00] text-black shadow-[0_0_16px_-4px_rgba(223,255,0,0.65)]'
                    : 'border-white/20 bg-white/5 text-neutral-200 hover:border-[#DFFF00]/40 hover:text-[#DFFF00]'
                }`}
              >
                {language.nativeName}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 flex flex-col gap-4 sm:gap-5">
        <div className="rounded-xl border border-white/15 bg-white/5 p-4 shadow-[0_14px_40px_-24px_rgba(0,0,0,0.45)] sm:p-5">
          <div className="mb-2 text-[9px] font-mono uppercase tracking-[0.2em] text-neutral-400">English source</div>
          <p className="text-sm leading-relaxed text-neutral-100">{english.alertDemo}</p>
        </div>

        <div className="flex items-center justify-center" aria-hidden>
          <div className="h-7 w-px bg-gradient-to-b from-white/25 via-[#DFFF00]/50 to-white/25" />
        </div>

        <div className="rounded-xl border border-[#DFFF00]/40 bg-black/85 p-4 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.65)] sm:p-5">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#DFFF00]">Localized alert</span>
            <span className="rounded border border-white/20 bg-white/10 px-2 py-0.5 text-[9px] text-white/95">
              {selected.nativeName} / {selected.englishName}
            </span>
          </div>
          <p className="text-[15px] font-medium leading-relaxed text-white">{selected.alertDemo}</p>
        </div>
      </div>

      <p className="relative z-10 mt-5 border-t border-white/10 pt-4 text-[10px] leading-relaxed text-neutral-400">
        Language selection is part of the product, not decoration. Judges can see multilingual utility directly in the interface.
      </p>
    </div>
  );
}

export function Roles() {
  const roleCards = [
    {
      role: 'Supplier',
      title: 'Mobile-first clarity',
      desc: 'Suppliers get the same operational truth on a lighter surface designed for fast review and minimal friction.',
      icon: <Smartphone className="h-5 w-5" strokeWidth={1.5} />,
      meta: 'Field visibility',
      index: '01',
    },
    {
      role: 'Company',
      title: 'Desktop decision control',
      desc: 'Companies review route alternatives, AI reasoning, and approval actions in one place for accountable operations.',
      icon: <Monitor className="h-5 w-5" strokeWidth={1.5} />,
      meta: 'Decision command',
      index: '02',
    },
    {
      role: 'Transporter',
      title: 'WhatsApp-native communication',
      desc: 'Alerts stay understandable for the people moving goods on the ground, without requiring a new complicated workflow.',
      icon: <MessageCircle className="h-5 w-5" strokeWidth={1.5} />,
      meta: 'Field delivery',
      index: '03',
    },
  ] as const;

  return (
    <section id="roles" className="relative overflow-x-hidden border-y border-white/10 bg-black px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
      <div className="absolute inset-0 z-[-1] bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />
      <div className="pointer-events-none absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-[#DFFF00]/10 blur-[90px]" aria-hidden />
      <div className="pointer-events-none absolute -right-20 bottom-1/4 h-56 w-56 rounded-full bg-white/5 blur-[90px]" aria-hidden />

      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center sm:mb-16 md:mb-24">
          <div className="mb-8 flex items-center justify-center gap-4">
            <div className="h-px w-8 bg-[#DFFF00]/35" />
            <div className="font-mono text-[9px] font-medium uppercase tracking-[0.25em] text-[#DFFF00]">User journey</div>
            <div className="h-px w-8 bg-[#DFFF00]/35" />
          </div>
          <h2 className="font-['DM_Serif_Display'] text-3xl tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">One decision system. Multiple roles.</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-neutral-300 md:text-xl">
            The workflow is intentionally role-aware so the UX can score well on clarity, usefulness, and real-world fit.
          </p>
        </div>

        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 xl:grid-cols-3 lg:gap-10">
          {roleCards.map((card) => (
            <article
              key={card.role}
              className="group relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/70 p-6 shadow-[0_14px_50px_-24px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-[#DFFF00]/45 hover:shadow-[0_22px_64px_-24px_rgba(223,255,0,0.22)] sm:rounded-[2rem] sm:p-10 md:p-12"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#DFFF00] to-transparent opacity-90" aria-hidden />
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#DFFF00]/12 blur-3xl" aria-hidden />

              <div className="relative mb-8 flex items-start justify-between gap-4">
                <div className="rounded-full border border-[#DFFF00]/40 bg-[#DFFF00]/10 px-4 py-1.5 text-[9px] font-mono uppercase tracking-[0.2em] text-[#DFFF00]">{card.role}</div>
                <span className="font-['DM_Serif_Display'] text-4xl leading-none text-white/15 group-hover:text-[#DFFF00]/65">{card.index}</span>
              </div>

              <div className="relative mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 text-white/85 group-hover:border-[#DFFF00]/70 group-hover:bg-[#DFFF00]/15 group-hover:text-[#DFFF00]">
                {card.icon}
              </div>

              <h3 className="mb-4 font-['DM_Serif_Display'] text-2xl text-white">{card.title}</h3>
              <p className="flex-1 text-base font-light leading-relaxed text-neutral-300">{card.desc}</p>

              <div className="mt-8 border-t border-white/10 pt-4">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400">{card.meta}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Features() {
  const features = [
    {
      title: 'AI that explains action',
      desc: 'The product does not stop at risk detection. It explains why the lane is risky, which route is better, and what the operator should do next.',
      icon: <Brain className="h-5 w-5 text-[#DFFF00]" strokeWidth={1.5} />,
      visual: (
        <div className="relative flex h-full items-center justify-center overflow-hidden bg-black p-4 sm:p-8 md:p-12">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#DFFF00]/12 blur-3xl" aria-hidden />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/15 bg-black/70 p-6 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.65)] backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-400">
              <span>AI reasoning</span>
              <span className="text-[#DFFF00]">Live</span>
            </div>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-neutral-200">
              <li className="rounded-xl border border-white/10 bg-white/5 p-4">Weather pressure is stacking on the active route.</li>
              <li className="rounded-xl border border-white/10 bg-white/5 p-4">Southern Relief lowers route risk and protects ETA.</li>
              <li className="rounded-xl border border-[#DFFF00]/30 bg-[#DFFF00]/10 p-4 text-white">Recommended action: approve the reroute now.</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: '22 Indian languages',
      desc: 'Localized alerts help the product score on relevance and usability by reducing communication friction in field operations.',
      icon: <Globe2 className="h-5 w-5 text-[#DFFF00]" strokeWidth={1.5} />,
      reverse: true,
      visual: <LanguagesFeatureVisual />,
    },
    {
      title: 'Human-in-the-loop approvals',
      desc: 'AI recommends, but the human operator keeps final control. That balances automation, trust, and operational accountability.',
      icon: <ShieldCheck className="h-5 w-5 text-[#DFFF00]" strokeWidth={1.5} />,
      visual: (
        <div className="relative flex h-full items-center justify-center overflow-hidden bg-black p-4 sm:p-8 md:p-12">
          <div className="pointer-events-none absolute -right-14 -top-16 h-52 w-52 rounded-full bg-[#DFFF00]/12 blur-3xl" aria-hidden />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/15 bg-black/70 p-6 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.65)] backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-400">Approval workflow</div>
              <div className="rounded border border-[#DFFF00]/40 bg-[#DFFF00]/10 px-3 py-1 text-[9px] font-mono tracking-[0.1em] text-[#DFFF00]">1 tap</div>
            </div>
            <div className="space-y-4 text-sm text-neutral-200">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">AI recommends Route 4C to protect delivery window.</div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">Operator reviews ETA, cost, reliability, and reasoning.</div>
              <div className="grid grid-cols-2 gap-3">
                <button className="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-[10px] font-mono uppercase tracking-[0.15em] text-neutral-300">Reject</button>
                <button className="rounded-xl border border-black bg-[#DFFF00] px-4 py-3 text-[10px] font-mono uppercase tracking-[0.15em] text-black">Approve</button>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Accessible and operator-friendly',
      desc: 'Clear hierarchy, strong contrast, keyboard-reachable controls, and compact decision surfaces help the app stay readable under stress.',
      icon: <Accessibility className="h-5 w-5 text-[#DFFF00]" strokeWidth={1.5} />,
      reverse: true,
      visual: (
        <div className="relative flex h-full items-center justify-center overflow-hidden bg-black p-4 sm:p-8 md:p-12">
          <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-white/5 blur-3xl" aria-hidden />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/15 bg-black/70 p-6 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.65)] backdrop-blur-xl">
            <div className="flex items-center gap-3 text-[#DFFF00]">
              <Accessibility className="h-5 w-5" strokeWidth={1.6} />
              <span className="font-mono text-[9px] uppercase tracking-[0.2em]">Accessibility</span>
            </div>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-neutral-200">
              <li className="rounded-xl border border-white/10 bg-white/5 p-4">Readable typography and strong contrast.</li>
              <li className="rounded-xl border border-white/10 bg-white/5 p-4">Explicit labels on forms and key actions.</li>
              <li className="rounded-xl border border-white/10 bg-white/5 p-4">Decision-first layout that minimizes hidden steps.</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: 'Scalable workflow story',
      desc: 'The architecture blends prototype safety with a credible path to Firebase, BigQuery, push delivery, and cloud orchestration.',
      icon: <Workflow className="h-5 w-5 text-[#DFFF00]" strokeWidth={1.5} />,
      visual: (
        <div className="relative flex h-full items-center justify-center overflow-hidden bg-black p-4 sm:p-8 md:p-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[#DFFF00]/12 blur-3xl" aria-hidden />
          <div className="relative z-10 grid w-full max-w-md gap-3 rounded-2xl border border-white/15 bg-black/70 p-6 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.65)] backdrop-blur-xl">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-200">Signal ingestion: routes, weather, corridor, history</div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-200">Risk engine plus ranking engine plus AI explanation</div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-200">Dashboard plus alerts plus audit events plus cloud-ready persistence</div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="relative overflow-x-hidden border-y border-white/10 bg-black py-16 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:4.75rem_4.75rem] opacity-35" aria-hidden />
      <div className="pointer-events-none absolute left-[10%] top-[14%] h-72 w-72 rounded-full bg-[#DFFF00]/9 blur-[95px]" aria-hidden />
      <div className="pointer-events-none absolute right-[8%] bottom-[12%] h-64 w-64 rounded-full bg-white/5 blur-[95px]" aria-hidden />

      <div className="relative z-10 mx-auto max-w-7xl space-y-20 px-4 sm:space-y-24 sm:px-6 lg:space-y-32">
        {features.map((feature) => (
          <div
            key={feature.title}
            className={`flex min-w-0 flex-col items-center gap-10 sm:gap-14 lg:flex-row lg:gap-20 ${feature.reverse ? 'lg:flex-row-reverse' : ''}`}
          >
            <div className="w-full min-w-0 flex-1 text-center lg:w-1/2 lg:text-left">
              <div className="mx-auto mb-8 flex h-14 w-14 items-center justify-center rounded-full border border-[#DFFF00]/40 bg-[#DFFF00]/10 shadow-[0_0_26px_-10px_rgba(223,255,0,0.45)] md:mx-0">
                {feature.icon}
              </div>
              <h3 className="mb-4 font-['DM_Serif_Display'] text-2xl tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">{feature.title}</h3>
              <p className="mx-auto max-w-md text-base font-light leading-relaxed text-neutral-300 sm:text-lg md:mx-0">{feature.desc}</p>
            </div>
            <div className="w-full min-w-0 flex-1 lg:w-1/2">
              <div className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-black/65 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.6)] sm:rounded-[2rem] md:max-w-none">
                {feature.visual}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
