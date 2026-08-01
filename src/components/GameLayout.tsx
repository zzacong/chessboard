import { useRouter } from "@tanstack/react-router";

import { Board } from "@/components/Board";
import { Sidebar } from "@/components/Sidebar";
import { StatusBar } from "@/components/StatusBar";
import { ThemeToggle } from "@/components/ThemeToggle";
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
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-(--header-bg) px-5 backdrop-blur-md">
        <span className="wordmark text-xl leading-none text-text">Chess</span>
        <span className="h-3.5 w-px shrink-0 bg-border-2" aria-hidden="true" />
        <span className="rounded bg-surface-2 px-2 py-1 font-mono text-xs font-medium tracking-wide text-text-muted">
          {badge}
        </span>
        <div className="flex-1" />
        <ThemeToggle />
        <button
          className="rounded border border-border bg-transparent px-3 py-2 text-xs font-medium text-text-muted transition-[border-color,color,transform] duration-100 hover:border-border-2 hover:text-text active:scale-95"
          onClick={handleNewGame}
          aria-label="Start a new game"
        >
          New Game
        </button>
      </header>

      <main id="main-content" className="flex flex-1 items-start justify-center px-5 pt-6 pb-10">
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
