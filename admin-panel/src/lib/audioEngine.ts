/**
 * High-Performance Low-Latency Web Audio API Engine
 * Singleton AudioContext with auto-unlock on user interaction,
 * pitch-scaled musical combo synthesis, and haptic integration.
 */

let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedCtx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      sharedCtx = new AudioCtx();
    }
  }
  if (sharedCtx && sharedCtx.state === "suspended") {
    sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

// Pentatonic scale frequencies for musical combo progression (C4 up to C7)
const COMBO_FREQUENCIES = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  392.00, // G4
  440.00, // A4
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.00, // A5
  1046.50, // C6
  1174.66, // D6
  1318.51, // E6
  1567.98, // G6
  1760.00, // A6
  2093.00, // C7
];

export const ArcadeAudio = {
  /**
   * Tap sound - crisp low-latency blip
   */
  playTap() {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.05);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch { /* ignore */ }
  },

  /**
   * Block Drop - solid satisfying thud
   */
  playDrop() {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.1);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.1);

      osc.start(now);
      osc.stop(now + 0.1);

      if (typeof window !== "undefined" && window.navigator?.vibrate) {
        window.navigator.vibrate(25);
      }
    } catch { /* ignore */ }
  },

  /**
   * Perfect Stack Placement - musical ascending chime based on combo count
   */
  playPerfect(combo: number = 0) {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      const freqIdx = Math.min(COMBO_FREQUENCIES.length - 1, Math.max(4, combo + 4));
      const baseFreq = COMBO_FREQUENCIES[freqIdx];

      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.18);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.18);

      osc.start(now);
      osc.stop(now + 0.18);

      // Overlap with higher harmonic sparkle
      const spark = ctx.createOscillator();
      const sparkGain = ctx.createGain();
      spark.connect(sparkGain);
      sparkGain.connect(ctx.destination);

      spark.type = "triangle";
      spark.frequency.setValueAtTime(baseFreq * 2, now + 0.04);
      spark.frequency.exponentialRampToValueAtTime(baseFreq * 3, now + 0.22);
      sparkGain.gain.setValueAtTime(0.2, now + 0.04);
      sparkGain.gain.linearRampToValueAtTime(0.001, now + 0.22);

      spark.start(now + 0.04);
      spark.stop(now + 0.22);

      if (typeof window !== "undefined" && window.navigator?.vibrate) {
        window.navigator.vibrate([20, 30, 20]);
      }
    } catch { /* ignore */ }
  },

  /**
   * Jump / Flap - uplifting retro swoop
   */
  playJump() {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      osc.type = "sine";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.1);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.1);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch { /* ignore */ }
  },

  /**
   * Score / Gate cleared - rewarding coin chime
   */
  playScore() {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [987.77, 1318.51].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const startTime = now + i * 0.06;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.linearRampToValueAtTime(0.001, startTime + 0.12);

        osc.start(startTime);
        osc.stop(startTime + 0.12);
      });
    } catch { /* ignore */ }
  },

  /**
   * Item caught in basket
   */
  playCatch() {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      osc.type = "sine";
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.08);

      osc.start(now);
      osc.stop(now + 0.08);

      if (typeof window !== "undefined" && window.navigator?.vibrate) {
        window.navigator.vibrate(20);
      }
    } catch { /* ignore */ }
  },

  /**
   * Bonus Star/Gem Caught
   */
  playBonus() {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [784, 1046, 1318].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const startTime = now + i * 0.05;
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.linearRampToValueAtTime(0.001, startTime + 0.12);

        osc.start(startTime);
        osc.stop(startTime + 0.12);
      });

      if (typeof window !== "undefined" && window.navigator?.vibrate) {
        window.navigator.vibrate([30, 40, 50]);
      }
    } catch { /* ignore */ }
  },

  /**
   * Missed item or obstacle strike
   */
  playMiss() {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.15);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.15);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch { /* ignore */ }
  },

  /**
   * Game Over / Collapse / Crash
   */
  playCrash() {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.45);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.45);

      osc.start(now);
      osc.stop(now + 0.45);

      if (typeof window !== "undefined" && window.navigator?.vibrate) {
        window.navigator.vibrate([100, 50, 200]);
      }
    } catch { /* ignore */ }
  },
};
