interface AudioWaveformProps {
  active: boolean;
  level: number; // 0..1
}

const BAR_FACTORS = [0.35, 0.65, 0.9, 0.55, 1.0, 0.72, 0.48, 0.86, 0.6, 0.4, 0.78, 0.52];

export function AudioWaveform({ active, level }: AudioWaveformProps) {
  return (
    <div
      className="flex items-center justify-center gap-1.5 h-14 px-4"
      aria-hidden="true"
    >
      {BAR_FACTORS.map((factor, idx) => {
        const dynamicHeight = active
          ? Math.max(20, Math.min(100, Math.round((0.25 + level * 0.95) * factor * 100)))
          : 22;

        return (
          <span
            key={idx}
            className={`w-1.5 rounded-full transition-all duration-150 ${
              active ? 'bg-[#3F7375]' : 'bg-[#C9D6D6]'
            } ${active && level < 0.08 ? 'animate-wave-bar' : ''}`}
            style={{
              height: `${dynamicHeight}%`,
              animationDelay: `${idx * 75}ms`,
            }}
          />
        );
      })}
    </div>
  );
}
