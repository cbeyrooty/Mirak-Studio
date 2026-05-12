import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

/**
 * Cinematic hum — ON by default. User can mute. Browsers that block
 * autoplay will silently wait for the first user gesture to actually
 * start the audio, but the UI shows ON from the start (per intent).
 */
export default function HumToggle({ active, autoStart = false }) {
  // ON by default — represents the user's intent regardless of audio-context state
  const [on, setOn] = useState(autoStart);
  const ctxRef = useRef(null);
  const nodesRef = useRef(null);
  const startedRef = useRef(false);
  const userMutedRef = useRef(false);

  const startAudio = async () => {
    if (startedRef.current) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    const ctx = new AC();

    if (ctx.state === "suspended") {
      try { await ctx.resume(); } catch {}
    }
    if (ctx.state !== "running") {
      try { ctx.close(); } catch {}
      return false;
    }

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
    master.gain.value = 0.55;

    rumble.connect(rumbleGain).connect(master);
    sub.connect(subGain).connect(master);
    noise.connect(hiss).connect(hissGain).connect(master);
    master.connect(ctx.destination);

    rumble.start();
    sub.start();
    noise.start();

    const now = ctx.currentTime;
    rumbleGain.gain.linearRampToValueAtTime(0.18, now + 1.8);
    subGain.gain.linearRampToValueAtTime(0.09, now + 2.0);
    hissGain.gain.linearRampToValueAtTime(0.035, now + 2.2);

    nodesRef.current = { rumble, sub, noise, rumbleGain, subGain, hissGain, master };
    startedRef.current = true;
    return true;
  };

  const stopAudio = async () => {
    const ctx = ctxRef.current;
    if (!ctx || !nodesRef.current) {
      startedRef.current = false;
      return;
    }
    const { rumbleGain, subGain, hissGain, master, rumble, sub, noise } = nodesRef.current;
    const now = ctx.currentTime;
    rumbleGain.gain.linearRampToValueAtTime(0, now + 0.4);
    subGain.gain.linearRampToValueAtTime(0, now + 0.4);
    hissGain.gain.linearRampToValueAtTime(0, now + 0.4);
    setTimeout(async () => {
      try {
        rumble.stop(); sub.stop(); noise.stop();
        master.disconnect();
        await ctx.close();
      } catch {}
      ctxRef.current = null;
      nodesRef.current = null;
      startedRef.current = false;
    }, 500);
  };

  // When active, try to start audio. If autoplay blocked, attach gesture listeners
  // that will start audio on the first interaction — unless the user has muted.
  useEffect(() => {
    if (!autoStart || !active) return;
    let cancelled = false;

    (async () => {
      if (userMutedRef.current) return;
      await startAudio();
    })();

    const onGesture = async () => {
      if (cancelled || startedRef.current || userMutedRef.current) return;
      await startAudio();
      // Listeners self-clean once audio is running
      if (startedRef.current) {
        window.removeEventListener("pointerdown", onGesture);
        window.removeEventListener("keydown", onGesture);
        window.removeEventListener("mousemove", onGesture);
        window.removeEventListener("touchstart", onGesture);
      }
    };
    window.addEventListener("pointerdown", onGesture);
    window.addEventListener("keydown", onGesture);
    window.addEventListener("mousemove", onGesture);
    window.addEventListener("touchstart", onGesture);

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      window.removeEventListener("mousemove", onGesture);
      window.removeEventListener("touchstart", onGesture);
    };
  }, [autoStart, active]);

  useEffect(() => {
    return () => {
      try {
        if (ctxRef.current) ctxRef.current.close();
      } catch {}
    };
  }, []);

  const toggle = async () => {
    if (on) {
      userMutedRef.current = true;
      setOn(false);
      await stopAudio();
    } else {
      userMutedRef.current = false;
      setOn(true);
      await startAudio();
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
