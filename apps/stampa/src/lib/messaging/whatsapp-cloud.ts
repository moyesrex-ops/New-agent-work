/**
 * Meta Cloud API WhatsApp. Optional second path when Termii WhatsApp is not
 * on the account. Session texts only work inside the 24-hour window; OTP
 * therefore prefers an approved authentication template when one is set.
 *
 * Docs: POST https://graph.facebook.com/v21.0/{phone-number-id}/messages
 */
import { toMsisdn } from "../phone";
import type { Messenger, OutboundMessage, SendResult } from "./types";

export class WhatsAppCloudMessenger implements Messenger {
  readonly channel = "whatsapp" as const;

  constructor(
    private readonly options: {
      token: string;
      phoneNumberId: string;
      template?: string;
      fetch?: typeof fetch;
    },
  ) {}

  async send(message: OutboundMessage): Promise<SendResult> {
    const url = `https://graph.facebook.com/v21.0/${this.options.phoneNumberId}/messages`;
    const fetchFn = this.options.fetch ?? fetch;
    const to = toMsisdn(message.to);
    const body = this.options.template
      ? {
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: this.options.template,
            language: { code: "en" },
            components: [
              {
                type: "body",
                parameters: [{ type: "text", text: message.code ?? message.body.slice(0, 6) }],
              },
            ],
          },
        }
      : {
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: message.link ? `${message.body} ${message.link}` : message.body },
        };

    let response: Response;
    try {
      response = await fetchFn(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.options.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      return { ok: false, channel: this.channel, problem: "WhatsApp Cloud did not respond", retryable: true };
    }

    const json = (await response.json().catch(() => ({}))) as { messages?: Array<{ id?: string }>; error?: { message?: string } };
    if (!response.ok) {
      return {
        ok: false,
        channel: this.channel,
        problem: json.error?.message ?? `WhatsApp ${response.status}`,
        retryable: response.status >= 500,
      };
    }
    return { ok: true, channel: this.channel, providerId: json.messages?.[0]?.id ?? "whatsapp" };
  }
}
