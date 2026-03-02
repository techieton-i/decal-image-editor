import { useState, useEffect, useCallback, useRef } from "react";
import { fabric } from "fabric";

interface UseHistoryReturn {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const useHistory = (canvas: fabric.Canvas | null): UseHistoryReturn => {
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [locked, setLocked] = useState(false);

  // Refs to avoid stale closures inside canvas event listeners
  const historyIndexRef = useRef(historyIndex);
  const lockedRef = useRef(locked);

  // Keep refs in sync with state
  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);

  useEffect(() => {
    lockedRef.current = locked;
  }, [locked]);

  // Single effect: bind canvas listeners once (per canvas instance)
  useEffect(() => {
    if (!canvas) return;

    const saveState = () => {
      if (lockedRef.current) return;
      const json = JSON.stringify(canvas.toJSON());

      setHistory((prev) => {
        const current = prev.slice(0, historyIndexRef.current + 1);
        return [...current, json];
      });
      setHistoryIndex((prev) => prev + 1);
    };

    // Save initial state
    saveState();

    const onModified = () => saveState();
    const onAdded = () => {
      if (!lockedRef.current) saveState();
    };
    const onRemoved = () => saveState();

    canvas.on("object:modified", onModified);
    canvas.on("object:added", onAdded);
    canvas.on("object:removed", onRemoved);

    return () => {
      canvas.off("object:modified", onModified);
      canvas.off("object:added", onAdded);
      canvas.off("object:removed", onRemoved);
    };
  }, [canvas]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;

    setLocked(true);
    const prevIndex = historyIndex - 1;
    const prevState = history[prevIndex];

    canvas?.loadFromJSON(JSON.parse(prevState), () => {
      canvas.renderAll();
      setHistoryIndex(prevIndex);
      setLocked(false);
    });
  }, [canvas, history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;

    setLocked(true);
    const nextIndex = historyIndex + 1;
    const nextState = history[nextIndex];

    canvas?.loadFromJSON(JSON.parse(nextState), () => {
      canvas.renderAll();
      setHistoryIndex(nextIndex);
      setLocked(false);
    });
  }, [canvas, history, historyIndex]);

  return {
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  };
};
