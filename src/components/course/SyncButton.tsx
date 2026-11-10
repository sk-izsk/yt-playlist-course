"use client";

import { SyncOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useCheckCourse } from "@/client/hooks/useCourseUpdates";

/** Detect-only: looks for new playlist videos; the banner/bell then offers to add them. */
export const SyncButton = ({ token }: { token: string }) => {
  const check = useCheckCourse(token);
  return (
    <Button icon={<SyncOutlined spin={check.isPending} />} onClick={() => check.mutate()} disabled={check.isPending}>
      Check for new videos
    </Button>
  );
};
