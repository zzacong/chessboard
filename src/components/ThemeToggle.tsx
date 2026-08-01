import { useChessStore } from "@/store/chessStore";

export function ThemeToggle() {
  const theme = useChessStore((s) => s.theme);
  const setTheme = useChessStore((s) => s.setTheme);

  const isLight = theme === "light";

  return (
    <button
      type="button"
      className="rounded border border-border bg-transparent px-3 py-2 text-sm leading-none text-text-muted transition-[border-color,color,transform] duration-100 hover:border-border-2 hover:text-text active:scale-95"
      onClick={() => setTheme(isLight ? "dark" : "light")}
      aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
      title={isLight ? "Switch to dark theme" : "Switch to light theme"}
    >
      {/* aria-hidden so AT reads only the aria-label, not the Unicode glyph name (LOW-2) */}
      <span aria-hidden="true">{isLight ? "☾" : "☼"}</span>
    </button>
  );
}
