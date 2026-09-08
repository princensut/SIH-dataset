"use client";

import { useEffect, useState } from "react";
import {
  BrainCircuit,
  Layers,
  Scale,
  Thermometer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { IMD_CATEGORIES, fetchModelInfo } from "@/lib/api";
import { ModelInfoResponse } from "@/lib/types";

export function ModelInfoPanel() {
  const [modelInfo, setModelInfo] = useState<ModelInfoResponse | null>(null);

  useEffect(() => {
    fetchModelInfo()
      .then(setModelInfo)
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* 3 Architecture Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="apple-glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-sky-400">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20">
              <BrainCircuit className="size-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">
                Multi-Task CNN Backbone
              </h4>
              <p className="text-[11px] text-muted-foreground">Dual regression output heads</p>
            </div>
          </div>
          <div className="space-y-2 text-xs pt-2 border-t border-white/6">
            <div className="flex justify-between py-1 border-b border-white/4">
              <span className="text-muted-foreground">Weights File:</span>
              <span className="font-mono text-white">cyclone_intensity_model.keras</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/4">
              <span className="text-muted-foreground">Parameters:</span>
              <span className="font-mono text-white font-bold">
                {modelInfo?.parameters ? modelInfo.parameters.toLocaleString() : "422,914"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/4">
              <span className="text-muted-foreground">Joint Loss:</span>
              <span className="font-mono text-white">MSE Wind + 0.5 * MSE Pressure</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Architecture:</span>
              <span className="font-mono text-white">4x Conv2D + Dense Layers</span>
            </div>
          </div>
        </div>

        <div className="apple-glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-purple-400">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Layers className="size-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">
                Spatial Ingestion Tensor
              </h4>
              <p className="text-[11px] text-muted-foreground">Gridded infrared matrices</p>
            </div>
          </div>
          <div className="space-y-2 text-xs pt-2 border-t border-white/6">
            <div className="flex justify-between py-1 border-b border-white/4">
              <span className="text-muted-foreground">Input Tensor:</span>
              <span className="font-mono text-white font-bold">(1, 128, 128, 1)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/4">
              <span className="text-muted-foreground">Interpolation:</span>
              <span className="font-mono text-white">Bilinear Resampling</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/4">
              <span className="text-muted-foreground">Missing Data:</span>
              <span className="font-mono text-white">NaN Imputation to 300K</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Channels:</span>
              <span className="font-mono text-white">TIR-1 Brightness Temp</span>
            </div>
          </div>
        </div>

        <div className="apple-glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-teal-400">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20">
              <Thermometer className="size-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">
                Atmospheric Scaling Bounds
              </h4>
              <p className="text-[11px] text-muted-foreground">Thermal Kelvin bounds</p>
            </div>
          </div>
          <div className="space-y-2 text-xs pt-2 border-t border-white/6">
            <div className="flex justify-between py-1 border-b border-white/4">
              <span className="text-muted-foreground">Min Kelvin Threshold:</span>
              <span className="font-mono text-white">180.0 K (-93.15 °C)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/4">
              <span className="text-muted-foreground">Max Kelvin Threshold:</span>
              <span className="font-mono text-white">310.0 K (+36.85 °C)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/4">
              <span className="text-muted-foreground">Normalized Form:</span>
              <span className="font-mono text-[11px] text-sky-400 font-bold">(Tb - 180) / 130</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Wind Normalization:</span>
              <span className="font-mono text-white">Mean 50.5, Std 31.7</span>
            </div>
          </div>
        </div>
      </div>

      {/* Official IMD Reference Grid */}
      <div className="apple-glass-card rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="size-4 text-sky-400" />
            <h4 className="text-base font-bold text-white tracking-tight">
              India Meteorological Department (IMD) Classification Scale
            </h4>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono border-white/10 text-white/70">
            WMO / IMD Standard
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {IMD_CATEGORIES.map((cat, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border text-xs flex flex-col justify-between transition-all hover:scale-[1.02] ${cat.color}`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-white truncate max-w-35">
                    {cat.name}
                  </span>
                  <Badge variant={cat.badgeVariant} className="text-[9px] px-1.5 py-0 uppercase">
                    {cat.minWind}–{cat.maxWind} kt
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {cat.description}
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-white/6 text-[10px] font-mono text-muted-foreground">
                Velocity: {Math.round(cat.minWind * 1.852)}–{Math.round(cat.maxWind * 1.852)} km/h
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
