import React, { useState, useEffect } from 'react';
import { GuardrailDecision, Language } from '../types';
import { SpeechEngine } from '../services/speechService';
import { Volume2, VolumeX, ShieldAlert, CheckCircle2, AlertOctagon, FileText, Check, Copy } from 'lucide-react';

interface AdvisoryVerdictCardProps {
  decision: GuardrailDecision | null;
  language: Language;
  onOpenInsuranceModal: () => void;
  isLoading: boolean;
}

export const AdvisoryVerdictCard: React.FC<AdvisoryVerdictCardProps> = ({
  decision,
  language,
  onOpenInsuranceModal,
  isLoading
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    SpeechEngine.setSpeakingListener((speaking) => {
      setIsSpeaking(speaking);
    });
    return () => {
      SpeechEngine.stop();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse">
        <div className="h-7 bg-slate-800 rounded-lg w-1/3 mb-4"></div>
        <div className="h-20 bg-slate-800/60 rounded-xl mb-4"></div>
        <div className="h-10 bg-slate-800/40 rounded-xl"></div>
      </div>
    );
  }

  if (!decision) {
    return (
      <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-8 text-center text-slate-500">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-slate-300">Ready to audit operational agricultural safety</p>
        <p className="text-xs text-slate-500 mt-1">
          Ask an operational question above or choose a disaster simulation preset to test guardrails
        </p>
      </div>
    );
  }

  const isHazardMoratorium = decision.verdict.includes('HAZARD');

  const handleSpeak = () => {
    if (isSpeaking) {
      SpeechEngine.stop();
    } else {
      SpeechEngine.speak(decision.speechPayload, language);
    }
  };

  const handleCopy = () => {
    const textToCopy = `[DECISION VERDICT]: ${decision.verdict}
[DISASTER PHASE]: ${decision.phase}
[EXECUTIVE GUIDANCE]: ${decision.executiveGuidance}
[TELEMETRY PROOF]: ${decision.telemetryProof}
[SPEECH_SYNTHESIS_PAYLOAD]: ${decision.speechPayload}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-2xl border-2 p-6 shadow-2xl transition-all duration-300 relative overflow-hidden backdrop-blur-md ${
      isHazardMoratorium
        ? 'bg-gradient-to-b from-rose-950/40 via-slate-900/95 to-slate-900 border-rose-500/80 shadow-rose-950/30'
        : 'bg-gradient-to-b from-emerald-950/40 via-slate-900/95 to-slate-900 border-emerald-500/80 shadow-emerald-950/30'
    }`}>

      {/* Decorative Glow */}
      <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
        isHazardMoratorium ? 'bg-rose-500/10' : 'bg-emerald-500/10'
      }`} />

      {/* Top Bar: Decision Verdict + Disaster Phase */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
        
        {/* Verdict Badge */}
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
            isHazardMoratorium
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-rose-500/20'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-emerald-500/20'
          }`}>
            {isHazardMoratorium ? (
              <AlertOctagon className="w-7 h-7" />
            ) : (
              <CheckCircle2 className="w-7 h-7" />
            )}
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
              [DECISION VERDICT]
            </span>
            <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${
              isHazardMoratorium ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {decision.verdict}
            </h3>
          </div>
        </div>

        {/* Disaster Phase Badge & Controls */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
              [DISASTER PHASE]
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
              decision.phase === 'During Disaster'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : decision.phase === 'Before Disaster'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : decision.phase === 'After Disaster'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}>
              {decision.phase}
            </span>
          </div>

          <button
            onClick={handleCopy}
            title="Copy 5-Part Response"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Part 3: EXECUTIVE GUIDANCE */}
      <div className="mb-5 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
        <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase mb-1">
          [EXECUTIVE GUIDANCE]
        </div>
        <p className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
          {decision.executiveGuidance}
        </p>
      </div>

      {/* Part 4: TELEMETRY PROOF */}
      <div className="mb-5 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 font-mono text-xs">
        <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase mb-1 flex items-center justify-between">
          <span>[TELEMETRY PROOF]</span>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Zero-Hallucination Anchored
          </span>
        </div>
        <p className="text-slate-300">
          {decision.telemetryProof}
        </p>
      </div>

      {/* Part 5: SPEECH_SYNTHESIS_PAYLOAD & Player */}
      <div className="mb-5 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>[SPEECH_SYNTHESIS_PAYLOAD]</span>
            <span className="text-[9px] text-slate-500">(Native TTS Script)</span>
          </div>

          <button
            onClick={handleSpeak}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold transition shadow-md ${
              isSpeaking
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>Stop Voice</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Play Voice</span>
              </>
            )}
          </button>
        </div>

        <p className="text-sm text-slate-300 italic leading-relaxed">
          "{decision.speechPayload}"
        </p>
      </div>

      {/* Triggered Deterministic Guardrails Audit Rules */}
      {decision.triggeredRules && decision.triggeredRules.length > 0 && (
        <div className="pt-3 border-t border-slate-800/80">
          <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase block mb-1.5">
            Triggered Deterministic Safety Laws:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {decision.triggeredRules.map((rule, idx) => (
              <span
                key={idx}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isHazardMoratorium ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                {rule}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Insurance Action Shortcut if relevant */}
      {(decision.actionCategory === 'insurance' || decision.phase === 'After Disaster' || decision.rawMetrics.radar === 'severe') && (
        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between bg-blue-950/30 p-3 rounded-xl border border-blue-800/50">
          <div>
            <h4 className="text-xs font-bold text-blue-300">PM Fasal Bima Yojana (PMFBY) Action</h4>
            <p className="text-[11px] text-slate-400">72-hour window active for geo-tagged crop damage registration</p>
          </div>
          <button
            onClick={onOpenInsuranceModal}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-md shadow-blue-900/30"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Open Insurance Dossier</span>
          </button>
        </div>
      )}

    </div>
  );
};
