"use client";

import { useAutoSync } from "@/client/hooks/useAutoSync";
import { useErrorToasts } from "@/client/hooks/useErrorToasts";
import { useTranscriptWatcher } from "@/client/hooks/useTranscriptWatcher";

/** App-wide background work. Renders nothing; lives inside the providers for queries + notifications. */
export const AutoSync = () => {
  useAutoSync();
  useTranscriptWatcher();
  useErrorToasts();
  return null;
};
