"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  X,
  Play,
  FileText,
  Clock,
  Wind,
  Layers,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  EXAMPLE_OBSERVATIONS,
  ExampleObservation,
} from "@/lib/examples";
import { getCategoryMetadata } from "@/lib/api";

interface ExamplesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExample: (example: ExampleObservation, autoRun: boolean) => void;
  currentFilename?: string;
  isLoading?: boolean;
}

export function ExamplesModal({
  isOpen,
  onClose,
  onSelectExample,
  currentFilename,
  isLoading,
}: ExamplesModalProps) {
  const [selectedCycloneFilter, setSelectedCycloneFilter] = useState<string>("ALL");

  if (!isOpen) return null;

  const cyclones = ["ALL", "BUREVI", "YAAS", "SITRANG", "MIDHILI"];

  const filteredObservations =
    selectedCycloneFilter === "ALL"
      ? EXAMPLE_OBSERVATIONS
      : EXAMPLE_OBSERVATIONS.filter(
          (ex) => ex.cyclone.toUpperCase() === selectedCycloneFilter
        );

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col w-full max-w-5xl h-[88vh] sm:h-[82vh] max-h-180 rounded-3xl bg-[#0a0f16]/95 border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 border-b border-white/10 shrink-0">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-2.5 rounded-2xl bg-sky-500/15 text-sky-400">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-lg font-orbitron font-black text-white tracking-wider uppercase flex items-center gap-2">
                    BENCHMARK OBSERVATION SAMPLES
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-300">
                      {EXAMPLE_OBSERVATIONS.length} FILES
                    </span>
                  </h3>
                  <p className="text-[10px] sm:text-xs text-white/60 font-mono mt-0.5">
                    Real satellite NetCDF (.nc) tensors from Indian Ocean cyclones
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="sm:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                title="Close modal"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Filter Pills & Close */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
                {cyclones.map((cyc) => {
                  const count =
                    cyc === "ALL"
                      ? EXAMPLE_OBSERVATIONS.length
                      : EXAMPLE_OBSERVATIONS.filter(
                          (ex) => ex.cyclone.toUpperCase() === cyc
                        ).length;
                  return (
                    <button
                      key={cyc}
                      onClick={() => setSelectedCycloneFilter(cyc)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                        selectedCycloneFilter === cyc
                          ? "bg-sky-400 text-black shadow-sm"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      {cyc} ({count})
                    </button>
                  );
                })}
              </div>

              <button
                onClick={onClose}
                className="hidden sm:block p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                title="Close modal"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {filteredObservations.map((obs) => {
                const meta = getCategoryMetadata(obs.expectedCategory);
                const isCurrent = currentFilename === obs.filename;

                return (
                  <div
                    key={obs.id}
                    className={`relative p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3.5 group ${
                      isCurrent
                        ? "bg-sky-950/40 border-sky-400/60 shadow-[0_0_30px_rgba(56,189,248,0.2)]"
                        : "bg-white/5 border-white/10 hover:border-sky-500/40 hover:bg-white/8"
                    }`}
                  >
                    {/* Top Row: Name + Current Badge */}
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-orbitron font-bold text-sm sm:text-base text-white group-hover:text-sky-300 transition-colors">
                            {obs.name}
                          </h4>
                          <span className="text-[11px] font-mono text-white/50">
                            {obs.timestamp}
                          </span>
                        </div>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-sky-400 text-black text-[10px] font-mono font-black flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="size-3" /> ACTIVE
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-white/70 font-sans line-clamp-2 leading-relaxed pt-1">
                        {obs.description}
                      </p>
                    </div>

                    {/* Metadata Pill Box */}
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-white/50 flex items-center gap-1.5">
                          <Wind className="size-3 text-sky-400" /> Benchmark Wind:
                        </span>
                        <span className="text-white font-bold">
                          ~{obs.expectedWindKt} kt
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-white/50 flex items-center gap-1.5">
                          <Layers className="size-3 text-sky-400" /> Category:
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${meta.color}`}
                        >
                          {obs.expectedCategory}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px] text-white/50">
                        <span className="truncate max-w-[150px]">{obs.filename}</span>
                        <span>{obs.sizeKb} KB</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          onSelectExample(obs, true);
                          onClose();
                        }}
                        disabled={isLoading}
                        className="flex-1 py-2 px-3 rounded-xl bg-sky-400 hover:bg-sky-300 text-black font-orbitron text-xs font-black tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                      >
                        <Play className="size-3.5 fill-black" />
                        <span>RUN INFERENCE</span>
                      </button>

                      <button
                        onClick={() => {
                          onSelectExample(obs, false);
                          onClose();
                        }}
                        disabled={isLoading}
                        className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-semibold transition-all border border-white/10"
                        title="Stage file without auto-running"
                      >
                        Stage
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
