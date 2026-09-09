import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * A branded, tabular PDF report -- used for the Staff monthly report export.
 * Kept generic (title + subtitle + column/row table) so other reports can
 * reuse it rather than each hand-rolling jsPDF calls.
 */
export function exportTableToPdf({
  filename,
  title,
  subtitle,
  columns,
  rows,
}: {
  filename: string;
  title: string;
  subtitle?: string;
  columns: string[];
  rows: (string | number)[][];
}) {
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text("Speech Therapy Lab", 14, 15);

  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text(title, 14, 22);
  if (subtitle) {
    doc.setFontSize(9);
    doc.text(subtitle, 14, 28);
  }

  autoTable(doc, {
    startY: subtitle ? 33 : 27,
    head: [columns],
    body: rows.map((row) => row.map(String)),
    headStyles: { fillColor: [15, 118, 110] },
    styles: { fontSize: 9 },
  });

  doc.save(filename);
}
