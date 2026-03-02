import { useEffect } from "react";
import { useCanvas } from "../../hooks/useCanvas";
import { fabric } from "fabric";

interface CanvasAreaProps {
  onCanvasReady?: (canvas: fabric.Canvas) => void;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({ onCanvasReady }) => {
  const { canvasRef, containerRef, fabricCanvas } = useCanvas();

  useEffect(() => {
    if (fabricCanvas && onCanvasReady) {
      onCanvasReady(fabricCanvas);
    }
  }, [fabricCanvas, onCanvasReady]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-gray-100 flex items-center justify-center overflow-hidden relative"
      style={{ minHeight: "500px" }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
};
