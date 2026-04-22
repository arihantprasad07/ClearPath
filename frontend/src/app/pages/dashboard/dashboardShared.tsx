import React from "react";
import {
  Clock3,
  Package,
  Route,
  Sparkles,
  TrendingUp,
  Truck,
} from "lucide-react";
import { ShipmentViewModel } from "../../lib/api";

export type DisplayShipment = ShipmentViewModel & {
  displayRiskScore: number;
  displayRiskLevel: ShipmentViewModel["riskLevel"];
  displayStatusLabel: string;
};

export type DashboardTimelineItem = {
  id: string;
  timestamp: string;
  description: string;
  detail: string;
  icon: typeof Sparkles;
};

export function getSimulationTarget(shipments: ShipmentViewModel[]) {
  return shipments[0] ?? null;
}

export function buildDisplayShipment(
  shipment: ShipmentViewModel,
  simulatedShipmentId: string | null,
): DisplayShipment {
  const isSimulated = shipment.id === simulatedShipmentId;
  const displayRiskScore = isSimulated ? 85 : shipment.backend.risk.score;
  const displayRiskLevel = isSimulated ? "high" : shipment.riskLevel;
  const displayStatusLabel = isSimulated
    ? "HIGH RISK"
    : shipment.riskLevel === "high"
      ? "DELAYED"
      : shipment.riskLevel === "medium"
        ? "AT RISK"
        : shipment.backend.status === "stable"
          ? "DELIVERED"
          : "IN TRANSIT";

  return {
    ...shipment,
    riskLevel: displayRiskLevel,
    backend: {
      ...shipment.backend,
      risk: {
        ...shipment.backend.risk,
        score: displayRiskScore,
        level: displayRiskLevel === "high" ? "high" : shipment.backend.risk.level,
      },
      statusMessage: isSimulated
        ? "Storm on NH-44 detected. Shipment flagged HIGH RISK 18 hours ahead."
        : shipment.backend.statusMessage,
      activeAlert: isSimulated
        ? {
            message: "Storm on NH-44 detected. Shipment flagged HIGH RISK 18 hours ahead.",
            severity: "high",
            timestamp: new Date().toISOString(),
          }
        : shipment.backend.activeAlert,
    },
    displayRiskScore,
    displayRiskLevel,
    displayStatusLabel,
  };
}

export function sortShipments(shipments: ShipmentViewModel[]) {
  const order = { high: 0, medium: 1, low: 2 } as Record<string, number>;
  return [...shipments].sort((a, b) => (order[a.riskLevel] ?? 3) - (order[b.riskLevel] ?? 3));
}

export function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function cardTone(type: "blue" | "orange" | "green" | "purple" | "red") {
  return {
    blue: "text-sky-300 bg-sky-400/10 border-sky-400/18",
    orange: "text-orange-300 bg-orange-400/10 border-orange-400/18",
    green: "text-[#AAFF45] bg-[#AAFF45]/10 border-[#AAFF45]/18",
    purple: "text-violet-300 bg-violet-400/10 border-violet-400/18",
    red: "text-red-200 bg-red-500/10 border-red-500/18",
  }[type];
}

export function severityTone(value: string) {
  if (value === "high") return "border-red-500/25 bg-red-500/12 text-red-200";
  if (value === "medium") return "border-orange-500/25 bg-orange-500/12 text-orange-200";
  return "border-yellow-500/25 bg-yellow-500/12 text-yellow-200";
}

export function statusTone(label: string) {
  if (label === "DELIVERED") return "bg-[#AAFF45]/12 text-[#D9FF9B]";
  if (label === "DELAYED") return "bg-red-500/12 text-red-200";
  if (label === "AT RISK") return "bg-orange-500/12 text-orange-200";
  return "bg-sky-500/12 text-sky-200";
}

export function getOnTimeRate(shipments: DisplayShipment[]) {
  return shipments.length
    ? Math.max(72, 100 - Math.round(shipments.reduce((sum, shipment) => sum + shipment.displayRiskScore, 0) / shipments.length / 2))
    : 100;
}

export function getTimelineItems(shipments: DisplayShipment[], preferredLanguage: string): DashboardTimelineItem[] {
  return shipments.slice(0, 4).map((shipment, index) => ({
    id: shipment.id,
    timestamp: formatDateTime(new Date(shipment.backend.updatedAt || Date.now())),
    description:
      shipment.backend.alert?.translations?.[preferredLanguage] ||
      shipment.backend.alert?.translations?.en ||
      shipment.backend.statusMessage,
    detail: shipment.backend.explanation?.recommendation || shipment.backend.decision.recommendedAction,
    icon: index % 2 === 0 ? Sparkles : Route,
  }));
}

export function getReceiverTimelineItems(shipments: DisplayShipment[], preferredLanguage: string): DashboardTimelineItem[] {
  return shipments.slice(0, 4).map((shipment, index) => ({
    id: shipment.id,
    timestamp: formatDateTime(new Date(shipment.backend.updatedAt || Date.now())),
    description:
      shipment.backend.alert?.translations?.[preferredLanguage] ||
      shipment.backend.alert?.translations?.en ||
      `Your shipment from ${shipment.source} is being monitored for delivery changes.`,
    detail:
      shipment.backend.activeRouteId !== shipment.backend.selectedRouteId
        ? `Your shipment from ${shipment.source} has been re-routed to arrive on time.`
        : `Expected in ${shipment.eta}. We will notify you if anything changes.`,
    icon: index % 2 === 0 ? Package : Truck,
  }));
}

export function DashboardHeader({
  username,
  title,
  subtitle,
  rightContent,
  roleIndicator,
}: {
  username: string;
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
  roleIndicator?: React.ReactNode;
}) {
  return (
    <section className="green-glow-hover rounded-[28px] border border-white/8 bg-[#111111] p-5 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.72)] sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-white/48">
              Good morning, <span className="font-semibold text-white">{username}</span>
            </p>
            {roleIndicator}
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-white/56">{subtitle}</p> : null}
        </div>
        {rightContent ? <div className="flex flex-wrap items-center gap-3">{rightContent}</div> : null}
      </div>
    </section>
  );
}

export function LiveMonitoringPill() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#AAFF45]/18 bg-[#AAFF45]/10 px-4 py-2 text-sm text-[#D9FF9B]">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#AAFF45]/65" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#AAFF45]" />
      </span>
      AI Monitoring Active
    </div>
  );
}

export function DateTimePill({ value }: { value: Date }) {
  return <div className="rounded-2xl border border-white/10 bg-[#161616] px-4 py-3 text-sm text-white/68">{formatDateTime(value)}</div>;
}

export function LanguagesPill() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#101010] px-4 py-2 text-sm text-white/66">
      <Clock3 className="h-4 w-4 text-[#AAFF45]" />
      22 languages
    </div>
  );
}

export function TimelineFeed({
  heading,
  items,
}: {
  heading: string;
  items: DashboardTimelineItem[];
}) {
  return (
    <article id="timeline" className="rounded-[28px] border border-white/8 bg-[#141414] p-5 shadow-[0_22px_60px_-30px_rgba(0,0,0,0.72)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-white/46">Activity timeline</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{heading}</h2>
        </div>
        <LanguagesPill />
      </div>

      <div className="mt-6 space-y-6">
        {items.length ? (
          items.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="relative pl-10">
                {index !== items.length - 1 ? (
                  <span className="absolute left-[15px] top-8 h-[calc(100%+12px)] w-px bg-[#AAFF45]/45" />
                ) : null}
                <span className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full border border-[#AAFF45]/20 bg-[#AAFF45]/10 text-[#AAFF45]">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="text-xs uppercase tracking-[0.2em] text-white/38">{item.timestamp}</p>
                <p className="mt-2 text-sm leading-7 text-white/72">{item.description}</p>
                <p className="mt-2 text-sm font-medium text-[#D9FF9B]">{item.detail}</p>
              </div>
            );
          })
        ) : (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-[#101010] p-6 text-center text-white/45">
            Activity will start appearing as soon as a shipment is analyzed.
          </div>
        )}
      </div>
    </article>
  );
}
