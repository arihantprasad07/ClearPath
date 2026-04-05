import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowUpRight, Brain, ChevronRight, Package, Plus, RefreshCw, Zap } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ShipmentViewModel } from '../lib/api';
import { cp } from '../lib/cpUi';
import RouteNetworkMap from '../components/RouteNetworkMap';

function formatPredictionWindow(window: ShipmentViewModel['backend']['predictionWindow']) {
  return `${window.label} (${window.startHours}-${window.endHours}h, ${window.confidence}% confidence)`;
}

function ShipmentCard({ shipment, isCompany }: { shipment: ShipmentViewModel; isCompany: boolean }) {
  const isHighRisk = shipment.riskLevel === 'high';
  const riskBadge =
    shipment.riskLevel === 'high' ? (
      <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-white">Critical</span>
    ) : shipment.riskLevel === 'medium' ? (
      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-amber-800">Warning</span>
    ) : (
      <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-700">On track</span>
    );

  return (
    <Link to={`/shipment/${shipment.id}`} className={`group flex h-full min-h-[240px] flex-col ${cp.cardInteractive} ${isHighRisk ? 'ring-1 ring-red-100' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Package size={18} className={isHighRisk ? 'shrink-0 text-red-500' : 'shrink-0 text-neutral-400'} aria-hidden />
          <span className={`truncate text-left text-sm font-semibold ${isHighRisk ? 'text-red-900' : cp.text}`}>{shipment.name}</span>
        </div>
        {riskBadge}
      </div>

      <div className="my-6 flex flex-1 flex-col justify-center border-y border-neutral-100 py-5">
        <p className={`text-left text-[10px] font-mono uppercase tracking-widest ${cp.textSubtle}`}>ETA</p>
        <p className={`mt-1 text-left text-xl font-semibold tracking-tight ${isHighRisk ? 'text-red-600' : cp.text}`}>{shipment.eta}</p>
      </div>

      <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm ${cp.textMuted}`}>
        <span className="font-medium text-neutral-800">{shipment.source}</span>
        <ChevronRight size={14} className="shrink-0 text-neutral-300" aria-hidden />
        <span className="font-medium text-neutral-800">{shipment.destination}</span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className={`text-xs font-mono font-semibold uppercase tracking-wide ${isCompany ? cp.text : cp.textSubtle}`}>{isCompany ? 'Incoming' : 'Outgoing'}</span>
        <span className={`text-xs font-medium ${isHighRisk ? 'text-red-600' : cp.text} transition-transform duration-200 group-hover:translate-x-0.5`}>
          {isHighRisk ? 'Resolve ->' : 'Details ->'}
        </span>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { authLoading, authUser, refreshShipment, shipments, shipmentsLoading, userRole } = useAppContext();
  const navigate = useNavigate();
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !authUser) navigate('/');
  }, [authLoading, authUser, navigate]);

  const sorted = useMemo(() => {
    const order = { high: 0, medium: 1, low: 2 } as Record<string, number>;
    return [...shipments].sort((a, b) => (order[a.riskLevel] ?? 3) - (order[b.riskLevel] ?? 3));
  }, [shipments]);

  if (authLoading || !authUser || !userRole) return null;

  const isCompany = userRole === 'company';
  const roleLabel = isCompany ? 'Shipper view' : 'Transporter view';
  const highRiskCount = shipments.filter((shipment) => shipment.riskLevel === 'high').length;
  const aiReadyCount = shipments.filter((shipment) => shipment.backend.explanation?.reasoning?.length).length;
  const averageConfidence = shipments.length
    ? Math.round(shipments.reduce((sum, shipment) => sum + (shipment.backend.decision.confidence || 0), 0) / shipments.length)
    : 0;
  const latestShipment = sorted[0] ?? null;

  const handleRefresh = async (shipmentId: string) => {
    try {
      setRefreshingId(shipmentId);
      await refreshShipment(shipmentId);
    } finally {
      setRefreshingId(null);
    }
  };

  const impactCards = [
    { label: 'Active lanes', value: shipments.length.toString(), classes: cp.card },
    { label: 'Critical risks', value: highRiskCount.toString(), classes: 'rounded-2xl border border-red-100 bg-red-50/80 p-6 shadow-sm' },
    { label: 'AI-backed analyses', value: aiReadyCount.toString(), classes: 'rounded-2xl border border-[#DFFF00]/35 bg-[#faffd9] p-6 shadow-sm' },
    { label: 'Average confidence', value: `${averageConfidence}%`, classes: 'rounded-2xl border border-amber-100 bg-amber-50/80 p-6 shadow-sm' },
  ];

  return (
    <div className="w-full min-w-0 space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[#DFFF00]/12 blur-3xl" aria-hidden />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center rounded-full border border-[#DFFF00]/45 bg-[#DFFF00]/12 px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-neutral-900">{roleLabel}</span>
              <span className="inline-flex items-center rounded-full border border-black/10 bg-neutral-50 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-neutral-600">{authUser.role} session</span>
            </div>
            <h1 className="mt-4 font-['DM_Serif_Display'] text-3xl tracking-tight text-neutral-900 sm:text-4xl">ClearPath dashboard</h1>
            <p className={`mt-3 max-w-2xl text-sm leading-relaxed ${cp.textMuted}`}>
              {shipmentsLoading
                ? 'Syncing live shipments, route intelligence, and AI reasoning from the backend.'
                : 'Live disruption intelligence, route recommendations, and AI-backed decisions for your active shipment lanes.'}
            </p>
          </div>
          <Link to="/add-shipment" className={`${cp.btnPrimary} w-full shrink-0 sm:w-auto`}>
            <Plus size={16} className="shrink-0" aria-hidden />
            {isCompany ? 'Add shipment' : 'New shipment'}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {impactCards.map((card) => (
          <div key={card.label} className={card.classes}>
            <div className={`mb-2 text-[10px] font-mono uppercase tracking-wider ${cp.textSubtle}`}>{card.label}</div>
            <div className={`font-['DM_Serif_Display'] text-3xl ${cp.text}`}>{card.value}</div>
          </div>
        ))}
      </div>

      {latestShipment?.backend.alert?.translations && latestShipment.riskLevel === 'high' && (
        <section className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-700">Transporter alert — live preview</p>
              <h2 className="mt-1 font-['DM_Serif_Display'] text-xl text-neutral-900">WhatsApp notification ready</h2>
            </div>
            <span className="rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-amber-800">
              {Object.keys(latestShipment.backend.alert.translations).length} languages
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(['en', 'hi', 'gu', 'ta'] as const).map((lang) => {
              const labels: Record<string, string> = { en: 'English', hi: 'Hindi', gu: 'Gujarati', ta: 'Tamil' };
              const text = latestShipment.backend.alert?.translations?.[lang];
              if (!text) return null;
              return (
                <div key={lang} className="rounded-xl border border-amber-100 bg-white px-4 py-3">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-1">{labels[lang]}</p>
                  <p className="text-sm leading-relaxed text-neutral-800">{text}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {latestShipment ? (
        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
          <RouteNetworkMap shipment={latestShipment.backend} />
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">Active shipment</p>
                <h2 className="mt-1 font-['DM_Serif_Display'] text-2xl text-neutral-900">Risk overview</h2>
              </div>
              <span className="rounded-full border border-[#DFFF00]/45 bg-[#DFFF00]/12 px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-neutral-900">
                {latestShipment.riskLevel}
              </span>
            </div>
            <div className="mt-5 space-y-3 text-sm text-neutral-600">
              <div className="rounded-xl border border-black/10 bg-neutral-50 px-4 py-3">
                Risk score: <span className="font-semibold text-neutral-900">{latestShipment.backend.risk.score}%</span>
              </div>
              <div className="rounded-xl border border-black/10 bg-neutral-50 px-4 py-3">
                Prediction window: <span className="font-semibold text-neutral-900">{formatPredictionWindow(latestShipment.backend.predictionWindow)}</span>
              </div>
              <div className="rounded-xl border border-black/10 bg-neutral-50 px-4 py-3">
                Recommended action: <span className="font-semibold text-neutral-900">{latestShipment.backend.decision.recommendedAction}</span>
              </div>
              <div className="rounded-xl border border-black/10 bg-neutral-50 px-4 py-3">
                Delivery channel: <span className="font-semibold text-neutral-900">{latestShipment.backend.architectureStatus?.deliveryModes.join(', ') || 'dashboard_only'}</span>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <section className="relative overflow-hidden rounded-2xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#DFFF00]/12 blur-3xl" aria-hidden />
          <div className="relative z-10 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className={`text-left font-['DM_Serif_Display'] text-xl font-normal ${cp.text}`}>{isCompany ? 'My shipments' : 'Active shipments'}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex w-fit items-center rounded-full border border-[#DFFF00]/45 bg-[#DFFF00]/12 px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-neutral-900">{sorted.length} active</span>
              <Link to="/add-shipment" className={cp.btnPrimary}>
                <Plus size={15} className="shrink-0" aria-hidden />
                {isCompany ? 'Add shipment' : 'New shipment'}
              </Link>
            </div>
          </div>

          {shipmentsLoading ? (
            <div className={`rounded-2xl border border-dashed ${cp.borderHairline} bg-neutral-50/80 p-8 text-center text-sm ${cp.textMuted}`}>
              Pulling the latest route intelligence, AI summaries, and shipment health from the backend.
            </div>
          ) : sorted.length === 0 ? (
            <div className={`rounded-2xl border border-dashed ${cp.borderHairline} bg-neutral-50/80 p-8 text-center`}>
              <p className={`text-sm ${cp.textMuted}`}>No live shipments are registered yet.</p>
              <Link to="/add-shipment" className={`${cp.btnPrimary} mt-4 inline-flex`}>
                <Plus size={15} className="shrink-0" aria-hidden />
                Create your first shipment
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {sorted.map((shipment) => (
                <div key={shipment.id} className="space-y-3">
                  <ShipmentCard shipment={shipment} isCompany={isCompany} />
                  <button
                    type="button"
                    onClick={() => handleRefresh(shipment.id)}
                    disabled={refreshingId !== null}
                    className={`inline-flex items-center gap-2 rounded-xl border ${cp.borderHairline} bg-white px-3 py-2 text-[11px] font-mono uppercase tracking-widest ${cp.textMuted} transition-all duration-200 hover:border-neutral-300 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <RefreshCw size={13} className={refreshingId === shipment.id ? 'animate-spin' : ''} aria-hidden />
                    {refreshingId === shipment.id ? 'Refreshing...' : 'Refresh analysis'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#DFFF00]/45 bg-[#DFFF00]/12">
                <Brain className="h-5 w-5 text-neutral-900" strokeWidth={1.7} />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">AI co-pilot</p>
                <h2 className="font-['DM_Serif_Display'] text-2xl text-neutral-900">Why AI matters here</h2>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm leading-relaxed text-neutral-600">
              <p>ClearPath uses AI to explain action, not just to label a risk score.</p>
              <p>The operator sees a recommendation, confidence, reason, and follow-through path in one place.</p>
              <p className="rounded-xl border border-[#DFFF00]/35 bg-[#faffd9] px-4 py-3 text-neutral-900">
                {latestShipment?.backend.decision.recommendedAction || 'Create a lane to generate the first live AI recommendation.'}
              </p>
            </div>
          </section>

          {latestShipment?.backend.signalStack?.length ? (
            <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500 mb-1">Live signal feed</p>
              <h2 className="font-['DM_Serif_Display'] text-2xl text-neutral-900 mb-4">Active risk signals</h2>
              <div className="space-y-3">
                {latestShipment.backend.signalStack.slice(0, 3).map((signal) => (
                  <div key={signal.name} className="rounded-xl border border-black/10 bg-neutral-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-neutral-900">{signal.name}</p>
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${Math.round(signal.severity * 100) >= 60 ? 'text-red-600' : Math.round(signal.severity * 100) >= 35 ? 'text-amber-600' : 'text-green-600'}`}>
                        {Math.round(signal.severity * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500">{signal.summary}</p>
                    <div className="mt-2 h-1 rounded-full bg-neutral-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${Math.round(signal.severity * 100) >= 60 ? 'bg-red-500' : Math.round(signal.severity * 100) >= 35 ? 'bg-amber-400' : 'bg-green-500'}`}
                        style={{ width: `${Math.round(signal.severity * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-neutral-50">
                <Zap className="h-5 w-5 text-neutral-900" strokeWidth={1.7} />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">Why it works</p>
                <h2 className="font-['DM_Serif_Display'] text-2xl text-neutral-900">What ClearPath does</h2>
              </div>
            </div>
            <ul className="mt-5 space-y-3 text-sm text-neutral-600">
              <li className="rounded-xl border border-black/10 bg-neutral-50 px-4 py-3">Predicts disruption 18–24 hours before it affects your shipment.</li>
              <li className="rounded-xl border border-black/10 bg-neutral-50 px-4 py-3">Recommends and scores 3 alternate routes in real time.</li>
              <li className="rounded-xl border border-black/10 bg-neutral-50 px-4 py-3">Sends multilingual WhatsApp alerts to transporters in their language.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-['DM_Serif_Display'] text-2xl text-neutral-900">Latest action lane</h2>
              {latestShipment ? (
                <Link to={`/shipment/${latestShipment.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-neutral-900">
                  Open
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </Link>
              ) : null}
            </div>
            {latestShipment ? (
              <div className="mt-5 rounded-2xl border border-black/10 bg-neutral-50 p-4">
                <p className="text-sm font-semibold text-neutral-900">{latestShipment.name}</p>
                <p className={`mt-1 text-sm ${cp.textMuted}`}>{latestShipment.backend.explanation?.summary || latestShipment.backend.statusMessage}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className={`text-[10px] font-mono uppercase tracking-widest ${cp.textSubtle}`}>Confidence</p>
                    <p className={`mt-1 ${cp.text}`}>{latestShipment.backend.decision.confidence}%</p>
                  </div>
                  <div>
                    <p className={`text-[10px] font-mono uppercase tracking-widest ${cp.textSubtle}`}>Fallback mode</p>
                    <p className={`mt-1 ${cp.text}`}>{latestShipment.backend.usedFallbackData ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className={`mt-5 text-sm ${cp.textMuted}`}>No shipment has been created yet.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
