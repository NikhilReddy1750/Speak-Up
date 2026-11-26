import { useState } from 'react';
import {
  Bell,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  MapPin,
  Share2,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import type { Complaint, ComplaintStatus, LanguageCode } from '../types/complaint';

interface ComplaintTrackingPageProps {
  language: LanguageCode;
  complaint: Complaint;
  onSendReminder: (id: string) => Promise<void>;
  onDemoAdvanceStatus: (id: string, status: ComplaintStatus, note: string) => Promise<void>;
}

const ORDERED_STAGES: Array<{
  status: ComplaintStatus;
  label: string;
  pendingLabel: string;
}> = [
  {
    status: 'submitted',
    label: 'Submitted',
    pendingLabel: 'Not submitted yet',
  },
  {
    status: 'received',
    label: 'Received by department',
    pendingLabel: 'Awaiting department acknowledgement',
  },
  {
    status: 'in_progress',
    label: 'Assigned / In progress',
    pendingLabel: 'Awaiting officer assignment',
  },
  {
    status: 'resolved',
    label: 'Resolved',
    pendingLabel: 'Pending resolution',
  },
];

export function ComplaintTrackingPage({
  language,
  complaint,
  onSendReminder,
  onDemoAdvanceStatus,
}: ComplaintTrackingPageProps) {
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [reminderFeedback, setReminderFeedback] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  const stageIndexMap: Record<ComplaintStatus, number> = {
    submitted: 0,
    received: 1,
    in_progress: 2,
    resolved: 3,
  };
  const currentStageIndex = stageIndexMap[complaint.status];

  const handleShare = async () => {
    const shareText = `SpeakUp Complaint ${complaint.reference_number}\nIssue: ${complaint.title}\nLocation: ${complaint.location}\nDepartment: ${complaint.department}\nStatus: ${complaint.status.replace('_', ' ')}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `SpeakUp ${complaint.reference_number}`,
          text: shareText,
        });
        setShareFeedback('Shared successfully.');
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setShareFeedback('Complaint details copied to clipboard.');
      }
    } catch {
      setShareFeedback('Could not open share dialog.');
    }
    window.setTimeout(() => setShareFeedback(null), 3000);
  };

  const handleReminder = async () => {
    await onSendReminder(complaint.id);
    setReminderFeedback(
      complaint.is_demo
        ? 'Reminder logged locally in Demo Mode.'
        : 'Follow-up reminder logged for the assigned department.'
    );
    window.setTimeout(() => setReminderFeedback(null), 4000);
  };

  const nextStatusMap: Record<
    ComplaintStatus,
    { status: ComplaintStatus; buttonLabel: string; note: string } | null
  > = {
    submitted: {
      status: 'received',
      buttonLabel: 'Simulate: Mark Received by Dept.',
      note: 'Acknowledged by municipal grievance desk (Demo simulator).',
    },
    received: {
      status: 'in_progress',
      buttonLabel: 'Simulate: Assign Officer / In Progress',
      note: 'Field engineer assigned and inspection scheduled (Demo simulator).',
    },
    in_progress: {
      status: 'resolved',
      buttonLabel: 'Simulate: Mark Resolved',
      note: 'Work completed and verified on site (Demo simulator).',
    },
    resolved: null,
  };

  const nextTransition = nextStatusMap[complaint.status];

  return (
    <div className="space-y-6">
      {/* Header Summary Card */}
      <section className="rounded-3xl bg-white border border-[#E6E2D9] p-5 sm:p-6 shadow-[0_4px_20px_rgba(30,37,37,0.05)] space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-[#3F7375] bg-[#E9F1F1] px-2.5 py-1 rounded-lg">
                {complaint.reference_number}
              </span>
              {complaint.is_demo && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Demo Record
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1E2525] pt-1">
              {complaint.title}
            </h1>
          </div>
          <StatusBadge status={complaint.status} language={language} size="md" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm pt-1">
          <div className="flex items-start gap-2.5 text-[#5B6666]">
            <Building2 className="w-4 h-4 text-[#3F7375] shrink-0 mt-0.5" />
            <span>{complaint.department}</span>
          </div>
          <div className="flex items-start gap-2.5 text-[#5B6666]">
            <MapPin className="w-4 h-4 text-[#3F7375] shrink-0 mt-0.5" />
            <span>{complaint.location}</span>
          </div>
        </div>

        {/* Action Buttons: Send Reminder & Share */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-[#F0EDE6]">
          <button
            type="button"
            disabled={complaint.status === 'resolved'}
            onClick={handleReminder}
            className="flex-1 min-w-[150px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#3F7375] hover:bg-[#325D5F] disabled:opacity-45 text-white text-sm font-semibold cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            Send reminder
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 min-w-[150px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#DDD8CE] hover:bg-[#F3F0EA] text-[#1E2525] text-sm font-semibold cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            Share complaint
          </button>
        </div>

        {(reminderFeedback || shareFeedback || complaint.reminder_sent_at) && (
          <div className="text-xs font-medium text-[#2F595B] bg-[#E9F1F1] px-3.5 py-2 rounded-xl">
            {reminderFeedback ||
              shareFeedback ||
              `Last reminder logged on ${new Date(complaint.reminder_sent_at!).toLocaleString()}`}
          </div>
        )}
      </section>

      {/* Vertical Status Timeline */}
      <section className="rounded-3xl bg-white border border-[#E6E2D9] p-5 sm:p-6 shadow-[0_4px_20px_rgba(30,37,37,0.05)] space-y-4">
        <h2 className="text-base font-bold text-[#1E2525]">Status timeline</h2>

        <div className="space-y-0">
          {ORDERED_STAGES.map((stage, idx) => {
            const recordedEvent = complaint.status_history.find(
              (ev) => ev.status === stage.status
            );
            const reached = idx <= currentStageIndex && Boolean(recordedEvent);
            const isLast = idx === ORDERED_STAGES.length - 1;

            return (
              <div key={stage.status} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 ${
                      reached
                        ? 'bg-[#3F7375] border-[#3F7375] text-white'
                        : 'bg-white border-[#D6D1C7] text-[#9CA3AF]'
                    }`}
                  >
                    {reached ? (
                      stage.status === 'resolved' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </span>
                  {!isLast && (
                    <span
                      className={`w-0.5 flex-1 min-h-[36px] my-1 ${
                        idx < currentStageIndex ? 'bg-[#3F7375]' : 'bg-[#E6E2D9]'
                      }`}
                    />
                  )}
                </div>

                <div className="pb-6 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p
                      className={`text-sm font-bold ${
                        reached ? 'text-[#1E2525]' : 'text-[#7B8484]'
                      }`}
                    >
                      {recordedEvent ? recordedEvent.title : stage.label}
                    </p>
                    {recordedEvent && (
                      <span className="text-xs text-[#5B6666]">
                        {new Date(recordedEvent.timestamp).toLocaleString(undefined, {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5B6666] mt-0.5 leading-relaxed">
                    {recordedEvent ? recordedEvent.description : stage.pendingLabel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Full Description & Evidence */}
      <section className="rounded-3xl bg-white border border-[#E6E2D9] p-5 sm:p-6 shadow-[0_4px_20px_rgba(30,37,37,0.05)] space-y-4">
        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-[#1E2525]">Complaint description</h2>
          <p className="text-sm leading-relaxed text-[#1E2525]">{complaint.description}</p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowTranscript((prev) => !prev)}
            className="text-xs font-semibold text-[#3F7375] hover:underline cursor-pointer"
          >
            {showTranscript ? 'Hide original spoken transcript' : 'View original spoken transcript'}
          </button>
          {showTranscript && (
            <p className="mt-2 rounded-2xl bg-[#FAF9F6] border border-[#EAE6DD] p-3 text-sm italic text-[#5B6666]">
              “{complaint.original_transcript}”
            </p>
          )}
        </div>

        {(complaint.evidence_urls.length > 0 || complaint.voice_note_url) && (
          <div className="space-y-2.5 pt-2 border-t border-[#F0EDE6]">
            <h3 className="text-sm font-bold text-[#1E2525]">Uploaded evidence</h3>
            <div className="grid grid-cols-2 gap-3">
              {complaint.evidence_urls.map((ev) =>
                ev.type === 'image' ? (
                  <img
                    key={ev.id}
                    src={ev.dataUrl}
                    alt={ev.name}
                    className="w-full h-36 object-cover rounded-2xl border border-[#E6E2D9]"
                  />
                ) : (
                  <video
                    key={ev.id}
                    src={ev.dataUrl}
                    controls
                    className="w-full h-36 rounded-2xl border border-[#E6E2D9] bg-black"
                  />
                )
              )}
            </div>
            {complaint.voice_note_url && (
              <audio controls src={complaint.voice_note_url} className="w-full h-10" />
            )}
          </div>
        )}
      </section>

      {/* Clearly Labelled Demo / Admin Simulator */}
      {complaint.is_demo && (
        <section className="rounded-3xl bg-[#F2EFE8] border border-dashed border-[#B9B3A7] p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5B6666]">
            <Wrench className="w-4 h-4 text-[#3F7375]" />
            Demo / Judge Status Simulator
          </div>
          <p className="text-xs text-[#5B6666]">
            Use this demo control to test how department status updates appear on the citizen timeline.
          </p>
          {nextTransition ? (
            <button
              type="button"
              onClick={() =>
                onDemoAdvanceStatus(
                  complaint.id,
                  nextTransition.status,
                  nextTransition.note
                )
              }
              className="px-4 py-2.5 rounded-xl bg-white border border-[#3F7375] text-[#2F595B] text-sm font-bold hover:bg-[#E9F1F1] cursor-pointer"
            >
              {nextTransition.buttonLabel}
            </button>
          ) : (
            <p className="text-xs font-semibold text-emerald-800">
              This demo complaint has reached the final Resolved stage.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
