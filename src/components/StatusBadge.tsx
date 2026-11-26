import { CheckCircle2, Clock, Inbox, Wrench } from 'lucide-react';
import { UI_COPY } from '../data/i18n';
import type { ComplaintStatus, LanguageCode } from '../types/complaint';

interface StatusBadgeProps {
  status: ComplaintStatus;
  language?: LanguageCode;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, language = 'en', size = 'sm' }: StatusBadgeProps) {
  const t = UI_COPY[language];

  const config: Record<
    ComplaintStatus,
    { label: string; classes: string; Icon: typeof Clock }
  > = {
    submitted: {
      label: t.statusSubmitted,
      classes: 'bg-sky-50 text-sky-800 border-sky-200',
      Icon: Clock,
    },
    received: {
      label: t.statusReceived,
      classes: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      Icon: Inbox,
    },
    in_progress: {
      label: t.statusInProgress,
      classes: 'bg-amber-50 text-amber-800 border-amber-200',
      Icon: Wrench,
    },
    resolved: {
      label: t.statusResolved,
      classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      Icon: CheckCircle2,
    },
  };

  const { label, classes, Icon } = config[status];
  const padding = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap ${padding} ${classes}`}
    >
      <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      {label}
    </span>
  );
}
