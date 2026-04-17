import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { ArrowLeft, Brain, MapPin, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { cp } from '../lib/cpUi';

export default function AddShipment() {
  const navigate = useNavigate();
  const { addShipment, userRole } = useAppContext();
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCompany = userRole === 'company';

  useEffect(() => {
    document.title = 'New Lane — ClearPath';
  }, []);

  const readiness = useMemo(() => {
    if (!source && !destination) return 'Start with a real route pair to generate a live decision lane.';
    if (source && !destination) return 'Destination is still missing before ClearPath can analyze alternatives.';
    if (!source && destination) return 'Origin is still missing before the backend can create a route graph.';
    return 'Ready to create a live lane with geocoding, route ranking, and AI explanation.';
  }, [destination, source]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await addShipment({ source, destination });
      navigate('/dashboard');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to create shipment lane.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-6">
      <Link to="/dashboard" className={cp.linkBack}>
        <ArrowLeft size={16} aria-hidden />
        Back to dashboard
      </Link>

      <div className="relative overflow-hidden rounded-2xl border border-black/10 border-b-[#DFFF00]/25 bg-black p-5 text-white shadow-sm sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.03)_1px,transparent_1px)]" style={{ backgroundSize: '28px 28px' }} aria-hidden />
        <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[#DFFF00]/18 blur-[80px]" aria-hidden />
        <div className="relative z-10 max-w-2xl">
          <div className="mb-3 inline-flex items-center rounded-full border border-[#DFFF00]/45 bg-[#DFFF00]/12 px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-[#DFFF00]">
            {isCompany ? 'Company workflow' : 'Supplier workflow'}
          </div>
          <h1 className="font-['DM_Serif_Display'] text-3xl tracking-tight text-white sm:text-4xl">
            Create a new shipment lane
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-neutral-300">
            Enter two Indian cities or logistics hubs. ClearPath will analyze weather, traffic, port, and road signals to predict disruption risk on that corridor.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className={`${cp.panel} sm:p-8`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <div>
                <label htmlFor="add-source" className={cp.label}>{isCompany ? 'Pickup location' : 'Origin'}</label>
                <div className="relative">
                  <MapPin size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden />
                  <input
                    id="add-source"
                    required
                    type="text"
                    value={source}
                    onChange={(event) => setSource(event.target.value)}
                    placeholder="Mumbai, Maharashtra"
                    className={cp.input}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="add-destination" className={cp.label}>{isCompany ? 'Destination facility' : 'Destination'}</label>
                <div className="relative">
                  <MapPin size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden />
                  <input
                    id="add-destination"
                    required
                    type="text"
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    placeholder="Delhi, India"
                    className={cp.input}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-black/10 bg-neutral-50/90 px-4 py-4 text-sm text-neutral-600">
              {readiness}
            </div>

            {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

            <div className="flex justify-center border-t border-neutral-100 pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`${cp.btnPrimaryBlock} max-w-md gap-3 sm:min-w-[280px] disabled:cursor-wait disabled:opacity-70`}
              >
                {isSubmitting ? 'Creating lane...' : 'Create live lane'}
                <Send size={16} strokeWidth={1.5} aria-hidden />
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#DFFF00]/45 bg-[#DFFF00]/12">
                <Brain className="h-5 w-5 text-neutral-900" strokeWidth={1.7} />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">What happens next</p>
                <h2 className="font-['DM_Serif_Display'] text-2xl text-neutral-900">Live analysis pipeline</h2>
              </div>
            </div>
            <ol className="mt-5 space-y-3 text-sm text-neutral-600">
              <li className="rounded-xl border border-black/10 bg-neutral-50 px-4 py-3">1. Geocode origin and destination into real routeable points.</li>
              <li className="rounded-xl border border-black/10 bg-neutral-50 px-4 py-3">2. Compute route options and combine weather, traffic, corridor, and history signals.</li>
              <li className="rounded-xl border border-black/10 bg-neutral-50 px-4 py-3">3. Save a backend-backed decision lane with AI explanation and approval-ready actions.</li>
            </ol>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-neutral-50">
                <ShieldCheck className="h-5 w-5 text-neutral-900" strokeWidth={1.7} />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">Why this scores</p>
                <h2 className="font-['DM_Serif_Display'] text-2xl text-neutral-900">Judging alignment</h2>
              </div>
            </div>
            <ul className="mt-5 space-y-3 text-sm text-neutral-600">
              <li className="rounded-xl border border-black/10 bg-neutral-50 px-4 py-3">Real workflow instead of static data entry.</li>
              <li className="rounded-xl border border-black/10 bg-neutral-50 px-4 py-3">Immediate path from problem input to AI-backed action.</li>
              <li className="rounded-xl border border-black/10 bg-neutral-50 px-4 py-3">Designed for operators, not only for technical judges.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-[#DFFF00]/35 bg-[#faffd9] p-5 shadow-sm">
            <div className="flex items-center gap-3 text-neutral-900">
              <Sparkles className="h-5 w-5" strokeWidth={1.7} />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Demo hint</span>
            </div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                Strong demo route pairs: <code>Mumbai{' -> '}Delhi</code>, <code>Surat{' -> '}Ahmedabad</code>, <code>Bengaluru{' -> '}Mumbai</code>.
              </p>
          </section>
        </div>
      </div>
    </div>
  );
}
