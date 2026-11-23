// ============================================================================
// audio.js - Prozedurale Soundeffekte (WebAudio), Meeresrauschen, Segelflattern,
//            Meeresstrudel-Sog, Holzsplittern, Fernglas & Sprachrohr-Signalhorn
// ============================================================================

const SoundFX = {
  ctx: null,
  muted: localStorage.getItem('blood_doubloons_sfx_mute') === '1',
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (window.AmbientSeaAudio) AmbientSeaAudio.ensureStarted();
  },
  play(type) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      if (type === 'cannon' || type === 'broadside' || type === 'ghost_cannon') {
        const isBroad = type === 'broadside';
        const isGhost = type === 'ghost_cannon';
        const dur = isBroad ? 0.72 : 0.48;
        const bufferSize = Math.floor(this.ctx.sampleRate * dur);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          const env = Math.exp(-i / (this.ctx.sampleRate * (isBroad ? 0.20 : 0.12)));
          data[i] = (Math.random() * 2 - 1) * env;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = isGhost ? 'bandpass' : 'lowpass';
        filter.frequency.setValueAtTime(isGhost ? 480 : (isBroad ? 280 : 320), now);
        filter.frequency.exponentialRampToValueAtTime(isGhost ? 110 : 48, now + dur);

        const subOsc = this.ctx.createOscillator();
        subOsc.type = isGhost ? 'sawtooth' : 'sine';
        subOsc.frequency.setValueAtTime(isGhost ? 190 : (isBroad ? 90 : 112), now);
        subOsc.frequency.exponentialRampToValueAtTime(isGhost ? 52 : 25, now + dur * 0.85);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(isBroad ? 0.65 : 0.48, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + dur);

        noise.connect(filter);
        filter.connect(gain);
        subOsc.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
        subOsc.start(now);
        subOsc.stop(now + dur);
      } else if (type === 'hit' || type === 'splinter') {
        const isSplinter = type === 'splinter';
        const dur = isSplinter ? 0.34 : 0.25;
        const bufferSize = Math.floor(this.ctx.sampleRate * dur);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          const crackle = isSplinter && (i % 180 < 25) ? 1.4 : 1.0;
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.07)) * crackle;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(isSplinter ? 820 : 520, now);

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(isSplinter ? 210 : 160, now);
        osc.frequency.exponentialRampToValueAtTime(42, now + dur * 0.9);
        gain.gain.setValueAtTime(0.36, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + dur);

        noise.connect(filter);
        filter.connect(gain);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
        osc.start(now);
        osc.stop(now + dur);
      } else if (type === 'spyglass') {
        // Metallisches Ausziehen des Messing-Fernrohrs
        [520, 780].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.28, now + idx * 0.06 + 0.09);
          g.gain.setValueAtTime(0.14, now + idx * 0.06);
          g.gain.exponentialRampToValueAtTime(0.008, now + idx * 0.06 + 0.10);
          osc.connect(g);
          g.connect(this.ctx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.10);
        });
      } else if (type === 'horn') {
        // Warmes Muschel-/Messinghorn für Proximity-Rufe & Kontaktanfragen [U]
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        osc1.type = 'sawtooth';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(220, now);
        osc1.frequency.linearRampToValueAtTime(246.9, now + 0.38);
        osc2.frequency.setValueAtTime(330, now);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(680, now);
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.008, now + 0.48);
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.48);
        osc2.stop(now + 0.48);
      } else if (type === 'coin') {
        const freqs = [880, 1108.7, 1318.5, 1760];
        freqs.forEach((f, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + idx * 0.045);
          gain.gain.setValueAtTime(0.16, now + idx * 0.045);
          gain.gain.exponentialRampToValueAtTime(0.008, now + idx * 0.045 + 0.24);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.045);
          osc.stop(now + idx * 0.045 + 0.24);
        });
      } else if (type === 'sword') {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc1.type = 'sawtooth';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(1420, now);
        osc1.frequency.exponentialRampToValueAtTime(380, now + 0.16);
        osc2.frequency.setValueAtTime(2150, now);
        osc2.frequency.exponentialRampToValueAtTime(620, now + 0.16);
        gain.gain.setValueAtTime(0.24, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.18);
        osc2.stop(now + 0.18);
      } else if (type === 'thunder' || type === 'voodoo' || type === 'whirlpool_roar') {
        const isVoodoo = type === 'voodoo';
        const isWhirl = type === 'whirlpool_roar';
        const dur = isVoodoo ? 0.95 : (isWhirl ? 1.15 : 0.85);
        const bufferSize = Math.floor(this.ctx.sampleRate * dur);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * (isWhirl ? 0.45 : 0.32)));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = isVoodoo ? 'bandpass' : 'lowpass';
        filter.frequency.setValueAtTime(isVoodoo ? 260 : (isWhirl ? 135 : 170), now);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(isWhirl ? 0.36 : 0.42, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + dur);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
      } else if (type === 'dice' || type === 'card' || type === 'sail_flap') {
        const isFlap = type === 'sail_flap';
        const dur = isFlap ? 0.22 : 0.09;
        if (isFlap) {
          const bSize = Math.floor(this.ctx.sampleRate * dur);
          const buf = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
          const ch = buf.getChannelData(0);
          for (let i = 0; i < bSize; i++) {
            ch[i] = (Math.random() * 2 - 1) * Math.sin((i / bSize) * Math.PI) * 0.5;
          }
          const src = this.ctx.createBufferSource();
          src.buffer = buf;
          const flt = this.ctx.createBiquadFilter();
          flt.type = 'bandpass';
          flt.frequency.setValueAtTime(340, now);
          const g = this.ctx.createGain();
          g.gain.setValueAtTime(0.14, now);
          g.gain.exponentialRampToValueAtTime(0.008, now + dur);
          src.connect(flt);
          flt.connect(g);
          g.connect(this.ctx.destination);
          src.start(now);
        } else {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(type === 'dice' ? 620 : 440, now);
          osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);
          gain.gain.setValueAtTime(0.22, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.09);
        }
      } else if (type === 'splash') {
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.35);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.12));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(680, now);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
      }
    } catch (e) {}
  }
};

window.SoundFX = SoundFX;

window.AmbientSeaAudio = {
  started: false,
  muted: localStorage.getItem('blood_doubloons_ambient_mute') === '1',
  seaGain: null,
  sailGain: null,
  vortexGain: null,
  sailFilter: null,
  flapTimer: 0,
  ensureStarted() {
    if (this.started || !SoundFX.ctx) return;
    try {
      const actx = SoundFX.ctx;
      const sampleRate = actx.sampleRate;
      const len = sampleRate * 4;
      const pinkBuf = actx.createBuffer(1, len, sampleRate);
      const out = pinkBuf.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + white * 0.0990460;
        b1 = 0.96300 * b1 + white * 0.2965164;
        b2 = 0.57000 * b2 + white * 1.0526913;
        out[i] = (b0 + b1 + b2 + white * 0.1848) * 0.09;
      }

      const seaSrc = actx.createBufferSource();
      seaSrc.buffer = pinkBuf;
      seaSrc.loop = true;

      const seaFilter = actx.createBiquadFilter();
      seaFilter.type = 'lowpass';
      seaFilter.frequency.value = 320;

      const waveLfo = actx.createOscillator();
      waveLfo.type = 'sine';
      waveLfo.frequency.value = 0.14;
      const waveLfoGain = actx.createGain();
      waveLfoGain.gain.value = 140;
      waveLfo.connect(waveLfoGain);
      waveLfoGain.connect(seaFilter.frequency);

      this.seaGain = actx.createGain();
      this.seaGain.gain.value = 0.0;

      seaSrc.connect(seaFilter);
      seaFilter.connect(this.seaGain);
      this.seaGain.connect(actx.destination);

      const sailSrc = actx.createBufferSource();
      sailSrc.buffer = pinkBuf;
      sailSrc.loop = true;

      this.sailFilter = actx.createBiquadFilter();
      this.sailFilter.type = 'bandpass';
      this.sailFilter.frequency.value = 540;
      this.sailFilter.Q.value = 1.4;

      this.sailGain = actx.createGain();
      this.sailGain.gain.value = 0.0;

      sailSrc.connect(this.sailFilter);
      this.sailFilter.connect(this.sailGain);
      this.sailGain.connect(actx.destination);

      // Tiefer Sog-Kanal für Meeresstrudel in der Nähe
      const vortexSrc = actx.createBufferSource();
      vortexSrc.buffer = pinkBuf;
      vortexSrc.loop = true;
      const vortexFilter = actx.createBiquadFilter();
      vortexFilter.type = 'lowpass';
      vortexFilter.frequency.value = 135;
      this.vortexGain = actx.createGain();
      this.vortexGain.gain.value = 0.0;
      vortexSrc.connect(vortexFilter);
      vortexFilter.connect(this.vortexGain);
      this.vortexGain.connect(actx.destination);

      seaSrc.start();
      waveLfo.start();
      sailSrc.start();
      vortexSrc.start();
      this.started = true;
    } catch (e) {}
  },
  update(dtScale = 1, isMainMenuOpen = false, shipSpeed = 0, sailSetting = 0, windSpeed = 1, inStorm = false, whirlpoolProximity = 0) {
    if (!this.started || !SoundFX.ctx) return;
    const now = SoundFX.ctx.currentTime;
    if (this.muted || SoundFX.muted || isMainMenuOpen) {
      this.seaGain.gain.setTargetAtTime(0.0, now, 0.25);
      this.sailGain.gain.setTargetAtTime(0.0, now, 0.25);
      if (this.vortexGain) this.vortexGain.gain.setTargetAtTime(0.0, now, 0.25);
      return;
    }

    const stormBoost = inStorm ? 1.85 : 1.0;
    const targetSea = Math.min(0.24, (0.045 + (shipSpeed * 0.022) + (windSpeed * 0.02)) * stormBoost);
    const targetSail = sailSetting > 0
      ? Math.min(0.18, (0.015 + (sailSetting / 3) * 0.045 * windSpeed) * stormBoost)
      : 0.004;

    this.seaGain.gain.setTargetAtTime(targetSea, now, 0.35);
    this.sailGain.gain.setTargetAtTime(targetSail, now, 0.35);
    if (this.vortexGain) {
      this.vortexGain.gain.setTargetAtTime(Math.min(0.32, whirlpoolProximity * 0.30), now, 0.30);
    }
    if (this.sailFilter) {
      this.sailFilter.frequency.setTargetAtTime(420 + shipSpeed * 110 + windSpeed * 90, now, 0.4);
    }

    if (sailSetting > 0) {
      this.flapTimer -= dtScale;
      if (this.flapTimer <= 0) {
        this.flapTimer = (inStorm ? 130 : 280) + Math.random() * 260;
        SoundFX.play('sail_flap');
      }
    }
  },
  toggle() {
    this.muted = !this.muted;
    localStorage.setItem('blood_doubloons_ambient_mute', this.muted ? '1' : '0');
    SoundFX.init();
  }
};

window.addEventListener('pointerdown', () => SoundFX.init(), { once: true });
window.addEventListener('keydown', () => SoundFX.init(), { once: true });

window.toggleAudioMute = function() {
  SoundFX.muted = !SoundFX.muted;
  localStorage.setItem('blood_doubloons_sfx_mute', SoundFX.muted ? '1' : '0');
  const btn = document.getElementById('muteBtnHud');
  if (btn) btn.textContent = SoundFX.muted ? '🔇' : '🔊';
  if (window.renderOptionsModal && document.getElementById('optionsOverlay').classList.contains('active')) {
    renderOptionsModal();
  }
};

window.toggleAmbientAudio = function() {
  AmbientSeaAudio.toggle();
  if (window.renderOptionsModal && document.getElementById('optionsOverlay').classList.contains('active')) {
    renderOptionsModal();
  }
};