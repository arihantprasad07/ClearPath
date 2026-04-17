import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    document.title = 'Contact — ClearPath';
  }, []);

  return (
    <div className={`relative flex min-h-[100dvh] w-full max-w-full flex-col items-center justify-center overflow-x-hidden px-4 pb-8 pt-24 sm:px-6 ${cp.bgPage}`}>
      <div className={cp.blobAccent} aria-hidden />
      <div className={cp.blobNeutral} aria-hidden />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={`${cp.container} max-w-5xl`}>
        <Link to="/" className={`${cp.linkBack} mb-8`}>
          <ArrowLeft size={16} aria-hidden />
          Back to home
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className={`${cp.panel} hidden lg:block`}>
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#DFFF00]/15 blur-3xl" aria-hidden />
            <div className="relative z-10">
              <h1 className={`font-['DM_Serif_Display'] text-4xl ${cp.text}`}>Built for India's 63 million SMBs.</h1>
              <p className={`mt-4 max-w-xl text-base leading-relaxed ${cp.textMuted}`}>
                ClearPath predicts supply chain disruptions, recommends alternate routes, and sends multilingual transporter alerts—empowering operators to act decisively under pressure.
              </p>
              
              <ul className="mt-8 space-y-6">
                <li className="flex gap-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${cp.borderHairline} bg-white shadow-sm`}>
                    <Mail size={18} className={cp.text} strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className={`mb-1 text-[10px] font-mono font-bold uppercase tracking-widest ${cp.textSubtle}`}>Email</div>
                    <a href="mailto:hello@clearpath.example" className={`break-all text-sm font-medium transition-colors hover:opacity-80 sm:break-normal ${cp.text}`}>
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
                    <p className={`text-sm font-medium leading-relaxed ${cp.text}`}>Bengaluru / Mumbai / Delhi NCR</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${cp.borderHairline} bg-white shadow-sm`}>
                    <Building2 size={18} className={cp.text} strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className={`mb-1 text-[10px] font-mono font-bold uppercase tracking-widest ${cp.textSubtle}`}>Pilot fit</div>
                    <p className={`text-sm font-medium leading-relaxed ${cp.text}`}>Best for high-risk routes, time-sensitive goods, and SMB logistics teams.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className={cp.panel}>
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#DFFF00]/15 blur-3xl" aria-hidden />

            {submitted ? (
              <div className="px-4 py-12 text-center relative z-10">
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
              <div className="relative z-10 space-y-6">
                <div className="mb-8">
                  <h1 className={`font-['DM_Serif_Display'] text-4xl ${cp.text}`}>Get in touch.</h1>
                  <p className={`mt-2 text-sm font-light ${cp.textMuted}`}>
                    ClearPath is designed for pilots, judging demos, and enterprise discussions.
                  </p>
                </div>
                
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
        </div>
      </motion.div>
    </div>
  );
}
