export type LanguageCode = 'en' | 'hi' | 'te';

export type ComplaintCategory =
  | 'Road damage'
  | 'Garbage & sanitation'
  | 'Streetlight'
  | 'Water supply & leakage'
  | 'Drainage & sewage'
  | 'Other municipal issue';

export type ComplaintStatus = 'submitted' | 'received' | 'in_progress' | 'resolved';

export type UrgencyLevel = 'low' | 'medium' | 'high';

export type PageRoute =
  | 'home'
  | 'listening'
  | 'clarification'
  | 'location'
  | 'confirmation'
  | 'success'
  | 'complaints'
  | 'tracking'
  | 'settings';

export interface StatusEvent {
  id: string;
  status: ComplaintStatus;
  title: string;
  description: string;
  timestamp: string;
  actor: 'citizen' | 'department' | 'demo_admin';
}

export interface EvidenceItem {
  id: string;
  type: 'image' | 'video' | 'audio';
  name: string;
  dataUrl: string;
  sizeBytes: number;
  durationSec?: number;
}

export interface ClarificationQuestion {
  id: string;
  field: 'category' | 'location' | 'details' | 'urgency';
  question: string;
  options: string[];
  allowVoice: boolean;
}

export interface ClarificationAnswer {
  questionId: string;
  field: 'category' | 'location' | 'details' | 'urgency';
  question: string;
  answer: string;
}

export interface AIExtractionResult {
  title: string;
  category: ComplaintCategory | 'Uncertain';
  department: string;
  location: string;
  description: string;
  urgency: UrgencyLevel;
  categoryConfidence: number;
  locationConfidence: number;
  missingFields: Array<'category' | 'location' | 'details' | 'urgency'>;
  clarificationQuestions: ClarificationQuestion[];
  source: 'llm' | 'demo_mock';
  note?: string;
}

export interface Complaint {
  id: string;
  reference_number: string;
  user_id: string;
  title: string;
  category: ComplaintCategory;
  department: string;
  description: string;
  original_transcript: string;
  language: LanguageCode;
  location: string;
  latitude: number | null;
  longitude: number | null;
  urgency: UrgencyLevel;
  status: ComplaintStatus;
  evidence_urls: EvidenceItem[];
  voice_note_url?: string | null;
  is_demo: boolean;
  reminder_sent_at?: string | null;
  status_history: StatusEvent[];
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  language: LanguageCode;
  detectSpeechLanguage: boolean;
  deleteRecordingsAfterFiling: boolean;
  askBeforeSending: boolean;
  name: string;
  phone: string;
  address: string;
}

export interface DraftComplaint {
  transcript: string;
  language: LanguageCode;
  recordedAudioUrl: string | null;
  recordedDurationSec: number;
  extraction: AIExtractionResult | null;
  clarifications: ClarificationAnswer[];
  title: string;
  category: ComplaintCategory;
  department: string;
  description: string;
  urgency: UrgencyLevel;
  location: string;
  landmark: string;
  latitude: number | null;
  longitude: number | null;
  locationConfirmed: boolean;
  evidence: EvidenceItem[];
  voiceNote: EvidenceItem | null;
}
