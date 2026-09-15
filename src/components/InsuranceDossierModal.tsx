import React, { useState } from 'react';
import { InsuranceDossier, WeatherTelemetry, Language } from '../types';
import { file_crop_insurance_dossier, getSavedDossiers } from '../services/insuranceService';
import { X, Shield, Camera, Clock, CheckCircle2, PhoneCall, Printer, Check, MapPin, AlertCircle, FileCheck } from 'lucide-react';

interface InsuranceDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: WeatherTelemetry | null;
  language: Language;
}

export const InsuranceDossierModal: React.FC<InsuranceDossierModalProps> = ({
  isOpen,
  onClose,
  telemetry,
  language
}) => {
  const [farmerName, setFarmerName] = useState('Ramesh Patel');
  const [farmerMobile, setFarmerMobile] = useState('9876543210');
  const [cropName, setCropName] = useState('Cotton (कपास / કપાસ)');
  const [damageType, setDamageType] = useState<'inundation' | 'cyclone_lodging' | 'hail'>('cyclone_lodging');
  const [currentDossier, setCurrentDossier] = useState<InsuranceDossier | null>(null);
  const [savedDossiers, setSavedDossiers] = useState<InsuranceDossier[]>(getSavedDossiers());
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [photoState, setPhotoState] = useState<{ [key: number]: boolean }>({ 1: true, 2: true, 3: false, 4: false });

  if (!isOpen) return null;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!telemetry) return;

    const dossier = file_crop_insurance_dossier(
      farmerName,
      cropName,
      damageType,
      `${telemetry.latitude.toFixed(4)}° N, ${telemetry.longitude.toFixed(4)}° E`,
      telemetry.locationName,
      telemetry,
      farmerMobile
    );

    // Update photo state in generated dossier
    dossier.photos.forEach(p => {
      p.captured = photoState[p.id] ?? false;
    });

    setCurrentDossier(dossier);
    setSavedDossiers(getSavedDossiers());
  };

  const togglePhoto = (id: number) => {
    setPhotoState(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                PM Fasal Bima Yojana (PMFBY)
                <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                  Tool 2: file_crop_insurance_dossier
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official Post-Disaster 72-Hour Crop Loss Pre-Registration Protocol
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-5 pt-2 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('new')}
            className={`pb-2.5 transition border-b-2 ${
              activeTab === 'new'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            File New Claim Dossier
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 transition border-b-2 ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Registered Claims ({savedDossiers.length})
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          
          {activeTab === 'new' ? (
            <>
              {/* 72-Hour Rule Notice Banner */}
              <div className="bg-amber-950/40 border border-amber-500/50 p-4 rounded-2xl flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <h4 className="font-bold text-amber-300">
                    Mandatory 72-Hour Claim Window Protocol
                  </h4>
                  <p className="text-slate-300 mt-1">
                    Under Indian PM Fasal Bima guidelines, localized crop damage from inundation, hail, or cyclone lodging must be reported within <strong>72 hours</strong> with <strong>4 geo-tagged photographs</strong>.
                  </p>
                </div>
              </div>

              {/* Form to initiate claim */}
              <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Farmer Name (किसान का नाम)
                  </label>
                  <input
                    type="text"
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                    required
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Registered Mobile No. (मोबाइल नंबर)
                  </label>
                  <input
                    type="tel"
                    value={farmerMobile}
                    onChange={(e) => setFarmerMobile(e.target.value)}
                    required
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Affected Crop (फसल का प्रकार)
                  </label>
                  <select
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Cotton (कपास / કપાસ)">Cotton (कपास / કપાસ)</option>
                    <option value="Wheat (गेहूं / ઘઉં)">Wheat (गेहूं / ઘઉં)</option>
                    <option value="Paddy (धान / ડાંગર)">Paddy (धान / ડાંગર)</option>
                    <option value="Groundnut (मूंगफली / મગફળી)">Groundnut (मूंगफली / મગફળી)</option>
                    <option value="Soybean (सोयाबीन)">Soybean (सोयाबीन)</option>
                    <option value="Mustard (सरसों / રાઈ)">Mustard (सरसों / રાઈ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Damage Hazard Type (नुकसान का कारण)
                  </label>
                  <select
                    value={damageType}
                    onChange={(e) => setDamageType(e.target.value as any)}
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="cyclone_lodging">Cyclone Lodging (आंधी/तूफान से गिरना)</option>
                    <option value="inundation">Inundation (जलभराव/बाढ़)</option>
                    <option value="hail">Hailstorm (ओलावृष्टि)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    4 Mandatory Geo-Tagged Photographic Evidence Check (4 आवश्यक जीपीएस फोटो)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { id: 1, label: '1. Wide panoramic field photo (जलभराव व खेत की सीमा)' },
                      { id: 2, label: '2. Root rot / stem fracture close-up (जड़ सड़ांध/टूटा तना)' },
                      { id: 3, label: '3. Fallen grain earhead / boll (गिरे दाने/कपास डोडा)' },
                      { id: 4, label: '4. Survey marker / 7/12 Passbook (खसरा/भू-अभिलेख)' }
                    ].map((item) => (
                      <div
                        key={item.id}
                        onClick={() => togglePhoto(item.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                          photoState[item.id]
                            ? 'bg-emerald-950/30 border-emerald-500/60 text-emerald-300'
                            : 'bg-slate-800/40 border-slate-700 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4" />
                          <span className="text-xs font-medium">{item.label}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          photoState[item.id]
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-700 text-slate-400'
                        }`}>
                          {photoState[item.id] ? 'Attached' : 'Tap to Attach'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2 pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-lg shadow-blue-900/30 transition flex items-center justify-center gap-2"
                  >
                    <FileCheck className="w-5 h-5" />
                    <span>Execute file_crop_insurance_dossier & Generate Claim</span>
                  </button>
                </div>
              </form>

              {/* Generated Dossier Preview */}
              {currentDossier && (
                <div className="bg-slate-950 p-5 rounded-2xl border-2 border-emerald-500/50 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-base font-black text-white">
                          PMFBY Claim Registered: {currentDossier.claimId}
                        </h3>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {currentDossier.hashSignature}
                      </span>
                    </div>

                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Slip</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px] uppercase">Farmer</span>
                      <strong className="text-white">{currentDossier.farmerName}</strong>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px] uppercase">Crop</span>
                      <strong className="text-white">{currentDossier.cropName}</strong>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px] uppercase">Damage</span>
                      <strong className="text-amber-400 uppercase">{currentDossier.damageType}</strong>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px] uppercase">Telemetry</span>
                      <strong className="text-emerald-400">
                        {currentDossier.telemetrySnapshot.windSpeed} km/h • {currentDossier.telemetrySnapshot.rainProbability3h}%
                      </strong>
                    </div>
                  </div>

                  {/* Photo Audit Status */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-2 font-medium">
                      <span className="text-slate-300">Geo-Tagged Crop Photos Evidence:</span>
                      <span className="text-emerald-400 font-mono">
                        {currentDossier.photos.filter(p => p.captured).length} / 4 Captured
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {currentDossier.photos.map(p => (
                        <div key={p.id} className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] flex items-center gap-1.5">
                          {p.captured ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          )}
                          <span className={p.captured ? 'text-slate-200' : 'text-slate-500'}>
                            Photo #{p.id}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Helpline */}
                  <div className="flex items-center justify-between bg-blue-950/40 p-3 rounded-xl border border-blue-800/50 text-xs">
                    <div className="flex items-center gap-2 text-blue-300">
                      <PhoneCall className="w-4 h-4" />
                      <span>PMFBY Kisan Toll-Free Claim Helpline: <strong>14447</strong> / 1800-180-1551</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Surveyor Dispatched</span>
                  </div>

                </div>
              )}
            </>
          ) : (
            /* History Tab */
            <div className="space-y-3">
              {savedDossiers.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-8">No claim dossiers registered yet.</p>
              ) : (
                savedDossiers.map((d) => (
                  <div key={d.claimId} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm text-white font-mono">{d.claimId}</strong>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                          {d.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {d.farmerName} • {d.cropName} • {d.damageType} • {d.filingTimestamp}
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono">{d.hashSignature}</span>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                      {d.photos.filter(p => p.captured).length}/4 Photos
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
