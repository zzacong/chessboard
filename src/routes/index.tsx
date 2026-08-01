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
        "relative flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border px-2 py-3 text-center transition-[border-color,background-color,color,box-shadow,transform] duration-150",
        selected
          ? "border-accent bg-accent/10 text-text shadow-[0_0_0_1px_var(--color-accent)]"
          : "border-border bg-surface-2 text-text-muted hover:border-border-2 hover:bg-surface-2/80 hover:text-text active:scale-[0.98]",
      )}
      onClick={onClick}
      aria-pressed={selected}
    >
      {selected && (
        <span
          className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full"
          style={{ background: "var(--color-accent)" }}
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
          <span className="text-[13px] leading-tight font-semibold">{d.label}</span>
          <span className="text-[11px] leading-tight">{descs[d.value]}</span>
        </OptionButton>
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <span className="block h-px flex-1" style={{ background: "var(--color-border)" }} />
      <span className="text-[10px] font-semibold tracking-[0.14em] text-text-muted uppercase">
        {children}
      </span>
      <span className="block h-px flex-1" style={{ background: "var(--color-border)" }} />
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
      className="flex min-h-[100dvh] items-center justify-center bg-bg px-4 py-10"
    >
      <div className="w-full max-w-[420px]">
        {/* Wordmark */}
        <div className="mb-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-3" aria-hidden="true">
            <span
              className="h-px max-w-[60px] flex-1"
              style={{ background: "var(--color-border-2)" }}
            />
            <span
              className="text-[52px] leading-none select-none"
              style={{
                color: "var(--sq-light)",
                opacity: 0.8,
                textShadow: "0 2px 12px rgba(240,217,181,0.25)",
              }}
            >
              ♛
            </span>
            <span
              className="h-px max-w-[60px] flex-1"
              style={{ background: "var(--color-border-2)" }}
            />
          </div>
          <h1 className="wordmark text-[42px] font-normal text-text" style={{ lineHeight: 1 }}>
            Chess
          </h1>
          <p className="mt-2 text-[13px] tracking-wide text-text-muted">Configure your match</p>
        </div>

        {/* Setup card */}
        <div
          className="rounded-2xl border border-border bg-surface px-6 py-6"
          style={{
            boxShadow:
              "0 24px 64px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          {/* Game Mode */}
          <section className="mb-5">
            <SectionLabel>Mode</SectionLabel>
            <div className="flex gap-2">
              {MODES.map((m) => (
                <OptionButton
                  key={m.value}
                  selected={gameMode === m.value}
                  onClick={() => setGameMode(m.value)}
                >
                  <span className="text-[12px] leading-tight font-semibold">{m.label}</span>
                  <span className="text-[10px] leading-tight opacity-70">{m.sub}</span>
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
                    <span className="text-[13px] font-semibold">{e.label}</span>
                    <span className="text-[11px] opacity-70">{e.sub}</span>
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
                    <span
                      className="text-[30px] leading-none"
                      style={{
                        color: c.value === "w" ? "var(--sq-light)" : "var(--sq-dark)",
                        opacity: 0.9,
                        textShadow:
                          c.value === "w"
                            ? "0 1px 8px rgba(240,217,181,0.3)"
                            : "0 1px 8px rgba(181,136,99,0.4)",
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
                  White <span style={{ color: "var(--sq-light)", opacity: 0.85 }}>♔</span>
                </SectionLabel>
                <DifficultyPicker
                  selected={difficulty}
                  onChange={setDifficulty}
                  engineVersion={engineVersion}
                />
              </div>
              <div>
                <SectionLabel>
                  Black <span style={{ color: "var(--sq-dark)" }}>♚</span>
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
            className="w-full rounded-lg py-3.5 text-[15px] font-semibold tracking-[0.04em] transition-[filter,transform] duration-150 hover:brightness-105 active:scale-[0.99] active:brightness-95"
            style={{
              background: "var(--color-accent)",
              color: "#1a1210",
              boxShadow: "0 4px 20px rgba(200,160,90,0.25)",
            }}
            onClick={handleStart}
          >
            Start Game
          </button>
        </div>

        {/* Footer */}
        <p
          className="mt-6 text-center text-[11px] tracking-wide text-text-muted"
          style={{ opacity: 0.45 }}
        >
          Pawn promotion auto-queened
        </p>
      </div>
    </div>
  );
}
