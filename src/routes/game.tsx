import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";

import { Board } from "@/components/Board";
import { Sidebar } from "@/components/Sidebar";
import { StatusBar } from "@/components/StatusBar";
import { getChessState } from "@/store/chessStore";

export const Route = createFileRoute("/game")({
  beforeLoad: () => {
    const { gameStarted } = getChessState();
    if (!gameStarted) {
      throw redirect({ to: "/" });
    }
  },
  component: GamePage,
});

function GamePage() {
  const router = useRouter();

  function handleNewGame() {
    void router.navigate({ to: "/" });
  }

  return (
    <div
      className="flex min-h-screen flex-col bg-bg"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 60% 50% at 20% 20%, rgba(30,45,82,0.4) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 80% 80%, rgba(233,69,96,0.06) 0%, transparent 60%)",
      }}
    >
      <header
        className="sticky top-0 z-10 flex h-[52px] items-center justify-between border-b border-border px-6 backdrop-blur-sm"
        style={{ background: "rgba(22,33,62,0.8)" }}
      >
        <span className="flex items-center gap-2 text-[17px] font-bold tracking-tight text-text">
          <span
            className="inline-block h-2 w-2 rounded-full bg-accent"
            style={{ boxShadow: "0 0 8px var(--color-accent)" }}
          />
          Chess
        </span>
      </header>

      <main className="flex flex-1 items-start justify-center px-5 pt-7 pb-10">
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
