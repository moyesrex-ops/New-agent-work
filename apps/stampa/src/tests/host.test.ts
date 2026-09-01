import { describe, expect, it } from "vitest";
import { cronAuthorised } from "@/lib/cron";
import { otpChannelWait, RESEND_AFTER_MS, VOICE_AFTER_MS } from "@/lib/auth/otp";
import { appCookie } from "@/lib/cookies";

describe("cronAuthorised", () => {
  it("refuses an empty secret rather than leaving the route open", () => {
    expect(cronAuthorised("Bearer secret", undefined)).toBe(false);
    expect(cronAuthorised("Bearer secret", "")).toBe(false);
  });

  it("accepts only the exact bearer token", () => {
    expect(cronAuthorised("Bearer abc", "abc")).toBe(true);
    expect(cronAuthorised("Bearer abcd", "abc")).toBe(false);
    expect(cronAuthorised("abc", "abc")).toBe(false);
  });
});

describe("otpChannelWait", () => {
  it("is zero when nothing has been issued", () => {
    expect(otpChannelWait(null)).toEqual({ resendAfterMs: 0, voiceAfterMs: 0 });
  });

  it("tracks the thirty-second resend and sixty-second voice waits", () => {
    const issued = new Date("2026-09-01T12:00:00Z");
    const tenSecondsLater = new Date(issued.getTime() + 10_000);
    const wait = otpChannelWait(issued, tenSecondsLater);
    expect(wait.resendAfterMs).toBe(RESEND_AFTER_MS - 10_000);
    expect(wait.voiceAfterMs).toBe(VOICE_AFTER_MS - 10_000);
  });
});

describe("appCookie", () => {
  it("is httpOnly and SameSite=Lax", () => {
    const cookie = appCookie(60);
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.sameSite).toBe("lax");
    expect(cookie.path).toBe("/");
    expect(cookie.maxAge).toBe(60);
    expect(cookie.secure).toBe(process.env.NODE_ENV === "production");
  });
});
