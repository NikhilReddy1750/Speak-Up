import { useState } from 'react';
import { Check, Globe, Lock, RotateCcw, Shield, User } from 'lucide-react';
import { LANGUAGES, UI_COPY } from '../data/i18n';
import { isSupabaseConfigured } from '../services/storageService';
import type { LanguageCode, UserSettings } from '../types/complaint';

interface SettingsPageProps {
  settings: UserSettings;
  onUpdateSettings: (next: UserSettings) => void;
  onResetDemoData: () => Promise<void>;
}

export function SettingsPage({
  settings,
  onUpdateSettings,
  onResetDemoData,
}: SettingsPageProps) {
  const t = UI_COPY[settings.language];
  const [name, setName] = useState(settings.name);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);
  const [savedToast, setSavedToast] = useState(false);
  const [resetToast, setResetToast] = useState(false);

  const handleSaveDetails = () => {
    onUpdateSettings({
      ...settings,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
    });
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 2500);
  };

  const handleResetDemo = async () => {
    await onResetDemoData();
    setResetToast(true);
    window.setTimeout(() => setResetToast(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E2525]">{t.settingsHeading}</h1>
        <p className="text-sm text-[#5B6666]">
          Language, privacy controls, and optional citizen details
        </p>
      </div>

      {/* LANGUAGE */}
      <section className="rounded-3xl bg-white border border-[#E6E2D9] p-5 shadow-[0_2px_12px_rgba(30,37,37,0.04)] space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#3F7375]">
          <Globe className="w-4 h-4" />
          Language
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-[#1E2525]">Application language</span>
          <select
            value={settings.language}
            onChange={(e) =>
              onUpdateSettings({ ...settings, language: e.target.value as LanguageCode })
            }
            className="w-full rounded-xl border border-[#DDD8CE] bg-[#FAF9F6] px-4 py-2.5 text-sm font-semibold text-[#1E2525]"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeLabel} ({lang.label})
              </option>
            ))}
          </select>
        </label>

        <ToggleRow
          label="Detect speech language"
          description="Automatically adapt recognition hints when you switch spoken languages."
          checked={settings.detectSpeechLanguage}
          onChange={(checked) =>
            onUpdateSettings({ ...settings, detectSpeechLanguage: checked })
          }
        />
      </section>

      {/* PRIVACY */}
      <section className="rounded-3xl bg-white border border-[#E6E2D9] p-5 shadow-[0_2px_12px_rgba(30,37,37,0.04)] space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#3F7375]">
          <Lock className="w-4 h-4" />
          Privacy
        </div>

        <ToggleRow
          label="Delete recordings after filing"
          description="Discard raw microphone audio immediately after generating your transcript."
          checked={settings.deleteRecordingsAfterFiling}
          onChange={(checked) =>
            onUpdateSettings({ ...settings, deleteRecordingsAfterFiling: checked })
          }
        />

        <ToggleRow
          label="Ask before sending"
          description="Require an explicit confirmation check on the final review screen."
          checked={settings.askBeforeSending}
          onChange={(checked) =>
            onUpdateSettings({ ...settings, askBeforeSending: checked })
          }
        />

        <div className="rounded-2xl bg-[#F8F6F1] border border-[#E6E2D9] p-3.5 text-xs text-[#5B6666] flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-[#3F7375] shrink-0 mt-0.5" />
          <p>
            SpeakUp minimizes stored personal data. Microphone and GPS permissions are only
            requested when you tap record or GPS, and can be revoked anytime in your browser
            site settings.
          </p>
        </div>
      </section>

      {/* SAVED DETAILS */}
      <section className="rounded-3xl bg-white border border-[#E6E2D9] p-5 shadow-[0_2px_12px_rgba(30,37,37,0.04)] space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#3F7375]">
          <User className="w-4 h-4" />
          Saved Details (Optional)
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="block text-sm font-semibold text-[#1E2525] mb-1">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              className="w-full rounded-xl border border-[#DDD8CE] bg-[#FAF9F6] px-4 py-2.5 text-sm text-[#1E2525]"
            />
          </label>

          <label className="block">
            <span className="block text-sm font-semibold text-[#1E2525] mb-1">
              Phone number
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="For SMS status updates (optional)"
              className="w-full rounded-xl border border-[#DDD8CE] bg-[#FAF9F6] px-4 py-2.5 text-sm text-[#1E2525]"
            />
          </label>

          <label className="block">
            <span className="block text-sm font-semibold text-[#1E2525] mb-1">
              Default address / colony
            </span>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Kukatpally Housing Board"
              className="w-full rounded-xl border border-[#DDD8CE] bg-[#FAF9F6] px-4 py-2.5 text-sm text-[#1E2525]"
            />
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          {savedToast ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
              <Check className="w-4 h-4" /> Details saved locally
            </span>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={handleSaveDetails}
            className="px-5 py-2.5 rounded-xl bg-[#3F7375] hover:bg-[#325D5F] text-white text-sm font-semibold cursor-pointer"
          >
            Save details
          </button>
        </div>
      </section>

      {/* SYSTEM & DEMO MODE STATUS */}
      <section className="rounded-3xl bg-white border border-[#E6E2D9] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1E2525]">Storage & Demo Mode</h2>
            <p className="text-xs text-[#5B6666]">
              {isSupabaseConfigured()
                ? 'Connected to Supabase database.'
                : 'Running in Local Demo Mode (browser persistent storage).'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetDemo}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#DDD8CE] hover:bg-[#F3F0EA] text-xs font-semibold text-[#1E2525] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Data
          </button>
        </div>
        {resetToast && (
          <p className="text-xs font-semibold text-[#3F7375]">
            Sample complaints restored to initial demo state.
          </p>
        )}
      </section>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div>
        <p className="text-sm font-semibold text-[#1E2525]">{label}</p>
        <p className="text-xs text-[#5B6666]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-7 rounded-full transition-colors shrink-0 cursor-pointer ${
          checked ? 'bg-[#3F7375]' : 'bg-[#D6D1C7]'
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
