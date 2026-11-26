import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_SETTINGS, DEMO_COMPLAINTS } from '../data/demoComplaints';
import type { Complaint, ComplaintStatus, StatusEvent, UserSettings } from '../types/complaint';

const COMPLAINTS_KEY = 'speakup_complaints_v1';
const SETTINGS_KEY = 'speakup_settings_v1';
const RATE_LIMIT_KEY = 'speakup_submit_timestamps_v1';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let supabaseClient: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export function isSupabaseConfigured(): boolean {
  return supabaseClient !== null;
}

export function generateReferenceNumber(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(1000 + Math.random() * 9000);
  return `SPK-${year}-${num}`;
}

export function checkSubmissionRateLimit(): { allowed: boolean; waitSeconds: number } {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    const timestamps: number[] = raw ? JSON.parse(raw) : [];
    const windowMs = 10 * 60 * 1000; // 10 minutes
    const recent = timestamps.filter((ts) => Date.now() - ts < windowMs);
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(recent));
    if (recent.length >= 6) {
      const oldest = Math.min(...recent);
      const waitSeconds = Math.ceil((windowMs - (Date.now() - oldest)) / 1000);
      return { allowed: false, waitSeconds };
    }
    return { allowed: true, waitSeconds: 0 };
  } catch {
    return { allowed: true, waitSeconds: 0 };
  }
}

function recordSubmissionTimestamp(): void {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    const timestamps: number[] = raw ? JSON.parse(raw) : [];
    timestamps.push(Date.now());
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(timestamps.slice(-10)));
  } catch {
    // ignore storage errors
  }
}

export async function loadComplaints(): Promise<Complaint[]> {
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      return data as Complaint[];
    }
  }

  try {
    const raw = localStorage.getItem(COMPLAINTS_KEY);
    if (!raw) {
      localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(DEMO_COMPLAINTS));
      return DEMO_COMPLAINTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as Complaint[];
    }
  } catch {
    // fallback below
  }
  return DEMO_COMPLAINTS;
}

export async function saveComplaint(complaint: Complaint): Promise<Complaint> {
  recordSubmissionTimestamp();

  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from('complaints')
      .insert([complaint])
      .select()
      .single();

    if (!error && data) {
      return data as Complaint;
    }
  }

  const current = await loadComplaints();
  const updated = [complaint, ...current.filter((c) => c.id !== complaint.id)];
  localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(updated));
  return complaint;
}

export async function updateComplaintStatus(
  complaintId: string,
  newStatus: ComplaintStatus,
  note: string,
  actor: 'citizen' | 'department' | 'demo_admin' = 'demo_admin'
): Promise<Complaint[]> {
  const current = await loadComplaints();
  const target = current.find((c) => c.id === complaintId);
  if (!target) return current;

  const statusLabels: Record<ComplaintStatus, string> = {
    submitted: 'Complaint submitted',
    received: 'Received by department',
    in_progress: 'Assigned / In progress',
    resolved: 'Resolved',
  };

  const event: StatusEvent = {
    id: `evt-${Date.now()}`,
    status: newStatus,
    title: `${statusLabels[newStatus]}${target.is_demo ? ' (Demo)' : ''}`,
    description: note,
    timestamp: new Date().toISOString(),
    actor,
  };

  const updatedComplaint: Complaint = {
    ...target,
    status: newStatus,
    updated_at: new Date().toISOString(),
    status_history: [...target.status_history, event],
  };

  if (supabaseClient) {
    await supabaseClient
      .from('complaints')
      .update({
        status: updatedComplaint.status,
        updated_at: updatedComplaint.updated_at,
        status_history: updatedComplaint.status_history,
      })
      .eq('id', complaintId);
  }

  const next = current.map((c) => (c.id === complaintId ? updatedComplaint : c));
  localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(next));
  return next;
}

export async function sendComplaintReminder(complaintId: string): Promise<Complaint[]> {
  const current = await loadComplaints();
  const nowIso = new Date().toISOString();
  const next = current.map((c) =>
    c.id === complaintId ? { ...c, reminder_sent_at: nowIso, updated_at: nowIso } : c
  );

  if (supabaseClient) {
    await supabaseClient
      .from('complaints')
      .update({ reminder_sent_at: nowIso, updated_at: nowIso })
      .eq('id', complaintId);
  }

  localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(next));
  return next;
}

export async function resetDemoData(): Promise<Complaint[]> {
  localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(DEMO_COMPLAINTS));
  return DEMO_COMPLAINTS;
}

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage errors
  }
}
