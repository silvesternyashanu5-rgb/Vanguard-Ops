/**
 * Procedural Web Audio Sound Engine for Vanguard Ops
 * High-fidelity, zero-404 military tactical audio synthesized entirely in browser.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;
  private ambientOsc: OscillatorNode | null = null;

  constructor() {
    // AudioContext will be lazily created on first user gesture
  }

  public init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.8;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.9;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.35;
      this.musicGain.connect(this.masterGain);

      this.isInitialized = true;
    } catch (e) {
      console.warn('AudioContext not supported or blocked:', e);
    }
  }

  public setVolumes(master: number, sfx: number, music: number) {
    if (!this.ctx) return;
    if (this.masterGain) this.masterGain.gain.value = master;
    if (this.sfxGain) this.sfxGain.gain.value = sfx;
    if (this.musicGain) this.musicGain.gain.value = music;
  }

  // --- Attack & Gunshot SFX ---
  public playGunshot(type: string, isQuadDamage: boolean = false) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    if (type === 'fist') {
      // Thunderous Heroic Punch / Kinetic Shockwave
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isQuadDamage ? 140 : 110, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.22);

      gain.gain.setValueAtTime(isQuadDamage ? 0.9 : 0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.28);

      // Concussive air whoosh
      const whoosh = this.ctx.createOscillator();
      const wGain = this.ctx.createGain();
      whoosh.type = 'sawtooth';
      whoosh.frequency.setValueAtTime(450, now);
      whoosh.frequency.exponentialRampToValueAtTime(60, now + 0.16);
      wGain.gain.setValueAtTime(0.4, now);
      wGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      whoosh.connect(wGain);
      wGain.connect(this.sfxGain);
      whoosh.start(now);
      whoosh.stop(now + 0.19);
      return;
    }

    if (type === 'ki_blast') {
      // Iconic Dragon Ball Ki Blast Chirp
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(980, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.12);

      gain.gain.setValueAtTime(0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.16);
      return;
    }

    if (type === 'beam') {
      // Kamehameha Continuous Beam Blast
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.linearRampToValueAtTime(220, now + 0.3);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      gain.gain.setValueAtTime(0.85, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.45);
      return;
    }

    if (type === 'energy_ball') {
      // Spirit Bomb Celestial Detonation
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.6);

      gain.gain.setValueAtTime(0.95, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.8);
      return;
    }

    if (type === 'kryptonian_strike') {
      // Heavy Kryptonian impact shockwave
      const sub = this.ctx.createOscillator();
      const sGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(125, now);
      sub.frequency.exponentialRampToValueAtTime(22, now + 0.34);
      sGain.gain.setValueAtTime(0.95, now);
      sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
      sub.connect(sGain);
      sGain.connect(this.sfxGain);
      sub.start(now);
      sub.stop(now + 0.38);

      const crack = this.ctx.createOscillator();
      const cGain = this.ctx.createGain();
      crack.type = 'sawtooth';
      crack.frequency.setValueAtTime(720, now);
      crack.frequency.exponentialRampToValueAtTime(55, now + 0.18);
      cGain.gain.setValueAtTime(0.45, now);
      cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      crack.connect(cGain);
      cGain.connect(this.sfxGain);
      crack.start(now);
      crack.stop(now + 0.21);
      return;
    }

    if (type === 'heat_vision') {
      // Focused crimson optical laser pulse
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(185, now + 0.14);
      gain.gain.setValueAtTime(0.42, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.16);
      return;
    }

    if (type === 'super_breath') {
      this.playSuperBreath();
      return;
    }

    if (type === 'arcane_bolt') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1180, now);
      osc.frequency.exponentialRampToValueAtTime(340, now + 0.14);
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.16);
      return;
    }

    if (type === 'rune_beam') {
      const osc = this.ctx.createOscillator();
      const chime = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.linearRampToValueAtTime(420, now + 0.25);
      chime.type = 'sine';
      chime.frequency.setValueAtTime(1046, now);
      chime.frequency.exponentialRampToValueAtTime(523, now + 0.35);
      gain.gain.setValueAtTime(0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.connect(gain);
      chime.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      chime.start(now);
      osc.stop(now + 0.4);
      chime.stop(now + 0.4);
      return;
    }

    if (type === 'chronos_orb') {
      this.playChronoStasis();
      return;
    }

    if (type === 'void_nova') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.35);
      gain.gain.setValueAtTime(0.75, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.4);
      return;
    }

    if (type === 'king_engine' || type === 'king_wave') {
      this.playKingEngine(type === 'king_wave');
      return;
    }

    if (type === 'speed_lightning' || type === 'lightning_arc') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1480, now);
      osc.frequency.exponentialRampToValueAtTime(360, now + 0.11);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.13);
      return;
    }

    if (type === 'speed_punch' || type === 'lantern_hammer' || type === 'mjolnir_strike') {
      this.playThorMjolnir();
      return;
    }

    if (type === 'silvester_gauntlet') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1280, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);
      gain.gain.setValueAtTime(0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.14);
      return;
    }

    if (type === 'silvester_blade' || type === 'silvester_cannon') {
      this.playSilvesterOmega(type === 'silvester_blade' ? 'roar' : 'apocalypse');
      return;
    }

    if (type === 'sonic_bass' || type === 'sonic_boom') {
      this.playDreBass(type === 'sonic_boom');
      return;
    }

    if (type === 'truth_ray' || type === 'truth_prism') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(type === 'truth_ray' ? 1420 : 1850, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.13);
      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.15);
      return;
    }

    if (type === 'star_lance' || type === 'petal_storm') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(type === 'star_lance' ? 1680 : 1120, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.12);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.14);
      return;
    }

    if (type === 'bottle_blaster' || type === 'tantrum_smash') {
      this.playBabyTantrum(type === 'tantrum_smash');
      return;
    }

    if (type === 'nichirin_thunder' || type === 'thunder_flash') {
      this.playZenitsuThunder(type === 'thunder_flash');
      return;
    }

    if (type === 'water_slash' || type === 'sun_flame') {
      this.playTanjiroBreath(type === 'sun_flame');
      return;
    }

    if (type === 'demon_whip' || type === 'blood_thorn') {
      this.playMuzanBlood(type === 'blood_thorn');
      return;
    }

    if (type === 'lantern_beam') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(760, now);
      osc.frequency.exponentialRampToValueAtTime(290, now + 0.13);
      gain.gain.setValueAtTime(0.36, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.15);
      return;
    }

    if (
      type === 'repulsor_beam' ||
      type === 'unibeam' ||
      type === 'eldritch_bolt' ||
      type === 'eldritch_whip' ||
      type === 'chaos_hex' ||
      type === 'chaos_rift' ||
      type === 'limitless_blue' ||
      type === 'hollow_purple' ||
      type === 'jio_graze'
    ) {
      const isHeavy = type === 'unibeam' || type === 'hollow_purple' || type === 'chaos_rift';
      this.playHeroSignature(type === 'repulsor_beam' || type === 'unibeam' ? 'tech' : type === 'jio_graze' ? 'flame' : 'cosmic', isHeavy);
      return;
    }

    if (
      type === 'web_shooter' ||
      type === 'web_gauntlet' ||
      type === 'batarang' ||
      type === 'bat_gauntlet' ||
      type === 'shinobi_kunai' ||
      type === 'uchiha_kunai'
    ) {
      const isHeavy = type === 'web_gauntlet' || type === 'bat_gauntlet';
      this.playHeroSignature('tech', isHeavy);
      return;
    }

    if (
      type === 'amazon_sword' ||
      type === 'lasso_truth' ||
      type === 'tempest_katana' ||
      type === 'monarch_daggers' ||
      type === 'kamish_wrath' ||
      type === 'venuzdonoa_blade' ||
      type === 'totsuka_blade' ||
      type === 'chidori_blade' ||
      type === 'indra_arrow'
    ) {
      const style = type === 'monarch_daggers' || type === 'kamish_wrath' || type === 'venuzdonoa_blade' ? 'shadow' : type === 'chidori_blade' || type === 'indra_arrow' ? 'energy' : 'slash';
      this.playHeroSignature(style, type === 'indra_arrow' || type === 'kamish_wrath' || type === 'venuzdonoa_blade' || type === 'totsuka_blade');
      return;
    }

    if (
      type === 'trident_bolt' ||
      type === 'hydro_lance' ||
      type === 'megiddo_ray' ||
      type === 'rasengan_orb' ||
      type === 'gum_pistol' ||
      type === 'haki_fist' ||
      type === 'divergent_fist' ||
      type === 'blood_pierce' ||
      type === 'water_stream_fist' ||
      type === 'cosmic_fist'
    ) {
      const style = type === 'trident_bolt' || type === 'hydro_lance' || type === 'megiddo_ray' || type === 'water_stream_fist' ? 'water' : type === 'cosmic_fist' ? 'cosmic' : type === 'blood_pierce' ? 'flame' : 'energy';
      this.playHeroSignature(style, type === 'haki_fist' || type === 'cosmic_fist' || type === 'megiddo_ray');
      return;
    }

    if (type === 'knife') {
      // Swish sound
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(3, now);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.16);
      return;
    }

    // Realistic multi-stage acoustic gunfire:
    // 1. Transient noise snap (crack of powder discharge)
    // 2. Sub punch oscillator (barrel resonance)
    // 3. Body decay / tail echo

    const bufferSize = this.ctx.sampleRate * (type === 'sniper' ? 0.45 : type === 'shotgun' ? 0.35 : 0.18);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(type === 'sniper' ? 4500 : type === 'smg' ? 3200 : 3800, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(300, now + (type === 'sniper' ? 0.35 : 0.15));

    const noiseGain = this.ctx.createGain();
    const peakGain = (type === 'sniper' ? 1.0 : type === 'shotgun' ? 0.95 : 0.7) * (isQuadDamage ? 1.4 : 1.0);
    noiseGain.gain.setValueAtTime(peakGain, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + (type === 'sniper' ? 0.4 : 0.18));

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    whiteNoise.start(now);
    whiteNoise.stop(now + (type === 'sniper' ? 0.45 : 0.2));

    // Low-end Thud/Punch
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();

    subOsc.type = isQuadDamage ? 'sawtooth' : 'triangle';
    const startFreq = type === 'sniper' ? 180 : type === 'shotgun' ? 150 : 220;
    subOsc.frequency.setValueAtTime(startFreq, now);
    subOsc.frequency.exponentialRampToValueAtTime(type === 'sniper' ? 35 : 45, now + 0.12);

    subGain.gain.setValueAtTime(isQuadDamage ? 0.8 : 0.6, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);

    subOsc.start(now);
    subOsc.stop(now + 0.15);
  }

  // Tactical Hitmarker tick
  public playHitmarker(isHeadshot: boolean = false) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (isHeadshot) {
      // High metallic chime + secondary ring
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.18);

      gain.gain.setValueAtTime(0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      // Extra bell harmonic
      const harm = this.ctx.createOscillator();
      const harmGain = this.ctx.createGain();
      harm.type = 'sine';
      harm.frequency.setValueAtTime(3600, now);
      harmGain.gain.setValueAtTime(0.4, now);
      harmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      harm.connect(harmGain);
      harmGain.connect(this.sfxGain);
      harm.start(now);
      harm.stop(now + 0.23);
    } else {
      // Crisp "tik" hit indicator
      osc.type = 'square';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    }

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + (isHeadshot ? 0.22 : 0.06));
  }

  // Reload sound effects
  public playReload(phase: 'mag_out' | 'mag_in' | 'bolt') {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (phase === 'mag_out') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    } else if (phase === 'mag_in') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.07);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    } else {
      // Bolt rack clank
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(250, now + 0.12);
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    }

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  // Power-up pickup chime
  public playPowerUp(type: 'quad_damage' | 'speed' | 'health' | 'armor' | 'ammo') {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const freqs = type === 'quad_damage' ? [220, 330, 440, 660, 880] :
                  type === 'speed' ? [440, 554, 659, 880] :
                  type === 'health' ? [330, 440, 550, 660] :
                  type === 'armor' ? [200, 300, 450, 600] :
                  [300, 450, 600];

    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.25, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.22);
    });
  }


  // Tactical UI Click
  public playUIClick(type: 'select' | 'back' | 'deploy' | 'tab' = 'select') {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    if (type === 'deploy') {
      // Big dramatic war horn / heavy cinematic bass hit
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(110, now);
      osc1.frequency.exponentialRampToValueAtTime(45, now + 0.6);

      osc2.frequency.setValueAtTime(112, now);
      osc2.frequency.exponentialRampToValueAtTime(45, now + 0.6);

      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.75);
      osc2.stop(now + 0.75);
      return;
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'back') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.06);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    } else if (type === 'tab') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    }

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Tactical Announcer / Voice Lines using Web Speech API or modulated synth tones
  public playAnnouncer(event: 'match_start' | 'double_kill' | 'triple_kill' | 'rampage' | 'quad_damage' | 'victory' | 'defeat') {
    // 1. Play tactical radio beep burst
    this.playRadioChirp();

    // 2. Announce with SpeechSynthesis if available
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // clear previous
      const textMap: Record<string, string> = {
        match_start: 'Mission active. Eliminate all hostiles.',
        double_kill: 'Double Kill!',
        triple_kill: 'Triple Kill!',
        rampage: 'Unstoppable Rampage!',
        quad_damage: 'Quad Damage activated.',
        victory: 'Tactical Victory. Well done operator.',
        defeat: 'Mission Failed. Regroup and redeploy.'
      };

      const text = textMap[event] || event;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 0.85; // deep tactical radio voice
      utterance.volume = 0.85;

      // Select voice if available
      const voices = window.speechSynthesis.getVoices();
      const engVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('Natural')));
      if (engVoice) {
        utterance.voice = engVoice;
      }

      window.speechSynthesis.speak(utterance);
    }
  }

  private playRadioChirp() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.setValueAtTime(1800, now + 0.03);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Damage taken groan/grunt
  public playDamageTaken() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Realistic Tactical Footsteps
  public playFootstep(surface: 'concrete' | 'dirt' | 'metal' | 'sand' = 'concrete', pan: number = 0) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.06;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = surface === 'metal' ? 'bandpass' : 'lowpass';
    filter.frequency.setValueAtTime(surface === 'metal' ? 1200 : surface === 'dirt' ? 450 : 650, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

    noise.connect(filter);
    filter.connect(gain);

    // Stereo Panning for Left/Right Foot
    if ('createStereoPanner' in this.ctx) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.setValueAtTime(Math.max(-0.6, Math.min(0.6, pan)), now);
      gain.connect(panner);
      panner.connect(this.sfxGain);
    } else {
      gain.connect(this.sfxGain);
    }

    noise.start(now);
    noise.stop(now + 0.06);
  }

  // Low Health Tension Heartbeat (Lub-Dub pulse)
  public playHeartbeat() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // First thump (Lub)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(75, now);
    osc1.frequency.exponentialRampToValueAtTime(35, now + 0.12);
    gain1.gain.setValueAtTime(0.5, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Second thump (Dub) 120ms later
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(65, now + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(30, now + 0.26);
    gain2.gain.setValueAtTime(0.42, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.3);
  }

  // Shell Casing metallic tink
  public playShellCasing() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2800 + Math.random() * 400, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Jump landing heavy body thud
  public playJumpLand() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.18);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Ambient combat drone for menus / arena atmosphere
  public startAmbientLoop() {
    this.init();
    if (!this.ctx || !this.musicGain || this.ambientOsc) return;

    try {
      this.ambientOsc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      this.ambientOsc.type = 'sawtooth';
      this.ambientOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 bass drone

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);

      this.ambientOsc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      this.ambientOsc.start();
    } catch {
      // Ignored
    }
  }

  public stopAmbientLoop() {
    if (this.ambientOsc) {
      try {
        this.ambientOsc.stop();
        this.ambientOsc.disconnect();
      } catch {
        // Ignored
      }
      this.ambientOsc = null;
    }
  }

  // --- Tactical Comms Audio & Radio ---
  public playQuickComms(text: string) {
    this.init();
    this.playRadioChirp();

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.15;
      utterance.pitch = 0.95;
      utterance.volume = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }

  // --- Powers & Ability Audio ---
  private kiOsc: OscillatorNode | null = null;
  private kiGain: GainNode | null = null;

  public playKiCharge(active: boolean) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    if (active) {
      if (this.kiOsc) return; // already charging
      const now = this.ctx.currentTime;
      this.kiOsc = this.ctx.createOscillator();
      this.kiGain = this.ctx.createGain();

      this.kiOsc.type = 'sawtooth';
      this.kiOsc.frequency.setValueAtTime(130, now);
      this.kiOsc.frequency.exponentialRampToValueAtTime(520, now + 1.5);

      this.kiGain.gain.setValueAtTime(0.01, now);
      this.kiGain.gain.linearRampToValueAtTime(0.35, now + 0.3);

      this.kiOsc.connect(this.kiGain);
      this.kiGain.connect(this.sfxGain);
      this.kiOsc.start(now);
    } else {
      if (this.kiOsc && this.kiGain && this.ctx) {
        const now = this.ctx.currentTime;
        this.kiGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        try {
          this.kiOsc.stop(now + 0.12);
        } catch {
          // Ignored
        }
        this.kiOsc = null;
        this.kiGain = null;
      }
    }
  }

  public playSeriousPunch() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Immense subsonic planetary shockwave
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(80, now);
    subOsc.frequency.exponentialRampToValueAtTime(15, now + 1.2);

    subGain.gain.setValueAtTime(1.0, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(now);
    subOsc.stop(now + 1.4);

    // Sonic boom cracking air
    const crackOsc = this.ctx.createOscillator();
    const crackGain = this.ctx.createGain();
    crackOsc.type = 'sawtooth';
    crackOsc.frequency.setValueAtTime(1600, now);
    crackOsc.frequency.exponentialRampToValueAtTime(90, now + 0.4);

    crackGain.gain.setValueAtTime(0.8, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    crackOsc.connect(crackGain);
    crackGain.connect(this.sfxGain);
    crackOsc.start(now);
    crackOsc.stop(now + 0.45);
  }

  public playKamehameha() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.4);
    osc.frequency.exponentialRampToValueAtTime(220, now + 1.0);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 1.15);
  }

  public playAwardUnlock() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const chords = [523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio
    chords.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0.3, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.45);
    });
  }

  public playLevelUp() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const notes = [440, 554.37, 659.25, 880, 1108.73]; // A Major fanfare
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0.25, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.38);
    });
  }

  // --- Open-Air Environmental Echo Matrix & Kinetic Shockwave SFX ---
  public playShockwaveImpact(magnitude: number = 3.0) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const clampedMag = Math.max(0.8, Math.min(6.0, magnitude));
    const gainScale = Math.min(1.0, 0.38 + clampedMag * 0.12);

    // 1. Sub-bass atmospheric pressure thump
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(95 + clampedMag * 8, now);
    subOsc.frequency.exponentialRampToValueAtTime(20, now + 0.55);
    subGain.gain.setValueAtTime(gainScale, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(now);
    subOsc.stop(now + 0.68);

    // 2. Open-Air Echo Delay Taps (Environmental Echo Matrix)
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
    const noiseBuf = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.16));
    }

    const echoDelays = [0, 0.14, 0.31];
    echoDelays.forEach((delaySec, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const src = this.ctx.createBufferSource();
      src.buffer = noiseBuf;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(620 - idx * 140, now + delaySec);
      filter.Q.value = 1.2;

      const echoGain = this.ctx.createGain();
      echoGain.gain.setValueAtTime((gainScale * 0.55) / (idx + 1), now + delaySec);
      echoGain.gain.exponentialRampToValueAtTime(0.001, now + delaySec + 0.42);

      src.connect(filter);
      filter.connect(echoGain);
      echoGain.connect(this.sfxGain);
      src.start(now + delaySec);
    });
  }

  public playTreeSnap() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Sharp timber crack & splintering crunch
    const bufLen = Math.floor(this.ctx.sampleRate * 0.25);
    const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      const env = Math.exp(-i / (this.ctx.sampleRate * 0.05));
      ch[i] = (Math.random() * 2 - 1) * env;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(420, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);
  }

  // --- Superman Signature SFX: Sonic Boom, Super-Breath, Stagger Deflect & Thermal Overload ---
  private thermalHumOsc: OscillatorNode | null = null;
  private thermalScorchOsc: OscillatorNode | null = null;
  private thermalGain: GainNode | null = null;

  public playSonicBoom() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const sub = this.ctx.createOscillator();
    const sGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(135, now);
    sub.frequency.exponentialRampToValueAtTime(24, now + 0.45);
    sGain.gain.setValueAtTime(0.85, now);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    sub.connect(sGain);
    sGain.connect(this.sfxGain);
    sub.start(now);
    sub.stop(now + 0.5);

    const bufLen = Math.floor(this.ctx.sampleRate * 0.25);
    const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(280, now + 0.22);
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.65, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.sfxGain);
    noise.start(now);
  }

  public playSuperBreath() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const bufLen = Math.floor(this.ctx.sampleRate * 0.65);
    const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      ch[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.frequency.exponentialRampToValueAtTime(520, now + 0.6);
    filter.Q.value = 1.6;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.75, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.64);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);
    noise.stop(now + 0.65);

    // Sub-zero crystalline harmonic
    const ice = this.ctx.createOscillator();
    const iceGain = this.ctx.createGain();
    ice.type = 'sine';
    ice.frequency.setValueAtTime(1480, now);
    ice.frequency.exponentialRampToValueAtTime(880, now + 0.45);
    iceGain.gain.setValueAtTime(0.22, now);
    iceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    ice.connect(iceGain);
    iceGain.connect(this.sfxGain);
    ice.start(now);
    ice.stop(now + 0.5);
  }

  public playStaggerDeflect() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1650 + Math.random() * 250, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.09);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playThermalOverload(active: boolean) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    if (active) {
      if (this.thermalHumOsc) return;
      this.thermalGain = this.ctx.createGain();
      this.thermalGain.gain.setValueAtTime(0.02, now);
      this.thermalGain.gain.linearRampToValueAtTime(0.55, now + 0.28);
      this.thermalGain.connect(this.sfxGain);

      // Deep low-frequency sub hum
      this.thermalHumOsc = this.ctx.createOscillator();
      this.thermalHumOsc.type = 'sine';
      this.thermalHumOsc.frequency.setValueAtTime(68, now);
      this.thermalHumOsc.frequency.linearRampToValueAtTime(92, now + 0.45);
      this.thermalHumOsc.connect(this.thermalGain);
      this.thermalHumOsc.start(now);

      // Roaring plasma scorch harmonic
      this.thermalScorchOsc = this.ctx.createOscillator();
      this.thermalScorchOsc.type = 'sawtooth';
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(420, now);
      lp.frequency.linearRampToValueAtTime(1850, now + 0.5);
      this.thermalScorchOsc.frequency.setValueAtTime(140, now);
      this.thermalScorchOsc.frequency.linearRampToValueAtTime(215, now + 0.45);
      this.thermalScorchOsc.connect(lp);
      lp.connect(this.thermalGain);
      this.thermalScorchOsc.start(now);
    } else {
      if (this.thermalGain && this.ctx) {
        this.thermalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      }
      try {
        this.thermalHumOsc?.stop(now + 0.2);
        this.thermalScorchOsc?.stop(now + 0.2);
      } catch {
        // Ignored
      }
      this.thermalHumOsc = null;
      this.thermalScorchOsc = null;
      this.thermalGain = null;
    }
  }

  public playWitchMagic(element: 'fire' | 'water') {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    if (element === 'fire') {
      // Crackling flame blast + deep fireball whoosh
      const dur = 0.42;
      const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (Math.random() > 0.85 ? 1.4 : 0.7);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(920, now);
      bp.frequency.exponentialRampToValueAtTime(240, now + dur);
      bp.Q.value = 1.6;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      noise.connect(bp);
      bp.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(now);
      noise.stop(now + dur);

      const core = this.ctx.createOscillator();
      const cGain = this.ctx.createGain();
      core.type = 'sawtooth';
      core.frequency.setValueAtTime(280, now);
      core.frequency.exponentialRampToValueAtTime(70, now + 0.32);
      cGain.gain.setValueAtTime(0.32, now);
      cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
      core.connect(cGain);
      cGain.connect(this.sfxGain);
      core.start(now);
      core.stop(now + 0.35);
    } else {
      // Bubbling tidal surge + shimmering water rush
      const dur = 0.46;
      const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'bandpass';
      lp.frequency.setValueAtTime(480, now);
      lp.frequency.linearRampToValueAtTime(1600, now + 0.2);
      lp.frequency.exponentialRampToValueAtTime(420, now + dur);
      lp.Q.value = 2.4;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.62, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      noise.connect(lp);
      lp.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(now);
      noise.stop(now + dur);

      const chime = this.ctx.createOscillator();
      const chGain = this.ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(620, now);
      chime.frequency.exponentialRampToValueAtTime(1180, now + 0.25);
      chGain.gain.setValueAtTime(0.24, now);
      chGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      chime.connect(chGain);
      chGain.connect(this.sfxGain);
      chime.start(now);
      chime.stop(now + 0.3);
    }
  }

  // --- Maxwell Shodron Arcane Magic SFX ---
  public playArcaneBlink() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    [523.25, 783.99, 1318.5].forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.03);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.45, now + idx * 0.03 + 0.16);
      gain.gain.setValueAtTime(0.28, now + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.18);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.03);
      osc.stop(now + idx * 0.03 + 0.2);
    });
  }

  public playChronoStasis() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const sub = this.ctx.createOscillator();
    const sGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(220, now);
    sub.frequency.exponentialRampToValueAtTime(36, now + 0.55);
    sGain.gain.setValueAtTime(0.75, now);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    sub.connect(sGain);
    sGain.connect(this.sfxGain);
    sub.start(now);
    sub.stop(now + 0.62);

    [1568, 1175, 880].forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const chime = this.ctx.createOscillator();
      const cGain = this.ctx.createGain();
      chime.type = 'triangle';
      chime.frequency.setValueAtTime(freq, now + i * 0.05);
      cGain.gain.setValueAtTime(0.22, now + i * 0.05);
      cGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.35);
      chime.connect(cGain);
      cGain.connect(this.sfxGain);
      chime.start(now + i * 0.05);
      chime.stop(now + i * 0.05 + 0.38);
    });
  }

  public playAetherBarrier() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    [392, 587.33, 783.99].forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.04);
      gain.gain.setValueAtTime(0.26, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.32);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.34);
    });
  }

  public playArcaneNova() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const sub = this.ctx.createOscillator();
    const sGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(110, now);
    sub.frequency.exponentialRampToValueAtTime(18, now + 1.1);
    sGain.gain.setValueAtTime(0.95, now);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);
    sub.connect(sGain);
    sGain.connect(this.sfxGain);
    sub.start(now);
    sub.stop(now + 1.3);

    const chord = [440, 659.25, 880, 1318.5];
    chord.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq * 0.5, now);
      osc.frequency.exponentialRampToValueAtTime(freq, now + 0.35);
      gain.gain.setValueAtTime(0.18, now + i * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.9);
    });
  }

  public playElementTransmission(element: 'arcane' | 'fire' | 'lightning' | 'frost' | 'void') {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    if (element === 'fire') {
      // Blazing ignition roar + ascending ember flare
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.25);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.55);
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.6);
      this.playWitchMagic('fire');
    } else if (element === 'lightning') {
      // High-voltage electric snap & rapid storm surge
      [980, 1480, 2120, 3100].forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * 0.035);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.45, now + idx * 0.035 + 0.14);
        gain.gain.setValueAtTime(0.24, now + idx * 0.035);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.035 + 0.16);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + idx * 0.035);
        osc.stop(now + idx * 0.035 + 0.18);
      });
    } else if (element === 'frost') {
      // Crystalline ice shimmer chime
      [1046.5, 1318.5, 1567.98, 2093].forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.045);
        gain.gain.setValueAtTime(0.24, now + idx * 0.045);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.42);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + idx * 0.045);
        osc.stop(now + idx * 0.045 + 0.45);
      });
    } else if (element === 'void') {
      // Deep gravitational eclipse pulse
      const sub = this.ctx.createOscillator();
      const sGain = this.ctx.createGain();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(160, now);
      sub.frequency.exponentialRampToValueAtTime(34, now + 0.65);
      sGain.gain.setValueAtTime(0.75, now);
      sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.68);
      sub.connect(sGain);
      sGain.connect(this.sfxGain);
      sub.start(now);
      sub.stop(now + 0.7);
    } else {
      // Arcane celestial chime arpeggio
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.25, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.35);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.38);
      });
    }
  }

  public playKingEngine(heavy = false) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Double low-frequency intimidating heartbeat thump ("DO-THUMP DO-THUMP")
    [0, 0.18].forEach(offset => {
      if (!this.ctx || !this.sfxGain) return;
      const sub = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(heavy ? 115 : 88, now + offset);
      sub.frequency.exponentialRampToValueAtTime(28, now + offset + 0.16);
      gain.gain.setValueAtTime(heavy ? 0.95 : 0.78, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.17);
      sub.connect(gain);
      gain.connect(this.sfxGain);
      sub.start(now + offset);
      sub.stop(now + offset + 0.18);
    });
  }

  public playFlashSpeed() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(2400, now + 0.16);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.38);
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.42);
  }

  public playLanternConstruct() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [523.25, 783.99, 1046.5].forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.03);
      gain.gain.setValueAtTime(0.28, now + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.34);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.03);
      osc.stop(now + idx * 0.03 + 0.36);
    });
  }

  public playShazamThunder() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const sub = this.ctx.createOscillator();
    const sGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(150, now);
    sub.frequency.exponentialRampToValueAtTime(22, now + 0.72);
    sGain.gain.setValueAtTime(0.95, now);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.78);
    sub.connect(sGain);
    sGain.connect(this.sfxGain);
    sub.start(now);
    sub.stop(now + 0.8);

    const crack = this.ctx.createOscillator();
    const cGain = this.ctx.createGain();
    crack.type = 'sawtooth';
    crack.frequency.setValueAtTime(2200, now);
    crack.frequency.exponentialRampToValueAtTime(120, now + 0.32);
    cGain.gain.setValueAtTime(0.5, now);
    cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    crack.connect(cGain);
    cGain.connect(this.sfxGain);
    crack.start(now);
    crack.stop(now + 0.36);
  }

  public playThorMjolnir() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const bell = this.ctx.createOscillator();
    const bGain = this.ctx.createGain();
    bell.type = 'triangle';
    bell.frequency.setValueAtTime(420, now);
    bell.frequency.exponentialRampToValueAtTime(185, now + 0.25);
    bGain.gain.setValueAtTime(0.55, now);
    bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    bell.connect(bGain);
    bGain.connect(this.sfxGain);
    bell.start(now);
    bell.stop(now + 0.3);

    const boom = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(110, now);
    boom.frequency.exponentialRampToValueAtTime(24, now + 0.42);
    g2.gain.setValueAtTime(0.85, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    boom.connect(g2);
    g2.connect(this.sfxGain);
    boom.start(now);
    boom.stop(now + 0.47);
  }

  public playSilvesterOmega(kind: string = 'apocalypse') {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    if (kind === 'singularity' || kind === 'time') {
      const sub = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(kind === 'time' ? 420 : 220, now);
      sub.frequency.exponentialRampToValueAtTime(26, now + 0.65);
      gain.gain.setValueAtTime(0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.68);
      sub.connect(gain);
      gain.connect(this.sfxGain);
      sub.start(now);
      sub.stop(now + 0.7);
      return;
    }

    if (kind === 'drain' || kind === 'cloak' || kind === 'warp') {
      [392, 523.25, 659.25, 987.77].forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.28, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.35);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.38);
      });
      return;
    }

    const chord =
      kind === 'roar'
        ? [261.63, 392.0, 523.25]
        : kind === 'ice'
        ? [587.33, 880.0, 1174.66]
        : kind === 'fire' || kind === 'thunder'
        ? [196.0, 293.66, 587.33]
        : [130.81, 261.63, 392.0, 523.25, 783.99];
    chord.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.75, now + 0.6);
      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.68);
    });
  }

  public playDreBass(heavy = false) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(heavy ? 125 : 165, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + (heavy ? 0.45 : 0.16));
    gain.gain.setValueAtTime(heavy ? 0.95 : 0.62, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.48 : 0.18));
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + (heavy ? 0.5 : 0.19));
  }

  public playTruthChime() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [440, 659.25, 880, 1318.5].forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.035);
      gain.gain.setValueAtTime(0.28, now + idx * 0.035);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.035 + 0.45);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.035);
      osc.stop(now + idx * 0.035 + 0.48);
    });
  }

  public playHeilieaChord() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.03);
      gain.gain.setValueAtTime(0.26, now + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.42);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.03);
      osc.stop(now + idx * 0.03 + 0.45);
    });
  }

  public playBabyTantrum(heavy = false) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = heavy ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(heavy ? 680 : 920, now);
    osc.frequency.exponentialRampToValueAtTime(heavy ? 140 : 420, now + (heavy ? 0.42 : 0.12));
    gain.gain.setValueAtTime(heavy ? 0.65 : 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.46 : 0.13));
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + (heavy ? 0.48 : 0.14));
  }

  public playZenitsuThunder(heavy = false) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const snap = this.ctx.createOscillator();
    const sGain = this.ctx.createGain();
    snap.type = 'sawtooth';
    snap.frequency.setValueAtTime(heavy ? 2400 : 1750, now);
    snap.frequency.exponentialRampToValueAtTime(180, now + (heavy ? 0.28 : 0.12));
    sGain.gain.setValueAtTime(heavy ? 0.72 : 0.45, now);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.3 : 0.13));
    snap.connect(sGain);
    sGain.connect(this.sfxGain);
    snap.start(now);
    snap.stop(now + (heavy ? 0.32 : 0.14));

    if (heavy) {
      const rumble = this.ctx.createOscillator();
      const rGain = this.ctx.createGain();
      rumble.type = 'sine';
      rumble.frequency.setValueAtTime(130, now + 0.04);
      rumble.frequency.exponentialRampToValueAtTime(28, now + 0.55);
      rGain.gain.setValueAtTime(0.85, now + 0.04);
      rGain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
      rumble.connect(rGain);
      rGain.connect(this.sfxGain);
      rumble.start(now + 0.04);
      rumble.stop(now + 0.6);
    }
  }

  public playTanjiroBreath(isSun = false) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isSun ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(isSun ? 640 : 480, now);
    osc.frequency.exponentialRampToValueAtTime(isSun ? 1280 : 960, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(isSun ? 220 : 320, now + 0.26);
    gain.gain.setValueAtTime(isSun ? 0.52 : 0.42, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playMuzanBlood(heavy = false) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(heavy ? 180 : 380, now);
    osc.frequency.exponentialRampToValueAtTime(heavy ? 32 : 95, now + (heavy ? 0.48 : 0.16));
    gain.gain.setValueAtTime(heavy ? 0.85 : 0.48, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.5 : 0.17));
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + (heavy ? 0.52 : 0.18));
  }

  public playHeroSignature(
    style: 'energy' | 'tech' | 'cosmic' | 'slash' | 'shadow' | 'water' | 'flame' = 'energy',
    heavy = false
  ) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const presets = {
      energy: { type: 'triangle' as OscillatorType, f0: 880, f1: 190, g: 0.46 },
      tech: { type: 'sawtooth' as OscillatorType, f0: 1420, f1: 280, g: 0.36 },
      cosmic: { type: 'sine' as OscillatorType, f0: 520, f1: 72, g: 0.56 },
      slash: { type: 'sawtooth' as OscillatorType, f0: 1650, f1: 310, g: 0.38 },
      shadow: { type: 'sawtooth' as OscillatorType, f0: 260, f1: 42, g: 0.62 },
      water: { type: 'sine' as OscillatorType, f0: 680, f1: 240, g: 0.44 },
      flame: { type: 'sawtooth' as OscillatorType, f0: 420, f1: 85, g: 0.52 },
    };
    const p = presets[style];
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = p.type;
    osc.frequency.setValueAtTime(heavy ? p.f0 * 1.15 : p.f0, now);
    osc.frequency.exponentialRampToValueAtTime(heavy ? Math.max(24, p.f1 * 0.6) : p.f1, now + (heavy ? 0.36 : 0.14));
    gain.gain.setValueAtTime(heavy ? Math.min(0.85, p.g * 1.35) : p.g, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.38 : 0.15));
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + (heavy ? 0.4 : 0.16));

    if (heavy) {
      const sub = this.ctx.createOscillator();
      const sGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(115, now);
      sub.frequency.exponentialRampToValueAtTime(26, now + 0.45);
      sGain.gain.setValueAtTime(0.75, now);
      sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.47);
      sub.connect(sGain);
      sGain.connect(this.sfxGain);
      sub.start(now);
      sub.stop(now + 0.49);
    }
  }

  public playFormTransform() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [293.66, 440.0, 587.33, 880.0].forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + idx * 0.04 + 0.32);
      gain.gain.setValueAtTime(0.32, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.36);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.38);
    });
  }
}

export const soundEngine = new SoundEngine();
