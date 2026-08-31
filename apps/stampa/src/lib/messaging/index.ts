import { FakeMessenger } from "./fake";
import type { Channel, Messenger, OutboundMessage, SendResult } from "./types";

export type { Channel, Messenger, OutboundMessage, SendResult } from "./types";
export { FakeMessenger } from "./fake";

let whatsapp: Messenger | null = null;
let sms: Messenger | null = null;

/**
 * Live adapters are configured in production. Until credentials exist the app
 * runs on the fakes, which is stated on screen wherever a message is promised
 * rather than hidden — the same rule the gateway follows.
 */
export function setMessengers(next: { whatsapp?: Messenger; sms?: Messenger }): void {
  if (next.whatsapp) whatsapp = next.whatsapp;
  if (next.sms) sms = next.sms;
}

function messengers(): { whatsapp: Messenger; sms: Messenger } {
  whatsapp ??= new FakeMessenger("whatsapp");
  sms ??= new FakeMessenger("sms");
  return { whatsapp, sms };
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
  // Local development has no provider, so the code goes to the server log
  // rather than being displayed on screen. Never reached in production.
  if (process.env.NODE_ENV !== "production") console.info(`[dev] OTP for ${to}: ${code}`);

  const { sms: text, whatsapp: wa } = messengers();
  const message: OutboundMessage = { to, template: "otp", body };
  const first = await text.send(message);
  return first.ok ? first : wa.send(message);
}

export function channelsInUse(): Channel[] {
  const { whatsapp: wa, sms: text } = messengers();
  return [wa.channel, text.channel];
}
