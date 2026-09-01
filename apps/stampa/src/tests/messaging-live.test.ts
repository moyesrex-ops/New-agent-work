import { describe, expect, it } from "vitest";
import { TermiiMessenger, TermiiVoiceMessenger } from "@/lib/messaging/termii";
import { AgentMailer } from "@/lib/messaging/mail";

describe("TermiiMessenger", () => {
  it("posts to the DND route with a 234 number and no plus", async () => {
    let body: Record<string, unknown> | undefined;
    const fetchFn: typeof fetch = async (_url, init) => {
      body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(JSON.stringify({ code: "ok", message_id: "m1" }), { status: 200 });
    };
    const sms = new TermiiMessenger("sms", {
      apiKey: "tk",
      senderId: "Talert",
      termiiChannel: "dnd",
      fetch: fetchFn,
    });
    const result = await sms.send({
      to: "+2348165096822",
      template: "otp",
      body: "482913 is your Stampa code. We will never ask you for it.",
      code: "482913",
    });
    expect(result.ok).toBe(true);
    expect(body?.to).toBe("2348165096822");
    expect(body?.channel).toBe("dnd");
    expect(body?.from).toBe("Talert");
    expect(String(body?.sms)).toContain("482913");
  });

  it("returns a retryable failure when Termii is down", async () => {
    const sms = new TermiiMessenger("sms", {
      apiKey: "tk",
      senderId: "Talert",
      termiiChannel: "dnd",
      fetch: async () => {
        throw new Error("network");
      },
    });
    const result = await sms.send({ to: "+2348030000000", template: "otp", body: "x", code: "000000" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.retryable).toBe(true);
  });
});

describe("TermiiVoiceMessenger", () => {
  it("speaks the issued code rather than inventing a second one", async () => {
    let body: Record<string, unknown> | undefined;
    const voice = new TermiiVoiceMessenger({
      apiKey: "tk",
      fetch: async (_url, init) => {
        body = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return new Response(JSON.stringify({ code: "ok", message_id: "v1" }), { status: 200 });
      },
    });
    const result = await voice.send({
      to: "+2348030000000",
      template: "otp_voice",
      body: "111222 is your Stampa code. We will never ask you for it.",
      code: "111222",
    });
    expect(result.ok).toBe(true);
    expect(body?.phone_number).toBe("2348030000000");
    expect(body?.code).toBe("111222");
  });
});

describe("AgentMailer", () => {
  it("posts a text message to the company inbox", async () => {
    let url = "";
    const mailer = new AgentMailer({
      apiKey: "am",
      inboxId: "stampa-support@agentmail.to",
      fetch: async (input, init) => {
        url = String(input);
        const payload = JSON.parse(String(init?.body)) as { to: string[]; subject: string };
        expect(payload.to).toEqual(["tax.manager@agbarafoods.com"]);
        expect(payload.subject).toContain("Stampa");
        return new Response("{}", { status: 200 });
      },
    });
    const result = await mailer.send({
      to: "tax.manager@agbarafoods.com",
      subject: "Your Stampa sign-in link",
      body: "https://stampa.ng/c/signin/token",
    });
    expect(result.ok).toBe(true);
    expect(url).toContain("/v0/inboxes/stampa-support%40agentmail.to/messages/send");
  });
});
