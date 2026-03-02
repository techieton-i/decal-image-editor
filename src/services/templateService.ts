import { v4 as uuidv4 } from "uuid";
import { imageUploadService } from "./imageUploadService";

export interface Template {
  id: string;
  name: string;
  thumbnail: string;
  json: string; // Fabric JSON string
  createdAt: number;
}

const STORAGE_KEY = "canvas_editor_templates";

export const templateService = {
  /**
   * Save a template. Before storing, all Base64 image sources
   * in the canvas JSON are uploaded to Cloudinary and replaced with URLs.
   */
  saveTemplate: async (
    template: Omit<Template, "id" | "createdAt">,
  ): Promise<Template> => {
    // Upload Base64 images in the JSON to Cloudinary
    const processedJson = await imageUploadService.processCanvasJSON(
      template.json,
    );

    // Also upload the thumbnail
    const processedThumbnail = await imageUploadService.uploadBase64(
      template.thumbnail,
    );

    const templates = templateService.getTemplates();
    const newTemplate: Template = {
      ...template,
      json: processedJson,
      thumbnail: processedThumbnail,
      id: uuidv4(),
      createdAt: Date.now(),
    };

    templates.push(newTemplate);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    return newTemplate;
  },

  getTemplates: (): Template[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  getTemplateById: (id: string): Template | undefined => {
    const templates = templateService.getTemplates();
    return templates.find((t) => t.id === id);
  },

  deleteTemplate: (id: string): void => {
    const templates = templateService.getTemplates().filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  },
};
