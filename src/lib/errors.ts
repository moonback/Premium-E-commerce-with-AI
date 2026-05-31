export function getErrorMessage(error: unknown, fallback = 'Erreur inconnue') {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.length > 0) return message;
  }
  if (typeof error === 'string' && error.length > 0) return error;
  return fallback;
}
