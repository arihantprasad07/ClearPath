import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  AlertTriangle,
  ArrowLeft,
  Brain,
  CheckCircle2,
  Clock,
  DollarSign,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import RouteNetworkMap from '../components/RouteNetworkMap';
import { useAppContext } from '../context/AppContext';
import { cp } from '../lib/cpUi';

export default function ShipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authUser, preferredLanguage, shipments, userRole, updateShipmentRoute } = useAppContext();

  const shipment = shipments.find((candidate) => candidate.id === id);
  const [showSuccess, setShowSuccess] = useState(false);
  const [approvingRouteId, setApprovingRouteId] = useState<string | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  const localizedAlert = useMemo(() => {
    if (!shipment) return '';
    return shipment.backend.alert?.translations?.[preferredLanguage] || shipment.backend.alert?.message || shipment.alert || '';
  }, [preferredLanguage, shipment]);

  if (!shipment) {
    return <div className={`w-full py-16 text-center ${cp.textMuted}`}>Shipment not found</div>;
  }

  const isHighRisk = shipment.riskLevel === 'high';
  const riskLabel = shipment.riskLevel === 'high' ? 'Critical' : shipment.riskLevel === 'medium' ? 'Warning' : 'On track';

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
                {userRole === 'company' ? 'Company workflow' : 'Supplier workflow'}
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

          <div className={`w-full shrink-0 rounded-2xl border ${cp.borderHairline} bg-neutral-50/90 p-5 md:w-auto md:min-w-[220px]`}>
            <div className={`text-[10px] font-mono uppercase tracking-widest ${cp.textSubtle}`}>Current ETA</div>
            <div className={`mt-2 flex items-center gap-2 text-lg font-semibold ${isHighRisk ? 'text-red-600' : cp.text}`}>
              <Clock size={18} className="shrink-0" aria-hidden />
              <span className="break-words">{shipment.eta}</span>
            </div>
            <p className={`mt-3 text-xs ${cp.textMuted}`}>Confidence: {shipment.backend.decision.confidence}%</p>
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
                  <h3 className="mb-1 text-left text-base font-semibold text-red-900 sm:text-lg">
                    {shipment.backend.alert?.headline || 'High probability of delay due to conditions'}
                  </h3>
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
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">Localized field alert</p>
                  <h2 className="font-['DM_Serif_Display'] text-2xl text-neutral-900">Transporter message</h2>
                </div>
              </div>
              <p className="mt-5 rounded-2xl border border-[#DFFF00]/35 bg-[#faffd9] px-4 py-4 text-sm leading-relaxed text-neutral-900">
                {localizedAlert}
              </p>
              <p className={`mt-3 text-xs ${cp.textMuted}`}>Shown in your selected language when a translation is available.</p>
            </section>

            {shipment.backend.signalStack?.length ? (
              <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                <h2 className="font-['DM_Serif_Display'] text-2xl text-neutral-900">Signal stack</h2>
                <div className="mt-5 space-y-3">
                  {shipment.backend.signalStack.slice(0, 5).map((signal) => (
                    <div key={signal.name} className="rounded-xl border border-black/10 bg-neutral-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-neutral-900">{signal.name}</p>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">{Math.round(signal.severity * 100)}%</span>
                      </div>
                      <p className="mt-2 text-sm text-neutral-600">{signal.summary}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {shipment.backend.architectureStatus ? (
              <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                <h2 className="font-['DM_Serif_Display'] text-2xl text-neutral-900">Architecture snapshot</h2>
                <div className="mt-5 grid grid-cols-1 gap-3 text-sm text-neutral-600">
                  <div className="rounded-xl border border-black/10 bg-neutral-50 px-4 py-3">Auth: {shipment.backend.architectureStatus.authMode}</div>
                  <div className="rounded-xl border border-black/10 bg-neutral-50 px-4 py-3">Persistence: {shipment.backend.architectureStatus.persistenceMode}</div>
                  <div className="rounded-xl border border-black/10 bg-neutral-50 px-4 py-3">Analytics: {shipment.backend.architectureStatus.analyticsMode}</div>
                  <div className="rounded-xl border border-black/10 bg-neutral-50 px-4 py-3">Delivery: {shipment.backend.architectureStatus.deliveryModes.join(', ')}</div>
                </div>
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
