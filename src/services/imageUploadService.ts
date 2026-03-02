const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "";

export interface UploadResult {
  url: string;
  publicId: string;
}

/**
 * Service for uploading images to Cloudinary.
 * Falls back to keeping Base64 if credentials are not configured.
 */
export const imageUploadService = {
  isConfigured: (): boolean => {
    return Boolean(CLOUD_NAME && UPLOAD_PRESET);
  },

  /**
   * Upload a single Base64 data URL string to Cloudinary.
   * Returns the Cloudinary HTTPS URL, or the original Base64 if not configured.
   */
  uploadBase64: async (base64DataUrl: string): Promise<string> => {
    if (!imageUploadService.isConfigured()) {
      console.warn(
        "Cloudinary not configured. Keeping Base64. " +
          "Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env",
      );
      return base64DataUrl;
    }

    const formData = new FormData();
    formData.append("file", base64DataUrl);
    formData.append("upload_preset", UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Cloudinary upload failed:", errorBody);
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url;
  },

  /**
   * Process a Fabric.js canvas JSON string:
   * - Find all image objects with Base64 `src`
   * - Upload each to Cloudinary
   * - Replace the Base64 src with the Cloudinary URL
   * - Return the updated JSON string
   */
  processCanvasJSON: async (jsonString: string): Promise<string> => {
    const canvasData = JSON.parse(jsonString);

    if (!canvasData.objects || !Array.isArray(canvasData.objects)) {
      return jsonString;
    }

    // Find all image objects with base64 sources
    const uploadPromises = canvasData.objects.map(
      async (obj: Record<string, unknown>) => {
        if (obj.type === "image" && typeof obj.src === "string") {
          const src = obj.src as string;
          if (src.startsWith("data:image")) {
            try {
              const cloudinaryUrl = await imageUploadService.uploadBase64(src);
              obj.src = cloudinaryUrl;
              // Set crossOrigin so the image can be exported later
              obj.crossOrigin = "anonymous";
            } catch (err) {
              console.error("Failed to upload image, keeping Base64:", err);
              // Keep original Base64 on failure
            }
          }
        }
        return obj;
      },
    );

    await Promise.all(uploadPromises);

    return JSON.stringify(canvasData);
  },
};
