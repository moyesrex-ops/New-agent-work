"use client";

import { useEffect } from "react";

const KEY = "stampa.invoice-draft.v1";

/**
 * Holds the new-invoice form in localStorage so a dropped network does not
 * wipe what the supplier already typed. The server still owns the draft once
 * they tap Review.
 */
export function InvoiceDraftPersist({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    const form = document.querySelector("form");
    if (!form) return;

    const description = form.querySelector<HTMLInputElement>("[name=description]");
    const quantity = form.querySelector<HTMLInputElement>("[name=quantity]");
    const unitPrice = form.querySelector<HTMLInputElement>("[name=unitPrice]");
    if (!description || !quantity || !unitPrice) return;

    try {
      const saved = localStorage.getItem(KEY);
      if (saved && !description.value) {
        const parsed = JSON.parse(saved) as { description?: string; quantity?: string; unitPrice?: string };
        if (parsed.description) description.value = parsed.description;
        if (parsed.quantity) quantity.value = parsed.quantity;
        if (parsed.unitPrice) unitPrice.value = parsed.unitPrice;
      }
    } catch {
      localStorage.removeItem(KEY);
    }

    const persist = () => {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          description: description.value,
          quantity: quantity.value,
          unitPrice: unitPrice.value,
        }),
      );
    };
    const clear = () => localStorage.removeItem(KEY);

    form.addEventListener("input", persist);
    form.addEventListener("submit", clear);
    return () => {
      form.removeEventListener("input", persist);
      form.removeEventListener("submit", clear);
    };
  }, [enabled]);

  return null;
}
