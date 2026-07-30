import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import type { Difficulty, GameMode, PieceColor } from "@/types";

import { cn } from "@/lib/cn";
import { useChessStore } from "@/store/chessStore";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

const MODES: { value: GameMode; label: string; icon: string }[] = [
  { value: "vs-computer", label: "vs Computer", icon: "🤖" },
  { value: "multiplayer", label: "Local 2 Player", icon: "👥" },
  { value: "computer-vs-computer", label: "CPU vs CPU", icon: "🤖🤖" },
];

const COLORS: { value: PieceColor; label: string; symbol: string }[] = [
  { value: "w", label: "White", symbol: "♔" },
  { value: "b", label: "Black", symbol: "♚" },
];

const DIFFICULTIES: { value: Difficulty; label: string; desc: string }[] = [
  { value: "easy", label: "Easy", desc: "Depth 1" },
  { value: "medium", label: "Medium", desc: "Depth 3" },
  { value: "hard", label: "Hard", desc: "Depth 5" },
];

function DifficultyPicker({
  selected,
  onChange,
}: {
  selected: Difficulty;
  onChange: (d: Difficulty) => void;
}) {
  return (
    <div className="flex gap-2.5">
      {DIFFICULTIES.map((d) => (
        <button
          key={d.value}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border-2 px-2.5 py-3.5 transition-[border-color,background] duration-150",
            selected === d.value
              ? "border-accent bg-accent/10 text-white"
              : "border-border bg-bg text-text",
          )}
          onClick={() => onChange(d.value)}
        >
          <span className="text-sm font-semibold">{d.label}</span>
          <span className="text-[11px] text-text-muted">{d.desc}</span>
        </button>
      ))}
    </div>
  );
}

function IndexPage() {
  const resetGame = useChessStore((s) => s.resetGame);
  const router = useRouter();

  const [gameMode, setGameMode] = useState<GameMode>("vs-computer");
  const [color, setColor] = useState<PieceColor>("w");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [difficultyBlack, setDifficultyBlack] = useState<Difficulty>("medium");

  const isCvC = gameMode === "computer-vs-computer";

  function handleStart() {
    resetGame(color, difficulty, gameMode, difficultyBlack);
    void router.navigate({ to: "/game" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div
        className="w-full max-w-[420px] rounded-[20px] border border-border bg-surface px-9 py-10 text-center"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
      >
        <div className="mb-2 text-[56px] leading-none">♟</div>
        <h1 className="mb-6 text-[32px] font-bold tracking-tight text-text">Chess</h1>

        {/* Game Mode */}
        <section className="mb-7 text-left">
          <h2 className="mb-2.5 text-[11px] font-bold tracking-[0.08em] text-text-muted uppercase">
            Game Mode
          </h2>
          <div className="flex gap-2.5">
            {MODES.map((m) => (
              <button
                key={m.value}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border-2 px-2.5 py-3.5 text-sm font-medium transition-[border-color,background] duration-150",
                  gameMode === m.value
                    ? "border-accent bg-accent/10 text-white"
                    : "border-border bg-bg text-text",
                )}
                onClick={() => setGameMode(m.value)}
              >
                <span className="text-[28px] leading-none">{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Play as — hidden in CvC */}
        {!isCvC && (
          <section className="mb-7 text-left">
            <h2 className="mb-2.5 text-[11px] font-bold tracking-[0.08em] text-text-muted uppercase">
              Play as
            </h2>
            <div className="flex gap-2.5">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  className={cn(
                    "flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border-2 px-2.5 py-3.5 text-sm font-medium transition-[border-color,background] duration-150",
                    color === c.value
                      ? "border-accent bg-accent/10 text-white"
                      : "border-border bg-bg text-text",
                  )}
                  onClick={() => setColor(c.value)}
                >
                  <span className="text-[28px] leading-none">{c.symbol}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Difficulty — single picker for vs-computer */}
        {gameMode === "vs-computer" && (
          <section className="mb-7 text-left">
            <h2 className="mb-2.5 text-[11px] font-bold tracking-[0.08em] text-text-muted uppercase">
              Difficulty
            </h2>
            <DifficultyPicker selected={difficulty} onChange={setDifficulty} />
          </section>
        )}

        {/* Difficulty — dual pickers for CvC */}
        {isCvC && (
          <section className="mb-7 text-left">
            <div className="mb-4">
              <h2 className="mb-2.5 text-[11px] font-bold tracking-[0.08em] text-text-muted uppercase">
                White difficulty ♔
              </h2>
              <DifficultyPicker selected={difficulty} onChange={setDifficulty} />
            </div>
            <div>
              <h2 className="mb-2.5 text-[11px] font-bold tracking-[0.08em] text-text-muted uppercase">
                Black difficulty ♚
              </h2>
              <DifficultyPicker selected={difficultyBlack} onChange={setDifficultyBlack} />
            </div>
          </section>
        )}

        <button
          className="mt-1 w-full rounded-xl border-0 bg-accent py-3.5 text-base font-bold tracking-wide text-white transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98]"
          onClick={handleStart}
        >
          Start Game
        </button>
      </div>
    </div>
  );
}
