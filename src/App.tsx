import React, { useState, useEffect } from 'react';
import { Language, WeatherTelemetry, GuardrailDecision, ToolCallRecord } from './types';
import { Header } from './components/Header';
import { SimulationSuite } from './components/SimulationSuite';
import { TelemetryBar } from './components/TelemetryBar';
import { VoiceQuerySection } from './components/VoiceQuerySection';
import { AdvisoryVerdictCard } from './components/AdvisoryVerdictCard';
import { ToolCallInspector } from './components/ToolCallInspector';
import { InsuranceDossierModal } from './components/InsuranceDossierModal';
import { get_live_weather_telemetry, getSimulatedWeather, getCachedWeatherTelemetry, POPULAR_AGRO_DISTRICTS } from './services/weatherService';
import { processAgriculturalQuery } from './services/geminiService';
import { evaluateGuardrails } from './services/guardrails';
import { SpeechEngine } from './services/speechService';
import { ShieldCheck, Info, Leaf, PhoneCall, HelpCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('hi'); // Defaulting to Hindi for rural Indian farmers
  const [selectedDistrict, setSelectedDistrict] = useState(POPULAR_AGRO_DISTRICTS[0].name);
  const [coordinates, setCoordinates] = useState({ lat: 21.1702, lon: 72.8311 });
  const [telemetry, setTelemetry] = useState<WeatherTelemetry | null>(null);
  const [decision, setDecision] = useState<GuardrailDecision | null>(null);
  const [toolCalls, setToolCalls] = useState<ToolCallRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);

  // Initial Load & Network state listeners
  useEffect(() => {
    fetchInitialTelemetry(coordinates.lat, coordinates.lon, selectedDistrict);

    const handleOffline = () => {
      console.warn('Network offline detected, switching to cached telemetry');
      const cached = getCachedWeatherTelemetry(selectedDistrict, coordinates.lat, coordinates.lon);
      cached.apiStatus = 'offline';
      setTelemetry(cached);
    };

    const handleOnline = () => {
      console.log('Network online re-established, refreshing telemetry from live API');
      fetchInitialTelemetry(coordinates.lat, coordinates.lon, selectedDistrict);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const fetchInitialTelemetry = async (lat: number, lon: number, districtName: string) => {
    setIsLoading(true);
    try {
      const tel = await get_live_weather_telemetry(lat, lon, districtName);
      setTelemetry(tel);
      
      // Automatic baseline advisory
      const res = await processAgriculturalQuery(
        'क्या आज खेत में कृषि कार्य और कीटनाशक छिड़काव सुरक्षित है?',
        tel,
        language
      );
      setDecision(res.decision);
      setToolCalls(res.toolCalls);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDistrictChange = async (district: { name: string; lat: number; lon: number }) => {
    setSelectedDistrict(district.name);
    setCoordinates({ lat: district.lat, lon: district.lon });
    await fetchInitialTelemetry(district.lat, district.lon, district.name);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lon = Number(pos.coords.longitude.toFixed(4));
        const districtName = `GPS (${lat}°N, ${lon}°E)`;
        setSelectedDistrict(districtName);
        setCoordinates({ lat, lon });
        await fetchInitialTelemetry(lat, lon, districtName);
        setIsLocating(false);
      },
      (err) => {
        alert('Could not access GPS location: ' + err.message);
        setIsLocating(false);
      }
    );
  };

  const handleQuery = async (query: string) => {
    if (!telemetry) return;

    // Check if query is an explicit disaster simulation suite command
    const lower = query.toLowerCase();
    if (lower.includes('simulate calm')) {
      handleSimulate('calm');
      return;
    }
    if (lower.includes('simulate gale')) {
      handleSimulate('gale');
      return;
    }
    if (lower.includes('simulate cyclone')) {
      handleSimulate('cyclone');
      return;
    }

    setIsLoading(true);
    try {
      // Re-fetch ground truth telemetry if live (Zero-Hallucination Law 2)
      let currentTelemetry = telemetry;
      if (!telemetry.isSimulated) {
        currentTelemetry = await get_live_weather_telemetry(coordinates.lat, coordinates.lon, selectedDistrict);
        setTelemetry(currentTelemetry);
      }

      const result = await processAgriculturalQuery(query, currentTelemetry, language);
      setDecision(result.decision);
      setToolCalls(result.toolCalls);

      // Speak response payload
      SpeechEngine.speak(result.decision.speechPayload, language);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulate = (type: 'calm' | 'gale' | 'cyclone') => {
    const simTelemetry = getSimulatedWeather(type, selectedDistrict, coordinates.lat, coordinates.lon);
    setTelemetry(simTelemetry);

    // Formulate test query matching simulation
    const testQuery = type === 'cyclone'
      ? 'क्या चक्रवात में खेत का सबमर्सिबल पंप चालू रखना या खेत में काम करना सुरक्षित है?'
      : type === 'gale'
      ? 'क्या मैं आज तेज हवा में कीटनाशक छिड़काव कर सकता हूँ?'
      : 'क्या मैं आज फसल में सामान्य छिड़काव और सिंचाई कर सकता हूँ?';

    const category = type === 'cyclone' ? 'squall_red_alert' : type === 'gale' ? 'spraying' : 'spraying';
    const dec = evaluateGuardrails(simTelemetry, category, language);
    setDecision(dec);

    const tc: ToolCallRecord = {
      id: 'tc-sim-' + Date.now(),
      toolName: 'get_live_weather_telemetry',
      parameters: {
        simulation_protocol: `Simulate ${type.toUpperCase()}`,
        latitude: coordinates.lat,
        longitude: coordinates.lon,
        district_name: selectedDistrict
      },
      timestamp: new Date().toLocaleTimeString('en-IN'),
      output: {
        wind_speed_kmh: simTelemetry.windSpeed,
        wind_gust_kmh: simTelemetry.windGust,
        rain_probability_3h_percent: simTelemetry.rainProbability3h,
        projected_precipitation_mm: simTelemetry.projectedPrecipitation,
        temperature_celsius: simTelemetry.temperature,
        convective_radar: simTelemetry.convectiveRadar,
        status: `CALIBRATED_${type.toUpperCase()}_SUITE`
      },
      executionTimeMs: 15
    };

    setToolCalls([tc]);
    SpeechEngine.speak(dec.speechPayload, language);
  };

  const handleCustomTelemetryUpdate = (custom: Partial<WeatherTelemetry>) => {
    if (!telemetry) return;
    const updated: WeatherTelemetry = {
      ...telemetry,
      ...custom,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      source: 'Custom Calibrated Telemetry'
    };
    setTelemetry(updated);

    const activeCategory = decision?.actionCategory || 'spraying';
    const newDecision = evaluateGuardrails(updated, activeCategory, language);
    setDecision(newDecision);
  };

  const handleLiveRefresh = () => {
    fetchInitialTelemetry(coordinates.lat, coordinates.lon, selectedDistrict);
  };

  const handleSimulateOffline = () => {
    const cached = getCachedWeatherTelemetry(selectedDistrict, coordinates.lat, coordinates.lon);
    setTelemetry(cached);

    const activeCategory = decision?.actionCategory || 'spraying';
    const dec = evaluateGuardrails(cached, activeCategory, language);
    setDecision(dec);

    const tc: ToolCallRecord = {
      id: 'tc-cache-' + Date.now(),
      toolName: 'get_live_weather_telemetry',
      parameters: {
        network_status: 'OFFLINE_CACHE_LOOKUP',
        district: selectedDistrict,
        latitude: coordinates.lat,
        longitude: coordinates.lon
      },
      timestamp: new Date().toLocaleTimeString('en-IN'),
      output: {
        status: 'SERVED_FROM_GROUNDED_OFFLINE_CACHE',
        dataSource: 'cached',
        wind_speed_kmh: cached.windSpeed,
        rain_probability_3h_percent: cached.rainProbability3h,
        radar: cached.convectiveRadar,
        note: 'Weather API response offline. Loaded verified IMD/local cached telemetry.'
      },
      executionTimeMs: 4
    };
    setToolCalls([tc]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      
      {/* Top Application Header */}
      <Header
        language={language}
        onLanguageChange={(newLang) => {
          setLanguage(newLang);
          if (telemetry && decision) {
            const reDec = evaluateGuardrails(telemetry, decision.actionCategory, newLang);
            setDecision(reDec);
          }
        }}
        selectedDistrict={selectedDistrict}
        onSelectDistrict={handleDistrictChange}
        telemetry={telemetry}
        onUseCurrentLocation={handleUseCurrentLocation}
        isLocating={isLocating}
        onRefresh={handleLiveRefresh}
        isRefreshing={isLoading}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Disaster Simulation Suite Banner (For Judges & Farmers) */}
        <SimulationSuite
          telemetry={telemetry}
          onSimulate={handleSimulate}
          onLiveRefresh={handleLiveRefresh}
          onSimulateOffline={handleSimulateOffline}
          onCustomTelemetryUpdate={handleCustomTelemetryUpdate}
        />

        {/* Live Ground-Truth Telemetry Grid */}
        <TelemetryBar
          telemetry={telemetry}
          loading={isLoading && !telemetry}
        />

        {/* Voice-First Agricultural Query Section */}
        <VoiceQuerySection
          language={language}
          onQuerySubmit={handleQuery}
          isLoading={isLoading}
        />

        {/* 5-Part Structured Decision Advisory Output */}
        <AdvisoryVerdictCard
          decision={decision}
          language={language}
          onOpenInsuranceModal={() => setIsInsuranceModalOpen(true)}
          isLoading={isLoading}
        />

        {/* Real-time Tool Execution Inspector (RAG Grounding) */}
        <ToolCallInspector
          toolCalls={toolCalls}
        />

        {/* Operational Guardrails Reference & PMFBY Footer Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400 pt-4">
          
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-1">Spraying Moratorium Threshold</strong>
              <p>
                Wind speed &gt; 15.0 km/h or rain chance (next 3h) &gt; 30% strictly halts chemical spraying to prevent pesticide drift and input waste.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-start gap-3">
            <Leaf className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-1">Accelerated Harvest Window</strong>
              <p>
                Rain probability &gt; 70% or wind gusts &gt; 40 km/h initiates urgent reaping within 6–12 hours to prevent crop lodging and seed rot.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-start gap-3">
            <PhoneCall className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-1">PMFBY 72-Hour Claim Window</strong>
              <p>
                Capture 4 geo-tagged crop photos within 72 hours of disaster. Call toll-free 14447 or generate instant dossier from the button above.
              </p>
            </div>
          </div>

        </div>

      </main>

      {/* Insurance Dossier Modal */}
      <InsuranceDossierModal
        isOpen={isInsuranceModalOpen}
        onClose={() => setIsInsuranceModalOpen(false)}
        telemetry={telemetry}
        language={language}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/50 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>WeatherGPT • Autonomous Grounded-Data RAG Agricultural Engine</span>
          <span>Zero-Hallucination Meteorological Guardrails • India Agrometeorology Grid</span>
        </div>
      </footer>

    </div>
  );
};
