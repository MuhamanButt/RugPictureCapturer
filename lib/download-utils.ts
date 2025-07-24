import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { Rug } from "./rug-storage";

async function downloadImageAsBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
  return response.blob();
}

export async function downloadAsZip(rug: Rug) {
  const zip = new JSZip();

  // Add images to zip
  for (let i = 0; i < rug.images.length; i++) {
    const image = rug.images[i];
    try {
      const blob = await downloadImageAsBlob(image.secureUrl);
      zip.file(`${rug.id}_${i + 1}.jpg`, blob);
    } catch (e) {
      console.error(`Failed to download image ${i + 1}:`, e);
    }
  }

  // Generate zip file blob
  const content = await zip.generateAsync({ type: "blob" });

  // Trigger download
  saveAs(content, `${rug.id}.zip`);
}

export async function downloadAllAsZip(rugs: Rug[]) {
  const zip = new JSZip();

  for (const rug of rugs) {
    const folder = zip.folder(rug.id) ?? zip;
    for (let i = 0; i < rug.images.length; i++) {
      try {
        const blob = await downloadImageAsBlob(rug.images[i].secureUrl);
        folder.file(`${rug.id}_${i + 1}.jpg`, blob);
      } catch (e) {
        console.error(`Failed to download image ${rug.id}_${i + 1}:`, e);
      }
    }
  }

  const content = await zip.generateAsync({ type: "blob" });

  saveAs(content, "all_rugs.zip");
}
