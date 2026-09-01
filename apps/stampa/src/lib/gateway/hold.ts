/**
 * HoldGateway — production without an accredited APP/SI.
 *
 * The web app can run: public site, OTP, magic links, drafts, buyer console.
 * A stamp attempt fails closed. No IRN is invented. The supplier is told the
 * truth: Stampa is not yet an access point, and the invoice is saved.
 */
import { nrsPortalUrl } from "../nrs";
import { toGatewayError } from "./errors";
import type { EInvoiceGateway, Stamp, TransmissionStatus } from "./types";

export const HOLD_CODE = "ACCESS_POINT_PENDING";

function pendingError() {
  return toGatewayError(HOLD_CODE);
}

export class HoldGateway implements EInvoiceGateway {
  readonly name = "hold";

  async transmit(): Promise<Stamp> {
    throw pendingError();
  }

  async status(): Promise<TransmissionStatus> {
    return { state: "rejected", error: pendingError() };
  }

  verifyUrl(): string {
    return nrsPortalUrl();
  }
}
