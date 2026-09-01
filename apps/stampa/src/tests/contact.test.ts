import { afterEach, describe, expect, it } from "vitest";
import { contactLimited, readContact, resetContactLimits } from "@/lib/contact-form";

describe("contact form", () => {
  afterEach(() => {
    resetContactLimits();
  });

  it("reads the fields a person typed, including the honeypot", () => {
    const data = new FormData();
    data.set("company", "bot");
    data.set("name", "Ada");
    data.set("email", "ada@buyer.ng");
    data.set("message", "Need an invite resent.");
    expect(readContact(data)).toEqual({
      trap: "bot",
      name: "Ada",
      email: "ada@buyer.ng",
      message: "Need an invite resent.",
    });
  });

  it("throttles a flood from one network", () => {
    const now = 1_000_000;
    for (let i = 0; i < 5; i += 1) {
      expect(contactLimited("1.1.1.1", now + i)).toBe(false);
    }
    expect(contactLimited("1.1.1.1", now + 6)).toBe(true);
    expect(contactLimited("8.8.8.8", now + 6)).toBe(false);
  });
});
