import type { LocalBall } from "@/hooks/useCricketScoring";

interface ScoreGraphProps {
  balls: LocalBall[];
  label?: string;
}

export function ScoreGraph({
  balls,
  label = "Run Progression",
}: ScoreGraphProps) {
  if (balls.length === 0) return null;

  // Get max completed over
  const maxOverCompleted = balls.reduce((max, b) => {
    if (b.isLegalDelivery) return Math.max(max, b.overNumber);
    return max;
  }, -1);

  if (maxOverCompleted < 0) return null;

  // Calculate cumulative runs at the end of each over
  const overTotals: { over: number; runs: number }[] = [];
  let cumRuns = 0;
  for (let ov = 0; ov <= maxOverCompleted; ov++) {
    const overBalls = balls.filter((b) => b.overNumber === ov);
    const overRuns = overBalls.reduce((sum, b) => {
      // Runs scored this ball (actual runs + extras)
      let r = b.runs;
      if (b.extrasType === "wide") r += 1; // wide penalty
      if (b.extrasType === "noball") r += 1; // no-ball penalty
      if (b.extrasType === "bye" || b.extrasType === "legbye") r += b.runs;
      return sum + r;
    }, 0);
    cumRuns += overRuns;
    overTotals.push({ over: ov + 1, runs: cumRuns });
  }

  if (overTotals.length < 2) {
    return (
      <div className="rounded-xl border border-border/30 bg-muted/20 px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          {label}
        </div>
        <p className="text-xs text-muted-foreground text-center py-4">
          Complete more overs to see progression
        </p>
      </div>
    );
  }

  const maxRuns = Math.max(...overTotals.map((o) => o.runs), 10);
  const W = 300;
  const H = 130;
  const padLeft = 32;
  const padRight = 12;
  const padTop = 10;
  const padBottom = 24;
  const chartW = W - padLeft - padRight;
  const chartH = H - padTop - padBottom;

  const toX = (idx: number) =>
    padLeft + (idx / (overTotals.length - 1)) * chartW;
  const toY = (runs: number) => padTop + chartH - (runs / maxRuns) * chartH;

  const pathD = overTotals
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)},${toY(p.runs).toFixed(1)}`,
    )
    .join(" ");

  // Y-axis labels
  const yLabels = [0, Math.round(maxRuns / 2), maxRuns];

  return (
    <div className="rounded-xl border border-border/30 bg-muted/20 px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {label}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 140 }}
        role="img"
        aria-label="Score progression graph"
      >
        {/* Y-axis gridlines */}
        {yLabels.map((v) => (
          <g key={v}>
            <line
              x1={padLeft}
              y1={toY(v)}
              x2={W - padRight}
              y2={toY(v)}
              stroke="oklch(0.35 0.02 248)"
              strokeWidth="0.5"
              strokeDasharray="3,3"
            />
            <text
              x={padLeft - 4}
              y={toY(v) + 4}
              textAnchor="end"
              fontSize="8"
              fill="oklch(0.52 0.04 240)"
              fontFamily="Geist Mono, monospace"
            >
              {v}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path
          d={`${pathD} L ${toX(overTotals.length - 1).toFixed(1)},${(padTop + chartH).toFixed(1)} L ${toX(0).toFixed(1)},${(padTop + chartH).toFixed(1)} Z`}
          fill="oklch(0.82 0.22 145 / 0.08)"
        />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="oklch(0.82 0.22 145)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots */}
        {overTotals.map((p, i) => (
          <circle
            // biome-ignore lint/suspicious/noArrayIndexKey: over index is stable
            key={i}
            cx={toX(i)}
            cy={toY(p.runs)}
            r="3"
            fill="oklch(0.82 0.22 145)"
            stroke="oklch(0.1 0.015 250)"
            strokeWidth="1.5"
          />
        ))}

        {/* X-axis labels */}
        {overTotals.map(
          (p, i) =>
            (i % Math.max(1, Math.floor(overTotals.length / 8)) === 0 ||
              i === overTotals.length - 1) && (
              <text
                // biome-ignore lint/suspicious/noArrayIndexKey: over index is stable
                key={`xl-${i}`}
                x={toX(i)}
                y={H - 4}
                textAnchor="middle"
                fontSize="8"
                fill="oklch(0.52 0.04 240)"
                fontFamily="Geist Mono, monospace"
              >
                {p.over}
              </text>
            ),
        )}

        {/* X-axis label */}
        <text
          x={W / 2}
          y={H}
          textAnchor="middle"
          fontSize="7"
          fill="oklch(0.4 0.03 240)"
          fontFamily="Geist Mono, monospace"
        >
          Overs
        </text>
      </svg>
    </div>
  );
}
