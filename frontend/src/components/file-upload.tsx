"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import {
  CloudUpload,
  FileCheck2,
  FileText,
  RotateCcw,
  Sparkles,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface FileUploadProps {
  onAnalyze: (file: File) => Promise<void>;
  loading: boolean;
}

export function FileUpload({ onAnalyze, loading }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 3D Card Tilt on Pointer Move
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), {
    stiffness: 250,
    damping: 25,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), {
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

  const validateFile = (file: File): boolean => {
    const validExtensions = [".nc", ".nc4", ".netcdf"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!validExtensions.includes(ext)) {
      toast.error("Format Rejected", {
        description: "Please upload an INSAT-3D/Kalpana NetCDF file (.nc, .nc4, .netcdf).",
      });
      return false;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File Size Exceeded", {
        description: "Maximum supported satellite file size is 50 MB.",
      });
      return false;
    }

    return true;
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        toast.info("Satellite Observation Staged", {
          description: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
        });
      }
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        toast.info("Satellite Observation Staged", {
          description: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
        });
      }
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLoadDemo = async () => {
    try {
      toast.loading("Fetching observation from Indian Ocean Basin...", { id: "demo-load" });
      const response = await fetch("/sample_cyclone.nc");
      if (!response.ok) throw new Error("Could not load sample file.");
      const blob = await response.blob();
      const demoFile = new File([blob], "INSAT3D_Demo_Cyclone_Observation.nc", {
        type: "application/x-netcdf",
      });
      setSelectedFile(demoFile);
      toast.success("Sample NetCDF Observation Staged!", {
        id: "demo-load",
        description: "Ready for deep learning CNN inference.",
      });
    } catch (err: any) {
      toast.error("Observation Load Failed", {
        id: "demo-load",
        description: err.message || "Failed to fetch sample NetCDF.",
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    await onAnalyze(selectedFile);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="apple-glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl flex flex-col justify-between"
    >
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/8">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-sky-400" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-sky-400 font-bold">
                Telemetry Ingestion
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-1">
              Satellite Observation Feed
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              TIR-1 Brightness Temperature Grid Arrays (NetCDF)
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadDemo}
            disabled={loading}
            className="h-8 text-xs bg-white/4 border-white/10 hover:bg-white/8 text-sky-300 gap-1.5"
          >
            <Sparkles className="size-3.5" />
            <span className="hidden sm:inline">Load Sample Observation</span>
          </Button>
        </div>

        {/* Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !selectedFile && fileInputRef.current?.click()}
          className={`relative mt-6 border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
            selectedFile
              ? "border-sky-500/40 bg-sky-500/5 cursor-default"
              : dragActive
              ? "border-sky-400 bg-sky-500/10 scale-[1.01]"
              : "border-white/10 hover:border-sky-500/30 hover:bg-white/2 cursor-pointer"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".nc,.nc4,.netcdf"
            onChange={handleChange}
            className="hidden"
          />

          {!selectedFile ? (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="size-16 rounded-2xl bg-white/3 border border-white/10 flex items-center justify-center text-sky-400 shadow-xl">
                <UploadCloud className="size-8" />
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  Drop satellite observation file here
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  or click to select from local workstation
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <Badge variant="outline" className="text-[10px] font-mono border-white/10 text-white/70">
                  .NC
                </Badge>
                <Badge variant="outline" className="text-[10px] font-mono border-white/10 text-white/70">
                  .NC4
                </Badge>
                <Badge variant="outline" className="text-[10px] font-mono border-white/10 text-white/70">
                  .NETCDF
                </Badge>
                <span className="text-[11px] text-muted-foreground font-mono">
                  Up to 50 MB
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2">
              <div className="flex items-center gap-3.5 text-left">
                <div className="size-12 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                  <FileText className="size-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white truncate max-w-50 sm:max-w-xs">
                      {selectedFile.name}
                    </p>
                    <FileCheck2 className="size-4 text-emerald-400 shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for Inference
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  disabled={loading}
                  className="text-xs text-muted-foreground hover:text-white"
                >
                  <X className="size-3.5 mr-1" />
                  Clear
                </Button>

                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full sm:w-auto bg-white text-black hover:bg-white/90 font-bold text-xs px-5 shadow-xl shadow-white/10"
                >
                  {loading ? (
                    <>
                      <RotateCcw className="size-3.5 mr-2 animate-spin" />
                      Inference in Progress...
                    </>
                  ) : (
                    <>
                      <Zap className="size-3.5 mr-1.5 text-amber-500 fill-amber-500" />
                      Run CNN Inference
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sensor Specs Footer */}
      <div className="mt-6 pt-6 border-t border-white/8 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-muted-foreground">
        <span>Calibration: In-Memory Bilinear Resampler</span>
        <span className="text-sky-400 font-semibold">Normalized [180K, 310K]</span>
      </div>
    </motion.div>
  );
}
