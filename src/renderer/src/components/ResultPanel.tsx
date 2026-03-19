import { useState } from 'react'
import type { TextOption } from '../hooks/useTextRefinement'

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
      <div className="result-header">
        <h3>Options</h3>
      </div>
      <div className="options-list">
        {options.map((option, i) => (
          <div key={i} className="option-card">
            <div className="option-card-header">
              <span className="option-label">{option.label}</span>
              <button
                onClick={() => handleCopy(option.correctedText, i)}
                className="btn-copy"
              >
                {copiedIndex === i ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <div className="result-text">{option.correctedText}</div>
          </div>
        ))}
      </div>
      {explanation && (
        <details className="result-explanation">
          <summary>What changed?</summary>
          <p>{explanation}</p>
        </details>
      )}
    </section>
  )
}
