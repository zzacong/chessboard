import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import type { Difficulty, EngineVersion, GameMode, PieceColor } from "@/types";

import { cn } from "@/lib/cn";
import { useChessStore } from "@/store/chessStore";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

const ENGINES: { value: EngineVersion; label: string; sub: string }[] = [
  { value: "v1", label: "Minimax", sub: "Classic search" },
  { value: "v2", label: "Stockfish", sub: "UCI engine" },
];

const MODES: { value: GameMode; label: string; sub: string }[] = [
  { value: "vs-computer", label: "vs Computer", sub: "You vs CPU" },
  { value: "multiplayer", label: "Two Players", sub: "Local hotseat" },
  { value: "computer-vs-computer", label: "CPU vs CPU", sub: "Watch engines" },
];

const COLORS: { value: PieceColor; label: string; symbol: string }[] = [
  { value: "w", label: "White", symbol: "♔" },
  { value: "b", label: "Black", symbol: "♚" },
];

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const DEPTH_DESCS: Record<Difficulty, string> = {
  easy: "Depth 1",
  medium: "Depth 3",
  hard: "Depth 5",
};
const SKILL_DESCS: Record<Difficulty, string> = {
  easy: "~1320 Elo",
  medium: "~1800 Elo",
  hard: "~2800 Elo",
};

const sectionLabelClass =
  "mb-3 block text-[10px] font-semibold tracking-[0.12em] text-text-muted uppercase";

function OptionButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border px-2 py-3 text-center transition-[border-color,background-color] duration-100",
        selected
          ? "border-accent bg-accent/8 text-text"
          : "border-border bg-surface-2 text-text-muted hover:border-border-2 hover:text-text",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function DifficultyPicker({
  selected,
  onChange,
  engineVersion,
}: {
  selected: Difficulty;
  onChange: (d: Difficulty) => void;
  engineVersion: EngineVersion;
}) {
  const descs = engineVersion === "v2" ? SKILL_DESCS : DEPTH_DESCS;
  return (
    <div className="flex gap-2">
      {DIFFICULTIES.map((d) => (
        <OptionButton
          key={d.value}
          selected={selected === d.value}
          onClick={() => onChange(d.value)}
        >
          <span className="text-sm font-semibold">{d.label}</span>
          <span className="text-[11px]">{descs[d.value]}</span>
        </OptionButton>
      ))}
    </div>
  );
}

function IndexPage() {
  const resetGame = useChessStore((s) => s.resetGame);
  const router = useRouter();

  const [engineVersion, setEngineVersion] = useState<EngineVersion>("v1");
  const [gameMode, setGameMode] = useState<GameMode>("vs-computer");
  const [color, setColor] = useState<PieceColor>("w");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [difficultyBlack, setDifficultyBlack] = useState<Difficulty>("medium");

  const isCvC = gameMode === "computer-vs-computer";

  function handleStart() {
    resetGame(color, difficulty, gameMode, difficultyBlack, engineVersion);
    void router.navigate({ to: engineVersion === "v2" ? "/v2/game" : "/v1/game" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-[400px]">
        {/* Wordmark */}
        <div className="mb-8 text-center">
          <div
            className="mb-1 inline-block text-[72px] leading-none select-none"
            style={{ color: "var(--sq-light)", opacity: 0.85 }}
            aria-hidden="true"
          >
            ♛
          </div>
          <h1
            className="wordmark text-[38px] font-normal tracking-tight text-text"
            style={{ lineHeight: 1 }}
          >
            Chess
          </h1>
          <p className="mt-1.5 text-[13px] text-text-muted">Choose your match settings</p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl border border-border bg-surface px-7 py-7"
          style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.6)" }}
        >
          {/* Game Mode */}
          <section className="mb-6">
            <span className={sectionLabelClass}>Mode</span>
            <div className="flex gap-2">
              {MODES.map((m) => (
                <OptionButton
                  key={m.value}
                  selected={gameMode === m.value}
                  onClick={() => setGameMode(m.value)}
                >
                  <span className="text-[13px] leading-tight font-semibold">{m.label}</span>
                  <span className="text-[11px] leading-tight">{m.sub}</span>
                </OptionButton>
              ))}
            </div>
          </section>

          {/* Engine — hidden in PvP */}
          {gameMode !== "multiplayer" && (
            <section className="mb-6">
              <span className={sectionLabelClass}>Engine</span>
              <div className="flex gap-2">
                {ENGINES.map((e) => (
                  <OptionButton
                    key={e.value}
                    selected={engineVersion === e.value}
                    onClick={() => setEngineVersion(e.value)}
                  >
                    <span className="text-[13px] font-semibold">{e.label}</span>
                    <span className="text-[11px]">{e.sub}</span>
                  </OptionButton>
                ))}
              </div>
            </section>
          )}

          {/* Play as — hidden in CvC */}
          {!isCvC && (
            <section className="mb-6">
              <span className={sectionLabelClass}>Play as</span>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <OptionButton
                    key={c.value}
                    selected={color === c.value}
                    onClick={() => setColor(c.value)}
                  >
                    <span
                      className="text-[28px] leading-none"
                      style={{
                        color: c.value === "w" ? "var(--sq-light)" : "var(--sq-dark)",
                        opacity: 0.9,
                      }}
                    >
                      {c.symbol}
                    </span>
                    <span className="text-[13px] font-semibold">{c.label}</span>
                  </OptionButton>
                ))}
              </div>
            </section>
          )}

          {/* Difficulty — single picker for vs-computer */}
          {gameMode === "vs-computer" && (
            <section className="mb-6">
              <span className={sectionLabelClass}>Difficulty</span>
              <DifficultyPicker
                selected={difficulty}
                onChange={setDifficulty}
                engineVersion={engineVersion}
              />
            </section>
          )}

          {/* Difficulty — dual pickers for CvC */}
          {isCvC && (
            <section className="mb-6">
              <div className="mb-4">
                <span className={sectionLabelClass}>
                  White difficulty{" "}
                  <span style={{ color: "var(--sq-light)", opacity: 0.85 }}>♔</span>
                </span>
                <DifficultyPicker
                  selected={difficulty}
                  onChange={setDifficulty}
                  engineVersion={engineVersion}
                />
              </div>
              <div>
                <span className={sectionLabelClass}>
                  Black difficulty <span style={{ color: "var(--sq-dark)" }}>♚</span>
                </span>
                <DifficultyPicker
                  selected={difficultyBlack}
                  onChange={setDifficultyBlack}
                  engineVersion={engineVersion}
                />
              </div>
            </section>
          )}

          <button
            className="w-full rounded-lg py-3 text-[15px] font-semibold tracking-wide text-bg transition-opacity duration-100 hover:opacity-90 active:scale-[0.99]"
            style={{ background: "var(--color-accent)" }}
            onClick={handleStart}
          >
            Play
          </button>
        </div>
      </div>
    </div>
  );
}
