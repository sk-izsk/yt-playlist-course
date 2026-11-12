import { theme, type ThemeConfig } from "antd";

export type Mode = "light" | "dark";

// Mirrors the tokens in globals.css — antd needs real values, not var() refs, to derive its palette.
const palette = {
  light: {
    paper: "#f7f9fa",
    surface: "#ffffff",
    ink: "#101826",
    soft: "#4a5565",
    primary: "#101826",
    onPrimary: "#ffffff",
    line: "#10182619",
    accent: "#2563eb",
  },
  dark: {
    paper: "#181818",
    surface: "#1f1f1f",
    ink: "#f2f4f7",
    soft: "#a3acb9",
    primary: "#f2f4f7",
    onPrimary: "#181818",
    line: "#f2f4f71f",
    accent: "#6e9bff",
  },
} as const;

export const buildTheme = (mode: Mode): ThemeConfig => {
  const p = palette[mode];
  return {
    algorithm: mode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: p.primary,
      colorLink: p.accent,
      colorInfo: p.accent,
      colorTextLightSolid: p.onPrimary,
      colorBgBase: p.paper,
      colorBgLayout: p.paper,
      colorBgContainer: p.surface,
      colorBgElevated: p.surface,
      colorTextBase: p.ink,
      colorTextSecondary: p.soft,
      colorBorder: p.line,
      colorBorderSecondary: p.line,
      borderRadius: 10,
      fontFamily: "var(--font-sans), 'Helvetica Neue', Arial, sans-serif",
      fontFamilyCode: "var(--font-mono), ui-monospace, monospace",
      fontSize: 15,
      controlHeight: 38,
      motionEaseOut: "cubic-bezier(0.22, 1, 0.36, 1)",
    },
    components: {
      // Buttons are signage pills: ink fill, no glow.
      Button: {
        borderRadius: 999,
        borderRadiusLG: 999,
        borderRadiusSM: 999,
        primaryShadow: "none",
        defaultShadow: "none",
        fontWeight: 600,
      },
      Segmented: { borderRadius: 999, borderRadiusSM: 999, itemSelectedBg: p.primary, itemSelectedColor: p.onPrimary },
      Tabs: { itemSelectedColor: p.ink, inkBarColor: p.ink, titleFontSize: 15 },
      Tag: { borderRadiusSM: 999 },
      Progress: { defaultColor: p.primary },
    },
  };
};
