

type MiniSparklineProps = {
  values: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  padding?: number;
  className?: string;
  showBaseline?: boolean;
};

export default function MiniSparkline({
  values,
  width = 120,
  height = 44,
  strokeWidth = 2,
  padding = 3,
  className,
  showBaseline = true,
}: MiniSparklineProps) {
  const clean = values.filter((v) => Number.isFinite(v));
  if (clean.length < 2) {
    return (
      <div
        className={className}
        style={{ width, height, borderRadius: 10, background: "#0b1220" }}
      />
    );
  }

  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const range = max - min || 1;

  const w = width - padding * 2;
  const h = height - padding * 2;

  const points = clean
    .map((v, i) => {
      const x = padding + (i * w) / (clean.length - 1);
      const y = padding + (1 - (v - min) / range) * h;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const first = clean[0];
  const last = clean[clean.length - 1];
  const up = last >= first;

// 상승: red / 하락: blue
const stroke = up ? "#e11d48" : "#2563eb"; // rose-600 / blue-600
const fill = up
  ? "rgba(225,29,72,0.16)"
  : "rgba(37,99,235,0.16)";

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="미니 차트"
    >
     <rect
  x="0"
  y="0"
  width={width}
  height={height}
  rx="10"
  fill="transparent"
/>

    {showBaseline && (
  <line
    x1={padding}
    y1={height - padding - 0.5}
    x2={width - padding}
    y2={height - padding - 0.5}
    stroke="rgba(0,0,0,0.08)"
    strokeWidth="1"
  />
)}

      <path
        d={`M ${points} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`}
        fill={fill}
      />

      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
