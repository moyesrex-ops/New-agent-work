/**
 * The locked mark (Phase 9): a perforated stamp pressed at −5° with the S
 * knocked out of it.
 *
 * Geometry is transcribed from company/brand/logo/build_logo.py, which is the
 * source of truth. It is inlined rather than loaded as an asset so it can take
 * `currentColor` and so the header costs no request on a metered connection.
 *
 * Brand testing found the full mark mushes below about 24px, so `simple`
 * drops the perforations. That switch is the two-tier system, not an
 * afterthought.
 */
const S_PATH = "M 72.89 46.70 A 13.5 13.5 0 1 0 60 60 A 13.5 13.5 0 1 1 47.11 73.30";
const PERF_POSITIONS = [24, 60, 96];

export function Mark({
  size = 32,
  simple = false,
  title,
}: {
  size?: number;
  simple?: boolean;
  title?: string;
}) {
  // Two ids per instance so multiple marks on one page do not share masks.
  const suffix = `${simple ? "s" : "f"}${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {!simple ? (
        <mask id={`perf-${suffix}`}>
          <rect x="6" y="6" width="108" height="108" rx="8" fill="#fff" />
          <g fill="#000">
            {PERF_POSITIONS.map((position) => (
              <g key={position}>
                <circle cx={position} cy="6" r="7.5" />
                <circle cx={position} cy="114" r="7.5" />
                <circle cx="6" cy={position} r="7.5" />
                <circle cx="114" cy={position} r="7.5" />
              </g>
            ))}
          </g>
        </mask>
      ) : null}

      <mask id={`knock-${suffix}`}>
        <rect width="120" height="120" fill="#fff" />
        <path d={S_PATH} fill="none" stroke="#000" strokeWidth="14" strokeLinecap="butt" />
      </mask>

      <g transform="rotate(-5 60 60)">
        <g mask={`url(#knock-${suffix})`}>
          {simple ? (
            <rect x="8" y="8" width="104" height="104" rx="14" fill="currentColor" />
          ) : (
            <rect
              x="6"
              y="6"
              width="108"
              height="108"
              rx="8"
              fill="currentColor"
              mask={`url(#perf-${suffix})`}
            />
          )}
        </g>
      </g>
    </svg>
  );
}

/** Mark plus wordmark. The header lockup. */
export function Wordmark({ size = 26 }: { size?: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        color: "var(--color-stamp-700)",
      }}
    >
      <Mark size={size} simple={size < 24} />
      <span
        style={{
          fontSize: size * 0.85,
          fontWeight: "var(--font-weight-semibold)",
          letterSpacing: "var(--font-tracking-wordmark)",
          color: "var(--color-ink-900)",
        }}
      >
        Stampa
      </span>
    </span>
  );
}
