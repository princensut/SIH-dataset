"use client";

import { useState, useSyncExternalStore } from "react";
import { useRive } from "@rive-app/react-canvas";
import { Radio } from "lucide-react";

export function RiveSatelliteWidget() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [hasError, setHasError] = useState(false);

  const { RiveComponent } = useRive({
    src: "/radar.riv",
    autoplay: true,
    onLoadError: () => setHasError(true),
  });

  if (!mounted || hasError) {
    return (
      <div className="size-6 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
        <Radio className="size-3.5 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="relative size-7 rounded-full overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center">
      <RiveComponent style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
