const ASSET_PATHS = {
  logoHarunokaze: "/certificate/logo-harunokaze.png",
  logoWiwitan: "/certificate/logo-wiwitan.png",
  signatureAki: "/certificate/signature-aki.png",
} as const;

export type CertificateAssetUrls = {
  logoHarunokaze: string;
  logoWiwitan: string;
  signatureAki: string;
};

async function toDataUrl(path: string): Promise<string> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Gagal memuat aset sertifikat: ${path}`);
  }
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error(`Gagal membaca aset sertifikat: ${path}`));
    };
    reader.onerror = () => reject(new Error(`Gagal membaca aset sertifikat: ${path}`));
    reader.readAsDataURL(blob);
  });
}

/** Convert certificate PNGs to data URIs so HTML/PDF stays self-contained offline (esp. mobile). */
export async function loadCertificateAssetDataUrls(): Promise<CertificateAssetUrls> {
  const [logoHarunokaze, logoWiwitan, signatureAki] = await Promise.all([
    toDataUrl(ASSET_PATHS.logoHarunokaze),
    toDataUrl(ASSET_PATHS.logoWiwitan),
    toDataUrl(ASSET_PATHS.signatureAki),
  ]);
  return { logoHarunokaze, logoWiwitan, signatureAki };
}
