import { useRef, useState, type MouseEvent } from 'react';
import { Check, Compass, ExternalLink, Loader2, MapPin, Navigation } from 'lucide-react';

interface LocationPinMapProps {
  location: string;
  landmark: string;
  latitude: number | null;
  longitude: number | null;
  confirmed: boolean;
  onChange: (patch: {
    location?: string;
    landmark?: string;
    latitude?: number | null;
    longitude?: number | null;
    confirmed?: boolean;
  }) => void;
}

// Default center around Hyderabad (matches demo dataset) when GPS hasn't run yet
const DEFAULT_LAT = 17.4486;
const DEFAULT_LNG = 78.3908;

export function LocationPinMap({
  location,
  landmark,
  latitude,
  longitude,
  confirmed,
  onChange,
}: LocationPinMapProps) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [pinOffset, setPinOffset] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const padRef = useRef<HTMLDivElement | null>(null);

  const activeLat = latitude ?? DEFAULT_LAT;
  const activeLng = longitude ?? DEFAULT_LNG;

  const handleCaptureGps = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported in this browser. Please enter your area manually.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        setPinOffset({ x: 50, y: 50 });
        onChange({
          latitude: lat,
          longitude: lng,
          location: location.trim() || `GPS Pin (${lat}, ${lng})`,
          confirmed: false,
        });
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError(
            'Location permission was denied. That is completely fine — please type your locality or tap on the map pin pad below.'
          );
        } else if (err.code === err.TIMEOUT) {
          setGpsError('Location request timed out. Please enter your locality manually.');
        } else {
          setGpsError('Could not determine GPS location. Please enter your locality manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const handlePadClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!padRef.current) return;
    const rect = padRef.current.getBoundingClientRect();
    const xPct = Math.max(6, Math.min(94, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(6, Math.min(94, ((e.clientY - rect.top) / rect.height) * 100));
    setPinOffset({ x: xPct, y: yPct });

    // Adjust coordinates slightly around active center (~ +/- 0.015 deg)
    const baseLat = latitude ?? DEFAULT_LAT;
    const baseLng = longitude ?? DEFAULT_LNG;
    const newLat = Number((baseLat + ((50 - yPct) / 50) * 0.012).toFixed(5));
    const newLng = Number((baseLng + ((xPct - 50) / 50) * 0.012).toFixed(5));

    onChange({
      latitude: newLat,
      longitude: newLng,
      confirmed: false,
    });
  };

  const osmUrl = `https://www.openstreetmap.org/?mlat=${activeLat}&mlon=${activeLng}#map=16/${activeLat}/${activeLng}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleCaptureGps}
          disabled={gpsLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3F7375] text-white font-semibold text-sm hover:bg-[#325D5F] active:scale-[0.99] transition disabled:opacity-60 cursor-pointer"
        >
          {gpsLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          {gpsLoading ? 'Detecting GPS...' : 'Use my current GPS'}
        </button>

        {latitude !== null && longitude !== null && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3F7375] bg-[#E9F1F1] px-3 py-1.5 rounded-full">
            <Compass className="w-3.5 h-3.5" />
            {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </span>
        )}
      </div>

      {gpsError && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-sm text-amber-900">
          {gpsError}
        </div>
      )}

      {/* Manual location fields */}
      <div className="grid grid-cols-1 gap-3">
        <label className="block">
          <span className="block text-sm font-semibold text-[#1E2525] mb-1.5">
            Locality, colony, or street address <span className="text-rose-600">*</span>
          </span>
          <input
            type="text"
            value={location}
            onChange={(e) => onChange({ location: e.target.value, confirmed: false })}
            placeholder="e.g., Kukatpally Main Road, near bus stop"
            className="w-full rounded-xl border border-[#DDD8CE] bg-white px-4 py-3 text-base text-[#1E2525] placeholder:text-[#8B9494] focus:outline-none focus:ring-2 focus:ring-[#3F7375]/40 focus:border-[#3F7375]"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-[#5B6666] mb-1.5">
            Nearby landmark (optional)
          </span>
          <input
            type="text"
            value={landmark}
            onChange={(e) => onChange({ landmark: e.target.value, confirmed: false })}
            placeholder="e.g., Opposite Metro Pillar 14, beside Sri Sai Medicals"
            className="w-full rounded-xl border border-[#DDD8CE] bg-white px-4 py-2.5 text-base text-[#1E2525] placeholder:text-[#8B9494] focus:outline-none focus:ring-2 focus:ring-[#3F7375]/40 focus:border-[#3F7375]"
          />
        </label>
      </div>

      {/* Interactive Pin Map Pad */}
      <div className="rounded-2xl border border-[#E6E2D9] bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#F8F6F1] border-b border-[#E6E2D9]">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#5B6666]">
            Tap anywhere on map to adjust pin
          </span>
          <a
            href={osmUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#3F7375] hover:underline"
          >
            OpenStreetMap <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div
          ref={padRef}
          onClick={handlePadClick}
          role="button"
          tabIndex={0}
          aria-label="Interactive location pin selector. Click to position pin."
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onChange({ latitude: activeLat, longitude: activeLng, confirmed: false });
            }
          }}
          className="relative h-48 w-full cursor-crosshair select-none overflow-hidden bg-[#EEF3F0]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(63,115,117,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(63,115,117,0.08) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        >
          {/* Decorative arterial road paths so map looks familiar even offline */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none opacity-45"
            viewBox="0 0 400 200"
            preserveAspectRatio="none"
          >
            <path d="M0,120 Q140,85 260,110 T400,70" fill="none" stroke="#FFFFFF" strokeWidth="10" />
            <path d="M90,0 Q135,100 120,200" fill="none" stroke="#FFFFFF" strokeWidth="7" />
            <path d="M270,0 Q250,115 295,200" fill="none" stroke="#FFFFFF" strokeWidth="6" />
          </svg>

          {/* Pin marker */}
          <div
            className="absolute -translate-x-1/2 -translate-y-full transition-all duration-150 pointer-events-none flex flex-col items-center"
            style={{ left: `${pinOffset.x}%`, top: `${pinOffset.y}%` }}
          >
            <div className="bg-[#3F7375] text-white p-2 rounded-full shadow-lg ring-4 ring-white">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="w-2.5 h-1 rounded-full bg-black/25 mt-0.5" />
          </div>

          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between pointer-events-none">
            <span className="bg-white/95 backdrop-blur px-2.5 py-1 rounded-lg text-xs font-medium text-[#1E2525] shadow-sm border border-[#E6E2D9]">
              {location.trim() || 'Tap to drop pin or type address above'}
            </span>
            <span className="bg-white/95 backdrop-blur px-2 py-1 rounded-lg text-[11px] text-[#5B6666] border border-[#E6E2D9]">
              {activeLat.toFixed(4)}, {activeLng.toFixed(4)}
            </span>
          </div>
        </div>
      </div>

      {/* Explicit Location Confirmation */}
      <button
        type="button"
        onClick={() => onChange({ confirmed: !confirmed })}
        disabled={!location.trim()}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition cursor-pointer disabled:opacity-50 ${
          confirmed
            ? 'bg-[#E9F1F1] border-[#3F7375] text-[#1E2525]'
            : 'bg-white border-[#DDD8CE] text-[#1E2525] hover:border-[#3F7375]/60'
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center border ${
              confirmed
                ? 'bg-[#3F7375] border-[#3F7375] text-white'
                : 'border-[#B9B3A7] bg-white'
            }`}
          >
            {confirmed && <Check className="w-4 h-4" />}
          </span>
          <div>
            <p className="text-sm font-semibold">
              {confirmed ? 'Location confirmed' : 'Confirm this location is accurate'}
            </p>
            <p className="text-xs text-[#5B6666]">
              {location.trim()
                ? `${location}${landmark ? ` · ${landmark}` : ''}`
                : 'Enter a locality or tap GPS first'}
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}
