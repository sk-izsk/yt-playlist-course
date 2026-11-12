"use client";

import Link from "next/link";
import { useMemo } from "react";
import { HUBS, layoutRoutes, trunkY } from "@/client/lib/route-map";
import type { CourseSummary } from "@/shared/types";
import styles from "./home.module.css";

/** The hero map drawn from your library: one line per course, stops fill in as you watch. */
export const LiveMap = ({ courses }: { courses: CourseSummary[] }) => {
  const routes = useMemo(() => layoutRoutes(courses), [courses]);
  const n = routes.length;
  // "You are here": the first line (pinned first) that's started but not finished, else the first unfinished one.
  const here = routes.find((r) => r.progress > 0 && r.progress < 1) ?? routes.find((r) => r.progress < 1);
  const herePt = here && (here.stops.findLast((s) => s.done) ?? here.stops[0]);

  return (
    <svg className={styles.map} viewBox="0 0 560 420" role="img" aria-labelledby="map-title">
      <title id="map-title">{`Your ${n} course${n === 1 ? "" : "s"} drawn as metro lines`}</title>
      {routes.map((r, i) => (
        <Link key={r.token} href={`/courses/${r.token}`} className={styles.mapRoute} aria-label={r.title}>
          <path
            d={r.d}
            className={`${styles.mapLine} ${styles.mapAhead}`}
            style={{ stroke: r.hex, animationDelay: `${i * 140}ms` }}
          />
          {r.travelled && (
            <path
              d={r.travelled}
              className={styles.mapLine}
              style={{ stroke: r.hex, animationDelay: `${i * 140}ms` }}
            />
          )}
          {r.stops.map((s, j) => (
            <circle
              key={j}
              cx={s.x}
              cy={s.y}
              r="6"
              className={styles.station}
              style={s.done ? { fill: r.hex } : undefined}
            />
          ))}
          <text x={r.label[0]} y={r.label[1]} className={styles.mapLabel}>
            {r.title}
          </text>
        </Link>
      ))}
      {/* Interchanges: the capsules where every line shares the trunk. */}
      {n > 1 &&
        HUBS.map((x) => (
          <rect
            key={x}
            x={x - 10}
            y={trunkY(0, n) - 10}
            width="20"
            height={trunkY(n - 1, n) - trunkY(0, n) + 20}
            rx="10"
            className={styles.interchange}
          />
        ))}
      {herePt && <circle cx={herePt.x} cy={herePt.y} r="13" className={styles.here} />}
    </svg>
  );
};
