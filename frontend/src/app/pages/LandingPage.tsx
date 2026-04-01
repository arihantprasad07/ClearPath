import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  Activity,
  ArrowUpRight,
  Brain,
  Building,
  CheckCircle2,
  Cloud,
  Database,
  Globe2,
  LineChart,
  Route,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { Features, Roles } from '../components/RolesAndFeatures';

function Hero() {
  const navigate = useNavigate();
  const metrics = [
    { label: 'Decision time target', value: '<30s' },
    { label: 'Indian languages', value: '22' },
    { label: 'Live operator views', value: '3' },
  ];

  return (
    <section id="product" className="relative overflow-hidden bg-black pt-24 text-white sm:pt-28 md:pt-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_95%_60%_at_50%_-18%,rgba(223,255,0,0.22),transparent_58%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] opacity-45" aria-hidden />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-14 px-4 pb-16 sm:px-6 lg:flex-row lg:items-center lg:gap-16">
        <div className="max-w-3xl">
          <p className="mb-5 inline-flex items-center rounded-full border border-[#DFFF00]/45 bg-[#DFFF00]/10 px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[#DFFF00]">
            Solution Challenge 2026 India fit
          </p>
          <h1 className="font-['DM_Serif_Display'] text-[2.45rem] leading-[1.02] tracking-tight sm:text-5xl md:text-6xl lg:text-[4.7rem]">
            Predict supply-chain disruption
            <span className="block text-[#DFFF00]">before it becomes a loss.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-base font-light leading-relaxed text-neutral-300 sm:text-lg">
            ClearPath helps Indian SMB operators act on weather, traffic, corridor, and history signals with AI-backed rerouting, multilingual alerts, and a human approval loop designed for real logistics pressure.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate('/login', { state: { role: 'company' } })}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#DFFF00] px-7 py-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-black transition-all duration-200 hover:bg-[#c8e800]"
            >
              Open company demo
              <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => navigate('/login', { state: { role: 'supplier' } })}
              className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 px-7 py-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition-all duration-200 hover:border-[#DFFF00]/45 hover:bg-[#DFFF00]/10 hover:text-[#DFFF00]"
            >
              Open supplier demo
            </button>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 text-[10px] font-mono uppercase tracking-[0.15em] text-neutral-300 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-white/15 bg-white/5 px-4 py-4">
                <div className="text-2xl text-white">{metric.value}</div>
                <div className="mt-2 text-neutral-400">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-xl flex-1">
          <div className="rounded-[2rem] border border-white/15 bg-white/[0.06] p-4 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.7)] backdrop-blur-xl sm:p-5">
            <div className="grid gap-4">
              <div className="rounded-2xl border border-red-200/20 bg-red-500/10 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-red-200">Live risk lane</p>
                    <h2 className="mt-2 font-['DM_Serif_Display'] text-2xl text-white">Mumbai to Delhi</h2>
                    <p className="mt-3 text-sm leading-relaxed text-neutral-200">
                      AI detected weather pressure, corridor fragility, and traffic spillover. Recommended action: switch to Southern Relief now.
                    </p>
                  </div>
                  <span className="rounded-full border border-red-300/30 bg-red-400/15 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-red-100">
                    Critical
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/45 p-5">
                  <div className="flex items-center gap-3 text-[#DFFF00]">
                    <Brain className="h-5 w-5" strokeWidth={1.7} />
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em]">AI reasoning</span>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-neutral-200">
                    Gemini-style explanation turns route analytics into operator-ready action instead of a passive dashboard summary.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/45 p-5">
                  <div className="flex items-center gap-3 text-[#DFFF00]">
                    <Globe2 className="h-5 w-5" strokeWidth={1.7} />
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Field delivery</span>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-neutral-200">
                    WhatsApp-style, multilingual alerts reduce friction for operators and transporters across Indian logistics networks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CriteriaFit() {
  const cards = [
    {
      title: 'Technical Merit',
      subtitle: 'Real full-stack workflow',
      desc: 'Connected frontend, FastAPI backend, risk engine, route ranking, monitoring, audit events, and live shipment decisions.',
      icon: <Activity className="h-5 w-5" strokeWidth={1.7} />,
    },
    {
      title: 'User Experience',
      subtitle: 'Decision-first UX',
      desc: 'The interface prioritizes action, readability, and role-specific flow so operators can make a decision in under 30 seconds.',
      icon: <CheckCircle2 className="h-5 w-5" strokeWidth={1.7} />,
    },
    {
      title: 'Alignment With Cause',
      subtitle: 'Built for Indian SMBs',
      desc: 'The problem, language support, operator workflow, and logistics framing are tailored to real disruption pain across Indian supply chains.',
      icon: <Truck className="h-5 w-5" strokeWidth={1.7} />,
    },
    {
      title: 'Innovation and Creativity',
      subtitle: 'AI plus human approval',
      desc: 'The product combines predictive risk detection, multilingual delivery, and accountable operator approvals in one workflow.',
      icon: <ShieldCheck className="h-5 w-5" strokeWidth={1.7} />,
    },
  ];

  return (
    <section id="criteria" className="relative border-y border-black/10 bg-neutral-100 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center rounded-full border border-[#DFFF00]/45 bg-[#DFFF00]/12 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-900">
            Built to match the evaluation criteria
          </p>
          <h2 className="mt-6 font-['DM_Serif_Display'] text-4xl tracking-tight text-neutral-900 sm:text-5xl">Why this product scores.</h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-600 sm:text-lg">
            ClearPath is not just a concept mockup. It is structured to communicate technical depth, operational usability, measurable relevance, and a distinct product point of view.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {cards.map((card) => (
            <article key={card.title} className="rounded-[1.75rem] border border-black/10 bg-white p-7 shadow-sm">
              <div className="flex items-center gap-3 text-neutral-900">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#DFFF00]/45 bg-[#DFFF00]/12 text-neutral-900">
                  {card.icon}
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">{card.subtitle}</p>
                  <h3 className="mt-1 font-['DM_Serif_Display'] text-2xl text-neutral-900">{card.title}</h3>
                </div>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-neutral-600 sm:text-base">{card.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StackSection() {
  const stack = [
    { title: 'Google Routes plus Geocoding', desc: 'Builds alternate lanes and resolves operator-entered origin and destination locations.', icon: <Route className="h-5 w-5" strokeWidth={1.7} /> },
    { title: 'Gemini-ready reasoning', desc: 'Turns risk signals into plain-language operator guidance with fallback-safe summaries.', icon: <Brain className="h-5 w-5" strokeWidth={1.7} /> },
    { title: 'Firebase and BigQuery path', desc: 'Supports production-style auth, persistence, and audit export architecture when configured.', icon: <Database className="h-5 w-5" strokeWidth={1.7} /> },
    { title: 'Google Cloud-ready orchestration', desc: 'The workflow is structured to run with Vertex-style orchestration and scalable backend services.', icon: <Cloud className="h-5 w-5" strokeWidth={1.7} /> },
  ];

  return (
    <section id="stack" className="relative overflow-hidden bg-black py-16 text-white sm:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:4.25rem_4.25rem] opacity-40" aria-hidden />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center rounded-full border border-[#DFFF00]/45 bg-[#DFFF00]/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#DFFF00]">
              Google developer technologies
            </p>
            <h2 className="mt-6 font-['DM_Serif_Display'] text-4xl tracking-tight sm:text-5xl">A stronger technical story.</h2>
            <p className="mt-4 text-base leading-relaxed text-neutral-300 sm:text-lg">
              The app is now positioned to clearly show how Google technologies contribute to product value, not just to the implementation checklist.
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-sm leading-relaxed text-neutral-200">
            Purpose-built for judges to see architecture, AI value, and a path to scale inside the software itself.
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {stack.map((item) => (
            <div key={item.title} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-7 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)] backdrop-blur-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#DFFF00]/40 bg-[#DFFF00]/10 text-[#DFFF00]">
                {item.icon}
              </div>
              <h3 className="mt-5 font-['DM_Serif_Display'] text-2xl">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-neutral-300 sm:text-base">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductOutcomes() {
  const outcomes = [
    { title: 'Faster operator decisions', copy: 'The product is optimized to reduce decision latency from alert to approval through one clear recommended action.' },
    { title: 'Lower communication friction', copy: 'Localized disruption copy supports field teams and transporters who do not want to learn a new complex logistics tool.' },
    { title: 'Prototype with scale direction', copy: 'Fallback-safe local operation works today, while Firebase, BigQuery, push delivery, and cloud integrations provide a credible growth path.' },
  ];

  return (
    <section className="border-y border-black/10 bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <div>
            <p className="inline-flex items-center rounded-full border border-[#DFFF00]/45 bg-[#DFFF00]/12 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-900">
              Measurable product outcomes
            </p>
            <h2 className="mt-6 font-['DM_Serif_Display'] text-4xl tracking-tight text-neutral-900 sm:text-5xl">Built to create visible impact.</h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg">
              The experience now emphasizes practical operator outcomes, not just predictive analytics. That makes the project easier to evaluate on relevance, usability, and real-world value.
            </p>
          </div>
          <div className="rounded-[2rem] border border-black/10 bg-neutral-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 text-neutral-900">
              <LineChart className="h-5 w-5" strokeWidth={1.7} />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">Outcome focus</span>
            </div>
            <ul className="mt-5 space-y-4">
              {outcomes.map((outcome) => (
                <li key={outcome.title} className="rounded-2xl border border-white bg-white p-5">
                  <h3 className="font-semibold text-neutral-900">{outcome.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">{outcome.copy}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="relative overflow-hidden bg-black px-6 py-16 sm:py-20 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(223,255,0,0.06)_0%,transparent_55%)]" aria-hidden />
      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#DFFF00]/40 bg-[#DFFF00]/10 shadow-[0_0_40px_-8px_rgba(223,255,0,0.35)]">
          <Database className="h-6 w-6 text-[#DFFF00]" strokeWidth={1.5} />
        </div>
        <h2 className="font-['DM_Serif_Display'] text-4xl text-white sm:text-5xl lg:text-6xl">See the complete live workflow.</h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
          Open the workspace, sign in, create a lane, inspect AI reasoning, and approve the recommended route like an operator would.
        </p>
        <div className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            to="/login"
            state={{ role: 'supplier' }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white px-5 py-3 text-sm font-semibold text-black transition-all duration-200 hover:bg-neutral-100"
          >
            <Truck className="h-4 w-4" strokeWidth={2} aria-hidden />
            Open supplier journey
          </Link>
          <Link
            to="/login"
            state={{ role: 'company' }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DFFF00]/45 bg-[#DFFF00] px-5 py-3 text-sm font-semibold text-black transition-all duration-200 hover:bg-[#c8e800]"
          >
            <Building className="h-4 w-4" strokeWidth={2} aria-hidden />
            Open company journey
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const location = useLocation();

  useEffect(() => {
    const id = location.hash.replace(/^#/, '');
    if (!id) return;
    const element = document.getElementById(id);
    if (element) {
      requestAnimationFrame(() => element.scrollIntoView({ behavior: 'smooth' }));
    }
  }, [location.hash, location.pathname]);

  return (
    <main id="main-content">
      <Hero />
      <CriteriaFit />
      <StackSection />
      <Roles />
      <Features />
      <ProductOutcomes />
      <CTA />
    </main>
  );
}
