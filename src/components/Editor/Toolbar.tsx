import { RotateCcw, RotateCw } from "lucide-react";

interface ToolbarProps {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  undo,
  redo,
  canUndo,
  canRedo,
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="h-6 w-px bg-gray-200 mx-2"></div>

      <button
        className={`tool-button ${!canUndo ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={undo}
        disabled={!canUndo}
        title="Undo"
      >
        <RotateCcw size={20} />
      </button>

      <button
        className={`tool-button ${!canRedo ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={redo}
        disabled={!canRedo}
        title="Redo"
      >
        <RotateCw size={20} />
      </button>
    </div>
  );
};
