import styles from "./home.module.css";

// Original illustration: dawn sky, two mountain ranges, a lake, pine clusters and a meadow.
const W = 1440;

const Pine = ({ x, y, h, fill }: { x: number; y: number; h: number; fill: string }) => {
  const w = h * 0.42;
  const tiers = [0, 0.28, 0.52].map((t, i) => {
    const top = y - h + t * h;
    const half = (w / 2) * (1 - i * 0.18);
    return `${x},${top} ${x - half},${top + h * 0.48} ${x + half},${top + h * 0.48}`;
  });
  return (
    <g fill={fill}>
      {tiers.map((p) => <polygon key={p} points={p} />)}
      <rect x={x - 2} y={y - h * 0.05} width={4} height={h * 0.12} />
    </g>
  );
}

// Deterministic pseudo-random so server and client render the same trees.
const r = (i: number) => Math.abs((Math.sin(i * 91.7) * 10000) % 1);

const leftPines = Array.from({ length: 14 }, (_, i) => ({ x: 20 + i * 30 + r(i) * 18, h: 90 + r(i + 7) * 120 }));
const rightPines = Array.from({ length: 14 }, (_, i) => ({ x: W - 20 - i * 30 - r(i + 3) * 18, h: 90 + r(i + 11) * 120 }));
const flowers = Array.from({ length: 40 }, (_, i) => ({ x: r(i + 1) * W, y: 560 + r(i + 5) * 55 }));

export const HeroScene = () => {
  return (
    <svg className={styles.scene} viewBox={`0 0 ${W} 640`} preserveAspectRatio="xMidYMax slice" aria-hidden>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fcfcfa" />
          <stop offset="0.65" stopColor="#f6dfcd" />
          <stop offset="1" stopColor="#efc9b0" />
        </linearGradient>
        <linearGradient id="lake" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fa3db" />
          <stop offset="1" stopColor="#c3cdea" />
        </linearGradient>
      </defs>
      <rect width={W} height="640" fill="url(#sky)" />
      <circle cx="1080" cy="300" r="70" fill="#f3c6a0" opacity="0.7" />

      {/* far range */}
      <path d="M0 380 L160 270 L300 340 L470 220 L640 330 L820 230 L1000 330 L1180 240 L1440 360 L1440 470 L0 470Z" fill="#cdb5c8" />
      <path d="M470 220 l-22 18 h44Z M820 230 l-20 16 h40Z M1180 240 l-20 16 h40Z" fill="#fdf8f5" />
      {/* near range */}
      <path d="M0 430 L210 330 L420 420 L600 350 L760 420 L960 340 L1180 420 L1440 350 L1440 480 L0 480Z" fill="#8e9bd0" />

      <rect y="470" width={W} height="70" fill="url(#lake)" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={620 + i * 12} y={486 + i * 12} width={200 - i * 24} height="3" rx="1.5" fill="#fff" opacity="0.55" />
      ))}

      <path d="M0 540 Q360 505 720 535 T1440 530 L1440 640 L0 640Z" fill="#7f9a3a" />
      <path d="M0 575 Q420 548 820 575 T1440 570 L1440 640 L0 640Z" fill="#6d8a2e" />
      {flowers.map((f, i) => <circle key={i} cx={f.x} cy={f.y} r="2.2" fill="#fff" opacity="0.85" />)}

      {leftPines.map((p, i) => <Pine key={`l${i}`} x={p.x} y={560} h={p.h} fill={i % 3 ? "#1f3a2b" : "#2a4a35"} />)}
      {rightPines.map((p, i) => <Pine key={`r${i}`} x={p.x} y={560} h={p.h} fill={i % 3 ? "#1f3a2b" : "#2a4a35"} />)}
    </svg>
  );
}
