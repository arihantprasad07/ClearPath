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
  Truck,
  Zap,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ShipmentViewModel } from '../lib/api';
import { getSignalIcon } from '../lib/signalIcons';

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

function StatTile({
  title,
  value,
  icon,
  tone,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  tone: 'white' | 'lime' | 'dark';
}) {
  const tones = {
    white: 'border-black/10 bg-white text-black',
    lime: 'border-[#b6d400] bg-[#DFFF00] text-black',
    dark: 'border-black bg-[#181a23] text-white',
  } as const;

  return (
    <div className={`rounded-[16px] border p-3 ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-2">
        <TinyLabel dark={tone === 'dark'}>{title}</TinyLabel>
        <div className={`flex h-6 w-6 items-center justify-center rounded-full ${tone === 'dark' ? 'bg-white/10 text-white' : 'bg-black/10 text-black'}`}>
          {icon}
        </div>
      </div>
      <p className={`mt-6 text-lg font-semibold tracking-tight ${tone === 'dark' ? 'text-white' : 'text-black'}`}>{value}</p>
    </div>
  );
}

function LaneChip({
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
    <div className="rounded-[14px] border border-black/10 bg-white px-3 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-neutral-950">{shipment.name}</p>
          <p className="mt-1 text-[10px] text-neutral-500">
            {shipment.source} <span className="text-neutral-300">{'->'}</span> {shipment.destination}
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-black/10 bg-neutral-50 text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-60"
          aria-label={`Refresh ${shipment.name}`}
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className={`text-[9px] font-mono uppercase tracking-[0.18em] ${riskTone}`}>{shipment.riskLevel} risk</span>
        <span className="text-[10px] text-neutral-500">{isCompany ? 'Company' : 'Transport'}</span>
      </div>
    </div>
  );
}

function AccordionRow({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[14px] border border-black/10 bg-white px-3 py-3">
      <div className="min-w-0">
        <p className="text-[12px] font-medium text-neutral-900">{title}</p>
        <p className="mt-1 truncate text-[10px] text-neutral-500">{value}</p>
      </div>
      <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400" />
    </div>
  );
}

function PreviewWireframe() {
  return (
    <div className="rounded-[16px] border border-black/10 bg-white p-3">
      <div className="h-[120px] rounded-[12px] border border-black/10 bg-[linear-gradient(180deg,#fbfbf7_0%,#f1f1ea_100%)] p-3">
        <div className="flex items-center justify-between">
          <div className="h-2.5 w-16 rounded-full bg-neutral-800" />
          <div className="flex gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
            <div className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
            <div className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-[1.2fr_0.8fr] gap-3">
          <div className="space-y-2">
            <div className="h-2 w-full rounded-full bg-neutral-300" />
            <div className="h-2 w-4/5 rounded-full bg-neutral-200" />
            <div className="mt-3 h-10 rounded-[10px] border border-black/10 bg-white" />
            <div className="h-6 w-2/3 rounded-full bg-[#DFFF00]" />
          </div>
          <div className="relative rounded-[12px] border border-dashed border-black/10 bg-white/70">
            <DecoCluster className="left-5 top-4 h-10 w-10 opacity-70" />
          </div>
        </div>
      </div>
    </div>
  );
}

function roleCopy(isCompany: boolean) {
  return isCompany
    ? {
        eyebrow: 'Navigating the unknown',
        title: 'Shipment intelligence',
        description: 'A compact oversight layer for shippers to spot disruption early and push action to transporters fast.',
        roleChip: 'Company view',
        actionTitle: 'Recommended move',
        actionBody: 'Approve a safer alternate route before the current lane accumulates delay.',
        listTitle: 'Active shipment cards',
        alertTitle: 'Transporter message',
      }
    : {
        eyebrow: 'Navigating the unknown',
        title: 'Transport intelligence',
        description: 'A compact operating layer for dispatchers and drivers to understand risk, action, and alert context in one scroll.',
        roleChip: 'Transport view',
        actionTitle: 'Recommended move',
        actionBody: 'Shift to the recommended route and acknowledge the alert before the disruption escalates.',
        listTitle: 'Active load cards',
        alertTitle: 'Driver message',
      };
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
  const copy = roleCopy(isCompany);
  const latestShipment = sorted[0] ?? null;
  const activeCount = sorted.length;
  const criticalCount = sorted.filter((shipment) => shipment.riskLevel === 'high').length;
  const aiCount = sorted.filter((shipment) => shipment.backend.explanation?.summary).length;
  const avgConfidence = activeCount
    ? Math.round(sorted.reduce((sum, shipment) => sum + (shipment.backend.decision.confidence || 0), 0) / activeCount)
    : 0;

  const topSignals = latestShipment?.backend.signalStack?.slice(0, 3) ?? [];
  const topTwoShipments = sorted.slice(0, 4);
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
    <div className="mx-auto w-full max-w-6xl pb-10">
      <div className="grid gap-6 xl:grid-cols-[390px_1fr] xl:items-start">
        <div className="mx-auto w-full max-w-[360px] xl:mx-0">
          <div className="space-y-3">
            <section className="relative overflow-hidden rounded-[24px] border border-black/10 bg-white px-4 pb-4 pt-5 shadow-[0_20px_60px_-36px_rgba(0,0,0,0.35)]">
              <DecoCluster className="right-4 top-5 h-12 w-12 opacity-80" />
              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="max-w-[190px]">
                  <TinyLabel>{copy.eyebrow}</TinyLabel>
                  <h1 className="mt-2 text-[25px] font-semibold leading-[1.02] tracking-tight text-neutral-950">
                    {copy.title}
                  </h1>
                </div>
                <div className="flex gap-1.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-black/10 bg-neutral-50">
                    <Globe2 className="h-3.5 w-3.5 text-neutral-700" />
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-black/10 bg-neutral-50">
                    <Sparkles className="h-3.5 w-3.5 text-neutral-700" />
                  </div>
                </div>
              </div>

              <p className="relative z-10 mt-3 max-w-[230px] text-[11px] leading-5 text-neutral-500">
                {copy.description}
              </p>

              <div className="relative z-10 mt-4 flex items-center gap-2">
                <Link
                  to="/add-shipment"
                  className="inline-flex items-center gap-1.5 rounded-full border border-black bg-black px-3 py-2 text-[9px] font-mono uppercase tracking-[0.18em] text-white"
                >
                  <Plus className="h-3 w-3" />
                  Add lane
                </Link>
                <span className="rounded-full border border-black/10 bg-neutral-50 px-3 py-2 text-[9px] font-mono uppercase tracking-[0.18em] text-neutral-500">
                  {copy.roleChip}
                </span>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3">
              <StatTile title="Active lanes" value={String(activeCount)} tone="white" icon={<Package className="h-3.5 w-3.5" />} />
              <StatTile title="Critical now" value={String(criticalCount)} tone="lime" icon={<AlertTriangle className="h-3.5 w-3.5" />} />
              <StatTile title="AI analyzed" value={String(aiCount)} tone="lime" icon={<Brain className="h-3.5 w-3.5" />} />
              <StatTile title="Confidence" value={`${avgConfidence}%`} tone="dark" icon={<ShieldCheck className="h-3.5 w-3.5" />} />
            </section>

            <section className="grid grid-cols-2 gap-3">
              <div className="rounded-[16px] border border-black bg-[#181a23] p-3 text-white">
                <TinyLabel dark>{copy.actionTitle}</TinyLabel>
                <p className="mt-4 text-[12px] font-medium leading-5 text-white">
                  {latestShipment?.backend.decision.recommendedAction || copy.actionBody}
                </p>
              </div>
              <div className="rounded-[16px] border border-[#b6d400] bg-[#DFFF00] p-3 text-black">
                <TinyLabel>Prediction</TinyLabel>
                <p className="mt-4 text-base font-semibold tracking-tight">
                  {latestShipment?.backend.predictionWindow?.label || 'Waiting'}
                </p>
                <p className="mt-1 text-[10px] leading-4 text-black/70">
                  {latestShipment
                    ? `${latestShipment.backend.predictionWindow.startHours}-${latestShipment.backend.predictionWindow.endHours}h watch`
                    : 'Run analysis'}
                </p>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3">
              <div className="rounded-[14px] border border-[#b6d400] bg-[#DFFF00] p-3">
                <TinyLabel>Status</TinyLabel>
                <p className="mt-4 text-[12px] font-semibold text-black">{latestShipment?.riskLevel || 'pending'}</p>
              </div>
              <div className="rounded-[14px] border border-black bg-[#181a23] p-3 text-white">
                <TinyLabel dark>Route</TinyLabel>
                <p className="mt-4 text-[12px] font-semibold">{latestShipment?.currentRoute || 'pending'}</p>
              </div>
            </section>

            <section className="rounded-[18px] border border-black bg-[#181a23] p-3 text-white">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-[12px] bg-white/5 px-2 py-2">
                  <TinyLabel dark>Signal</TinyLabel>
                  <p className="mt-2 text-[11px] font-semibold">{topSignals[0] ? `${Math.round(topSignals[0].severity * 100)}%` : '0%'}</p>
                </div>
                <div className="rounded-[12px] bg-white/5 px-2 py-2">
                  <TinyLabel dark>Mode</TinyLabel>
                  <p className="mt-2 text-[11px] font-semibold">{latestShipment?.backend.usedFallbackData ? 'Fallback' : 'Live'}</p>
                </div>
                <div className="rounded-[12px] bg-white/5 px-2 py-2">
                  <TinyLabel dark>ETA</TinyLabel>
                  <p className="mt-2 truncate text-[11px] font-semibold">{latestShipment?.eta || 'n/a'}</p>
                </div>
              </div>
            </section>

            <section className="rounded-[18px] border border-black/10 bg-white p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <TinyLabel>{copy.listTitle}</TinyLabel>
                  <h2 className="mt-1 text-[14px] font-semibold text-neutral-950">{copy.listTitle}</h2>
                </div>
                <span className="rounded-full border border-black/10 bg-neutral-50 px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.18em] text-neutral-500">
                  {shipmentsLoading ? 'syncing' : `${activeCount} lanes`}
                </span>
              </div>

              <div className="space-y-2.5">
                {shipmentsLoading ? (
                  <div className="rounded-[14px] border border-dashed border-black/10 bg-neutral-50 px-3 py-8 text-center text-xs text-neutral-500">
                    Syncing route intelligence...
                  </div>
                ) : topTwoShipments.length ? (
                  topTwoShipments.map((shipment) => (
                    <LaneChip
                      key={shipment.id}
                      shipment={shipment}
                      isCompany={isCompany}
                      refreshing={refreshingId === shipment.id}
                      onRefresh={() => handleRefresh(shipment.id)}
                    />
                  ))
                ) : (
                  <div className="rounded-[14px] border border-dashed border-black/10 bg-neutral-50 px-3 py-8 text-center text-xs text-neutral-500">
                    No lanes yet.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[18px] border border-[#b6d400] bg-[#DFFF00] p-3">
              <div className="flex items-center justify-between gap-2">
                <TinyLabel>{copy.alertTitle}</TinyLabel>
                <Truck className="h-4 w-4 text-black/70" />
              </div>
              <div className="mt-3 rounded-[14px] border border-black/10 bg-white/60 px-3 py-3 text-[12px] leading-5 text-black">
                {primaryTranslation}
              </div>
            </section>

            <section className="space-y-2.5 rounded-[18px] border border-black/10 bg-[#f7f7f3] p-3">
              <TinyLabel>Decision stack</TinyLabel>
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
            </section>

            <section className="rounded-[18px] border border-black bg-[#181a23] p-3 text-white">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <TinyLabel dark>AI summary</TinyLabel>
                  <h2 className="mt-1 text-[14px] font-semibold text-white">Reasoning snapshot</h2>
                </div>
                <Brain className="h-4 w-4 text-[#DFFF00]" />
              </div>
              <p className="rounded-[14px] bg-white/5 px-3 py-3 text-[12px] leading-5 text-white/80">
                {latestShipment?.backend.explanation?.summary || latestShipment?.backend.statusMessage || 'Create a lane to generate the first AI reasoning block.'}
              </p>
            </section>

            <section className="relative overflow-hidden rounded-[18px] border border-black/10 bg-white p-3">
              <DecoCluster className="right-5 top-5 h-10 w-10 opacity-70" />
              <div className="relative z-10">
                <TinyLabel>Preview</TinyLabel>
                <h2 className="mt-1 text-[14px] font-semibold text-neutral-950">Dashboard block mock</h2>
                <div className="mt-3">
                  <PreviewWireframe />
                </div>
              </div>
            </section>

            <section className="rounded-[18px] border border-black bg-[#181a23] p-3 text-white">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <TinyLabel dark>Ops console</TinyLabel>
                  <h2 className="mt-1 text-[14px] font-semibold text-white">Execution snapshot</h2>
                </div>
                <MapPinned className="h-4 w-4 text-white/70" />
              </div>
              <div className="space-y-2 font-mono text-[11px] text-white/75">
                <div className="flex items-center justify-between rounded-[12px] bg-white/5 px-3 py-2">
                  <span>confidence</span>
                  <span className="text-white">{latestShipment?.backend.decision.confidence ?? 0}%</span>
                </div>
                <div className="flex items-center justify-between rounded-[12px] bg-white/5 px-3 py-2">
                  <span>role</span>
                  <span className="text-white">{isCompany ? 'company' : 'transport'}</span>
                </div>
                <div className="flex items-center justify-between rounded-[12px] bg-white/5 px-3 py-2">
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

        <div className="hidden xl:grid xl:gap-6">
          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="max-w-xl">
                  <TinyLabel>Desktop adaptation</TinyLabel>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">The same mobile stack, expanded into a workspace.</h2>
                  <p className="mt-3 text-sm leading-6 text-neutral-500">
                    This side reuses the same mobile modules and lets them breathe on larger screens without breaking the original composition.
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-neutral-50">
                    <TrendingUp className="h-4 w-4 text-neutral-700" />
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-neutral-50">
                    <Zap className="h-4 w-4 text-neutral-700" />
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <div className="rounded-[20px] border border-black/10 bg-[#f7f7f3] p-4">
                  <TinyLabel>Primary action</TinyLabel>
                  <p className="mt-3 text-sm font-semibold text-neutral-950">
                    {latestShipment?.backend.decision.recommendedAction || copy.actionBody}
                  </p>
                </div>
                <div className="rounded-[20px] border border-[#b6d400] bg-[#DFFF00] p-4">
                  <TinyLabel>Window</TinyLabel>
                  <p className="mt-3 text-xl font-semibold text-black">
                    {latestShipment?.backend.predictionWindow?.label || 'Waiting'}
                  </p>
                </div>
                <div className="rounded-[20px] border border-black bg-[#181a23] p-4 text-white">
                  <TinyLabel dark>Live route</TinyLabel>
                  <p className="mt-3 text-sm font-semibold">{latestShipment?.currentRoute || 'pending'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-black bg-[#181a23] p-6 text-white shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <TinyLabel dark>Signal feed</TinyLabel>
                  <h2 className="mt-1 text-xl font-semibold text-white">Signals shaping the alert</h2>
                </div>
                <Zap className="h-4 w-4 text-[#DFFF00]" />
              </div>
              <div className="space-y-3">
                {topSignals.length ? (
                  topSignals.map((signal) => {
                    const SignalIcon = getSignalIcon(signal.name);
                    const severity = Math.round(signal.severity * 100);
                    return (
                      <div key={signal.name} className="rounded-[16px] border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                              <SignalIcon className="h-4 w-4 text-white" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-white">{signal.name}</p>
                              <p className="truncate text-[11px] text-white/60">{signal.summary}</p>
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
                  <div className="rounded-[16px] border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                    Signals will appear after the first live analysis.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <TinyLabel>{copy.alertTitle}</TinyLabel>
                  <h2 className="mt-1 text-xl font-semibold text-neutral-950">WhatsApp-ready copy</h2>
                </div>
                <Truck className="h-4 w-4 text-neutral-500" />
              </div>
              <div className="rounded-[18px] border border-[#b6d400] bg-[#DFFF00] px-4 py-4 text-sm leading-6 text-black">
                {primaryTranslation}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] border border-black/10 bg-[#f7f7f3] p-4">
                  <TinyLabel>Confidence</TinyLabel>
                  <p className="mt-2 text-2xl font-semibold text-neutral-950">{latestShipment?.backend.decision.confidence ?? 0}%</p>
                </div>
                <div className="rounded-[18px] border border-black/10 bg-[#f7f7f3] p-4">
                  <TinyLabel>Mode</TinyLabel>
                  <p className="mt-2 text-sm font-semibold text-neutral-950">
                    {latestShipment?.backend.architectureStatus?.deliveryModes?.[0] || 'dashboard_only'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <TinyLabel>Preview + console</TinyLabel>
                  <h2 className="mt-1 text-xl font-semibold text-neutral-950">Desktop expansion from the mobile base</h2>
                </div>
                <Brain className="h-4 w-4 text-neutral-500" />
              </div>
              <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <PreviewWireframe />
                <div className="rounded-[18px] border border-black bg-[#181a23] p-4 text-white">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <TinyLabel dark>Ops console</TinyLabel>
                      <h3 className="mt-1 text-base font-semibold text-white">Execution snapshot</h3>
                    </div>
                    <MapPinned className="h-4 w-4 text-white/70" />
                  </div>
                  <div className="space-y-2 font-mono text-[11px] text-white/75">
                    <div className="flex items-center justify-between rounded-[12px] bg-white/5 px-3 py-2">
                      <span>route</span>
                      <span className="text-white">{latestShipment?.currentRoute || 'pending'}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-[12px] bg-white/5 px-3 py-2">
                      <span>eta</span>
                      <span className="text-white">{latestShipment?.eta || 'n/a'}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-[12px] bg-white/5 px-3 py-2">
                      <span>fallback</span>
                      <span className="text-white">{latestShipment?.backend.usedFallbackData ? 'yes' : 'no'}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-[12px] bg-white/5 px-3 py-2">
                      <span>detail</span>
                      {latestShipment ? (
                        <Link to={`/shipment/${latestShipment.id}`} className="inline-flex items-center gap-1 text-[#DFFF00]">
                          open <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <span className="text-white">n/a</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
