import { useEffect, useState } from "react";
import { fabric } from "fabric";
import { Download, Link as LinkIcon, UploadCloud, Loader2 } from "lucide-react";
import { templateService } from "../../services/templateService";
import { MOCK_USER } from "../../constants";

interface PropertiesPanelProps {
  canvas: fabric.Canvas | null;
}

interface FabricObjectWithBinding extends fabric.Object {
  dataBinding?: string;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ canvas }) => {
  const [selectedObject, setSelectedObject] =
    useState<FabricObjectWithBinding | null>(null);
  const [color, setColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState("Inter");
  const [allTextObjects, setAllTextObjects] = useState<fabric.IText[]>([]);
  const includeCredentials = false;
  const [templateName, setTemplateName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Function to refresh list of text objects
  const refreshTextObjects = () => {
    if (!canvas) return;
    const texts = canvas
      .getObjects()
      .filter(
        (o) => o.type === "i-text" || o.type === "text" || o.type === "textbox",
      ) as fabric.IText[];
    setAllTextObjects(texts);
  };

  useEffect(() => {
    if (!canvas) return;

    const handleSelection = () => {
      const activeObj = canvas.getActiveObject() as FabricObjectWithBinding;
      setSelectedObject(activeObj);

      if (activeObj) {
        if (activeObj.fill && typeof activeObj.fill === "string") {
          setColor(activeObj.fill);
        }
        if ((activeObj as fabric.IText).fontSize) {
          setFontSize((activeObj as fabric.IText).fontSize || 24);
        }
        if ((activeObj as fabric.IText).fontFamily) {
          setFontFamily((activeObj as fabric.IText).fontFamily || "Inter");
        }
      } else {
        setSelectedObject(null);
        refreshTextObjects();
      }
    };

    canvas.on("selection:created", handleSelection);
    canvas.on("selection:updated", handleSelection);
    canvas.on("selection:cleared", handleSelection);
    canvas.on("object:modified", () => {
      handleSelection();
      refreshTextObjects();
    });
    canvas.on("object:added", refreshTextObjects);
    canvas.on("object:removed", refreshTextObjects);

    refreshTextObjects();

    return () => {
      canvas.off("selection:created", handleSelection);
      canvas.off("selection:updated", handleSelection);
      canvas.off("selection:cleared", handleSelection);
      canvas.off("object:modified");
      canvas.off("object:added", refreshTextObjects);
      canvas.off("object:removed", refreshTextObjects);
    };
  }, [canvas]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setColor(newColor);

    if (selectedObject && canvas) {
      selectedObject.set("fill", newColor);
      canvas.requestRenderAll();
    }
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(e.target.value, 10);
    setFontSize(newSize);

    if (selectedObject && (selectedObject as fabric.IText).set && canvas) {
      if (
        selectedObject.type === "i-text" ||
        selectedObject.type === "text" ||
        selectedObject.type === "textbox"
      ) {
        (selectedObject as fabric.IText).set("fontSize", newSize);
        canvas.requestRenderAll();
      }
    }
  };

  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFont = e.target.value;
    setFontFamily(newFont);

    if (selectedObject && (selectedObject as fabric.IText).set && canvas) {
      if (
        selectedObject.type === "i-text" ||
        selectedObject.type === "text" ||
        selectedObject.type === "textbox"
      ) {
        (selectedObject as fabric.IText).set("fontFamily", newFont);
        canvas.requestRenderAll();
      }
    }
  };

  const handleBindingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const binding = e.target.value;
    if (selectedObject && canvas) {
      // Store the binding on the object
      (selectedObject as FabricObjectWithBinding).dataBinding = binding;

      // Visual feedback
      if (binding === "userName") {
        (selectedObject as fabric.IText).set("text", "{{Customer Name}}");
      } else if (binding === "accountNumber") {
        (selectedObject as fabric.IText).set("text", "{{Account Number}}");
      }

      canvas.requestRenderAll();
      // Force update
      setSelectedObject({ ...selectedObject } as FabricObjectWithBinding);
    }
  };

  const handleExport = () => {
    if (!canvas) return;

    let watermark: fabric.Text | null = null;

    // 1. Auto-Stamp Credentials Logic (Bottom Left)
    if (includeCredentials) {
      const text = `User: ${MOCK_USER.name} | Acct: ${MOCK_USER.accountNumber}`;
      watermark = new fabric.Text(text, {
        fontSize: 16,
        fontFamily: "Inter",
        fill: "#ffffff",
        backgroundColor: "rgba(0,0,0,0.5)",
        left: 10,
        top: (canvas.height || 0) - 30,
        selectable: false,
        evented: false,
      });
      canvas.add(watermark);
    }

    // 2. Data Binding Substitution Logic
    const objects = canvas.getObjects() as FabricObjectWithBinding[];
    const originalTexts: Map<FabricObjectWithBinding, string> = new Map();

    objects.forEach((obj) => {
      if (
        obj.dataBinding &&
        (obj.type === "i-text" || obj.type === "text" || obj.type === "textbox")
      ) {
        const textObj = obj as fabric.IText;
        originalTexts.set(obj, textObj.text || "");

        if (obj.dataBinding === "userName") {
          textObj.text = MOCK_USER.name; // User correct property assignment
        } else if (obj.dataBinding === "accountNumber") {
          textObj.text = MOCK_USER.accountNumber;
        }
      }
    });

    canvas.renderAll();

    // Generate Image
    const dataURL = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2,
    });

    // Revert Changes
    if (watermark) {
      canvas.remove(watermark);
    }

    objects.forEach((obj) => {
      if (originalTexts.has(obj)) {
        (obj as fabric.IText).set("text", originalTexts.get(obj));
      }
    });

    canvas.renderAll();

    // Download
    const link = document.createElement("a");
    link.download = "design.png";
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveTemplate = async () => {
    if (!canvas) return;
    if (!templateName) {
      alert("Please enter a template name");
      return;
    }

    setIsSaving(true);

    try {
      // Generate thumbnail
      const thumbnail = canvas.toDataURL({
        format: "png",
        quality: 0.5,
        multiplier: 0.2, // Small thumbnail
      });

      // Get JSON with custom properties included
      const json = JSON.stringify(canvas.toJSON(["dataBinding"]));

      // saveTemplate now uploads Base64 images to Cloudinary before storing
      await templateService.saveTemplate({
        name: templateName,
        thumbnail,
        json,
      });

      alert("Template uploaded successfully!");
      setTemplateName("");
    } catch (error) {
      console.error("Failed to save template:", error);
      alert("Failed to save template. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedObject) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="panel-title mb-0">Template Fields</h3>
        </div>

        {allTextObjects.length === 0 ? (
          <div className="text-gray-400 text-sm text-center p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            No text fields on canvas. Add text to see editable fields here.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Simplified view for Banker - show bindings if any */}
            {allTextObjects.map((textObj, idx) => {
              const binding = (textObj as FabricObjectWithBinding).dataBinding;
              return (
                <div key={idx} className="control-group">
                  <label className="control-label flex justify-between">
                    <span>Text Field {idx + 1}</span>
                    {binding && (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                        Linked: {binding}
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={textObj.text}
                    onChange={(e) => {
                      if (!canvas) return;
                      textObj.set("text", e.target.value);
                      canvas.requestRenderAll();
                      refreshTextObjects(); // Force re-render of this list
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100">
          <h3 className="panel-title">Actions</h3>

          {/* Template Saver for Banker */}
          <div className="mb-6">
            <label className="control-label">Template Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. Monthly Statement"
                className="input-field"
              />
              <button
                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center transition-colors"
                onClick={handleSaveTemplate}
                disabled={isSaving}
                title={isSaving ? "Uploading..." : "Upload as Template"}
                style={{ opacity: isSaving ? 0.6 : 1 }}
              >
                {isSaving ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <UploadCloud size={20} />
                )}
              </button>
            </div>
          </div>

          <button
            className="w-full py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors shadow-sm"
            onClick={handleExport}
          >
            <Download size={18} />
            Quick Export
          </button>
        </div>
      </div>
    );
  }

  const isText =
    selectedObject.type === "i-text" ||
    selectedObject.type === "text" ||
    selectedObject.type === "textbox";

  return (
    <div>
      <h3 className="panel-title">Properties</h3>

      {/* ... properties controls ... */}
      <div className="panel-section">
        <div className="control-group">
          <label className="control-label">Fill Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={handleColorChange}
              className="w-8 h-8 rounded cursor-pointer border-0 p-0"
            />
            <input
              type="text"
              value={color}
              onChange={handleColorChange}
              className="input-field"
            />
          </div>
        </div>

        <div className="control-group">
          {/* Opacity slider */}
          <label className="control-label">Opacity</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            defaultValue={selectedObject.opacity || 1}
            onChange={(e) => {
              selectedObject.set("opacity", parseFloat(e.target.value));
              canvas?.requestRenderAll();
            }}
            className="w-full"
          />
        </div>
      </div>

      {isText && (
        <div className="panel-section">
          <h3 className="panel-title">Text Style</h3>

          {/* New Data Binding Section */}
          <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <LinkIcon size={16} className="text-green-600" />
              <span className="text-sm font-medium text-green-900">
                Data Binding
              </span>
            </div>
            <p className="text-xs text-green-700 mb-2">
              Bind to user data for auto-fill templates.
            </p>
            <select
              value={
                (selectedObject as FabricObjectWithBinding).dataBinding || ""
              }
              onChange={handleBindingChange}
              className="input-field bg-white"
            >
              <option value="">None (Static Text)</option>
              <option value="userName">Customer Name</option>
              <option value="accountNumber">Account Number</option>
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">Font Size</label>
            <input
              type="number"
              value={fontSize}
              onChange={handleFontSizeChange}
              className="input-field"
            />
          </div>

          <div className="control-group">
            <label className="control-label">Font Family</label>
            <select
              value={fontFamily}
              onChange={handleFontFamilyChange}
              className="input-field"
            >
              {/* Font options */}
              <option value="Inter">Inter</option>
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Georgia">Georgia</option>
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">Styles</label>
            <div className="flex gap-2">
              {/* Style buttons */}
              <button
                className={`p-2 border rounded ${(selectedObject as fabric.IText).fontWeight === "bold" ? "bg-indigo-100 text-indigo-700" : "text-gray-600"}`}
                onClick={() => {
                  const current = (selectedObject as fabric.IText).fontWeight;
                  (selectedObject as fabric.IText).set(
                    "fontWeight",
                    current === "bold" ? "normal" : "bold",
                  );
                  canvas?.requestRenderAll();
                  setSelectedObject({
                    ...selectedObject,
                  } as FabricObjectWithBinding);
                }}
              >
                B
              </button>
              <button
                className={`p-2 border rounded ${(selectedObject as fabric.IText).fontStyle === "italic" ? "bg-indigo-100 text-indigo-700" : "text-gray-600"}`}
                onClick={() => {
                  const current = (selectedObject as fabric.IText).fontStyle;
                  (selectedObject as fabric.IText).set(
                    "fontStyle",
                    current === "italic" ? "normal" : "italic",
                  );
                  canvas?.requestRenderAll();
                  setSelectedObject({
                    ...selectedObject,
                  } as FabricObjectWithBinding);
                }}
              >
                I
              </button>
              <button
                className={`p-2 border rounded ${(selectedObject as fabric.IText).underline ? "bg-indigo-100 text-indigo-700" : "text-gray-600"}`}
                onClick={() => {
                  const current = (selectedObject as fabric.IText).underline;
                  (selectedObject as fabric.IText).set("underline", !current);
                  canvas?.requestRenderAll();
                  setSelectedObject({
                    ...selectedObject,
                  } as FabricObjectWithBinding);
                }}
              >
                U
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-gray-100">
        {/* Export/Save action area */}
        <h3 className="panel-title">Actions</h3>

        <div className="mb-6">
          <label className="control-label">Template Name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. Monthly Statement"
              className="input-field"
            />
            <button
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center transition-colors"
              onClick={handleSaveTemplate}
              disabled={isSaving}
              title={isSaving ? "Uploading..." : "Upload as Template"}
              style={{ opacity: isSaving ? 0.6 : 1 }}
            >
              {isSaving ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <UploadCloud size={20} />
              )}
            </button>
          </div>
        </div>

        <button
          className="w-full py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors shadow-sm"
          onClick={handleExport}
        >
          <Download size={18} />
          Quick Export
        </button>
      </div>
    </div>
  );
};
