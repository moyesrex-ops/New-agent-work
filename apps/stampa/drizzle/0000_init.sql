CREATE TABLE "analytics_events" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"actor_type" text NOT NULL,
	"actor_id" text,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_type" text NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"reason" text,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buyer_users" (
	"id" text PRIMARY KEY NOT NULL,
	"organisation_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"role" text DEFAULT 'buyer_admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flags" (
	"id" text PRIMARY KEY NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" text NOT NULL,
	"reason" text NOT NULL,
	"raised_by" text NOT NULL,
	"state" text DEFAULT 'open' NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolution_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"supplier_link_id" text NOT NULL,
	"channel" text DEFAULT 'whatsapp' NOT NULL,
	"sent_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"bound_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_lines" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"position" integer DEFAULT 1 NOT NULL,
	"description" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price_kobo" bigint NOT NULL,
	"vat_basis_points" integer DEFAULT 750 NOT NULL,
	"line_subtotal_kobo" bigint NOT NULL,
	"line_vat_kobo" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"supplier_id" text NOT NULL,
	"organisation_id" text NOT NULL,
	"invoice_number" text NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"subtotal_kobo" bigint NOT NULL,
	"vat_kobo" bigint NOT NULL,
	"total_kobo" bigint NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"irn" text,
	"stamped_at" timestamp with time zone,
	"failure_code" text,
	"failure_fault" text,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organisations" (
	"id" text PRIMARY KEY NOT NULL,
	"legal_name" text NOT NULL,
	"rc_number" text,
	"tin" text NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"plan" text DEFAULT 'pilot' NOT NULL,
	"active_supplier_cap" integer DEFAULT 500 NOT NULL,
	"invite_slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_challenges" (
	"id" text PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"code_hash" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"channel" text DEFAULT 'sms' NOT NULL,
	"consumed_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_links" (
	"id" text PRIMARY KEY NOT NULL,
	"supplier_id" text NOT NULL,
	"organisation_id" text NOT NULL,
	"vendor_code" text,
	"category" text,
	"bank_name" text,
	"bank_last4" text,
	"status" text DEFAULT 'invited' NOT NULL,
	"invited_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"activated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" text PRIMARY KEY NOT NULL,
	"business_name" text NOT NULL,
	"tin" text,
	"address" text DEFAULT '' NOT NULL,
	"phone" text NOT NULL,
	"confirmed_at" timestamp with time zone,
	"suspended_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transmissions" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"attempt" integer DEFAULT 1 NOT NULL,
	"idempotency_key" text NOT NULL,
	"request_hash" text NOT NULL,
	"state" text DEFAULT 'queued' NOT NULL,
	"response_code" text,
	"fault" text,
	"offending_value" text,
	"unmapped_code" boolean DEFAULT false NOT NULL,
	"latency_ms" integer,
	"next_attempt_at" timestamp with time zone,
	"locked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "buyer_users" ADD CONSTRAINT "buyer_users_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_supplier_link_id_supplier_links_id_fk" FOREIGN KEY ("supplier_link_id") REFERENCES "public"."supplier_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_links" ADD CONSTRAINT "supplier_links_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_links" ADD CONSTRAINT "supplier_links_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transmissions" ADD CONSTRAINT "transmissions_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_name_idx" ON "analytics_events" USING btree ("name","created_at");--> statement-breakpoint
CREATE INDEX "audit_subject_idx" ON "audit_events" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "buyer_users_email_idx" ON "buyer_users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_code_idx" ON "invitations" USING btree ("code");--> statement-breakpoint
CREATE INDEX "invoice_lines_invoice_idx" ON "invoice_lines" USING btree ("invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_number_idx" ON "invoices" USING btree ("supplier_id","invoice_number");--> statement-breakpoint
CREATE INDEX "invoices_supplier_idx" ON "invoices" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "invoices_org_idx" ON "invoices" USING btree ("organisation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_irn_idx" ON "invoices" USING btree ("irn");--> statement-breakpoint
CREATE INDEX "otp_phone_idx" ON "otp_challenges" USING btree ("phone","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_idx" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "supplier_links_pair_idx" ON "supplier_links" USING btree ("supplier_id","organisation_id");--> statement-breakpoint
CREATE INDEX "supplier_links_org_idx" ON "supplier_links" USING btree ("organisation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_phone_idx" ON "suppliers" USING btree ("phone");--> statement-breakpoint
CREATE UNIQUE INDEX "transmissions_idempotency_idx" ON "transmissions" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "transmissions_invoice_idx" ON "transmissions" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "transmissions_queue_idx" ON "transmissions" USING btree ("state","next_attempt_at");