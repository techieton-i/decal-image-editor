import { useEffect, useState } from "react";
import { templateService, type Template } from "../../services/templateService";
import { fabric } from "fabric";
import { Download, Trash2 } from "lucide-react";
import { MOCK_USER } from "../../constants";

export const TemplateGallery: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  // We need a hidden canvas to generate the final image
  const [helperCanvas, setHelperCanvas] = useState<fabric.Canvas | null>(null);

  useEffect(() => {
    setTemplates(templateService.getTemplates());

    // Setup helper canvas
    const canvasElement = document.createElement("canvas");
    const fCanvas = new fabric.Canvas(canvasElement);
    setHelperCanvas(fCanvas);

    return () => {
      fCanvas.dispose();
    };
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this template?")) {
      templateService.deleteTemplate(id);
      setTemplates(templateService.getTemplates());
    }
  };

  const handleDownload = (template: Template) => {
    if (!helperCanvas) return;

    // Parse the template JSON to extract canvas dimensions
    const templateData =
      typeof template.json === "string"
        ? JSON.parse(template.json)
        : template.json;

    // Set helper canvas dimensions to match the original template
    const canvasWidth =
      templateData.width || templateData.backgroundImage?.width || 800;
    const canvasHeight =
      templateData.height || templateData.backgroundImage?.height || 600;
    helperCanvas.setWidth(canvasWidth);
    helperCanvas.setHeight(canvasHeight);

    // Load template with a reviver to restore custom properties & crossOrigin
    helperCanvas.loadFromJSON(
      template.json,
      () => {
        // Apply Data Binding
        helperCanvas.getObjects().forEach((obj: any) => {
          if (obj.dataBinding) {
            if (obj.dataBinding === "userName") {
              obj.set("text", MOCK_USER.name);
            } else if (obj.dataBinding === "accountNumber") {
              obj.set("text", MOCK_USER.accountNumber);
            }
          }
        });

        // Auto-Credential Stamping
        const text = `User: ${MOCK_USER.name} | Acct: ${MOCK_USER.accountNumber}`;
        const watermark = new fabric.Text(text, {
          fontSize: 16,
          fontFamily: "Inter",
          fill: "#ffffff",
          backgroundColor: "rgba(0,0,0,0.5)",
          left: 10,
          top: canvasHeight - 30,
          selectable: false,
        });
        helperCanvas.add(watermark);

        helperCanvas.renderAll();

        // Export
        const dataURL = helperCanvas.toDataURL({
          format: "png",
          quality: 1,
          multiplier: 2,
        });

        const link = document.createElement("a");
        link.download = `${template.name}-personalized.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      // Reviver: called for each deserialized object
      (jsonObj: any, fabricObj: any) => {
        // Restore the custom dataBinding property
        if (jsonObj.dataBinding) {
          fabricObj.dataBinding = jsonObj.dataBinding;
        }
        // Ensure cross-origin is set for images hosted externally (e.g. Cloudinary)
        if (fabricObj.type === "image") {
          fabricObj.set("crossOrigin", "anonymous");
        }
      },
    );
  };

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Template Gallery
      </h2>

      {templates.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500">
            No templates available. Switch to Banker mode to upload one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-video bg-gray-100 relative group">
                <img
                  src={t.thumbnail}
                  alt={t.name}
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => handleDelete(t.id, e)}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    title="Delete Template"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-1">
                  {t.name}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Created: {new Date(t.createdAt).toLocaleDateString()}
                </p>
                <button
                  onClick={() => handleDownload(t)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
                >
                  <Download size={16} />
                  Download Personalized
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
