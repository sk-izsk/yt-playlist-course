import { App } from "antd";
import { useCallback } from "react";

export const useCopy = () => {
  const { message } = App.useApp();
  return useCallback(
    async (text: string, label = "Copied") => {
      try {
        await navigator.clipboard.writeText(text);
        message.success(label); // the copied text (often a full UUID) stays out of the toast
      } catch {
        message.error("Clipboard is blocked in this browser");
      }
    },
    [message],
  );
}
