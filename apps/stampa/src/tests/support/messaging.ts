import { FakeMessenger, setMessengers } from "@/lib/messaging";

/**
 * Fresh fakes for one test. The `refuses` lists are how the WhatsApp → SMS
 * fallback gets proven rather than assumed: template rejections are the normal
 * failure mode of the Cloud API, not an exotic one.
 */
export function installFakeMessengers(
  refuses: { whatsapp?: string[]; sms?: string[] } = {},
) {
  const whatsapp = new FakeMessenger("whatsapp", refuses.whatsapp ?? []);
  const sms = new FakeMessenger("sms", refuses.sms ?? []);
  setMessengers({ whatsapp, sms });
  return { whatsapp, sms };
}
