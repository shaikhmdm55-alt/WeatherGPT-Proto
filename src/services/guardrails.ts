import { WeatherTelemetry, GuardrailDecision, Language, ActionCategory, DisasterPhase } from '../types';

export function detectLanguageFromQuery(query: string, preferred: Language): Language {
  // Check for Devanagari (Hindi)
  if (/[\u0900-\u097F]/.test(query)) {
    return 'hi';
  }
  // Check for Gujarati
  if (/[\u0A80-\u0AFF]/.test(query)) {
    return 'gu';
  }
  return preferred;
}

export function detectCategoryFromQuery(query: string): ActionCategory {
  const q = query.toLowerCase();
  
  if (q.includes('spray') || q.includes('chemical') || q.includes('pesticide') || q.includes('fertilizer') || 
      q.includes('छिड़काव') || q.includes('दवा') || q.includes('कीटनाशक') ||
      q.includes('દવા') || q.includes('છંટકાવ') || q.includes('જંતુનાશક')) {
    return 'spraying';
  }

  if (q.includes('harvest') || q.includes('reap') || q.includes('cutting') || 
      q.includes('कटाई') || q.includes('काटना') || q.includes('फसल काटना') ||
      q.includes('કાપણી') || q.includes('લણણી')) {
    return 'harvesting';
  }

  if (q.includes('drain') || q.includes('waterlog') || q.includes('flood') || q.includes('trench') || q.includes('culvert') ||
      q.includes('जल निकासी') || q.includes('नाली') || q.includes('पानी भरना') ||
      q.includes('પાણી નિકાલ') || q.includes('ખાળિયો') || q.includes('જળબંબાકાર')) {
    return 'drainage';
  }

  if (q.includes('insurance') || q.includes('claim') || q.includes('pmfby') || q.includes('fasal bima') || q.includes('loss') || q.includes('damage') ||
      q.includes('बीमा') || q.includes('मुआवजा') || q.includes('नुकसान') ||
      q.includes('વીમો') || q.includes('સહાય') || q.includes('નુકસાની')) {
    return 'insurance';
  }

  if (q.includes('storm') || q.includes('cyclone') || q.includes('thunder') || q.includes('radar') || q.includes('squall') || q.includes('safe') ||
      q.includes('तूफान') || q.includes('आंधी') || q.includes('चक्रवात') ||
      q.includes('વાવાઝોડું') || q.includes('તોફાન')) {
    return 'squall_red_alert';
  }

  return 'general';
}

export function evaluateGuardrails(
  telemetry: WeatherTelemetry,
  category: ActionCategory,
  lang: Language
): GuardrailDecision {
  const { windSpeed, windGust, rainProbability3h, projectedPrecipitation, temperature, convectiveRadar } = telemetry;
  const isSevere = convectiveRadar === 'severe' || windSpeed > 50.0;
  
  // 1. SQUALL & RADAR ALERTS (During Disaster)
  // Threshold: Convective radar index = "severe" OR Wind speed > 50.0 km/h
  if (isSevere) {
    const triggered = [
      convectiveRadar === 'severe' ? 'Convective radar index = severe' : '',
      windSpeed > 50.0 ? `Wind speed (${windSpeed} km/h) > 50.0 km/h` : ''
    ].filter(Boolean);

    let guidance = '';
    let speech = '';

    if (lang === 'hi') {
      guidance = 'तत्काल रेड अलर्ट लागू! सभी किसान तुरंत खेत खाली करें, सबमर्सिबल पंप की बिजली काटें, और मवेशियों को टिन की छत और बिजली के खंभों से दूर पक्के शेड में सुरक्षित करें।';
      speech = 'गंभीर तूफान का तात्कालिक रेड अलर्ट। कृपया तुरंत खेत से बाहर आएं। सबमर्सिबल पंप की बिजली बंद करें और पशुओं को पक्के बाड़े में बांधें। किसी भी दशा में बिजली के खंभों या पेड़ों के नीचे न रुकें।';
    } else if (lang === 'gu') {
      guidance = 'તાત્કાલિક રેડ એલર્ટ! ખેડૂતો તરત જ ખેતર ખાલી કરે, સબમર્સિબલ પંપનું વીજ જોડાણ બંધ કરે, અને પશુધનને ટીનના છાપરા અને વીજળીના થાંભલાથી દૂર પાકા શેડમાં બાંધે.';
      speech = 'તીવ્ર વાવાઝોડાનું તાત્કાલિક રેડ એલર્ટ જાહેર કરવામાં આવ્યું છે. તમામ ખેડૂત ભાઈઓ તરત ખેતર છોડી સુરક્ષિત સ્થળે પહોંચો. બોરવેલ કે મોટરની વીજળી બંધ કરો અને ઢોરઢાંખરને પાકા મકાનમાં બાંધો.';
    } else {
      guidance = 'IMMEDIATE RED ALERT IN EFFECT! Vacate fields immediately, disconnect submersible pump electricals, and shelter cattle in pucca sheds away from tin roofs and power lines.';
      speech = 'Immediate red alert in effect. Vacate all fields immediately. Isolate submersible pump electrical power and move cattle into pucca shelters away from tin roofs and overhead power lines.';
    }

    return {
      verdict: '⚠️ HAZARD MORATORIUM ENFORCED',
      phase: 'During Disaster',
      executiveGuidance: guidance,
      telemetryProof: `Verified Wind: ${windSpeed} km/h (Gusts: ${windGust} km/h) | Rain Prob: ${rainProbability3h}% | Temp: ${temperature}°C | Convective Status: ${convectiveRadar.toUpperCase()}`,
      speechPayload: speech,
      triggeredRules: triggered,
      actionCategory: 'squall_red_alert',
      rawMetrics: {
        windSpeed,
        rainProb: rainProbability3h,
        rainMm: projectedPrecipitation,
        windGust,
        radar: convectiveRadar,
        temp: temperature
      }
    };
  }

  // 2. POST-DISASTER INSURANCE CLAIMS (After Disaster)
  if (category === 'insurance') {
    let guidance = '';
    let speech = '';

    if (lang === 'hi') {
      guidance = 'प्रधानमंत्री फसल बीमा योजना (PMFBY) क्लेम प्रक्रिया शुरू करें। 72 घंटे के भीतर खेत के 4 जीपीएस जियो-टैग्ड फोटो खींचकर फसल नुकसान का ऑनलाइन दावा दर्ज करें।';
      speech = 'आपकी फसल क्षति का विवरण दर्ज किया जा रहा है। कृपया 72 घंटे के भीतर अपने प्रभावित खेत के चार स्पष्ट फोटो जियो टैग के साथ अपलोड करें जिससे बीमा क्लेम बिना रुकावट पास हो सके।';
    } else if (lang === 'gu') {
      guidance = 'પ્રધાનમંત્રી ફસલ બીમા યોજના હેઠળ સહાય ફોર્મ શરૂ કરો. આપત્તિ પછીના 72 કલાકમાં ખેતરના ચાર જીપીએસ જીઓ-ટેગ ફોટો પાડીને નુકસાનીનો દાવો સબમિટ કરો.';
      speech = 'પ્રધાનમંત્રી ફસલ બીમા યોજના અંતર્ગત ખેતી પાક નુકસાનીનો દાવો શરૂ કરવામાં આવ્યો છે. આગામી 72 કલાકમાં નુકસાન પામેલ પાકના ચાર જીઓ ટેગ વાળા ફોટોગ્રાફ્સ અપલોડ કરી દેવા વિનંતી છે.';
    } else {
      guidance = 'Initiate PM Fasal Bima Yojana dossier protocol immediately. Capture 4 geo-tagged crop loss photos within 72 hours and submit digital telemetry proof for expedited surveyor approval.';
      speech = 'Initiating post disaster crop insurance dossier under PM Fasal Bima Yojana. You must capture four geo tagged crop damage photographs within 72 hours to guarantee claim settlement.';
    }

    return {
      verdict: '✅ SAFE FOR FIELD ACTION',
      phase: 'After Disaster',
      executiveGuidance: guidance,
      telemetryProof: `Verified Wind: ${windSpeed} km/h | Rain Prob: ${rainProbability3h}% | Temp: ${temperature}°C | Convective Status: ${convectiveRadar.toUpperCase()}`,
      speechPayload: speech,
      triggeredRules: ['PM Fasal Bima Yojana (PMFBY) 72-Hour Evidence Protocol Triggered'],
      actionCategory: 'insurance',
      rawMetrics: {
        windSpeed,
        rainProb: rainProbability3h,
        rainMm: projectedPrecipitation,
        windGust,
        radar: convectiveRadar,
        temp: temperature
      }
    };
  }

  // 3. SPRAYING MORATORIUM (Before Disaster)
  // Threshold: Wind speed > 15.0 km/h OR Rain probability (next 3h) > 30%
  if (category === 'spraying') {
    const windViolation = windSpeed > 15.0;
    const rainViolation = rainProbability3h > 30;

    if (windViolation || rainViolation) {
      const triggered = [
        windViolation ? `Wind speed (${windSpeed} km/h) > 15.0 km/h limit` : '',
        rainViolation ? `Rain probability (${rainProbability3h}%) > 30% threshold` : ''
      ].filter(Boolean);

      let guidance = '';
      let speech = '';

      if (lang === 'hi') {
        guidance = `कीटनाशक या उर्वरक छिड़काव पर पूर्ण रोक! तेज हवा (${windSpeed} km/h) और बारिश की आशंका (${rainProbability3h}%) से दवा उड़कर व्यर्थ होगी, मिट्टी में बह जाएगी और भारी आर्थिक नुकसान होगा।`;
        speech = 'कीटनाशक का छिड़काव बिल्कुल न करें। हवा की गति 15 किलोमीटर प्रति घंटे से अधिक है और बारिश की संभावना भी ज्यादा है। दवा बह जाने से आपका पूरा खर्च बर्बाद हो जाएगा।';
      } else if (lang === 'gu') {
        guidance = `જંતુનાશક અથવા ખાતર છંટકાવ પર સખત પ્રતિબંધ! પવનની ઝડપ (${windSpeed} km/h) અને વરસાદની શક્યતા (${rainProbability3h}%) ને કારણે દવાનું ધોવાણ થશે અને ખર્ચ વ્યર્થ જશે.`;
        speech = 'આજે કપાસ કે અન્ય પાકમાં જંતુનાશક દવા ન છાંટવી. પવન વધુ હોવાથી દવા ઉડી જશે અને વરસાદથી ધોવાઈ જશે જેનાથી આપના પૈસાનું નુકસાન થશે.';
      } else {
        guidance = `STRICT SPRAYING MORATORIUM! Elevated wind speed (${windSpeed} km/h) and rain probability (${rainProbability3h}%) will trigger severe chemical drift, ground runoff, and wasted input costs.`;
        speech = 'Strict spraying moratorium enforced. Do not apply chemicals or foliar sprays today due to high wind drift and incoming rain risk which will wash away expensive inputs.';
      }

      return {
        verdict: '⚠️ HAZARD MORATORIUM ENFORCED',
        phase: 'Before Disaster',
        executiveGuidance: guidance,
        telemetryProof: `Verified Wind: ${windSpeed} km/h | Rain (next 3h): ${rainProbability3h}% | Temp: ${temperature}°C | Convective Status: ${convectiveRadar.toUpperCase()}`,
        speechPayload: speech,
        triggeredRules: triggered,
        actionCategory: 'spraying',
        rawMetrics: {
          windSpeed,
          rainProb: rainProbability3h,
          rainMm: projectedPrecipitation,
          windGust,
          radar: convectiveRadar,
          temp: temperature
        }
      };
    } else {
      let guidance = '';
      let speech = '';

      if (lang === 'hi') {
        guidance = `छिड़काव के लिए परिस्थितियां अनुकूल हैं। हवा की गति मात्र ${windSpeed} km/h है और बारिश की संभावना केवल ${rainProbability3h}% है। दोपहर से पहले छिड़काव पूरा करें।`;
        speech = 'छिड़काव के लिए मौसम पूरी तरह सुरक्षित है। हवा शांत है और बारिश का कोई खतरा नहीं है। आप निश्चित होकर छिड़काव कर सकते हैं।';
      } else if (lang === 'gu') {
        guidance = `દવા છાંટવા માટે હવામાન અનુકૂળ છે. પવનની ગતિ માત્ર ${windSpeed} km/h છે અને વરસાદની શક્યતા ${rainProbability3h}% છે. બપોર પહેલા કામ આટોપી લેવું.`;
        speech = 'આજે ખેતરમાં દવા કે ખાતર છાંટવા માટે હવામાન એકદમ યોગ્ય છે. પવન ધીમો છે અને વરસાદની કોઈ શક્યતા નથી.';
      } else {
        guidance = `Conditions are optimal for chemical and fertilizer application. Wind speed is gentle at ${windSpeed} km/h and rain chance is low at ${rainProbability3h}%. Complete spraying before midday heat.`;
        speech = 'Safe for field spraying. Winds are calm below fifteen kilometers per hour and rain chance is minimal. You may proceed with application.';
      }

      return {
        verdict: '✅ SAFE FOR FIELD ACTION',
        phase: 'Standard Advisory',
        executiveGuidance: guidance,
        telemetryProof: `Verified Wind: ${windSpeed} km/h | Rain (next 3h): ${rainProbability3h}% | Temp: ${temperature}°C | Convective Status: ${convectiveRadar.toUpperCase()}`,
        speechPayload: speech,
        triggeredRules: ['Wind speed <= 15.0 km/h AND Rain probability <= 30% (Spraying criteria cleared)'],
        actionCategory: 'spraying',
        rawMetrics: {
          windSpeed,
          rainProb: rainProbability3h,
          rainMm: projectedPrecipitation,
          windGust,
          radar: convectiveRadar,
          temp: temperature
        }
      };
    }
  }

  // 4. ACCELERATED HARVEST (Before Disaster)
  // Threshold: Rain probability > 70% OR Wind gust > 40.0 km/h on mature crops
  if (category === 'harvesting') {
    const rainViolation = rainProbability3h > 70;
    const gustViolation = windGust > 40.0;

    if (rainViolation || gustViolation) {
      const triggered = [
        rainViolation ? `Rain probability (${rainProbability3h}%) > 70%` : '',
        gustViolation ? `Wind gust (${windGust} km/h) > 40.0 km/h limit` : ''
      ].filter(Boolean);

      let guidance = '';
      let speech = '';

      if (lang === 'hi') {
        guidance = 'आपातकालीन कटाई खिड़की! पकी फसल को 6 से 12 घंटों के भीतर तुरंत काटें ताकि तेज आंधी और बारिश से फसल गिरने (लॉजिंग) और दाना सड़ने से बचाया जा सके।';
        speech = 'पकी हुई फसल की तुरंत कटाई करें। अगले छह से बारह घंटे में तेज बारिश और हवा से फसल गिरने का भारी खतरा है। कटी हुई फसल को ऊंचे और सूखे स्थान पर तिरपाल से ढकें।';
      } else if (lang === 'gu') {
        guidance = 'તાત્કાલિક લણણી સમયગાળો! તૈયાર થયેલા પાકને આગામી 6 થી 12 કલાકમાં કાપી લો જેથી પવનના ઝાપટાં અને ભારે વરસાદથી પાક ઢળી પડતો અને દાણા બગડતા બચે.';
        speech = 'તૈયાર પાકની તાત્કાલિક લણણી કરો. આગામી બાર કલાકમાં પવન અને વરસાદથી પાક પડી જવાનું જોખમ છે. કાપેલો પાક તાડપત્રીથી ઢાંકીને સુરક્ષિત રાખો.';
      } else {
        guidance = 'URGENT ACCELERATED HARVEST WINDOW! Direct immediate field reaping within 6–12 hours to prevent severe crop lodging, shattering, and seed rot from approaching precipitation.';
        speech = 'Urgent harvest window active. Mature crops must be reaped within the next six to twelve hours to prevent crop lodging and moisture rot from heavy incoming storms.';
      }

      return {
        verdict: '⚠️ HAZARD MORATORIUM ENFORCED',
        phase: 'Before Disaster',
        executiveGuidance: guidance,
        telemetryProof: `Verified Wind Gust: ${windGust} km/h | Rain Chance: ${rainProbability3h}% | Temp: ${temperature}°C | Convective Status: ${convectiveRadar.toUpperCase()}`,
        speechPayload: speech,
        triggeredRules: triggered,
        actionCategory: 'harvesting',
        rawMetrics: {
          windSpeed,
          rainProb: rainProbability3h,
          rainMm: projectedPrecipitation,
          windGust,
          radar: convectiveRadar,
          temp: temperature
        }
      };
    } else {
      let guidance = '';
      let speech = '';

      if (lang === 'hi') {
        guidance = `फसल कटाई के लिए मौसम सामान्य है। तेज आंधी का कोई खतरा नहीं है (हवा के झोंके ${windGust} km/h)। आप सामान्य गति से कटाई जारी रख सकते हैं।`;
        speech = 'कटाई के लिए मौसम सामान्य और सुरक्षित है। कोई तेज आंधी या मूसलाधार बारिश का खतरा नहीं है।';
      } else if (lang === 'gu') {
        guidance = `પાકની કાપણી માટે વાતાવરણ અનુકૂળ છે. પવન સામાન્ય (${windGust} km/h) છે અને વરસાદનું કોઈ તોફાની જોખમ નથી.`;
        speech = 'પાકની લણણી માટે વાતાવરણ શાંત છે. તમે સામાન્ય રીતે કાપણી કાર્ય ચાલુ રાખી શકો છો.';
      } else {
        guidance = `Normal harvesting conditions prevail. Wind gusts are stable at ${windGust} km/h and rain threat is within safe baseline. Proceed with scheduled reaping.`;
        speech = 'Safe conditions for regular harvesting. No destructive wind gusts or acute rain front detected.';
      }

      return {
        verdict: '✅ SAFE FOR FIELD ACTION',
        phase: 'Standard Advisory',
        executiveGuidance: guidance,
        telemetryProof: `Verified Wind Gust: ${windGust} km/h | Rain: ${rainProbability3h}% | Temp: ${temperature}°C | Convective Status: ${convectiveRadar.toUpperCase()}`,
        speechPayload: speech,
        triggeredRules: ['Rain probability <= 70% AND Wind gust <= 40 km/h (Normal reaping window)'],
        actionCategory: 'harvesting',
        rawMetrics: {
          windSpeed,
          rainProb: rainProbability3h,
          rainMm: projectedPrecipitation,
          windGust,
          radar: convectiveRadar,
          temp: temperature
        }
      };
    }
  }

  // 5. FIELD DRAINAGE RUNOFF (Before Disaster)
  // Threshold: Projected precipitation > 30 mm OR Rain chance > 50%
  const isDrainageCritical = projectedPrecipitation > 30.0 || rainProbability3h > 50;
  if (category === 'drainage' || (category === 'general' && isDrainageCritical)) {
    if (isDrainageCritical) {
      const triggered = [
        projectedPrecipitation > 30.0 ? `Projected precipitation (${projectedPrecipitation} mm) > 30 mm` : '',
        rainProbability3h > 50 ? `Rain probability (${rainProbability3h}%) > 50%` : ''
      ].filter(Boolean);

      let guidance = '';
      let speech = '';

      if (lang === 'hi') {
        guidance = `खेत जल निकासी पर तत्काल कार्य करें! अनुमानित वर्षा ${projectedPrecipitation} mm और बारिश की संभावना ${rainProbability3h}% है। खेत की मेड़ और नालियों को तुरंत साफ करें ताकि जड़ों में पानी न भरे।`;
        speech = 'भारी बारिश के कारण खेत में पानी भरने का खतरा है। तुरंत अपने खेत की नालियों और निकासी रास्तों को साफ करें जिससे पौधों की जड़ें सड़ने से बच सकें।';
      } else if (lang === 'gu') {
        guidance = `ખેતરમાં પાણીના નિકાલની તાત્કાલિક વ્યવસ્થા કરો! અંદાજિત વરસાદ ${projectedPrecipitation} mm અને સંભાવના ${rainProbability3h}% છે. સેઢાપાળા અને ખાળિયા તરત ખુલ્લા કરો.`;
        speech = 'વરસાદને લીધે ખેતરમાં પાણી ભરાઈ રહેવાની શક્યતા છે. મૂળિયા કોહવાઈ ન જાય તે માટે ખેતરની નીકો અને પાણીના વહેણ તાકીદે સાફ કરી પાણીનો નિકાલ કરો.';
      } else {
        guidance = `URGENT FIELD DRAINAGE ACTION REQUIRED! Projected rainfall is ${projectedPrecipitation} mm with ${rainProbability3h}% chance. Clear boundary trenches and culverts immediately to prevent root suffocation.`;
        speech = 'Urgent field drainage alert. Expected precipitation requires immediate clearance of boundary trenches and culverts to avoid root zone waterlogging.';
      }

      return {
        verdict: '⚠️ HAZARD MORATORIUM ENFORCED',
        phase: 'Before Disaster',
        executiveGuidance: guidance,
        telemetryProof: `Projected Rain: ${projectedPrecipitation} mm | Rain Chance: ${rainProbability3h}% | Wind: ${windSpeed} km/h | Convective Status: ${convectiveRadar.toUpperCase()}`,
        speechPayload: speech,
        triggeredRules: triggered,
        actionCategory: 'drainage',
        rawMetrics: {
          windSpeed,
          rainProb: rainProbability3h,
          rainMm: projectedPrecipitation,
          windGust,
          radar: convectiveRadar,
          temp: temperature
        }
      };
    }
  }

  // 6. Standard Advisory / Baseline Safety
  let guidance = '';
  let speech = '';

  if (lang === 'hi') {
    guidance = `मौसम कृषि कार्यों के लिए सुरक्षित और सामान्य है। तापमान ${temperature}°C, हवा ${windSpeed} km/h और बारिश की संभावना केवल ${rainProbability3h}% है। नियमित कृषि कार्य बेझिझक करें।`;
    speech = 'कृषि कार्य के लिए मौसम पूरी तरह सामान्य और सुरक्षित है। आप खाद, सिंचाई अथवा गुड़ाई जैसे नियमित काम बिना किसी संकोच के कर सकते हैं।';
  } else if (lang === 'gu') {
    guidance = `ખેતી કામકાજ માટે વાતાવરણ સુરક્ષિત અને સામાન્ય છે. તાપમાન ${temperature}°C, પવન ${windSpeed} km/h અને વરસાદની શક્યતા ${rainProbability3h}% છે. નિયમિત કામ ચાલુ રાખી શકો છો.`;
    speech = 'ખેતી કામ માટે હવામાન એકદમ અનુકૂળ અને સલામત છે. તમે દૈનિક ખેતી કાર્યો કોઈપણ ચિંતા વગર આગળ વધારી શકો છો.';
  } else {
    guidance = `Meteorological conditions are stable and safe for routine agronomic operations. Temperature is ${temperature}°C, wind is ${windSpeed} km/h, and precipitation risk is nominal at ${rainProbability3h}%.`;
    speech = 'Safe for routine agricultural field operations. Telemetry indicators are well within standard safety baselines with no active hazard warnings.';
  }

  return {
    verdict: '✅ SAFE FOR FIELD ACTION',
    phase: 'Standard Advisory',
    executiveGuidance: guidance,
    telemetryProof: `Verified Wind: ${windSpeed} km/h | Rain: ${rainProbability3h}% | Temp: ${temperature}°C | Convective Status: ${convectiveRadar.toUpperCase()}`,
    speechPayload: speech,
    triggeredRules: ['All meteorological parameters within safe agronomic operational thresholds'],
    actionCategory: 'general',
    rawMetrics: {
      windSpeed,
      rainProb: rainProbability3h,
      rainMm: projectedPrecipitation,
      windGust,
      radar: convectiveRadar,
      temp: temperature
    }
  };
}

// Generate the strict 5-part format string exactly matching Section 2 specification
export function formatFivePartResponse(decision: GuardrailDecision): string {
  return `[DECISION VERDICT]: ${decision.verdict}
[DISASTER PHASE]: ${decision.phase}
[EXECUTIVE GUIDANCE]: ${decision.executiveGuidance}
[TELEMETRY PROOF]: ${decision.telemetryProof}
[SPEECH_SYNTHESIS_PAYLOAD]: ${decision.speechPayload}`;
}
