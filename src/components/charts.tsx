/**
 * Minimal, dependency-free SVG charts. Design choices (see dataviz guidance):
 *  - Skill trends are small multiples (one series each) so identity never relies on colour.
 *  - One axis per chart, thin 2px lines, ≥8px markers, recessive grid, text in text tokens.
 *  - Each mark carries a native tooltip (<title>) and every chart has a table alternative.
 */
const W = 320;
const H = 150;
const PAD = { l: 28, r: 10, t: 10, b: 22 };

export type TrendPoint = { date: string; score: number; label: string };

export function TrendChart({ title, points }: { title: string; points: TrendPoint[] }) {
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (points.length <= 1 ? iw / 2 : (i / (points.length - 1)) * iw);
  const y = (v: number) => PAD.t + ih - (v / 10) * ih;
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  return (
    <figure className="rounded-lg border border-border bg-surface p-3">
      <figcaption className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium">{title}</span>
        <span className="text-xs text-muted">{points.length ? `${points.length} lần · gần nhất ${last!.score.toFixed(1)}` : "chưa có dữ liệu"}</span>
      </figcaption>
      {points.length === 0 ? (
        <p className="py-10 text-center text-xs text-muted">Chưa có điểm ước tính cho kỹ năng này.</p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${title}: ${points.map((p) => p.score.toFixed(1)).join(", ")}`}>
          {[0, 4, 6, 8.5, 10].map((v) => (
            <g key={v}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth={1} strokeDasharray={v === 0 ? undefined : "2 3"} />
              <text x={PAD.l - 4} y={y(v) + 3} textAnchor="end" fontSize="9" fill="var(--muted)">
                {v}
              </text>
            </g>
          ))}
          <text x={W - PAD.r} y={y(4) - 2} textAnchor="end" fontSize="8" fill="var(--muted)">
            B1
          </text>
          <text x={W - PAD.r} y={y(6) - 2} textAnchor="end" fontSize="8" fill="var(--muted)">
            B2
          </text>
          <text x={W - PAD.r} y={y(8.5) - 2} textAnchor="end" fontSize="8" fill="var(--muted)">
            C1
          </text>
          {points.length > 1 && <path d={d} fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={x(i)} cy={y(p.score)} r={12} fill="transparent">
                <title>{`${new Date(p.date).toLocaleDateString("vi-VN")} · ${p.label}: ${p.score.toFixed(1)}/10`}</title>
              </circle>
              <circle cx={x(i)} cy={y(p.score)} r={4} fill="var(--primary)" stroke="var(--surface)" strokeWidth={2} pointerEvents="none" />
            </g>
          ))}
          <text x={PAD.l} y={H - 6} fontSize="9" fill="var(--muted)">
            {new Date(points[0]!.date).toLocaleDateString("vi-VN")}
          </text>
          {points.length > 1 && (
            <text x={W - PAD.r} y={H - 6} fontSize="9" textAnchor="end" fill="var(--muted)">
              {new Date(last!.date).toLocaleDateString("vi-VN")}
            </text>
          )}
        </svg>
      )}
    </figure>
  );
}

export function HBarChart({ rows, valueLabel }: { rows: { label: string; value: number; max: number; note?: string }[]; valueLabel: (v: number, max: number) => string }) {
  return (
    <ul className="space-y-2">
      {rows.map((r) => {
        const pct = r.max ? (r.value / r.max) * 100 : 0;
        return (
          <li key={r.label} className="grid grid-cols-[minmax(7rem,12rem)_1fr_auto] items-center gap-3 text-sm" title={`${r.label}: ${valueLabel(r.value, r.max)}`}>
            <span className="truncate">{r.label}</span>
            <span className="h-3 overflow-hidden rounded-full bg-surface-2" aria-hidden>
              <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </span>
            <span className="tabular-nums text-muted">
              {valueLabel(r.value, r.max)}
              {r.note && <span className="ml-1 text-xs">{r.note}</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function WeeklyBars({ weeks }: { weeks: { week: string; sessions: number; minutes: number }[] }) {
  const max = Math.max(30, ...weeks.map((w) => w.minutes));
  const bw = (W - PAD.l - PAD.r) / weeks.length;
  const ih = H - PAD.t - PAD.b;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Study minutes per week: ${weeks.map((w) => w.minutes).join(", ")}`}>
      <line x1={PAD.l} x2={W - PAD.r} y1={PAD.t + ih} y2={PAD.t + ih} stroke="var(--border-strong)" />
      <text x={PAD.l - 4} y={PAD.t + 6} textAnchor="end" fontSize="9" fill="var(--muted)">
        {max}
      </text>
      {weeks.map((w, i) => {
        const h = (w.minutes / max) * ih;
        const x0 = PAD.l + i * bw + 3;
        return (
          <g key={w.week}>
            <rect x={x0} y={PAD.t + ih - h} width={bw - 6} height={Math.max(h, w.minutes ? 2 : 0)} rx={3} fill="var(--primary)">
              <title>{`Tuần ${w.week}: ${w.minutes} phút, ${w.sessions} buổi`}</title>
            </rect>
            <text x={x0 + (bw - 6) / 2} y={H - 6} textAnchor="middle" fontSize="8" fill="var(--muted)">
              {w.week.slice(5)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
