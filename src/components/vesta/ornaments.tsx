// SVG line-art ornaments for Vesta.
// Usage: <Temple className="absolute right-4 bottom-2 h-24 w-24 opacity-10" />

type P = { className?: string };

const stroke = "currentColor";

export function Temple({ className }: P) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden>
      <g stroke={stroke} strokeWidth="1.2" strokeLinecap="round">
        <path d="M10 42 L60 18 L110 42" />
        <path d="M14 44 H106" />
        <path d="M18 46 V90" />
        <path d="M34 46 V90" />
        <path d="M50 46 V90" />
        <path d="M70 46 V90" />
        <path d="M86 46 V90" />
        <path d="M102 46 V90" />
        <path d="M10 94 H110" />
        <path d="M6 102 H114" />
      </g>
    </svg>
  );
}

export function Goddess({ className }: P) {
  return (
    <svg viewBox="0 0 200 240" fill="none" className={className} aria-hidden>
      <g stroke={stroke} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M100 44 c-16 0 -28 12 -28 30 c0 12 8 22 12 30 c-4 4 -14 8 -20 20 c-8 16 -12 40 -14 60" />
        <path d="M100 44 c16 0 28 12 28 30 c0 12 -8 22 -12 30 c4 4 14 8 20 20 c8 16 12 40 14 60" />
        <path d="M86 90 q14 12 28 0" />
        <path d="M92 78 h4 M104 78 h4" />
        <path d="M70 62 q-14 -6 -22 6" />
        <path d="M130 62 q14 -6 22 6" />
      </g>
    </svg>
  );
}

export function Wheat({ className }: P) {
  return (
    <svg viewBox="0 0 60 160" fill="none" className={className} aria-hidden>
      <g stroke={stroke} strokeWidth="1" strokeLinecap="round">
        <path d="M30 150 V30" />
        <path d="M30 40 q-14 -4 -18 -18 q14 4 18 18" />
        <path d="M30 40 q14 -4 18 -18 q-14 4 -18 18" />
        <path d="M30 60 q-14 -4 -18 -18 q14 4 18 18" />
        <path d="M30 60 q14 -4 18 -18 q-14 4 -18 18" />
        <path d="M30 80 q-14 -4 -18 -18 q14 4 18 18" />
        <path d="M30 80 q14 -4 18 -18 q-14 4 -18 18" />
        <path d="M30 100 q-14 -4 -18 -18 q14 4 18 18" />
        <path d="M30 100 q14 -4 18 -18 q-14 4 -18 18" />
      </g>
    </svg>
  );
}

export function Amphora({ className }: P) {
  return (
    <svg viewBox="0 0 80 120" fill="none" className={className} aria-hidden>
      <g stroke={stroke} strokeWidth="1.2" strokeLinecap="round">
        <path d="M28 12 h24" />
        <path d="M30 12 v6 q-14 6 -14 26 q0 26 24 44 q24 -18 24 -44 q0 -20 -14 -26 v-6" />
        <path d="M16 40 q-10 4 -8 16 q2 8 10 10" />
        <path d="M64 40 q10 4 8 16 q-2 8 -10 10" />
        <path d="M40 88 v14" />
        <path d="M28 102 h24" />
      </g>
    </svg>
  );
}

export function Flame({ className }: P) {
  return (
    <svg viewBox="0 0 60 80" fill="none" className={className} aria-hidden>
      <g stroke={stroke} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M30 8 q10 14 10 26 q0 14 -10 22 q-10 -8 -10 -22 q0 -12 10 -26 z" />
        <path d="M30 22 q4 8 4 16 q0 8 -4 12 q-4 -4 -4 -12 q0 -8 4 -16 z" />
        <path d="M10 66 h40" />
        <path d="M14 72 h32" />
      </g>
    </svg>
  );
}

export function Divider({ className }: P) {
  return (
    <svg viewBox="0 0 200 12" fill="none" className={className} aria-hidden>
      <g stroke={stroke} strokeWidth="1" strokeLinecap="round">
        <path d="M10 6 H86" />
        <path d="M114 6 H190" />
        <path d="M100 2 l4 4 l-4 4 l-4 -4 z" />
      </g>
    </svg>
  );
}
