import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore.js';

export function useGameAudio() {
  const impactEventId = useGameStore((state) => state.impactEventId);
  const impactType = useGameStore((state) => state.impactType);
  const contextRef = useRef(null);
  const lastImpactId = useRef(0);

  useEffect(() => {
    function unlockAudio() {
      if (!contextRef.current) {
        contextRef.current = new AudioContext();
      }

      if (contextRef.current.state === 'suspended') {
        contextRef.current.resume();
      }
    }

    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio);

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  useEffect(() => {
    if (impactEventId === 0 || impactEventId === lastImpactId.current || !contextRef.current) {
      return;
    }

    lastImpactId.current = impactEventId;

    if (contextRef.current.state !== 'running') {
      return;
    }

    playImpact(contextRef.current, impactType);
  }, [impactEventId, impactType]);
}

function playImpact(audioContext, impactType) {
  const now = audioContext.currentTime;
  const gain = audioContext.createGain();
  const tone = audioContext.createOscillator();
  const noise = audioContext.createBufferSource();
  const noiseGain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  const settings = {
    perfect: { frequency: 142, volume: 0.18, duration: 0.12, noise: 0.05 },
    contact: { frequency: 118, volume: 0.12, duration: 0.08, noise: 0.035 },
    six: { frequency: 154, volume: 0.2, duration: 0.16, noise: 0.045 },
    four: { frequency: 132, volume: 0.16, duration: 0.11, noise: 0.035 },
    wicket: { frequency: 82, volume: 0.16, duration: 0.18, noise: 0.055 },
    run: { frequency: 96, volume: 0.06, duration: 0.05, noise: 0.018 },
    dot: { frequency: 72, volume: 0.045, duration: 0.04, noise: 0.012 },
  }[impactType] ?? {
    frequency: 110,
    volume: 0.08,
    duration: 0.06,
    noise: 0.02,
  };

  const buffer = audioContext.createBuffer(1, audioContext.sampleRate * settings.duration, audioContext.sampleRate);
  const data = buffer.getChannelData(0);

  for (let index = 0; index < data.length; index += 1) {
    data[index] = (Math.random() * 2 - 1) * (1 - index / data.length);
  }

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(850, now);
  tone.type = 'triangle';
  tone.frequency.setValueAtTime(settings.frequency, now);
  tone.frequency.exponentialRampToValueAtTime(settings.frequency * 0.45, now + settings.duration);

  gain.gain.setValueAtTime(settings.volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + settings.duration);
  noiseGain.gain.setValueAtTime(settings.noise, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + settings.duration);

  noise.buffer = buffer;
  tone.connect(gain);
  noise.connect(filter);
  filter.connect(noiseGain);
  gain.connect(audioContext.destination);
  noiseGain.connect(audioContext.destination);

  tone.start(now);
  noise.start(now);
  tone.stop(now + settings.duration);
  noise.stop(now + settings.duration);
}
