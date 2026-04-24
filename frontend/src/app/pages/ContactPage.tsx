import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Building2, Mail, MapPin, MessageSquare, Send, ShieldCheck, User } from 'lucide-react';
import { toast } from 'sonner';

function TinyLabel({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p className={`text-[9px] font-mono uppercase tracking-[0.22em] ${dark ? 'text-white/60' : 'text-neutral-500'}`}>
      {children}
    </p>
  );
}

function DecoCluster({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute ${className}`} aria-hidden>
      <div className="absolute left-0 top-0 h-9 w-9 rounded-full border border-black/10 border-dashed" />
      <div className="absolute left-6 top-6 h-2 w-2 rounded-full bg-[#DFFF00]" />
      <div className="absolute left-9 top-0 text-lg leading-none text-black">*</div>
      <div className="absolute left-10 top-7 h-6 w-6 rotate-45 border border-black/80 bg-black" />
    </div>
  );
}

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    window.setTimeout(() => {
      setSubmitted(true);
      setIsSubmitting(false);
      toast.success('Message received', {
        description: 'The ClearPath team will follow up with you shortly.',
      });
    }, 900);
  };

  useEffect(() => {
    document.title = 'Contact - ClearPath';
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-24 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/" className="mb-5 inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-neutral-600 transition-colors hover:text-black">
          <ArrowLeft size={16} aria-hidden />
          Back to home
        </Link>

        <div className="grid gap-6 xl:grid-cols-[390px_1fr] xl:items-start">
          <div className="mx-auto w-full max-w-[360px] xl:mx-0">
            <div className="space-y-3">
              <section className="relative overflow-hidden rounded-[24px] border border-black/10 bg-white px-4 pb-4 pt-5 shadow-[0_20px_60px_-36px_rgba(0,0,0,0.35)]">
                <DecoCluster className="right-4 top-5 h-12 w-12 opacity-80" />
                <div className="relative z-10">
                  <TinyLabel>Contact the team</TinyLabel>
                  <h1 className="mt-2 text-[25px] font-semibold leading-[1.02] tracking-tight text-neutral-950">
                    Keep the
                    <br />
                    conversation moving
                  </h1>
                  <p className="mt-3 max-w-[230px] text-[11px] leading-5 text-neutral-500">
                    ClearPath is set up for judging demos, pilot exploration, and conversations with logistics teams who need faster decisions.
                  </p>
                </div>
              </section>

              <section className="rounded-[18px] border border-black/10 bg-white p-4">
                <TinyLabel>Email</TinyLabel>
                <p className="mt-3 text-sm font-semibold text-neutral-950">hello@clearpath.example</p>
              </section>

              <section className="rounded-[18px] border border-[#b6d400] bg-[#DFFF00] p-4">
                <TinyLabel>Presence</TinyLabel>
                <p className="mt-3 text-sm font-semibold text-black">Bengaluru / Mumbai / Delhi NCR</p>
              </section>

              <section className="rounded-[18px] border border-black bg-[#181a23] p-4 text-white">
                <TinyLabel dark>Pilot fit</TinyLabel>
                <p className="mt-3 text-sm leading-6 text-white/75">
                  Best for high-risk routes, time-sensitive goods, and lean logistics teams that need clearer disruption handling.
                </p>
              </section>
            </div>
          </div>

          <div className="grid gap-6">
            <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm sm:p-6">
              {submitted ? (
                <div className="relative overflow-hidden rounded-[24px] border border-black/10 bg-[#f7f7f3] px-5 py-10 text-center">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-black bg-[#DFFF00]">
                    <Send className="text-black" size={20} strokeWidth={1.5} />
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Message received</h2>
                  <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-neutral-600">
                    Thanks, {name.split(' ')[0] || 'there'}. We&apos;ll get back to you at {email} soon.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setName('');
                      setEmail('');
                      setCompany('');
                      setMessage('');
                    }}
                    className="mt-6 inline-flex items-center rounded-full border border-black bg-black px-4 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-white"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <TinyLabel>Contact form</TinyLabel>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">Get in touch</h2>
                    <p className="mt-2 text-sm leading-6 text-neutral-600">
                      Share your route pain points, pilot needs, or judging-demo questions and we’ll follow up.
                    </p>
                  </div>

                  <div className="rounded-[18px] border border-[#b6d400] bg-[#DFFF00] p-4">
                    <div className="flex items-center gap-3 text-black">
                      <ShieldCheck className="h-4 w-4" strokeWidth={1.7} />
                      <span className="text-[10px] font-mono uppercase tracking-widest">What to include</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-black/75">
                      Fleet size, route lanes, delay pain points, current alert process, and what you want the pilot or demo to prove.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="mb-2 block text-[10px] font-mono font-semibold uppercase tracking-widest text-neutral-700" htmlFor="contact-name">Full name</label>
                      <div className="relative">
                        <User size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                          id="contact-name"
                          required
                          type="text"
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          placeholder="Anya Sharma"
                          className="h-12 w-full rounded-xl border border-black/15 bg-white pl-12 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 transition-all duration-200 focus:border-black focus:outline-none focus:ring-2 focus:ring-[#DFFF00]/40"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-[10px] font-mono font-semibold uppercase tracking-widest text-neutral-700" htmlFor="contact-email">Work email</label>
                        <div className="relative">
                          <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                          <input
                            id="contact-email"
                            required
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="name@company.com"
                            className="h-12 w-full rounded-xl border border-black/15 bg-white pl-12 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 transition-all duration-200 focus:border-black focus:outline-none focus:ring-2 focus:ring-[#DFFF00]/40"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] font-mono font-semibold uppercase tracking-widest text-neutral-700" htmlFor="contact-company">Company</label>
                        <div className="relative">
                          <Building2 size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                          <input
                            id="contact-company"
                            type="text"
                            value={company}
                            onChange={(event) => setCompany(event.target.value)}
                            placeholder="Your organization"
                            className="h-12 w-full rounded-xl border border-black/15 bg-white pl-12 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 transition-all duration-200 focus:border-black focus:outline-none focus:ring-2 focus:ring-[#DFFF00]/40"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-[10px] font-mono font-semibold uppercase tracking-widest text-neutral-700" htmlFor="contact-message">Message</label>
                      <div className="relative">
                        <MessageSquare size={18} className="pointer-events-none absolute left-4 top-4 text-neutral-400" />
                        <textarea
                          id="contact-message"
                          required
                          rows={5}
                          value={message}
                          onChange={(event) => setMessage(event.target.value)}
                          placeholder="Tell us about your routes, delay pain points, or pilot questions..."
                          className="min-h-[120px] w-full resize-y rounded-xl border border-black/15 bg-white py-3 pl-12 pr-4 text-sm leading-relaxed text-neutral-900 placeholder:text-neutral-400 transition-all duration-200 focus:border-black focus:outline-none focus:ring-2 focus:ring-[#DFFF00]/40"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-black bg-[#DFFF00] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-black transition-all duration-200 hover:bg-[#c8e800] hover:shadow-[0_8px_28px_-6px_rgba(223,255,0,0.45)] disabled:cursor-wait disabled:opacity-70"
                    >
                      {isSubmitting ? <span className="submit-spinner" /> : null}
                      Send message
                      <Send size={16} strokeWidth={1.5} />
                    </button>
                  </form>
                </div>
              )}
            </section>

            <div className="grid gap-4 lg:grid-cols-3">
              <section className="rounded-[18px] border border-black/10 bg-white p-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-neutral-700" />
                  <TinyLabel>Email</TinyLabel>
                </div>
                <p className="mt-3 text-sm text-neutral-700">Product questions, pilots, and judging follow-ups.</p>
              </section>
              <section className="rounded-[18px] border border-black/10 bg-white p-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-neutral-700" />
                  <TinyLabel>Geography</TinyLabel>
                </div>
                <p className="mt-3 text-sm text-neutral-700">Built with Indian logistics use cases in mind.</p>
              </section>
              <section className="rounded-[18px] border border-black bg-[#181a23] p-4 text-white">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#DFFF00]" />
                  <TinyLabel dark>Fit</TinyLabel>
                </div>
                <p className="mt-3 text-sm text-white/75">Great for fast-moving teams that need route clarity under disruption.</p>
              </section>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
