/** True only when a non-empty secret matches the Bearer header Vercel sends. */
export function cronAuthorised(header: string | null, secret: string | undefined): boolean {
  if (!secret) return false;
  return header === `Bearer ${secret}`;
}
