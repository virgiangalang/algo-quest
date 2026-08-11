/**
 * audio.js — SFX (Web Audio) + TTS opsional + mute.
 * Unlock pada interaksi pertama (kebijakan browser autoplay).
 */

const AlgoAudio = (() => {
  let ctx = null;
  let unlocked = false;
  let muted = false;

  try {
    muted = localStorage.getItem("algo_mute") === "1";
  } catch (_) {}

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    return ctx;
  }

  async function unlock() {
    const c = ensureCtx();
    if (!c) return;
    if (c.state === "suspended") {
      try { await c.resume(); } catch (_) {}
    }
    unlocked = true;
  }

  function setMuted(v) {
    muted = !!v;
    try { localStorage.setItem("algo_mute", muted ? "1" : "0"); } catch (_) {}
    const btn = document.getElementById("btn-mute");
    if (btn) {
      btn.textContent = muted ? "Suara: Mati" : "Suara: Nyala";
      btn.setAttribute("aria-pressed", muted ? "true" : "false");
    }
  }

  function isMuted() { return muted; }

  function tone(freq, dur, type, gainVal, when) {
    if (muted) return;
    const c = ensureCtx();
    if (!c) return;
    const t0 = (when != null ? when : c.currentTime);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gainVal || 0.08, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function play(name) {
    if (muted) return;
    unlock();
    const c = ensureCtx();
    if (!c) return;
    const t = c.currentTime;
    switch (name) {
      case "click":
        tone(520, 0.06, "triangle", 0.04, t);
        break;
      case "correct":
        tone(523.25, 0.12, "sine", 0.09, t);
        tone(659.25, 0.14, "sine", 0.08, t + 0.1);
        tone(783.99, 0.18, "sine", 0.07, t + 0.2);
        break;
      case "wrong":
        tone(220, 0.18, "sawtooth", 0.05, t);
        tone(180, 0.22, "triangle", 0.04, t + 0.12);
        break;
      case "bab-clear":
        tone(392, 0.12, "sine", 0.07, t);
        tone(523, 0.14, "sine", 0.07, t + 0.12);
        tone(659, 0.16, "sine", 0.07, t + 0.24);
        tone(784, 0.22, "triangle", 0.06, t + 0.36);
        break;
      case "level-up":
        tone(440, 0.1, "square", 0.04, t);
        tone(554, 0.1, "square", 0.04, t + 0.1);
        tone(659, 0.2, "square", 0.05, t + 0.2);
        break;
      case "certificate":
        tone(349, 0.15, "sine", 0.06, t);
        tone(440, 0.15, "sine", 0.06, t + 0.15);
        tone(523, 0.25, "sine", 0.07, t + 0.3);
        break;
      default:
        tone(440, 0.08, "sine", 0.04, t);
    }
  }

  function speak(text, opts = {}) {
    if (muted || !text) return;
    if (!window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text));
      u.lang = opts.lang || "id-ID";
      u.rate = opts.rate || 1;
      u.pitch = opts.pitch || 1;
      window.speechSynthesis.speak(u);
    } catch (_) {}
  }

  function stopSpeak() {
    try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (_) {}
  }

  function bindUnlockOnce() {
    const once = () => { unlock(); document.removeEventListener("pointerdown", once); };
    document.addEventListener("pointerdown", once, { passive: true });
  }

  return { unlock, setMuted, isMuted, play, speak, stopSpeak, bindUnlockOnce };
})();
