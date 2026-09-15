export type Language = 'en' | 'hi' | 'gu';

export type ConvectiveRadarIndex = 'normal' | 'moderate' | 'severe';

export interface WeatherTelemetry {
  windSpeed: number; // km/h
  windGust: number; // km/h
  rainProbability3h: number; // %
  projectedPrecipitation: number; // mm (next 24h)
  temperature: number; // °C
  humidity: number; // %
  convectiveRadar: ConvectiveRadarIndex;
  timestamp: string;
  locationName: string;
  latitude: number;
  longitude: number;
  isSimulated?: boolean;
  simulationType?: 'calm' | 'gale' | 'cyclone' | 'custom';
  source?: string;
  isOfflineOrCached?: boolean;
  dataSource?: 'live' | 'cached' | 'simulated';
  apiStatus?: 'online' | 'offline' | 'cached';
  apiLatencyMs?: number;
}

export type DisasterPhase = 'Before Disaster' | 'During Disaster' | 'After Disaster' | 'Standard Advisory';

export type DecisionVerdict = '✅ SAFE FOR FIELD ACTION' | '⚠️ HAZARD MORATORIUM ENFORCED';

export type ActionCategory = 'spraying' | 'harvesting' | 'drainage' | 'squall_red_alert' | 'insurance' | 'general';

export interface GuardrailDecision {
  verdict: DecisionVerdict;
  phase: DisasterPhase;
  executiveGuidance: string;
  telemetryProof: string;
  speechPayload: string;
  triggeredRules: string[];
  actionCategory: ActionCategory;
  rawMetrics: {
    windSpeed: number;
    rainProb: number;
    rainMm: number;
    windGust: number;
    radar: string;
    temp: number;
  };
}

export interface PhotoChecklistItem {
  id: number;
  labelEn: string;
  labelHi: string;
  labelGu: string;
  captured: boolean;
  timestamp?: string;
  dataUrl?: string;
}

export interface InsuranceDossier {
  claimId: string;
  farmerName: string;
  farmerMobile: string;
  cropName: string;
  damageType: 'inundation' | 'cyclone_lodging' | 'hail';
  gpsCoordinates: string;
  districtName: string;
  telemetrySnapshot: WeatherTelemetry;
  filingTimestamp: string;
  deadlineHours: number; // 72 hours protocol
  photos: PhotoChecklistItem[];
  hashSignature: string;
  status: 'pre_registered' | 'verified_telemetry' | 'ready_for_survey';
}

export interface ToolCallRecord {
  id: string;
  toolName: 'get_live_weather_telemetry' | 'file_crop_insurance_dossier';
  parameters: Record<string, any>;
  timestamp: string;
  output: Record<string, any>;
  executionTimeMs: number;
}
