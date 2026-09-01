import { Button } from "@/components/Button";
import { Card, DataTable, EmptyState } from "@/components/Surfaces";
import { requireOperator } from "@/lib/auth/require";
import { copy, formatDateTime } from "@/lib/copy";
import { auditTrail } from "@/lib/services/operator";
import { signOutOperator } from "../actions";
import shell from "@/components/shell.module.css";

export const dynamic = "force-dynamic";

/** O6 Audit log. Append-only, read in reverse. */
export default async function Audit() {
  await requireOperator();
  const events = await auditTrail();

  return (
    <>
      <h1 className={shell.title}>{copy.operator.auditHeading}</h1>
      <p className={shell.note} style={{ marginBottom: "var(--space-5)" }}>
        Newest first. There is no delete path for this table anywhere in the codebase.
      </p>

      <DataTable
        caption="Audit events"
        rows={events}
        limit={200}
        empty={<EmptyState heading="Nothing recorded yet." />}
        columns={[
          { key: "when", header: "When", render: (row) => formatDateTime(row.createdAt) },
          { key: "action", header: "Action", render: (row) => row.action },
          {
            key: "actor",
            header: "Who",
            render: (row) => `${row.actorType}${row.actorId ? ` ${row.actorId}` : ""}`,
          },
          {
            key: "subject",
            header: "Subject",
            render: (row) => `${row.subjectType} ${row.subjectId}`,
          },
          { key: "reason", header: "Reason", render: (row) => row.reason ?? "—" },
        ]}
      />

      <Card>
        <form action={signOutOperator}>
          <Button type="submit" variant="quiet">
            Sign out
          </Button>
        </form>
      </Card>
    </>
  );
}
