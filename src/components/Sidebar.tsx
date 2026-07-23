import { useEffect, useRef } from 'react'
import type { CapturedPieces, PieceColor, PieceType } from '../types'
import { getPieceComponent } from './pieces'
import styles from './Sidebar.module.css'

interface SidebarProps {
  history: string[]
  capturedPieces: CapturedPieces
  playerColor: PieceColor
  isComputerThinking: boolean
}

const PIECE_VALUES_DISPLAY: Record<PieceType, number> = {
  q: 9, r: 5, b: 3, n: 3, p: 1, k: 0,
}

function materialScore(pieces: PieceType[]): number {
  return pieces.reduce((sum, p) => sum + (PIECE_VALUES_DISPLAY[p] ?? 0), 0)
}

function sortedCaptured(pieces: PieceType[]): PieceType[] {
  return [...pieces].sort(
    (a, b) => (PIECE_VALUES_DISPLAY[b] ?? 0) - (PIECE_VALUES_DISPLAY[a] ?? 0),
  )
}

function CapturedRow({ pieces, color, label }: { pieces: PieceType[]; color: PieceColor; label: string }) {
  const sorted = sortedCaptured(pieces)
  return (
    <div className={styles.capturedRow}>
      <span className={styles.capturedLabel}>{label}</span>
      <div className={styles.capturedPieces}>
        {sorted.map((p, i) => {
          const Comp = getPieceComponent(color, p)
          return Comp ? <Comp key={i} size={22} /> : null
        })}
        {pieces.length === 0 && <span className={styles.none}>—</span>}
      </div>
    </div>
  )
}

export function Sidebar({ history, capturedPieces, playerColor, isComputerThinking }: SidebarProps) {
  const historyEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to latest move
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  // Pair moves into [white, black?] groups
  const paired: Array<[string, string?]> = []
  for (let i = 0; i < history.length; i += 2) {
    paired.push([history[i], history[i + 1]])
  }

  const computerColor: PieceColor = playerColor === 'w' ? 'b' : 'w'

  // Material diff
  const playerScore = materialScore(capturedPieces[playerColor])
  const computerScore = materialScore(capturedPieces[computerColor])
  const diff = playerScore - computerScore

  return (
    <div className={styles.sidebar}>
      {/* Captured pieces */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Captured</h3>
        <CapturedRow
          pieces={capturedPieces[playerColor]}
          color={computerColor}
          label="You"
        />
        <CapturedRow
          pieces={capturedPieces[computerColor]}
          color={playerColor}
          label="CPU"
        />
        {diff !== 0 && (
          <div className={styles.materialDiff}>
            {diff > 0 ? `+${diff}` : diff} material
          </div>
        )}
      </section>

      {/* Move history */}
      <section className={`${styles.section} ${styles.historySection}`}>
        <h3 className={styles.sectionTitle}>Moves</h3>
        <div className={styles.historyList}>
          {paired.length === 0 && (
            <span className={styles.none}>No moves yet</span>
          )}
          {paired.map(([white, black], idx) => (
            <div key={idx} className={styles.movePair}>
              <span className={styles.moveNum}>{idx + 1}.</span>
              <span className={`${styles.move} ${styles.whiteMove}`}>{white}</span>
              {black && <span className={`${styles.move} ${styles.blackMove}`}>{black}</span>}
            </div>
          ))}
          {isComputerThinking && (
            <div className={styles.thinking}>
              <span className={styles.thinkingDots}>CPU thinking…</span>
            </div>
          )}
          <div ref={historyEndRef} />
        </div>
      </section>
    </div>
  )
}
