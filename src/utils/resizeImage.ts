/**
 * Downscales and re-compresses an image file into a small square JPEG data
 * URL — there's no hosted file storage wired up yet, so a photo is stored
 * (and re-sent on every list that shows it) as this string directly. An
 * unresized upload near the old 512KB cap, multiplied across a page of
 * rows that each join their staff member's photo, is what made pages that
 * show several avatars at once slow to fetch; an avatar is never shown
 * larger than a hundred-odd pixels on screen, so there's nothing lost by
 * always storing one that size.
 *
 * Cover-crops to a square first so every avatar frames consistently
 * regardless of the source photo's aspect ratio.
 */
export function resizeImageToDataUrl(
  file: File,
  { maxDimension = 160, quality = 0.82 }: { maxDimension?: number; quality?: number } = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That doesn't look like a valid image."));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = maxDimension;
        canvas.height = maxDimension;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Couldn't process that image."));
          return;
        }
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, maxDimension, maxDimension);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
