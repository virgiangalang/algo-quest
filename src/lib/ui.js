/**
 * ui.js — toast, confetti/stamp, helpers UX game (Algo brand).
 */

const AlgoUI = (() => {
  function ensureToastHost() {
    let host = document.getElementById("algo-toast-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "algo-toast-host";
      host.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:60;display:flex;flex-direction:column;gap:8px;pointer-events:none;width:min(420px,92vw)";
      document.body.appendChild(host);
    }
    return host;
  }

  function toast(message, kind) {
    const host = ensureToastHost();
    const el = document.createElement("div");
    el.textContent = message;
    el.style.cssText = [
      "pointer-events:none;font-family:IBM Plex Sans,system-ui,sans-serif;font-size:13px;font-weight:600;",
      "padding:12px 14px;border-radius:10px;box-shadow:0 12px 30px rgba(20,15,25,.2);",
      "animation:fadeUp .35s ease both;",
      kind === "bad"
        ? "background:#fbf0f2;color:#6d303a;border:1px solid #e2bfc5;"
        : kind === "info"
          ? "background:#f3edf9;color:#4b2b68;border:1px solid #dccfee;"
          : "background:#edf7f1;color:#244c3a;border:1px solid #bcd9ca;",
    ].join("");
    host.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transition = "opacity .3s";
      setTimeout(() => el.remove(), 320);
    }, 2200);
  }

  function confettiBurst(root) {
    const host = root || document.body;
    const wrap = document.createElement("div");
    wrap.setAttribute("aria-hidden", "true");
    wrap.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:55;overflow:hidden";
    const colors = ["#4b2b68", "#8b5aac", "#9b6b1f", "#226a4b", "#c4b8d0"];
    for (let i = 0; i < 28; i++) {
      const p = document.createElement("i");
      const x = Math.random() * 100;
      const delay = Math.random() * 0.25;
      const dur = 0.9 + Math.random() * 0.7;
      const size = 6 + Math.random() * 7;
      p.style.cssText = `position:absolute;top:-12px;left:${x}%;width:${size}px;height:${size * 0.6}px;background:${colors[i % colors.length]};border-radius:2px;opacity:.95;animation:algoConfetti ${dur}s ease-in ${delay}s forwards`;
      wrap.appendChild(p);
    }
    host.appendChild(wrap);
    setTimeout(() => wrap.remove(), 2000);
  }

  function stampFlash(text) {
    const el = document.createElement("div");
    el.textContent = text || "BUKTI TERKONFIRMASI";
    el.style.cssText = "position:fixed;top:18%;left:50%;transform:translateX(-50%) rotate(-6deg);z-index:56;pointer-events:none;border:3px solid #4b2b68;color:#4b2b68;background:rgba(247,244,238,.92);font-weight:800;letter-spacing:.12em;font-size:14px;padding:10px 14px;animation:stampIn .55s cubic-bezier(.2,.8,.2,1) both, fadeUp .4s ease 1.2s forwards";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1700);
  }

  return { toast, confettiBurst, stampFlash };
})();
