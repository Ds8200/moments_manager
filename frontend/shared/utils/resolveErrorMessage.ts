import { ApiError } from './apiClient'
import { ERROR_CODE_MESSAGES, ERROR_MESSAGES } from '../constants/errorMessages'

// Turns any thrown error into a clear Hebrew message for display.
// Priority: mapped message for the backend `code` → server-provided message → generic.
export const resolveErrorMessage = (err: unknown): string => {
  if (err instanceof ApiError) {
    if (err.code && ERROR_CODE_MESSAGES[err.code]) {
      return ERROR_CODE_MESSAGES[err.code]
    }
    return err.message || ERROR_MESSAGES.GENERIC
  }

  // A native fetch failure (no response) surfaces as TypeError — treat as a network problem.
  if (err instanceof TypeError) {
    return ERROR_MESSAGES.NETWORK_ERROR
  }

  return ERROR_MESSAGES.GENERIC
}
