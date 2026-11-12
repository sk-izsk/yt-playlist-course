"use client";

import { ArrowLeftOutlined } from "@ant-design/icons";
import { Breadcrumb } from "antd";
import Link from "next/link";
import styles from "./common.module.css";

export interface Crumb {
  label: string;
  href?: string;
}

/** "← Courses / AI Engineer… / Lesson 3" — the arrow goes one level up, each segment is a link. */
export const Crumbs = ({ items }: { items: Crumb[] }) => {
  const parent = items.findLast((i) => i.href);
  return (
    <nav className={styles.crumbs} aria-label="Breadcrumb">
      {parent && (
        <Link href={parent.href!} className={styles.crumbBack} aria-label={`Back to ${parent.label}`}>
          <ArrowLeftOutlined />
        </Link>
      )}
      <Breadcrumb
        items={items.map((i) => ({
          title: i.href ? (
            <Link href={i.href} className={styles.crumbLink}>
              {i.label}
            </Link>
          ) : (
            <span className={styles.crumbCurrent}>{i.label}</span>
          ),
        }))}
      />
    </nav>
  );
};
