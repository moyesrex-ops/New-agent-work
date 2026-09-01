/**
 * PartnerGateway — ticket C-08.
 *
 * Talks to an accredited Access Point Provider using the Interswitch
 * SwitchTax contract published on GitHub (Vantroxia-Labs/remit):
 *
 *   POST /Api/SwitchTax/Token          { ClientId, ClientSecret }
 *   POST /Api/SwitchTax/SignInvoice    NRS snake_case invoice JSON
 *   POST /Api/SwitchTax/Transmit       { IRN }  (after a successful sign)
 *
 * DigiTax-shaped partners still expose `/Api/SwitchTax/postInvoice`; that
 * path is used only when SignInvoice returns 404.
 *
 * There is no fallback to FakeGateway. A missing credential is a boot
 * failure, not a silent invented tax reference.
 */
import { env } from "../env";
import { toGatewayError } from "./errors";
import { toNrsJson } from "./nrs-json";
import { toUblXml } from "./ubl";
import type { EInvoiceGateway, GatewayInvoice, Stamp, TransmissionStatus } from "./types";

export type PartnerFetch = typeof fetch;

type TokenResponse = { Token?: string; token?: string; expires_in?: number };
type PostResponse = {
  Code?: number | string;
  code?: number | string;
  message?: string;
  error?: string;
  errorCode?: string;
  Error?: { PublicMessage?: string; Details?: string };
  Data?: { IRN?: string; irn?: string; QRCodeData?: string; qrCodeData?: string };
  data?: { IRN?: string; irn?: string; QRCodeData?: string; qrCodeData?: string };
  IRN?: string;
  irn?: string;
};

const NRS_VERIFY_BASE = "https://nrs.gov.ng/verify";
const SIGN_PATH = "/Api/SwitchTax/SignInvoice";
const POST_PATH = "/Api/SwitchTax/postInvoice";
const TRANSMIT_PATH = "/Api/SwitchTax/Transmit";
const TOKEN_PATH = "/Api/SwitchTax/Token";

function extractIrn(body: PostResponse): string | undefined {
  return (
    body.data?.IRN ??
    body.data?.irn ??
    body.Data?.IRN ??
    body.Data?.irn ??
    body.IRN ??
    body.irn
  );
}

function extractQr(body: PostResponse, irn: string): string {
  return (
    body.data?.QRCodeData ??
    body.data?.qrCodeData ??
    body.Data?.QRCodeData ??
    body.Data?.qrCodeData ??
    `${NRS_VERIFY_BASE}/${encodeURIComponent(irn)}`
  );
}

function extractMessage(body: PostResponse): string | undefined {
  return body.Error?.PublicMessage ?? body.Error?.Details ?? body.message ?? body.error;
}

export class PartnerGateway implements EInvoiceGateway {
  readonly name: "sandbox" | "partner";
  private token: { value: string; expiresAt: number } | null = null;
  private readonly seen = new Map<string, TransmissionStatus>();

  constructor(
    private readonly options: {
      baseUrl: string;
      clientId: string;
      clientSecret: string;
      businessId: string;
      serviceId: string;
      mode?: "sandbox" | "partner";
      fetch?: PartnerFetch;
      now?: () => Date;
    },
  ) {
    this.name = options.mode ?? "partner";
  }

  static fromEnv(source = env()): PartnerGateway {
    const baseUrl = source.APP_PARTNER_BASE_URL;
    const clientId = source.APP_PARTNER_CLIENT_ID;
    const clientSecret = source.APP_PARTNER_CLIENT_SECRET;
    const businessId = source.APP_PARTNER_BUSINESS_ID;
    if (!baseUrl || !clientId || !clientSecret || !businessId) {
      throw new Error(
        "PartnerGateway requires APP_PARTNER_BASE_URL, CLIENT_ID, CLIENT_SECRET and BUSINESS_ID",
      );
    }
    return new PartnerGateway({
      baseUrl,
      clientId,
      clientSecret,
      businessId,
      serviceId: source.APP_PARTNER_SERVICE_ID,
      mode: source.STAMPA_GATEWAY === "sandbox" ? "sandbox" : "partner",
    });
  }

  verifyUrl(irn: string): string {
    return `${NRS_VERIFY_BASE}/${encodeURIComponent(irn)}`;
  }

  async status(idempotencyKey: string): Promise<TransmissionStatus> {
    return this.seen.get(idempotencyKey) ?? { state: "pending" };
  }

  async transmit(invoice: GatewayInvoice, idempotencyKey: string): Promise<Stamp> {
    const previous = this.seen.get(idempotencyKey);
    if (previous?.state === "stamped") return previous.stamp;
    if (previous?.state === "rejected") throw previous.error;

    const token = await this.accessToken();
    const payload = toNrsJson(invoice, {
      businessId: this.options.businessId,
      serviceId: this.options.serviceId,
    });
    const ubl = toUblXml(invoice);

    let response = await this.request(SIGN_PATH, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
        "X-UBL-SHA256": Buffer.from(ubl).toString("base64").slice(0, 64),
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 404) {
      response = await this.request(POST_PATH, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(payload),
      });
    }

    const body = (await this.json(response)) as PostResponse;
    if (!response.ok) {
      const code = String(body.errorCode ?? body.error ?? body.Code ?? body.code ?? `HTTP_${response.status}`);
      const error = toGatewayError(code, extractMessage(body));
      if (!error.retryable) this.seen.set(idempotencyKey, { state: "rejected", error });
      throw error;
    }

    const irn = extractIrn(body);
    if (!irn) {
      const error = toGatewayError("NRS_UNAVAILABLE", "missing IRN");
      throw error;
    }

    await this.confirmTransmit(token, irn);

    const stamp: Stamp = {
      irn,
      stampedAt: this.options.now?.() ?? new Date(),
      qrPayload: extractQr(body, irn),
    };
    this.seen.set(idempotencyKey, { state: "stamped", stamp });
    return stamp;
  }

  private async confirmTransmit(token: string, irn: string): Promise<void> {
    try {
      await this.request(TRANSMIT_PATH, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ IRN: irn, irn }),
      });
    } catch {
      // SignInvoice already issued the IRN. Transmit is a second APP step and
      // must not turn a successful stamp into a supplier-facing failure.
    }
  }

  private async accessToken(): Promise<string> {
    const now = Date.now();
    if (this.token && this.token.expiresAt > now + 30_000) return this.token.value;

    const response = await this.request(TOKEN_PATH, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        ClientId: this.options.clientId,
        ClientSecret: this.options.clientSecret,
      }),
    });
    const body = (await this.json(response)) as TokenResponse;
    const value = body.Token ?? body.token;
    if (!response.ok || !value) {
      throw toGatewayError("APP_AUTH_FAILED", String(response.status));
    }
    const ttlMs = (body.expires_in ?? 3600) * 1000;
    this.token = { value, expiresAt: now + ttlMs };
    return value;
  }

  private async request(path: string, init: RequestInit): Promise<Response> {
    const fetchFn = this.options.fetch ?? fetch;
    const url = `${this.options.baseUrl.replace(/\/$/, "")}${path}`;
    try {
      return await fetchFn(url, { ...init, signal: AbortSignal.timeout(20_000) });
    } catch {
      throw toGatewayError("NRS_TIMEOUT");
    }
  }

  private async json(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { message: text };
    }
  }
}
