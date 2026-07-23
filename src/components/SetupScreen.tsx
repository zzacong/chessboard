import { useState } from "react";

import type { Difficulty, GameMode, PieceColor } from "../types";

interface SetupScreenProps {
  onStart: (color: PieceColor, difficulty: Difficulty, mode: GameMode) => void;
}

const MODES: { value: GameMode; label: string; icon: string }[] = [
  { value: "vs-computer", label: "vs Computer", icon: "🤖" },
  { value: "multiplayer", label: "Local 2 Player", icon: "👥" },
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

export function SetupScreen({ onStart }: SetupScreenProps) {
  const [gameMode, setGameMode] = useState<GameMode>("vs-computer");
  const [color, setColor] = useState<PieceColor>("w");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  return (
    <div
      className="flex min-h-screen items-center justify-center p-6"
      style={{ background: "var(--color-bg)" }}
    >
      <div
        className="w-full max-w-[420px] rounded-[20px] px-9 py-10 text-center"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div className="mb-2 text-[56px] leading-none">♟</div>
        <h1
          className="mb-6 text-[32px] font-bold tracking-tight"
          style={{ color: "var(--color-text)" }}
        >
          Chess
        </h1>

        {/* Game Mode */}
        <section className="mb-7 text-left">
          <h2
            className="mb-2.5 text-[11px] font-bold tracking-[0.08em] uppercase"
            style={{ color: "var(--color-text-muted)" }}
          >
            Game Mode
          </h2>
          <div className="flex gap-2.5">
            {MODES.map((m) => (
              <button
                key={m.value}
                className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border-2 px-2.5 py-3.5 text-sm font-medium transition-[border-color,background] duration-150"
                style={
                  gameMode === m.value
                    ? {
                        borderColor: "var(--color-accent)",
                        background: "rgba(233,69,96,0.1)",
                        color: "#fff",
                      }
                    : {
                        borderColor: "var(--color-border)",
                        background: "var(--color-bg)",
                        color: "var(--color-text)",
                      }
                }
                onClick={() => setGameMode(m.value)}
              >
                <span className="text-[28px] leading-none">{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Play as */}
        <section className="mb-7 text-left">
          <h2
            className="mb-2.5 text-[11px] font-bold tracking-[0.08em] uppercase"
            style={{ color: "var(--color-text-muted)" }}
          >
            Play as
          </h2>
          <div className="flex gap-2.5">
            {COLORS.map((c) => (
              <button
                key={c.value}
                className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border-2 px-2.5 py-3.5 text-sm font-medium transition-[border-color,background] duration-150"
                style={
                  color === c.value
                    ? {
                        borderColor: "var(--color-accent)",
                        background: "rgba(233,69,96,0.1)",
                        color: "#fff",
                      }
                    : {
                        borderColor: "var(--color-border)",
                        background: "var(--color-bg)",
                        color: "var(--color-text)",
                      }
                }
                onClick={() => setColor(c.value)}
              >
                <span className="text-[28px] leading-none">{c.symbol}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Difficulty — only in vs-computer mode */}
        {gameMode === "vs-computer" && (
          <section className="mb-7 text-left">
            <h2
              className="mb-2.5 text-[11px] font-bold tracking-[0.08em] uppercase"
              style={{ color: "var(--color-text-muted)" }}
            >
              Difficulty
            </h2>
            <div className="flex gap-2.5">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border-2 px-2.5 py-3.5 transition-[border-color,background] duration-150"
                  style={
                    difficulty === d.value
                      ? {
                          borderColor: "var(--color-accent)",
                          background: "rgba(233,69,96,0.1)",
                          color: "#fff",
                        }
                      : {
                          borderColor: "var(--color-border)",
                          background: "var(--color-bg)",
                          color: "var(--color-text)",
                        }
                  }
                  onClick={() => setDifficulty(d.value)}
                >
                  <span className="text-sm font-semibold">{d.label}</span>
                  <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                    {d.desc}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <button
          className="mt-1 w-full rounded-xl py-3.5 text-base font-bold tracking-wide text-white transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98]"
          style={{ background: "var(--color-accent)", border: "none" }}
          onClick={() => onStart(color, difficulty, gameMode)}
        >
          Start Game
        </button>
      </div>
    </div>
  );
}
