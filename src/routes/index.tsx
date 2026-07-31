import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import type { Difficulty, EngineVersion, GameMode, PieceColor } from "@/types";

import { cn } from "@/lib/cn";
import { useChessStore } from "@/store/chessStore";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

const ENGINES: { value: EngineVersion; label: string; sub: string }[] = [
  { value: "v1", label: "Minimax", sub: "Classic search for quick local play." },
  { value: "v2", label: "Stockfish", sub: "Stronger UCI analysis with deeper calculation." },
];

const MODES: { value: GameMode; label: string; sub: string }[] = [
  { value: "vs-computer", label: "Play the engine", sub: "Human against computer." },
  { value: "multiplayer", label: "Pass and play", sub: "Two players on one board." },
  { value: "computer-vs-computer", label: "Watch a match", sub: "Let both sides calculate." },
];

const COLORS: { value: PieceColor; label: string; symbol: string; sub: string }[] = [
  { value: "w", label: "White", symbol: "♔", sub: "Move first and press early." },
  { value: "b", label: "Black", symbol: "♚", sub: "Absorb pressure and counter." },
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
  easy: "Approx. 1320 Elo",
  medium: "Approx. 1800 Elo",
  hard: "Approx. 2800 Elo",
};

const modeSummaries: Record<GameMode, string> = {
  "vs-computer": "Pick a side, set the strength, and start playing immediately.",
  multiplayer: "Share the same board locally with no engine running.",
  "computer-vs-computer": "Compare settings and watch both sides play autonomously.",
};

const sectionLabelClass = "text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase";

function OptionButton({
  selected,
  onClick,
  title,
  subtitle,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      className={cn(
        "group flex min-h-[128px] flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 active:scale-[0.99]",
        selected
          ? "border-accent bg-accent/10 text-text"
          : "border-border bg-surface/70 text-text hover:border-border-2 hover:bg-surface",
      )}
      onClick={onClick}
      type="button"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <span className="text-[15px] font-semibold tracking-[-0.02em] text-text">{title}</span>
          <span
            className={cn(
              "mt-0.5 h-2.5 w-2.5 rounded-full border transition-colors",
              selected
                ? "border-accent bg-accent"
                : "border-border-2 bg-transparent group-hover:border-text-muted",
            )}
            aria-hidden="true"
          />
        </div>
        <p className="max-w-[26ch] text-sm leading-6 text-text-muted">{subtitle}</p>
      </div>
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
    <div className="grid gap-3 sm:grid-cols-3">
      {DIFFICULTIES.map((difficulty) => (
        <button
          key={difficulty.value}
          className={cn(
            "rounded-2xl border px-4 py-4 text-left transition-all duration-200 active:scale-[0.99]",
            selected === difficulty.value
              ? "border-accent bg-accent/10 text-text"
              : "border-border bg-surface/60 text-text hover:border-border-2 hover:bg-surface",
          )}
          onClick={() => onChange(difficulty.value)}
          type="button"
        >
          <span className="block text-[15px] font-semibold tracking-[-0.02em]">
            {difficulty.label}
          </span>
          <span className="mt-1 block text-sm leading-6 text-text-muted">
            {descs[difficulty.value]}
          </span>
        </button>
      ))}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-border py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div className="text-xs tracking-[0.08em] text-text-muted uppercase">{label}</div>
      <div className="mt-1 text-sm leading-6 text-text">{value}</div>
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
  const isMultiplayer = gameMode === "multiplayer";

  const currentEngine = useMemo(
    () => ENGINES.find((engine) => engine.value === engineVersion) ?? ENGINES[0],
    [engineVersion],
  );

  const whiteSummary = engineVersion === "v2" ? SKILL_DESCS[difficulty] : DEPTH_DESCS[difficulty];
  const blackSummary =
    engineVersion === "v2" ? SKILL_DESCS[difficultyBlack] : DEPTH_DESCS[difficultyBlack];

  function handleStart() {
    resetGame(color, difficulty, gameMode, difficultyBlack, engineVersion);
    void router.navigate({ to: engineVersion === "v2" ? "/v2/game" : "/v1/game" });
  }

  return (
    <div className="min-h-[100dvh] bg-bg text-text">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1400px] flex-col px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <header className="flex min-h-[68px] items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-surface text-[26px]"
              style={{ color: "var(--sq-light)" }}
              aria-hidden="true"
            >
              ♛
            </div>
            <div>
              <div className="wordmark pb-1 text-[28px] leading-[1.1] text-text">Chess</div>
              <p className="text-sm text-text-muted">Quick local play with two engine paths.</p>
            </div>
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            <span className="rounded-full border border-border px-3 py-1.5 text-xs text-text-muted">
              React 19
            </span>
            <span className="rounded-full border border-border px-3 py-1.5 text-xs text-text-muted">
              Minimax + Stockfish
            </span>
          </div>
        </header>

        <main className="grid flex-1 gap-8 py-8 lg:grid-cols-[minmax(0,1.15fr)_420px] lg:gap-10 lg:py-10">
          <section className="grid gap-6 lg:grid-rows-[auto_auto_1fr]">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
              <div className="rounded-[28px] border border-border bg-surface px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
                <p className={sectionLabelClass}>Local chess, rebuilt</p>
                <h1 className="mt-4 max-w-[10ch] text-4xl leading-[1.02] font-semibold tracking-[-0.06em] text-text sm:text-5xl lg:text-6xl">
                  Set the board your way and start fast.
                </h1>
                <p className="mt-5 max-w-[32ch] text-base leading-7 text-text-muted sm:text-lg">
                  Choose the engine, the side, and the pace. Then jump straight into a clean local
                  match.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-bg transition-opacity duration-200 hover:opacity-90 active:scale-[0.98]"
                    onClick={handleStart}
                    type="button"
                  >
                    Start game
                  </button>
                  <a
                    className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-text transition-colors duration-200 hover:border-border-2 hover:bg-surface-2"
                    href="#setup"
                  >
                    Adjust setup
                  </a>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
                <div className="overflow-hidden rounded-[28px] border border-border bg-surface-2">
                  <img
                    alt="Chess pieces arranged on a board before the opening move."
                    className="h-52 w-full object-cover"
                    src="https://picsum.photos/seed/chessboard-opening/960/720"
                  />
                  <div className="space-y-2 px-5 py-5">
                    <div className="text-sm font-semibold tracking-[-0.02em] text-text">
                      Two engine styles
                    </div>
                    <p className="max-w-[28ch] text-sm leading-6 text-text-muted">
                      Switch between classic local search and a stronger UCI-backed opponent.
                    </p>
                  </div>
                </div>

                <div className="rounded-[28px] border border-border bg-surface px-5 py-5">
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
                    <DetailItem label="Current mode" value={modeSummaries[gameMode]} />
                    <DetailItem label="Engine path" value={currentEngine.sub} />
                    <DetailItem
                      label="White side"
                      value={
                        isCvC
                          ? whiteSummary
                          : color === "w"
                            ? "You open the game."
                            : "Engine opens the game."
                      }
                    />
                    <DetailItem
                      label="Black side"
                      value={
                        isCvC
                          ? blackSummary
                          : color === "b"
                            ? "You defend and counter."
                            : "Engine responds as Black."
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <section className="rounded-[28px] border border-border bg-surface px-6 py-6 sm:px-8 sm:py-8">
              <div className="grid gap-5 md:grid-cols-3">
                <div className="border-b border-border pb-4 md:border-r md:border-b-0 md:pr-5 md:pb-0">
                  <div className="text-sm font-semibold tracking-[-0.02em] text-text">
                    Fast setup
                  </div>
                  <p className="mt-2 max-w-[28ch] text-sm leading-6 text-text-muted">
                    Every configuration lives on one screen so you can start without digging through
                    menus.
                  </p>
                </div>
                <div className="border-b border-border pb-4 md:border-r md:border-b-0 md:pr-5 md:pb-0">
                  <div className="text-sm font-semibold tracking-[-0.02em] text-text">
                    Flexible matches
                  </div>
                  <p className="mt-2 max-w-[28ch] text-sm leading-6 text-text-muted">
                    Play solo, hand the board to a friend, or let both engines run a full game.
                  </p>
                </div>
                <div>
                  <div className="text-sm font-semibold tracking-[-0.02em] text-text">
                    Clear strength tiers
                  </div>
                  <p className="mt-2 max-w-[28ch] text-sm leading-6 text-text-muted">
                    Difficulty labels stay readable whether you care about depth or approximate Elo.
                  </p>
                </div>
              </div>
            </section>

            <section
              className="grid gap-6 rounded-[28px] border border-border bg-surface px-6 py-6 sm:px-8 sm:py-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"
              id="setup"
            >
              <div>
                <h2 className="text-2xl leading-tight font-semibold tracking-[-0.04em] text-text sm:text-3xl">
                  Match setup
                </h2>
                <p className="mt-3 max-w-[34ch] text-sm leading-6 text-text-muted sm:text-base">
                  Keep the content, lose the cramped card. This version spreads the choices into
                  clear sections and keeps the start action obvious.
                </p>
              </div>

              <div className="grid gap-8">
                <section className="grid gap-4">
                  <div className={sectionLabelClass}>Mode</div>
                  <div className="grid gap-3 lg:grid-cols-3">
                    {MODES.map((mode) => (
                      <OptionButton
                        key={mode.value}
                        selected={gameMode === mode.value}
                        onClick={() => setGameMode(mode.value)}
                        subtitle={mode.sub}
                        title={mode.label}
                      />
                    ))}
                  </div>
                </section>

                {!isMultiplayer && (
                  <section className="grid gap-4">
                    <div className={sectionLabelClass}>Engine</div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {ENGINES.map((engine) => (
                        <OptionButton
                          key={engine.value}
                          selected={engineVersion === engine.value}
                          onClick={() => setEngineVersion(engine.value)}
                          subtitle={engine.sub}
                          title={engine.label}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {!isCvC && (
                  <section className="grid gap-4">
                    <div className={sectionLabelClass}>Side</div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {COLORS.map((pieceColor) => (
                        <OptionButton
                          key={pieceColor.value}
                          selected={color === pieceColor.value}
                          onClick={() => setColor(pieceColor.value)}
                          subtitle={pieceColor.sub}
                          title={pieceColor.label}
                        >
                          <span
                            className="text-[32px] leading-none"
                            style={{
                              color:
                                pieceColor.value === "w" ? "var(--sq-light)" : "var(--sq-dark)",
                            }}
                          >
                            {pieceColor.symbol}
                          </span>
                        </OptionButton>
                      ))}
                    </div>
                  </section>
                )}

                {gameMode === "vs-computer" && (
                  <section className="grid gap-4">
                    <div className={sectionLabelClass}>Difficulty</div>
                    <DifficultyPicker
                      engineVersion={engineVersion}
                      onChange={setDifficulty}
                      selected={difficulty}
                    />
                  </section>
                )}

                {isCvC && (
                  <section className="grid gap-6">
                    <div className="grid gap-4">
                      <div className={sectionLabelClass}>White difficulty</div>
                      <DifficultyPicker
                        engineVersion={engineVersion}
                        onChange={setDifficulty}
                        selected={difficulty}
                      />
                    </div>
                    <div className="grid gap-4">
                      <div className={sectionLabelClass}>Black difficulty</div>
                      <DifficultyPicker
                        engineVersion={engineVersion}
                        onChange={setDifficultyBlack}
                        selected={difficultyBlack}
                      />
                    </div>
                  </section>
                )}
              </div>
            </section>
          </section>

          <aside className="rounded-[28px] border border-border bg-surface px-6 py-6 sm:px-8 sm:py-8 lg:sticky lg:top-6 lg:h-fit">
            <div>
              <p className={sectionLabelClass}>Ready to play</p>
              <h2 className="mt-3 text-2xl leading-tight font-semibold tracking-[-0.04em] text-text">
                Current match summary
              </h2>
              <p className="mt-3 max-w-[30ch] text-sm leading-6 text-text-muted">
                Review the setup before you launch. The selected route stays the same as the current
                app flow.
              </p>
            </div>

            <div className="mt-8 space-y-5">
              <DetailItem
                label="Mode"
                value={MODES.find((mode) => mode.value === gameMode)?.label ?? ""}
              />
              <DetailItem
                label="Engine"
                value={isMultiplayer ? "No engine needed for pass and play." : currentEngine.label}
              />
              {!isCvC && (
                <DetailItem
                  label="Side"
                  value={COLORS.find((pieceColor) => pieceColor.value === color)?.label ?? ""}
                />
              )}
              {gameMode === "vs-computer" && (
                <DetailItem
                  label="Difficulty"
                  value={engineVersion === "v2" ? SKILL_DESCS[difficulty] : DEPTH_DESCS[difficulty]}
                />
              )}
              {isCvC && <DetailItem label="White engine" value={whiteSummary} />}
              {isCvC && <DetailItem label="Black engine" value={blackSummary} />}
            </div>

            <button
              className="mt-8 w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-bg transition-opacity duration-200 hover:opacity-90 active:scale-[0.98]"
              onClick={handleStart}
              type="button"
            >
              Start game
            </button>
          </aside>
        </main>
      </div>
    </div>
  );
}
