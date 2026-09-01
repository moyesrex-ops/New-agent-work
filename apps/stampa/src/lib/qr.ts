import QRCode from "qrcode";

/**
 * QR for the stamp card. Rendered to an inline SVG string on the server: no
 * client library, no image request, and it prints correctly in mono on a
 * thermal slip.
 *
 * The payload is the NRS verification URL, never a Stampa URL. We hand the
 * user the means to check us, which is the only durable way to be believed
 * (Trust script, mechanism 8).
 */
export async function qrSvg(payload: string, size = 62): Promise<string | null> {
  try {
    const svg = await QRCode.toString(payload, {
      type: "svg",
      margin: 0,
      errorCorrectionLevel: "M",
      color: { dark: "#14121A", light: "#FFFFFF" },
    });
    return svg
      .replace(/<\?xml[^>]*\?>/, "")
      .replace(/width="[^"]*"/, `width="${size}"`)
      .replace(/height="[^"]*"/, `height="${size}"`);
  } catch {
    // S9 edge case: if the QR fails to render, show the IRN large instead of
    // an empty box. Never a broken image where proof should be.
    return null;
  }
}
