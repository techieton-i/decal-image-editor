import { useState, useCallback } from "react";
import { fabric } from "fabric";
import { CanvasArea } from "./components/Editor/CanvasArea";
import { Sidebar } from "./components/Editor/Sidebar";
import { Toolbar } from "./components/Editor/Toolbar";
import { PropertiesPanel } from "./components/Editor/PropertiesPanel";
import { TemplateGallery } from "./components/UI/TemplateGallery"; // Ensure you've created this file
import { useHistory } from "./hooks/useHistory";
import { Layout, Users } from "lucide-react";
import "./App.css";

const App: React.FC = () => {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [viewMode, setViewMode] = useState<"banker" | "user">("banker");

  // Initialize history hook
  const { undo, redo, canUndo, canRedo } = useHistory(canvas);

  const handleCanvasReady = useCallback((fabricCanvas: fabric.Canvas) => {
    setCanvas(fabricCanvas);
  }, []);

  return (
    <div className="app-container">
      {/* Header / Toolbar */}
      <header className="app-header">
        <div className="flex items-center gap-4">
          <h1 className="app-title">CanvasEditor</h1>

          {/* Role Switcher */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === "banker" ? "bg-white shadow text-indigo-600" : "text-gray-500 hover:text-gray-900"}`}
              onClick={() => setViewMode("banker")}
            >
              <Layout size={14} className="inline mr-1.5" />
              Super User View
            </button>
            <button
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === "user" ? "bg-white shadow text-indigo-600" : "text-gray-500 hover:text-gray-900"}`}
              onClick={() => setViewMode("user")}
            >
              <Users size={14} className="inline mr-1.5" />
              User View
            </button>
          </div>
        </div>

        {viewMode === "banker" && (
          <Toolbar
            undo={undo}
            redo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        )}
      </header>

      {/* View Switcher Logic */}
      {viewMode === "banker" ? (
        <div className="main-layout">
          {/* Sidebar (Tools) */}
          <aside className="sidebar">
            <Sidebar canvas={canvas} />
          </aside>

          {/* Main Canvas Area */}
          <main className="canvas-workspace">
            <div
              className="canvas-container-shadow"
              style={{ width: "800px", height: "600px" }}
            >
              <CanvasArea onCanvasReady={handleCanvasReady} />
            </div>
          </main>

          {/* Properties Panel (Right Sidebar) */}
          <aside className="properties-panel">
            <PropertiesPanel canvas={canvas} />
          </aside>
        </div>
      ) : (
        /* User Gallery View */
        <div className="flex-1 overflow-auto">
          <TemplateGallery />
        </div>
      )}
    </div>
  );
};

export default App;
