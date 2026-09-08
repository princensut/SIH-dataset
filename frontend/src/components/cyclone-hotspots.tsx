"use client";

import { motion } from "motion/react";
import { Compass, Flame, Play, Sparkles, Wind, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CYCLONE_HOTSPOTS, CycloneHotspot } from "@/components/earth-globe";
import { getCategoryMetadata } from "@/lib/api";

interface CycloneHotspotsProps {
  onSelect: (cyclone: CycloneHotspot) => void;
  selectedId?: string;
}

export function CycloneHotspots({ onSelect, selectedId }: CycloneHotspotsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-orange-400" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-orange-400 font-bold">
              North Indian Ocean Basin Registry
            </span>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white mt-1">
            Historical Cyclone Dataset Benchmarks
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real tropical storm cases from the SIH satellite dataset with IMD ground truth records
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CYCLONE_HOTSPOTS.map((cyclone, index) => {
          const meta = getCategoryMetadata(cyclone.category);
          const isSelected = selectedId === cyclone.id;

          return (
            <motion.div
              key={cyclone.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              whileHover={{ y: -4 }}
              className={`apple-glass-card rounded-2xl p-5 relative overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                isSelected
                  ? "border-sky-400/50 shadow-xl shadow-sky-500/15"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono border-white/10 text-muted-foreground px-2 py-0.5"
                  >
                    {cyclone.year} • {cyclone.basin}
                  </Badge>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {cyclone.lat}°N, {cyclone.lon}°E
                  </span>
                </div>

                <div className="mt-3">
                  <h4 className="text-base font-bold text-white tracking-tight">
                    {cyclone.name}
                  </h4>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold border mt-1.5 ${meta.color}`}
                  >
                    {cyclone.category}
                  </Badge>
                </div>

                {/* Telemetry Numbers */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/6 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-white/2 border border-white/4">
                    <span className="text-[10px] text-muted-foreground block">Peak Wind</span>
                    <span className="text-base font-bold text-white mt-0.5 block">
                      {cyclone.peakWindKt.toFixed(0)} <span className="text-[10px] font-normal text-muted-foreground">kt</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {Math.round(cyclone.peakWindKt * 1.852)} km/h
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/2 border border-white/4">
                    <span className="text-[10px] text-muted-foreground block">Eye Pressure</span>
                    <span className="text-base font-bold text-white mt-0.5 block">
                      {cyclone.pressureMb.toFixed(0)} <span className="text-[10px] font-normal text-muted-foreground">mb</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Minimum
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/6">
                <Button
                  size="sm"
                  onClick={() => onSelect(cyclone)}
                  className={`w-full text-xs font-semibold h-8 gap-1.5 ${
                    isSelected
                      ? "bg-white text-black hover:bg-white/90"
                      : "bg-white/5 hover:bg-white/10 text-white/90 border border-white/10"
                  }`}
                >
                  <Play className="size-3 text-sky-400 fill-sky-400" />
                  Load {cyclone.name} Case
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
