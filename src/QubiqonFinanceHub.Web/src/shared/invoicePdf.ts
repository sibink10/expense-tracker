import type { Invoice } from "../types";
import { fmtCur } from "./utils";

/**
 * Generate a PDF from invoice details and trigger download.
 * Uses dynamic import so jspdf is only loaded when needed.
 */
export async function downloadInvoicePdf(inv: Invoice): Promise<void> {
  const mod = await import("jspdf");
  const JsPDF = mod.default || (mod as { jsPDF: typeof mod.default }).jsPDF;
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(18);
  doc.text("INVOICE", 20, y);
  y += 10;

  doc.setFontSize(10);
  doc.text(`# ${inv.id}`, 20, y);
  y += 6;

  doc.text(`Date: ${inv.invDate}`, 20, y);
  doc.text(`Due: ${inv.due}`, 100, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.text("Bill To", 20, y);
  doc.setFont("helvetica", "normal");
  y += 6;
  doc.text(inv.cName, 20, y);
  y += 5;
  if (inv.cEmail) {
    doc.text(inv.cEmail, 20, y);
    y += 5;
  }
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.text("Line Items", 20, y);
  doc.setFont("helvetica", "normal");
  y += 8;

  const colW = [70, 15, 20, 25, 25, 30];
  const headers = ["Description", "HSN", "Qty", "Rate", "GST Amt", "Amount"];
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(headers[0], 20, y);
  doc.text(headers[1], 20 + colW[0], y);
  doc.text(headers[2], 20 + colW[0] + colW[1], y);
  doc.text(headers[3], 20 + colW[0] + colW[1] + colW[2], y);
  doc.text(headers[4], 20 + colW[0] + colW[1] + colW[2] + colW[3], y);
  doc.text(headers[5], 20 + colW[0] + colW[1] + colW[2] + colW[3] + colW[4], y);
  y += 6;
  doc.setFont("helvetica", "normal");

  for (const it of inv.items) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    const lineAmt = it.qty * it.rate + it.gstAmt;
    doc.text(it.desc.slice(0, 35), 20, y);
    doc.text(it.hsn, 20 + colW[0], y);
    doc.text(String(it.qty), 20 + colW[0] + colW[1], y);
    doc.text(fmtCur(it.rate, inv.currency), 20 + colW[0] + colW[1] + colW[2], y);
    doc.text(fmtCur(it.gstAmt, inv.currency), 20 + colW[0] + colW[1] + colW[2] + colW[3], y);
    doc.text(fmtCur(lineAmt, inv.currency), 20 + colW[0] + colW[1] + colW[2] + colW[3] + colW[4], y);
    y += 6;
  }

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ${fmtCur(inv.total, inv.currency)}`, pageW - 20, y, { align: "right" });
  doc.setFont("helvetica", "normal");

  if (inv.notes && y < 260) {
    y += 10;
    doc.setFontSize(9);
    doc.text("Notes: " + inv.notes.slice(0, 80), 20, y);
  }

  doc.save(`invoice-${inv.id}.pdf`);
}
