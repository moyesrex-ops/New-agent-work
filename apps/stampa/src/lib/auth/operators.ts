import "server-only";
import { env } from "../env";

/**
 * Who may open the operator console.
 *
 * A list in the environment rather than a table, deliberately. In month one
 * the operators are the two founders; a roles table would be a database
 * migration standing in for a decision that is actually made by whoever can
 * deploy. When the support team is bigger than the deploy team, this becomes a
 * table — and the session, policy and audit layers around it do not change.
 */
export function operatorEmails(): string[] {
  return env().STAMPA_OPERATORS;
}

export function isOperator(email: string): boolean {
  return operatorEmails().includes(email.trim().toLowerCase());
}
