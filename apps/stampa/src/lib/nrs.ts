/**
 * Public NRS e-invoicing surfaces.
 *
 * The Merchant Buyer Solution lives at einvoice.nrs.gov.ng. IRN validation is
 * a portal action, not a documented public deep link, so we never invent
 * `/verify/{irn}` on nrs.gov.ng. The QR carries the IRN in the URL fragment
 * so a scan still names the record without hitting a guessed path.
 */
export const NRS_EINVOICE_HOST = "einvoice.nrs.gov.ng";
export const NRS_EINVOICE_ORIGIN = `https://${NRS_EINVOICE_HOST}`;

export function nrsPortalUrl(): string {
  return `${NRS_EINVOICE_ORIGIN}/`;
}

export function nrsQrPayload(irn: string): string {
  return `${NRS_EINVOICE_ORIGIN}/#${encodeURIComponent(irn)}`;
}
