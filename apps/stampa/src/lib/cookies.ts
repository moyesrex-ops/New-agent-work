/**
 * Cookie flags shared by sessions, invite, OTP phone and upload staging.
 *
 * `secure` is production-only so local HTTP still works. Missing it on the
 * invite and phone cookies was the gap: a session was marked Secure while the
 * cookies that decide who is about to become a session were not.
 */
export function appCookie(maxAgeSeconds?: number) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(typeof maxAgeSeconds === "number" ? { maxAge: maxAgeSeconds } : {}),
  };
}

/** An invitation is valid for thirty days; the cookie should not outlive it. */
export const INVITE_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;
/** Long enough to type a code and ask for a resend, short enough to drop. */
export const PHONE_COOKIE_MAX_AGE = 20 * 60;
/** Mapping a vendor master should not take an hour. */
export const UPLOAD_COOKIE_MAX_AGE = 60 * 60;
