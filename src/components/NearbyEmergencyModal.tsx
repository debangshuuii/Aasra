import React, { useState, useEffect } from 'react';
import { 
  getUserCoordinates, 
  fetchNearbyEmergencyCenters, 
  EmergencyCenter, 
  UserCoordinates 
} from '../services/locationService';
import { 
  X, 
  MapPin, 
  Phone, 
  Navigation, 
  AlertTriangle, 
  Loader2, 
  Building2, 
  Activity, 
  ShieldAlert,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface NearbyEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NearbyEmergencyModal: React.FC<NearbyEmergencyModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [coords, setCoords] = useState<UserCoordinates | null>(null);
  const [centers, setCenters] = useState<EmergencyCenter[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'hospital' | 'psychiatric'>('all');

  const locateAndFetch = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const userCoords = await getUserCoordinates();
      setCoords(userCoords);
      const results = await fetchNearbyEmergencyCenters(
        userCoords.latitude,
        userCoords.longitude,
        25
      );
      setCenters(results);
    } catch (err: any) {
      console.warn('[NearbyEmergencyModal] Error getting location:', err);
      setErrorMessage(
        err?.message || 'Could not retrieve your location. Showing major national emergency centers.'
      );
      // Fallback with central India coordinates (Delhi: 28.6139, 77.2090)
      const fallbackResults = await fetchNearbyEmergencyCenters(28.6139, 77.209, 50);
      setCenters(fallbackResults);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && centers.length === 0) {
      locateAndFetch();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredCenters = centers.filter((c) => {
    if (filter === 'hospital') return c.type === 'hospital';
    if (filter === 'psychiatric') return c.type === 'psychiatric';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl p-5 sm:p-7 shadow-2xl border border-gray-200 relative max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200 shrink-0 shadow-xs">
              <MapPin className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-950 font-display flex items-center gap-2">
                <span>Emergency Centers Near You</span>
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-extrabold uppercase tracking-wide">
                  24/7 Triage
                </span>
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Immediate medical and psychiatric emergency care based on your device GPS.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Immediate National Hotline Notice */}
        <div className="my-3 p-3 rounded-2xl bg-red-50/80 border border-red-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-red-900">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <span>Immediate crisis? Call India Emergency or Tele-MANAS:</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="tel:112"
              className="px-2.5 py-1 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-2xs cursor-pointer flex items-center gap-1"
            >
              <Phone className="w-3 h-3" />
              <span>112</span>
            </a>
            <a
              href="tel:14416"
              className="px-2.5 py-1 rounded-lg bg-white border border-red-300 text-red-800 hover:bg-red-50 text-xs font-bold shadow-2xs cursor-pointer flex items-center gap-1"
            >
              <Phone className="w-3 h-3" />
              <span>14416</span>
            </a>
          </div>
        </div>

        {/* Status / Location Bar */}
        <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            {isLoading ? (
              <span className="flex items-center gap-1.5 text-teal-700 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Querying nearby hospital databases...
              </span>
            ) : coords ? (
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Detected GPS ({coords.latitude.toFixed(3)}, {coords.longitude.toFixed(3)})
              </span>
            ) : (
              <span className="text-gray-500 text-[11px]">Regional Emergency Directory</span>
            )}
          </div>

          <button
            onClick={locateAndFetch}
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-teal-700 hover:bg-teal-50 border border-teal-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh GPS</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mb-3 shrink-0">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Centers ({centers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('hospital')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === 'hospital'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Trauma &amp; General Hospitals
          </button>
          <button
            type="button"
            onClick={() => setFilter('psychiatric')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === 'psychiatric'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Psychiatric &amp; Mental Health
          </button>
        </div>

        {/* Centers List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-3" />
              <p className="text-sm font-semibold text-gray-800">Pinpointing Nearest Medical Facilities...</p>
              <p className="text-xs text-gray-500 mt-1">Cross-referencing open emergency rooms within 25 km.</p>
            </div>
          ) : filteredCenters.length === 0 ? (
            <div className="py-10 text-center text-gray-500 text-xs">
              No centers found matching this filter.
            </div>
          ) : (
            filteredCenters.map((center) => (
              <div
                key={center.id}
                className="p-4 rounded-2xl border border-gray-200/90 hover:border-teal-300 hover:shadow-xs transition-all bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        center.type === 'psychiatric'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {center.type === 'psychiatric' ? (
                        <Activity className="w-3 h-3" />
                      ) : (
                        <Building2 className="w-3 h-3" />
                      )}
                      <span>
                        {center.type === 'psychiatric'
                          ? 'Psychiatric Hospital'
                          : 'General & Trauma'}
                      </span>
                    </span>

                    {center.emergency24x7 && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        24/7 OPEN
                      </span>
                    )}

                    <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                      📍 {center.distanceKm} km away
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-teal-900 transition-colors">
                    {center.name}
                  </h3>

                  {center.address && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {center.address}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  {center.callUrl && (
                    <a
                      href={center.callUrl}
                      className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-teal-200 shadow-2xs"
                    >
                      <Phone className="w-3.5 h-3.5 text-teal-700" />
                      <span>Call</span>
                    </a>
                  )}

                  <a
                    href={center.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Navigate</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
