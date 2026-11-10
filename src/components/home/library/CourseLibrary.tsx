"use client";

import { Empty, Skeleton } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useReorderCourses } from "@/client/hooks/useCourseActions";
import { useCourses } from "@/client/hooks/useCourses";
import { useDebouncedValue } from "@/client/hooks/useDebouncedValue";
import { filterCourses, reorderTokens, splitPinned } from "@/client/lib/library";
import { usePrefs } from "@/client/store/prefs";
import { useSelection } from "@/client/store/selection";
import { SectionHeading } from "../../common/SectionHeading";
import { LibraryToolbar } from "./LibraryToolbar";
import { SelectionBar } from "./SelectionBar";
import { SortableSection } from "./SortableSection";
import styles from "./library.module.css";

export const CourseLibrary = () => {
  const { data = [], isLoading } = useCourses();
  const view = usePrefs((s) => s.view);
  const selecting = useSelection((s) => s.active);
  const stopSelecting = useSelection((s) => s.stop);
  const reorder = useReorderCourses();
  const [search, setSearch] = useState("");
  const query = useDebouncedValue(search, 250);

  useEffect(() => stopSelecting, [stopSelecting]); // leave select mode when navigating away

  const visible = useMemo(() => filterCourses(data, query), [data, query]);
  const { pinned, rest } = useMemo(() => splitPinned(visible), [visible]);
  // Reordering a filtered subset would scramble hidden courses; dragging also pauses while selecting.
  const dragDisabled = Boolean(query.trim()) || selecting;

  const move = (section: "pinned" | "rest") => (from: number, to: number) => {
    const all = splitPinned(data);
    reorder.mutate(reorderTokens(all.pinned.map((c) => c.token), all.rest.map((c) => c.token), section, from, to));
  };

  return (
    <section className={`container ${styles.library}`}>
      <SectionHeading eyebrow="Your library" id="courses">
        Courses you are <em>taking right now.</em>
      </SectionHeading>
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : !data.length ? (
        <Empty description="No courses yet — paste a YouTube link above." />
      ) : (
        <>
          <LibraryToolbar search={search} onSearch={setSearch} shown={visible.length} total={data.length} />
          {selecting && <SelectionBar visible={visible} />}
          {!visible.length && <Empty description={`No course matches "${query}"`} />}
          <SortableSection title={pinned.length ? "Pinned" : undefined} courses={pinned} view={view} dragDisabled={dragDisabled} onMove={move("pinned")} />
          <SortableSection title={pinned.length && rest.length ? "All courses" : undefined} courses={rest} view={view} dragDisabled={dragDisabled} onMove={move("rest")} />
        </>
      )}
    </section>
  );
};
