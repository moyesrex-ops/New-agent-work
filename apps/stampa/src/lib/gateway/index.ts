/**
 * Gateway selection. Exactly one place decides which implementation is live,
 * and it says so out loud on every surface that shows a stamp.
 */
import { env } from "../env";
import { FakeGateway } from "./fake";
import { PartnerGateway } from "./partner";
import type { EInvoiceGateway } from "./types";

export * from "./types";
export {
  toGatewayError,
  caseNumber,
  describeCode,
  formatOffendingValue,
  ERROR_MAP,
} from "./errors";
export { toUblXml } from "./ubl";
export { toNrsJson, candidateIrn } from "./nrs-json";
export { FakeGateway, FAKE_TRIGGERS, deterministicIrn } from "./fake";
export { PartnerGateway } from "./partner";

export type GatewayMode = "fake" | "sandbox" | "partner";

export function gatewayMode(): GatewayMode {
  return env().STAMPA_GATEWAY;
}

/**
 * The contingency in Architecture §16.7 requires that a demo running on the
 * fake gateway is labelled honestly rather than quietly. This is the flag the
 * UI reads to do that, and it is the reason the label cannot be forgotten.
 */
export function isSimulatedGateway(): boolean {
  return gatewayMode() === "fake";
}

let cached: EInvoiceGateway | null = null;

export function getGateway(): EInvoiceGateway {
  if (cached) return cached;

  switch (gatewayMode()) {
    case "sandbox":
    case "partner":
      cached = PartnerGateway.fromEnv();
      return cached;
    default:
      cached = new FakeGateway({ latencyMs: env().STAMPA_FAKE_LATENCY_MS });
      return cached;
  }
}
