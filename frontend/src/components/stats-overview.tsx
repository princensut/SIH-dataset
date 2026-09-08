"use client";

import { motion } from "motion/react";
import { Activity, Gauge, Wind, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SummaryResponse } from "@/lib/types";

interface StatsOverviewProps {
  summary: SummaryResponse | null;
  loading: boolean;
}

export function StatsOverview({ summary, loading }: StatsOverviewProps) {
  const cards = [
    {
      title: "OBSERVATIONS PROCESSED",
      value: summary?.total_predictions ?? 0,
      format: (val: number) => val.toLocaleString(),
      subtext: "NetCDF satellite matrices",
      icon: Activity,
      accent: "text-sky-400",
      pill: "Active",
    },
    {
      title: "MEAN SURFACE VELOCITY",
      value: summary?.average_wind_kt,
      format: (val: number | null | undefined) =>
        val !== null && val !== undefined ? `${val.toFixed(1)} kt` : "—",
      subtext: "10-meter sustained speed",
      icon: Wind,
      accent: "text-teal-400",
      pill: "Nominal",
    },
    {
      title: "MEAN EYE DEPRESSION",
      value: summary?.average_pressure_mb,
      format: (val: number | null | undefined) =>
        val !== null && val !== undefined ? `${val.toFixed(1)} mb` : "—",
      subtext: "Central barometric level",
      icon: Gauge,
      accent: "text-purple-400",
      pill: "Sea-level",
    },
    {
      title: "PEAK VELOCITY RECORDED",
      value: summary?.maximum_wind_kt,
      format: (val: number | null | undefined) =>
        val !== null && val !== undefined ? `${val.toFixed(1)} kt` : "—",
      subtext: "Maximum recorded wind",
      icon: Zap,
      accent: "text-rose-400",
      pill: "Historical",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="apple-glass-card rounded-2xl p-5 flex flex-col justify-between transition-all hover:border-white/20"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                {card.title}
              </span>
              <div className="p-2 rounded-xl bg-white/4 border border-white/6">
                <Icon className={`size-3.5 ${card.accent}`} />
              </div>
            </div>

            <div className="mt-4">
              {loading ? (
                <Skeleton className="h-9 w-28 rounded-lg my-1 bg-white/5" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight font-mono text-white tabular-nums">
                    {card.format(card.value as number)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                <span className="text-[11px]">{card.subtext}</span>
                <span className="text-[10px] font-mono text-white/50">{card.pill}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
