import { useState } from 'react'
import { useChessGame } from './hooks/useChessGame'
import { SetupScreen } from './components/SetupScreen'
import { Board } from './components/Board'
import { Sidebar } from './components/Sidebar'
import { StatusBar } from './components/StatusBar'
import type { Difficulty, PieceColor } from './types'
import styles from './App.module.css'

export default function App() {
  const [gameStarted, setGameStarted] = useState(false)

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
  } = useChessGame()

  function handleStart(color: PieceColor, diff: Difficulty) {
    resetGame(color, diff)
    setGameStarted(true)
  }

  function handleNewGame() {
    setGameStarted(false)
  }

  if (!gameStarted) {
    return <SetupScreen onStart={handleStart} />
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <span className={styles.logo}>Chess</span>
      </header>

      <main className={styles.main}>
        <div className={styles.gameArea}>
          <div className={styles.boardColumn}>
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
  )
}
