export class SpeechSynthPlayer {
  private audioCtx: AudioContext | null = null;
  private isPlaying = false;
  private onEndCallback?: () => void;

  playSyntheticVoice(
    text: string,
    avatarSlug: string,
    onProgress: (bars: number[]) => void,
    onEnd: () => void,
  ) {
    if (this.isPlaying) {
      this.stop();
      return;
    }

    this.isPlaying = true;
    this.onEndCallback = onEnd;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text.slice(0, 160));
      if (avatarSlug === 'timur') {
        utterance.lang = 'ru-RU';
        utterance.pitch = 0.95;
        utterance.rate = 1.05;
      } else if (avatarSlug === 'malika') {
        utterance.lang = 'uz-UZ';
        utterance.pitch = 1.15;
        utterance.rate = 1.0;
      } else if (avatarSlug === 'javohir') {
        utterance.lang = 'uz-UZ';
        utterance.pitch = 0.85;
        utterance.rate = 1.0;
      } else {
        utterance.lang = 'uz-UZ';
        utterance.pitch = 1.05;
        utterance.rate = 1.05;
      }

      const interval = setInterval(() => {
        if (!this.isPlaying) {
          clearInterval(interval);
          return;
        }
        const bars = Array.from({ length: 16 }, () =>
          Math.floor(20 + Math.random() * 80),
        );
        onProgress(bars);
      }, 100);

      utterance.onend = () => {
        clearInterval(interval);
        this.isPlaying = false;
        onEnd();
      };

      utterance.onerror = () => {
        clearInterval(interval);
        this.fallbackWebAudio(onProgress, onEnd);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      this.fallbackWebAudio(onProgress, onEnd);
    }
  }

  private fallbackWebAudio(
    onProgress: (bars: number[]) => void,
    onEnd: () => void,
  ) {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) {
        setTimeout(onEnd, 2000);
        return;
      }

      this.audioCtx = new AudioCtxClass();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();

      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += 100;
        const bars = Array.from({ length: 16 }, () =>
          Math.floor(20 + Math.random() * 80),
        );
        onProgress(bars);

        if (elapsed > 3500) {
          clearInterval(interval);
          try {
            osc.stop();
            this.audioCtx?.close();
          } catch (e) {}
          this.isPlaying = false;
          onEnd();
        }
      }, 100);
    } catch (e) {
      setTimeout(onEnd, 2000);
    }
  }

  stop() {
    this.isPlaying = false;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (e) {}
    }
    this.onEndCallback?.();
  }
}

