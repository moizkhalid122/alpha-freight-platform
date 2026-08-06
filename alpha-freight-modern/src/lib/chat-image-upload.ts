const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const COMPRESS_THRESHOLD_BYTES = 1.25 * 1024 * 1024;
const MAX_DIMENSION = 1600;

export const CHAT_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function isAcceptedChatImage(file: File): boolean {
  return ACCEPTED_IMAGE_TYPES.has(file.type) && file.size <= MAX_FILE_BYTES;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read image file"));
    reader.readAsDataURL(file);
  });
}

function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not process image"));
        return;
      }

      ctx.drawImage(image, 0, 0, width, height);
      const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
      const quality = mime === "image/jpeg" ? 0.86 : undefined;
      resolve(canvas.toDataURL(mime, quality));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not load image"));
    };

    image.src = objectUrl;
  });
}

export async function readChatImageFile(file: File): Promise<string> {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Please upload a JPG, PNG, WEBP, or GIF image.");
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Image is too large. Maximum size is 8 MB.");
  }

  if (file.size > COMPRESS_THRESHOLD_BYTES) {
    return compressImageFile(file);
  }

  return readFileAsDataUrl(file);
}

export function isValidImageDataUrl(value: string): boolean {
  return /^data:image\/(jpeg|png|webp|gif);base64,/i.test(value.trim());
}

export const DEFAULT_CHAT_IMAGE_PROMPT =
  "Please analyze this image and explain what you see. If it relates to UK freight, logistics, POD, delivery documents, vehicles, or loads, give practical guidance.";
