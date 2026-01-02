export function isNextRedirectError(err: any) {
  return !!(
    err &&
    ((err.digest && String(err.digest).startsWith('NEXT_REDIRECT')) || err.message === 'NEXT_REDIRECT')
  )
}
