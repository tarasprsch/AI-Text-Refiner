// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ErrorMessage } from './ErrorMessage'

describe('ErrorMessage', () => {
  it('renders the error message', () => {
    render(<ErrorMessage error={{ text: 'Something went wrong' }} />)

    expect(screen.getByText('Something went wrong').textContent).toBe('Something went wrong')
  })

  it('toggles detail text when detail is provided', () => {
    const detail = 'Gemini said:\nnot json'
    render(<ErrorMessage error={{ text: 'Unexpected format', details: detail }} />)

    expect(screen.queryByText(detail)).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Show details' }))
    expect(screen.getByText(detail).textContent).toBe(detail)

    fireEvent.click(screen.getByRole('button', { name: 'Hide details' }))
    expect(screen.queryByText(detail)).toBeNull()
  })

  it('does not render a toggle when detail is missing', () => {
    render(<ErrorMessage error={{ text: 'API Error' }} />)

    expect(screen.queryByRole('button')).toBeNull()
  })
})
