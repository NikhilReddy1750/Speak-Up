import { getLanguageOption } from '../data/i18n';
import type { LanguageCode } from '../types/complaint';

interface BrowserSpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface BrowserSpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface BrowserSpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export interface TranscriptionAdapter {
  name: string;
  isSupported(): boolean;
  transcribeAudioBlob(blob: Blob, language: LanguageCode): Promise<{ text: string; error?: string }>;
}

/**
 * Replaceable server-side transcription adapter (e.g. Whisper / Cloud STT via /api/transcribe).
 */
export const serverTranscriptionAdapter: TranscriptionAdapter = {
  name: 'Server STT Adapter',
  isSupported() {
    return typeof fetch !== 'undefined';
  },
  async transcribeAudioBlob(blob: Blob, language: LanguageCode) {
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      formData.append('language', language);
      const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
      if (!res.ok) {
        return { text: '', error: 'Cloud transcription service is not configured.' };
      }
      const data = (await res.json()) as { text?: string; error?: string };
      return { text: data.text ?? '', error: data.error };
    } catch {
      return { text: '', error: 'Could not reach transcription server.' };
    }
  },
};

export function isWebSpeechSupported(): boolean {
  return getSpeechRecognitionConstructor() !== null;
}

export function isMediaRecorderSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined'
  );
}

export function mapSpeechError(errorCode: string): string {
  switch (errorCode) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone permission was denied. Please allow microphone access in your browser settings, or type your complaint below.';
    case 'audio-capture':
      return 'No microphone was detected on this device. You can plug in a mic or type your complaint instead.';
    case 'no-speech':
      return 'No speech was detected. Please tap Redo and speak closer to the microphone, or type your complaint.';
    case 'network':
      return 'Speech recognition requires an active browser speech service connection. Please try again or type your complaint.';
    case 'language-not-supported':
      return 'Your browser does not support voice recognition for this language. You can record a voice note or type your complaint.';
    default:
      return 'Speech recognition could not complete. Please tap Redo to try again or edit/type your complaint below.';
  }
}

export interface VoiceSessionCallbacks {
  onTranscriptUpdate: (finalText: string, interimText: string) => void;
  onLevelUpdate: (level: number) => void;
  onSpeechError: (friendlyMessage: string) => void;
  onRecordingComplete: (audioUrl: string | null, durationSec: number, blob: Blob | null) => void;
}

export class VoiceRecordingSession {
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private recognition: BrowserSpeechRecognition | null = null;
  private audioContext: AudioContext | null = null;
  private rafId: number | null = null;
  private chunks: Blob[] = [];
  private startedAt = 0;
  private finalTranscript = '';
  private stopped = false;

  async start(language: LanguageCode, callbacks: VoiceSessionCallbacks): Promise<void> {
    this.stopped = false;
    this.chunks = [];
    this.finalTranscript = '';
    this.startedAt = Date.now();

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        'Microphone recording is not supported in this browser. Please type your complaint instead.'
      );
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const domErr = err as DOMException;
      if (domErr?.name === 'NotAllowedError' || domErr?.name === 'PermissionDeniedError') {
        throw new Error(
          'Microphone permission denied. Please enable microphone access in your browser or use the text option.'
        );
      }
      if (domErr?.name === 'NotFoundError') {
        throw new Error('No microphone found on this device. Please type your complaint instead.');
      }
      throw new Error('Unable to start microphone recording. Please type your complaint instead.');
    }

    this.mediaStream = stream;

    // Live audio level meter via Web Audio API
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      const analyser = this.audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      const buffer = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (this.stopped) return;
        analyser.getByteFrequencyData(buffer);
        const avg = buffer.reduce((sum, v) => sum + v, 0) / (buffer.length || 1);
        callbacks.onLevelUpdate(Math.min(1, avg / 110));
        this.rafId = requestAnimationFrame(tick);
      };
      this.rafId = requestAnimationFrame(tick);
    } catch {
      // Fallback: level stays idle if AudioContext blocked
    }

    // MediaRecorder for preserving voice recording
    if (typeof MediaRecorder !== 'undefined') {
      try {
        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            this.chunks.push(e.data);
          }
        };
        this.mediaRecorder.onstop = () => {
          const durationSec = Math.max(1, Math.round((Date.now() - this.startedAt) / 1000));
          const blob = this.chunks.length > 0 ? new Blob(this.chunks, { type: 'audio/webm' }) : null;
          const url = blob ? URL.createObjectURL(blob) : null;
          callbacks.onRecordingComplete(url, durationSec, blob);
        };
        this.mediaRecorder.start(250);
      } catch {
        this.mediaRecorder = null;
      }
    }

    // Web Speech API for live transcription
    const SpeechRec = getSpeechRecognitionConstructor();
    if (!SpeechRec) {
      callbacks.onSpeechError(
        'Live speech-to-text is not supported in this browser (your audio is still being recorded). You can type or edit your complaint below.'
      );
      return;
    }

    try {
      const rec = new SpeechRec();
      const langMeta = getLanguageOption(language);
      rec.lang = langMeta.speechLocale;
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onresult = (event: BrowserSpeechRecognitionEvent) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          const text = result[0]?.transcript ?? '';
          if (result.isFinal) {
            this.finalTranscript = `${this.finalTranscript} ${text}`.trim();
          } else {
            interim += text;
          }
        }
        callbacks.onTranscriptUpdate(this.finalTranscript, interim.trim());
      };

      rec.onerror = (event: BrowserSpeechRecognitionErrorEvent) => {
        if (this.stopped && event.error === 'aborted') return;
        callbacks.onSpeechError(mapSpeechError(event.error));
      };

      rec.onend = () => {
        // Keep media recording alive until user hits Stop
      };

      rec.start();
      this.recognition = rec;
    } catch {
      callbacks.onSpeechError(
        'Could not start browser speech recognition. Audio is still recording — you can type your text below.'
      );
    }
  }

  stop(cancel = false): void {
    this.stopped = true;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.recognition) {
      try {
        if (cancel) this.recognition.abort();
        else this.recognition.stop();
      } catch {
        // ignore
      }
      this.recognition = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {
        // ignore
      }
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

export function speakText(
  text: string,
  language: LanguageCode,
  onEnd?: () => void
): boolean {
  if (!isSpeechSynthesisSupported() || !text.trim()) return false;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const targetLocale = getLanguageOption(language).speechLocale;
    utterance.lang = targetLocale;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const langPrefix = targetLocale.split('-')[0];
    const matchedVoice =
      voices.find((v) => v.lang.toLowerCase() === targetLocale.toLowerCase()) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}
