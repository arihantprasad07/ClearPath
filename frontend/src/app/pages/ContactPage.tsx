import React, { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Building2, Mail, MapPin, MessageSquare, Send, ShieldCheck, User } from 'lucide-react';
import { LanguageSelect } from '../components/LanguageSelect';
import { cp } from '../lib/cpUi';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className={`relative flex min-h-[100dvh] flex-col justify-center overflow-x-hidden px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-28 ${cp.bgPage}`}>
      <div className={cp.blobAccent} aria-hidden />
      <div className={cp.blobNeutral} aria-hidden />

      <div className={`${cp.container} grid w-full items-start gap-10 sm:gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20`}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="lg:pt-4">
          <Link to="/" className={`${cp.linkBack} mb-10`}>
            <ArrowLeft size={16} aria-hidden />
            Back to home
          </Link>

          <div className="mb-6 flex items-center gap-4">
            <div className="h-px w-8 bg-neutral-300" />
            <span className={`font-mono text-[9px] font-medium uppercase tracking-[0.25em] ${cp.text}`}>Pilot and partnership</span>
          </div>

          <h1 className={`mb-6 font-['DM_Serif_Display'] text-3xl leading-tight tracking-tight sm:text-4xl md:text-5xl [overflow-wrap:anywhere] ${cp.text}`}>
            Let&apos;s talk about your supply chain.
          </h1>
          <p className={`mb-8 max-w-md text-lg font-light leading-relaxed ${cp.textMuted}`}>
            ClearPath is designed for pilots, judging demos, and enterprise discussions around disruption prevention, AI-assisted rerouting, and multilingual logistics operations.
          </p>

          <div className="mb-12 max-w-md">
            <label htmlFor="contact-language" className={cp.label}>Preferred language</label>
            <p className={`mb-3 text-xs font-light leading-relaxed ${cp.textMuted}`}>
              We&apos;ll match your locale for email and pilot onboarding using the same language system visible inside the app.
            </p>
            <LanguageSelect variant="contact" id="contact-language" className="w-full" />
          </div>

          <ul className="space-y-8">
            <li className="flex gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${cp.borderHairline} bg-white shadow-sm`}>
                <Mail size={18} className={cp.text} strokeWidth={1.5} />
              </div>
              <div>
                <div className={`mb-1 text-[10px] font-mono font-bold uppercase tracking-widest ${cp.textSubtle}`}>Email</div>
                <a href="mailto:hello@clearpath.example" className={`break-all font-light transition-colors hover:opacity-80 sm:break-normal ${cp.text}`}>
                  hello@clearpath.example
                </a>
              </div>
            </li>
            <li className="flex gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${cp.borderHairline} bg-white shadow-sm`}>
                <MapPin size={18} className={cp.text} strokeWidth={1.5} />
              </div>
              <div>
                <div className={`mb-1 text-[10px] font-mono font-bold uppercase tracking-widest ${cp.textSubtle}`}>Presence</div>
                <p className={`font-light leading-relaxed ${cp.text}`}>Bengaluru / Mumbai / Delhi NCR</p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${cp.borderHairline} bg-white shadow-sm`}>
                <Building2 size={18} className={cp.text} strokeWidth={1.5} />
              </div>
              <div>
                <div className={`mb-1 text-[10px] font-mono font-bold uppercase tracking-widest ${cp.textSubtle}`}>Pilot fit</div>
                <p className={`font-light leading-relaxed ${cp.text}`}>Best for high-risk routes, time-sensitive goods, and SMB logistics teams.</p>
              </div>
            </li>
          </ul>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.06 }} className="w-full">
          <div className={cp.panel}>
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#DFFF00]/12 blur-3xl" aria-hidden />

            {submitted ? (
              <div className="px-4 py-12 text-center">
                <div className={`mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border ${cp.borderHairline} bg-neutral-100`}>
                  <Send className={cp.text} size={22} strokeWidth={1.5} />
                </div>
                <h2 className={`mb-3 font-['DM_Serif_Display'] text-2xl ${cp.text}`}>Message received</h2>
                <p className={`mx-auto mb-8 max-w-sm text-sm font-light leading-relaxed ${cp.textMuted}`}>
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
                  className={`text-xs font-mono font-bold uppercase tracking-widest ${cp.text} underline-offset-4 hover:underline`}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-2xl border border-[#DFFF00]/35 bg-[#faffd9] p-5">
                  <div className="flex items-center gap-3 text-neutral-900">
                    <ShieldCheck className="h-5 w-5" strokeWidth={1.7} />
                    <span className="text-[10px] font-mono uppercase tracking-widest">What to include</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                    Fleet size, lanes, delay pain points, current alert process, and what you want the judging demo or pilot to prove.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className={cp.label} htmlFor="contact-name">Full name</label>
                    <div className="relative">
                      <User size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        id="contact-name"
                        required
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Priya Sharma"
                        className={cp.input}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={cp.label} htmlFor="contact-email">Work email</label>
                    <div className="relative">
                      <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        id="contact-email"
                        required
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="name@company.com"
                        className={cp.input}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={cp.label} htmlFor="contact-company">
                      Company <span className="font-normal text-neutral-400">(optional)</span>
                    </label>
                    <div className="relative">
                      <Building2 size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        id="contact-company"
                        type="text"
                        value={company}
                        onChange={(event) => setCompany(event.target.value)}
                        placeholder="Your organization"
                        className={cp.input}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={cp.label} htmlFor="contact-message">Message</label>
                    <div className="relative">
                      <MessageSquare size={18} className="pointer-events-none absolute left-4 top-4 text-neutral-400" />
                      <textarea
                        id="contact-message"
                        required
                        rows={5}
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="Tell us about your routes, delay pain points, or pilot questions..."
                        className={cp.inputMultiline}
                      />
                    </div>
                  </div>

                  <button type="submit" className={`${cp.btnPrimaryBlock} shadow-[0_3px_0_0_rgba(0,0,0,1)]`}>
                    Send message
                    <Send size={16} strokeWidth={1.5} />
                  </button>
                </form>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
