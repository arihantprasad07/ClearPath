import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  ChevronDown,
  ChevronRight,
  Globe2,
  MapPinned,
  Package,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ShipmentViewModel } from '../lib/api';
import { getSignalIcon } from '../lib/signalIcons';

function DecoCluster({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute ${className}`} aria-hidden>
      <div className="absolute left-0 top-0 h-10 w-10 rounded-full border border-black/10 border-dashed" />
      <div className="absolute left-6 top-6 h-2 w-2 rounded-full bg-[#DFFF00]" />
      <div className="absolute left-10 top-1 text-lg leading-none text-black">*</div>
      <div className="absolute left-11 top-8 h-7 w-7 rotate-45 border border-black/80 bg-black" />
    </div>
  );
}

function TinyLabel({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p className={`text-[9px] font-mono uppercase tracking-[0.22em] ${dark ? 'text-white/60' : 'text-neutral-500'}`}>
      {children}
    </p>
  );
}

function MiniMetricCard({
  title,
  value,
  tone,
  icon,
}: {
  title: string;
  value: string;
  tone: 'dark' | 'lime' | 'light';
  icon: React.ReactNode;
}) {
  const tones = {
    dark: 'border-black bg-[#171922] text-white',
    lime: 'border-[#b9d700] bg-[#DFFF00] text-black',
    light: 'border-black/10 bg-white text-black',
  } as const;

  return (
    <div className={`relative min-h-[88px] rounded-[18px] border p-3 ${tones[tone]}`}>
      <div className="mb-5 flex items-start justify-between gap-2">
        <TinyLabel dark={tone === 'dark'}>{title}</TinyLabel>
        <div className={`flex h-7 w-7 items-center justify-center rounded-full ${tone === 'dark' ? 'bg-white/10 text-white' : 'bg-black/10 text-black'}`}>
          {icon}
        </div>
      </div>
      <p className={`text-lg font-semibold tracking-tight ${tone === 'dark' ? 'text-white' : 'text-black'}`}>{value}</p>
    </div>
  );
}

function LaneListItem({
  shipment,
  isCompany,
  refreshing,
  onRefresh,
}: {
  shipment: ShipmentViewModel;
  isCompany: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const riskTone =
    shipment.riskLevel === 'high'
      ? 'text-red-600'
      : shipment.riskLevel === 'medium'
        ? 'text-amber-600'
        : 'text-emerald-600';

  return (
    <div className="rounded-[18px] border border-black/10 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-neutral-950">{shipment.name}</p>
          <p className="mt-1 text-[11px] text-neutral-500">
            {shipment.source} <span className="text-neutral-300">{'->'}</span> {shipment.destination}
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/10 bg-neutral-50 text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-60"
          aria-label={`Refresh ${shipment.name}`}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className={`text-[10px] font-mono uppercase tracking-[0.18em] ${riskTone}`}>{shipment.riskLevel} risk</span>
        <span className="text-xs text-neutral-500">{isCompany ? 'Company lane' : 'Transport lane'}</span>
      </div>
    </div>
  );
}

function AccordionRow({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[16px] border border-black/10 bg-white px-4 py-3">
      <div>
        <p className="text-xs font-medium text-neutral-900">{title}</p>
        <p className="mt-1 text-[11px] text-neutral-500">{value}</p>
      </div>
      <ChevronDown className="h-4 w-4 text-neutral-400" />
    </div>
  );
}

export default function Dashboard() {
  const { authLoading, authUser, refreshShipment, shipments, shipmentsLoading, userRole } = useAppContext();
  const navigate = useNavigate();
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Dashboard - ClearPath';
  }, []);

  useEffect(() => {
    if (!authLoading && !authUser) navigate('/');
  }, [authLoading, authUser, navigate]);

  const sorted = useMemo(() => {
    const order = { high: 0, medium: 1, low: 2 } as Record<string, number>;
    return [...shipments].sort((a, b) => (order[a.riskLevel] ?? 3) - (order[b.riskLevel] ?? 3));
  }, [shipments]);

  if (authLoading || !authUser || !userRole) return null;

  const isCompany = userRole === 'company';
  const latestShipment = sorted[0] ?? null;
  const activeCount = sorted.length;
  const criticalCount = sorted.filter((shipment) => shipment.riskLevel === 'high').length;
  const aiCount = sorted.filter((shipment) => shipment.backend.explanation?.summary).length;
  const avgConfidence = activeCount
    ? Math.round(sorted.reduce((sum, shipment) => sum + (shipment.backend.decision.confidence || 0), 0) / activeCount)
    : 0;

  const topSignals = latestShipment?.backend.signalStack?.slice(0, 3) ?? [];
  const translations = latestShipment?.backend.alert?.translations;
  const primaryTranslation =
    translations?.en || translations?.hi || translations?.gu || translations?.ta || latestShipment?.alert || 'Alert preview will appear here.';

  const handleRefresh = async (shipmentId: string) => {
    try {
      setRefreshingId(shipmentId);
      await refreshShipment(shipmentId);
    } finally {
      setRefreshingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[390px] pb-10">
      <div className="space-y-3">
        <section className="relative overflow-hidden rounded-[26px] border border-black/10 bg-white px-4 pb-4 pt-5 shadow-[0_20px_60px_-36px_rgba(0,0,0,0.35)]">
          <DecoCluster className="-right-2 top-6 h-16 w-16 opacity-80" />
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              <TinyLabel>Navigating the unknown</TinyLabel>
              <h1 className="mt-2 max-w-[190px] text-[26px] font-semibold leading-[1.02] tracking-tight text-neutral-950">
                Shipment
                <br />
                intelligence
              </h1>
            </div>
            <div className="flex gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-neutral-50">
                <Globe2 className="h-4 w-4 text-neutral-700" />
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-neutral-50">
                <Sparkles className="h-4 w-4 text-neutral-700" />
              </div>
            </div>
          </div>

          <p className="relative z-10 mt-3 max-w-[240px] text-[12px] leading-5 text-neutral-500">
            Compact route oversight with AI reasoning, transporter alerts, and live lane health in one scroll.
          </p>

          <div className="relative z-10 mt-4 flex items-center gap-2">
            <Link
              to="/add-shipment"
              className="inline-flex items-center gap-2 rounded-full border border-black bg-black px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Add lane
            </Link>
            <span className="rounded-full border border-black/10 bg-neutral-50 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-500">
              {isCompany ? 'Company view' : 'Transport view'}
            </span>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <MiniMetricCard title="Active lanes" value={String(activeCount)} tone="light" icon={<Package className="h-4 w-4" />} />
          <MiniMetricCard title="Critical now" value={String(criticalCount)} tone="lime" icon={<AlertTriangle className="h-4 w-4" />} />
          <MiniMetricCard title="AI analyzed" value={String(aiCount)} tone="dark" icon={<Brain className="h-4 w-4" />} />
          <MiniMetricCard title="Confidence" value={`${avgConfidence}%`} tone="light" icon={<ShieldCheck className="h-4 w-4" />} />
        </section>

        <section className="grid grid-cols-[1.1fr_0.9fr] gap-3">
          <div className="rounded-[22px] border border-black/10 bg-[#DFFF00] p-4">
            <TinyLabel>Latest action</TinyLabel>
            <p className="mt-2 text-sm font-semibold leading-5 text-black">
              {latestShipment?.backend.decision.recommendedAction || 'Create a lane to unlock the first recommendation.'}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-black/70">
                {latestShipment?.riskLevel || 'pending'}
              </span>
              {latestShipment ? (
                <Link to={`/shipment/${latestShipment.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-black">
                  Open <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </div>
          </div>

          <div className="rounded-[22px] border border-black bg-[#171922] p-4 text-white">
            <TinyLabel dark>Prediction</TinyLabel>
            <p className="mt-2 text-lg font-semibold tracking-tight">
              {latestShipment?.backend.predictionWindow?.label || 'Waiting'}
            </p>
            <p className="mt-1 text-[11px] leading-4 text-white/65">
              {latestShipment
                ? `${latestShipment.backend.predictionWindow.startHours}-${latestShipment.backend.predictionWindow.endHours}h watch window`
                : 'Run analysis to see the forecast band.'}
            </p>
          </div>
        </section>

        <section className="rounded-[24px] border border-black/10 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <TinyLabel>Lane overview</TinyLabel>
              <h2 className="mt-1 text-base font-semibold text-neutral-950">Live shipment cards</h2>
            </div>
            <span className="rounded-full border border-black/10 bg-neutral-50 px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.18em] text-neutral-500">
              {shipmentsLoading ? 'syncing' : `${activeCount} lanes`}
            </span>
          </div>

          <div className="space-y-3">
            {shipmentsLoading ? (
              <div className="rounded-[18px] border border-dashed border-black/10 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-500">
                Syncing route intelligence...
              </div>
            ) : sorted.length ? (
              sorted.slice(0, 3).map((shipment) => (
                <LaneListItem
                  key={shipment.id}
                  shipment={shipment}
                  isCompany={isCompany}
                  refreshing={refreshingId === shipment.id}
                  onRefresh={() => handleRefresh(shipment.id)}
                />
              ))
            ) : (
              <div className="rounded-[18px] border border-dashed border-black/10 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-500">
                No lanes yet.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[24px] border border-black/10 bg-[#f7f7f3] p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <TinyLabel>Decision stack</TinyLabel>
              <h2 className="mt-1 text-base font-semibold text-neutral-950">Expandable intelligence</h2>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
              <TrendingUp className="h-4 w-4 text-neutral-800" />
            </div>
          </div>
          <div className="space-y-2.5">
            <AccordionRow
              title="Risk score"
              value={latestShipment ? `${latestShipment.backend.risk.score}% probability of disruption` : 'Waiting for analysis'}
            />
            <AccordionRow
              title="Recommended route"
              value={latestShipment?.backend.routes?.recommendedRouteId || latestShipment?.currentRoute || 'No route selected'}
            />
            <AccordionRow
              title="Delivery mode"
              value={latestShipment?.backend.architectureStatus?.deliveryModes?.join(', ') || 'dashboard_only'}
            />
          </div>
        </section>

        <section className="rounded-[24px] border border-black/10 bg-[#171922] p-4 text-white">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <TinyLabel dark>Live signal feed</TinyLabel>
              <h2 className="mt-1 text-base font-semibold text-white">Signals shaping the alert</h2>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
              <Zap className="h-4 w-4 text-[#DFFF00]" />
            </div>
          </div>

          <div className="space-y-3">
            {topSignals.length ? (
              topSignals.map((signal) => {
                const SignalIcon = getSignalIcon(signal.name);
                const severity = Math.round(signal.severity * 100);
                return (
                  <div key={signal.name} className="rounded-[18px] border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                          <SignalIcon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{signal.name}</p>
                          <p className="text-[11px] text-white/60">{signal.summary}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#DFFF00]">{severity}%</span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-[#DFFF00]" style={{ width: `${severity}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[18px] border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                Signals will appear after the first live analysis.
              </div>
            )}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[24px] border border-black/10 bg-white p-4">
          <DecoCluster className="right-6 top-7 h-14 w-14 opacity-60" />
          <div className="relative z-10">
            <TinyLabel>Transporter alert</TinyLabel>
            <h2 className="mt-1 text-base font-semibold text-neutral-950">WhatsApp-ready copy</h2>

            <div className="mt-4 rounded-[20px] border border-black/10 bg-[#f8f8f5] p-3">
              <div className="rounded-[16px] border border-black/10 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[#DFFF00]" />
                  <div>
                    <p className="text-xs font-semibold text-neutral-900">Driver notification</p>
                    <p className="text-[10px] text-neutral-500">{latestShipment?.transporter || '+91 transporter'}</p>
                  </div>
                </div>
                <div className="mt-3 rounded-[14px] bg-[#DFFF00] px-3 py-2.5 text-[12px] leading-5 text-black">
                  {primaryTranslation}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-black bg-[#171922] p-4 text-white">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <TinyLabel dark>Ops console</TinyLabel>
              <h2 className="mt-1 text-base font-semibold text-white">Execution snapshot</h2>
            </div>
            <MapPinned className="h-4 w-4 text-white/70" />
          </div>

          <div className="space-y-2 font-mono text-[11px] text-white/75">
            <div className="flex items-center justify-between gap-3 rounded-[14px] bg-white/5 px-3 py-2">
              <span>route</span>
              <span className="text-white">{latestShipment?.currentRoute || 'pending'}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-[14px] bg-white/5 px-3 py-2">
              <span>eta</span>
              <span className="text-white">{latestShipment?.eta || 'n/a'}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-[14px] bg-white/5 px-3 py-2">
              <span>fallback</span>
              <span className="text-white">{latestShipment?.backend.usedFallbackData ? 'yes' : 'no'}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-[14px] bg-white/5 px-3 py-2">
              <span>detail</span>
              {latestShipment ? (
                <Link to={`/shipment/${latestShipment.id}`} className="inline-flex items-center gap-1 text-[#DFFF00]">
                  open <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <span className="text-white">n/a</span>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
