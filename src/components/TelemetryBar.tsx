import React from 'react';
import { WeatherTelemetry } from '../types';
import { Wind, CloudRain, Droplets, Thermometer, Radio, AlertOctagon, CheckCircle2, AlertTriangle } from 'lucide-react';

interface TelemetryBarProps {
  telemetry: WeatherTelemetry | null;
  loading: boolean;
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({ telemetry, loading }) => {
  if (loading || !telemetry) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-800/60 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const {
    windSpeed,
    windGust,
    rainProbability3h,
    projectedPrecipitation,
    temperature,
    humidity,
    convectiveRadar,
    timestamp,
    locationName,
    source
  } = telemetry;

  const isWindCritical = windSpeed > 15.0;
  const isSquallCritical = windSpeed > 50.0 || convectiveRadar === 'severe';
  const isRainSprayMoratorium = rainProbability3h > 30;
  const isDrainageMoratorium = projectedPrecipitation > 30 || rainProbability3h > 50;
  const isOffline = Boolean(telemetry.isOfflineOrCached || telemetry.dataSource === 'cached');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-sm">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-800/80 gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isOffline ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'}`} />
          <span className="text-xs font-semibold text-slate-300">
            Ground-Truth Agricultural Telemetry: <strong className="text-white">{locationName}</strong>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">({telemetry.latitude.toFixed(4)}°N, {telemetry.longitude.toFixed(4)}°E)</span>
        </div>
        <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
          <span>{isOffline ? 'Cached Record:' : 'Synced:'} {timestamp}</span>
          <span>•</span>
          <span className={`${isOffline ? 'text-amber-400' : 'text-emerald-400'} font-medium`}>{source}</span>
        </div>
      </div>

      {/* 6 Core Meteorological Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Wind Speed & Gusts */}
        <div className={`p-3 rounded-xl border transition ${
          isSquallCritical
            ? 'bg-rose-950/40 border-rose-500/60'
            : isWindCritical
            ? 'bg-amber-950/30 border-amber-500/40'
            : 'bg-slate-800/50 border-slate-700/60'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1 font-medium">
              <Wind className="w-3.5 h-3.5 text-sky-400" />
              Wind Speed
            </span>
            {isWindCritical && (
              <span className="text-[10px] text-amber-400 font-bold px-1 rounded bg-amber-500/20">
                &gt;15 km/h
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-xl font-black font-mono ${
              isSquallCritical ? 'text-rose-400' : isWindCritical ? 'text-amber-400' : 'text-white'
            }`}>
              {windSpeed}
            </span>
            <span className="text-xs text-slate-400">km/h</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
            Gusts: <strong className="text-slate-200">{windGust} km/h</strong>
          </p>
        </div>

        {/* Rain Probability (Next 3h) */}
        <div className={`p-3 rounded-xl border transition ${
          isRainSprayMoratorium
            ? 'bg-amber-950/30 border-amber-500/40'
            : 'bg-slate-800/50 border-slate-700/60'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1 font-medium">
              <CloudRain className="w-3.5 h-3.5 text-blue-400" />
              Rain Chance (3h)
            </span>
            {isRainSprayMoratorium && (
              <span className="text-[10px] text-amber-400 font-bold px-1 rounded bg-amber-500/20">
                &gt;30%
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-xl font-black font-mono ${
              rainProbability3h > 70 ? 'text-rose-400' : isRainSprayMoratorium ? 'text-amber-400' : 'text-white'
            }`}>
              {rainProbability3h}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {rainProbability3h > 70 ? 'Reaping window' : isRainSprayMoratorium ? 'No spraying' : 'Safe to spray'}
          </p>
        </div>

        {/* Projected Precipitation */}
        <div className={`p-3 rounded-xl border transition ${
          isDrainageMoratorium
            ? 'bg-rose-950/30 border-rose-500/40'
            : 'bg-slate-800/50 border-slate-700/60'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1 font-medium">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              Projected Precip
            </span>
            {projectedPrecipitation > 30 && (
              <span className="text-[10px] text-rose-400 font-bold px-1 rounded bg-rose-500/20">
                &gt;30 mm
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-xl font-black font-mono ${
              projectedPrecipitation > 30 ? 'text-rose-400' : 'text-white'
            }`}>
              {projectedPrecipitation}
            </span>
            <span className="text-xs text-slate-400">mm (24h)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {projectedPrecipitation > 30 ? 'Trenches alert' : 'Nominal soil moisture'}
          </p>
        </div>

        {/* Convective Radar Index */}
        <div className={`p-3 rounded-xl border transition ${
          convectiveRadar === 'severe'
            ? 'bg-rose-950/40 border-rose-500/60'
            : convectiveRadar === 'moderate'
            ? 'bg-amber-950/30 border-amber-500/40'
            : 'bg-slate-800/50 border-slate-700/60'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1 font-medium">
              <Radio className="w-3.5 h-3.5 text-indigo-400" />
              Radar Convective
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            {convectiveRadar === 'severe' ? (
              <AlertOctagon className="w-5 h-5 text-rose-400 flex-shrink-0" />
            ) : convectiveRadar === 'moderate' ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            )}
            <span className={`text-sm font-black uppercase font-mono ${
              convectiveRadar === 'severe'
                ? 'text-rose-400'
                : convectiveRadar === 'moderate'
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}>
              {convectiveRadar}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {convectiveRadar === 'severe' ? 'Squall Red Alert' : convectiveRadar === 'moderate' ? 'Active Rain Front' : 'Normal Doppler'}
          </p>
        </div>

        {/* Temperature */}
        <div className="p-3 rounded-xl border bg-slate-800/50 border-slate-700/60">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1 font-medium">
              <Thermometer className="w-3.5 h-3.5 text-orange-400" />
              Ambient Temp
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black font-mono text-white">
              {temperature}
            </span>
            <span className="text-xs text-slate-400">°C</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Field canopy thermal
          </p>
        </div>

        {/* Humidity */}
        <div className="p-3 rounded-xl border bg-slate-800/50 border-slate-700/60">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1 font-medium">
              <Droplets className="w-3.5 h-3.5 text-teal-400" />
              Rel Humidity
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black font-mono text-white">
              {humidity}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Foliar evaporation index
          </p>
        </div>

      </div>
    </div>
  );
};
