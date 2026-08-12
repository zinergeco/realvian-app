/**
 * REALVIAN ILLUSTRATION SYSTEM
 *
 * Hand-built SVG rather than raster images or AI photography, because:
 *   • Theme-aware — every fill references a CSS token, so illustrations
 *     look correct in both light and dark mode. Photographs don't.
 *   • Zero image weight — no network request, no layout shift, no LCP hit.
 *   • Sharp at any DPR, including 3x mobile displays.
 *   • No licensing exposure on a commercial property site.
 *
 * WHERE REAL PHOTOGRAPHY GOES LATER
 * Slots marked `PHOTO SLOT` in the components below are the places where
 * commissioned or licensed photography should eventually replace or sit
 * behind these illustrations. Never use stock or AI imagery for actual
 * property listings — that is a Consumer Protection Regulations problem,
 * not just an aesthetic one.
 */

/* ══════════════════════════════════════════════════
   1. CITY SKYLINE — layered, parallax-ready
   Used as the hero backdrop on area pages.
   ══════════════════════════════════════════════════ */
export function CitySkyline({
  className,
  variant = "generic",
}: {
  className?: string;
  /** Rough silhouette family — nudges building shapes per city character */
  variant?: "generic" | "terraced" | "highrise" | "georgian";
}) {
  // Building runs: [x, width, height] — hand-tuned per variant so
  // Manchester doesn't look like Bath.
  const runs: Record<string, [number, number, number][]> = {
    generic: [
      [0, 46, 62], [50, 34, 88], [88, 52, 48], [144, 30, 104], [178, 44, 72],
      [226, 38, 94], [268, 56, 56], [328, 32, 82], [364, 48, 66], [416, 40, 98],
      [460, 52, 52], [516, 36, 78], [556, 44, 90], [604, 30, 60], [638, 50, 74],
    ],
    terraced: [
      [0, 40, 54], [42, 40, 58], [84, 40, 54], [126, 40, 60], [168, 40, 54],
      [210, 40, 58], [252, 40, 52], [294, 40, 58], [336, 40, 54], [378, 40, 60],
      [420, 40, 54], [462, 40, 58], [504, 40, 54], [546, 40, 60], [588, 40, 54],
      [630, 58, 58],
    ],
    highrise: [
      [0, 38, 78], [42, 30, 124], [76, 44, 96], [124, 26, 148], [154, 40, 112],
      [198, 32, 136], [234, 48, 88], [286, 28, 158], [318, 42, 118], [364, 34, 142],
      [402, 46, 94], [452, 30, 130], [486, 40, 106], [530, 36, 150], [570, 44, 98],
      [618, 70, 116],
    ],
    georgian: [
      [0, 56, 66], [60, 56, 70], [120, 56, 66], [180, 56, 72], [240, 56, 66],
      [300, 56, 70], [360, 56, 64], [420, 56, 70], [480, 56, 66], [540, 56, 72],
      [600, 88, 68],
    ],
  };

  const buildings = runs[variant] ?? runs.generic!;
  const BASE = 180;

  return (
    <svg
      viewBox="0 0 688 180"
      className={className}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <linearGradient id="rv-sky-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.10" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="rv-sky-near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.06" />
        </linearGradient>
      </defs>

      {/* Far layer — offset and shorter, reads as distance */}
      <g fill="url(#rv-sky-far)" transform="translate(24, 26)">
        {buildings.map(([x, w, h], i) => (
          <rect key={`f${i}`} x={x} y={BASE - h} width={w} height={h} rx="1.5" />
        ))}
      </g>

      {/* Near layer with lit windows */}
      <g fill="url(#rv-sky-near)">
        {buildings.map(([x, w, h], i) => (
          <g key={`n${i}`}>
            <rect x={x} y={BASE - h} width={w} height={h} rx="1.5" />
            {/* Window grid — deterministic, not random, so SSR and client match */}
            {Array.from({ length: Math.floor(h / 18) }).map((_, row) =>
              Array.from({ length: Math.max(1, Math.floor(w / 14)) }).map((__, col) => {
                const lit = (i * 7 + row * 3 + col * 5) % 4 === 0;
                if (!lit) return null;
                return (
                  <rect
                    key={`w${row}-${col}`}
                    x={x + 4 + col * 14}
                    y={BASE - h + 8 + row * 18}
                    width="5"
                    height="7"
                    rx="0.5"
                    fill="var(--color-gold)"
                    opacity="0.5"
                  />
                );
              }),
            )}
          </g>
        ))}
      </g>
    </svg>
  );
}

/* ══════════════════════════════════════════════════
   2. FEATURE ILLUSTRATIONS
   One per capability. These replace the plain text cards.
   ══════════════════════════════════════════════════ */

const ILLO_VIEWBOX = "0 0 200 140";

/** Comparison engine — two panels being weighed */
export function IlloCompare({ className }: { className?: string }) {
  return (
    <svg viewBox={ILLO_VIEWBOX} className={className} aria-hidden="true">
      {/* Left panel */}
      <rect x="14" y="34" width="74" height="82" rx="6"
            fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.5" />
      <circle cx="34" cy="54" r="9" fill="none" stroke="var(--primary)" strokeWidth="3"
              strokeDasharray="42 14" transform="rotate(-90 34 54)" />
      {[0, 1, 2, 3].map((i) => (
        <g key={`l${i}`}>
          <rect x="24" y={74 + i * 11} width="26" height="3.5" rx="1.75" fill="var(--bg-inset)" />
          <rect x="24" y={74 + i * 11} width={[22, 15, 19, 11][i]} height="3.5" rx="1.75"
                fill="var(--primary)" />
        </g>
      ))}

      {/* Right panel */}
      <rect x="112" y="34" width="74" height="82" rx="6"
            fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.5" />
      <circle cx="132" cy="54" r="9" fill="none" stroke="var(--color-gold)" strokeWidth="3"
              strokeDasharray="34 22" transform="rotate(-90 132 54)" />
      {[0, 1, 2, 3].map((i) => (
        <g key={`r${i}`}>
          <rect x="122" y={74 + i * 11} width="26" height="3.5" rx="1.75" fill="var(--bg-inset)" />
          <rect x="122" y={74 + i * 11} width={[14, 21, 12, 24][i]} height="3.5" rx="1.75"
                fill="var(--color-gold)" />
        </g>
      ))}

      {/* VS marker */}
      <circle cx="100" cy="75" r="13" fill="var(--bg)" stroke="var(--border)" strokeWidth="1.5" />
      <text x="100" y="79" textAnchor="middle" fontSize="9" fontWeight="600"
            fill="var(--text-muted)" fontFamily="var(--font-mono)">VS</text>
    </svg>
  );
}

/** Score ring — the proprietary metric */
export function IlloScore({ className }: { className?: string }) {
  return (
    <svg viewBox={ILLO_VIEWBOX} className={className} aria-hidden="true">
      <circle cx="100" cy="70" r="38" fill="none" stroke="var(--bg-inset)" strokeWidth="9" />
      <circle cx="100" cy="70" r="38" fill="none" stroke="var(--primary)" strokeWidth="9"
              strokeLinecap="round" strokeDasharray="196 239" transform="rotate(-90 100 70)" />
      <text x="100" y="72" textAnchor="middle" fontSize="26" fontWeight="600"
            fill="var(--text-primary)" fontFamily="var(--font-mono)">87</text>
      <text x="100" y="86" textAnchor="middle" fontSize="7" letterSpacing="1.4"
            fill="var(--text-muted)">SCORE</text>
      {/* Orbiting dimension dots */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const rad = ((deg - 90) * Math.PI) / 180;
        return (
          <circle key={i} cx={100 + Math.cos(rad) * 54} cy={70 + Math.sin(rad) * 54}
                  r="3.5" fill={i % 3 === 0 ? "var(--primary)" : "var(--color-gold)"}
                  opacity={0.4 + i * 0.1} />
        );
      })}
    </svg>
  );
}

/** Data fusion — many sources into one */
export function IlloDataFusion({ className }: { className?: string }) {
  const sources = [
    { x: 22, y: 26 }, { x: 22, y: 62 }, { x: 22, y: 98 },
    { x: 58, y: 40 }, { x: 58, y: 84 },
  ];
  return (
    <svg viewBox={ILLO_VIEWBOX} className={className} aria-hidden="true">
      {/* Flow lines into the core */}
      {sources.map((s, i) => (
        <path key={i} d={`M ${s.x + 12} ${s.y} Q ${100} ${s.y} ${138} 70`}
              fill="none" stroke="var(--primary)" strokeWidth="1.25"
              opacity="0.35" strokeDasharray="3 3" />
      ))}
      {/* Source nodes */}
      {sources.map((s, i) => (
        <g key={`n${i}`}>
          <rect x={s.x - 10} y={s.y - 7} width="24" height="14" rx="3"
                fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.25" />
          <rect x={s.x - 6} y={s.y - 2.5} width="16" height="2" rx="1" fill="var(--text-muted)" />
        </g>
      ))}
      {/* Core */}
      <rect x="138" y="46" width="46" height="48" rx="7"
            fill="var(--primary-subtle)" stroke="var(--primary)" strokeWidth="1.75" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x="146" y={56 + i * 9} width={[28, 20, 24, 16][i]} height="3.5"
              rx="1.75" fill="var(--primary)" opacity={0.85 - i * 0.12} />
      ))}
    </svg>
  );
}

/** Alerts — signal detection over time */
export function IlloAlerts({ className }: { className?: string }) {
  return (
    <svg viewBox={ILLO_VIEWBOX} className={className} aria-hidden="true">
      {/* Baseline chart */}
      <path d="M 20 96 L 46 88 L 72 92 L 98 76 L 124 82 L 150 54 L 180 60"
            fill="none" stroke="var(--primary)" strokeWidth="2.25" strokeLinecap="round" />
      <path d="M 20 96 L 46 88 L 72 92 L 98 76 L 124 82 L 150 54 L 180 60 L 180 116 L 20 116 Z"
            fill="var(--primary)" opacity="0.08" />
      {/* Grid */}
      {[0, 1, 2].map((i) => (
        <line key={i} x1="20" y1={62 + i * 18} x2="180" y2={62 + i * 18}
              stroke="var(--border)" strokeWidth="0.75" strokeDasharray="2 4" />
      ))}
      {/* Alert trigger point */}
      <circle cx="150" cy="54" r="16" fill="var(--color-gold)" opacity="0.14" />
      <circle cx="150" cy="54" r="9" fill="var(--color-gold)" opacity="0.28" />
      <circle cx="150" cy="54" r="4.5" fill="var(--color-gold)" />
      {/* Bell */}
      <g transform="translate(150, 26)">
        <path d="M -6 4 C -6 -1 -4 -4 0 -4 C 4 -4 6 -1 6 4 L 7.5 6.5 L -7.5 6.5 Z"
              fill="var(--color-gold)" />
        <circle cx="0" cy="9" r="2" fill="var(--color-gold)" />
      </g>
    </svg>
  );
}

/** Map / geography */
export function IlloMap({ className }: { className?: string }) {
  return (
    <svg viewBox={ILLO_VIEWBOX} className={className} aria-hidden="true">
      <rect x="24" y="22" width="152" height="96" rx="7"
            fill="var(--bg-subtle)" stroke="var(--border-strong)" strokeWidth="1.5" />
      {/* Roads */}
      <path d="M 24 62 L 176 54 M 92 22 L 104 118 M 24 92 L 176 88"
            stroke="var(--border-strong)" strokeWidth="2" opacity="0.7" />
      {/* Green space */}
      <path d="M 34 30 Q 62 26 70 44 Q 74 58 52 58 Q 32 56 34 30 Z"
            fill="var(--primary)" opacity="0.18" />
      {/* Heat blobs */}
      <circle cx="128" cy="40" r="17" fill="var(--primary)" opacity="0.16" />
      <circle cx="128" cy="40" r="9" fill="var(--primary)" opacity="0.24" />
      <circle cx="62" cy="98" r="14" fill="var(--color-gold)" opacity="0.18" />
      {/* Pins */}
      {[[128, 40], [62, 98], [150, 82]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x}, ${y})`}>
          <path d="M 0 0 C -5.5 -7 -8 -10 -8 -14 A 8 8 0 0 1 8 -14 C 8 -10 5.5 -7 0 0 Z"
                fill={i === 0 ? "var(--primary)" : "var(--color-gold)"} />
          <circle cx="0" cy="-14" r="3" fill="var(--bg)" />
        </g>
      ))}
    </svg>
  );
}

/** Portfolio / documents */
export function IlloPortfolio({ className }: { className?: string }) {
  return (
    <svg viewBox={ILLO_VIEWBOX} className={className} aria-hidden="true">
      {[2, 1, 0].map((i) => (
        <rect key={i} x={34 + i * 9} y={26 + i * 7} width="112" height="82" rx="6"
              fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.5"
              opacity={1 - i * 0.28} />
      ))}
      {/* Front card content */}
      <rect x="46" y="40" width="44" height="4.5" rx="2.25" fill="var(--text-muted)" opacity="0.5" />
      <rect x="46" y="52" width="66" height="7" rx="3.5" fill="var(--primary)" opacity="0.8" />
      {/* Mini bars */}
      {([16, 26, 20, 32] as const).map((h, i) => (
        <rect key={i} x={46 + i * 17} y={92 - h} width="11"
              height={h} rx="2"
              fill={i === 3 ? "var(--primary)" : "var(--bg-inset)"} />
      ))}
      <line x1="46" y1="94" x2="134" y2="94" stroke="var(--border)" strokeWidth="1.25" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════
   3. ANIMATED PROCESS DIAGRAM
   Replaces the text-only "how it works" section.
   ══════════════════════════════════════════════════ */
export function IlloPipeline({ className }: { className?: string }) {
  const stages = [
    { label: "Fetch", x: 40 },
    { label: "Normalise", x: 130 },
    { label: "Score", x: 220 },
    { label: "Publish", x: 310 },
  ];
  return (
    <svg viewBox="0 0 350 90" className={className} aria-hidden="true">
      {/* Connectors with travelling dashes */}
      {stages.slice(0, -1).map((s, i) => {
        const next = stages[i + 1];
        if (!next) return null;
        return (
        <line
          key={i}
          x1={s.x + 18}
          y1="38"
          x2={next.x - 18}
          y2="38"
          stroke="var(--primary)"
          strokeWidth="1.75"
          strokeDasharray="4 4"
          opacity="0.5"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="8"
            to="0"
            dur="1s"
            repeatCount="indefinite"
          />
        </line>
        );
      })}
      {stages.map((s, i) => (
        <g key={s.label}>
          <circle cx={s.x} cy="38" r="16"
                  fill="var(--primary-subtle)" stroke="var(--primary)" strokeWidth="1.75" />
          <text x={s.x} y="43" textAnchor="middle" fontSize="12" fontWeight="600"
                fill="var(--primary)" fontFamily="var(--font-mono)">{i + 1}</text>
          <text x={s.x} y="72" textAnchor="middle" fontSize="9.5"
                fill="var(--text-secondary)">{s.label}</text>
        </g>
      ))}
    </svg>
  );
}

/* ══════════════════════════════════════════════════
   4. APP SCREENSHOT MOCKUP
   A device frame containing a live-looking product view.
   This is the "show the product" element the homepage lacked.
   ══════════════════════════════════════════════════ */
export function AppMockup({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 420 280" className={className} aria-hidden="true">
      <defs>
        <clipPath id="rv-screen">
          <rect x="14" y="14" width="392" height="252" rx="8" />
        </clipPath>
      </defs>

      {/* Device frame */}
      <rect x="4" y="4" width="412" height="272" rx="14"
            fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="2" />

      <g clipPath="url(#rv-screen)">
        <rect x="14" y="14" width="392" height="252" fill="var(--bg)" />

        {/* Top bar */}
        <rect x="14" y="14" width="392" height="30" fill="var(--bg-subtle)" />
        <circle cx="30" cy="29" r="3.5" fill="var(--border-strong)" />
        <circle cx="42" cy="29" r="3.5" fill="var(--border-strong)" />
        <circle cx="54" cy="29" r="3.5" fill="var(--border-strong)" />
        <rect x="74" y="23" width="120" height="12" rx="6" fill="var(--bg-inset)" />
        <rect x="352" y="22" width="42" height="14" rx="7" fill="var(--primary)" opacity="0.85" />

        {/* Sidebar */}
        <rect x="14" y="44" width="82" height="222" fill="var(--bg-subtle)" />
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <rect x="24" y={60 + i * 24} width="9" height="9" rx="2"
                  fill={i === 1 ? "var(--primary)" : "var(--text-muted)"} opacity={i === 1 ? 1 : 0.4} />
            <rect x="39" y={62 + i * 24} width={[34, 42, 30, 38, 26][i]} height="5" rx="2.5"
                  fill={i === 1 ? "var(--primary)" : "var(--text-muted)"} opacity={i === 1 ? 0.9 : 0.35} />
          </g>
        ))}

        {/* Main: score card */}
        <rect x="108" y="56" width="132" height="76" rx="6"
              fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
        <circle cx="140" cy="94" r="20" fill="none" stroke="var(--bg-inset)" strokeWidth="5" />
        <circle cx="140" cy="94" r="20" fill="none" stroke="var(--primary)" strokeWidth="5"
                strokeLinecap="round" strokeDasharray="104 126" transform="rotate(-90 140 94)" />
        <text x="140" y="98" textAnchor="middle" fontSize="14" fontWeight="600"
              fill="var(--text-primary)" fontFamily="var(--font-mono)">87</text>
        <rect x="172" y="78" width="52" height="7" rx="3.5" fill="var(--text-primary)" opacity="0.75" />
        <rect x="172" y="92" width="38" height="5" rx="2.5" fill="var(--text-muted)" opacity="0.5" />
        <rect x="172" y="104" width="44" height="5" rx="2.5" fill="var(--primary)" opacity="0.7" />

        {/* Main: mini map */}
        <rect x="252" y="56" width="142" height="76" rx="6" fill="var(--bg-subtle)"
              stroke="var(--border)" strokeWidth="1" />
        <path d="M 252 96 L 394 88 M 316 56 L 324 132"
              stroke="var(--border-strong)" strokeWidth="1.5" opacity="0.6" />
        <circle cx="330" cy="82" r="13" fill="var(--primary)" opacity="0.18" />
        <circle cx="330" cy="82" r="4" fill="var(--primary)" />
        <circle cx="286" cy="112" r="10" fill="var(--color-gold)" opacity="0.2" />
        <circle cx="286" cy="112" r="3.5" fill="var(--color-gold)" />

        {/* Dimension bars */}
        <rect x="108" y="146" width="286" height="108" rx="6"
              fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
        {[
          { w: 232, c: "var(--primary)" },
          { w: 196, c: "var(--primary)" },
          { w: 158, c: "var(--color-gold)" },
          { w: 214, c: "var(--primary)" },
          { w: 122, c: "var(--highlight)" },
        ].map((b, i) => (
          <g key={i}>
            <rect x="120" y={162 + i * 18} width="42" height="5" rx="2.5"
                  fill="var(--text-muted)" opacity="0.4" />
            <rect x="170" y={162 + i * 18} width="212" height="5" rx="2.5" fill="var(--bg-inset)" />
            <rect x="170" y={162 + i * 18} width={b.w * 0.9} height="5" rx="2.5" fill={b.c} />
          </g>
        ))}
      </g>
    </svg>
  );
}

/* ══════════════════════════════════════════════════
   5. EMPTY STATE
   ══════════════════════════════════════════════════ */
export function IlloEmpty({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden="true">
      <rect x="34" y="30" width="92" height="62" rx="7"
            fill="var(--bg-subtle)" stroke="var(--border-strong)" strokeWidth="1.5"
            strokeDasharray="5 4" />
      <circle cx="80" cy="56" r="13" fill="none" stroke="var(--text-muted)"
              strokeWidth="2" opacity="0.4" />
      <line x1="89" y1="65" x2="98" y2="74" stroke="var(--text-muted)"
            strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <rect x="58" y="78" width="44" height="4" rx="2" fill="var(--text-muted)" opacity="0.25" />
    </svg>
  );
}
