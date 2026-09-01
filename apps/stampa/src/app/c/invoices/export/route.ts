import { getDb } from "@/lib/db/client";
import { requireBuyer } from "@/lib/auth/require";
import { authorise } from "@/lib/auth/policy";
import { track } from "@/lib/analytics";
import { exportInboundCsv } from "@/lib/services/buyer";

/** Generated on demand. Nothing is stored, so nothing can go stale or leak. */
export async function GET() {
  const principal = await requireBuyer();
  authorise(principal, "organisation.read", {
    kind: "organisation",
    organisationId: principal.organisationId,
  });

  const csv = await exportInboundCsv(principal.organisationId);
  const db = await getDb();
  await track(db, "buyer_export_downloaded", { type: "buyer", id: principal.userId });

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="stampa-inbound-${stamp}.csv"`,
    },
  });
}
