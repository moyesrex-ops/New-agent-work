import { createHash } from "node:crypto";
import type { Messenger, OutboundMessage, SendResult, Channel } from "./types";

/**
 * Deterministic messenger for development and tests.
 *
 * It records what it sent so a test can assert on the exact words a supplier
 * receives, and it can be told to fail so the WhatsApp → SMS fallback is
 * exercised rather than assumed. Failure is scripted by phone number, the same
 * convention `FakeGateway` uses, so a fixture reads the same way in both.
 */
export class FakeMessenger implements Messenger {
  readonly sent: OutboundMessage[] = [];

  constructor(
    readonly channel: Channel,
    /** Numbers this channel refuses. Used to prove the fallback works. */
    private readonly refuses: readonly string[] = [],
  ) {}

  async send(message: OutboundMessage): Promise<SendResult> {
    if (this.refuses.includes(message.to)) {
      return {
        ok: false,
        channel: this.channel,
        problem: `${this.channel} rejected this number`,
        retryable: false,
      };
    }
    this.sent.push(message);
    const providerId = createHash("sha256")
      .update(`${this.channel}:${message.to}:${message.template}:${this.sent.length}`)
      .digest("hex")
      .slice(0, 16);
    return { ok: true, channel: this.channel, providerId };
  }

  clear(): void {
    this.sent.length = 0;
  }
}
