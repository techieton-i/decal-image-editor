import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";

interface UseCanvasArgs {
  init?: (canvas: fabric.Canvas) => void;
}

export const useCanvas = ({ init }: UseCanvasArgs = {}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      backgroundColor: "#ffffff",
      selection: true,
      preserveObjectStacking: true,
    });

    setFabricCanvas(canvas);

    const resizeCanvas = () => {
      if (!containerRef.current || !canvas) return;

      const { clientWidth, clientHeight } = containerRef.current;
      canvas.setDimensions({
        width: clientWidth,
        height: clientHeight,
      });
      canvas.renderAll();
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });

    resizeObserver.observe(containerRef.current);
    resizeCanvas();

    if (init) {
      init(canvas);
    }

    return () => {
      resizeObserver.disconnect();
      canvas.dispose();
      setFabricCanvas(null);
    };
  }, []);

  return {
    canvasRef,
    containerRef,
    fabricCanvas,
  };
};
