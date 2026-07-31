import { useRouter } from "@tanstack/react-router";

import { Board } from "@/components/Board";
import { Sidebar } from "@/components/Sidebar";
import { StatusBar } from "@/components/StatusBar";

interface GameLayoutProps {
  badge: string;
}

export function GameLayout({ badge }: GameLayoutProps) {
  const router = useRouter();

  function handleNewGame() {
    void router.navigate({ to: "/" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header
        className="sticky top-0 z-10 flex h-[50px] items-center border-b border-border px-6 backdrop-blur-sm"
        style={{ background: "rgba(26,25,24,0.85)" }}
      >
        <span className="wordmark text-[18px] text-text" style={{ lineHeight: 1 }}>
          Chess
        </span>
        <span
          className="ml-2 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.1em] text-text-muted uppercase"
          style={{ background: "var(--color-surface-2)" }}
        >
          {badge}
        </span>
      </header>

      <main className="flex flex-1 items-start justify-center px-5 pt-6 pb-10">
        <div className="flex items-start gap-5 max-sm:w-full max-sm:flex-col max-sm:items-center">
          <div className="flex flex-col items-start gap-3 max-sm:w-full max-sm:items-center">
            <StatusBar onNewGame={handleNewGame} />
            <Board />
          </div>

          <Sidebar />
        </div>
      </main>
    </div>
  );
}
