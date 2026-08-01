import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import type { Difficulty, EngineVersion, GameMode, PieceColor } from "@/types";

import { ThemeToggle } from "@/components/ThemeToggle";
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
      type="button"
      className={cn(
        "relative flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border px-2 py-3 text-center transition-[border-color,background-color,color,box-shadow,transform] duration-150",
        selected
          ? "border-accent bg-accent/10 text-text shadow-[0_0_0_1px_var(--color-accent)]"
          : "border-border bg-surface-2 text-text-muted hover:border-border-2 hover:bg-surface-2/80 hover:text-text active:scale-95",
      )}
      onClick={onClick}
      aria-pressed={selected}
    >
      {selected && (
        <span
          className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-accent"
          aria-hidden="true"
        />
      )}
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
          <span className="text-sm leading-tight font-semibold">{d.label}</span>
          <span className="text-xs leading-tight">{descs[d.value]}</span>
        </OptionButton>
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="block h-px flex-1 bg-border" />
      <h2 className="text-xs font-semibold tracking-widest text-text-muted uppercase">
        {children}
      </h2>
      <span className="block h-px flex-1 bg-border" />
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
    <div
      id="main-content"
      className="relative flex min-h-dvh items-center justify-center bg-bg px-4 py-10"
    >
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-105">
        {/* Wordmark — h1 comes first in DOM to fix heading order (MED-4) */}
        <div className="mb-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-3">
            <span className="h-px max-w-15 flex-1 bg-border-2" />
            <span
              className="text-6xl leading-none text-accent opacity-85 select-none"
              aria-hidden="true"
            >
              ♛
            </span>
            <span className="h-px max-w-15 flex-1 bg-border-2" />
          </div>
          <h1 className="wordmark text-5xl leading-none font-normal text-text">Chess</h1>
          <p className="mt-2 text-sm tracking-wide text-text-muted">Configure your match</p>
        </div>

        {/* Setup card */}
        <div className="rounded-2xl border border-border bg-surface px-6 py-6 shadow-[0_24px_64px_var(--shadow-board),0_2px_8px_var(--shadow-board-2),inset_0_1px_0_var(--inset-highlight)]">
          {/* Game Mode — SectionLabel now uses h3 since h1 is above (MED-4) */}
          <section className="mb-5">
            <SectionLabel>Mode</SectionLabel>
            <div className="flex gap-2">
              {MODES.map((m) => (
                <OptionButton
                  key={m.value}
                  selected={gameMode === m.value}
                  onClick={() => setGameMode(m.value)}
                >
                  <span className="text-xs leading-tight font-semibold">{m.label}</span>
                  <span className="text-xs leading-tight opacity-70">{m.sub}</span>
                </OptionButton>
              ))}
            </div>
          </section>

          {/* Engine - hidden in PvP */}
          {gameMode !== "multiplayer" && (
            <section className="mb-5">
              <SectionLabel>Engine</SectionLabel>
              <div className="flex gap-2">
                {ENGINES.map((e) => (
                  <OptionButton
                    key={e.value}
                    selected={engineVersion === e.value}
                    onClick={() => setEngineVersion(e.value)}
                  >
                    <span className="text-sm font-semibold">{e.label}</span>
                    <span className="text-xs opacity-70">{e.sub}</span>
                  </OptionButton>
                ))}
              </div>
            </section>
          )}

          {/* Play as - hidden in CvC */}
          {!isCvC && (
            <section className="mb-5">
              <SectionLabel>Play as</SectionLabel>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <OptionButton
                    key={c.value}
                    selected={color === c.value}
                    onClick={() => setColor(c.value)}
                  >
                    {/* MED-3: aria-hidden on chess glyphs so AT reads only the text label */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "text-3xl leading-none opacity-90",
                        c.value === "w" ? "text-text" : "text-text-muted",
                      )}
                    >
                      {c.symbol}
                    </span>
                    <span className="text-sm font-semibold">{c.label}</span>
                  </OptionButton>
                ))}
              </div>
            </section>
          )}

          {/* Difficulty - single picker for vs-computer */}
          {gameMode === "vs-computer" && (
            <section className="mb-5">
              <SectionLabel>Difficulty</SectionLabel>
              <DifficultyPicker
                selected={difficulty}
                onChange={setDifficulty}
                engineVersion={engineVersion}
              />
            </section>
          )}

          {/* Difficulty - dual pickers for CvC */}
          {isCvC && (
            <section className="mb-5">
              <div className="mb-4">
                <SectionLabel>
                  White{" "}
                  {/* MED-3: aria-hidden so the glyph isn't read by screen readers */}
                  <span aria-hidden="true" className="text-text opacity-85">
                    ♔
                  </span>
                </SectionLabel>
                <DifficultyPicker
                  selected={difficulty}
                  onChange={setDifficulty}
                  engineVersion={engineVersion}
                />
              </div>
              <div>
                <SectionLabel>
                  Black{" "}
                  {/* MED-3: aria-hidden so the glyph isn't read by screen readers */}
                  <span aria-hidden="true" className="text-text-muted">
                    ♚
                  </span>
                </SectionLabel>
                <DifficultyPicker
                  selected={difficultyBlack}
                  onChange={setDifficultyBlack}
                  engineVersion={engineVersion}
                />
              </div>
            </section>
          )}

          <button
            type="button"
            className="w-full rounded-lg bg-accent py-4 text-sm font-semibold tracking-wide text-bg shadow-md transition-[filter,transform] duration-150 hover:brightness-105 active:scale-100 active:brightness-95 dark:text-stone-950"
            onClick={handleStart}
          >
            Start Game
          </button>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs tracking-wide text-text-muted opacity-45">
          Pawn promotion auto-queened
        </p>
      </div>
    </div>
  );
}
