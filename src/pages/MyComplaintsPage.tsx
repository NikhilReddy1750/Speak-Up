import { useMemo, useState } from 'react';
import { Calendar, ChevronRight, ClipboardList, Plus, Search } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { UI_COPY } from '../data/i18n';
import type { Complaint, LanguageCode } from '../types/complaint';

interface MyComplaintsPageProps {
  language: LanguageCode;
  complaints: Complaint[];
  onSelectComplaint: (id: string) => void;
  onReportNew: () => void;
}

type FilterTab = 'all' | 'open' | 'resolved';

export function MyComplaintsPage({
  language,
  complaints,
  onSelectComplaint,
  onReportNew,
}: MyComplaintsPageProps) {
  const t = UI_COPY[language];
  const [filter, setFilter] = useState<FilterTab>('all');
  const [query, setQuery] = useState('');

  const counts = useMemo(() => {
    const resolved = complaints.filter((c) => c.status === 'resolved').length;
    const open = complaints.length - resolved;
    return { all: complaints.length, open, resolved };
  }, [complaints]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return complaints.filter((c) => {
      if (filter === 'open' && c.status === 'resolved') return false;
      if (filter === 'resolved' && c.status !== 'resolved') return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.reference_number.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q)
      );
    });
  }, [complaints, filter, query]);

  const tabs: Array<{ id: FilterTab; label: string; count: number }> = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'open', label: 'Open', count: counts.open },
    { id: 'resolved', label: 'Resolved', count: counts.resolved },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E2525]">{t.myComplaintsHeading}</h1>
          <p className="text-sm text-[#5B6666]">
            Track status updates and reference IDs
          </p>
        </div>
        <button
          type="button"
          onClick={onReportNew}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#3F7375] hover:bg-[#325D5F] text-white text-sm font-semibold shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New
        </button>
      </div>

      {/* Filter Pills + Search */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition cursor-pointer ${
                  active
                    ? 'bg-[#3F7375] text-white shadow-xs'
                    : 'bg-white border border-[#E6E2D9] text-[#5B6666] hover:text-[#1E2525]'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-[#8B9494] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, area, or reference ID..."
            className="w-full rounded-2xl border border-[#DDD8CE] bg-white pl-10 pr-4 py-2.5 text-sm text-[#1E2525] placeholder:text-[#8B9494] focus:outline-none focus:ring-2 focus:ring-[#3F7375]/35"
          />
        </div>
      </div>

      {/* Complaint Cards List */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl bg-white border border-[#E6E2D9] p-10 text-center space-y-3">
          <ClipboardList className="w-10 h-10 text-[#B9B3A7] mx-auto" />
          <p className="text-base font-semibold text-[#1E2525]">No complaints found</p>
          <p className="text-sm text-[#5B6666]">
            {query
              ? 'Try clearing your search or switching filters.'
              : 'Tap New to file a civic complaint by voice or text.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const formattedDate = new Date(item.created_at).toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectComplaint(item.id)}
                className="w-full text-left rounded-3xl bg-white border border-[#E6E2D9] p-5 shadow-[0_2px_12px_rgba(30,37,37,0.04)] hover:border-[#3F7375]/50 hover:shadow-[0_6px_22px_rgba(63,115,117,0.08)] transition cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-semibold text-[#5B6666]">
                        {item.reference_number}
                      </span>
                      {item.is_demo && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#F3F0EA] text-[#5B6666]">
                          Demo
                        </span>
                      )}
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-[#1E2525] truncate">
                      {item.title}
                    </h2>
                    <p className="text-sm text-[#5B6666] truncate">{item.department}</p>
                  </div>
                  <StatusBadge status={item.status} language={language} />
                </div>

                <div className="mt-4 pt-3 border-t border-[#F0EDE6] flex items-center justify-between text-xs text-[#5B6666]">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formattedDate} · {item.location}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#3F7375] shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
