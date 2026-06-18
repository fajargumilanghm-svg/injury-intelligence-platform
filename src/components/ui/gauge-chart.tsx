"use client";

interface GaugeChartProps {
  value: number;
  min?: number;
  max?: number;
  thresholds?: { label: string; min: number; max: number; color: string }[];
  size?: number;
  label?: string;
  unit?: string;
}

const defaultThresholds = [
  { label: "Under", min: 0, max: 0.8, color: "#f59e0b" },
  { label: "Optimal", min: 0.8, max: 1.3, color: "#22c55e" },
  { label: "Elevated", min: 1.3, max: 1.5, color: "#f97316" },
  { label: "High", min: 1.5, max: 2.5, color: "#ef4444" },
];

export function GaugeChart({
  value,
  min = 0,
  max = 2.5,
  thresholds = defaultThresholds,
  size = 220,
  label = "ACWR",
  unit = "",
}: GaugeChartProps) {
  const cx = size / 2;
  const cy = size / 2 + 8;
  const radius = size * 0.38;
  const strokeWidth = size * 0.07;

  const startAngle = -180;
  const endAngle = 0;
  const totalAngle = endAngle - startAngle;

  const activeThreshold = thresholds.find((t) => value >= t.min && value < t.max) ?? thresholds[thresholds.length - 1];

  function polarToCartesian(angle: number, r: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function describeArc(angleStart: number, angleEnd: number, r: number) {
    const start = polarToCartesian(angleStart, r);
    const end = polarToCartesian(angleEnd, r);
    const largeArc = angleEnd - angleStart > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  }

  const percentage = (value - min) / (max - min);
  const needleAngle = startAngle + percentage * totalAngle;
  const needleTip = polarToCartesian(needleAngle, radius + 6);
  const needleBase = polarToCartesian(needleAngle, -12);

  const tickCount = 10;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const t = i / tickCount;
    const angle = startAngle + t * totalAngle;
    const outer = polarToCartesian(angle, radius - 4);
    const inner = polarToCartesian(angle, radius - strokeWidth + 4);
    return { outer, inner, value: min + t * (max - min) };
  });

  const color = activeThreshold.color;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.6}`}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {thresholds.map((t) => {
          const tMin = (t.min - min) / (max - min);
          const tMax = (t.max - min) / (max - min);
          const aStart = startAngle + tMin * totalAngle;
          const aEnd = startAngle + tMax * totalAngle;
          return (
            <path
              key={t.label}
              d={describeArc(aStart, aEnd, radius)}
              fill="none"
              stroke={t.color}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
              opacity={0.6}
            />
          );
        })}

        {ticks.map((tick, i) => (
          <line
            key={i}
            x1={tick.inner.x}
            y1={tick.inner.y}
            x2={tick.outer.x}
            y2={tick.outer.y}
            stroke="#94a3b8"
            strokeWidth={i % 5 === 0 ? 1.5 : 0.8}
          />
        ))}

        <line
          x1={needleBase.x}
          y1={needleBase.y}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          filter="url(#glow)"
        />

        <circle cx={needleBase.x} cy={needleBase.y} r={4} fill={color} filter="url(#glow)" />

        {ticks.filter((_, i) => i % 5 === 0).map((tick, i) => {
          const labelAngle = startAngle + (i * 5 / tickCount) * totalAngle;
          const pos = polarToCartesian(labelAngle, radius + 16);
          const val = min + (i * 5 / tickCount) * (max - min);
          return (
            <text
              key={i}
              x={pos.x}
              y={pos.y + 3}
              textAnchor="middle"
              fontSize={9}
              fill="#64748b"
            >
              {val.toFixed(val % 1 === 0 ? 0 : 1)}
            </text>
          );
        })}
      </svg>

      <div className="text-center -mt-2">
        <p className="text-3xl font-bold tracking-tight" style={{ color }}>{value.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold mt-1"
          style={{ backgroundColor: color + "20", color }}
        >
          {activeThreshold.label}
        </span>
      </div>
    </div>
  );
}
