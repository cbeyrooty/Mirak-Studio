import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

/**
 * Cinematic hum — ON by default. UI shows ON immediately.
 * Audio graph is built on mount; modern browsers block actual playback
 * until the first user gesture, so we silently resume the AudioContext
 * on the first interaction. Once the user toggles off, we stop and
 * do NOT auto-resume.
 */
export default function HumToggle({ active, autoStart = false }) {
  const [on, setOn] = useState(autoStart);
  const ctxRef = useRef(null);
  const nodesRef = useRef(null);
  const userMutedRef = useRef(false);
  const builtRef = useRef(false);

  // Build the entire audio graph — oscillators start, gains stay at 0
  // until either (a) the context resumes and we ramp up, or (b) toggled off.
  const buildGraph = () => {
    if (builtRef.current) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    ctxRef.current = ctx;

    const rumble = ctx.createOscillator();
    rumble.type = "sine";
    rumble.frequency.value = 52;
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0;

    const sub = ctx.createOscillator();
    sub.type = "triangle";
    sub.frequency.value = 78;
    const subGain = ctx.createGain();
    subGain.gain.value = 0;

    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;
    const hiss = ctx.createBiquadFilter();
    hiss.type = "bandpass";
    hiss.frequency.value = 1200;
    hiss.Q.value = 0.6;
    const hissGain = ctx.createGain();
    hissGain.gain.value = 0;

    const master = ctx.createGain();
    master.gain.value = 0.6;

    rumble.connect(rumbleGain).connect(master);
    sub.connect(subGain).connect(master);
    noise.connect(hiss).connect(hissGain).connect(master);
    master.connect(ctx.destination);

    try {
      rumble.start();
      sub.start();
      noise.start();
    } catch {}

    nodesRef.current = { rumble, sub, noise, rumbleGain, subGain, hissGain, master };
    builtRef.current = true;
  };

  const fadeUp = () => {
    const ctx = ctxRef.current;
    const nodes = nodesRef.current;
    if (!ctx || !nodes) return;
    const now = ctx.currentTime;
    nodes.rumbleGain.gain.cancelScheduledValues(now);
    nodes.subGain.gain.cancelScheduledValues(now);
    nodes.hissGain.gain.cancelScheduledValues(now);
    nodes.rumbleGain.gain.setValueAtTime(nodes.rumbleGain.gain.value, now);
    nodes.subGain.gain.setValueAtTime(nodes.subGain.gain.value, now);
    nodes.hissGain.gain.setValueAtTime(nodes.hissGain.gain.value, now);
    nodes.rumbleGain.gain.linearRampToValueAtTime(0.20, now + 2.0);
    nodes.subGain.gain.linearRampToValueAtTime(0.10, now + 2.2);
    nodes.hissGain.gain.linearRampToValueAtTime(0.040, now + 2.4);
  };

  const fadeDown = () => {
    const ctx = ctxRef.current;
    const nodes = nodesRef.current;
    if (!ctx || !nodes) return;
    const now = ctx.currentTime;
    nodes.rumbleGain.gain.cancelScheduledValues(now);
    nodes.subGain.gain.cancelScheduledValues(now);
    nodes.hissGain.gain.cancelScheduledValues(now);
    nodes.rumbleGain.gain.setValueAtTime(nodes.rumbleGain.gain.value, now);
    nodes.subGain.gain.setValueAtTime(nodes.subGain.gain.value, now);
    nodes.hissGain.gain.setValueAtTime(nodes.hissGain.gain.value, now);
    nodes.rumbleGain.gain.linearRampToValueAtTime(0, now + 0.5);
    nodes.subGain.gain.linearRampToValueAtTime(0, now + 0.5);
    nodes.hissGain.gain.linearRampToValueAtTime(0, now + 0.5);
  };

  // Mount: build the graph and try to resume. Attach gesture listeners
  // so the very first interaction (click/keypress/touch/mousemove)
  // unlocks the AudioContext.
  useEffect(() => {
    if (!autoStart || !active) return;
    buildGraph();

    const ctx = ctxRef.current;
    if (!ctx) return;

    // Eager attempt — works if browser allows (e.g. user has prior engagement)
    ctx.resume()
      .then(() => {
        if (!userMutedRef.current && ctx.state === "running") fadeUp();
      })
      .catch(() => {});

    const tryResume = () => {
      if (userMutedRef.current) return;
      if (!ctxRef.current) return;
      if (ctxRef.current.state === "running") {
        fadeUp();
        cleanup();
        return;
      }
      ctxRef.current
        .resume()
        .then(() => {
          if (userMutedRef.current) return;
          if (ctxRef.current && ctxRef.current.state === "running") {
            fadeUp();
            cleanup();
          }
        })
        .catch(() => {});
    };

    const events = ["pointerdown", "click", "keydown", "touchstart", "mousemove"];
    const cleanup = () => {
      events.forEach((ev) => window.removeEventListener(ev, tryResume));
    };
    events.forEach((ev) => window.addEventListener(ev, tryResume, { passive: true }));

    return () => {
      cleanup();
    };
  }, [autoStart, active]);

  useEffect(() => {
    return () => {
      try {
        if (ctxRef.current) ctxRef.current.close();
      } catch {}
      ctxRef.current = null;
      nodesRef.current = null;
      builtRef.current = false;
    };
  }, []);

  const toggle = async () => {
    if (on) {
      userMutedRef.current = true;
      setOn(false);
      fadeDown();
    } else {
      userMutedRef.current = false;
      setOn(true);
      buildGraph();
      const ctx = ctxRef.current;
      if (ctx) {
        try { await ctx.resume(); } catch {}
        fadeUp();
      }
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Mute cinematic hum" : "Play cinematic hum"}
      className={`mirak-hum-toggle ${active ? "is-active" : ""} ${on ? "is-on" : ""}`}
      data-testid="mirak-hum-toggle"
    >
      <span className="mirak-hum-icon" aria-hidden="true">
        {on ? <Volume2 size={13} strokeWidth={1.4} /> : <VolumeX size={13} strokeWidth={1.4} />}
      </span>
      <span className="mirak-hum-label">{on ? "HUM // ON" : "HUM // OFF"}</span>
      <span className={`mirak-hum-led ${on ? "is-on" : ""}`} aria-hidden="true" />
    </button>
  );
}
