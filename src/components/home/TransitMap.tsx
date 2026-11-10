"use client";

import { useCourses } from "@/client/hooks/useCourses";
import { LINES } from "@/shared/lines";
import { LiveMap } from "./LiveMap";
import styles from "./home.module.css";

// Demo map for an empty library: a small octilinear network where each course is a line.
// The lines draw themselves once on load (the page's single orchestrated motion).
const ROUTES = [
  { line: LINES[0], name: "Python basics", d: "M24 330 H170 L260 240 H536", label: [24, 352] },
  { line: LINES[1], name: "System design", d: "M70 34 V140 L190 260 V396", label: [82, 30] },
  { line: LINES[2], name: "DSA patterns", d: "M24 118 H210 L300 208 V300 L370 370 H536", label: [150, 146] },
  { line: LINES[4], name: "Gen AI", d: "M536 70 H430 L300 200 L230 270 H120", label: [536, 60] },
] as const;

const STATIONS: [number, number][] = [
  [24, 330], [110, 330], [536, 240], [400, 240],
  [70, 34], [70, 100], [190, 396], [190, 330],
  [24, 118], [130, 118], [536, 370], [450, 370],
  [536, 70], [470, 70], [120, 270],
];

// Interchanges: where two lines share a stop.
const INTERCHANGES: [number, number][] = [[260, 240], [300, 200], [190, 260]];

const DemoMap = () => (
  <svg className={styles.map} viewBox="0 0 560 420" role="img" aria-labelledby="map-title">
    <title id="map-title">Four courses drawn as metro lines that meet at interchange stations</title>
    {ROUTES.map((r, i) => (
      <path
        key={r.name}
        d={r.d}
        className={styles.mapLine}
        style={{ stroke: r.line.hex, animationDelay: `${i * 140}ms` }}
      />
    ))}
    {STATIONS.map(([x, y]) => (
      <circle key={`${x}-${y}`} cx={x} cy={y} r="6" className={styles.station} />
    ))}
    {INTERCHANGES.map(([x, y]) => (
      <rect key={`${x}-${y}`} x={x - 10} y={y - 8} width="20" height="16" rx="8" className={styles.interchange} />
    ))}
    {/* "You are here" — the next unwatched lesson */}
    <circle cx="400" cy="240" r="13" className={styles.here} />
    {ROUTES.map((r) => (
      <text
        key={`${r.name}-label`}
        x={r.label[0]}
        y={r.label[1]}
        textAnchor={r.label[0] > 400 ? "end" : "start"}
        className={styles.mapLabel}
      >
        {r.name}
      </text>
    ))}
  </svg>
);

/** Your real courses once you have some; the demo map until then (and while loading). */
export const TransitMap = () => {
  const { data } = useCourses();
  return data?.length ? <LiveMap courses={data} /> : <DemoMap />;
};
