"use client";

import { SyncOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useCheckCourse } from "@/client/hooks/useCourseUpdates";
import { useSession } from "@/client/hooks/useSession";

/** Detect-only: looks for new playlist videos; the banner/bell then offers to add them. */
export const SyncButton = ({ token }: { token: string }) => {
  const { canEdit } = useSession(); // visitors read only
  const check = useCheckCourse(token);
  if (!canEdit) return null;
  return (
    <Button icon={<SyncOutlined spin={check.isPending} />} onClick={() => check.mutate()} disabled={check.isPending}>
      Check for new videos
    </Button>
  );
};
