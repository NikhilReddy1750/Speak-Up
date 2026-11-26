import { useState } from 'react';
import { ArrowRight, ChevronRight, Keyboard, Mic, Sparkles } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { LANGUAGES, UI_COPY } from '../data/i18n';
import type { Complaint, LanguageCode } from '../types/complaint';

interface HomePageProps {
  language: LanguageCode;
  latestComplaint: Complaint | null;
  onStartVoice: () => void;
  onSubmitText: (text: string) => void;
  onOpenComplaint: (id: string) => void;
  onOpenAllComplaints: () => void;
}

export function HomePage({
  language,
  latestComplaint,
  onStartVoice,
  onSubmitText,
  onOpenComplaint,
  onOpenAllComplaints,
}: HomePageProps) {
  const t = UI_COPY[language];
  const langMeta = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];
  const [showTextBox, setShowTextBox] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [textError, setTextError] = useState<string | null>(null);

  const handleTextContinue = () => {
    const trimmed = typedText.trim();
    if (trimmed.length < 6) {
      setTextError('Please enter a few words describing the problem before continuing.');
      return;
    }
    setTextError(null);
    onSubmitText(trimmed);
  };

  return (
    <div className="space-y-8">
      {/* Main Hero Prompt & Microphone Action */}
      <section className="pt-4 pb-2 flex flex-col items-center text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#3F7375] bg-[#E9F1F1] px-3.5 py-1 rounded-full mb-4">
          {t.tagline}
        </p>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1E2525] max-w-md leading-snug">
          {t.homeHeading}
        </h1>

        {/* Large Circular Microphone Button */}
        <div className="relative my-9 flex items-center justify-center">
          <span
            className="absolute w-36 h-36 rounded-full bg-[#3F7375]/15 animate-pulse-ring pointer-events-none"
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={onStartVoice}
            aria-label={t.tapToSpeak}
            className="relative z-10 w-32 h-32 rounded-full bg-[#3F7375] hover:bg-[#325D5F] active:scale-95 text-white shadow-[0_12px_32px_rgba(63,115,117,0.32)] flex items-center justify-center transition-all cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#3F7375]/35"
          >
            <Mic className="w-12 h-12" strokeWidth={2} />
          </button>
        </div>

        {/* Tap to speak · or type instead */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-base text-[#5B6666]">
          <span className="font-semibold text-[#1E2525]">{t.tapToSpeak}</span>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => setShowTextBox((prev) => !prev)}
            className="inline-flex items-center gap-1.5 font-semibold text-[#3F7375] hover:underline cursor-pointer"
          >
            <Keyboard className="w-4 h-4" />
            {t.orTypeInstead}
          </button>
        </div>

        {/* Quick Demo Sample Pill for Judges / No-Mic Testing */}
        <button
          type="button"
          onClick={() => onSubmitText(langMeta.samplePrompt)}
          className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#E6E2D9] text-xs font-semibold text-[#5B6666] hover:text-[#3F7375] hover:border-[#3F7375]/40 shadow-2xs transition cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#3F7375]" />
          {t.speakSampleBtn} ({langMeta.nativeLabel})
        </button>
      </section>

      {/* Expandable Typed Complaint Input */}
      {showTextBox && (
        <section className="rounded-3xl bg-white border border-[#E6E2D9] p-5 shadow-[0_4px_20px_rgba(30,37,37,0.05)] space-y-3">
          <label htmlFor="home-typed-complaint" className="block text-sm font-semibold text-[#1E2525]">
            Describe your civic issue ({langMeta.nativeLabel})
          </label>
          <textarea
            id="home-typed-complaint"
            rows={3}
            value={typedText}
            onChange={(e) => {
              setTypedText(e.target.value);
              if (textError) setTextError(null);
            }}
            placeholder={t.typePlaceholder}
            className="w-full rounded-2xl border border-[#DDD8CE] bg-[#FAF9F6] px-4 py-3 text-base text-[#1E2525] placeholder:text-[#8B9494] focus:outline-none focus:ring-2 focus:ring-[#3F7375]/35 focus:border-[#3F7375]"
          />
          {textError && <p className="text-sm text-rose-700 font-medium">{textError}</p>}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowTextBox(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#5B6666] hover:bg-[#F3F0EA] cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={handleTextContinue}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3F7375] hover:bg-[#325D5F] text-white text-sm font-semibold shadow-sm cursor-pointer"
            >
              {t.analyzeTypedBtn}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* Latest Complaint Card */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#5B6666]">
            {t.latestComplaint}
          </h2>
          <button
            type="button"
            onClick={onOpenAllComplaints}
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#3F7375] hover:underline cursor-pointer"
          >
            {t.viewAll}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {latestComplaint ? (
          <button
            type="button"
            onClick={() => onOpenComplaint(latestComplaint.id)}
            className="w-full text-left rounded-3xl bg-white border border-[#E6E2D9] p-5 shadow-[0_2px_12px_rgba(30,37,37,0.04)] hover:border-[#3F7375]/45 hover:shadow-[0_6px_22px_rgba(63,115,117,0.08)] transition cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-semibold text-[#5B6666]">
                    {latestComplaint.reference_number}
                  </span>
                  {latestComplaint.is_demo && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#F3F0EA] text-[#5B6666]">
                      Demo
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-[#1E2525] truncate">
                  {latestComplaint.title}
                </h3>
                <p className="text-sm text-[#5B6666] truncate">{latestComplaint.department}</p>
              </div>
              <StatusBadge status={latestComplaint.status} language={language} />
            </div>

            <div className="mt-4 pt-3 border-t border-[#F0EDE6] flex items-center justify-between text-xs text-[#5B6666]">
              <span>{latestComplaint.location}</span>
              <span className="font-semibold text-[#3F7375] inline-flex items-center gap-1">
                Track progress <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </button>
        ) : (
          <div className="rounded-3xl bg-white border border-[#E6E2D9] p-6 text-center text-sm text-[#5B6666]">
            No complaints filed yet. Tap the microphone above to report your first issue.
          </div>
        )}
      </section>
    </div>
  );
}
