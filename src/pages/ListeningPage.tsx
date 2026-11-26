import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  Mic,
  RotateCcw,
  Square,
  Volume2,
  X,
} from 'lucide-react';
import { AudioWaveform } from '../components/AudioWaveform';
import { getLanguageOption, UI_COPY } from '../data/i18n';
import {
  isWebSpeechSupported,
  VoiceRecordingSession,
} from '../services/speechService';
import type { LanguageCode } from '../types/complaint';

interface ListeningPageProps {
  language: LanguageCode;
  initialTranscript?: string;
  autoStartRecording: boolean;
  isAnalyzing: boolean;
  onCancel: () => void;
  onContinue: (transcript: string, audioUrl: string | null, durationSec: number) => void;
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ListeningPage({
  language,
  initialTranscript = '',
  autoStartRecording,
  isAnalyzing,
  onCancel,
  onContinue,
}: ListeningPageProps) {
  const t = UI_COPY[language];
  const langMeta = getLanguageOption(language);

  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [finalText, setFinalText] = useState(initialTranscript);
  const [interimText, setInterimText] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [durationSec, setDurationSec] = useState(0);

  const sessionRef = useRef<VoiceRecordingSession | null>(null);
  const timerRef = useRef<number | null>(null);

  const stopTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    setSpeechError(null);
    setInterimText('');
    setSeconds(0);
    setAudioUrl(null);

    const session = new VoiceRecordingSession();
    sessionRef.current = session;

    try {
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);

      await session.start(language, {
        onTranscriptUpdate: (finalChunk, interimChunk) => {
          if (finalChunk) {
            setFinalText(finalChunk);
          }
          setInterimText(interimChunk);
        },
        onLevelUpdate: (lvl) => setLevel(lvl),
        onSpeechError: (friendlyMsg) => {
          setSpeechError(friendlyMsg);
        },
        onRecordingComplete: (url, dur) => {
          setAudioUrl(url);
          setDurationSec(dur);
        },
      });
    } catch (err) {
      stopTimer();
      setIsRecording(false);
      setSpeechError(err instanceof Error ? err.message : 'Microphone unavailable.');
    }
  };

  const stopRecording = (cancel = false) => {
    stopTimer();
    setIsRecording(false);
    setLevel(0);
    if (sessionRef.current) {
      sessionRef.current.stop(cancel);
      sessionRef.current = null;
    }
  };

  useEffect(() => {
    if (autoStartRecording && !initialTranscript) {
      startRecording();
    }
    return () => {
      stopTimer();
      if (sessionRef.current) {
        sessionRef.current.stop(true);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRedo = () => {
    stopRecording(true);
    setFinalText('');
    setInterimText('');
    setSpeechError(null);
    startRecording();
  };

  const handleCancel = () => {
    stopRecording(true);
    onCancel();
  };

  const combinedDisplay = isRecording
    ? `${finalText}${interimText ? (finalText ? ' ' : '') + interimText : ''}`
    : finalText;

  const canContinue = combinedDisplay.trim().length >= 5 && !isAnalyzing;

  return (
    <div className="space-y-6">
      {/* Header status */}
      <div className="text-center space-y-2 pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E9F1F1] text-[#2F595B] text-xs font-semibold">
          <span
            className={`w-2 h-2 rounded-full ${
              isRecording ? 'bg-rose-500 animate-pulse' : 'bg-[#3F7375]'
            }`}
          />
          {langMeta.nativeLabel} ({langMeta.label})
        </div>

        <h1 className="text-2xl font-bold text-[#1E2525]">
          {isRecording ? t.listeningHeading : 'Review your complaint'}
        </h1>

        <p className="text-2xl font-mono font-bold text-[#3F7375] tracking-wider">
          {formatTimer(seconds)}
        </p>

        <AudioWaveform active={isRecording} level={level} />
      </div>

      {/* Browser Speech Support Notice if unavailable */}
      {!isWebSpeechSupported() && !speechError && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-700" />
          <div>
            Live browser speech-to-text is unavailable in this browser. Your voice is still
            recorded as audio if permitted, and you can type or edit your complaint directly below.
          </div>
        </div>
      )}

      {/* Honest Error Display when recognition fails */}
      {speechError && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-900 space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-700" />
            <p className="font-medium leading-relaxed">{speechError}</p>
          </div>
          <div className="flex flex-wrap gap-2 pl-7">
            <button
              type="button"
              onClick={handleRedo}
              className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-xs font-semibold text-rose-800 hover:bg-rose-100 cursor-pointer"
            >
              Try recording again
            </button>
            <button
              type="button"
              onClick={() => {
                stopRecording(true);
                setSpeechError(null);
                setFinalText(langMeta.samplePrompt);
              }}
              className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-xs font-semibold text-[#3F7375] hover:bg-[#E9F1F1] cursor-pointer"
            >
              Use {langMeta.nativeLabel} demo sample
            </button>
          </div>
        </div>
      )}

      {/* White Card: WHAT WE HEARD */}
      <section className="rounded-3xl bg-white border border-[#E6E2D9] p-5 shadow-[0_4px_20px_rgba(30,37,37,0.05)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-widest uppercase text-[#3F7375]">
            {t.whatWeHeard}
          </span>
          {audioUrl && !isRecording && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#5B6666]">
              <Volume2 className="w-3.5 h-3.5 text-[#3F7375]" />
              {durationSec}s audio captured
            </span>
          )}
        </div>

        {isRecording ? (
          <div className="min-h-[120px] rounded-2xl bg-[#FAF9F6] border border-[#EAE6DD] p-4 text-lg leading-relaxed text-[#1E2525]">
            {combinedDisplay ? (
              <span>
                {finalText}
                {interimText && (
                  <span className="text-[#5B6666] italic">
                    {finalText ? ' ' : ''}
                    {interimText}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-[#8B9494]">
                Speak naturally in {langMeta.nativeLabel}... We are listening.
              </span>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              rows={4}
              value={finalText}
              onChange={(e) => setFinalText(e.target.value)}
              placeholder={`Type or edit your ${langMeta.label} complaint here...`}
              className="w-full rounded-2xl border border-[#DDD8CE] bg-[#FAF9F6] p-4 text-base sm:text-lg leading-relaxed text-[#1E2525] focus:outline-none focus:ring-2 focus:ring-[#3F7375]/35 focus:border-[#3F7375]"
            />
            <p className="text-xs text-[#5B6666]">{t.editTranscriptHint}</p>
          </div>
        )}

        {audioUrl && !isRecording && (
          <audio controls src={audioUrl} className="w-full h-10 mt-2" />
        )}
      </section>

      {/* Action Controls: Stop / Record, Redo, Cancel, Continue */}
      <div className="flex flex-col gap-3">
        {isRecording ? (
          <button
            type="button"
            onClick={() => stopRecording(false)}
            className="w-full py-4 rounded-2xl bg-[#3F7375] hover:bg-[#325D5F] text-white font-bold text-base shadow-md flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Square className="w-5 h-5 fill-current" />
            {t.stop}
          </button>
        ) : (
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => onContinue(finalText.trim(), audioUrl, durationSec)}
            className="w-full py-4 rounded-2xl bg-[#3F7375] hover:bg-[#325D5F] disabled:opacity-50 text-white font-bold text-base shadow-md flex items-center justify-center gap-2.5 cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Understanding your complaint...
              </>
            ) : (
              <>
                {t.continueBtn}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={isRecording ? handleRedo : startRecording}
            disabled={isAnalyzing}
            className="py-3 rounded-2xl bg-white border border-[#DDD8CE] hover:bg-[#F3F0EA] text-[#1E2525] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isRecording ? <RotateCcw className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#3F7375]" />}
            {isRecording ? t.redo : 'Record again'}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={isAnalyzing}
            className="py-3 rounded-2xl bg-white border border-[#DDD8CE] hover:bg-rose-50 hover:text-rose-800 text-[#5B6666] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
