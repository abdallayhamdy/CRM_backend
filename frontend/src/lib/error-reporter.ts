/** Safely extract an error message from an unknown catch value. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'An unexpected error occurred';
}

export function reportError(context: string, error: unknown) {
  const message = getErrorMessage(error);
  console.error(`[${context}]`, message);
}
