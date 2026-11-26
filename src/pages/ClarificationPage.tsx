import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Edit3,
  MessageSquareText,
  Mic,
  Send,
  Sparkles,
  Square,
} from 'lucide-react';
import { CATEGORY_LIST, getDepartmentForCategory } from '../data/categories';
import { UI_COPY } from '../data/i18n';
import { VoiceRecordingSession } from '../services/speechService';
import type {
  AIExtractionResult,
  ClarificationAnswer,
  ComplaintCategory,
  LanguageCode,
} from '../types/complaint';

interface ClarificationPageProps {
  language: LanguageCode;
  transcript: string;
  extraction: AIExtractionResult;
  initialAnswers: ClarificationAnswer[];
  onComplete: (updates: {
    category: ComplaintCategory;
    department: string;
    location: string;
    description: string;
    answers: ClarificationAnswer[];
  }) => void;
}

export function ClarificationPage({
  language,
  transcript,
  extraction,
  initialAnswers,
  onComplete,
}: ClarificationPageProps) {
  const t = UI_COPY[language];
  const questions = extraction.clarificationQuestions;

  const [answers, setAnswers] = useState<ClarificationAnswer[]>(initialAnswers);
  const [currentIdx, setCurrentIdx] = useState<number>(
    Math.min(initialAnswers.length, Math.max(0, questions.length))
  );
  const [customInput, setCustomInput] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceSession, setVoiceSession] = useState<VoiceRecordingSession | null>(null);

  // Editable summary fields so user can fix anything anytime
  const [selectedCategory, setSelectedCategory] = useState<ComplaintCategory>(
    extraction.category === 'Uncertain' ? 'Road damage' : extraction.category
  );
  const [locationDraft, setLocationDraft] = useState(extraction.location);
  const [descriptionDraft, setDescriptionDraft] = useState(extraction.description);

  const isFinishedQuestions = currentIdx >= questions.length;
  const activeQuestion = !isFinishedQuestions ? questions[currentIdx] : null;

  const applyAnswer = (answerText: string) => {
    if (!activeQuestion) return;
    const trimmed = answerText.trim();
    if (!trimmed) return;

    const updatedAnswer: ClarificationAnswer = {
      questionId: activeQuestion.id,
      field: activeQuestion.field,
      question: activeQuestion.question,
      answer: trimmed,
    };

    const filtered = answers.filter((a) => a.questionId !== activeQuestion.id);
    const nextAnswers = [...filtered, updatedAnswer];
    setAnswers(nextAnswers);

    if (activeQuestion.field === 'category') {
      const matched = CATEGORY_LIST.find(
        (c) => c.category.toLowerCase() === trimmed.toLowerCase()
      );
      if (matched) {
        setSelectedCategory(matched.category);
      }
    } else if (activeQuestion.field === 'location') {
      setLocationDraft((prev) =>
        prev && !trimmed.toLowerCase().includes(prev.toLowerCase())
          ? `${trimmed} (${prev})`
          : trimmed
      );
    } else if (activeQuestion.field === 'details') {
      setDescriptionDraft((prev) => `${prev} Additional context: ${trimmed}.`);
    }

    setCustomInput('');
    setShowOtherInput(false);
    setVoiceError(null);
    setCurrentIdx(currentIdx + 1);
  };

  const toggleVoiceAnswer = async () => {
    if (isListeningVoice && voiceSession) {
      voiceSession.stop(false);
      setVoiceSession(null);
      setIsListeningVoice(false);
      return;
    }

    setVoiceError(null);
    const session = new VoiceRecordingSession();
    setVoiceSession(session);
    setShowOtherInput(true);
    try {
      setIsListeningVoice(true);
      await session.start(language, {
        onTranscriptUpdate: (finalChunk, interimChunk) => {
          setCustomInput(`${finalChunk}${interimChunk ? ' ' + interimChunk : ''}`.trim());
        },
        onLevelUpdate: () => {},
        onSpeechError: (msg) => {
          setVoiceError(msg);
          setIsListeningVoice(false);
        },
        onRecordingComplete: () => {
          setIsListeningVoice(false);
        },
      });
    } catch (err) {
      setIsListeningVoice(false);
      setVoiceError(err instanceof Error ? err.message : 'Microphone unavailable.');
    }
  };

  const handleProceed = () => {
    if (isListeningVoice && voiceSession) {
      voiceSession.stop(true);
    }
    onComplete({
      category: selectedCategory,
      department: getDepartmentForCategory(selectedCategory),
      location: locationDraft,
      description: descriptionDraft,
      answers,
    });
  };

  const totalSteps = Math.max(1, questions.length);
  const progressPercent = isFinishedQuestions
    ? 100
    : Math.round(((currentIdx + 1) / (totalSteps + 1)) * 100);

  return (
    <div className="space-y-6">
      {/* Header + Progress Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#3F7375]">
            <Sparkles className="w-3.5 h-3.5" />
            {extraction.source === 'llm' ? 'AI Understanding' : 'Demo AI Understanding'}
          </span>
          {questions.length > 0 && (
            <span className="text-xs font-semibold text-[#5B6666]">
              {isFinishedQuestions
                ? 'All clarified'
                : `Question ${currentIdx + 1} of ${questions.length}`}
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-[#1E2525]">
          {isFinishedQuestions ? 'Ready for location & photos' : t.clarifyHeading}
        </h1>
        <p className="text-sm text-[#5B6666]">{t.clarifySubheading}</p>

        {/* Progress Bar */}
        <div className="h-2 w-full rounded-full bg-[#E6E2D9] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#3F7375] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* What AI Understood So Far (Compact & Transparent) */}
      <div className="rounded-2xl bg-white border border-[#E6E2D9] p-4 text-sm space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-[#5B6666]">
            <MessageSquareText className="w-4 h-4 text-[#3F7375] shrink-0" />
            <span className="italic line-clamp-2">“{transcript}”</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="px-2.5 py-1 rounded-lg bg-[#E9F1F1] text-[#2F595B] text-xs font-semibold">
            Category:{' '}
            {extraction.category === 'Uncertain' && currentIdx === 0
              ? 'Needs confirmation'
              : selectedCategory}
          </span>
          {locationDraft && (
            <span className="px-2.5 py-1 rounded-lg bg-[#F5F2EB] text-[#1E2525] text-xs font-medium">
              Location: {locationDraft}
            </span>
          )}
        </div>
      </div>

      {/* Previously Answered Questions (Editable) */}
      {answers.length > 0 && (
        <div className="space-y-2.5">
          {answers.map((item) => {
            const qIdx = questions.findIndex((q) => q.id === item.questionId);
            return (
              <div
                key={item.questionId}
                className="rounded-2xl bg-white/80 border border-[#E6E2D9] px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs text-[#5B6666] truncate">{item.question}</p>
                  <p className="text-sm font-semibold text-[#1E2525]">{item.answer}</p>
                </div>
                {qIdx >= 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentIdx(qIdx);
                      setShowOtherInput(false);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#3F7375] hover:underline shrink-0 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Change
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Active Single Conversational Question */}
      {activeQuestion ? (
        <section className="rounded-3xl bg-white border border-[#E6E2D9] p-5 shadow-[0_4px_20px_rgba(30,37,37,0.05)] space-y-4">
          <p className="text-lg font-bold text-[#1E2525] leading-snug">
            {activeQuestion.question}
          </p>

          {/* Suggested Chips */}
          <div className="flex flex-wrap gap-2.5">
            {activeQuestion.options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => applyAnswer(opt)}
                className="px-4 py-2.5 rounded-xl border border-[#DDD8CE] bg-[#FAF9F6] hover:bg-[#E9F1F1] hover:border-[#3F7375] text-sm font-semibold text-[#1E2525] transition cursor-pointer"
              >
                {opt}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setShowOtherInput(true)}
              className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition cursor-pointer ${
                showOtherInput
                  ? 'border-[#3F7375] bg-[#E9F1F1] text-[#2F595B]'
                  : 'border-dashed border-[#B9B3A7] bg-white text-[#5B6666] hover:border-[#3F7375]'
              }`}
            >
              Other (type or speak)
            </button>
          </div>

          {/* Voice or Text Answer Input */}
          {(showOtherInput || activeQuestion.allowVoice) && (
            <div className="pt-2 border-t border-[#F0EDE6] space-y-2.5">
              {voiceError && (
                <p className="text-xs text-rose-700 font-medium">{voiceError}</p>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customInput.trim()) {
                      e.preventDefault();
                      applyAnswer(customInput);
                    }
                  }}
                  placeholder="Type your answer or tap mic to reply..."
                  className="flex-1 rounded-xl border border-[#DDD8CE] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#1E2525] focus:outline-none focus:ring-2 focus:ring-[#3F7375]/35"
                />
                <button
                  type="button"
                  onClick={toggleVoiceAnswer}
                  aria-label={isListeningVoice ? 'Stop voice reply' : 'Answer by voice'}
                  className={`p-2.5 rounded-xl border transition cursor-pointer ${
                    isListeningVoice
                      ? 'bg-rose-600 border-rose-600 text-white animate-pulse'
                      : 'bg-white border-[#DDD8CE] text-[#3F7375] hover:bg-[#E9F1F1]'
                  }`}
                >
                  {isListeningVoice ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                  type="button"
                  disabled={!customInput.trim()}
                  onClick={() => applyAnswer(customInput)}
                  aria-label="Submit answer"
                  className="p-2.5 rounded-xl bg-[#3F7375] text-white disabled:opacity-40 hover:bg-[#325D5F] cursor-pointer"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </section>
      ) : (
        /* All questions answered or none needed: confirm category & summary */
        <section className="rounded-3xl bg-white border border-[#E6E2D9] p-5 shadow-[0_4px_20px_rgba(30,37,37,0.05)] space-y-4">
          <div className="flex items-center gap-2.5 text-[#3F7375]">
            <CheckCircle2 className="w-6 h-6" />
            <h2 className="text-lg font-bold text-[#1E2525]">
              Complaint details understood
            </h2>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="block text-xs font-bold uppercase tracking-wide text-[#5B6666] mb-1">
                Category (you can correct if needed)
              </span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as ComplaintCategory)}
                className="w-full rounded-xl border border-[#DDD8CE] bg-[#FAF9F6] px-3.5 py-2.5 text-sm font-semibold text-[#1E2525] focus:outline-none focus:ring-2 focus:ring-[#3F7375]/35"
              >
                {CATEGORY_LIST.map((item) => (
                  <option key={item.category} value={item.category}>
                    {item.category} — {item.department}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-xs font-bold uppercase tracking-wide text-[#5B6666] mb-1">
                Generated summary
              </span>
              <textarea
                rows={3}
                value={descriptionDraft}
                onChange={(e) => setDescriptionDraft(e.target.value)}
                className="w-full rounded-xl border border-[#DDD8CE] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#1E2525] focus:outline-none focus:ring-2 focus:ring-[#3F7375]/35"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handleProceed}
            className="w-full py-4 rounded-2xl bg-[#3F7375] hover:bg-[#325D5F] text-white font-bold text-base shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            Continue to Location & Evidence
            <ArrowRight className="w-5 h-5" />
          </button>
        </section>
      )}
    </div>
  );
}
