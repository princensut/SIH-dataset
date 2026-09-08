"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Copy, FileText, Gauge, Wind, Calendar, CheckCircle2 } from "lucide-react";
import { getCategoryMetadata } from "@/lib/api";
import { PredictionHistoryItem } from "@/lib/types";
import { toast } from "sonner";

interface PredictionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PredictionHistoryItem | null;
}

export function PredictionDialog({
  open,
  onOpenChange,
  item,
}: PredictionDialogProps) {
  if (!item) return null;

  const meta = getCategoryMetadata(item.intensity_category);
  const windKmh = (item.wind_speed_kt * 1.852).toFixed(1);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(item, null, 2));
    toast.success("JSON Copied", {
      description: "Observation JSON copied to clipboard.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-xl border-border/60">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-sky-400 font-bold uppercase tracking-widest">
              Observation Inspector
            </span>
          </div>
          <DialogTitle className="text-base font-bold truncate">
            {item.filename}
          </DialogTitle>
          <DialogDescription className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
            <Calendar className="size-3.5" />
            {new Date(item.created_at).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Main Dual Gauges */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-sky-500/20 bg-sky-500/5">
              <span className="text-[10px] font-mono text-sky-400 font-semibold flex items-center gap-1">
                <Wind className="size-3.5" /> WIND SPEED
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-foreground">
                  {item.wind_speed_kt.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">kt</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                {windKmh} km/h
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
              <span className="text-[10px] font-mono text-indigo-400 font-semibold flex items-center gap-1">
                <Gauge className="size-3.5" /> CENTRAL PRESSURE
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-foreground">
                  {item.pressure_mb.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">mb</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                hPa barometric
              </span>
            </div>
          </div>

          {/* Classification Banner */}
          <div className={`rounded-xl border p-3.5 ${meta.color}`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">
                  IMD Classification
                </span>
                <p className="text-sm font-bold text-foreground">
                  {item.intensity_category}
                </p>
              </div>
              <Badge variant={meta.badgeVariant} className="text-[10px] uppercase">
                {meta.minWind}–{meta.maxWind} kt
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {meta.description}
            </p>
          </div>

          <Separator className="bg-border/40" />

          {/* Quality & Sensor Telemetry */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-muted/20 border border-border/40">
              <span className="text-[10px] font-mono text-muted-foreground block">
                VALID DATA RATIO
              </span>
              <span className="font-semibold font-mono">
                {item.valid_percentage != null ? `${item.valid_percentage.toFixed(1)}%` : "N/A"}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-muted/20 border border-border/40">
              <span className="text-[10px] font-mono text-muted-foreground block">
                TB SENSOR VARIABLE
              </span>
              <span className="font-semibold font-mono">{item.tb_variable || "Tb"}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-muted/20 border border-border/40">
              <span className="text-[10px] font-mono text-muted-foreground block">
                TEMPERATURE RANGE
              </span>
              <span className="font-semibold font-mono">
                {item.minimum_kelvin != null && item.maximum_kelvin != null
                  ? `${item.minimum_kelvin.toFixed(0)}K – ${item.maximum_kelvin.toFixed(0)}K`
                  : "N/A"}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-muted/20 border border-border/40">
              <span className="text-[10px] font-mono text-muted-foreground block">
                INFERENCE TIME
              </span>
              <span className="font-semibold font-mono">
                {item.processing_time_seconds != null
                  ? `${item.processing_time_seconds.toFixed(2)}s`
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 border-t border-border/40 pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="text-xs border-border/60 gap-1.5"
          >
            <Copy className="size-3.5" />
            Copy JSON
          </Button>
          <Button
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
