import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Edit3,
  FileCheck2,
  Loader2,
  MapPin,
  ShieldCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CATEGORY_LIST, getDepartmentForCategory, URGENCY_LABELS } from '../data/categories';
import { buildConfirmationSpeech, UI_COPY } from '../data/i18n';
import { speakText, stopSpeaking } from '../services/speechService';
import type {
  Complaint,
  ComplaintCategory,
  DraftComplaint,
  LanguageCode,
  UrgencyLevel,
  UserSettings,
} from '../types/complaint';

interface ConfirmationPageProps {
  language: LanguageCode;
  draft: DraftComplaint;
  settings: UserSettings;
  isDemoMode: boolean;
  potentialDuplicate: Complaint | null;
  submitting: boolean;
  submitError: string | null;
  onUpdateDraft: (patch: Partial<DraftComplaint>) => void;
  onEditStep: () => void;
  onSubmit: () => void;
  onViewDuplicate: (id: string) => void;
}

export function ConfirmationPage({
  language,
  draft,
  settings,
  isDemoMode,
  potentialDuplicate,
  submitting,
  submitError,
  onUpdateDraft,
  onEditStep,
  onSubmit,
  onViewDuplicate,
}: ConfirmationPageProps) {
  const t = UI_COPY[language];
  const [editingInline, setEditingInline] = useState(false);
  const [consentChecked, setConsentChecked] = useState(!settings.askBeforeSending);

  const urgencyMeta = URGENCY_LABELS[draft.urgency];
  const fullLocation = draft.landmark
    ? `${draft.location} · ${draft.landmark}`
    : draft.location;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-[#1E2525]">{t.confirmHeading}</h1>
        <p className="text-sm text-[#5B6666]">
          Please double-check every detail before submitting.
        </p>
      </div>

      {/* Duplicate Detection Warning */}
      {potentialDuplicate && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 space-y-2">
          <div className="flex items-start gap-2.5 text-amber-900">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-700" />
            <div className="text-sm space-y-1">
              <p className="font-bold">Possible duplicate complaint detected</p>
              <p>
                An active complaint (<strong>{potentialDuplicate.reference_number}</strong> — “
                {potentialDuplicate.title}”) was recently reported for{' '}
                <strong>{potentialDuplicate.category}</strong> near{' '}
                <strong>{potentialDuplicate.location}</strong>.
              </p>
            </div>
          </div>
          <div className="pl-7">
            <button
              type="button"
              onClick={() => onViewDuplicate(potentialDuplicate.id)}
              className="text-xs font-bold text-[#3F7375] hover:underline cursor-pointer"
            >
              View existing complaint instead →
            </button>
          </div>
        </div>
      )}

      {/* Main Review Card */}
      <section className="rounded-3xl bg-white border border-[#E6E2D9] p-5 sm:p-6 shadow-[0_4px_20px_rgba(30,37,37,0.05)] space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 flex-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#3F7375]">
              Complaint Summary
            </span>
            {editingInline ? (
              <input
                type="text"
                value={draft.title}
                onChange={(e) => onUpdateDraft({ title: e.target.value })}
                className="w-full rounded-xl border border-[#DDD8CE] px-3 py-2 text-lg font-bold text-[#1E2525]"
              />
            ) : (
              <h2 className="text-xl font-bold text-[#1E2525]">{draft.title}</h2>
            )}
          </div>
          <button
            type="button"
            onClick={() => setEditingInline((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F6F1] border border-[#E6E2D9] text-xs font-semibold text-[#1E2525] hover:bg-[#EAE6DD] cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {editingInline ? 'Done' : t.editDetailsBtn}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {/* Category */}
          <div className="rounded-2xl bg-[#FAF9F6] border border-[#EAE6DD] p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#5B6666] mb-1">
              Category
            </p>
            {editingInline ? (
              <select
                value={draft.category}
                onChange={(e) => {
                  const cat = e.target.value as ComplaintCategory;
                  onUpdateDraft({
                    category: cat,
                    department: getDepartmentForCategory(cat),
                  });
                }}
                className="w-full rounded-lg border border-[#DDD8CE] bg-white px-2.5 py-1.5 text-sm font-semibold"
              >
                {CATEGORY_LIST.map((c) => (
                  <option key={c.category} value={c.category}>
                    {c.category}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm font-bold text-[#1E2525]">{draft.category}</p>
            )}
          </div>

          {/* Urgency */}
          <div className="rounded-2xl bg-[#FAF9F6] border border-[#EAE6DD] p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#5B6666] mb-1">
              Urgency
            </p>
            {editingInline ? (
              <select
                value={draft.urgency}
                onChange={(e) => onUpdateDraft({ urgency: e.target.value as UrgencyLevel })}
                className="w-full rounded-lg border border-[#DDD8CE] bg-white px-2.5 py-1.5 text-sm font-semibold"
              >
                <option value="low">Low priority</option>
                <option value="medium">Medium priority</option>
                <option value="high">High urgency</option>
              </select>
            ) : (
              <span
                className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${urgencyMeta.badgeClass}`}
              >
                {urgencyMeta.label}
              </span>
            )}
          </div>
        </div>

        {/* Responsible Department */}
        <div className="flex items-start gap-3 rounded-2xl bg-[#E9F1F1]/70 border border-[#3F7375]/20 p-3.5">
          <Building2 className="w-5 h-5 text-[#3F7375] shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#2F595B]">
              Responsible department
            </p>
            <p className="text-sm font-semibold text-[#1E2525]">{draft.department}</p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-[#3F7375] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#5B6666]">Location</p>
            <p className="text-sm font-semibold text-[#1E2525]">{fullLocation}</p>
            {draft.latitude !== null && draft.longitude !== null && (
              <p className="text-xs text-[#5B6666]">
                Coordinates: {draft.latitude.toFixed(4)}, {draft.longitude.toFixed(4)}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wide text-[#5B6666]">
            Complaint description
          </p>
          {editingInline ? (
            <textarea
              rows={3}
              value={draft.description}
              onChange={(e) => onUpdateDraft({ description: e.target.value })}
              className="w-full rounded-xl border border-[#DDD8CE] p-3 text-sm text-[#1E2525]"
            />
          ) : (
            <p className="text-sm leading-relaxed text-[#1E2525] bg-[#FAF9F6] rounded-2xl p-3.5 border border-[#EAE6DD]">
              {draft.description}
            </p>
          )}
        </div>

        {/* Evidence Summary */}
        {(draft.evidence.length > 0 || draft.voiceNote) && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-[#5B6666]">
              Attached evidence
            </p>
            <div className="flex flex-wrap gap-2">
              {draft.evidence.map((ev) => (
                <span
                  key={ev.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF9F6] border border-[#E6E2D9] text-xs font-medium text-[#1E2525]"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-[#3F7375]" />
                  {ev.name}
                </span>
              ))}
              {draft.voiceNote && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF9F6] border border-[#E6E2D9] text-xs font-medium text-[#1E2525]">
                  <Volume2 className="w-3.5 h-3.5 text-[#3F7375]" />
                  {draft.voiceNote.name}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="rounded-2xl bg-[#F8F6F1] border border-[#E6E2D9] p-3.5 text-xs text-[#5B6666] flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#3F7375] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p>
              {settings.deleteRecordingsAfterFiling
                ? 'Privacy setting active: raw voice recording will be discarded after filing (transcript is kept).'
                : 'Privacy setting: your voice note/recording will be retained with your complaint.'}
            </p>
            {isDemoMode && (
              <p className="font-semibold text-[#2F595B]">
                Demo Mode notice: this complaint is saved locally for demonstration and is NOT
                transmitted to a live municipal authority.
              </p>
            )}
          </div>
        </div>

        {/* Ask before sending confirmation */}
        {settings.askBeforeSending && (
          <label className="flex items-start gap-3 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[#B9B3A7] text-[#3F7375] focus:ring-[#3F7375]"
            />
            <span className="text-sm text-[#1E2525]">
              I confirm these details are accurate and want to submit this complaint
              {isDemoMode ? ' in Demo Mode.' : '.'}
            </span>
          </label>
        )}
      </section>

      {submitError && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800 font-medium">
          {submitError}
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={onEditStep}
          disabled={submitting}
          className="py-3.5 rounded-2xl bg-white border border-[#DDD8CE] hover:bg-[#F3F0EA] font-semibold text-[#1E2525] cursor-pointer"
        >
          Back & Edit
        </button>

        <button
          type="button"
          disabled={submitting || !consentChecked}
          onClick={onSubmit}
          className="sm:col-span-2 py-3.5 rounded-2xl bg-[#3F7375] hover:bg-[#325D5F] disabled:opacity-50 text-white font-bold text-base shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Filing complaint...
            </>
          ) : (
            t.confirmSubmitBtn
          )}
        </button>
      </div>
    </div>
  );
}

interface SuccessPageProps {
  language: LanguageCode;
  complaint: Complaint;
  onTrackComplaint: () => void;
  onBackHome: () => void;
}

export function SuccessPage({
  language,
  complaint,
  onTrackComplaint,
  onBackHome,
}: SuccessPageProps) {
  const t = UI_COPY[language];
  const [speaking, setSpeaking] = useState(false);

  const speechText = buildConfirmationSpeech(
    language,
    complaint.reference_number,
    complaint.title,
    complaint.is_demo
  );

  const playConfirmation = () => {
    setSpeaking(true);
    const ok = speakText(speechText, language, () => setSpeaking(false));
    if (!ok) setSpeaking(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      playConfirmation();
    }, 350);
    return () => {
      window.clearTimeout(timer);
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaint.id]);

  return (
    <div className="space-y-6 pt-4">
      <section className="rounded-3xl bg-white border border-[#E6E2D9] p-6 sm:p-8 text-center shadow-[0_6px_28px_rgba(30,37,37,0.06)] space-y-5">
        <div className="w-16 h-16 rounded-full bg-[#E9F1F1] text-[#3F7375] mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-1.5">
          {complaint.is_demo && (
            <span className="inline-block px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
              Demo Submission (Saved Locally)
            </span>
          )}
          <h1 className="text-2xl font-bold text-[#1E2525]">
            {complaint.is_demo
              ? 'Demo complaint recorded!'
              : 'Complaint submitted successfully!'}
          </h1>
          <p className="text-sm text-[#5B6666]">
            {complaint.is_demo
              ? 'Saved in your browser for demonstration. Not sent to a live municipal office.'
              : `Routed to ${complaint.department}.`}
          </p>
        </div>

        {/* Reference ID Box */}
        <div className="rounded-2xl bg-[#F8F6F1] border border-[#E6E2D9] p-4 space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-[#5B6666]">
            Reference ID
          </p>
          <p className="text-2xl font-mono font-extrabold text-[#3F7375] tracking-wider">
            {complaint.reference_number}
          </p>
          <p className="text-sm font-semibold text-[#1E2525] pt-1">{complaint.title}</p>
        </div>

        {/* Spoken Confirmation Controls */}
        <div className="flex justify-center">
          {speaking ? (
            <button
              type="button"
              onClick={() => {
                stopSpeaking();
                setSpeaking(false);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E9F1F1] text-[#2F595B] text-sm font-semibold cursor-pointer"
            >
              <VolumeX className="w-4 h-4" />
              Stop reading aloud
            </button>
          ) : (
            <button
              type="button"
              onClick={playConfirmation}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E9F1F1] hover:bg-[#DCE9E9] text-[#2F595B] text-sm font-semibold cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              {t.listenAloud}
            </button>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onTrackComplaint}
          className="py-4 rounded-2xl bg-[#3F7375] hover:bg-[#325D5F] text-white font-bold text-base shadow-md cursor-pointer"
        >
          Track this complaint
        </button>
        <button
          type="button"
          onClick={onBackHome}
          className="py-4 rounded-2xl bg-white border border-[#DDD8CE] hover:bg-[#F3F0EA] text-[#1E2525] font-semibold text-base cursor-pointer"
        >
          Report another issue
        </button>
      </div>
    </div>
  );
}
