"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import {
  Compass,
  Copy,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCategoryMetadata } from "@/lib/api";
import { PredictionResponse } from "@/lib/types";
import { toast } from "sonner";

interface TelemetryGaugeProps {
  prediction: PredictionResponse | null;
  onOpenDetails?: () => void;
}

export function TelemetryGauge({ prediction, onOpenDetails }: TelemetryGaugeProps) {
  // 3D Card Tilt Effect on Pointer Move
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), {
    stiffness: 250,
    damping: 25,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), {
    stiffness: 250,
    damping: 25,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  if (!prediction) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="apple-glass-card rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center min-h-115 relative overflow-hidden"
      >
        <div className="relative size-24 rounded-full bg-white/3 border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
          <div className="absolute inset-0 rounded-full border border-sky-400/20 animate-ping opacity-25" />
          <Compass className="size-10 text-sky-400" />
        </div>
        <h3 className="text-xl font-bold tracking-tight text-white">
          Awaiting Satellite Telemetry
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mt-2 leading-relaxed">
          Ingest an INSAT-3D NetCDF observation file or load a historical cyclone
          observation from the globe to compute continuous wind and pressure fields.
        </p>
      </motion.div>
    );
  }

  const { prediction: pred, input, data_quality, processing } = prediction;
  const categoryMeta = getCategoryMetadata(pred.intensity_category);
  const windKmh = (pred.wind_speed_kt * 1.852).toFixed(1);

  // SVG Gauge Calculations
  // Wind Speed max scale: 150 knots
  const windRatio = Math.min(1, Math.max(0, pred.wind_speed_kt / 140));

  // Pressure scale: 900 to 1020 mb (inverted: lower is more intense)
  const pressureRatio = Math.min(1, Math.max(0, (1020 - pred.pressure_mb) / 120));

  const copyResults = () => {
    const text = `CycloneAI Scientific Telemetry
Observation: ${input.filename}
IMD Classification: ${pred.intensity_category}
Sustained Wind Velocity: ${pred.wind_speed_kt.toFixed(1)} kt (${windKmh} km/h)
Central Eye Barometric Pressure: ${pred.pressure_mb.toFixed(1)} mb (hPa)
Data Completeness: ${data_quality.valid_percentage.toFixed(1)}%
Inference Runtime: ${processing.processing_time_seconds.toFixed(3)}s`;
    navigator.clipboard.writeText(text);
    toast.success("Telemetry Copied", {
      description: "Observation telemetry copied to clipboard.",
    });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="apple-glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl"
    >
      {/* Luminous Specular Accent Glow */}
      <div className="absolute top-0 right-0 size-96 bg-linear-to-bl from-sky-500/15 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-white/8">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-sky-400 font-bold">
              Autonomous CNN Output
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-1 truncate max-w-md">
            {input.filename}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyResults}
            className="h-8 text-xs bg-white/4 border-white/10 hover:bg-white/8 text-white/90 gap-1.5"
          >
            <Copy className="size-3.5" />
            Copy
          </Button>
          {onOpenDetails && (
            <Button
              size="sm"
              onClick={onOpenDetails}
              className="h-8 text-xs bg-white text-black hover:bg-white/90 font-semibold gap-1.5 shadow-lg shadow-white/10"
            >
              <Eye className="size-3.5" />
              Inspector
            </Button>
          )}
        </div>
      </div>

      {/* Dual Radial Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-8">
        {/* Wind Speed Gauge */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/2 border border-white/6 relative">
          <div className="relative size-44 flex items-center justify-center">
            <svg className="size-full -rotate-90" viewBox="0 0 100 100">
              {/* Background Track */}
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="7"
                fill="none"
                className="text-white/6"
              />
              {/* Animated Value Arc */}
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                stroke="url(#windGradient)"
                strokeWidth="7"
                strokeLinecap="round"
                fill="none"
                strokeDasharray="264"
                initial={{ strokeDashoffset: 264 }}
                animate={{ strokeDashoffset: 264 - (windRatio * 264) }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              />
              <defs>
                <linearGradient id="windGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2997FF" />
                  <stop offset="60%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#FF9F0A" />
                </linearGradient>
              </defs>
            </svg>

            {/* Inner Metrics Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Sustained Wind
              </span>
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-extrabold tracking-tight font-mono text-white tabular-nums my-0.5"
              >
                {pred.wind_speed_kt.toFixed(1)}
              </motion.span>
              <span className="text-xs font-semibold text-sky-400 font-mono">
                KNOTS
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between w-full text-xs px-2">
            <span className="text-muted-foreground font-mono">{windKmh} km/h</span>
            <Badge variant="outline" className="text-[10px] font-mono border-sky-500/30 text-sky-400 bg-sky-500/5">
              10m Surface
            </Badge>
          </div>
        </div>

        {/* Central Pressure Gauge */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/2 border border-white/6 relative">
          <div className="relative size-44 flex items-center justify-center">
            <svg className="size-full -rotate-90" viewBox="0 0 100 100">
              {/* Background Track */}
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="7"
                fill="none"
                className="text-white/6"
              />
              {/* Animated Value Arc */}
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                stroke="url(#pressureGradient)"
                strokeWidth="7"
                strokeLinecap="round"
                fill="none"
                strokeDasharray="264"
                initial={{ strokeDashoffset: 264 }}
                animate={{ strokeDashoffset: 264 - (pressureRatio * 264) }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              />
              <defs>
                <linearGradient id="pressureGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#BF5AF2" />
                  <stop offset="100%" stopColor="#2997FF" />
                </linearGradient>
              </defs>
            </svg>

            {/* Inner Metrics Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Central Eye
              </span>
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-extrabold tracking-tight font-mono text-white tabular-nums my-0.5"
              >
                {pred.pressure_mb.toFixed(1)}
              </motion.span>
              <span className="text-xs font-semibold text-purple-400 font-mono">
                MB / hPa
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between w-full text-xs px-2">
            <span className="text-muted-foreground font-mono">Barometric Minimum</span>
            <Badge variant="outline" className="text-[10px] font-mono border-purple-500/30 text-purple-400 bg-purple-500/5">
              Sea Level
            </Badge>
          </div>
        </div>
      </div>

      {/* Official IMD Intensity Classification Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border p-5 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${categoryMeta.color}`}
      >
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Official IMD Meteorological Classification
          </span>
          <h4 className="text-xl font-bold tracking-tight text-white">
            {pred.intensity_category}
          </h4>
          <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
            {categoryMeta.description}
          </p>
        </div>

        <Badge
          variant="outline"
          className="text-xs font-bold font-mono px-3.5 py-1.5 border-white/20 text-white bg-white/10 uppercase shrink-0"
        >
          {categoryMeta.minWind}–{categoryMeta.maxWind} Knots Band
        </Badge>
      </motion.div>

      {/* Micro-telemetry Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/8 text-xs font-mono">
        <div className="p-3 rounded-xl bg-white/2 border border-white/6">
          <span className="text-[10px] text-muted-foreground uppercase block">
            Valid Matrix Data
          </span>
          <span className="text-sm font-bold text-white mt-1 block">
            {data_quality.valid_percentage.toFixed(1)}%
          </span>
          <span className="text-[10px] text-muted-foreground">
            {data_quality.valid_pixels.toLocaleString()} pixels
          </span>
        </div>

        <div className="p-3 rounded-xl bg-white/2 border border-white/6">
          <span className="text-[10px] text-muted-foreground uppercase block">
            Mean Temperature
          </span>
          <span className="text-sm font-bold text-white mt-1 block">
            {data_quality.mean_kelvin.toFixed(1)} K
          </span>
          <span className="text-[10px] text-muted-foreground">
            [{data_quality.minimum_kelvin.toFixed(0)}K – {data_quality.maximum_kelvin.toFixed(0)}K]
          </span>
        </div>

        <div className="p-3 rounded-xl bg-white/2 border border-white/6">
          <span className="text-[10px] text-muted-foreground uppercase block">
            Sensor Channel
          </span>
          <span className="text-sm font-bold text-white mt-1 block">
            {input.tb_variable} (TIR-1)
          </span>
          <span className="text-[10px] text-muted-foreground">
            10.8 µm Infrared
          </span>
        </div>

        <div className="p-3 rounded-xl bg-white/2 border border-white/6">
          <span className="text-[10px] text-muted-foreground uppercase block">
            Inference Latency
          </span>
          <span className="text-sm font-bold text-white mt-1 block">
            {processing.processing_time_seconds.toFixed(3)}s
          </span>
          <span className="text-[10px] text-muted-foreground">
            FastAPI CNN ResNet
          </span>
        </div>
      </div>
    </motion.div>
  );
}
