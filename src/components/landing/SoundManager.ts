export class SoundManager {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  private isMuted: boolean = true;
  private initialized: boolean = false;

  constructor() {
    // Audio is muted by default until user interaction / activation
  }

  public init() {
    if (this.initialized || typeof window === "undefined") return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.initialized = true;

      // Set up ambient drone
      this.setupAmbient();
    } catch (e) {
      console.warn("Failed to initialize Web Audio:", e);
    }
  }

  private setupAmbient() {
    if (!this.ctx) return;

    // Main gain node for ambient drone
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);

    // Low-pass filter to make it deep and cinematic
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(220, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.0, this.ctx.currentTime);

    // Two oscillators tuned to deep harmonics (e.g. F2 and C3)
    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = "sawtooth";
    this.osc1.frequency.setValueAtTime(87.31, this.ctx.currentTime); // F2

    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = "triangle";
    this.osc2.frequency.setValueAtTime(130.81, this.ctx.currentTime); // C3

    // Modulator (LFO) to create a gentle, breathing swell
    this.lfo = this.ctx.createOscillator();
    this.lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime); // 0.2 Hz
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    // Connect LFO to filter frequency for gentle sweeps
    this.lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    // Connect oscillators to filter
    this.osc1.connect(filter);
    this.osc2.connect(filter);

    // Connect filter to main ambient gain, then to destination
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.ctx.destination);

    // Start oscillators
    this.osc1.start(0);
    this.osc2.start(0);
    this.lfo.start(0);
  }

  public setMute(mute: boolean) {
    this.isMuted = mute;

    if (typeof window === "undefined" || !this.initialized) return;

    // Resume AudioContext if suspended (browser security)
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(err => console.warn(err));
    }

    if (!this.ambientGain || !this.ctx) return;

    const targetVolume = mute ? 0 : 0.25; // soft background volume
    const duration = 1.8; // fade in/out duration in seconds

    // Smoothly transition volume to avoid popping
    this.ambientGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, this.ctx.currentTime);
    this.ambientGain.gain.linearRampToValueAtTime(targetVolume, this.ctx.currentTime + duration);
  }

  public toggleMute(): boolean {
    const nextState = !this.isMuted;
    this.setMute(nextState);
    return nextState;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playClick() {
    if (this.isMuted || !this.ctx || !this.initialized) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      // High-pitched digital click
      osc.frequency.setValueAtTime(950, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {
      // Audio failed, ignore
    }
  }

  public playHover() {
    if (this.isMuted || !this.ctx || !this.initialized) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.015, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    } catch (e) {
      // Audio failed, ignore
    }
  }

  public destroy() {
    try {
      if (this.osc1) this.osc1.stop();
      if (this.osc2) this.osc2.stop();
      if (this.lfo) this.lfo.stop();
      if (this.ctx) this.ctx.close();
    } catch (e) {
      // Ignore cleanup failures
    }
  }
}

// Export a single instance to be used across components
export const soundManager = new SoundManager();
