import { LINES } from "@/shared/lines";

/** Three lines meeting at one station — the app's mark. */
export const Logo = ({ size = 26 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
    <path
      d="M3 22 L13 12 H29"
      fill="none"
      stroke={LINES[0].hex}
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M16 3 V29" fill="none" stroke={LINES[2].hex} strokeWidth="4" strokeLinecap="round" />
    <path
      d="M3 10 L9 16 H29"
      fill="none"
      stroke={LINES[1].hex}
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.9"
    />
    <rect x="10.5" y="9.5" width="11" height="9" rx="4.5" fill="var(--surface)" stroke="var(--ink)" strokeWidth="2.5" />
  </svg>
);
