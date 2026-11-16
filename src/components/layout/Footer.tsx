// Credit line; plain Tailwind-free inline styles so it needs no CSS module.
export const Footer = () => (
  <footer
    style={{
      borderTop: "1px solid var(--line)",
      color: "var(--ink-soft)",
      fontSize: 13,
      padding: "20px 16px",
      textAlign: "center",
    }}
  >
    Built by{" "}
    <a
      href="https://izsk.dev"
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: "var(--ink)", fontWeight: 500 }}
    >
      Shaikh Zeeshan Murshed
    </a>
  </footer>
)
