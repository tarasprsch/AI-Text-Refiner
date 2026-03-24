import './ResultPanel.css'
import { useState } from 'react'
import type { TextOption } from '../../../hooks/useTextRefinement'

interface Props {
  options: TextOption[]
  explanation?: string
}

export function ResultPanel({ options, explanation }: Props) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <section className="result-panel">
      <div className="result-panel__header">
        <h3 className="result-panel__title">Options</h3>
      </div>
      <div className="result-panel__options">
        {options.map((option, i) => (
          <div key={i} className="option-card">
            <div className="option-card__header">
              <span className="option-card__label">{option.label}</span>
              <button
                onClick={() => handleCopy(option.correctedText, i)}
                className="option-card__copy-btn"
              >
                {copiedIndex === i ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <div className="option-card__text">{option.correctedText}</div>
          </div>
        ))}
      </div>
      {explanation && (
        <details className="result-panel__explanation">
          <summary>What changed?</summary>
          <p>{explanation}</p>
        </details>
      )}
    </section>
  )
}
