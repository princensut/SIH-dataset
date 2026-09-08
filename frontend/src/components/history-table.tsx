"use client";

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Search,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCategoryMetadata, IMD_CATEGORIES } from "@/lib/api";
import { PredictionHistoryItem } from "@/lib/types";

interface HistoryTableProps {
  history: PredictionHistoryItem[];
  total: number;
  limit: number;
  offset: number;
  search: string;
  category: string;
  loading: boolean;
  onSearchChange: (search: string) => void;
  onCategoryChange: (category: string) => void;
  onOffsetChange: (offset: number) => void;
  onInspect: (item: PredictionHistoryItem) => void;
}

export function HistoryTable({
  history,
  total,
  limit,
  offset,
  search,
  category,
  loading,
  onSearchChange,
  onCategoryChange,
  onOffsetChange,
  onInspect,
}: HistoryTableProps) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="apple-glass-card rounded-3xl overflow-hidden shadow-2xl">
      {/* Header Bar */}
      <div className="p-6 sm:p-8 border-b border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-sky-400" />
            <span className="text-xs font-mono uppercase tracking-widest text-sky-400 font-bold">
              Observation Archive
            </span>
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-white mt-1.5 font-orbitron">
            Historical Satellite Predictions Registry
          </h3>
          <p className="text-sm text-white/60 mt-1 font-mono">
            Indexed NetCDF evaluations persisted in SQLite database
          </p>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-3 size-4 text-white/50 pointer-events-none" />
            <Input
              placeholder="Search filename..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-10 text-sm bg-white/5 border-white/15 text-white placeholder:text-white/40 focus-visible:ring-sky-500/40 rounded-xl font-mono"
            />
          </div>

          <Select
            value={category || "ALL"}
            onValueChange={(val) => onCategoryChange(!val || val === "ALL" ? "" : val)}
          >
            <SelectTrigger className="w-full sm:w-48 h-10 text-sm bg-white/5 border-white/15 text-white rounded-xl font-mono">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-black/95 border-white/15 text-white font-mono">
              <SelectItem value="ALL">All Categories</SelectItem>
              {IMD_CATEGORIES.map((cat) => (
                <SelectItem key={cat.name} value={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-white/2">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-xs font-mono font-bold py-4 pl-6 text-white/70 uppercase">
                OBSERVATION
              </TableHead>
              <TableHead className="text-xs font-mono font-bold py-4 text-white/70 uppercase">
                SUSTAINED WIND
              </TableHead>
              <TableHead className="text-xs font-mono font-bold py-4 text-white/70 uppercase">
                CENTRAL PRESSURE
              </TableHead>
              <TableHead className="text-xs font-mono font-bold py-4 text-white/70 uppercase">
                CLASSIFICATION
              </TableHead>
              <TableHead className="text-xs font-mono font-bold py-4 text-white/70 uppercase">
                COMPLETENESS
              </TableHead>
              <TableHead className="text-xs font-mono font-bold py-4 text-white/70 uppercase">
                TIMESTAMP
              </TableHead>
              <TableHead className="text-xs font-mono font-bold py-4 pr-6 text-right text-white/70 uppercase">
                ACTION
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-sm text-white/50 font-mono">
                  Synchronizing records from SQLite database...
                </TableCell>
              </TableRow>
            ) : history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20 text-sm text-white/50 font-mono">
                  No matching cyclone observations recorded in database.
                </TableCell>
              </TableRow>
            ) : (
              history.map((item) => {
                const meta = getCategoryMetadata(item.intensity_category);
                const dateStr = new Date(item.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <TableRow
                    key={item.prediction_id}
                    className="border-white/5 hover:bg-white/4 transition-colors cursor-pointer group"
                    onClick={() => onInspect(item)}
                  >
                    <TableCell className="py-4 pl-6 font-medium text-sm text-white">
                      <div className="flex items-center gap-2.5 max-w-56 sm:max-w-xs truncate">
                        <FileText className="size-4 text-sky-400 shrink-0" />
                        <span className="truncate">{item.filename}</span>
                      </div>
                    </TableCell>

                    <TableCell className="py-4 text-sm font-mono text-white">
                      <span className="font-bold tabular-nums text-base font-orbitron">
                        {item.wind_speed_kt.toFixed(1)}
                      </span>{" "}
                      <span className="text-white/50 text-xs">kt</span>
                    </TableCell>

                    <TableCell className="py-4 text-sm font-mono text-white">
                      <span className="font-bold tabular-nums text-base">
                        {item.pressure_mb.toFixed(1)}
                      </span>{" "}
                      <span className="text-white/50 text-xs">mb</span>
                    </TableCell>

                    <TableCell className="py-4">
                      <Badge
                        variant="outline"
                        className={`text-xs font-orbitron font-bold border px-3 py-1 rounded-xl ${meta.color}`}
                      >
                        {item.intensity_category}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-4 text-sm font-mono text-white/70 tabular-nums">
                      {item.valid_percentage != null
                        ? `${item.valid_percentage.toFixed(1)}%`
                        : "—"}
                    </TableCell>

                    <TableCell className="py-4 text-xs text-white/50 font-mono">
                      {dateStr}
                    </TableCell>

                    <TableCell className="py-4 pr-6 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0 rounded-full hover:bg-white/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspect(item);
                        }}
                      >
                        <Eye className="size-4 text-sky-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-white/8 text-xs text-muted-foreground">
        <span>
          Total Indexed: <strong className="text-white font-mono">{total}</strong>
        </span>

        <div className="flex items-center gap-2">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="size-7 p-0 border-white/10 bg-white/2 hover:bg-white/10 text-white rounded-lg"
              disabled={offset === 0 || loading}
              onClick={() => onOffsetChange(Math.max(0, offset - limit))}
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="size-7 p-0 border-white/10 bg-white/2 hover:bg-white/10 text-white rounded-lg"
              disabled={currentPage >= totalPages || loading}
              onClick={() => onOffsetChange(offset + limit)}
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
