import { put } from "@vercel/blob";

export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
export const MAX_PHOTOS_PER_MESSAGE = 8;

export class UploadError extends Error {}

/** Store images from a multipart form in Vercel Blob and return their public URLs. */
export async function uploadImages(files: File[], prefix: string): Promise<string[]> {
  const imgs = files.filter((f) => f.size > 0);
  if (!imgs.length) return [];
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new UploadError("Photo storage isn't connected yet.");
  if (imgs.length > MAX_PHOTOS_PER_MESSAGE) throw new UploadError(`Attach up to ${MAX_PHOTOS_PER_MESSAGE} photos at a time.`);
  const urls: string[] = [];
  for (const [i, f] of imgs.entries()) {
    if (!f.type.startsWith("image/")) throw new UploadError("Only photos can be attached.");
    if (f.size > MAX_PHOTO_BYTES) throw new UploadError("One of the photos is too large.");
    const blob = await put(`${prefix}/${Date.now()}-${i}.jpg`, f, { access: "public", contentType: f.type || "image/jpeg", addRandomSuffix: true });
    urls.push(blob.url);
  }
  return urls;
}
