import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { SpeechEngine } from '../services/speechService';
import { Mic, MicOff, Send, Sparkles, Volume2, AlertCircle } from 'lucide-react';

interface VoiceQuerySectionProps {
  language: Language;
  onQuerySubmit: (query: string) => void;
  isLoading: boolean;
}

export const VoiceQuerySection: React.FC<VoiceQuerySectionProps> = ({
  language,
  onQuerySubmit,
  isLoading
}) => {
  const [queryText, setQueryText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  const sampleQueries: Record<Language, { label: string; query: string; tag: string }[]> = {
    en: [
      { label: 'Pesticide Spray', query: 'Can I spray pesticide on my cotton crop today?', tag: 'Spraying' },
      { label: 'Harvest Risk', query: 'Should I harvest my mature wheat crop today?', tag: 'Harvesting' },
      { label: 'Field Drainage', query: 'Is there heavy rain danger of field waterlogging?', tag: 'Drainage' },
      { label: 'Squall / Storm Risk', query: 'Is it safe to work in the field or is a squall coming?', tag: 'Safety' },
      { label: 'Insurance Claim', query: 'My crop got damaged by the storm, file PM Fasal Bima claim dossier', tag: 'PMFBY' }
    ],
    hi: [
      { label: 'कीटनाशक छिड़काव', query: 'क्या मैं आज कीटनाशक या दवा का छिड़काव कर सकता हूँ?', tag: 'छिड़काव' },
      { label: 'फसल कटाई', query: 'क्या पकी हुई गेहूं की फसल की कटाई आज शुरू करनी चाहिए?', tag: 'कटाई' },
      { label: 'खेत जलभराव', query: 'क्या तेज बारिश से खेत में पानी भरने और जड़ सड़ने का खतरा है?', tag: 'जल निकासी' },
      { label: 'तूफान अलर्ट', query: 'क्या आज खेत में काम करना सुरक्षित है या कोई आंधी आ रही है?', tag: 'सुरक्षा' },
      { label: 'फसल बीमा क्लेम', query: 'तूफान से मेरी फसल गिर गई है, प्रधानमंत्री फसल बीमा क्लेम दर्ज करें', tag: 'PMFBY' }
    ],
    gu: [
      { label: 'દવા છંટકાવ', query: 'હું આજે કપાસ કે મગફળીમાં જંતુનાશક દવા છાંટી શકું?', tag: 'છંટકાવ' },
      { label: 'પાક લણણી', query: 'શું મારે આજે તૈયાર ઘઉં કે પાકની તાત્કાલિક લણણી કરવી જોઈએ?', tag: 'લણણી' },
      { label: 'પાણી નિકાલ', query: 'શું ખેતરમાં પાણી ભરાઈ રહેવાથી મૂળિયા કોહવાઈ જવાનું જોખમ છે?', tag: 'નિકાલ' },
      { label: 'વાવાઝોડું એલર્ટ', query: 'શું ખેતરમાં કામ કરવું સલામત છે કે કોઈ વાવાઝોડું આવે છે?', tag: 'સુરક્ષા' },
      { label: 'ફસલ બીમા દાવો', query: 'વાવાઝોડાથી કપાસ પડી ગયો છે, પ્રધાનમંત્રી ફસલ બીમા યોજના ક્લેમ ફોર્મ ભરો', tag: 'PMFBY' }
    ]
  };

  const handleToggleVoice = () => {
    if (isListening) {
      setIsListening(false);
      SpeechEngine.stop();
      return;
    }

    setRecognitionError(null);
    setIsListening(true);

    const rec = SpeechEngine.startListening(
      language,
      (transcript) => {
        setQueryText(transcript);
        setIsListening(false);
        onQuerySubmit(transcript);
      },
      (err) => {
        setRecognitionError(err);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    if (!rec) {
      setIsListening(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!queryText.trim() || isLoading) return;
    onQuerySubmit(queryText.trim());
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
      
      {/* Title & Instructions */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-emerald-400" />
            {language === 'hi'
              ? 'बोलकर या लिखकर कृषि सवाल पूछें'
              : language === 'gu'
              ? 'બોલીને અથવા લખીને ખેતીનો પ્રશ્ન પૂછો'
              : 'Voice-First Agricultural Query Engine'}
          </h2>
          <p className="text-xs text-slate-400">
            {language === 'hi'
              ? 'माइक्रोफ़ोन दबाकर हिंदी में बोलें — मौसम टेलीमेट्री के आधार पर प्रमाणित सलाह मिलेगी'
              : language === 'gu'
              ? 'માઈક્રોફોન દબાવીને ગુજરાતીમાં પૂછો — હવામાન આધારે ચોક્કસ સલાહ મળશે'
              : 'Tap the mic to speak in English, Hindi, or Gujarati. Grounded in live telemetry.'}
          </p>
        </div>
      </div>

      {/* Primary Voice Mic and Input Bar */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3">
        
        {/* Large Accessible Microphone Button */}
        <button
          type="button"
          onClick={handleToggleVoice}
          disabled={isLoading}
          className={`w-full sm:w-auto h-14 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-300 shadow-lg ${
            isListening
              ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-4 ring-rose-500/40'
              : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-emerald-900/30'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-6 h-6 animate-spin" />
              <span className="text-sm">
                {language === 'hi' ? 'सुन रहा हूँ... बोलिए' : language === 'gu' ? 'સાંભળી રહ્યો છું... બોલો' : 'Listening... Speak'}
              </span>
            </>
          ) : (
            <>
              <Mic className="w-6 h-6" />
              <span className="text-sm">
                {language === 'hi' ? 'माइक दबाकर बोलें' : language === 'gu' ? 'માઇક દબાવીને બોલો' : 'Tap & Speak'}
              </span>
            </>
          )}
        </button>

        {/* Text Input Fallback */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder={
              language === 'hi'
                ? 'उदा. क्या आज कीटनाशक छिड़कना सुरक्षित है?'
                : language === 'gu'
                ? 'દા.ત. શું આજે કપાસમાં દવા છાંટી શકાય?'
                : 'e.g. Can I spray pesticide or harvest wheat today?'
            }
            className="w-full h-14 bg-slate-800/80 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl pl-4 pr-14 text-sm text-white placeholder-slate-500 focus:outline-none transition"
          />
          
          <button
            type="submit"
            disabled={!queryText.trim() || isLoading}
            className="absolute right-2 top-2 h-10 w-10 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center transition shadow-md"
            title="Submit Query"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </form>

      {recognitionError && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{recognitionError} (You can also select from the quick questions below).</span>
        </div>
      )}

      {/* Preset Farmer Quick Questions */}
      <div className="mt-4 pt-4 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {language === 'hi'
              ? 'अक्सर पूछे जाने वाले सवाल (तुरंत जांचें):'
              : language === 'gu'
              ? 'વારંવાર પૂછાતા પ્રશ્નો (તાત્કાલિક ચકાસો):'
              : 'Common Farmer Operational Questions (Quick Inquire):'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {sampleQueries[language].map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQueryText(item.query);
                onQuerySubmit(item.query);
              }}
              disabled={isLoading}
              className="text-left text-xs bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/80 hover:border-emerald-500/50 text-slate-200 hover:text-white px-3 py-2 rounded-xl transition flex items-center gap-2 group shadow-sm"
            >
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-700/80 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition">
                {item.tag}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
