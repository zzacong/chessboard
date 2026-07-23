import { useState } from "react";

import type { Difficulty, PieceColor } from "./types";

import { Board } from "./components/Board";
import { SetupScreen } from "./components/SetupScreen";
import { Sidebar } from "./components/Sidebar";
import { StatusBar } from "./components/StatusBar";
import { useChessGame } from "./hooks/useChessGame";

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);

  const {
    fen,
    turn,
    selectedSquare,
    legalMoveSquares,
    lastMove,
    status,
    history,
    capturedPieces,
    playerColor,
    difficulty,
    isComputerThinking,
    selectSquare,
    resetGame,
  } = useChessGame();

  function handleStart(color: PieceColor, diff: Difficulty) {
    resetGame(color, diff);
    setGameStarted(true);
  }

  function handleNewGame() {
    setGameStarted(false);
  }

  if (!gameStarted) {
    return <SetupScreen onStart={handleStart} />;
  }

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        background: "var(--color-bg)",
        backgroundImage:
          "radial-gradient(ellipse 60% 50% at 20% 20%, rgba(30,45,82,0.4) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 80% 80%, rgba(233,69,96,0.06) 0%, transparent 60%)",
      }}
    >
      <header
        className="sticky top-0 z-10 flex h-[52px] items-center justify-between px-6 backdrop-blur-sm"
        style={{ borderBottom: "1px solid var(--color-border)", background: "rgba(22,33,62,0.8)" }}
      >
        <span
          className="flex items-center gap-2 text-[17px] font-bold tracking-tight"
          style={{ color: "var(--color-text)" }}
        >
          {/* accent dot */}
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: "var(--color-accent)", boxShadow: "0 0 8px var(--color-accent)" }}
          />
          Chess
        </span>
      </header>

      <main className="flex flex-1 items-start justify-center px-5 pt-7 pb-10">
        <div className="flex items-start gap-5 max-sm:w-full max-sm:flex-col max-sm:items-center">
          <div className="flex flex-col items-start gap-3 max-sm:w-full max-sm:items-center">
            <StatusBar
              status={status}
              turn={turn}
              playerColor={playerColor}
              difficulty={difficulty}
              isComputerThinking={isComputerThinking}
              onNewGame={handleNewGame}
            />
            <Board
              fen={fen}
              selectedSquare={selectedSquare}
              legalMoveSquares={legalMoveSquares}
              lastMove={lastMove}
              playerColor={playerColor}
              isComputerThinking={isComputerThinking}
              onSquareClick={selectSquare}
            />
          </div>

          <Sidebar
            history={history}
            capturedPieces={capturedPieces}
            playerColor={playerColor}
            isComputerThinking={isComputerThinking}
          />
        </div>
      </main>
    </div>
  );
}
