import type { Difficulty, GameStatus, PieceColor } from '../types'
import styles from './StatusBar.module.css'

interface StatusBarProps {
  status: GameStatus
  turn: PieceColor
  playerColor: PieceColor
  difficulty: Difficulty
  isComputerThinking: boolean
  onNewGame: () => void
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

function statusMessage(
  status: GameStatus,
  turn: PieceColor,
  playerColor: PieceColor,
  isComputerThinking: boolean,
): { text: string; type: 'normal' | 'warning' | 'danger' | 'success' } {
  if (status === 'checkmate') {
    const winner = turn === 'w' ? 'b' : 'w' // the one who just moved
    return winner === playerColor
      ? { text: 'Checkmate — You win! 🎉', type: 'success' }
      : { text: 'Checkmate — Computer wins', type: 'danger' }
  }
  if (status === 'stalemate') return { text: 'Stalemate — Draw', type: 'warning' }
  if (status === 'draw') return { text: 'Draw', type: 'warning' }
  if (status === 'check') {
    return turn === playerColor
      ? { text: 'Check — Your king is in danger!', type: 'danger' }
      : { text: 'Check!', type: 'warning' }
  }
  if (isComputerThinking) return { text: 'Computer is thinking…', type: 'normal' }
  return turn === playerColor
    ? { text: 'Your turn', type: 'normal' }
    : { text: "Computer's turn", type: 'normal' }
}

export function StatusBar({
  status,
  turn,
  playerColor,
  difficulty,
  isComputerThinking,
  onNewGame,
}: StatusBarProps) {
  const msg = statusMessage(status, turn, playerColor, isComputerThinking)
  const isOver = status === 'checkmate' || status === 'stalemate' || status === 'draw'

  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        <div className={`${styles.indicator} ${styles[msg.type]}`} />
        <span className={`${styles.message} ${styles[msg.type]}`}>{msg.text}</span>
      </div>
      <div className={styles.right}>
        <span className={styles.meta}>
          {playerColor === 'w' ? '♔ White' : '♚ Black'} · {DIFFICULTY_LABELS[difficulty]}
        </span>
        <button
          className={`${styles.newGameBtn} ${isOver ? styles.pulse : ''}`}
          onClick={onNewGame}
        >
          New Game
        </button>
      </div>
    </div>
  )
}
