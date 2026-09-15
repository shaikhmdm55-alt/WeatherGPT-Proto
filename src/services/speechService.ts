import { Language } from '../types';

export class SpeechEngine {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static recognition: any = null;
  private static isSpeaking: boolean = false;
  private static onSpeakingStateChange?: (speaking: boolean) => void;

  public static setSpeakingListener(cb: (speaking: boolean) => void) {
    this.onSpeakingStateChange = cb;
  }

  public static speak(text: string, lang: Language) {
    if (!this.synth) return;

    // Cancel any current utterance
    this.synth.cancel();

    // Clean text: strip emojis, markdown, and brackets
    const cleanText = text
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/[\[\]\(\)\*#_`]/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Choose appropriate BCP-47 tag
    switch (lang) {
      case 'hi':
        utterance.lang = 'hi-IN';
        break;
      case 'gu':
        utterance.lang = 'gu-IN';
        break;
      case 'en':
      default:
        utterance.lang = 'en-IN';
        break;
    }

    // Try finding matching voice
    const voices = this.synth.getVoices();
    const matchedVoice = voices.find(v => v.lang.startsWith(utterance.lang) || v.lang.includes(lang));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.rate = 0.95; // Slightly measured for elderly farmers
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.onSpeakingStateChange?.(true);
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.onSpeakingStateChange?.(false);
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.onSpeakingStateChange?.(false);
    };

    this.synth.speak(utterance);
  }

  public static stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.onSpeakingStateChange?.(false);
    }
  }

  public static isSupported(): boolean {
    return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  public static startListening(
    lang: Language,
    onResult: (transcript: string) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ) {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onError('Speech Recognition is not supported on this browser. You can type or click voice samples.');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    switch (lang) {
      case 'hi':
        recognition.lang = 'hi-IN';
        break;
      case 'gu':
        recognition.lang = 'gu-IN';
        break;
      case 'en':
      default:
        recognition.lang = 'en-IN';
        break;
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    recognition.onerror = (event: any) => {
      onError(event.error || 'Microphone capture error');
    };

    recognition.onend = () => {
      onEnd();
    };

    recognition.start();
    return recognition;
  }
}
