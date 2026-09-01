/**
 * Real mailers for buyer magic links. Suppliers have no email column.
 *
 * Order: AgentMail (the company inbox), Resend, SMTP-via-HTTPS not implemented,
 * then a hard failure. FakeMailer is tests and local only.
 */
import type { Email, Mailer } from "./types";

type FetchLike = typeof fetch;

export class AgentMailer implements Mailer {
  constructor(
    private readonly options: {
      apiKey: string;
      inboxId: string;
      fetch?: FetchLike;
    },
  ) {}

  async send(email: Email): Promise<{ ok: boolean; problem?: string }> {
    const fetchFn = this.options.fetch ?? fetch;
    const inbox = encodeURIComponent(this.options.inboxId);
    try {
      const response = await fetchFn(`https://api.agentmail.to/v0/inboxes/${inbox}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: [email.to],
          subject: email.subject,
          text: email.body,
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) {
        return { ok: false, problem: `AgentMail ${response.status}` };
      }
      return { ok: true };
    } catch {
      return { ok: false, problem: "AgentMail did not respond" };
    }
  }
}

export class ResendMailer implements Mailer {
  constructor(
    private readonly options: {
      apiKey: string;
      from: string;
      fetch?: FetchLike;
    },
  ) {}

  async send(email: Email): Promise<{ ok: boolean; problem?: string }> {
    const fetchFn = this.options.fetch ?? fetch;
    try {
      const response = await fetchFn("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.options.from,
          to: [email.to],
          subject: email.subject,
          text: email.body,
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) return { ok: false, problem: `Resend ${response.status}` };
      return { ok: true };
    } catch {
      return { ok: false, problem: "Resend did not respond" };
    }
  }
}
