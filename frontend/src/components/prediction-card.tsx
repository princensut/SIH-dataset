"use client";

import {
  Copy,
  Eye,
  Gauge,
  Wind,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getCategoryMetadata } from "@/lib/api";
import { PredictionResponse } from "@/lib/types";
import { toast } from "sonner";

interface PredictionCardProps {
  prediction: PredictionResponse | null;
  onOpenDetails?: () => void;
}

export function PredictionCard({
  prediction,
  onOpenDetails,
}: PredictionCardProps) {
  if (!prediction) {
    return (
      <Card className="border-border/50 bg-card/60 backdrop-blur-md relative overflow-hidden h-full flex flex-col justify-center items-center p-8 text-center min-h-90">
        <div className="relative size-20 rounded-full bg-linear-to-tr from-sky-500/10 via-indigo-500/10 to-transparent border border-border/60 flex items-center justify-center text-muted-foreground mb-4">
          <div className="absolute inset-0 rounded-full border border-sky-500/20 animate-ping opacity-25" />
          <Gauge className="size-9 text-sky-400/80" />
        </div>
        <h3 className="text-base font-semibold text-foreground">
          Awaiting Satellite Observation
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm mt-1.5 leading-relaxed">
          Upload a NetCDF brightness-temperature file or click{" "}
          <span className="text-sky-400 font-medium">Load Sample</span> to trigger the
          convolutional neural network inference pipeline.
        </p>
      </Card>
    );
  }

  const { prediction: pred, input, data_quality, processing } = prediction;
  const categoryMeta = getCategoryMetadata(pred.intensity_category);
  const windKmh = (pred.wind_speed_kt * 1.852).toFixed(1);

  const copyResults = () => {
    const text = `CycloneAI Prediction Report
File: ${input.filename}
Classification: ${pred.intensity_category}
Sustained Wind Speed: ${pred.wind_speed_kt.toFixed(1)} kt (${windKmh} km/h)
Central Pressure: ${pred.pressure_mb.toFixed(1)} mb
Valid Observation: ${data_quality.valid_percentage.toFixed(1)}%
Inference Latency: ${processing.processing_time_seconds.toFixed(2)}s`;
    navigator.clipboard.writeText(text);
    toast.success("Summary Copied", {
      description: "Prediction telemetry copied to clipboard.",
    });
  };

  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur-md relative overflow-hidden shadow-xl">
      {/* Decorative ambient gradient */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-emerald-400 font-bold tracking-widest uppercase">
                Step 02
              </span>
              <span className="text-muted-foreground">•</span>
              <CardTitle className="text-base font-semibold">
                Inference Result & IMD Classification
              </CardTitle>
            </div>
            <CardDescription className="text-xs font-mono mt-0.5 truncate max-w-md">
              {input.filename}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyResults}
              className="text-xs h-8 gap-1.5 border-border/60"
            >
              <Copy className="size-3.5" />
              Copy
            </Button>
            {onOpenDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenDetails}
                className="text-xs h-8 gap-1.5 border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
              >
                <Eye className="size-3.5" />
                Inspect
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Top Dual Metric Gauges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Wind Speed Card */}
          <div className="relative overflow-hidden rounded-xl border border-sky-500/20 bg-linear-to-br from-sky-500/10 via-background to-background p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
              <span className="flex items-center gap-1.5 text-sky-400 font-semibold">
                <Wind className="size-4" />
                MAX SUSTAINED WIND
              </span>
              <span>10m Surface</span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold tracking-tight font-mono text-foreground">
                {pred.wind_speed_kt.toFixed(1)}
              </span>
              <span className="text-sm font-semibold text-muted-foreground">
                KNOTS
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-mono">
                {windKmh} km/h
              </span>
              <Badge variant="outline" className="text-[10px] font-mono border-sky-500/30 text-sky-400">
                ±3.4 kt MAE
              </Badge>
            </div>
          </div>

          {/* Central Pressure Card */}
          <div className="relative overflow-hidden rounded-xl border border-indigo-500/20 bg-linear-to-br from-indigo-500/10 via-background to-background p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
              <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                <Gauge className="size-4" />
                ESTIMATED CENTRAL PRESSURE
              </span>
              <span>Barometric Eye</span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold tracking-tight font-mono text-foreground">
                {pred.pressure_mb.toFixed(1)}
              </span>
              <span className="text-sm font-semibold text-muted-foreground">
                MB / hPa
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-mono">
                Sea-level pressure
              </span>
              <Badge variant="outline" className="text-[10px] font-mono border-indigo-500/30 text-indigo-400">
                ±4.2 mb MAE
              </Badge>
            </div>
          </div>
        </div>

        {/* IMD Intensity Banner */}
        <div
          className={`rounded-xl border p-4 sm:p-5 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${categoryMeta.color}`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Official IMD Classification
              </span>
            </div>
            <h4 className="text-lg sm:text-xl font-extrabold tracking-tight">
              {pred.intensity_category}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {categoryMeta.description}
            </p>
          </div>

          <Badge
            variant={categoryMeta.badgeVariant}
            className="text-xs font-semibold px-3 py-1 uppercase tracking-wider shrink-0"
          >
            {categoryMeta.minWind}–{categoryMeta.maxWind} KT BAND
          </Badge>
        </div>

        <Separator className="bg-border/50" />

        {/* Observation Quality & Pipeline Telemetry */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-muted/20 border border-border/40">
            <span className="text-[10px] font-mono text-muted-foreground uppercase block">
              VALID OBSERVATION
            </span>
            <span className="text-base font-bold font-mono text-foreground mt-0.5 block">
              {data_quality.valid_percentage.toFixed(1)}%
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {data_quality.valid_pixels.toLocaleString()} px
            </span>
          </div>

          <div className="p-3 rounded-lg bg-muted/20 border border-border/40">
            <span className="text-[10px] font-mono text-muted-foreground uppercase block">
              MEAN BRIGHTNESS TEMP
            </span>
            <span className="text-base font-bold font-mono text-foreground mt-0.5 block">
              {data_quality.mean_kelvin.toFixed(1)} K
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              [{data_quality.minimum_kelvin.toFixed(0)}–{data_quality.maximum_kelvin.toFixed(0)} K]
            </span>
          </div>

          <div className="p-3 rounded-lg bg-muted/20 border border-border/40">
            <span className="text-[10px] font-mono text-muted-foreground uppercase block">
              SENSOR VARIABLE
            </span>
            <span className="text-base font-bold font-mono text-foreground mt-0.5 block">
              {input.tb_variable}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono truncate block">
              {input.dimensions ? Object.keys(input.dimensions).join("×") : "2D"}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-muted/20 border border-border/40">
            <span className="text-[10px] font-mono text-muted-foreground uppercase block">
              INFERENCE LATENCY
            </span>
            <span className="text-base font-bold font-mono text-foreground mt-0.5 block">
              {processing.processing_time_seconds.toFixed(2)}s
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              CNN ResNet Block
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
