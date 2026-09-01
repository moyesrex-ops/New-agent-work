/**
 * Termii SMS, WhatsApp and voice — the Nigerian DND route the OTP design
 * named. OTP and transactional notices use channel `dnd`; promotional traffic
 * is not sent from this adapter at all.
 *
 * Docs: https://developers.termii.com/messaging-api
 */
import { toMsisdn } from "../phone";
import type { Channel, Messenger, OutboundMessage, SendResult } from "./types";

export type TermiiChannel = "dnd" | "whatsapp" | "voice";

type TermiiResponse = {
  code?: string;
  message?: string;
  message_id?: string;
  message_id_str?: string;
  smsStatus?: string;
};

export class TermiiMessenger implements Messenger {
  constructor(
    readonly channel: Channel,
    private readonly options: {
      apiKey: string;
      senderId: string;
      baseUrl?: string;
      termiiChannel: TermiiChannel;
      fetch?: typeof fetch;
    },
  ) {}

  async send(message: OutboundMessage): Promise<SendResult> {
    const sms = message.link ? `${message.body} ${message.link}` : message.body;
    const url = `${(this.options.baseUrl ?? "https://api.ng.termii.com").replace(/\/$/, "")}/api/sms/send`;
    const fetchFn = this.options.fetch ?? fetch;

    let response: Response;
    try {
      response = await fetchFn(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: this.options.apiKey,
          to: toMsisdn(message.to),
          from: this.options.senderId,
          sms,
          type: "plain",
          channel: this.options.termiiChannel,
        }),
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      return {
        ok: false,
        channel: this.channel,
        problem: "Termii did not respond",
        retryable: true,
      };
    }

    const body = (await response.json().catch(() => ({}))) as TermiiResponse;
    const providerId = body.message_id_str ?? body.message_id ?? "";
    const accepted = response.ok && (body.code === "ok" || body.smsStatus === "Message Sent" || Boolean(providerId));
    if (!accepted) {
      return {
        ok: false,
        channel: this.channel,
        problem: body.message ?? `Termii ${response.status}`,
        retryable: response.status >= 500,
      };
    }
    return { ok: true, channel: this.channel, providerId: providerId || "termii" };
  }
}

/**
 * Termii voice OTP. The spoken code is the six digits we already issued;
 * we never invent a second code for the call.
 *
 * Docs: POST /api/sms/otp/call { api_key, phone_number, code }
 */
export class TermiiVoiceMessenger implements Messenger {
  readonly channel = "voice" as const;

  constructor(
    private readonly options: {
      apiKey: string;
      baseUrl?: string;
      fetch?: typeof fetch;
    },
  ) {}

  async send(message: OutboundMessage): Promise<SendResult> {
    const code = message.code ?? message.body.match(/\b(\d{6})\b/)?.[1];
    if (!code) {
      return { ok: false, channel: this.channel, problem: "No code to speak", retryable: false };
    }

    const url = `${(this.options.baseUrl ?? "https://api.ng.termii.com").replace(/\/$/, "")}/api/sms/otp/call`;
    const fetchFn = this.options.fetch ?? fetch;

    let response: Response;
    try {
      response = await fetchFn(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: this.options.apiKey,
          phone_number: toMsisdn(message.to),
          code,
        }),
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      return { ok: false, channel: this.channel, problem: "Termii voice did not respond", retryable: true };
    }

    const body = (await response.json().catch(() => ({}))) as TermiiResponse;
    const providerId = body.message_id_str ?? body.message_id ?? "";
    const accepted = response.ok && (body.code === "ok" || Boolean(providerId) || response.status === 200);
    if (!accepted) {
      return {
        ok: false,
        channel: this.channel,
        problem: body.message ?? `Termii voice ${response.status}`,
        retryable: response.status >= 500,
      };
    }
    return { ok: true, channel: this.channel, providerId: providerId || "termii-voice" };
  }
}
