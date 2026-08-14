import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { loadCertificateAssetDataUrls } from "./certificateAssets";
import { buildCertificateHtml, type CertificateData } from "./certificateHtml";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const RENDER_WIDTH_PX = 900;
const CERTIFICATE_FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Great+Vibes&family=Outfit:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap";

async function ensureCertificateFonts(): Promise<void> {
  const existing = document.querySelector<HTMLLinkElement>(
    `link[data-certificate-fonts="true"]`,
  );
  if (!existing) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = CERTIFICATE_FONT_HREF;
    link.dataset.certificateFonts = "true";
    document.head.appendChild(link);
    await new Promise<void>((resolve) => {
      link.onload = () => resolve();
      link.onerror = () => resolve();
      // Fallback if the browser never fires load for cached CSS.
      window.setTimeout(() => resolve(), 1500);
    });
  }

  if (document.fonts?.load) {
    await Promise.all([
      document.fonts.load("800 34px Outfit"),
      document.fonts.load("400 56px 'Great Vibes'"),
      document.fonts.load("400 14px 'Plus Jakarta Sans'"),
    ]).catch(() => undefined);
  }
  if (document.fonts?.ready) {
    await document.fonts.ready;
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

function mountCertificateDocument(html: string): {
  host: HTMLDivElement;
  pages: HTMLElement[];
  cleanup: () => void;
} {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = [
    "position:fixed",
    "left:-10000px",
    "top:0",
    "width:" + RENDER_WIDTH_PX + "px",
    "opacity:0",
    "pointer-events:none",
    "z-index:-1",
  ].join(";");

  const doc = new DOMParser().parseFromString(html, "text/html");
  const styleTags = Array.from(doc.head.querySelectorAll("style"));
  for (const style of styleTags) {
    host.appendChild(style.cloneNode(true));
  }

  const bodyClone = doc.body.cloneNode(true) as HTMLElement;
  // Capture layout must stay light/consistent for html2canvas.
  bodyClone.style.background = "#ffffff";
  bodyClone.style.padding = "0";
  bodyClone.style.margin = "0";
  host.appendChild(bodyClone);
  document.body.appendChild(host);

  const pages = Array.from(host.querySelectorAll<HTMLElement>(".page"));
  for (const page of pages) {
    page.style.boxShadow = "none";
    page.style.borderRadius = "0";
    page.style.margin = "0";
    page.style.maxWidth = "none";
    page.style.width = `${RENDER_WIDTH_PX}px`;
    page.style.minHeight = `${Math.round((A4_HEIGHT_MM / A4_WIDTH_MM) * RENDER_WIDTH_PX)}px`;
  }

  return {
    host,
    pages,
    cleanup: () => {
      host.remove();
    },
  };
}

export async function downloadCertificatePdf(
  data: CertificateData,
  fileName: string,
): Promise<void> {
  await ensureCertificateFonts();
  const assets = await loadCertificateAssetDataUrls();
  const html = buildCertificateHtml(data, assets);
  const { host, pages, cleanup } = mountCertificateDocument(html);

  try {
    await waitForImages(host);
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
