import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

/**
 * Optional cinematic hum / projector noise — WebAudio synthesized so we
 * don't need an external asset. Muted by default per spec.
 */
export default function HumToggle({ active }) {
  const [on, setOn] = useState(false);
  const ctxRef = useRef(null);
  const nodesRef = useRef(null);

  useEffect(() => {
    return () => {
      try {
        if (ctxRef.current) ctxRef.current.close();
      } catch {}
    };
  }, []);

  const startAudio = async () => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    ctxRef.current = ctx;

    // Low rumble oscillator
    const rumble = ctx.createOscillator();
    rumble.type = "sine";
    rumble.frequency.value = 52;
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0;

    // Sub harmonic
    const sub = ctx.createOscillator();
    sub.type = "triangle";
    sub.frequency.value = 78;
    const subGain = ctx.createGain();
    subGain.gain.value = 0;

    // Projector hiss — pink-ish noise via filtered white
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

    // Master
    const master = ctx.createGain();
    master.gain.value = 0.55;

    rumble.connect(rumbleGain).connect(master);
    sub.connect(subGain).connect(master);
    noise.connect(hiss).connect(hissGain).connect(master);
    master.connect(ctx.destination);

    rumble.start();
    sub.start();
    noise.start();

    // Slow fade-in
    const now = ctx.currentTime;
    rumbleGain.gain.linearRampToValueAtTime(0.18, now + 1.4);
    subGain.gain.linearRampToValueAtTime(0.09, now + 1.6);
    hissGain.gain.linearRampToValueAtTime(0.035, now + 1.8);

    nodesRef.current = { rumble, sub, noise, rumbleGain, subGain, hissGain, master };
  };

  const stopAudio = async () => {
    const ctx = ctxRef.current;
    if (!ctx || !nodesRef.current) return;
    const { rumbleGain, subGain, hissGain, master, rumble, sub, noise } = nodesRef.current;
    const now = ctx.currentTime;
    rumbleGain.gain.linearRampToValueAtTime(0, now + 0.4);
    subGain.gain.linearRampToValueAtTime(0, now + 0.4);
    hissGain.gain.linearRampToValueAtTime(0, now + 0.4);
    setTimeout(async () => {
      try {
        rumble.stop();
        sub.stop();
        noise.stop();
        master.disconnect();
        await ctx.close();
      } catch {}
      ctxRef.current = null;
      nodesRef.current = null;
    }, 500);
  };

  const toggle = async () => {
    if (!on) {
      await startAudio();
      setOn(true);
    } else {
      await stopAudio();
      setOn(false);
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
