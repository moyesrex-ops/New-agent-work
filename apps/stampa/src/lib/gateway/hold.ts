/**
 * HoldGateway — production without an accredited APP/SI.
 *
 * The web app can run: public site, OTP, magic links, drafts, buyer console.
 * A stamp attempt fails closed. No IRN is invented. The supplier is told the
 * truth: Stampa is not yet an access point, and the invoice is saved.
 */
import { nrsPortalUrl } from "../nrs";
import { toGatewayError } from "./errors";
import type { EInvoiceGateway, GatewayInvoice, Stamp, TransmissionStatus } from "./types";

export const HOLD_CODE = "ACCESS_POINT_PENDING";

function pendingError() {
  return toGatewayError(HOLD_CODE);
}

export class HoldGateway implements EInvoiceGateway {
  readonly name = "hold";

  async transmit(invoice: GatewayInvoice, idempotencyKey: string): Promise<Stamp> {
    void invoice;
    void idempotencyKey;
    throw pendingError();
  }

  async status(idempotencyKey: string): Promise<TransmissionStatus> {
    void idempotencyKey;
    return { state: "rejected", error: pendingError() };
  }

  verifyUrl(irn: string): string {
    void irn;
    return nrsPortalUrl();
  }
}
