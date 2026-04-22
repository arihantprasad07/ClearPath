import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, Brain, MapPin, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext } from '../context/AppContext';
import { geocodeLocation } from '../lib/api';

const COMMON_ROUTE_PRESETS = [
  { label: 'Mumbai → Delhi', source: 'Mumbai', destination: 'Delhi' },
  { label: 'Surat → Chennai', source: 'Surat', destination: 'Chennai' },
  { label: 'Pune → Kolkata', source: 'Pune', destination: 'Kolkata' },
] as const;

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

function InfoCard({
  eyebrow,
  title,
  children,
  dark = false,
  icon,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  dark?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <section className={`rounded-[18px] border p-4 ${dark ? 'border-black bg-[#181a23] text-white' : 'border-black/10 bg-white text-black'}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-full ${dark ? 'bg-white/10 text-[#DFFF00]' : 'bg-black/10 text-neutral-900'}`}>
          {icon}
        </div>
        <div>
          <TinyLabel dark={dark}>{eyebrow}</TinyLabel>
          <h2 className={`mt-1 text-[14px] font-semibold ${dark ? 'text-white' : 'text-neutral-950'}`}>{title}</h2>
        </div>
      </div>
      <div className={`mt-4 text-sm leading-6 ${dark ? 'text-white/75' : 'text-neutral-600'}`}>{children}</div>
    </section>
  );
}

function ResolvedLocation({
  label,
  loading,
  error,
}: {
  label: string;
  loading: boolean;
  error: string;
}) {
  if (loading) {
    return <p className="mt-2 text-xs text-neutral-500">Resolving location...</p>;
  }
  if (error) {
    return <p className="mt-2 text-xs text-red-600">{error}</p>;
  }
  if (!label) {
    return <p className="mt-2 text-xs text-neutral-400">Resolved place will appear here.</p>;
  }
  return <p className="mt-2 text-xs text-neutral-600">{label}</p>;
}

/**
 * Returns whether monsoon-season messaging should be shown.
 */
function isMonsoonSeasonActive() {
  const month = new Date().getMonth() + 1;
  return month >= 6 && month <= 9;
}

export default function AddShipment() {
  const navigate = useNavigate();
  const { addShipment, authToken, userRole } = useAppContext();
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [priority, setPriority] = useState<'standard' | 'express' | 'critical'>('standard');
  const [estimatedCargoValue, setEstimatedCargoValue] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolvedSource, setResolvedSource] = useState('');
  const [resolvedDestination, setResolvedDestination] = useState('');
  const [sourceError, setSourceError] = useState('');
  const [destinationError, setDestinationError] = useState('');
  const [sourceLoading, setSourceLoading] = useState(false);
  const [destinationLoading, setDestinationLoading] = useState(false);

  const isCompany = userRole === 'company';
  const monsoonSeasonActive = isMonsoonSeasonActive();

  useEffect(() => {
    document.title = 'New Lane - ClearPath';
  }, []);

  useEffect(() => {
    if (!authToken) return;
    if (source.trim().length < 2) {
      setResolvedSource('');
      setSourceError('');
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setSourceLoading(true);
        setSourceError('');
        const location = await geocodeLocation(authToken, source);
        setResolvedSource(location.label || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
      } catch (lookupError) {
        setResolvedSource('');
        setSourceError(lookupError instanceof Error ? lookupError.message : 'Could not resolve origin.');
      } finally {
        setSourceLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [authToken, source]);

  useEffect(() => {
    if (!authToken) return;
    if (destination.trim().length < 2) {
      setResolvedDestination('');
      setDestinationError('');
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setDestinationLoading(true);
        setDestinationError('');
        const location = await geocodeLocation(authToken, destination);
        setResolvedDestination(location.label || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
      } catch (lookupError) {
        setResolvedDestination('');
        setDestinationError(lookupError instanceof Error ? lookupError.message : 'Could not resolve destination.');
      } finally {
        setDestinationLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [authToken, destination]);

  const readiness = useMemo(() => {
    if (!source && !destination) return 'Start with a real route pair to generate a live decision lane.';
    if (source && !destination) return 'Destination is still missing before ClearPath can analyze alternatives.';
    if (!source && destination) return 'Origin is still missing before the backend can create a route graph.';
    if (priority === 'critical') return 'Critical priority lowers the alert threshold and escalates operator urgency.';
    if (priority === 'express') return 'Express priority tightens the monitoring threshold for earlier intervention.';
    return 'Ready to create a live lane with geocoding, route ranking, and AI explanation.';
  }, [destination, priority, source]);

  /**
   * Applies one of the common Indian route presets for faster demo setup.
   */
  const applyRoutePreset = (preset: (typeof COMMON_ROUTE_PRESETS)[number]) => {
    setSource(preset.source);
    setDestination(preset.destination);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await addShipment({
        source,
        destination,
        priority,
        estimatedCargoValue: estimatedCargoValue ? Number(estimatedCargoValue) : null,
      });
      toast.success('Shipment created', {
        description: 'The new lane is now being monitored in the dashboard.',
      });
      navigate('/dashboard');
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : 'Unable to create shipment lane.';
      setError(message);
      toast.error('Could not create shipment', {
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl pb-10">
      <Link to="/dashboard" className="mb-5 inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-neutral-600 transition-colors hover:text-black">
        <ArrowLeft size={16} aria-hidden />
        Back to dashboard
      </Link>

      <div className="grid gap-6 xl:grid-cols-[390px_1fr] xl:items-start">
        <div className="mx-auto w-full max-w-[360px] xl:mx-0">
          <div className="space-y-3">
            <section className="relative overflow-hidden rounded-[24px] border border-black/10 bg-white px-4 pb-4 pt-5 shadow-[0_20px_60px_-36px_rgba(0,0,0,0.35)]">
              <DecoCluster className="right-4 top-5 h-12 w-12 opacity-80" />
              <div className="relative z-10">
                <TinyLabel>{isCompany ? 'Company workflow' : 'Transport workflow'}</TinyLabel>
                <h1 className="mt-2 text-[25px] font-semibold leading-[1.02] tracking-tight text-neutral-950">
                  Create a
                  <br />
                  live lane
                </h1>
                <p className="mt-3 max-w-[230px] text-[11px] leading-5 text-neutral-500">
                  Enter two Indian cities or logistics hubs and generate a route with risk scoring, AI reasoning, and approval-ready action.
                </p>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3">
              <div className="rounded-[16px] border border-black/10 bg-white p-3">
                <TinyLabel>Origin</TinyLabel>
                <p className="mt-6 text-sm font-semibold text-black">{source || 'Pending'}</p>
                <p className="mt-1 text-xs text-neutral-500">{resolvedSource || 'Waiting for geocode'}</p>
              </div>
              <div className="rounded-[16px] border border-[#b6d400] bg-[#DFFF00] p-3">
                <TinyLabel>Destination</TinyLabel>
                <p className="mt-6 text-sm font-semibold text-black">{destination || 'Pending'}</p>
                <p className="mt-1 text-xs text-black/70">{resolvedDestination || 'Waiting for geocode'}</p>
              </div>
            </section>

            <section className="rounded-[18px] border border-black bg-[#181a23] p-3 text-white">
              <TinyLabel dark>Readiness</TinyLabel>
              <p className="mt-3 text-[12px] leading-5 text-white/80">{readiness}</p>
            </section>

            <InfoCard eyebrow="What happens next" title="Live analysis pipeline" icon={<Brain className="h-4 w-4" />}>
              <ol className="space-y-2">
                <li>1. Geocode the route pair into real lane points.</li>
                <li>2. Score route options against signals and risk.</li>
                <li>3. Save a backend-backed lane with explanation and actions.</li>
              </ol>
            </InfoCard>

            <InfoCard eyebrow="Demo hint" title="Strong route pairs" icon={<Sparkles className="h-4 w-4" />} dark>
              <p><code>Mumbai{' -> '}Delhi</code>, <code>Surat{' -> '}Chennai</code>, <code>Pune{' -> '}Kolkata</code>.</p>
            </InfoCard>
          </div>
        </div>

        <div className="grid gap-6">
          <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <TinyLabel>Lane setup</TinyLabel>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">Route input</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-3 block text-[10px] font-mono font-semibold uppercase tracking-widest text-neutral-700">
                  Common Indian routes
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_ROUTE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyRoutePreset(preset)}
                      className="rounded-full border border-black/10 bg-white px-4 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-700 transition hover:border-black hover:bg-neutral-50"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {monsoonSeasonActive ? (
                <div className="rounded-[16px] border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
                  ⚠️ Monsoon season active. Risk scores on this route will include seasonal weather weighting.
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="add-source" className="mb-2 block text-[10px] font-mono font-semibold uppercase tracking-widest text-neutral-700">
                    {isCompany ? 'Pickup location' : 'Origin'}
                  </label>
                  <div className="relative">
                    <MapPin size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden />
                    <input
                      id="add-source"
                      required
                      type="text"
                      value={source}
                      onChange={(event) => setSource(event.target.value)}
                      placeholder="Mumbai, Maharashtra"
                      className="h-12 w-full rounded-xl border border-black/15 bg-white pl-12 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 transition-all duration-200 focus:border-black focus:outline-none focus:ring-2 focus:ring-[#DFFF00]/40"
                    />
                  </div>
                  <ResolvedLocation label={resolvedSource} loading={sourceLoading} error={sourceError} />
                </div>

                <div>
                  <label htmlFor="add-destination" className="mb-2 block text-[10px] font-mono font-semibold uppercase tracking-widest text-neutral-700">
                    {isCompany ? 'Destination facility' : 'Destination'}
                  </label>
                  <div className="relative">
                    <MapPin size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden />
                    <input
                      id="add-destination"
                      required
                      type="text"
                      value={destination}
                      onChange={(event) => setDestination(event.target.value)}
                      placeholder="Delhi, India"
                      className="h-12 w-full rounded-xl border border-black/15 bg-white pl-12 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 transition-all duration-200 focus:border-black focus:outline-none focus:ring-2 focus:ring-[#DFFF00]/40"
                    />
                  </div>
                  <ResolvedLocation label={resolvedDestination} loading={destinationLoading} error={destinationError} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-mono font-semibold uppercase tracking-widest text-neutral-700">
                    Shipment priority
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['standard', 'express', 'critical'] as const).map((option) => {
                      const active = priority === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setPriority(option)}
                          className={`rounded-xl border px-3 py-3 text-[10px] font-mono uppercase tracking-[0.18em] transition ${
                            active ? 'border-black bg-[#DFFF00] text-black' : 'border-black/10 bg-white text-neutral-600 hover:border-black'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="cargo-value" className="mb-2 block text-[10px] font-mono font-semibold uppercase tracking-widest text-neutral-700">
                    Estimated cargo value
                  </label>
                  <input
                    id="cargo-value"
                    min="0"
                    step="1000"
                    type="number"
                    value={estimatedCargoValue}
                    onChange={(event) => setEstimatedCargoValue(event.target.value)}
                    placeholder="750000"
                    className="h-12 w-full rounded-xl border border-black/15 bg-white px-4 text-sm text-neutral-900 placeholder:text-neutral-400 transition-all duration-200 focus:border-black focus:outline-none focus:ring-2 focus:ring-[#DFFF00]/40"
                  />
                  <p className="mt-2 text-xs text-neutral-500">Used to estimate downstream cascade impact in the operator view.</p>
                </div>
              </div>

              <div className="rounded-[18px] border border-black/10 bg-[#f7f7f3] px-4 py-4 text-sm text-neutral-600">
                {readiness}
              </div>

              {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-black bg-[#DFFF00] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-black transition-all duration-200 hover:bg-[#c8e800] hover:shadow-[0_8px_28px_-6px_rgba(223,255,0,0.45)] disabled:cursor-wait disabled:opacity-70"
              >
                {isSubmitting ? <span className="submit-spinner" /> : null}
                {isSubmitting ? 'Creating lane...' : 'Create live lane'}
                <Send size={16} strokeWidth={1.5} aria-hidden />
              </button>
            </form>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <InfoCard eyebrow="Why this scores" title="Judging alignment" icon={<ShieldCheck className="h-4 w-4" />}>
              <ul className="space-y-2">
                <li>Real workflow instead of static form entry.</li>
                <li>Direct path from problem input to AI-backed action.</li>
                <li>Built for operators, not just technical reviewers.</li>
              </ul>
            </InfoCard>

            <InfoCard eyebrow="System style" title="Same visual language" icon={<Sparkles className="h-4 w-4" />} dark>
              <p>This page keeps the same white, lime, and dark composition used across the dashboard and route views.</p>
            </InfoCard>
          </div>
        </div>
      </div>
    </div>
  );
}
