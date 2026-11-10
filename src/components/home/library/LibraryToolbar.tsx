"use client";

import { AppstoreOutlined, CheckSquareOutlined, SearchOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { Button, Input, Segmented } from "antd";
import { useSelection } from "@/client/store/selection";
import { usePrefs, type LibraryView } from "@/client/store/prefs";
import styles from "./library.module.css";

interface Props {
  search: string;
  onSearch: (v: string) => void;
  shown: number;
  total: number;
}

export const LibraryToolbar = ({ search, onSearch, shown, total }: Props) => {
  const { view, setView } = usePrefs();
  const { active, start } = useSelection();
  return (
    <div className={styles.toolbar}>
      <Input
        allowClear
        prefix={<SearchOutlined />}
        placeholder="Search by title, channel or id…"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        className={styles.search}
      />
      <span className={styles.count}>{search ? `${shown} of ${total}` : `${total} courses`}</span>
      {!active && (
        <Button icon={<CheckSquareOutlined />} onClick={start}>
          Select
        </Button>
      )}
      <Segmented
        value={view}
        onChange={(v) => setView(v as LibraryView)}
        options={[
          { value: "grid", icon: <AppstoreOutlined />, title: "Grid view" },
          { value: "list", icon: <UnorderedListOutlined />, title: "List view" },
        ]}
      />
    </div>
  );
};
