import { useState } from 'react'
import type { Difficulty, PieceColor } from '../types'

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

export function SetupScreen({ onStart }: SetupScreenProps) {
  const [color, setColor] = useState<PieceColor>('w')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--color-bg)' }}
    >
      <div
        className="w-full max-w-[420px] text-center rounded-[20px] px-9 py-10"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div className="text-[56px] leading-none mb-2">♟</div>
        <h1 className="text-[32px] font-bold tracking-tight mb-1" style={{ color: 'var(--color-text)' }}>Chess</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>Player vs Computer</p>

        {/* Play as */}
        <section className="mb-7 text-left">
          <h2
            className="text-[11px] font-bold uppercase tracking-[0.08em] mb-2.5"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Play as
          </h2>
          <div className="flex gap-2.5">
            {COLORS.map(c => (
              <button
                key={c.value}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3.5 px-2.5 text-sm font-medium rounded-xl border-2 transition-[border-color,background] duration-150${
                  color === c.value
                    ? ' text-white'
                    : ''
                }`}
                style={
                  color === c.value
                    ? { borderColor: 'var(--color-accent)', background: 'rgba(233,69,96,0.1)', color: '#fff' }
                    : { borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }
                }
                onClick={() => setColor(c.value)}
              >
                <span className="text-[28px] leading-none">{c.symbol}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Difficulty */}
        <section className="mb-7 text-left">
          <h2
            className="text-[11px] font-bold uppercase tracking-[0.08em] mb-2.5"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Difficulty
          </h2>
          <div className="flex gap-2.5">
            {DIFFICULTIES.map(d => (
              <button
                key={d.value}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-3.5 px-2.5 rounded-xl border-2 transition-[border-color,background] duration-150"
                style={
                  difficulty === d.value
                    ? { borderColor: 'var(--color-accent)', background: 'rgba(233,69,96,0.1)', color: '#fff' }
                    : { borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }
                }
                onClick={() => setDifficulty(d.value)}
              >
                <span className="text-sm font-semibold">{d.label}</span>
                <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{d.desc}</span>
              </button>
            ))}
          </div>
        </section>

        <button
          className="w-full py-3.5 rounded-xl text-base font-bold tracking-wide text-white mt-1 transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'var(--color-accent)', border: 'none' }}
          onClick={() => onStart(color, difficulty)}
        >
          Start Game
        </button>
      </div>
    </div>
  )
}
