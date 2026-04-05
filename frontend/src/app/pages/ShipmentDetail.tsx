import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  AlertTriangle,
  ArrowLeft,
  Brain,
  CheckCircle2,
  ChevronDown,
  Clock,
  DollarSign,
  MapPin,
  Package,
  ShieldCheck,
  Sparkles,
  Volume2,
} from 'lucide-react';
import RouteNetworkMap from '../components/RouteNetworkMap';
import { useAppContext } from '../context/AppContext';
import { AuditEventRecord, fetchAuditEvents } from '../lib/api';
import { cp } from '../lib/cpUi';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';

const ALERT_LANGUAGE_LABELS: Record<string, string> = {
  en: 'EN',
  hi: 'HI',
  gu: 'GU',
  ta: 'TA',
  mr: 'MR',
  bn: 'BN',
  te: 'TE',
  kn: 'KN',
  ml: 'ML',
  pa: 'PA',
};

const VOICE_LANGUAGE_CODES: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  gu: 'gu-IN',
  ta: 'ta-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  pa: 'pa-IN',
};

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function severityTone(severity: number) {
  if (severity > 0.6) return { bar: 'bg-red-500', text: 'text-red-600' };
  if (severity > 0.35) return { bar: 'bg-amber-400', text: 'text-amber-600' };
  return { bar: 'bg-green-500', text: 'text-green-600' };
}

function renderArcPath(radius: number) {
  const centerX = radius + 6;
  const centerY = radius + 6;
  return `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`;
}

function ConfidenceMeter({ confidence }: { confidence: number }) {
  const safeConfidence = Math.max(0, Math.min(100, confidence));
  const arcLength = Math.PI * 30;
  const dashOffset = arcLength - (arcLength * safeConfidence) / 100;
  const color = safeConfidence >= 75 ? '#22c55e' : safeConfidence >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative h-[56px] w-[92px]">
      <svg viewBox="0 0 72 42" className="h-full w-full">
        <path d={renderArcPath(30)} fill="none" stroke="#e5e7eb" strokeWidth="8" strokeLinecap="round" />
        <path
          d={renderArcPath(30)}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-1 text-center">
        <div className="text-lg font-semibold text-neutral-900">{safeConfidence}%</div>
      </div>
    </div>
  );
}

export default function ShipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authToken, authUser, preferredLanguage, shipments, userRole, updateShipmentRoute, voiceAlertsEnabled } = useAppContext();

  const shipment = shipments.find((candidate) => candidate.id === id);
  const [showSuccess, setShowSuccess] = useState(false);
  const [approvingRouteId, setApprovingRouteId] = useState<string | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [selectedAlertLanguage, setSelectedAlertLanguage] = useState(preferredLanguage || 'en');
  const [auditEvents, setAuditEvents] = useState<AuditEventRecord[]>([]);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const lastSpokenShipmentRef = useRef<string | null>(null);

  const localizedAlert = useMemo(() => {
    if (!shipment) return '';
    return shipment.backend.alert?.translations?.[preferredLanguage] || shipment.backend.alert?.message || shipment.alert || '';
  }, [preferredLanguage, shipment]);

  useEffect(() => {
    if (!shipment) return;
    setSelectedAlertLanguage(preferredLanguage || 'en');
  }, [preferredLanguage, shipment?.id]);

  useEffect(() => {
    if (!shipment?.id || !authToken) return;

    let cancelled = false;
    const loadAuditEvents = async () => {
      setAuditLoading(true);
      setAuditError(null);
      try {
        const events = await fetchAuditEvents(authToken, shipment.id);
        if (!cancelled) {
          setAuditEvents(events.slice(0, 20));
        }
      } catch (error) {
        if (!cancelled) {
          setAuditError(error instanceof Error ? error.message : 'Unable to load audit events.');
        }
      } finally {
        if (!cancelled) {
          setAuditLoading(false);
        }
      }
    };

    void loadAuditEvents();
    return () => {
      cancelled = true;
    };
  }, [authToken, shipment?.id]);

  const speakAlert = (languageCode?: string) => {
    if (!shipment || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const lang = languageCode || preferredLanguage || 'en';
    const englishMessage = shipment.backend.alert?.translations?.en || shipment.backend.alert?.message || shipment.alert || '';
    const message = shipment.backend.alert?.translations?.[lang] || englishMessage;
    if (!message) return;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = VOICE_LANGUAGE_CODES[lang] || 'en-IN';
    utterance.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!shipment) return;
    if (!voiceAlertsEnabled || shipment.riskLevel !== 'high') return;
    const speechKey = `${shipment.id}:${shipment.riskLevel}`;
    if (lastSpokenShipmentRef.current === speechKey) return;
    lastSpokenShipmentRef.current = speechKey;
    speakAlert(preferredLanguage);
  }, [preferredLanguage, shipment, voiceAlertsEnabled]);

  if (!shipment) {
    return <div className={`w-full py-16 text-center ${cp.textMuted}`}>Shipment not found</div>;
  }

  const isHighRisk = shipment.riskLevel === 'high' || shipment.backend.risk.level === 'critical';
  const riskLabel = shipment.backend.risk.level === 'critical' ? 'Critical' : shipment.riskLevel === 'high' ? 'Critical' : shipment.riskLevel === 'medium' ? 'Warning' : 'On track';
  const alertLanguages = [...new Set(['en', 'hi', 'gu', 'ta', 'mr', 'bn', 'te', 'kn', 'ml', 'pa', ...Object.keys(shipment.backend.alert?.translations || {})])];
  const englishMessage = shipment.backend.alert?.translations?.en || shipment.backend.alert?.message || shipment.alert || 'Translation unavailable';
  const selectedTranslation =
    selectedAlertLanguage === 'en'
      ? englishMessage
      : shipment.backend.alert?.translations?.[selectedAlertLanguage] || 'Translation unavailable';
  const dispatchStatus = shipment.backend.dispatchStatus?.status;
  const cascadeImpact = shipment.backend.cascadeImpact;
  const architecture = shipment.backend.architectureStatus;
  const journeyStep = shipment.backend.status === 'stable' ? 3 : isHighRisk ? 2 : 1;

  const handleApprove = async (routeId: string) => {
    try {
      setRouteError(null);
      setApprovingRouteId(routeId);
      await updateShipmentRoute(shipment.id, routeId);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/dashboard');
      }, 1800);
    } catch (error) {
      setRouteError(error instanceof Error ? error.message : 'Unable to apply the selected route.');
    } finally {
      setApprovingRouteId(null);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-6">
      <Link to="/dashboard" className={cp.linkBack}>
        <ArrowLeft size={16} className="shrink-0" aria-hidden />
        <span className="truncate">Back to dashboard</span>
      </Link>

      <div className={`relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-all duration-200 sm:p-8 ${isHighRisk ? 'border-red-100 ring-1 ring-red-100' : `border ${cp.borderHairline}`}`}>
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#DFFF00]/45 bg-[#DFFF00]/12 px-2.5 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-wider text-neutral-900">
                {userRole === 'company' ? 'shipper workflow' : 'transporter workflow'}
              </span>
              <span className={`text-[10px] font-mono uppercase tracking-widest ${cp.textSubtle}`}>Shipment #{shipment.id}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider ${isHighRisk ? 'bg-red-500 text-white' : shipment.riskLevel === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-neutral-100 text-neutral-700'}`}>
                {riskLabel}
              </span>
            </div>

            <h1 className={`text-left font-['DM_Serif_Display'] text-2xl sm:text-3xl md:text-4xl [overflow-wrap:anywhere] ${cp.text}`}>{shipment.name}</h1>

            <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm ${cp.textMuted}`}>
              <MapPin size={16} className={`shrink-0 ${isHighRisk ? 'text-red-500' : 'text-neutral-400'}`} aria-hidden />
              <span className="font-medium text-neutral-800">{shipment.source}</span>
              <span className="text-neutral-300">{'->'}</span>
              <span className="font-medium text-neutral-800">{shipment.destination}</span>
            </div>
          </div>

          <div className="grid w-full shrink-0 gap-3 md:w-auto md:min-w-[260px]">
            <div className={`rounded-2xl border ${cp.borderHairline} bg-neutral-50/90 p-5`}>
              <div className={`text-[10px] font-mono uppercase tracking-widest ${cp.textSubtle}`}>Current ETA</div>
              <div className={`mt-2 flex items-center gap-2 text-lg font-semibold ${isHighRisk ? 'text-red-600' : cp.text}`}>
                <Clock size={18} className="shrink-0" aria-hidden />
                <span className="break-words">{shipment.eta}</span>
              </div>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className={`text-[10px] font-mono uppercase tracking-widest ${cp.textSubtle}`}>Risk score</p>
                  <p className={`mt-1 text-3xl font-semibold ${isHighRisk ? 'text-red-600 risk-pulse' : cp.text}`}>{shipment.backend.risk.score}%</p>
                </div>
                <div className="text-right">
                  <p className={`text-[10px] font-mono uppercase tracking-widest ${cp.textSubtle}`}>Prediction window</p>
                  <p className={`mt-1 text-sm ${cp.text}`}>{shipment.backend.predictionWindow.label}</p>
                </div>
              </div>
            </div>

            <div className={`rounded-2xl border ${cp.borderHairline} bg-neutral-50/90 p-5`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className={`text-[10px] font-mono uppercase tracking-widest ${cp.textSubtle}`}>Decision confidence</p>
                  <p className={`mt-1 text-sm ${cp.textMuted}`}>AI confidence before route approval</p>
                </div>
                <ConfidenceMeter confidence={shipment.backend.decision.confidence} />
              </div>
            </div>
          </div>
        </div>

        {shipment.alert && (
          <div className="relative mb-8 overflow-hidden rounded-2xl border border-red-100 bg-red-50/90 p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex min-w-0 flex-1 gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <AlertTriangle size={22} aria-hidden />
                </div>
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="text-left text-base font-semibold text-red-900 sm:text-lg">
                      {shipment.backend.alert?.headline || 'High probability of delay due to conditions'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => speakAlert(selectedAlertLanguage)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-white/80 text-red-700 transition hover:bg-white"
                      aria-label="Speak transporter alert"
                    >
                      <Volume2 size={16} aria-hidden />
                    </button>
                  </div>
                  <p className="text-left text-sm leading-relaxed text-red-700/90 [overflow-wrap:anywhere]" role="alert">{shipment.alert}</p>
                </div>
              </div>
              {userRole === 'company' && isHighRisk && (
                <div className="shrink-0 rounded-lg border border-red-100 bg-white/80 px-3 py-2 text-center text-[10px] font-mono font-bold uppercase tracking-widest text-red-700 sm:text-left">
                  Action required
                </div>
              )}
            </div>
          </div>
        )}

        {routeError && <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{routeError}</div>}

        <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
          <div className="space-y-6">
            <div className={`rounded-2xl border ${cp.borderHairline} bg-neutral-50 px-4 py-4 text-sm ${cp.textMuted}`}>{shipment.backend.statusMessage}</div>

            {shipment.backend.signalStack?.length ? (
              <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">Signal Intelligence</p>
                  <h2 className="mt-1 font-['DM_Serif_Display'] text-2xl text-neutral-900">Five-signal disruption stack</h2>
                </div>
                <div className="space-y-3">
                  {shipment.backend.signalStack.map((signal) => {
                    const tone = severityTone(signal.severity);
                    const severityPercent = Math.round(signal.severity * 100);
                    return (
                      <div key={signal.name} className="rounded-xl border border-black/10 bg-neutral-50 px-4 py-3">
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-neutral-900">{signal.name}</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${tone.text}`}>{severityPercent}%</span>
                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${signal.usedFallback ? 'bg-neutral-200 text-neutral-600' : 'bg-blue-100 text-blue-700'}`}>
                              {signal.usedFallback ? 'fallback' : 'live'}
                            </span>
                          </div>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
                          <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${severityPercent}%` }} />
                        </div>
                        <p className="mt-2 text-sm text-neutral-600">{signal.summary}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {architecture ? (
              <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">System Architecture</p>
                  <h2 className="mt-1 font-['DM_Serif_Display'] text-2xl text-neutral-900">Transparency panel</h2>
                </div>
                <div className="space-y-3 text-sm text-neutral-700">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-neutral-50 px-4 py-3">
                    <span className="font-medium text-neutral-500">Auth mode</span>
                    <span className="text-right text-neutral-900">{architecture.authMode}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-neutral-50 px-4 py-3">
                    <span className="font-medium text-neutral-500">Persistence</span>
                    <span className="text-right text-neutral-900">{architecture.persistenceMode}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-neutral-50 px-4 py-3">
                    <span className="font-medium text-neutral-500">Analytics</span>
                    <span className="text-right text-neutral-900">{architecture.analyticsMode.includes('bigquery') ? 'BigQuery' : 'Local Audit Log'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-neutral-50 px-4 py-3">
                    <span className="font-medium text-neutral-500">Agent mode</span>
                    <span className="text-right text-neutral-900">{architecture.agentMode === 'vertex_ai' ? 'Vertex AI Agent' : architecture.agentMode === 'local_orchestrator' ? 'Local Orchestrator' : architecture.agentMode}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-neutral-50 px-4 py-3">
                    <span className="font-medium text-neutral-500">Execution</span>
                    <span className="text-right text-neutral-900">{architecture.executionMode || 'fastapi_worker'}</span>
                  </div>
                  <div className="rounded-xl border border-black/10 bg-neutral-50 px-4 py-3">
                    <p className="font-medium text-neutral-500">Delivery modes</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {architecture.deliveryModes?.map((mode) => (
                        <span key={mode} className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-neutral-700">
                          {mode}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-black/10 bg-neutral-50 px-4 py-3">
                    <p className="font-medium text-neutral-500">Stakeholders</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {architecture.stakeholderRoles?.map((role) => (
                        <span key={role} className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-neutral-700">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            <RouteNetworkMap shipment={shipment.backend} height={320} />

            {shipment.routes.length > 0 && (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className={`text-left font-['DM_Serif_Display'] text-xl sm:text-2xl [overflow-wrap:anywhere] ${cp.text}`}>Alternate routes</h2>
                  <div className="hidden h-px flex-1 bg-neutral-100 sm:block sm:min-w-[2rem]" aria-hidden />
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {shipment.routes.map((route) => {
                    const isBest = route.isRecommended;

                    return (
                      <div
                        key={route.id}
                        className={`flex h-full min-h-0 flex-col rounded-2xl border p-6 shadow-sm transition-all duration-200 hover:shadow-md ${
                          isBest ? 'border-black bg-[#F7F7F7] ring-2 ring-[#DFFF00]/50' : `border ${cp.borderHairline} bg-white hover:border-neutral-200`
                        }`}
                      >
                        {isBest && (
                          <div className="-mt-2 mb-3 self-center rounded-full border border-black bg-[#DFFF00] px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-widest text-black">
                            AI recommended
                          </div>
                        )}

                        <h3 className={`mb-6 text-center text-base font-bold ${cp.text}`}>{route.name}</h3>

                        <div className="mb-8 flex flex-1 flex-col gap-4 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className={`flex items-center gap-2 ${cp.textMuted}`}><Clock size={14} aria-hidden /> ETA</span>
                            <span className={`font-medium ${cp.text}`}>{route.eta}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className={`flex items-center gap-2 ${cp.textMuted}`}><DollarSign size={14} aria-hidden /> Cost</span>
                            <span className={`font-medium ${route.cost.startsWith('+') && route.cost !== '+₹0' ? 'text-amber-600' : 'text-green-600'}`}>{route.cost}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className={`flex items-center gap-2 ${cp.textMuted}`}><ShieldCheck size={14} aria-hidden /> Reliability</span>
                            <span className="font-medium text-green-600">{route.reliability}</span>
                          </div>
                        </div>

                        {userRole === 'company' ? (
                          <button
                            type="button"
                            onClick={() => handleApprove(route.id)}
                            disabled={approvingRouteId !== null}
                            className={
                              isBest
                                ? `${cp.btnPrimaryBlock} disabled:cursor-not-allowed disabled:opacity-60`
                                : `inline-flex w-full items-center justify-center rounded-xl border ${cp.border} bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-700 transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60`
                            }
                          >
                            {approvingRouteId === route.id ? 'Applying route...' : isBest ? 'Approve best route' : 'Select route'}
                          </button>
                        ) : (
                          <div className={`rounded-xl border ${cp.borderHairline} bg-neutral-50 py-2.5 text-center text-[10px] font-mono uppercase tracking-widest ${cp.textSubtle}`}>
                            Awaiting company approval
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <Collapsible open={auditOpen} onOpenChange={setAuditOpen}>
              <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">Audit Trail</p>
                    <h2 className="mt-1 font-['DM_Serif_Display'] text-2xl text-neutral-900">Operational event log</h2>
                  </div>
                  <CollapsibleTrigger asChild>
                    <button type="button" className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-neutral-700 transition hover:border-black">
                      {auditOpen ? 'Hide' : 'Show'}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${auditOpen ? 'rotate-180' : ''}`} aria-hidden />
                    </button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="mt-5">
                  {auditLoading ? (
                    <p className={`text-sm ${cp.textMuted}`}>Loading the latest audit events...</p>
                  ) : auditError ? (
                    <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{auditError}</p>
                  ) : auditEvents.length ? (
                    <div className="space-y-3">
                      {auditEvents.map((event) => (
                        <div key={event.id} className="rounded-xl border border-black/10 bg-neutral-50 px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                            <span>{formatTimestamp(event.createdAt)}</span>
                            <span className="rounded-full border border-black/10 bg-white px-2 py-0.5 font-mono uppercase tracking-widest text-neutral-700">
                              {event.eventType}
                            </span>
                            {event.exportStatus?.status === 'exported' ? (
                              <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 font-mono uppercase tracking-widest text-green-700">BQ</span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm font-medium text-neutral-900">{event.actor}</p>
                          <p className="mt-1 text-sm text-neutral-600">{event.detail}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-sm ${cp.textMuted}`}>No audit events have been recorded for this shipment yet.</p>
                  )}
                </CollapsibleContent>
              </section>
            </Collapsible>

            <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">Journey Timeline</p>
                <h2 className="mt-1 font-['DM_Serif_Display'] text-2xl text-neutral-900">Shipment progress</h2>
              </div>
              <svg viewBox="0 0 320 48" className="h-16 w-full" aria-hidden>
                {[0, 1, 2].map((segmentIndex) => {
                  const isActive = journeyStep > segmentIndex;
                  return (
                    <line
                      key={`segment-${segmentIndex}`}
                      x1={32 + segmentIndex * 86}
                      y1={24}
                      x2={118 + segmentIndex * 86}
                      y2={24}
                      stroke={isActive ? '#22c55e' : '#d4d4d8'}
                      strokeWidth="4"
                      strokeDasharray={isActive ? undefined : '6 6'}
                    />
                  );
                })}
                {[
                  { cx: 24, fill: '#22c55e' },
                  { cx: 110, fill: '#22c55e' },
                  { cx: 196, fill: isHighRisk ? '#ef4444' : '#d4d4d8' },
                  { cx: 282, fill: shipment.backend.status === 'stable' ? '#22c55e' : shipment.backend.status === 'risk_detected' ? '#ef4444' : '#d4d4d8' },
                ].map((node, index) => (
                  <circle
                    key={`node-${node.cx}`}
                    cx={node.cx}
                    cy={24}
                    r={12}
                    fill={node.fill}
                    stroke={index === 2 && !isHighRisk ? '#a1a1aa' : node.fill}
                    strokeDasharray={index === 2 && !isHighRisk ? '4 3' : undefined}
                  />
                ))}
              </svg>
              <div className="mt-2 grid grid-cols-4 gap-3 text-center text-xs text-neutral-600">
                <div>Origin</div>
                <div>In Transit</div>
                <div>Risk Detected</div>
                <div>Destination</div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#DFFF00]/45 bg-[#DFFF00]/12">
                  <Brain className="h-5 w-5 text-neutral-900" strokeWidth={1.7} />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">AI explanation</p>
                  <h2 className="font-['DM_Serif_Display'] text-2xl text-neutral-900">Why this route decision</h2>
                </div>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-neutral-600">{shipment.backend.explanation?.summary || shipment.backend.statusMessage}</p>
              {shipment.backend.explanation?.reasoning?.length ? (
                <ul className="mt-4 space-y-3">
                  {shipment.backend.explanation.reasoning.slice(0, 3).map((reason) => (
                    <li key={reason} className="rounded-xl border border-black/10 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                      {reason}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-neutral-50">
                  <Sparkles className="h-5 w-5 text-neutral-900" strokeWidth={1.7} />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">Transporter Alert Preview</p>
                  <h2 className="font-['DM_Serif_Display'] text-2xl text-neutral-900">Multilingual message preview</h2>
                </div>
              </div>
              <div className="mt-5 rounded-2xl border border-[#DFFF00]/35 bg-[#faffd9] px-4 py-4">
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
                <div className="mt-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">English</p>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-900">{englishMessage}</p>
                </div>
                <div className="mt-4 overflow-x-auto pb-1">
                  <div className="flex w-max gap-2">
                    {alertLanguages.map((language) => {
                      const isSelected = selectedAlertLanguage === language;
                      return (
                        <button
                          key={language}
                          type="button"
                          onClick={() => setSelectedAlertLanguage(language)}
                          className={`rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-widest transition ${
                            isSelected ? 'border-black bg-black text-white' : 'border-black/10 bg-white text-neutral-700 hover:border-black'
                          }`}
                        >
                          {ALERT_LANGUAGE_LABELS[language] || language.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-black/10 bg-white px-4 py-3">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                    {ALERT_LANGUAGE_LABELS[selectedAlertLanguage] || selectedAlertLanguage.toUpperCase()} message
                  </p>
                  <p className={`mt-1 text-sm leading-relaxed ${selectedTranslation === 'Translation unavailable' ? 'text-neutral-400' : 'text-neutral-900'}`}>
                    {selectedTranslation}
                  </p>
                </div>
                {dispatchStatus === 'queued' || dispatchStatus === 'sent' ? (
                  <div className="mt-4 inline-flex rounded-full border border-green-200 bg-green-50 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-green-700">
                    WhatsApp alert dispatched
                  </div>
                ) : dispatchStatus === 'skipped' ? (
                  <div className="mt-4 inline-flex rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-neutral-600">
                    WhatsApp — configure WHATSAPP_TOKEN to enable
                  </div>
                ) : dispatchStatus === 'failed' ? (
                  <div className="mt-4 inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-red-700">
                    WhatsApp dispatch failed
                  </div>
                ) : null}
              </div>
              <p className={`mt-3 text-xs ${cp.textMuted}`}>Shown in your selected language when a translation is available.</p>
            </section>

            {cascadeImpact ? (
              <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-neutral-50">
                    <Package className="h-5 w-5 text-neutral-900" strokeWidth={1.7} />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">Cascade impact</p>
                    <h2 className="font-['DM_Serif_Display'] text-2xl text-neutral-900">Downstream exposure</h2>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {Array.from({ length: Math.min(cascadeImpact.affectedOrders, 8) }).map((_, index) => (
                    <span
                      key={`impact-${index}`}
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${
                        cascadeImpact.severity === 'high'
                          ? 'border-red-200 bg-red-50 text-red-600'
                          : cascadeImpact.severity === 'medium'
                            ? 'border-amber-200 bg-amber-50 text-amber-600'
                            : 'border-neutral-200 bg-neutral-50 text-neutral-500'
                      }`}
                    >
                      <Package className="h-4 w-4" aria-hidden />
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-sm font-medium text-neutral-900">{cascadeImpact.slaRisk}</p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{cascadeImpact.summary}</p>
              </section>
            ) : null}
          </div>
        </div>

        {userRole === 'supplier' && isHighRisk ? (
          <div className="mt-6 flex flex-col gap-3 rounded-xl border border-amber-100 bg-amber-50/80 p-4 text-sm text-amber-900 sm:flex-row sm:items-center [overflow-wrap:anywhere]">
            <Clock size={16} className="shrink-0 text-amber-600" aria-hidden />
            <span>{shipment.backend.decision.recommendedAction}</span>
          </div>
        ) : null}

        {showSuccess && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 p-4 backdrop-blur-sm">
            <div className="max-w-md rounded-2xl border border-green-200 bg-green-50 p-8 text-center shadow-lg transition-all duration-200">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white shadow-md">
                <CheckCircle2 size={32} aria-hidden />
              </div>
              <h3 className="font-['DM_Serif_Display'] text-2xl text-green-900">Route approved</h3>
              <p className="mt-2 text-sm text-green-800/90">
                {shipment.backend.dispatchStatus?.status === 'queued'
                  ? 'Driver notification has been queued for dispatch.'
                  : authUser?.role === 'admin'
                    ? 'The live route selection has been saved to the backend.'
                    : 'The live route selection has been saved.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
