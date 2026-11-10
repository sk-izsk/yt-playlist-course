import { theme, type ThemeConfig } from "antd";

export type Mode = "light" | "dark";

// Mirrors the CSS tokens in globals.css — antd needs real values, not var() refs, to derive its palette.
const palette = {
  light: { paper: "#fcfcfa", surface: "#ffffff", ink: "#0f1611", soft: "#4c4c3d", moss: "#4b5e1e", onMoss: "#f6f8ec", line: "#0f161117" },
  dark: { paper: "#0e1311", surface: "#161d18", ink: "#f1f3ea", soft: "#b3b7a3", moss: "#b8c460", onMoss: "#0f1611", line: "#f1f3ea1c" },
} as const;

export const buildTheme = (mode: Mode): ThemeConfig => {
  const p = palette[mode];
  return {
    algorithm: mode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: p.moss,
      colorLink: p.moss,
      colorTextLightSolid: p.onMoss,
      colorBgBase: p.paper,
      colorBgLayout: p.paper,
      colorBgContainer: p.surface,
      colorBgElevated: p.surface,
      colorTextBase: p.ink,
      colorTextSecondary: p.soft,
      colorBorder: p.line,
      colorBorderSecondary: p.line,
      borderRadius: 12,
      fontFamily: "var(--font-body), 'Helvetica Neue', Arial, sans-serif",
      fontFamilyCode: "var(--font-mono), ui-monospace, monospace",
      fontSize: 15,
      controlHeight: 38,
    },
    components: {
      Button: { borderRadius: 999, borderRadiusLG: 999, borderRadiusSM: 999, primaryShadow: "none", fontWeight: 500 },
      Segmented: { borderRadius: 999, borderRadiusSM: 999, itemSelectedBg: p.moss, itemSelectedColor: p.onMoss },
      Tabs: { itemSelectedColor: p.moss, inkBarColor: p.moss, titleFontSize: 15 },
      Tag: { borderRadiusSM: 999 },
      Progress: { defaultColor: p.moss },
    },
  };
}
