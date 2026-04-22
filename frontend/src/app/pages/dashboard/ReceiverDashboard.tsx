import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Package,
  Route,
  ShieldAlert,
} from "lucide-react";
import RouteNetworkMap from "../../components/RouteNetworkMap";
import { LanguageSelect } from "../../components/LanguageSelect";
import { PoweredByGeminiBadge } from "../../components/PoweredByGeminiBadge";
import { useAppContext } from "../../context/AppContext";
import {
  buildDisplayShipment,
  cardTone,
  DashboardHeader,
  DateTimePill,
  getReceiverTimelineItems,
  sortShipments,
  statusTone,
} from "./dashboardShared";

export default function ReceiverDashboard() {
  const { authLoading, authUser, preferredLanguage, shipments, userRole } = useAppContext();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    document.title = "Track Delivery — ClearPath";
  }, []);

  useEffect(() => {
    if (!authLoading && !authUser) navigate("/");
  }, [authLoading, authUser, navigate]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const sorted = useMemo(() => sortShipments(shipments), [shipments]);
  const displayShipments = useMemo(() => sorted.map((shipment) => buildDisplayShipment(shipment, null)), [sorted]);
  const latestShipment = displayShipments[0] ?? null;
  const incomingShipments = displayShipments.length;
  const delayedDeliveries = displayShipments.filter((shipment) => shipment.displayRiskLevel === "high").length;
  const expectedToday = displayShipments.filter((shipment) => shipment.backend.delay.hours <= 24).length;
  const timelineItems = useMemo(() => getReceiverTimelineItems(displayShipments, preferredLanguage), [displayShipments, preferredLanguage]);

  if (authLoading || !authUser || !userRole) return null;

  return (
    <div className="space-y-6 text-white">
      <DashboardHeader
        username={authUser.username}
        title="Track your incoming deliveries with proactive updates."
        subtitle="Stay informed on arrival windows, route optimizations, and delay signals in your language."
        roleIndicator={
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-200">
            <Package className="h-3.5 w-3.5" />
            Receiver
          </span>
        }
        rightContent={
          <>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/18 bg-sky-400/10 px-4 py-2 text-sm text-sky-200">
              <Package className="h-4 w-4" />
              Receiver View
            </div>
            <DateTimePill value={now} />
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Incoming Shipments", value: String(incomingShipments), trend: "Visible right now", icon: Package, tone: "blue" as const },
          { label: "Delayed Deliveries", value: String(delayedDeliveries), trend: delayedDeliveries ? "Requires attention" : "No delays right now", icon: ShieldAlert, tone: "red" as const },
          { label: "Expected Today", value: String(expectedToday), trend: "Within the next 24 hours", icon: Route, tone: "purple" as const },
        ].map(({ label, value, trend, icon: Icon, tone }) => (
          <article key={label} className="green-glow-hover rounded-[28px] border border-white/8 bg-[#141414] p-5 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.72)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-white/46">{label}</p>
                <p className="mt-4 text-4xl font-semibold tracking-tight text-white">{value}</p>
                <p className="mt-2 text-sm text-white/56">{trend}</p>
              </div>
              <div className={`rounded-2xl border px-3 py-3 ${cardTone(tone)}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </article>
        ))}
      </section>

      <section id="map" className="rounded-[28px] border border-white/8 bg-[#141414] p-5 shadow-[0_22px_60px_-30px_rgba(0,0,0,0.72)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-white/46">Tracking map</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Tracking your incoming deliveries</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#AAFF45]/18 bg-[#AAFF45]/10 px-4 py-2 text-sm text-[#D9FF9B]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#AAFF45]/65" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#AAFF45]" />
            </span>
            Live
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[24px] border border-white/8">
          {latestShipment ? (
            <RouteNetworkMap shipment={latestShipment.backend} height={420} />
          ) : (
            <div className="grid min-h-[420px] place-items-center bg-[#0F0F0F] text-white/42">
              Your delivery map will appear here when shipments are available.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[28px] border border-white/8 bg-[#141414] p-5 shadow-[0_22px_60px_-30px_rgba(0,0,0,0.72)] sm:p-6">
          <div>
            <p className="text-sm text-white/46">Delivery Status Feed</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Your Incoming Deliveries</h2>
          </div>

          <div className="mt-5 space-y-3">
            {displayShipments.length ? (
              displayShipments.map((shipment) => (
                <div key={shipment.id} className="rounded-[24px] border border-white/8 bg-[#101010] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{shipment.id}</p>
                      <p className="mt-1 text-sm text-white/56">
                        {shipment.source} to {shipment.destination}
                      </p>
                    </div>
                    <span className={`rounded-full px-4 py-2 text-sm font-medium ${statusTone(shipment.displayStatusLabel)}`}>
                      {shipment.displayStatusLabel}
                    </span>
                  </div>

                  <p className="mt-4 text-base font-semibold text-white">Expected: {shipment.eta}</p>

                  {shipment.displayRiskLevel === "high" ? (
                    <div className="mt-4 rounded-[20px] border border-orange-400/25 bg-orange-400/10 px-4 py-4 text-sm text-orange-100">
                      ⚠ Slight delay possible. Our team is working on it.
                    </div>
                  ) : null}

                  {shipment.backend.activeRouteId !== shipment.backend.selectedRouteId ? (
                    <div className="mt-4 rounded-[20px] border border-[#AAFF45]/25 bg-[#AAFF45]/10 px-4 py-4 text-sm text-[#D9FF9B]">
                      ✓ Route optimized - delivery back on track
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-[#101010] p-6 text-center text-white/45">
                No incoming shipments tracked yet.
              </div>
            )}
          </div>
        </article>

        <article className="rounded-[28px] border border-white/8 bg-[#141414] p-5 shadow-[0_22px_60px_-30px_rgba(0,0,0,0.72)] sm:p-6">
          <div>
            <p className="text-sm text-white/46">Delivery Timeline</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Delivery Updates</h2>
          </div>

          <div className="mt-6 space-y-6">
            {timelineItems.length ? (
              timelineItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.id} className="relative pl-10">
                    {index !== timelineItems.length - 1 ? <span className="absolute left-[15px] top-8 h-[calc(100%+12px)] w-px bg-[#AAFF45]/45" /> : null}
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
                Delivery updates will appear here once your shipments are in motion.
              </div>
            )}
          </div>
        </article>
      </section>

      <section id="settings" className="rounded-[28px] border border-white/8 bg-[#111111] p-5 shadow-[0_22px_60px_-30px_rgba(0,0,0,0.72)] sm:p-6">
        <div>
          <p className="text-sm text-white/46">Delivery Preferences</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Notification settings</h2>
        </div>

        <div className="mt-5 max-w-[220px]">
          <LanguageSelect variant="header" id="receiver-language" />
        </div>

        <div className="mt-5 rounded-[24px] border border-white/8 bg-[#141414] p-5 text-sm leading-7 text-white/68">
          Get notified in your language when your delivery status changes.
        </div>
      </section>

      <PoweredByGeminiBadge />
    </div>
  );
}
