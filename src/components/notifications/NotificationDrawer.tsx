"use client";

import { Drawer } from "antd";
import type { AppEvent, CourseSummary } from "@/shared/types";
import { ActivityList } from "./ActivityList";
import { UpdatesList } from "./UpdatesList";
import styles from "./notifications.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
  events: AppEvent[];
  courses: CourseSummary[];
}

export const NotificationDrawer = ({ open, onClose, events, courses }: Props) => (
  <Drawer title="Notifications" open={open} onClose={onClose} size={420} className={styles.drawer}>
    <UpdatesList courses={courses} onNavigate={onClose} />
    <ActivityList events={events} onNavigate={onClose} />
  </Drawer>
);
