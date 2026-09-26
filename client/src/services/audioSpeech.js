/**
 * Vernacular Voice Advisory Audio Service
 * Speaks recommendations directly to rural dairy farmers in their language.
 */

class AudioSpeechService {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.isSpeaking = false;
  }

  speak(text, lang = 'en', onEnd = () => {}) {
    if (!this.synth) return;

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Map to BCP 47 language tags
    const langMap = {
      en: 'en-IN',
      hi: 'hi-IN',
      ta: 'ta-IN',
      mr: 'mr-IN',
      pa: 'pa-IN'
    };

    utterance.lang = langMap[lang] || 'en-IN';
    utterance.rate = 0.95; // Slightly slower for clarity in rural settings
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isSpeaking = true;
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis notice:', e);
      this.isSpeaking = false;
      onEnd();
    };

    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }
}

export const audioService = new AudioSpeechService();
