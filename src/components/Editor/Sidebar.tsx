import { fabric } from "fabric";
import { Type, Image as ImageIcon, Square, Circle } from "lucide-react";

interface SidebarProps {
  canvas: fabric.Canvas | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ canvas }) => {
  const addText = () => {
    if (!canvas) return;
    const text = new fabric.Textbox("Double click to edit", {
      left: 100,
      top: 100,
      fontFamily: "Inter",
      fill: "#333",
      fontSize: 24,
      width: 300,
      splitByGrapheme: true,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const addRectangle = () => {
    if (!canvas) return;
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      fill: "#6366f1",
      width: 100,
      height: 100,
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  };

  const addCircle = () => {
    if (!canvas) return;
    const circle = new fabric.Circle({
      left: 100,
      top: 100,
      fill: "#ec4899",
      radius: 50,
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
  };

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !e.target.files || !e.target.files[0]) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgObj = new Image();
      imgObj.src = event.target?.result as string;
      imgObj.onload = () => {
        const imgInstance = new fabric.Image(imgObj);

        // Scale down if too big
        if (imgInstance.width && imgInstance.width > 300) {
          imgInstance.scaleToWidth(300);
        }

        canvas.add(imgInstance);
        canvas.centerObject(imgInstance);
        canvas.setActiveObject(imgInstance);
        canvas.renderAll();
      };
    };
    reader.readAsDataURL(e.target.files[0]);
    // Reset input
    e.target.value = "";
  };

  return (
    <>
      <button className="tool-button" onClick={addText} title="Add Text">
        <Type size={24} />
      </button>

      <button
        className="tool-button"
        onClick={addRectangle}
        title="Add Rectangle"
      >
        <Square size={24} />
      </button>

      <button className="tool-button" onClick={addCircle} title="Add Circle">
        <Circle size={24} />
      </button>

      <div style={{ position: "relative" }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{
            position: "absolute",
            opacity: 0,
            width: "100%",
            height: "100%",
            cursor: "pointer",
            top: 0,
            left: 0,
          }}
        />
        <button className="tool-button" title="Upload Image">
          <ImageIcon size={24} />
        </button>
      </div>
    </>
  );
};
