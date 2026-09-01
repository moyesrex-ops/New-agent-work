/**
 * Schema (ticket C-01). Postgres via Drizzle `pg-core`.
 *
 * Locally and in tests this runs on PGlite — Postgres compiled to WebAssembly —
 * so the SQL exercised in development is the SQL that runs in production. Only
 * the driver changes.
 *
 * Ten domain tables from Architecture §16.2, plus three the auth design needs
 * (`buyer_users`, `otp_challenges`, `sessions`). That deviation from the ticket
 * text is noted in the changelog rather than absorbed silently.
 *
 * Money is `bigint` holding integer kobo. There is no numeric or float column
 * in this file and adding one is a review blocker.
 */
import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const id = () => text("id").primaryKey();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const money = (name: string) => bigint(name, { mode: "number" }).notNull();

/** A buyer. The party with the compliance obligation that funds the company. */
export const organisations = pgTable("organisations", {
  id: id(),
  legalName: text("legal_name").notNull(),
  rcNumber: text("rc_number"),
  tin: text("tin").notNull(),
  address: text("address").notNull().default(""),
  plan: text("plan").notNull().default("pilot"),
  activeSupplierCap: integer("active_supplier_cap").notNull().default(500),
  /** Short code that prefixes invite links: stampa.ng/s/AGB-4471 */
  inviteSlug: text("invite_slug").notNull(),
  createdAt: createdAt(),
});

/** A person who signs into the buyer console. */
export const buyerUsers = pgTable(
  "buyer_users",
  {
    id: id(),
    organisationId: text("organisation_id")
      .notNull()
      .references(() => organisations.id),
    email: text("email").notNull(),
    name: text("name").notNull().default(""),
    role: text("role").notNull().default("buyer_admin"),
    createdAt: createdAt(),
  },
  (table) => [uniqueIndex("buyer_users_email_idx").on(table.email)],
);

/**
 * A small business. One row per supplier across the whole platform regardless
 * of how many buyers know them — this is what makes the network effect
 * mechanical rather than aspirational (Architecture §16.2).
 */
export const suppliers = pgTable(
  "suppliers",
  {
    id: id(),
    businessName: text("business_name").notNull(),
    tin: text("tin"),
    address: text("address").notNull().default(""),
    /** E.164. The identity. No email column: cut in the architecture review. */
    phone: text("phone").notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    suspendedAt: timestamp("suspended_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    /**
     * When the thirty-day window closed and the identifying fields on this row
     * were overwritten. The row itself stays: stamped invoices are tax records
     * and a foreign key has to resolve to something.
     */
    purgedAt: timestamp("purged_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [uniqueIndex("suppliers_phone_idx").on(table.phone)],
);

/**
 * The relationship between one supplier and one buyer.
 *
 * Bank fields live here because they belong to the buyer's vendor master, not
 * to the supplier's identity. No role may write them — see `assertNoBankWrite`
 * in policy.ts and the column-level revocation in migrate.ts.
 */
export const supplierLinks = pgTable(
  "supplier_links",
  {
    id: id(),
    supplierId: text("supplier_id")
      .notNull()
      .references(() => suppliers.id),
    organisationId: text("organisation_id")
      .notNull()
      .references(() => organisations.id),
    vendorCode: text("vendor_code"),
    category: text("category"),
    bankName: text("bank_name"),
    /** Last four digits only. Full account numbers were cut in the review. */
    bankLast4: text("bank_last4"),
    /**
     * Annual spend in kobo, when the buyer's export carried it. Nullable on
     * purpose: the exposure report must be able to say out loud whether the
     * figure came from their data or from our stated assumption.
     */
    annualSpendKobo: bigint("annual_spend_kobo", { mode: "number" }),
    status: text("status").notNull().default("invited"),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("supplier_links_pair_idx").on(table.supplierId, table.organisationId),
    index("supplier_links_org_idx").on(table.organisationId),
  ],
);

export const invitations = pgTable(
  "invitations",
  {
    id: id(),
    code: text("code").notNull(),
    supplierLinkId: text("supplier_link_id")
      .notNull()
      .references(() => supplierLinks.id),
    channel: text("channel").notNull().default("whatsapp"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    boundAt: timestamp("bound_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (table) => [uniqueIndex("invitations_code_idx").on(table.code)],
);

/** status: draft | queued | sending | stamped | rejected | disputed */
export const invoices = pgTable(
  "invoices",
  {
    id: id(),
    supplierId: text("supplier_id")
      .notNull()
      .references(() => suppliers.id),
    organisationId: text("organisation_id")
      .notNull()
      .references(() => organisations.id),
    invoiceNumber: text("invoice_number").notNull(),
    currency: text("currency").notNull().default("NGN"),
    subtotalKobo: money("subtotal_kobo"),
    vatKobo: money("vat_kobo"),
    totalKobo: money("total_kobo"),
    status: text("status").notNull().default("draft"),
    irn: text("irn"),
    stampedAt: timestamp("stamped_at", { withTimezone: true }),
    /** Set only when status is rejected. Never a raw partner code in the UI. */
    failureCode: text("failure_code"),
    failureFault: text("failure_fault"),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("invoices_number_idx").on(table.supplierId, table.invoiceNumber),
    index("invoices_supplier_idx").on(table.supplierId),
    index("invoices_org_idx").on(table.organisationId),
    uniqueIndex("invoices_irn_idx").on(table.irn),
  ],
);

export const invoiceLines = pgTable(
  "invoice_lines",
  {
    id: id(),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(1),
    description: text("description").notNull(),
    quantity: integer("quantity").notNull(),
    unitPriceKobo: money("unit_price_kobo"),
    vatBasisPoints: integer("vat_basis_points").notNull().default(750),
    lineSubtotalKobo: money("line_subtotal_kobo"),
    lineVatKobo: money("line_vat_kobo"),
  },
  (table) => [index("invoice_lines_invoice_idx").on(table.invoiceId)],
);

/**
 * One row per transmission attempt. The operator failure queue is a view over
 * this table, and `idempotencyKey` is what stops a bad network turning one
 * invoice into two tax records.
 */
export const transmissions = pgTable(
  "transmissions",
  {
    id: id(),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    attempt: integer("attempt").notNull().default(1),
    idempotencyKey: text("idempotency_key").notNull(),
    requestHash: text("request_hash").notNull(),
    state: text("state").notNull().default("queued"),
    responseCode: text("response_code"),
    fault: text("fault"),
    offendingValue: text("offending_value"),
    unmappedCode: boolean("unmapped_code").notNull().default(false),
    latencyMs: integer("latency_ms"),
    /** Worker scheduling: exponential backoff with jitter (C-05). */
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("transmissions_idempotency_idx").on(table.idempotencyKey),
    index("transmissions_invoice_idx").on(table.invoiceId),
    index("transmissions_queue_idx").on(table.state, table.nextAttemptAt),
  ],
);

/** Append-only. There is no delete path for this table anywhere in the code. */
export const auditEvents = pgTable(
  "audit_events",
  {
    id: id(),
    actorType: text("actor_type").notNull(),
    actorId: text("actor_id"),
    action: text("action").notNull(),
    subjectType: text("subject_type").notNull(),
    subjectId: text("subject_id").notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    /** Required for every operator write. Enforced in audit.ts, not by habit. */
    reason: text("reason"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
  },
  (table) => [
    index("audit_subject_idx").on(table.subjectType, table.subjectId),
    index("audit_created_idx").on(table.createdAt),
  ],
);

export const flags = pgTable("flags", {
  id: id(),
  subjectType: text("subject_type").notNull(),
  subjectId: text("subject_id").notNull(),
  reason: text("reason").notNull(),
  raisedBy: text("raised_by").notNull(),
  state: text("state").notNull().default("open"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolutionNote: text("resolution_note"),
  createdAt: createdAt(),
});

/**
 * Analytics into Postgres, not PostHog — cut in the architecture review.
 * Properties never carry an invoice description, a full TIN or a phone number.
 */
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: id(),
    name: text("name").notNull(),
    actorType: text("actor_type").notNull(),
    actorId: text("actor_id"),
    properties: jsonb("properties").notNull().default({}),
    createdAt: createdAt(),
  },
  (table) => [index("analytics_name_idx").on(table.name, table.createdAt)],
);

export const otpChallenges = pgTable(
  "otp_challenges",
  {
    id: id(),
    phone: text("phone").notNull(),
    /** Hashed. The plaintext code is never stored (Phase 19, item 6). */
    codeHash: text("code_hash").notNull(),
    attempts: integer("attempts").notNull().default(0),
    channel: text("channel").notNull().default("sms"),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (table) => [index("otp_phone_idx").on(table.phone, table.createdAt)],
);

/**
 * Buyer sign-in (ticket A-04). Single-use, short-lived, hashed at rest for the
 * same reason session tokens are: a database read must not yield a usable
 * credential.
 */
export const magicLinks = pgTable(
  "magic_links",
  {
    id: id(),
    email: text("email").notNull(),
    tokenHash: text("token_hash").notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("magic_links_token_idx").on(table.tokenHash),
    index("magic_links_email_idx").on(table.email, table.createdAt),
  ],
);

/**
 * One row per notification we tried to deliver (tickets N-03, N-04).
 *
 * The unique index on (template, subject) is the idempotency fence: a supplier
 * cannot be nudged twice for the same invitation, and an invoice cannot
 * announce itself stamped twice because a worker retried.
 */
export const notifications = pgTable(
  "notifications",
  {
    id: id(),
    subjectType: text("subject_type").notNull(),
    subjectId: text("subject_id").notNull(),
    template: text("template").notNull(),
    /** whatsapp | sms — which one actually carried it. */
    channel: text("channel"),
    state: text("state").notNull().default("sent"),
    problem: text("problem"),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("notifications_once_idx").on(table.template, table.subjectType, table.subjectId),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    subjectType: text("subject_type").notNull(),
    subjectId: text("subject_id").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [uniqueIndex("sessions_token_idx").on(table.tokenHash)],
);

export const organisationsRelations = relations(organisations, ({ many }) => ({
  links: many(supplierLinks),
  invoices: many(invoices),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  links: many(supplierLinks),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  supplier: one(suppliers, { fields: [invoices.supplierId], references: [suppliers.id] }),
  organisation: one(organisations, {
    fields: [invoices.organisationId],
    references: [organisations.id],
  }),
  lines: many(invoiceLines),
  transmissions: many(transmissions),
}));

export const invoiceLinesRelations = relations(invoiceLines, ({ one }) => ({
  invoice: one(invoices, { fields: [invoiceLines.invoiceId], references: [invoices.id] }),
}));

export const transmissionsRelations = relations(transmissions, ({ one }) => ({
  invoice: one(invoices, { fields: [transmissions.invoiceId], references: [invoices.id] }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  supplierLink: one(supplierLinks, {
    fields: [invitations.supplierLinkId],
    references: [supplierLinks.id],
  }),
}));

export const supplierLinksRelations = relations(supplierLinks, ({ one, many }) => ({
  supplier: one(suppliers, { fields: [supplierLinks.supplierId], references: [suppliers.id] }),
  organisation: one(organisations, {
    fields: [supplierLinks.organisationId],
    references: [organisations.id],
  }),
  invitations: many(invitations),
}));
