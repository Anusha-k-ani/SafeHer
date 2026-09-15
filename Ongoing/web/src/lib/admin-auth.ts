export const ADMIN_COOKIE = "safeher_admin";

export function getAdminPassword(): string | null {
  const pw = process.env.ADMIN_PASSWORD?.trim();
  return pw ? pw : null;
}

/**
 * Opaque session value set on the cookie after a successful password check.
 * Prefer ADMIN_SESSION_TOKEN; otherwise fall back to a derived value from the password.
 */
export function getAdminSessionToken(): string | null {
  const explicit = process.env.ADMIN_SESSION_TOKEN?.trim();
  if (explicit) return explicit;
  const password = getAdminPassword();
  if (!password) return null;
  return `session:${password}`;
}

export function passwordsMatch(input: string | undefined | null): boolean {
  const expected = getAdminPassword();
  if (!expected || input == null) return false;
  return input.trim() === expected;
}
