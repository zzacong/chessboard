import { useRouter } from "@tanstack/react-router";

import { Board } from "@/components/Board";
import { Sidebar } from "@/components/Sidebar";
import { StatusBar } from "@/components/StatusBar";
import { cn } from "@/lib/cn";
import { useChessStore } from "@/store/chessStore";

interface GameLayoutProps {
  badge: string;
}

export function GameLayout({ badge }: GameLayoutProps) {
  const router = useRouter();
  const isComputerThinking = useChessStore((s) => s.isComputerThinking);

  function handleNewGame() {
    void router.navigate({ to: "/" });
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg">
      <header
        className="sticky top-0 z-10 flex h-[56px] items-center gap-3 border-b border-border px-5"
        style={{ background: "rgba(17,16,16,0.92)", backdropFilter: "blur(12px)" }}
      >
        <span className="wordmark text-[20px] text-text" style={{ lineHeight: 1 }}>
          Chess
        </span>
        <span
          className="h-3.5 w-px shrink-0"
          style={{ background: "var(--color-border-2)" }}
          aria-hidden="true"
        />
        <span
          className="rounded px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-[0.08em] text-text-muted"
          style={{ background: "var(--color-surface-2)" }}
        >
          {badge}
        </span>
        <div className="flex-1" />
        <button
          className="rounded border border-border bg-transparent px-3 py-1.5 text-[12px] font-medium text-text-muted transition-all duration-100 hover:border-border-2 hover:text-text active:scale-[0.98]"
          onClick={handleNewGame}
          aria-label="Start a new game"
        >
          New Game
        </button>
      </header>

      <main className="flex flex-1 items-start justify-center px-5 pt-6 pb-10">
        <div className="flex items-start gap-5 max-sm:w-full max-sm:flex-col max-sm:items-center">
          <div
            className={cn(
              "flex flex-col items-start gap-3 max-sm:w-full max-sm:items-center",
              isComputerThinking && "cursor-wait",
            )}
          >
            <StatusBar />
            <Board />
          </div>

          <Sidebar />
        </div>
      </main>
    </div>
  );
}
