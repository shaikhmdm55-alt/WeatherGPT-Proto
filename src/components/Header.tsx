import React from 'react';
import { Language, WeatherTelemetry } from '../types';
import { POPULAR_AGRO_DISTRICTS } from '../services/weatherService';
import { ShieldCheck, MapPin, Languages, Locate, Wifi, WifiOff, RefreshCw, Smartphone } from 'lucide-react';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  selectedDistrict: string;
  onSelectDistrict: (district: { name: string; lat: number; lon: number }) => void;
  telemetry: WeatherTelemetry | null;
  onUseCurrentLocation: () => void;
  isLocating: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  selectedDistrict,
  onSelectDistrict,
  telemetry,
  onUseCurrentLocation,
  isLocating,
  onRefresh,
  isRefreshing = false
}) => {
  // Determine if response is from offline/cached storage or live API
  const isOfflineOrCached = Boolean(
    telemetry?.isOfflineOrCached ||
    telemetry?.dataSource === 'cached' ||
    telemetry?.apiStatus === 'cached' ||
    telemetry?.apiStatus === 'offline'
  );

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Brand & Badge */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold">
              <span className="text-xl">🌾</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-1.5">
                  WeatherGPT
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/30">
                    Autonomous Agro Engine
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" />
                Grounded RAG • Deterministic Safety Guardrails • Voice-First
              </p>
            </div>
          </div>

          {/* District selector, GPS, Visual Connectivity Indicator, and Language */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            
            {/* District Dropdown */}
            <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 mr-1.5 flex-shrink-0" />
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  const found = POPULAR_AGRO_DISTRICTS.find(d => d.name === e.target.value);
                  if (found) {
                    onSelectDistrict(found);
                  }
                }}
                className="bg-transparent border-none text-white focus:outline-none cursor-pointer pr-2 text-xs font-medium"
              >
                {POPULAR_AGRO_DISTRICTS.map((d) => (
                  <option key={d.name} value={d.name} className="bg-slate-900 text-white">
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* GPS Locate Button */}
            <button
              onClick={onUseCurrentLocation}
              disabled={isLocating}
              title="Use Device GPS"
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white transition disabled:opacity-50"
            >
              <Locate className={`w-3.5 h-3.5 text-emerald-400 ${isLocating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">GPS</span>
            </button>

            {/* Visual Connectivity Indicator: Displays 'Live Data' vs 'Offline/Cached Data' */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-300 shadow-sm select-none ${
                isOfflineOrCached
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 shadow-amber-950/30'
                  : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-emerald-950/30'
              }`}
              title={
                isOfflineOrCached
                  ? `Weather API: Offline or Cached fallback active (${telemetry?.source || 'Local Cache'}). Click refresh to re-attempt live sync.`
                  : `Weather API: 200 OK • Connected to Live Open-Meteo & Doppler Radar Grid${
                      telemetry?.apiLatencyMs ? ` (${telemetry.apiLatencyMs}ms)` : ''
                    }`
              }
            >
              {/* Dynamic Beacon Status Dot */}
              <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                {!isOfflineOrCached ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                  </>
                ) : (
                  <>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
                  </>
                )}
              </span>

              {/* Status Icon */}
              {isOfflineOrCached ? (
                <WifiOff className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              ) : (
                <Wifi className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              )}

              {/* Status Label (Exact text required) */}
              <span className="font-bold tracking-tight">
                {isOfflineOrCached ? 'Offline/Cached Data' : 'Live Data'}
              </span>

              {/* Optional Quick Re-sync Trigger */}
              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  title="Re-sync telemetry with live Weather API"
                  aria-label="Refresh weather data"
                  className={`ml-0.5 p-0.5 rounded hover:bg-slate-800 transition text-slate-400 hover:text-white ${
                    isRefreshing ? 'animate-spin text-emerald-400' : ''
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Direct Native Android APK Download */}
            <a
              href="./weathergpt.apk"
              download="weathergpt.apk"
              title="Download Native Android APK (Install directly on Android)"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition shadow-sm"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Download</span> APK
            </a>

            {/* Indic Language Switcher */}
            <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded-lg p-1 text-xs">
              <Languages className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
              <button
                onClick={() => onLanguageChange('en')}
                className={`px-2 py-1 rounded font-medium transition ${
                  language === 'en'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                onClick={() => onLanguageChange('hi')}
                className={`px-2 py-1 rounded font-medium transition ${
                  language === 'hi'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => onLanguageChange('gu')}
                className={`px-2 py-1 rounded font-medium transition ${
                  language === 'gu'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ગુજરાતી
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
