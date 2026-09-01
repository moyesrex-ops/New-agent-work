import { env } from "../env";
import { FakeMailer, FakeMessenger } from "./fake";
import { AgentMailer, ResendMailer } from "./mail";
import { TermiiMessenger, TermiiVoiceMessenger } from "./termii";
import { WhatsAppCloudMessenger } from "./whatsapp-cloud";
import type { Channel, Email, Mailer, Messenger, OutboundMessage, SendResult } from "./types";

export type { Channel, Email, Mailer, Messenger, OutboundMessage, SendResult } from "./types";
export { FakeMailer, FakeMessenger } from "./fake";
export { TermiiMessenger, TermiiVoiceMessenger } from "./termii";
export { AgentMailer, ResendMailer } from "./mail";
export { WhatsAppCloudMessenger } from "./whatsapp-cloud";

let whatsapp: Messenger | null = null;
let sms: Messenger | null = null;
let voice: Messenger | null = null;
let mailer: Mailer | null = null;

/**
 * Tests inject fakes. Production builds the live adapters from the env
 * contract, which already refused to boot without Termii and a mailer.
 */
export function setMessengers(next: {
  whatsapp?: Messenger;
  sms?: Messenger;
  voice?: Messenger;
  mailer?: Mailer;
}): void {
  if (next.whatsapp) whatsapp = next.whatsapp;
  if (next.sms) sms = next.sms;
  if (next.voice) voice = next.voice;
  if (next.mailer) mailer = next.mailer;
}

function liveSms(): Messenger {
  const config = env();
  if (config.TERMII_API_KEY) {
    return new TermiiMessenger("sms", {
      apiKey: config.TERMII_API_KEY,
      senderId: config.TERMII_SENDER_ID,
      baseUrl: config.TERMII_BASE_URL,
      termiiChannel: "dnd",
    });
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("TERMII_API_KEY is required to send SMS in production");
  }
  return new FakeMessenger("sms");
}

function liveWhatsapp(): Messenger {
  const config = env();
  if (config.TERMII_API_KEY) {
    return new TermiiMessenger("whatsapp", {
      apiKey: config.TERMII_API_KEY,
      senderId: config.TERMII_SENDER_ID,
      baseUrl: config.TERMII_BASE_URL,
      termiiChannel: "whatsapp",
    });
  }
  if (config.WHATSAPP_TOKEN && config.WHATSAPP_PHONE_NUMBER_ID) {
    return new WhatsAppCloudMessenger({
      token: config.WHATSAPP_TOKEN,
      phoneNumberId: config.WHATSAPP_PHONE_NUMBER_ID,
      template: config.WHATSAPP_OTP_TEMPLATE,
    });
  }
  return new FakeMessenger("whatsapp");
}

function liveVoice(): Messenger {
  const config = env();
  if (config.TERMII_API_KEY) {
    return new TermiiVoiceMessenger({
      apiKey: config.TERMII_API_KEY,
      baseUrl: config.TERMII_BASE_URL,
    });
  }
  return new FakeMessenger("voice");
}

function liveMailer(): Mailer {
  const config = env();
  if (config.AGENTMAIL_API_KEY) {
    return new AgentMailer({
      apiKey: config.AGENTMAIL_API_KEY,
      inboxId: config.AGENTMAIL_INBOX_ID,
    });
  }
  if (config.RESEND_API_KEY) {
    return new ResendMailer({
      apiKey: config.RESEND_API_KEY,
      from: config.MAIL_FROM,
    });
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("A real mailer is required in production");
  }
  return new FakeMailer();
}

function messengers(): { whatsapp: Messenger; sms: Messenger; voice: Messenger } {
  whatsapp ??= liveWhatsapp();
  sms ??= liveSms();
  voice ??= liveVoice();
  return { whatsapp, sms, voice };
}

/**
 * Send over WhatsApp, fall back to SMS (ticket N-02).
 *
 * The fallback is unconditional, not a retry policy: a WhatsApp template
 * rejection returns a clean failure rather than an outage, and a supplier who
 * does not use WhatsApp is a normal case rather than an edge one.
 */
export async function sendWithFallback(message: OutboundMessage): Promise<SendResult> {
  const { whatsapp: wa, sms: text } = messengers();
  const first = await wa.send(message);
  if (first.ok) return first;
  return text.send(message);
}

/**
 * OTP delivery. SMS first, deliberately not WhatsApp-first: a supplier who is
 * being asked to trust a link needs the code to arrive on the number they just
 * typed, and Termii's DND route is the one that actually reaches Nigerian
 * numbers on the do-not-disturb list.
 */
export async function sendOtp(to: string, code: string, body: string): Promise<SendResult> {
  const hasLiveSms = Boolean(process.env.TERMII_API_KEY);
  if (process.env.NODE_ENV !== "production" && !hasLiveSms) {
    console.info(`[dev] OTP for ${to}: ${code}`);
  }

  const { sms: text, whatsapp: wa } = messengers();
  const message: OutboundMessage = { to, template: "otp", body, code };
  const first = await text.send(message);
  return first.ok ? first : wa.send(message);
}

export async function sendVoiceOtp(to: string, code: string, body: string): Promise<SendResult> {
  const { voice: call } = messengers();
  return call.send({ to, template: "otp_voice", body, code });
}

export async function sendEmail(email: Email): Promise<{ ok: boolean; problem?: string }> {
  mailer ??= liveMailer();
  const hasLiveMail = Boolean(process.env.AGENTMAIL_API_KEY || process.env.RESEND_API_KEY);
  if (process.env.NODE_ENV !== "production" && !hasLiveMail) {
    console.info(`[dev] email to ${email.to}: ${email.body}`);
  }
  return mailer.send(email);
}

export function channelsInUse(): Channel[] {
  const { whatsapp: wa, sms: text, voice: call } = messengers();
  return [wa.channel, text.channel, call.channel];
}
