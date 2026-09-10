"use client";

import { Archive, RefreshCw, Sparkles } from "lucide-react";

interface DissolvedNavProps {
  onOpenHistory?: () => void;
  onOpenExamples?: () => void;
  onRefreshAll?: () => void;
  isRefreshing?: boolean;
  historyCount?: number;
  exampleCount?: number;
}

export function DissolvedNav({
  onOpenHistory,
  onOpenExamples,
  onRefreshAll,
  isRefreshing,
  historyCount,
  exampleCount,
}: DissolvedNavProps) {
  return (
    <nav className="absolute top-0 left-0 right-0 z-30 px-4 py-3.5 sm:px-8 sm:py-6 lg:px-12 flex items-center justify-between pointer-events-auto bg-transparent select-none">
      {/* Top Left: Stylized Geometric "S" Logo dissolved into screen */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3.5 group">
          <div className="relative size-7 sm:size-8 flex items-center justify-center">
            {/* Geometric "S" glyph identical to Dribbble showcase */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="text-white group-hover:text-sky-400 transition-colors sm:w-7 sm:h-7"
            >
              <path
                d="M18 5.5C18 4.11929 16.8807 3 15.5 3H8C6.34315 3 5 4.34315 5 6C5 7.65685 6.34315 9 8 9H16C17.6569 9 19 10.3431 19 12C19 13.6569 17.6569 15 16 15H8.5C7.11929 15 6 16.1193 6 17.5C6 18.8807 7.11929 20 8.5 20H16C17.6569 20 19 18.6569 19 17"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="flex flex-col text-left">
            <span className="font-orbitron font-bold text-xs sm:text-base tracking-[0.16em] sm:tracking-[0.2em] text-white">
              CYCLONE<span className="text-sky-400">AI</span>
            </span>
            <span className="text-[10px] sm:text-xs font-mono tracking-wider sm:tracking-widest text-white/60 uppercase font-semibold">
              SATELLITE INTENSITY
            </span>
          </div>
        </div>
      </div>

      {/* Top Right: History Modal, Examples Modal trigger & Sync button */}
      <div className="flex items-center gap-2 sm:gap-3 text-sm font-medium">
        {onOpenExamples && (
          <button
            onClick={onOpenExamples}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-sky-500/20 text-white hover:text-sky-300 font-orbitron text-xs sm:text-sm font-bold tracking-wider transition-all border border-white/10 shadow-sm"
          >
            <Sparkles className="size-3.5 sm:size-4 text-sky-400" />
            <span><span className="hidden md:inline">BENCHMARK </span>SAMPLES</span>
            {exampleCount != null && (
              <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-300 font-mono text-[10px] sm:text-xs font-black">
                {exampleCount}
              </span>
            )}
          </button>
        )}

        {onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 sm:gap-2.5 px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 font-orbitron text-xs sm:text-sm font-bold tracking-wider transition-all shadow-[0_0_20px_rgba(56,189,248,0.2)]"
          >
            <Archive className="size-3.5 sm:size-4 text-sky-400" />
            <span><span className="hidden sm:inline">PREDICTION </span>HISTORY</span>
            {historyCount != null && (
              <span className="px-1.5 sm:px-2.5 py-0.5 rounded-full bg-sky-400 text-black font-mono text-[10px] sm:text-xs font-black">
                {historyCount}
              </span>
            )}
          </button>
        )}

        {onRefreshAll && (
          <button
            onClick={onRefreshAll}
            disabled={isRefreshing}
            className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-black/60 backdrop-blur-md hover:bg-white/10 text-white hover:text-sky-400 transition-all shadow-sm"
            title="Refresh satellite telemetry"
          >
            <RefreshCw className={`size-3.5 sm:size-4 ${isRefreshing ? "animate-spin text-sky-400" : ""}`} />
          </button>
        )}
      </div>
    </nav>
  );
}
