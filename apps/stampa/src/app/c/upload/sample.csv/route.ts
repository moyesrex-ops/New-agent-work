import { SAMPLE_CSV } from "@/lib/services/vendor-master";

/** The format guide is a file you can open, not a paragraph describing one. */
export async function GET() {
  return new Response(SAMPLE_CSV, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="stampa-vendor-master-sample.csv"',
    },
  });
}
