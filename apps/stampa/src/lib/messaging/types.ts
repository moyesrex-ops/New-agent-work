/**
 * Outbound messaging (tickets N-01, N-02).
 *
 * Two channels, one interface. WhatsApp is where the market lives; SMS is
 * behind it because template rejections and number bans are common enough that
 * the architecture review named "never make WhatsApp the only path to a
 * notification" as a condition of using it at all.
 */

export type Channel = "whatsapp" | "sms" | "voice";

export type OutboundMessage = {
  /** E.164. */
  to: string;
  /**
   * The approved WhatsApp template name. SMS ignores it, but every message
   * carries one so a support question — "which message did they get?" — has a
   * one-word answer.
   */
  template: string;
  body: string;
  /** Deep link appended by the sender, never concatenated into `body`. */
  link?: string;
  /** Plaintext OTP, for voice and authentication templates only. */
  code?: string;
};

export type SendResult =
  | { ok: true; channel: Channel; providerId: string }
  | { ok: false; channel: Channel; problem: string; retryable: boolean };

export interface Messenger {
  readonly channel: Channel;
  send(message: OutboundMessage): Promise<SendResult>;
}

export type Email = { to: string; subject: string; body: string };

/**
 * Email exists for exactly one job in v1 — the buyer's sign-in link. Suppliers
 * have no email column at all, by design (Architecture §16.5).
 */
export interface Mailer {
  send(email: Email): Promise<{ ok: boolean; problem?: string }>;
}
