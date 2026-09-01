/**
 * A minimal PDF 1.4 writer (ticket T-02).
 *
 * The architecture review cut object storage on the grounds that a stamped
 * invoice is deterministically regenerable from its rows. That only holds if
 * generating one is cheap, so this uses the base-14 fonts every reader has
 * built in: no headless browser, no font embedding, no dependency, and it
 * renders identically in Chrome, Adobe Reader and Gmail's viewer because
 * there is nothing in it for them to disagree about.
 *
 * A4 at 72dpi is 595 x 842 points. The origin is bottom-left.
 */

export const PAGE_WIDTH = 595;
export const PAGE_HEIGHT = 842;

export type Font = "regular" | "bold" | "mono";

const FONT_KEY: Record<Font, string> = { regular: "F1", bold: "F2", mono: "F3" };

type Op =
  | { kind: "text"; x: number; y: number; size: number; font: Font; value: string }
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number; width: number }
  | { kind: "rect"; x: number; y: number; w: number; h: number; width: number };

/** WinAnsi has no glyph for most of what a paste can contain. Keep to ASCII. */
function escapeText(value: string): string {
  return value
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

export class Pdf {
  private readonly ops: Op[] = [];

  text(value: string, x: number, y: number, size = 10, font: Font = "regular"): this {
    this.ops.push({ kind: "text", x, y, size, font, value });
    return this;
  }

  /** Right-aligned text. Widths use the base-14 average, which is close enough
   *  for a column of tabular figures in Courier and near enough in Helvetica. */
  textRight(value: string, right: number, y: number, size = 10, font: Font = "regular"): this {
    const perChar = font === "mono" ? 0.6 : 0.5;
    return this.text(value, right - value.length * size * perChar, y, size, font);
  }

  rule(y: number, x1 = 48, x2 = PAGE_WIDTH - 48, width = 0.5): this {
    this.ops.push({ kind: "line", x1, y1: y, x2, y2: y, width });
    return this;
  }

  box(x: number, y: number, w: number, h: number, width = 0.8): this {
    this.ops.push({ kind: "rect", x, y, w, h, width });
    return this;
  }

  private content(): string {
    const parts: string[] = [];
    for (const op of this.ops) {
      if (op.kind === "text") {
        parts.push(
          `BT /${FONT_KEY[op.font]} ${op.size} Tf ${op.x.toFixed(2)} ${op.y.toFixed(2)} Td (${escapeText(op.value)}) Tj ET`,
        );
      } else if (op.kind === "line") {
        parts.push(
          `${op.width} w ${op.x1.toFixed(2)} ${op.y1.toFixed(2)} m ${op.x2.toFixed(2)} ${op.y2.toFixed(2)} l S`,
        );
      } else {
        parts.push(
          `${op.width} w ${op.x.toFixed(2)} ${op.y.toFixed(2)} ${op.w.toFixed(2)} ${op.h.toFixed(2)} re S`,
        );
      }
    }
    return parts.join("\n");
  }

  build(): Buffer {
    const stream = this.content();
    const objects = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
        "/Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> >> /Contents 4 0 R >>",
      `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`,
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>",
    ];

    let body = "%PDF-1.4\n";
    const offsets: number[] = [];
    objects.forEach((object, index) => {
      offsets.push(Buffer.byteLength(body, "latin1"));
      body += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });

    const xrefOffset = Buffer.byteLength(body, "latin1");
    let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (const offset of offsets) xref += `${offset.toString().padStart(10, "0")} 00000 n \n`;

    const trailer =
      `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

    return Buffer.from(body + xref + trailer, "latin1");
  }
}
