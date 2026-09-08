"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { RiveSatelliteWidget } from "@/components/rive-widget";
import { checkBackendHealth } from "@/lib/api";

interface HeaderProps {
  onRefreshAll?: () => void;
  isRefreshing?: boolean;
}

export function Header({ onRefreshAll, isRefreshing }: HeaderProps) {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let isMounted = true;
    checkBackendHealth().then((res) => {
      if (isMounted) setOnline(res.online);
    });

    const interval = setInterval(() => {
      checkBackendHealth().then((res) => {
        if (isMounted) setOnline(res.online);
      });
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/8 bg-black/40 backdrop-blur-2xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 max-w-7xl">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <RiveSatelliteWidget />

          <div className="flex flex-col">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-none">
              CYCLONE<span className="text-sky-400">AI</span>
            </h1>
            <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase mt-1">
              INTENSITY INTELLIGENCE SYSTEM
            </span>
          </div>
        </div>

        {/* System Status & Sync */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/4 border border-white/8 text-xs font-mono">
            <span
              className={`size-2 rounded-full ${
                online ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
              }`}
            />
            <span className={online ? "text-white" : "text-rose-400"}>
              {online ? "SYSTEM ONLINE" : "SYSTEM OFFLINE"}
            </span>
          </div>

          {onRefreshAll && (
            <button
              onClick={onRefreshAll}
              disabled={isRefreshing}
              className="p-2 rounded-full bg-white/4 hover:bg-white/8 border border-white/8 text-muted-foreground hover:text-white transition-colors"
              title="Refresh statistics and history"
            >
              <RefreshCw
                className={`size-3.5 ${isRefreshing ? "animate-spin text-sky-400" : ""}`}
              />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
