import { formatCurrencyCompact } from "@/lib/format";

interface Point {
  label: string;
  value: number;
}

/**
 * Clean single-series area chart (brand-colored) for monthly revenue.
 * Pure SVG, scales responsively, readable in a card on any phone width.
 */
export function RevenueChart({ data }: { data: Point[] }) {
  const W = 320;
  const H = 170;
  const padX = 12;
  const padTop = 26;
  const padBottom = 24;
  const innerH = H - padTop - padBottom;
  const baseline = H - padBottom;
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length;

  const x = (i: number) => (n <= 1 ? W / 2 : padX + (i * (W - padX * 2)) / (n - 1));
  const y = (v: number) => baseline - (v / max) * innerH;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(d.value).toFixed(1)}`).join(" ");
  const areaPath = `M ${x(0).toFixed(1)} ${baseline} ${data
    .map((d, i) => `L ${x(i).toFixed(1)} ${y(d.value).toFixed(1)}`)
    .join(" ")} L ${x(n - 1).toFixed(1)} ${baseline} Z`;

  const hasData = data.some((d) => d.value > 0);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Receita por mês">
        <defs>
          <linearGradient id="revfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.22" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* baseline */}
        <line x1={padX} y1={baseline} x2={W - padX} y2={baseline} stroke="hsl(var(--border))" strokeWidth="1" />

        {hasData && (
          <>
            <path d={areaPath} fill="url(#revfill)" />
            <path
              d={linePath}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </>
        )}

        {data.map((d, i) => (
          <g key={d.label}>
            {hasData && d.value > 0 && (
              <>
                <circle cx={x(i)} cy={y(d.value)} r="3.5" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="2" />
                <text
                  x={x(i)}
                  y={y(d.value) - 9}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="600"
                  fill="hsl(var(--foreground))"
                >
                  {formatCurrencyCompact(d.value)}
                </text>
              </>
            )}
            <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">
              {d.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
