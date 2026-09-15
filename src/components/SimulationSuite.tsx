import React, { useState } from 'react';
import { WeatherTelemetry } from '../types';
import { Sliders, RefreshCw, Zap, Wind, CloudRain, AlertTriangle, CheckCircle2, Database, WifiOff } from 'lucide-react';

interface SimulationSuiteProps {
  telemetry: WeatherTelemetry | null;
  onSimulate: (type: 'calm' | 'gale' | 'cyclone') => void;
  onLiveRefresh: () => void;
  onSimulateOffline?: () => void;
  onCustomTelemetryUpdate: (custom: Partial<WeatherTelemetry>) => void;
}

export const SimulationSuite: React.FC<SimulationSuiteProps> = ({
  telemetry,
  onSimulate,
  onLiveRefresh,
  onSimulateOffline,
  onCustomTelemetryUpdate
}) => {
  const [showCustomSliders, setShowCustomSliders] = useState(false);
  const isOfflineActive = Boolean(telemetry?.isOfflineOrCached || telemetry?.dataSource === 'cached');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Disaster Simulation Suite & Guardrail Audit
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Judge Evaluation Mode
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Instantly test zero-hallucination deterministic thresholds and live vs offline cached states
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCustomSliders(!showCustomSliders)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg transition"
        >
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>{showCustomSliders ? 'Hide Sliders' : 'Custom Telemetry Tuning'}</span>
        </button>
      </div>

      {/* Preset Simulation Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        
        {/* Simulate Calm */}
        <button
          onClick={() => onSimulate('calm')}
          className={`flex flex-col text-left p-2.5 rounded-xl border transition group relative overflow-hidden ${
            telemetry?.isSimulated && telemetry?.simulationType === 'calm'
              ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md shadow-emerald-900/20'
              : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Simulate Calm
            </span>
            <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded">
              8 km/h • 5%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Radar Normal • Clear Skies. All fieldwork permitted.
          </p>
        </button>

        {/* Simulate Gale */}
        <button
          onClick={() => onSimulate('gale')}
          className={`flex flex-col text-left p-2.5 rounded-xl border transition group relative overflow-hidden ${
            telemetry?.isSimulated && telemetry?.simulationType === 'gale'
              ? 'bg-amber-950/40 border-amber-500/50 shadow-md shadow-amber-900/20'
              : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
              <Wind className="w-3.5 h-3.5" />
              Simulate Gale
            </span>
            <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded">
              24 km/h • 20%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Radar Moderate • Spray Moratorium Triggered.
          </p>
        </button>

        {/* Simulate Cyclone */}
        <button
          onClick={() => onSimulate('cyclone')}
          className={`flex flex-col text-left p-2.5 rounded-xl border transition group relative overflow-hidden ${
            telemetry?.isSimulated && telemetry?.simulationType === 'cyclone'
              ? 'bg-rose-950/40 border-rose-500/50 shadow-md shadow-rose-900/20'
              : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Simulate Cyclone
            </span>
            <span className="text-[10px] font-mono bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded">
              65 km/h • 95%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Radar Severe Squall • Immediate Red Alert.
          </p>
        </button>

        {/* Test Offline / Cached Fallback */}
        {onSimulateOffline && (
          <button
            onClick={onSimulateOffline}
            className={`flex flex-col text-left p-2.5 rounded-xl border transition group relative overflow-hidden ${
              isOfflineActive
                ? 'bg-amber-950/50 border-amber-500/60 shadow-md shadow-amber-900/20'
                : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-amber-400" />
                Offline Cache
              </span>
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded">
                Cached
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Test Offline/Cached Data mode in Header.
            </p>
          </button>
        )}

        {/* Live IMD Grid */}
        <button
          onClick={onLiveRefresh}
          className={`flex flex-col text-left p-2.5 rounded-xl border transition group relative overflow-hidden ${
            !telemetry?.isSimulated && !isOfflineActive
              ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md shadow-emerald-900/20'
              : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" />
              Live Telemetry
            </span>
            <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded">
              Live API
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Query Open-Meteo & IMD radar coordinates.
          </p>
        </button>

      </div>

      {/* Custom Telemetry Tuner Drawer */}
      {showCustomSliders && telemetry && (
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/60 p-4 rounded-xl">
          
          {/* Wind Speed */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">Wind Speed</span>
              <span className={`font-mono font-bold ${telemetry.windSpeed > 15 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {telemetry.windSpeed} km/h {telemetry.windSpeed > 15 ? '(>15 limit)' : ''}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="1"
              value={telemetry.windSpeed}
              onChange={(e) => onCustomTelemetryUpdate({ windSpeed: Number(e.target.value), isSimulated: true })}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>0 (Calm)</span>
              <span className="text-amber-400">15 (Moratorium)</span>
              <span className="text-rose-400">50 (Squall)</span>
            </div>
          </div>

          {/* Rain Probability */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">Rain Chance (3h)</span>
              <span className={`font-mono font-bold ${telemetry.rainProbability3h > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {telemetry.rainProbability3h}% {telemetry.rainProbability3h > 30 ? '(>30% stop)' : ''}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={telemetry.rainProbability3h}
              onChange={(e) => onCustomTelemetryUpdate({ rainProbability3h: Number(e.target.value), isSimulated: true })}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>0%</span>
              <span className="text-amber-400">30% (Spray Moratorium)</span>
              <span className="text-rose-400">70% (Harvest)</span>
            </div>
          </div>

          {/* Projected Rain mm */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">Projected Precip (24h)</span>
              <span className={`font-mono font-bold ${telemetry.projectedPrecipitation > 30 ? 'text-rose-400' : 'text-blue-400'}`}>
                {telemetry.projectedPrecipitation} mm
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              step="2"
              value={telemetry.projectedPrecipitation}
              onChange={(e) => onCustomTelemetryUpdate({ projectedPrecipitation: Number(e.target.value), isSimulated: true })}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>0 mm</span>
              <span className="text-rose-400">30 mm (Drainage Moratorium)</span>
              <span>120 mm</span>
            </div>
          </div>

          {/* Convective Radar Index */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">Convective Radar</span>
              <span className="font-mono font-bold text-xs uppercase text-slate-200">
                {telemetry.convectiveRadar}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(['normal', 'moderate', 'severe'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => onCustomTelemetryUpdate({ convectiveRadar: lvl, isSimulated: true })}
                  className={`px-1.5 py-1 text-xs rounded uppercase font-bold transition ${
                    telemetry.convectiveRadar === lvl
                      ? lvl === 'severe'
                        ? 'bg-rose-600 text-white'
                        : lvl === 'moderate'
                        ? 'bg-amber-600 text-white'
                        : 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
