import {
  Sliders,
  Undo2,
  Redo2,
  Activity,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

export interface CanvasAndControlPageProps {
  currentUser?: any;
  onNavigateHome?: () => void;
  historyLimit: number;
  setHistoryLimit: (limit: number) => void;
  pastCount: number;
  futureCount: number;
  undo: () => void;
  redo: () => void;
  onClearHistory?: () => void;
}

export default function CanvasAndControlPage({
  onNavigateHome,
  historyLimit,
  setHistoryLimit,
  pastCount,
  futureCount,
  undo,
  redo,
  onClearHistory,
}: CanvasAndControlPageProps) {
  return (
    <div className="flex-1 h-full overflow-y-auto bg-zinc-50/50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col">
      {/* Top Header / Breadcrumbs Bar */}
      <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-[#121215]/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 sticky top-0 z-20">
        <div className="flex items-center space-x-2 text-xs">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="flex items-center space-x-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer mr-1"
              title="Return to Projects Dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}
          <span className="text-zinc-400 dark:text-zinc-500">Platform</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" />
          <span className="text-zinc-500 dark:text-zinc-400 font-medium">Settings</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" />
          <span className="text-zinc-900 dark:text-zinc-100 font-semibold">Canvas and Control</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            Node v22.18 • SG-NORTH-01
          </span>
        </div>
      </header>

      {/* Main Container: Strictly Left-Aligned (NO mx-auto) */}
      <main className="flex-1 w-full max-w-5xl p-6 md:p-8 space-y-6 text-left">
        {/* Page Title & Intro */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-zinc-100 shadow-xs">
              <Sliders className="w-4 h-4 text-indigo-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Canvas and Control
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 pl-10.5">
            Configure workspace canvas controls, undo/redo history limit, and editor preferences.
          </p>
        </div>

        {/* History Limits and Undo/Redo Engine Card */}
        <div className="p-6 bg-white dark:bg-[#121215] rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-xs">
          <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <Sliders className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Canvas Undo / Redo History Configuration
            </h4>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
              Maximum Undo History Steps
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min={5}
                max={200}
                value={historyLimit}
                onChange={(e) => {
                  const val = Math.max(5, Math.min(200, Number(e.target.value) || 50));
                  setHistoryLimit(val);
                }}
                className="w-32 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none"
              />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Range: 5 - 200 steps (Current setting: {historyLimit})
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Determines how many canvas changes and node position adjustments are retained in memory. Higher limits allow longer rollback history.
            </p>
          </div>

          {/* History Stack Status & Manual Controls */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold block">
              History Stack Status
            </span>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-zinc-50 dark:bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <span className="text-zinc-500 dark:text-zinc-400 text-xs block">Undo Steps</span>
                <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1 block font-mono">
                  {pastCount} available
                </span>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <span className="text-zinc-500 dark:text-zinc-400 text-xs block">Redo Steps</span>
                <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1 block font-mono">
                  {futureCount} available
                </span>
              </div>
            </div>

            <div className="flex space-x-3 pt-1">
              <button
                type="button"
                onClick={undo}
                disabled={pastCount === 0}
                className="flex-1 py-2 px-3 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo Step</span>
                <span className="text-[9px] font-normal opacity-60">(Ctrl+Z)</span>
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={futureCount === 0}
                className="flex-1 py-2 px-3 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Redo2 className="w-3.5 h-3.5" />
                <span>Redo Step</span>
                <span className="text-[9px] font-normal opacity-60">(Ctrl+Y)</span>
              </button>
              {onClearHistory && (
                <button
                  type="button"
                  onClick={onClearHistory}
                  disabled={pastCount === 0 && futureCount === 0}
                  className="py-2 px-3 rounded-lg text-xs font-medium border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Purge Undo & Redo History Stacks"
                >
                  Clear Stack
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Canvas Navigation & Shortcuts Info Card */}
        <div className="p-6 bg-white dark:bg-[#121215] rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-xs">
          <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <Activity className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Canvas Controls & Shortcuts Guide
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 space-y-1">
              <span className="text-zinc-900 dark:text-zinc-100 font-semibold block">Pan / Navigate Canvas</span>
              <p className="text-[11px]">Hold Right-Click / Scroll Wheel or Drag background to pan around nodes.</p>
            </div>
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 space-y-1">
              <span className="text-zinc-900 dark:text-zinc-100 font-semibold block">Zoom Range</span>
              <p className="text-[11px]">Mouse wheel zooms from 0.25x up to 2.0x scale with crisp vector rendering.</p>
            </div>
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 space-y-1">
              <span className="text-zinc-900 dark:text-zinc-100 font-semibold block">Multi-Selection</span>
              <p className="text-[11px]">Click and drag a marquee selection box across nodes to select and move multiple nodes.</p>
            </div>
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 space-y-1">
              <span className="text-zinc-900 dark:text-zinc-100 font-semibold block">Keyboard Shortcuts</span>
              <p className="text-[11px]">Ctrl+B toggles Sidebar • Ctrl+J toggles Dark/Light theme • Del removes nodes.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
