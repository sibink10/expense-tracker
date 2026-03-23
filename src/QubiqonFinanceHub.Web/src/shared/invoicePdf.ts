import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import type { Invoice } from "../types";
import type { OrganizationPayload } from "./api/organization";
import InvoiceDocument from "../components/InvoiceDocument";
import { buildDownloadFilename } from "./utils";

type Html2PdfWorker = {
  set: (options: Record<string, unknown>) => Html2PdfWorker;
  from: (source: HTMLElement) => Html2PdfWorker;
  save: () => Promise<void>;
};

type Html2PdfFactory = () => Html2PdfWorker;

async function waitForPaint(): Promise<void> {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  );
}

export async function downloadInvoicePdf(inv: Invoice, org?: OrganizationPayload | null): Promise<void> {
  const host = document.createElement("div");
  host.style.position = "absolute";
  host.style.left = "0";
  host.style.top = "0";
  host.style.transform = "translateX(-200vw)";
  host.style.width = "1120px";
  host.style.padding = "24px";
  host.style.background = "#ffffff";
  host.style.pointerEvents = "none";
  host.style.overflow = "hidden";
  document.body.appendChild(host);

  const captureNode = document.createElement("div");
  captureNode.style.width = "100%";
  host.appendChild(captureNode);

  const root = createRoot(captureNode);

  try {
    flushSync(() => {
      root.render(createElement(InvoiceDocument, { invoice: inv, organization: org, hideStatusRibbon: true }));
    });

    await waitForPaint();
    await waitForImages(captureNode);
    await waitForPaint();

    const html2pdf = (await import("html2pdf.js")).default as Html2PdfFactory;
    await html2pdf()
      .set({
        filename: buildDownloadFilename(inv.id, `${inv.id}.pdf`, ".pdf"),
        margin: [6, 6, 6, 6],
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
        },
        pagebreak: {
          mode: ["css", "legacy"],
        },
      })
      .from(captureNode)
      .save();
  } finally {
    root.unmount();
    host.remove();
  }
}
