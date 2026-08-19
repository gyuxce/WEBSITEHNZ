import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { loadCertificateAssetDataUrls } from "./certificateAssets";
import { buildCertificateHtml, type CertificateData } from "./certificateHtml";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const RENDER_WIDTH_PX = 900;
const CERTIFICATE_FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Great+Vibes&family=Outfit:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap";

async function ensureCertificateFonts(targetDocument: Document): Promise<void> {
  const existing = targetDocument.querySelector<HTMLLinkElement>(
    `link[data-certificate-fonts="true"]`,
  );
  if (!existing) {
    const link = targetDocument.createElement("link");
    link.rel = "stylesheet";
    link.href = CERTIFICATE_FONT_HREF;
    link.dataset.certificateFonts = "true";
    targetDocument.head.appendChild(link);
    await new Promise<void>((resolve) => {
      link.onload = () => resolve();
      link.onerror = () => resolve();
      // Fallback if the browser never fires load for cached CSS.
      window.setTimeout(() => resolve(), 1500);
    });
  }

  if (targetDocument.fonts?.load) {
    await Promise.all([
      targetDocument.fonts.load("800 34px Outfit"),
      targetDocument.fonts.load("400 56px 'Great Vibes'"),
      targetDocument.fonts.load("400 14px 'Plus Jakarta Sans'"),
    ]).catch(() => undefined);
  }
  if (targetDocument.fonts?.ready) {
    await targetDocument.fonts.ready;
  }
}

function waitForImages(root: ParentNode): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  return Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }),
    ),
  ).then(() => undefined);
}

async function mountCertificateDocument(html: string): Promise<{
  certificateDocument: Document;
  pages: HTMLElement[];
  cleanup: () => void;
}> {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;
  frame.style.cssText = [
    "position:fixed",
    "left:-10000px",
    "top:0",
    "width:" + RENDER_WIDTH_PX + "px",
    "height:" + Math.round((A4_HEIGHT_MM / A4_WIDTH_MM) * RENDER_WIDTH_PX) + "px",
    "opacity:0",
    "pointer-events:none",
    "border:0",
    "z-index:-1",
  ].join(";");

  const loaded = new Promise<void>((resolve) => {
    frame.addEventListener("load", () => resolve(), { once: true });
  });
  frame.srcdoc = html;
  document.body.appendChild(frame);
  await loaded;

  const certificateDocument = frame.contentDocument;
  if (!certificateDocument) {
    frame.remove();
    throw new Error("Dokumen sertifikat tidak dapat dibuat.");
  }

  // The certificate CSS stays inside this frame so it never overrides the portal UI.
  certificateDocument.body.style.background = "#ffffff";
  certificateDocument.body.style.padding = "0";
  certificateDocument.body.style.margin = "0";

  const pages = Array.from(certificateDocument.querySelectorAll<HTMLElement>(".page"));
  for (const page of pages) {
    page.style.boxShadow = "none";
    page.style.borderRadius = "0";
    page.style.margin = "0";
    page.style.maxWidth = "none";
    page.style.width = `${RENDER_WIDTH_PX}px`;
    page.style.minHeight = `${Math.round((A4_HEIGHT_MM / A4_WIDTH_MM) * RENDER_WIDTH_PX)}px`;
  }

  return {
    certificateDocument,
    pages,
    cleanup: () => {
      frame.remove();
    },
  };
}

export async function downloadCertificatePdf(
  data: CertificateData,
  fileName: string,
): Promise<void> {
  const assets = await loadCertificateAssetDataUrls();
  const html = buildCertificateHtml(data, assets);
  const { certificateDocument, pages, cleanup } = await mountCertificateDocument(html);

  try {
    await ensureCertificateFonts(certificateDocument);
    await waitForImages(certificateDocument);
    // Give layout a tick after images/fonts settle.
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

    if (pages.length === 0) {
      throw new Error("Halaman sertifikat tidak ditemukan.");
    }

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    for (let index = 0; index < pages.length; index += 1) {
      const page = pages[index];
      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: RENDER_WIDTH_PX,
        windowWidth: RENDER_WIDTH_PX,
      });

      const imageData = canvas.toDataURL("image/jpeg", 0.92);
      if (index > 0) pdf.addPage();
      pdf.addImage(imageData, "JPEG", 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, undefined, "FAST");
    }

    pdf.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
  } finally {
    cleanup();
  }
}

/** Build a self-contained HTML string (images inlined as data URIs). */
export async function buildSelfContainedCertificateHtml(
  data: CertificateData,
): Promise<string> {
  const assets = await loadCertificateAssetDataUrls();
  return buildCertificateHtml(data, assets);
}
