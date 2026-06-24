import { useState } from 'react'
import type { RefinementError } from '../hooks/useTextRefinement'

interface Props {
  error: RefinementError
}

export function ErrorMessage({ error }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasDetail = Boolean(error.details)

  return (
    <div className="main-view__error" role="alert">
      <div className="main-view__error-header">
        <span className="main-view__error-message">{error.text}</span>
        {hasDetail && (
          <button
            type="button"
            className="main-view__error-toggle"
            onClick={() => setIsExpanded((current) => !current)}
            aria-expanded={isExpanded}
          >
            {isExpanded ? 'Hide details' : 'Show details'}
          </button>
        )}
      </div>
      {hasDetail && isExpanded && <pre className="main-view__error-detail">{error.details}</pre>}
    </div>
  )
}
