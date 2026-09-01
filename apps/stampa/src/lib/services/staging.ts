import "server-only";
import { randomToken } from "../ids";

/**
 * Short-lived, in-process holding area for an uploaded vendor master (ticket
 * B-01).
 *
 * The requirement is that we never become the custodian of a corporate's
 * complete supplier database, so the uploaded file is never written to disk
 * and never written to Postgres. It is parsed into cells, held in memory for
 * long enough for the buyer to correct the column mapping, and dropped —
 * either when they confirm, or when the clock runs out.
 *
 * In-process is adequate because v1 runs as one Next process on one Lagos VM
 * (Architecture §16.9). The day a second instance appears, this becomes a
 * Redis key with the same TTL, and nothing else about the flow changes.
 */

export const STAGING_TTL_MS = 20 * 60 * 1000;
const MAX_STAGED = 20;

type Staged = {
  organisationId: string;
  filename: string;
  csv: string;
  expiresAt: number;
};

const staged = new Map<string, Staged>();

function sweep(now: number): void {
  for (const [key, value] of staged) {
    if (value.expiresAt <= now) staged.delete(key);
  }
}

export function stageUpload(
  organisationId: string,
  filename: string,
  csv: string,
  now: number = Date.now(),
): string {
  sweep(now);
  // A hard cap so a stuck buyer cannot fill the VM's memory with spreadsheets.
  if (staged.size >= MAX_STAGED) {
    const oldest = [...staged.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt)[0];
    if (oldest) staged.delete(oldest[0]);
  }

  const token = randomToken(18);
  staged.set(token, { organisationId, filename, csv, expiresAt: now + STAGING_TTL_MS });
  return token;
}

export function readUpload(
  token: string,
  organisationId: string,
  now: number = Date.now(),
): Staged | null {
  sweep(now);
  const value = staged.get(token);
  // Scoped to the organisation, so a token leaked between two buyers is inert.
  if (!value || value.organisationId !== organisationId) return null;
  return value;
}

export function dropUpload(token: string): void {
  staged.delete(token);
}
