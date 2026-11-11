"use client";

import { LinkOutlined } from "@ant-design/icons";
import { App, Button, Input } from "antd";
import { useState } from "react";
import { useBulkAdd } from "@/client/hooks/useBulkCourses";
import { extractLinks, nonLinkLines } from "@/shared/links";
import styles from "./home.module.css";
import { useSession } from "@/client/hooks/useSession";

const scrollToLibrary = () => document.getElementById("courses")?.scrollIntoView({ behavior: "smooth" });

/** Paste one link, or switch to "Add many" and paste a whole list — every link becomes a course. */
export const AddLinkForm = () => {
  const { canEdit } = useSession(); // visitors read only
  const [text, setText] = useState("");
  const [many, setMany] = useState(false);
  const add = useBulkAdd();
  const { message } = App.useApp();
  const links = extractLinks(text);

  const submit = () => {
    if (!links.length) {
      if (text.trim()) message.warning("No YouTube links found in that text");
      return;
    }
    const junk = nonLinkLines(text).length;
    if (junk) message.info(`Skipping ${junk} line${junk > 1 ? "s" : ""} that aren't YouTube links`);
    add.mutate(links, {
      onSuccess: () => {
        setText("");
        scrollToLibrary(); // stay on this page; the new cards show their loading rings
      },
    });
  };

  const label = add.isPending ? "Adding…" : links.length > 1 ? `Add ${links.length} courses` : "Create course";

  if (!canEdit) return null;
  return (
    <div className={styles.addCard} id="add">
      <form
        className={styles.addForm}
        data-many={many}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {many ? (
          <Input.TextArea
            autoSize={{ minRows: 4, maxRows: 10 }}
            placeholder={"Paste one YouTube link per line\nhttps://youtube.com/playlist?list=…\nhttps://youtu.be/…"}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={add.isPending}
            className="mono"
          />
        ) : (
          <Input
            size="large"
            prefix={<LinkOutlined />}
            placeholder="youtube.com/watch?v=…&list=…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={add.isPending}
            className="mono"
            allowClear
          />
        )}
        <div className={styles.addActions}>
          <Button type="link" size="small" onClick={() => setMany((m) => !m)} disabled={add.isPending}>
            {many ? "Single link" : "Add many"}
          </Button>
          <Button type="primary" size="large" htmlType="submit" loading={add.isPending}>
            {label}
          </Button>
        </div>
      </form>
    </div>
  );
};
