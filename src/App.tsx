import { useState } from "react";
import { useChessGame } from "./hooks/useChessGame";
import { SetupScreen } from "./components/SetupScreen";
import { Board } from "./components/Board";
import { Sidebar } from "./components/Sidebar";
import { StatusBar } from "./components/StatusBar";
import type { Difficulty, PieceColor } from "./types";

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
      className="min-h-screen flex flex-col"
      style={{
        background: "var(--color-bg)",
        backgroundImage:
          "radial-gradient(ellipse 60% 50% at 20% 20%, rgba(30,45,82,0.4) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 80% 80%, rgba(233,69,96,0.06) 0%, transparent 60%)",
      }}
    >
      <header
        className="flex items-center justify-between px-6 h-[52px] sticky top-0 z-10 backdrop-blur-sm"
        style={{ borderBottom: "1px solid var(--color-border)", background: "rgba(22,33,62,0.8)" }}
      >
        <span
          className="text-[17px] font-bold tracking-tight flex items-center gap-2"
          style={{ color: "var(--color-text)" }}
        >
          {/* accent dot */}
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: "var(--color-accent)", boxShadow: "0 0 8px var(--color-accent)" }}
          />
          Chess
        </span>
      </header>

      <main className="flex-1 flex items-start justify-center px-5 pt-7 pb-10">
        <div className="flex items-start gap-5 max-sm:flex-col max-sm:items-center max-sm:w-full">
          <div className="flex flex-col gap-3 items-start max-sm:items-center max-sm:w-full">
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
