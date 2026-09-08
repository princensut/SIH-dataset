"use client";

import { Archive, RefreshCw } from "lucide-react";

interface DissolvedNavProps {
  onOpenHistory?: () => void;
  onRefreshAll?: () => void;
  isRefreshing?: boolean;
  historyCount?: number;
}

export function DissolvedNav({
  onOpenHistory,
  onRefreshAll,
  isRefreshing,
  historyCount,
}: DissolvedNavProps) {
  return (
    <nav className="absolute top-0 left-0 right-0 z-30 px-6 py-5 sm:px-10 sm:py-7 flex items-center justify-between pointer-events-auto bg-transparent select-none">
      {/* Top Left: Stylized Geometric "S" Logo dissolved into screen */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3.5 group">
          <div className="relative size-8 flex items-center justify-center">
            {/* Geometric "S" glyph identical to Dribbble showcase */}
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              className="text-white group-hover:text-sky-400 transition-colors"
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
            <span className="font-orbitron font-bold text-sm sm:text-base tracking-[0.2em] text-white">
              CYCLONE<span className="text-sky-400">AI</span>
            </span>
            <span className="text-xs font-mono tracking-widest text-white/60 uppercase font-semibold">
              SATELLITE INTENSITY
            </span>
          </div>
        </div>
      </div>

      {/* Top Right: History Modal trigger & Sync button */}
      <div className="flex items-center gap-3.5 text-sm font-medium">
        {onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl border border-sky-400/40 bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 font-orbitron text-xs sm:text-sm font-bold tracking-wider transition-all shadow-[0_0_20px_rgba(56,189,248,0.2)]"
          >
            <Archive className="size-4 text-sky-400" />
            <span>PREDICTION HISTORY</span>
            {historyCount != null && (
              <span className="px-2.5 py-0.5 rounded-full bg-sky-400 text-black font-mono text-xs font-black">
                {historyCount}
              </span>
            )}
          </button>
        )}

        {onRefreshAll && (
          <button
            onClick={onRefreshAll}
            disabled={isRefreshing}
            className="p-3 rounded-2xl border border-white/15 bg-black/60 backdrop-blur-md hover:bg-white/10 text-white hover:text-sky-400 transition-all shadow-sm"
            title="Refresh satellite telemetry"
          >
            <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin text-sky-400" : ""}`} />
          </button>
        )}
      </div>
    </nav>
  );
}
