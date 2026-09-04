const PDF_FILENAME = "Alpha-Freight-Directors-Agreement-Final.pdf";

function triggerBlobDownload(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = PDF_FILENAME;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function downloadViaServer(): Promise<boolean> {
  const response = await fetch("/api/directors-agreement/pdf", { method: "GET", cache: "no-store" });
  if (!response.ok) return false;
  const blob = await response.blob();
  if (!blob.size) return false;
  triggerBlobDownload(blob);
  return true;
}

async function loadHtml2Pdf() {
  const mod = await import("html2pdf.js");
  const candidate = mod.default ?? mod;
  if (typeof candidate === "function") return candidate;
  throw new Error("html2pdf module unavailable");
}

async function downloadViaHtml2Pdf(source: HTMLElement): Promise<void> {
  const html2pdf = await loadHtml2Pdf();

  document.body.classList.add("pdf-exporting");
  window.scrollTo(0, 0);

  try {
    await html2pdf()
      .set({
        margin: [12, 14, 14, 14],
        filename: PDF_FILENAME,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: {
          scale: 1.25,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          foreignObjectRendering: false,
          scrollX: 0,
          scrollY: 0,
          windowWidth: source.scrollWidth,
          onclone: (clonedDoc: Document) => {
            clonedDoc.querySelectorAll(".revenue-plan-no-print").forEach((node) => node.remove());
            clonedDoc.querySelectorAll("svg").forEach((svg) => svg.remove());
            clonedDoc.querySelectorAll("a").forEach((anchor) => {
              anchor.removeAttribute("href");
            });
          },
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: {
          mode: ["css", "legacy"],
          before: [".revenue-plan-section--break"],
          after: [".revenue-plan-cover", ".revenue-plan-contents"],
          avoid: [
            ".legal-callout",
            ".legal-confirmation",
            ".legal-signature-card",
            ".revenue-plan-table",
            ".legal-clause-header",
            "tr",
          ],
        },
      })
      .from(source)
      .save();
  } finally {
    document.body.classList.remove("pdf-exporting");
  }
}

export async function downloadDirectorsAgreementPdf(source: HTMLElement): Promise<void> {
  try {
    const serverOk = await downloadViaServer();
    if (serverOk) return;
  } catch {
    // Fall through to client-side generation.
  }

  await downloadViaHtml2Pdf(source);
}
