import { useRef, useState, type ChangeEvent } from 'react';
import {
  ArrowRight,
  Camera,
  FileVideo,
  Mic,
  Square,
  Trash2,
} from 'lucide-react';
import { LocationPinMap } from '../components/LocationPinMap';
import { UI_COPY } from '../data/i18n';
import type { EvidenceItem, LanguageCode } from '../types/complaint';

interface LocationEvidencePageProps {
  language: LanguageCode;
  location: string;
  landmark: string;
  latitude: number | null;
  longitude: number | null;
  locationConfirmed: boolean;
  evidence: EvidenceItem[];
  voiceNote: EvidenceItem | null;
  onUpdate: (patch: {
    location?: string;
    landmark?: string;
    latitude?: number | null;
    longitude?: number | null;
    locationConfirmed?: boolean;
    evidence?: EvidenceItem[];
    voiceNote?: EvidenceItem | null;
  }) => void;
  onContinue: () => void;
}

const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB limit for safe local persistence

export function LocationEvidencePage({
  language,
  location,
  landmark,
  latitude,
  longitude,
  locationConfirmed,
  evidence,
  voiceNote,
  onUpdate,
  onContinue,
}: LocationEvidencePageProps) {
  const t = UI_COPY[language];
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isRecordingNote, setIsRecordingNote] = useState(false);
  const [noteSeconds, setNoteSeconds] = useState(0);
  const [noteError, setNoteError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    files.forEach((file) => {
      if (file.size > MAX_FILE_BYTES) {
        setUploadError(`"${file.name}" is larger than 4 MB. Please choose a smaller file.`);
        return;
      }

      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      if (!isImage && !isVideo) {
        setUploadError(`Unsupported file type "${file.name}". Please upload a photo or video.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const item: EvidenceItem = {
            id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: isVideo ? 'video' : 'image',
            name: file.name,
            dataUrl: reader.result,
            sizeBytes: file.size,
          };
          onUpdate({ evidence: [...evidence, item] });
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const startVoiceNote = async () => {
    setNoteError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setNoteError('Voice note recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const started = Date.now();

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      recorder.onstop = () => {
        const dur = Math.max(1, Math.round((Date.now() - started) / 1000));
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            onUpdate({
              voiceNote: {
                id: `vn-${Date.now()}`,
                type: 'audio',
                name: `Voice note (${dur}s)`,
                dataUrl: reader.result,
                sizeBytes: blob.size,
                durationSec: dur,
              },
            });
          }
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((tr) => tr.stop());
      };

      recorder.start();
      recorderRef.current = recorder;
      setIsRecordingNote(true);
      setNoteSeconds(0);
      timerRef.current = window.setInterval(() => {
        setNoteSeconds((s) => s + 1);
      }, 1000);
    } catch {
      setNoteError('Microphone permission denied. Voice notes are optional.');
    }
  };

  const stopVoiceNote = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecordingNote(false);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  };

  const canProceed = location.trim().length >= 3 && locationConfirmed;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-[#1E2525]">{t.locationHeading}</h1>
        <p className="text-sm text-[#5B6666]">
          Confirm where the problem is. GPS and photos are optional — your landmark or area name works too.
        </p>
      </div>

      {/* Location Card */}
      <section className="rounded-3xl bg-white border border-[#E6E2D9] p-5 shadow-[0_4px_20px_rgba(30,37,37,0.05)]">
        <LocationPinMap
          location={location}
          landmark={landmark}
          latitude={latitude}
          longitude={longitude}
          confirmed={locationConfirmed}
          onChange={(patch) =>
            onUpdate({
              location: patch.location ?? location,
              landmark: patch.landmark ?? landmark,
              latitude: patch.latitude !== undefined ? patch.latitude : latitude,
              longitude: patch.longitude !== undefined ? patch.longitude : longitude,
              locationConfirmed:
                patch.confirmed !== undefined ? patch.confirmed : locationConfirmed,
            })
          }
        />
      </section>

      {/* Optional Evidence Upload & Voice Note */}
      <section className="rounded-3xl bg-white border border-[#E6E2D9] p-5 shadow-[0_4px_20px_rgba(30,37,37,0.05)] space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#1E2525]">
            Add photo, video, or voice note (optional)
          </h2>
          <p className="text-xs text-[#5B6666]">
            Helps repair crews spot the issue faster, but never required.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl border border-dashed border-[#B9B3A7] bg-[#FAF9F6] hover:border-[#3F7375] hover:bg-[#E9F1F1]/50 text-sm font-semibold text-[#1E2525] cursor-pointer transition">
            <Camera className="w-5 h-5 text-[#3F7375]" />
            <span>Upload photo / video</span>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {!isRecordingNote ? (
            <button
              type="button"
              onClick={startVoiceNote}
              className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl border border-dashed border-[#B9B3A7] bg-[#FAF9F6] hover:border-[#3F7375] hover:bg-[#E9F1F1]/50 text-sm font-semibold text-[#1E2525] cursor-pointer transition"
            >
              <Mic className="w-5 h-5 text-[#3F7375]" />
              <span>{voiceNote ? 'Re-record voice note' : 'Add short voice note'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopVoiceNote}
              className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl bg-rose-600 text-white text-sm font-semibold cursor-pointer animate-pulse"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Stop note ({noteSeconds}s)</span>
            </button>
          )}
        </div>

        {uploadError && <p className="text-sm text-rose-700 font-medium">{uploadError}</p>}
        {noteError && <p className="text-sm text-amber-800 font-medium">{noteError}</p>}

        {/* Uploaded Evidence Previews */}
        {evidence.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            {evidence.map((item) => (
              <div
                key={item.id}
                className="relative rounded-2xl border border-[#E6E2D9] overflow-hidden bg-[#FAF9F6]"
              >
                {item.type === 'image' ? (
                  <img
                    src={item.dataUrl}
                    alt={item.name}
                    className="w-full h-28 object-cover"
                  />
                ) : (
                  <div className="w-full h-28 flex flex-col items-center justify-center gap-1 p-2 text-xs text-[#5B6666]">
                    <FileVideo className="w-6 h-6 text-[#3F7375]" />
                    <span className="truncate max-w-full">{item.name}</span>
                  </div>
                )}
                <button
                  type="button"
                  aria-label={`Remove ${item.name}`}
                  onClick={() =>
                    onUpdate({ evidence: evidence.filter((ev) => ev.id !== item.id) })
                  }
                  className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-white/90 text-rose-700 shadow-xs hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Voice Note Preview */}
        {voiceNote && (
          <div className="rounded-2xl bg-[#FAF9F6] border border-[#E6E2D9] p-3 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#3F7375] mb-1">{voiceNote.name}</p>
              <audio controls src={voiceNote.dataUrl} className="w-full h-9" />
            </div>
            <button
              type="button"
              aria-label="Delete voice note"
              onClick={() => onUpdate({ voiceNote: null })}
              className="p-2 rounded-xl text-rose-700 hover:bg-rose-50 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </section>

      <button
        type="button"
        disabled={!canProceed}
        onClick={onContinue}
        className="w-full py-4 rounded-2xl bg-[#3F7375] hover:bg-[#325D5F] disabled:opacity-50 text-white font-bold text-base shadow-md flex items-center justify-center gap-2 cursor-pointer"
      >
        Review Complaint
        <ArrowRight className="w-5 h-5" />
      </button>
      {!canProceed && (
        <p className="text-center text-xs text-[#5B6666]">
          Please enter a locality and tap “Confirm this location is accurate” above.
        </p>
      )}
    </div>
  );
}
