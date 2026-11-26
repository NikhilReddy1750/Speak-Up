import { useEffect, useMemo, useState } from 'react';
import { AppShell } from './components/AppShell';
import { getDepartmentForCategory } from './data/categories';
import { DEFAULT_SETTINGS } from './data/demoComplaints';
import { ClarificationPage } from './pages/ClarificationPage';
import { ConfirmationPage, SuccessPage } from './pages/ConfirmationPage';
import { ComplaintTrackingPage } from './pages/ComplaintTrackingPage';
import { HomePage } from './pages/HomePage';
import { ListeningPage } from './pages/ListeningPage';
import { LocationEvidencePage } from './pages/LocationEvidencePage';
import { MyComplaintsPage } from './pages/MyComplaintsPage';
import { SettingsPage } from './pages/SettingsPage';
import {
  analyzeComplaintWithServer,
  findPotentialDuplicate,
} from './services/aiService';
import {
  checkSubmissionRateLimit,
  generateReferenceNumber,
  isSupabaseConfigured,
  loadComplaints,
  loadSettings,
  resetDemoData,
  saveComplaint,
  saveSettings,
  sendComplaintReminder,
  updateComplaintStatus,
} from './services/storageService';
import type {
  Complaint,
  ComplaintCategory,
  ComplaintStatus,
  DraftComplaint,
  LanguageCode,
  PageRoute,
  UserSettings,
} from './types/complaint';

function createEmptyDraft(language: LanguageCode, defaultAddress = ''): DraftComplaint {
  return {
    transcript: '',
    language,
    recordedAudioUrl: null,
    recordedDurationSec: 0,
    extraction: null,
    clarifications: [],
    title: '',
    category: 'Road damage',
    department: getDepartmentForCategory('Road damage'),
    description: '',
    urgency: 'medium',
    location: defaultAddress,
    landmark: '',
    latitude: null,
    longitude: null,
    locationConfirmed: false,
    evidence: [],
    voiceNote: null,
  };
}

export default function App() {
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings() ?? DEFAULT_SETTINGS);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);

  const [page, setPage] = useState<PageRoute>('home');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);

  const [draft, setDraft] = useState<DraftComplaint>(() =>
    createEmptyDraft(settings.language, settings.address)
  );
  const [autoStartRecording, setAutoStartRecording] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isDemoMode = !isSupabaseConfigured();

  useEffect(() => {
    let active = true;
    loadComplaints().then((items) => {
      if (active) {
        setComplaints(items);
        setLoadingComplaints(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const handleUpdateSettings = (next: UserSettings) => {
    setSettings(next);
    saveSettings(next);
  };

  const handleLanguageChange = (lang: LanguageCode) => {
    const next = { ...settings, language: lang };
    handleUpdateSettings(next);
    setDraft((prev) => ({ ...prev, language: lang }));
  };

  const startNewVoiceComplaint = () => {
    setDraft(createEmptyDraft(settings.language, settings.address));
    setAutoStartRecording(true);
    setSubmitError(null);
    setPage('listening');
  };

  const startFromText = async (text: string) => {
    const fresh = createEmptyDraft(settings.language, settings.address);
    fresh.transcript = text;
    setDraft(fresh);
    setAutoStartRecording(false);
    setSubmitError(null);
    setPage('listening');
  };

  const handleTranscriptContinue = async (
    transcript: string,
    audioUrl: string | null,
    durationSec: number
  ) => {
    setIsAnalyzing(true);
    try {
      const extraction = await analyzeComplaintWithServer(transcript, settings.language);
      const resolvedCategory: ComplaintCategory =
        extraction.category === 'Uncertain' ? 'Road damage' : extraction.category;

      setDraft((prev) => ({
        ...prev,
        transcript,
        language: settings.language,
        recordedAudioUrl: audioUrl,
        recordedDurationSec: durationSec,
        extraction,
        title: extraction.title,
        category: resolvedCategory,
        department:
          extraction.category === 'Uncertain'
            ? getDepartmentForCategory(resolvedCategory)
            : extraction.department,
        description: extraction.description,
        urgency: extraction.urgency,
        location: extraction.location || prev.location || settings.address,
        locationConfirmed: false,
      }));
      setPage('clarification');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const potentialDuplicate = useMemo(() => {
    if (page !== 'confirmation') return null;
    return findPotentialDuplicate(complaints, draft.category, draft.location);
  }, [page, complaints, draft.category, draft.location]);

  const handleSubmitComplaint = async () => {
    setSubmitError(null);
    const rate = checkSubmissionRateLimit();
    if (!rate.allowed) {
      setSubmitError(
        `Submission rate limit reached to prevent spam. Please wait ${rate.waitSeconds}s before filing another report.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const nowIso = new Date().toISOString();
      const refNum = generateReferenceNumber();
      const fullLocation = draft.landmark.trim()
        ? `${draft.location.trim()} (${draft.landmark.trim()})`
        : draft.location.trim();

      // Respect privacy toggle: discard raw recording if deleteRecordingsAfterFiling is enabled
      const voiceNoteUrl = settings.deleteRecordingsAfterFiling
        ? null
        : draft.voiceNote?.dataUrl ?? null;

      const newComplaint: Complaint = {
        id: `cmp-${Date.now()}`,
        reference_number: refNum,
        user_id: settings.phone ? `citizen-${settings.phone}` : 'demo-citizen',
        title: draft.title.trim() || `${draft.category} report`,
        category: draft.category,
        department: draft.department,
        description: draft.description.trim(),
        original_transcript: draft.transcript,
        language: draft.language,
        location: fullLocation,
        latitude: draft.latitude,
        longitude: draft.longitude,
        urgency: draft.urgency,
        status: 'submitted',
        evidence_urls: draft.evidence,
        voice_note_url: voiceNoteUrl,
        is_demo: isDemoMode,
        created_at: nowIso,
        updated_at: nowIso,
        status_history: [
          {
            id: `evt-${Date.now()}`,
            status: 'submitted',
            title: isDemoMode ? 'Complaint submitted (Demo)' : 'Complaint submitted',
            description: isDemoMode
              ? `Saved locally in Demo Mode with reference ${refNum}.`
              : `Submitted and queued for ${draft.department}.`,
            timestamp: nowIso,
            actor: 'citizen',
          },
        ],
      };

      const saved = await saveComplaint(newComplaint);
      setComplaints((prev) => [saved, ...prev]);
      setSubmittedComplaint(saved);
      setSelectedComplaintId(saved.id);
      setPage('success');
    } catch {
      setSubmitError('Failed to save complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeTrackingComplaint = useMemo(
    () => complaints.find((c) => c.id === selectedComplaintId) ?? null,
    [complaints, selectedComplaintId]
  );

  const handleBack = () => {
    if (page === 'listening') setPage('home');
    else if (page === 'clarification') setPage('listening');
    else if (page === 'location') setPage('clarification');
    else if (page === 'confirmation') setPage('location');
    else if (page === 'success') setPage('home');
    else if (page === 'tracking') setPage('complaints');
  };

  return (
    <AppShell
      currentPage={page}
      language={settings.language}
      isDemoMode={isDemoMode}
      onNavigate={(nextPage) => {
        setPage(nextPage);
      }}
      onLanguageChange={handleLanguageChange}
      onBack={handleBack}
    >
      {page === 'home' && (
        <HomePage
          language={settings.language}
          latestComplaint={loadingComplaints ? null : complaints[0] ?? null}
          onStartVoice={startNewVoiceComplaint}
          onSubmitText={startFromText}
          onOpenComplaint={(id) => {
            setSelectedComplaintId(id);
            setPage('tracking');
          }}
          onOpenAllComplaints={() => setPage('complaints')}
        />
      )}

      {page === 'listening' && (
        <ListeningPage
          language={settings.language}
          initialTranscript={draft.transcript}
          autoStartRecording={autoStartRecording}
          isAnalyzing={isAnalyzing}
          onCancel={() => setPage('home')}
          onContinue={handleTranscriptContinue}
        />
      )}

      {page === 'clarification' && draft.extraction && (
        <ClarificationPage
          language={settings.language}
          transcript={draft.transcript}
          extraction={draft.extraction}
          initialAnswers={draft.clarifications}
          onComplete={({ category, department, location, description, answers }) => {
            setDraft((prev) => ({
              ...prev,
              category,
              department,
              location: location || prev.location,
              description,
              clarifications: answers,
            }));
            setPage('location');
          }}
        />
      )}

      {page === 'location' && (
        <LocationEvidencePage
          language={settings.language}
          location={draft.location}
          landmark={draft.landmark}
          latitude={draft.latitude}
          longitude={draft.longitude}
          locationConfirmed={draft.locationConfirmed}
          evidence={draft.evidence}
          voiceNote={draft.voiceNote}
          onUpdate={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
          onContinue={() => setPage('confirmation')}
        />
      )}

      {page === 'confirmation' && (
        <ConfirmationPage
          language={settings.language}
          draft={draft}
          settings={settings}
          isDemoMode={isDemoMode}
          potentialDuplicate={potentialDuplicate}
          submitting={submitting}
          submitError={submitError}
          onUpdateDraft={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
          onEditStep={() => setPage('location')}
          onSubmit={handleSubmitComplaint}
          onViewDuplicate={(id) => {
            setSelectedComplaintId(id);
            setPage('tracking');
          }}
        />
      )}

      {page === 'success' && submittedComplaint && (
        <SuccessPage
          language={settings.language}
          complaint={submittedComplaint}
          onTrackComplaint={() => {
            setSelectedComplaintId(submittedComplaint.id);
            setPage('tracking');
          }}
          onBackHome={() => setPage('home')}
        />
      )}

      {page === 'complaints' && (
        <MyComplaintsPage
          language={settings.language}
          complaints={complaints}
          onSelectComplaint={(id) => {
            setSelectedComplaintId(id);
            setPage('tracking');
          }}
          onReportNew={startNewVoiceComplaint}
        />
      )}

      {page === 'tracking' && activeTrackingComplaint && (
        <ComplaintTrackingPage
          language={settings.language}
          complaint={activeTrackingComplaint}
          onSendReminder={async (id) => {
            const next = await sendComplaintReminder(id);
            setComplaints(next);
          }}
          onDemoAdvanceStatus={async (id, status: ComplaintStatus, note: string) => {
            const next = await updateComplaintStatus(id, status, note, 'demo_admin');
            setComplaints(next);
          }}
        />
      )}

      {page === 'settings' && (
        <SettingsPage
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onResetDemoData={async () => {
            const restored = await resetDemoData();
            setComplaints(restored);
          }}
        />
      )}
    </AppShell>
  );
}
