import { describe, it, expect } from 'vitest'
import { resolveErrorMessage } from '../resolveErrorMessage'
import { ApiError } from '../apiClient'
import { ERROR_CODE_MESSAGES, ERROR_MESSAGES } from '../../constants/errorMessages'
import { ERROR_CODES } from '../../constants/errorCodes'

describe('resolveErrorMessage', () => {
  it('maps a known backend code to its Hebrew message', () => {
    const err = new ApiError(409, 'A user with this email already exists', ERROR_CODES.USER_EMAIL_EXISTS)
    expect(resolveErrorMessage(err)).toBe(ERROR_CODE_MESSAGES[ERROR_CODES.USER_EMAIL_EXISTS])
  })

  it('falls back to the server message when the code is unknown', () => {
    const err = new ApiError(400, 'custom server message', 'SOME_UNMAPPED_CODE')
    expect(resolveErrorMessage(err)).toBe('custom server message')
  })

  it('falls back to GENERIC for an ApiError without code or message', () => {
    const err = new ApiError(400, '')
    expect(resolveErrorMessage(err)).toBe(ERROR_MESSAGES.GENERIC)
  })

  it('returns the network message for a TypeError', () => {
    expect(resolveErrorMessage(new TypeError('Failed to fetch'))).toBe(
      ERROR_MESSAGES.NETWORK_ERROR
    )
  })

  it('returns GENERIC for an unknown error shape', () => {
    expect(resolveErrorMessage('weird')).toBe(ERROR_MESSAGES.GENERIC)
  })
})
