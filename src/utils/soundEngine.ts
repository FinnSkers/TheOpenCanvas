// Sound Engine utilizing Web Audio API for zero-dependency sound synthesis + spatial audio

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  constructor() {
    // Lazy initialize on first user interaction
    const savedMute = localStorage.getItem('theopencanvas_mute');
    if (savedMute !== null) {
      this.isMuted = savedMute === 'true';
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.6;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('theopencanvas_mute', String(this.isMuted));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.6, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Plays a synthesized meme or action sound effect
   * @param name Name of the sound
   * @param worldPos Optional (x, y) coordinates for spatial audio panning
   * @param cameraPos Current camera center (x, y)
   */
  public play(name: string, worldPos?: { x: number; y: number }, cameraPos?: { x: number; y: number }) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    // Calculate spatial panning and distance attenuation
    let pan = 0;
    let distanceGain = 1.0;

    if (worldPos && cameraPos) {
      const dx = worldPos.x - cameraPos.x;
      const dy = worldPos.y - cameraPos.y;
      const distance = Math.hypot(dx, dy);

      // Max hearing radius ~ 2500px
      const maxDistance = 2500;
      distanceGain = Math.max(0.1, 1 - distance / maxDistance);
      pan = Math.max(-1, Math.min(1, dx / 1000));
    }

    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.setValueAtTime(pan, this.ctx.currentTime);
      panner.connect(this.masterGain);
    }

    const localGain = this.ctx.createGain();
    localGain.gain.setValueAtTime(distanceGain, this.ctx.currentTime);
    if (panner) {
      localGain.connect(panner);
    } else {
      localGain.connect(this.masterGain);
    }

    const t = this.ctx.currentTime;

    switch (name) {
      case 'pop':
      case 'stamp':
        this.synthPop(localGain, t);
        break;
      case 'vine-boom':
        this.synthVineBoom(localGain, t);
        break;
      case 'airhorn':
        this.synthAirhorn(localGain, t);
        break;
      case 'boing':
      case 'bounce':
        this.synthBoing(localGain, t);
        break;
      case 'quack':
        this.synthQuack(localGain, t);
        break;
      case 'laser':
        this.synthLaser(localGain, t);
        break;
      case 'nuke':
      case 'explosion':
        this.synthExplosion(localGain, t);
        break;
      case 'high-five':
        this.synthHighFive(localGain, t);
        break;
      case 'whoosh':
        this.synthWhoosh(localGain, t);
        break;
      default:
        this.synthPop(localGain, t);
        break;
    }
  }

  // 1. Crisp tactile bubble/sticker pop
  private synthPop(dest: GainNode, t: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.05);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  // 2. The legendary Vine Boom (deep distorted sub-bass drop)
  private synthVineBoom(dest: GainNode, t: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const distortion = this.ctx.createWaveShaper();

    // Distortion curve for that crunchy bass crunch
    const n = 256;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; ++i) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + 10) * x * 20 * (Math.PI / 180)) / (Math.PI + 10 * Math.abs(x));
    }
    distortion.curve = curve;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(32, t + 0.9);

    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    osc.connect(distortion);
    distortion.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 1.2);
  }

  // 3. MLG Airhorn synth chords
  private synthAirhorn(dest: GainNode, t: number) {
    if (!this.ctx) return;
    const freqs = [466.16, 554.37, 622.25]; // Bb4, Db5, Eb5
    freqs.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.98, t + 0.25);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(t);
      osc.stop(t + 0.26);
    });
  }

  // 4. Cartoon Spring Boing
  private synthBoing(dest: GainNode, t: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.linearRampToValueAtTime(550, t + 0.18);
    osc.frequency.linearRampToValueAtTime(300, t + 0.35);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.42);
  }

  // 5. Quack (FM resonance synthesis)
  private synthQuack(dest: GainNode, t: number) {
    if (!this.ctx) return;
    const carrier = this.ctx.createOscillator();
    const modulator = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(280, t);
    carrier.frequency.exponentialRampToValueAtTime(160, t + 0.2);

    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(45, t);

    modGain.gain.setValueAtTime(120, t);
    modGain.gain.exponentialRampToValueAtTime(10, t + 0.2);

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    carrier.connect(gain);
    gain.connect(dest);

    modulator.start(t);
    carrier.start(t);
    modulator.stop(t + 0.26);
    carrier.stop(t + 0.26);
  }

  // 6. Laser Chirp
  private synthLaser(dest: GainNode, t: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  // 7. Heavy Meme Nuke Explosion
  private synthExplosion(dest: GainNode, t: number) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 1.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(40, t + 1.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(t);
    noise.stop(t + 1.5);
  }

  // 8. High Five Clap + Chime
  private synthHighFive(dest: GainNode, t: number) {
    if (!this.ctx) return;
    // Clap noise
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    noise.connect(gain);
    gain.connect(dest);
    noise.start(t);

    // Friendly chime
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t + 0.05);
    osc.frequency.exponentialRampToValueAtTime(1760, t + 0.25);
    oscGain.gain.setValueAtTime(0.4, t + 0.05);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(oscGain);
    oscGain.connect(dest);
    osc.start(t + 0.05);
    osc.stop(t + 0.3);
  }

  // 9. Quick whoosh
  private synthWhoosh(dest: GainNode, t: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.18);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.21);
  }
}

export const soundEngine = new SoundEngine();
