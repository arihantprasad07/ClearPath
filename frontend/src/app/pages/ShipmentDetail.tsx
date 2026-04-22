import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowLeft,
  Brain,
  CheckCircle,
  Clock,
  DollarSign,
  MapPin,
  Package,
  ShieldCheck,
  Sparkles,
  Volume2,
  Zap,
} from 'lucide-react';
import RouteNetworkMap from '../components/RouteNetworkMap';
import { useAppContext } from '../context/AppContext';
import { cp } from '../lib/cpUi';
import { getSignalIcon } from '../lib/signalIcons';

const ALERT_LANGUAGE_LABELS: Record<string, string> = {
  en: 'EN',
  hi: 'HI',
  gu: 'GU',
  ta: 'TA',
};

const VOICE_LANGUAGE_CODES: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  gu: 'gu-IN',
  ta: 'ta-IN',
};

function ConfidenceBadge({ value }: { value: string }) {
  const tone =
    value === 'High'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : value === 'Low'
        ? 'border-red-200 bg-red-50 text-red-700'
        : 'border-amber-200 bg-amber-50 text-amber-700';

  return (
    <span className={`rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] ${tone}`}>
      {value}
    </span>
  );
}

function UrgencyBadge({ value }: { value: string }) {
  const tone =
    value === 'Act now'
      ? 'border-red-200 bg-red-50 text-red-700'
      : value === 'Monitor'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700';

  return (
    <span className={`rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] ${tone}`}>
      {value}
    </span>
  );
}

function formatCurrency(value: number | null | undefined) {
  if (!value) return 'N/A';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ShipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authUser, preferredLanguage, shipments, userRole, updateShipmentRoute, voiceAlertsEnabled } = useAppContext();

  const shipment = shipments.find((candidate) => candidate.id === id);
  const [showSuccess, setShowSuccess] = useState(false);
  const [approvingRouteId, setApprovingRouteId] = useState<string | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [selectedAlertLanguage, setSelectedAlertLanguage] = useState<'en' | 'hi' | 'gu' | 'ta'>('en');
  const lastSpokenShipmentRef = useRef<string | null>(null);

  useEffect(() => {
    document.title = `${shipment?.name || 'Shipment'} - ClearPath`;
  }, [shipment?.name]);

  useEffect(() => {
    if (!shipment) return;
    const nextLanguage = (['en', 'hi', 'gu', 'ta'].includes(preferredLanguage) ? preferredLanguage : 'en') as 'en' | 'hi' | 'gu' | 'ta';
    setSelectedAlertLanguage(nextLanguage);
  }, [preferredLanguage, shipment?.id]);

  const speakAlert = (languageCode?: string) => {
    if (!shipment || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const lang = languageCode || preferredLanguage || 'en';
    const message = shipment.backend.alert?.translations?.[lang] || shipment.backend.alert?.translations?.en || shipment.backend.alert?.message || shipment.alert || '';
    if (!message) return;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = VOICE_LANGUAGE_CODES[lang] || 'en-IN';
    utterance.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!shipment || !voiceAlertsEnabled || shipment.riskLevel !== 'high') return;
    const speechKey = `${shipment.id}:${shipment.riskLevel}`;
    if (lastSpokenShipmentRef.current === speechKey) return;
    lastSpokenShipmentRef.current = speechKey;
    speakAlert(preferredLanguage);
  }, [preferredLanguage, shipment, voiceAlertsEnabled]);

  const routeOptions = useMemo(() => shipment?.routes || [], [shipment]);

  if (!shipment) {
    return <div className={`w-full py-16 text-center ${cp.textMuted}`}>Shipment not found</div>;
  }

  const explanation = shipment.backend.explanation;
  const selectedTranslation =
    shipment.backend.alert?.translations?.[selectedAlertLanguage] ||
    shipment.backend.alert?.translations?.en ||
    shipment.backend.alert?.message ||
    shipment.alert ||
    'Translation unavailable';

  const handleApprove = async (routeId: string) => {
    try {
      setRouteError(null);
      setApprovingRouteId(routeId);
      await updateShipmentRoute(shipment.id, routeId);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.5 },
        colors: ['#DFFF00', '#000000', '#ffffff'],
      });
      setShowSuccess(true);
      window.setTimeout(() => {
        setShowSuccess(false);
        navigate('/dashboard');
      }, 1600);
    } catch (error) {
      setRouteError(error instanceof Error ? error.message : 'Unable to apply the selected route.');
    } finally {
      setApprovingRouteId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-10">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-neutral-600 transition-colors hover:text-black">
        <ArrowLeft size={16} className="shrink-0" aria-hidden />
        <span className="truncate">Back to dashboard</span>
      </Link>

      <section className="relative overflow-hidden rounded-[28px] border border-black/10 bg-white p-5 shadow-[0_20px_60px_-36px_rgba(0,0,0,0.35)] sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#DFFF00]/12 blur-3xl" />
        <div className="relative z-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#DFFF00]/45 bg-[#DFFF00]/12 px-3 py-1 text-[9px] font-mono font-semibold uppercase tracking-wider text-neutral-900">
                  {userRole === 'company' ? 'shipper workflow' : 'transporter workflow'}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Shipment #{shipment.id}</span>
                <ConfidenceBadge value={explanation?.confidence || 'Medium'} />
                <UrgencyBadge value={explanation?.urgency || 'Monitor'} />
              </div>

              <h1 className="mt-4 text-left font-['DM_Serif_Display'] text-3xl text-neutral-950 sm:text-4xl">{shipment.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-600">
                <MapPin size={16} className="text-neutral-400" aria-hidden />
                <span className="font-medium text-neutral-800">{shipment.source}</span>
                <span className="text-neutral-300">{'->'}</span>
                <span className="font-medium text-neutral-800">{shipment.destination}</span>
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-600">
                {explanation?.headline || shipment.backend.statusMessage}
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-[380px] lg:grid-cols-1">
              <div className="rounded-[20px] border border-black/10 bg-[#f7f7f3] p-5">
                <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Risk score</div>
                <div className="mt-3 flex items-center gap-3">
                  <span className={`inline-flex h-3 w-3 rounded-full ${shipment.backend.risk.score >= 70 ? 'animate-pulse bg-red-500' : shipment.backend.risk.score >= 45 ? 'animate-pulse bg-amber-400' : 'animate-pulse bg-emerald-500'}`} />
                  <span className="text-3xl font-semibold text-neutral-950">{shipment.backend.risk.score}%</span>
                </div>
              </div>
              <div className="rounded-[20px] border border-[#b6d400] bg-[#DFFF00] p-5">
                <div className="text-[10px] font-mono uppercase tracking-widest text-black/60">Prediction window</div>
                <p className="mt-3 text-sm font-semibold text-black">{shipment.backend.predictionWindow.label}</p>
              </div>
              <div className="rounded-[20px] border border-black bg-[#181a23] p-5 text-white">
                <div className="text-[10px] font-mono uppercase tracking-widest text-white/60">Cargo profile</div>
                <p className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#DFFF00]">{shipment.priority}</p>
                <p className="mt-2 text-sm text-white/80">{formatCurrency(shipment.backend.estimatedCargoValue)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {routeError ? <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{routeError}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">Gemini reasoning</p>
                <h2 className="mt-1 text-2xl font-semibold text-neutral-950">Why this needs operator attention</h2>
              </div>
              <Brain className="h-5 w-5 text-neutral-500" />
            </div>
            <div className="mt-5 space-y-4 rounded-[22px] border border-black/10 bg-[#fafaf6] p-5">
              <p className="text-lg font-semibold text-neutral-950">{explanation?.headline || 'Reasoning unavailable'}</p>
              <p className="text-sm leading-7 text-neutral-600">{explanation?.why || shipment.backend.statusMessage}</p>
              <div className="rounded-[18px] border border-black bg-[#181a23] px-4 py-4 text-sm text-white">
                {explanation?.recommendation || shipment.backend.decision.recommendedAction}
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">Route network</p>
                <h2 className="mt-1 text-2xl font-semibold text-neutral-950">Alternate route geometry</h2>
              </div>
              <Zap className="h-5 w-5 text-neutral-500" />
            </div>
            <div className="mt-5">
              <RouteNetworkMap shipment={shipment.backend} height={320} />
            </div>
          </section>

          <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">Route comparison</p>
                <h2 className="mt-1 text-2xl font-semibold text-neutral-950">All ranked options</h2>
              </div>
              <ShieldCheck className="h-5 w-5 text-neutral-500" />
            </div>

            <div className="mt-5 hidden overflow-hidden rounded-[22px] border border-black/10 lg:block">
              <table className="min-w-full divide-y divide-black/10">
                <thead className="bg-[#fafaf6]">
                  <tr className="text-left text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">
                    <th className="px-4 py-3">Route</th>
                    <th className="px-4 py-3">ETA</th>
                    <th className="px-4 py-3">Cost</th>
                    <th className="px-4 py-3">Risk</th>
                    <th className="px-4 py-3">Reliability</th>
                    <th className="px-4 py-3">Value</th>
                    <th className="px-4 py-3">Trade-off</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10 bg-white">
                  {routeOptions.map((route) => (
                    <tr key={route.id} className={route.isRecommended ? 'bg-[#faffd9]' : ''}>
                      <td className="px-4 py-4 text-sm font-semibold text-neutral-950">
                        <div className="flex items-center gap-2">
                          <span>{route.name}</span>
                          {route.isRecommended ? (
                            <span className="rounded-full border border-black bg-[#DFFF00] px-2 py-1 text-[9px] font-mono uppercase tracking-[0.18em] text-black">
                              Recommended
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-600">{route.eta}</td>
                      <td className="px-4 py-4 text-sm text-neutral-600">{route.cost}</td>
                      <td className="px-4 py-4 text-sm text-neutral-600">{route.riskScore}</td>
                      <td className="px-4 py-4 text-sm text-neutral-600">{route.reliability}</td>
                      <td className="px-4 py-4 text-sm text-neutral-600">{route.valueScore}</td>
                      <td className="px-4 py-4 text-sm text-neutral-600">{route.tradeOff}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {routeOptions.map((route, index) => (
                <motion.div
                  key={route.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.35 }}
                  className={`rounded-[24px] border p-5 ${
                    route.isRecommended ? 'border-[#b6d400] bg-[#faffd9] shadow-[0_20px_50px_-36px_rgba(223,255,0,0.85)]' : 'border-black/10 bg-[#181a23] text-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-[10px] font-mono uppercase tracking-[0.18em] ${route.isRecommended ? 'text-black/55' : 'text-white/55'}`}>
                        Route option {index + 1}
                      </p>
                      <h3 className={`mt-2 text-xl font-semibold ${route.isRecommended ? 'text-black' : 'text-white'}`}>{route.name}</h3>
                    </div>
                    {route.isRecommended ? (
                      <span className="rounded-full border border-black bg-[#DFFF00] px-2 py-1 text-[9px] font-mono uppercase tracking-[0.18em] text-black">
                        Best route
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className={route.isRecommended ? 'text-black/60' : 'text-white/60'}>ETA</span>
                      <span className={route.isRecommended ? 'text-black' : 'text-white'}>{route.eta}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className={route.isRecommended ? 'text-black/60' : 'text-white/60'}>Cost estimate</span>
                      <span className={route.isRecommended ? 'text-black' : 'text-white'}>{route.cost}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className={route.isRecommended ? 'text-black/60' : 'text-white/60'}>Risk score</span>
                      <span className={route.isRecommended ? 'text-black' : 'text-white'}>{route.riskScore}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className={route.isRecommended ? 'text-black/60' : 'text-white/60'}>Reliability</span>
                      <span className={route.isRecommended ? 'text-black' : 'text-[#DFFF00]'}>{route.reliability}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className={route.isRecommended ? 'text-black/60' : 'text-white/60'}>Value score</span>
                      <span className={route.isRecommended ? 'text-black' : 'text-white'}>{route.valueScore}</span>
                    </div>
                  </div>

                  <div className={`mt-5 rounded-[18px] border px-4 py-4 text-sm leading-6 ${route.isRecommended ? 'border-black/10 bg-white/60 text-neutral-700' : 'border-white/10 bg-white/5 text-white/75'}`}>
                    {route.tradeOff}
                  </div>

                  {userRole === 'company' ? (
                    <button
                      type="button"
                      onClick={() => handleApprove(route.id)}
                      disabled={approvingRouteId !== null}
                      className={
                        route.isRecommended
                          ? 'mt-5 inline-flex w-full items-center justify-center rounded-xl border border-black bg-black px-5 py-3 text-[11px] font-mono uppercase tracking-[0.18em] text-white transition hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-60'
                          : 'mt-5 inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-[11px] font-mono uppercase tracking-[0.18em] text-white transition hover:border-white/30 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60'
                      }
                    >
                      {approvingRouteId === route.id ? 'Applying route...' : route.isRecommended ? 'Approve route' : 'Approve alternate'}
                    </button>
                  ) : (
                    <div className={`mt-5 rounded-xl border py-3 text-center text-[10px] font-mono uppercase tracking-[0.18em] ${route.isRecommended ? 'border-black/10 bg-white/70 text-black/70' : 'border-white/10 bg-white/5 text-white/60'}`}>
                      Awaiting company approval
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-neutral-50">
                <Sparkles className="h-5 w-5 text-neutral-900" strokeWidth={1.7} />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">Multilingual alert</p>
                <h2 className="text-2xl font-semibold text-neutral-900">Transporter preview</h2>
              </div>
            </div>

            <div className="mt-5 rounded-[22px] border border-[#b6d400] bg-[#faffd9] px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Headline</p>
                  <p className="mt-1 font-semibold text-neutral-900">{shipment.backend.alert?.headline || 'Transporter alert'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => speakAlert(selectedAlertLanguage)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-neutral-900 transition hover:border-black"
                  aria-label="Play alert audio"
                >
                  <Volume2 size={16} aria-hidden />
                </button>
              </div>

              <div className="mt-4 flex gap-2">
                {(Object.keys(ALERT_LANGUAGE_LABELS) as Array<'en' | 'hi' | 'gu' | 'ta'>).map((language) => {
                  const isSelected = selectedAlertLanguage === language;
                  return (
                    <button
                      key={language}
                      type="button"
                      onClick={() => setSelectedAlertLanguage(language)}
                      className={`rounded-full border px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.18em] transition ${
                        isSelected ? 'border-black bg-black text-white' : 'border-black/10 bg-white text-neutral-700 hover:border-black'
                      }`}
                    >
                      {ALERT_LANGUAGE_LABELS[language]}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-[18px] border border-black/10 bg-white px-4 py-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                  {ALERT_LANGUAGE_LABELS[selectedAlertLanguage]} message
                </p>
                <p className="mt-2 text-sm leading-7 text-neutral-900">{selectedTranslation}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-neutral-50">
                <AlertTriangle className="h-5 w-5 text-neutral-900" strokeWidth={1.7} />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">Signal stack</p>
                <h2 className="text-2xl font-semibold text-neutral-900">What is driving the score</h2>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {(shipment.backend.signalStack || []).map((signal) => {
                const SignalIcon = getSignalIcon(signal.name);
                const severity = Math.round(signal.severity * 100);
                return (
                  <div key={signal.name} className="rounded-[20px] border border-black/10 bg-[#fafaf6] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
                          <SignalIcon className="h-4 w-4 text-neutral-900" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-neutral-950">{signal.name}</p>
                          <p className="mt-1 text-sm leading-6 text-neutral-600">{signal.summary}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">{severity}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-neutral-50">
                <Package className="h-5 w-5 text-neutral-900" strokeWidth={1.7} />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">Cascade impact</p>
                <h2 className="text-2xl font-semibold text-neutral-900">Downstream exposure</h2>
              </div>
            </div>

            <p className="mt-5 text-3xl font-semibold text-neutral-950">{shipment.backend.cascadeImpact.affectedOrders} orders at risk</p>
            <p className="mt-3 text-sm font-medium text-neutral-900">{shipment.backend.cascadeImpact.slaRisk}</p>
            <p className="mt-2 text-sm leading-7 text-neutral-600">{shipment.backend.cascadeImpact.summary}</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[20px] border border-black/10 bg-[#fafaf6] p-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Current ETA</p>
                <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-neutral-950">
                  <Clock className="h-4 w-4 text-neutral-500" />
                  {shipment.eta}
                </p>
              </div>
              <div className="rounded-[20px] border border-black/10 bg-[#fafaf6] p-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Cargo value</p>
                <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-neutral-950">
                  <DollarSign className="h-4 w-4 text-neutral-500" />
                  {formatCurrency(shipment.backend.estimatedCargoValue)}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {showSuccess ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="max-w-md rounded-2xl border border-[#DFFF00]/45 bg-black p-8 text-center shadow-lg"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#DFFF00] text-black shadow-md">
              <CheckCircle size={32} aria-hidden />
            </div>
            <h3 className="text-2xl text-white">Route locked in.</h3>
            <p className="mt-2 text-sm text-neutral-300">
              {authUser?.role === 'admin' ? 'The live route selection has been saved to the backend.' : 'The live route selection has been saved.'}
            </p>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}
