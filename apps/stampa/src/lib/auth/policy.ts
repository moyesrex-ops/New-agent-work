/**
 * The policy module (ticket A-06).
 *
 * Every mutation consults this file. Authorisation is never decided in a
 * component, never duplicated per route, and never inferred from which page
 * the user reached. If a check is not here, it does not exist.
 */

export type Principal =
  | { role: "supplier_owner"; supplierId: string }
  | { role: "buyer_admin"; userId: string; organisationId: string }
  | { role: "buyer_member"; userId: string; organisationId: string }
  | { role: "operator"; operatorId: string }
  | { role: "anonymous" };

export type Resource =
  | { kind: "supplier"; supplierId: string }
  | { kind: "invoice"; supplierId: string; organisationId: string }
  | { kind: "organisation"; organisationId: string }
  | { kind: "supplier_link"; organisationId: string }
  | { kind: "platform" };

export type Action =
  | "supplier.read"
  | "supplier.write"
  | "supplier.delete"
  | "invoice.read"
  | "invoice.create"
  | "invoice.transmit"
  | "organisation.read"
  | "organisation.write"
  | "supplier_link.read"
  | "supplier_link.invite"
  | "vendor_master.upload"
  | "operator.read_any"
  | "operator.retry_transmission"
  | "operator.correct_tin"
  | "operator.suspend"
  | "operator.resolve_flag";

const OPERATOR_WRITES: ReadonlySet<Action> = new Set([
  "operator.retry_transmission",
  "operator.correct_tin",
  "operator.suspend",
  "operator.resolve_flag",
]);

export function can(principal: Principal, action: Action, resource: Resource): boolean {
  switch (principal.role) {
    case "supplier_owner":
      switch (action) {
        case "supplier.read":
        case "supplier.write":
        case "supplier.delete":
          return resource.kind === "supplier" && resource.supplierId === principal.supplierId;
        case "invoice.read":
        case "invoice.create":
        case "invoice.transmit":
          return resource.kind === "invoice" && resource.supplierId === principal.supplierId;
        // A supplier may read the link to see their vendor code and bank
        // display, but writing it is unreachable for every role. See below.
        case "supplier_link.read":
          return true;
        default:
          return false;
      }

    case "buyer_admin":
      switch (action) {
        case "organisation.read":
        case "organisation.write":
        case "supplier_link.read":
        case "supplier_link.invite":
        case "vendor_master.upload":
          return "organisationId" in resource && resource.organisationId === principal.organisationId;
        case "invoice.read":
          return resource.kind === "invoice" && resource.organisationId === principal.organisationId;
        default:
          return false;
      }

    case "buyer_member":
      switch (action) {
        case "organisation.read":
        case "supplier_link.read":
        case "supplier_link.invite":
          return "organisationId" in resource && resource.organisationId === principal.organisationId;
        case "invoice.read":
          return resource.kind === "invoice" && resource.organisationId === principal.organisationId;
        default:
          return false;
      }

    case "operator":
      // Read across everything; write only the four corrective actions, each
      // of which is audit-logged with a required reason.
      if (action === "operator.read_any") return true;
      if (OPERATOR_WRITES.has(action)) return true;
      return action.endsWith(".read");

    case "anonymous":
      return false;
  }
}

export class NotAuthorised extends Error {
  constructor(action: Action) {
    super(`Not authorised: ${action}`);
    this.name = "NotAuthorised";
  }
}

export function authorise(principal: Principal, action: Action, resource: Resource): void {
  if (!can(principal, action, resource)) throw new NotAuthorised(action);
}

/**
 * Bank fields are not writable by anyone, through any path, ever.
 *
 * They change only when a fresh vendor master is uploaded and diffed, which is
 * a separate audited routine. This guard exists so that an ordinary update
 * helper cannot become a payment-diversion vector by accident — the attack
 * identified in Simulation 8.
 */
export function assertNoBankWrite(patch: Record<string, unknown>): void {
  const offending = Object.keys(patch).filter((key) => /^bank/i.test(key));
  if (offending.length) {
    throw new Error(
      `Bank fields are not writable through this path: ${offending.join(", ")}`,
    );
  }
}
