import type { Difficulty, PieceColor } from '../types'
import styles from './SetupScreen.module.css'

interface SetupScreenProps {
  onStart: (color: PieceColor, difficulty: Difficulty) => void
}

const COLORS: { value: PieceColor; label: string; symbol: string }[] = [
  { value: 'w', label: 'White', symbol: '♔' },
  { value: 'b', label: 'Black', symbol: '♚' },
]

const DIFFICULTIES: { value: Difficulty; label: string; desc: string }[] = [
  { value: 'easy',   label: 'Easy',   desc: 'Depth 1' },
  { value: 'medium', label: 'Medium', desc: 'Depth 3' },
  { value: 'hard',   label: 'Hard',   desc: 'Depth 5' },
]

import { useState } from 'react'

export function SetupScreen({ onStart }: SetupScreenProps) {
  const [color, setColor] = useState<PieceColor>('w')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.logo}>♟</div>
        <h1 className={styles.title}>Chess</h1>
        <p className={styles.subtitle}>Player vs Computer</p>

        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>Play as</h2>
          <div className={styles.options}>
            {COLORS.map(c => (
              <button
                key={c.value}
                className={`${styles.optionBtn} ${color === c.value ? styles.active : ''}`}
                onClick={() => setColor(c.value)}
              >
                <span className={styles.symbol}>{c.symbol}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>Difficulty</h2>
          <div className={styles.options}>
            {DIFFICULTIES.map(d => (
              <button
                key={d.value}
                className={`${styles.optionBtn} ${difficulty === d.value ? styles.active : ''}`}
                onClick={() => setDifficulty(d.value)}
              >
                <span className={styles.diffLabel}>{d.label}</span>
                <span className={styles.diffDesc}>{d.desc}</span>
              </button>
            ))}
          </div>
        </section>

        <button
          className={styles.startBtn}
          onClick={() => onStart(color, difficulty)}
        >
          Start Game
        </button>
      </div>
    </div>
  )
}
