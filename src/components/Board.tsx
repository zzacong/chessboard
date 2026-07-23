import type { Square } from 'chess.js'
import { Chess } from 'chess.js'
import type { LastMove, PieceColor } from '../types'
import { getPieceComponent } from './pieces'
import styles from './Board.module.css'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const

interface BoardProps {
  fen: string
  selectedSquare: Square | null
  legalMoveSquares: Square[]
  lastMove: LastMove | null
  playerColor: PieceColor
  isComputerThinking: boolean
  onSquareClick: (sq: Square) => void
}

// Build ordered square names for the board (rank 8→1 for white, rank 1→8 for black)
function buildSquares(flipped: boolean): Square[] {
  const squares: Square[] = []
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const fileIdx = flipped ? 7 - col : col
      const rankIdx = flipped ? row : 7 - row
      squares.push(`${FILES[fileIdx]}${rankIdx + 1}` as Square)
    }
  }
  return squares
}

export function Board({
  fen,
  selectedSquare,
  legalMoveSquares,
  lastMove,
  playerColor,
  isComputerThinking,
  onSquareClick,
}: BoardProps) {
  const game = new Chess(fen)
  const flipped = playerColor === 'b'
  const squares = buildSquares(flipped)

  // Build file/rank labels
  const fileLabels = flipped
    ? [...FILES].reverse()
    : [...FILES]
  const rankLabels = flipped
    ? ['1', '2', '3', '4', '5', '6', '7', '8']
    : ['8', '7', '6', '5', '4', '3', '2', '1']

  return (
    <div className={`${styles.boardWrapper} ${isComputerThinking ? styles.thinking : ''}`}>
      {/* Rank labels left */}
      <div className={styles.rankLabels}>
        {rankLabels.map(r => (
          <span key={r} className={styles.label}>{r}</span>
        ))}
      </div>

      <div className={styles.boardInner}>
        <div className={styles.grid}>
          {squares.map((sq, i) => {
            const fileIdx = i % 8
            const rankIdx = Math.floor(i / 8)
            const isLight = (fileIdx + rankIdx) % 2 === 0
            const piece = game.get(sq)
            const isSelected = sq === selectedSquare
            const isLegal = legalMoveSquares.includes(sq)
            const isCapture = isLegal && !!piece
            const isLastFrom = lastMove?.from === sq
            const isLastTo = lastMove?.to === sq
            const isKingInCheck =
              piece &&
              piece.type === 'k' &&
              piece.color === game.turn() &&
              game.isCheck()

            const PieceComp = piece ? getPieceComponent(piece.color, piece.type) : null

            const classNames = [
              styles.square,
              isLight ? styles.light : styles.dark,
              isSelected ? styles.selected : '',
              isLastFrom || isLastTo ? styles.lastMove : '',
              isKingInCheck ? styles.inCheck : '',
            ].filter(Boolean).join(' ')

            return (
              <div
                key={sq}
                className={classNames}
                onClick={() => onSquareClick(sq)}
                role="button"
                aria-label={sq}
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && onSquareClick(sq)}
              >
                {isLegal && (
                  <div className={isCapture ? styles.legalRing : styles.legalDot} />
                )}
                {PieceComp && (
                  <div className={styles.piece}>
                    <PieceComp size={44} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* File labels bottom */}
        <div className={styles.fileLabels}>
          {fileLabels.map(f => (
            <span key={f} className={styles.label}>{f}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
