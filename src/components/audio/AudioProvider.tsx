import React, { useEffect, useMemo, useRef, useState } from 'react';

const VOICE_LANGS = ['no-NO', 'nb-NO', 'nn-NO'];

export type AudioState = {
  rate: number;
  pitch: number;
  voiceName: string | null;
  showPron: boolean;
  showEN: boolean;
};

const defaultAudioState: AudioState = {
  rate: Number(localStorage.getItem('rate') || 1.0),
  pitch: Number(localStorage.getItem('pitch') || 1.0),
  voiceName: localStorage.getItem('voiceName') || null,
  showPron: JSON.parse(localStorage.getItem('showPron') || 'true'),
  showEN: JSON.parse(localStorage.getItem('showEN') || 'true'),
};

export const AudioCtx = React.createContext<{
  state: AudioState;
  setState: React.Dispatch<React.SetStateAction<AudioState>>;
  speakNow: (text: string) => void;
  queuePlay: (text: string) => void;
  stop: () => void;
}>({ state: defaultAudioState, setState: () => {}, speakNow: () => {}, queuePlay: () => {}, stop: () => {} });

function useVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null as any };
  }, []);
  const norwegian = useMemo(() => voices.filter(v => VOICE_LANGS.includes(v.lang)), [voices]);
  const preferred = useMemo(() => norwegian.find(v => /female|kvin|woman|dame/i.test(v.name)) || norwegian[0] || voices[0], [norwegian, voices]);
  return { voices, preferred };
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const { voices, preferred } = useVoices();
  const [state, setState] = useState<AudioState>(defaultAudioState);
  const queueRef = useRef<string[]>([]);
  const playingRef = useRef(false);

  useEffect(() => {
    localStorage.setItem('rate', String(state.rate));
    localStorage.setItem('pitch', String(state.pitch));
    localStorage.setItem('voiceName', state.voiceName || '');
    localStorage.setItem('showPron', JSON.stringify(state.showPron));
    localStorage.setItem('showEN', JSON.stringify(state.showEN));
  }, [state]);

  const resolveVoice = useMemo(() => {
    const byName = voices.find(v => v.name === state.voiceName!);
    return byName || preferred;
  }, [voices, preferred, state.voiceName]);

  const stop = () => { window.speechSynthesis.cancel(); playingRef.current = false; };

  const speakNow = (text: string) => {
    if (!text) return;
    stop();
    const utter = new SpeechSynthesisUtterance(text);
    const v = resolveVoice;
    if (v) utter.voice = v;
    utter.lang = v?.lang || 'no-NO';
    utter.rate = state.rate;
    utter.pitch = state.pitch;
    utter.onend = () => {
      playingRef.current = false;
      if (queueRef.current.length) {
        const next = queueRef.current.shift()!;
        setTimeout(() => speakNow(next), 60);
      }
    };
    playingRef.current = true;
    window.speechSynthesis.speak(utter);
  };

  const queuePlay = (text: string) => {
    if (!text) return;
    if (!playingRef.current) speakNow(text);
    else queueRef.current.push(text);
  };

  return (
    <AudioCtx.Provider value={{ state, setState, speakNow, queuePlay, stop }}>
      {children}
    </AudioCtx.Provider>
  );
}

