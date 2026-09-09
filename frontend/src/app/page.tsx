"use client";

import { useEffect, useState, useCallback, useRef, ChangeEvent, DragEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  AlertTriangle,
  Archive,
  BarChart3,
  CloudUpload,
  FileText,
  Gauge,
  RefreshCw,
  Search,
  Wind,
  X,
  ChevronRight,
  Eye,
  Maximize2,
} from "lucide-react";
import { DissolvedNav } from "@/components/dissolved-nav";
import { SatelliteShowcaseEarth } from "@/components/satellite-showcase-earth";
import {
  fetchPredictionHistory,
  fetchSummary,
  predictCycloneFile,
  getCategoryMetadata,
  IMD_CATEGORIES,
} from "@/lib/api";
import {
  PredictionHistoryItem,
  PredictionResponse,
  SummaryResponse,
} from "@/lib/types";
import { toast } from "sonner";

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [visualMode, setVisualMode] = useState<"thermal" | "grayscale">("thermal");
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [history, setHistory] = useState<PredictionHistoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [offset, setOffset] = useState(0);
  const LIMIT = 7;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const data = await fetchSummary();
      setSummary(data);
    } catch {
      // Backend offline or booting
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const data = await fetchPredictionHistory({
        limit: LIMIT,
        offset,
        search,
        category,
      });
      setHistory(data.predictions || []);
      setTotalCount(data.total || 0);
    } catch {
      // Backend offline
    }
  }, [offset, search, category]);

  // Synchronize history when pagination or search filters change
  useEffect(() => {
    let ignore = false;
    async function sync() {
      try {
        const data = await fetchPredictionHistory({
          limit: LIMIT,
          offset,
          search,
          category,
        });
        if (!ignore) {
          setHistory(data.predictions || []);
          setTotalCount(data.total || 0);
        }
      } catch {
        // Backend offline
      }
    }
    sync();
    return () => {
      ignore = true;
    };
  }, [offset, search, category]);

  const validateAndSetFile = (selectedFile: File) => {
    setError("");
    setPrediction(null);

    const validExtensions = [".nc", ".nc4", ".netcdf"];
    const ext = selectedFile.name
      .substring(selectedFile.name.lastIndexOf("."))
      .toLowerCase();

    if (!validExtensions.includes(ext)) {
      setError("Please upload a NetCDF satellite file (.nc, .nc4, or .netcdf).");
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setError("File is too large. Maximum supported size is 50 MB.");
      return;
    }

    setFile(selectedFile);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) validateAndSetFile(selected);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) validateAndSetFile(dropped);
  };

  const clearFile = () => {
    setFile(null);
    setPrediction(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLoadSample = useCallback(async (autoRun = true) => {
    try {
      toast.loading("Loading Cyclone Burevi sample...", { id: "sample" });
      const res = await fetch("/BUREVI_20201129_1800.nc");
      if (!res.ok) throw new Error("Could not fetch BUREVI_20201129_1800.nc sample file.");
      const blob = await res.blob();
      const sampleFile = new File([blob], "BUREVI_20201129_1800.nc", {
        type: "application/x-netcdf",
      });
      validateAndSetFile(sampleFile);
      toast.success("Cyclone Burevi sample staged (64.1 KB)", { id: "sample" });

      if (autoRun) {
        setLoading(true);
        setError("");
        try {
          const data = await predictCycloneFile(sampleFile);
          setPrediction(data);
          await loadDashboard();
          await loadHistory();
          toast.success("Cyclone Burevi: 60.8 KT • Severe Cyclonic Storm", { id: "sample" });
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : "Prediction inference failed.");
        } finally {
          setLoading(false);
        }
      }
    } catch (err: unknown) {
      toast.error("Failed to load sample", {
        id: "sample",
        description: err instanceof Error ? err.message : "Failed to load sample.",
      });
    }
  }, [loadDashboard, loadHistory]);

  const predictCyclone = async () => {
    if (!file) {
      setError("Please select a NetCDF satellite file first.");
      return;
    }

    setLoading(true);
    setError("");
    setPrediction(null);

    try {
      const data = await predictCycloneFile(file);
      setPrediction(data);
      await loadDashboard();
      await loadHistory();
      toast.success("Prediction complete", {
        description: `${data.prediction.intensity_category} (${data.prediction.wind_speed_kt.toFixed(1)} kt)`,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Prediction inference failed.");
    } finally {
      setLoading(false);
    }
  };

  // Initial mount: load sample observation and dashboard metrics asynchronously
  const initialMounted = useRef(false);
  useEffect(() => {
    if (initialMounted.current) return;
    initialMounted.current = true;

    let ignore = false;
    async function initSampleAndDashboard() {
      try {
        const res = await fetch("/BUREVI_20201129_1800.nc");
        if (!res.ok) return;
        const blob = await res.blob();
        if (ignore) return;
        const sampleFile = new File([blob], "BUREVI_20201129_1800.nc", {
          type: "application/x-netcdf",
        });
        setFile(sampleFile);
        setLoading(true);
        const data = await predictCycloneFile(sampleFile);
        if (ignore) return;
        setPrediction(data);
        const [sumData, histData] = await Promise.all([
          fetchSummary().catch(() => null),
          fetchPredictionHistory({ limit: LIMIT, offset: 0 }).catch(() => null),
        ]);
        if (!ignore) {
          if (sumData) setSummary(sumData);
          if (histData) {
            setHistory(histData.predictions || []);
            setTotalCount(histData.total || 0);
          }
        }
      } catch {
        // Sample load error handled gracefully
      } finally {
        if (!ignore) {
          setLoading(false);
          setDashboardLoading(false);
        }
      }
    }

    initSampleAndDashboard();
    return () => {
      ignore = true;
    };
  }, []);

  const totalPages = summary?.total_predictions
    ? Math.ceil(summary.total_predictions / LIMIT)
    : 1;
  const currentPage = Math.floor(offset / LIMIT) + 1;

  // Dim and blur background brightness whenever telemetry data is displayed
  const isShowingData = Boolean(prediction !== null || isHistoryModalOpen || loading);

  return (
    <div className="relative min-h-screen w-full overflow-y-auto overflow-x-hidden bg-black text-[#F5F5F7] flex flex-col select-none 2xl:h-screen 2xl:overflow-hidden">
      {/* 3D Earth Rotating Showcase Background with orbiting satellites */}
      <SatelliteShowcaseEarth dimmed={isShowingData} />

      {/* Dissolved Top Navbar (No hard border, dissolves directly into cosmic space) */}
      <DissolvedNav
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onRefreshAll={() => {
          loadDashboard();
          loadHistory();
        }}
        isRefreshing={dashboardLoading}
        historyCount={summary?.total_predictions ?? totalCount}
      />

      {/* Main Dynamic Viewport Container (Zero Scroll on Large Displays, Smooth Scroll on Laptops/Mobiles) */}
      <main className="relative flex-1 w-full min-h-0 pt-20 sm:pt-24 pb-6 sm:pb-3 px-4 sm:px-8 lg:px-12 flex flex-col justify-between z-10">
        {/* Error notification banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 rounded-full bg-rose-500/20 text-rose-300 text-xs backdrop-blur-xl"
            >
              <AlertTriangle className="size-3.5 shrink-0" />
              <span>{error}</span>
              <button onClick={() => setError("")} className="p-0.5 hover:text-white">
                <X className="size-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Workspace Viewport Container */}
        <div className="flex-1 min-h-0 relative flex flex-col justify-between gap-6 lg:gap-2 py-1 sm:py-2">
          {/* Main Content Grid: Left Ingestion Controls & Right Live Telemetry + Storm Eye */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-6 xl:gap-10 items-start flex-1 min-h-0">
            {/* Left Column: Title + HUD Frame + Ingestion */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-start w-full min-w-0">
              {/* Big Bold Headline */}
              <div className="space-y-1 sm:space-y-1.5 min-w-0">
                <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-black font-space text-white tracking-tight uppercase leading-none break-words">
                  CYCLONE INTENSITY
                </h1>
                <p className="text-[11px] sm:text-xs xl:text-sm font-mono tracking-wider text-white/70 uppercase font-semibold break-words">
                  AUTOMATED SATELLITE INTENSITY ESTIMATION SYSTEM
                </p>
              </div>

              {/* Sleek HUD Separator Line */}
              <div className="relative w-full max-w-md my-2.5 sm:my-3">
                <svg
                  className="w-full h-6 overflow-visible pointer-events-none"
                  viewBox="0 0 420 28"
                  fill="none"
                >
                  <path
                    d="M 0 6 L 310 6 L 335 26"
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>

              {/* HUD Subsection Card */}
              <div className="space-y-3 sm:space-y-4 w-full min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-orbitron text-xs sm:text-sm xl:text-base font-bold tracking-wider text-white uppercase">
                    {prediction ? "OBSERVATION METRICS" : "SATELLITE INGESTION"}
                  </span>
                  <span className="text-xs font-mono text-sky-400 font-semibold">
                    {prediction
                      ? `${prediction.input.tb_variable} • ${prediction.input.original_shape.join("×")}`
                      : "NETCDF • 128×128"}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-white/75 leading-relaxed font-sans">
                  {prediction
                    ? `Processed observation for ${prediction.input.filename} (${(prediction.input.file_size_bytes / 1024).toFixed(1)} KB) with ${prediction.data_quality.valid_percentage.toFixed(1)}% valid sensor pixels.`
                    : "Satellite meteorological intelligence estimates tropical cyclone intensity, maximum sustained wind speeds, and central minimum pressure from infrared observation fields."}
                </p>

                {/* File Ingestion & Trigger */}
                <div className="pt-1 sm:pt-2">
                  {!file ? (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      className="p-4 sm:p-5 rounded-3xl bg-black/50 backdrop-blur-xl transition-all space-y-3 sm:space-y-4 shadow-xl"
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="size-10 sm:size-12 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-400 shrink-0">
                          <CloudUpload className="size-5 sm:size-6" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm sm:text-base font-bold text-white truncate">
                            Drop NetCDF Satellite File
                          </p>
                          <p className="text-[11px] sm:text-xs text-white/60 font-mono mt-0.5">
                            .nc, .nc4 raster • max 50 MB
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1">
                        <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-orbitron font-bold tracking-wider bg-white hover:bg-sky-400 text-black transition-all shadow-md">
                          Browse File
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".nc,.nc4,.netcdf"
                            onChange={handleFileChange}
                            hidden
                          />
                        </label>

                        <button
                          onClick={() => handleLoadSample(true)}
                          className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-orbitron font-bold tracking-wider bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 transition-all shadow-sm"
                        >
                          <ChevronRight className="size-4 text-sky-400 shrink-0" />
                          <span className="truncate">Load Burevi Sample</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 sm:p-5 rounded-3xl bg-sky-950/30 backdrop-blur-xl space-y-3.5 shadow-xl min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 sm:gap-3 truncate min-w-0">
                          <FileText className="size-4 sm:size-5 text-sky-400 shrink-0" />
                          <span className="text-xs sm:text-sm xl:text-base font-bold text-white truncate">
                            {file.name}
                          </span>
                        </div>
                        <button
                          onClick={clearFile}
                          disabled={loading}
                          className="px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold text-white/60 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                        >
                          Clear
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono text-sky-300/80 pt-1 font-semibold">
                        <span>{(file.size / 1024).toFixed(1)} KB</span>
                        <span className="truncate ml-2">
                          {prediction?.input?.cyclone_name
                            ? `CYCLONE ${prediction.input.cyclone_name}${prediction.input.cyclone_id ? ` (${prediction.input.cyclone_id.slice(0, 4)})` : ""}`
                            : file.name.includes("BUREVI")
                              ? "CYCLONE BUREVI (2020)"
                              : "NETCDF SATELLITE RASTER"}
                        </span>
                      </div>

                      <button
                        onClick={predictCyclone}
                        disabled={loading}
                        className="w-full mt-2 py-3 sm:py-3.5 rounded-2xl text-xs sm:text-sm xl:text-base font-orbitron font-black tracking-wider uppercase bg-white text-black hover:bg-sky-400 hover:text-black transition-all flex items-center justify-center gap-2 sm:gap-2.5 shadow-[0_0_30px_rgba(56,189,248,0.35)] min-w-0"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="size-4 animate-spin shrink-0" />
                            <span className="truncate">ANALYZING SATELLITE TENSOR...</span>
                          </>
                        ) : (
                          <>
                            <Activity className="size-4 shrink-0" />
                            <span className="truncate">RUN INTENSITY ESTIMATION</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Large HUD Telemetry Readout & Satellite Storm Visual */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-start items-end w-full min-w-0">
              {!prediction ? (
                <div className="p-6 sm:p-8 rounded-3xl bg-black/60 backdrop-blur-xl max-w-lg text-right space-y-4 shadow-2xl">
                  <div className="flex items-center justify-end gap-2.5 text-sky-400">
                    <span className="text-xs font-orbitron font-bold tracking-widest uppercase">
                      NEURAL INFERENCE ENGINE READY
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-orbitron font-black text-white tracking-wider">
                    AWAITING OBSERVATION
                  </h3>
                  <p className="text-sm text-white/70 leading-relaxed font-sans">
                    Select a NetCDF satellite raster on the left or load the Cyclone Burevi benchmark tensor to compute instantaneous vortex wind speeds and central eye depression.
                  </p>
                  <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 text-xs font-mono">
                    <span className="px-3.5 py-1.5 rounded-xl bg-white/5 text-white/80 font-semibold">
                      128×128 GRID INPUT
                    </span>
                    <span className="px-3.5 py-1.5 rounded-xl bg-sky-500/10 text-sky-300 font-semibold">
                      DUAL-HEAD CNN BACKBONE
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col items-end space-y-3.5 min-w-0">
                  {/* Top Header Tag */}
                  <div className="w-full flex flex-col sm:flex-row items-center sm:justify-between pb-2 gap-1.5 sm:gap-2 min-w-0">
                    <div className="flex items-center gap-2 text-xs font-mono text-white/60 min-w-0 max-w-full truncate">
                      <span className="text-white font-bold uppercase tracking-wider text-xs sm:text-sm truncate">
                        {prediction.input.filename}
                      </span>
                      <span className="text-white/30 shrink-0">•</span>
                      <span className="text-white/70 font-semibold shrink-0">{prediction.input.original_shape.join("×")} MATRIX</span>
                    </div>
                    <div className="text-[11px] sm:text-xs font-mono text-sky-400 tracking-wider uppercase font-semibold flex items-center gap-2 shrink-0">
                      {prediction.input.cyclone_latitude != null && prediction.input.cyclone_longitude != null
                        ? `STORM CENTER: ${prediction.input.cyclone_latitude}°N, ${prediction.input.cyclone_longitude}°E${prediction.input.observation_time ? ` • ${prediction.input.observation_time.split(" ")[1] || prediction.input.observation_time} UTC` : ""}`
                        : `THERMAL IR (${prediction.input.tb_variable}) • 4 KM RESOLUTION`}
                    </div>
                  </div>

                  {/* Side-by-side: Satellite Storm Viewer (Left) & Digital Telemetry (Right) */}
                  <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-5 xl:gap-6 items-center">
                    {/* Left Side: Satellite Storm Viewer Card */}
                    {prediction.satellite_image_base64 && (
                      <div className="md:col-span-5 flex flex-col items-center justify-center min-w-0">
                        <div className="relative p-3 sm:p-3.5 rounded-3xl bg-black/75 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.9)] flex flex-col items-center space-y-2.5 sm:space-y-3 w-full max-w-64 sm:max-w-72 xl:max-w-80">
                          {/* Corner Reticles */}


                          {/* Storm Viewer Title & Colormap Switcher */}
                          <div className="w-full flex items-center justify-between px-1 text-xs font-orbitron tracking-wider">
                            <span className="text-white font-bold flex items-center gap-2">
                              <Eye className="size-3.5 text-sky-400" />
                              STORM EYE
                            </span>
                            <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-xl text-xs font-mono">
                              <button
                                onClick={() => setVisualMode("thermal")}
                                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all font-bold text-[10px] sm:text-xs ${
                                  visualMode === "thermal"
                                    ? "bg-sky-400 text-black shadow-sm"
                                    : "text-white/70 hover:text-white"
                                }`}
                              >
                                THERMAL
                              </button>
                              <button
                                onClick={() => setVisualMode("grayscale")}
                                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all font-bold text-[10px] sm:text-xs ${
                                  visualMode === "grayscale"
                                    ? "bg-white text-black shadow-sm"
                                    : "text-white/70 hover:text-white"
                                }`}
                              >
                                RAW IR
                              </button>
                            </div>
                          </div>

                          {/* Storm Satellite Image Frame */}
                          <div
                            onClick={() => setIsZoomModalOpen(true)}
                            className="relative w-full aspect-square rounded-xl overflow-hidden bg-black cursor-pointer group"
                            title="Click to inspect high-resolution storm matrix"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={
                                visualMode === "thermal"
                                  ? prediction.satellite_image_base64
                                  : (prediction.satellite_image_gray_base64 || prediction.satellite_image_base64)
                              }
                              alt="Satellite Infrared Observation"
                              className="w-full h-full object-cover select-none pointer-events-none [image-rendering:pixelated] group-hover:scale-105 transition-transform duration-300"
                            />

                            {/* Radar Range Rings & Crosshairs */}
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                              <div className="absolute size-3/4 rounded-full ring-1 ring-sky-400/25 ring-dashed" />
                              <div className="absolute size-1/2 rounded-full ring-1 ring-sky-400/35" />
                              <div className="w-full h-px bg-sky-400/30 absolute" />
                              <div className="h-full w-px bg-sky-400/30 absolute" />
                              <div className="size-5 ring-2 ring-sky-400 rounded-sm" />
                            </div>

                            {/* Compass markers */}
                            <span className="absolute top-1.5 left-1/2 -translate-x-1/2 text-xs font-mono font-bold text-white/70 pointer-events-none">N</span>
                            <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-xs font-mono font-bold text-white/70 pointer-events-none">S</span>
                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-white/70 pointer-events-none">W</span>
                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-white/70 pointer-events-none">E</span>

                            {/* Expand Overlay hint on hover */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-xs font-orbitron font-bold text-white">
                              <Maximize2 className="size-4 text-sky-400" />
                              <span>INSPECT FULL MATRIX</span>
                            </div>
                          </div>

                          {/* Thermal Scale / Legend */}
                          <div className="w-full px-1 space-y-1.5">
                            <div
                              className="h-2 w-full rounded-full"
                              style={{
                                background:
                                  visualMode === "thermal"
                                    ? "linear-gradient(to right, #000000, #781c6d, #ed6925, #fcffa4)"
                                    : "linear-gradient(to right, #000000, #ffffff)",
                              }}
                            />
                            <div className="flex items-center justify-between text-xs font-mono text-white/70 font-semibold">
                              <span>
                                {prediction.data_quality.minimum_kelvin.toFixed(0)}K (
                                {(prediction.data_quality.minimum_kelvin - 273.15).toFixed(0)}°C)
                              </span>
                              <span className="text-white/40 uppercase">
                                {visualMode === "thermal" ? "INFERNO IR" : "GRAYSCALE"}
                              </span>
                              <span>
                                {prediction.data_quality.maximum_kelvin.toFixed(0)}K (
                                {(prediction.data_quality.maximum_kelvin - 273.15).toFixed(0)}°C)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Right Side: Digital Telemetry Readout */}
                    <div className={`flex flex-col items-center md:items-end text-center md:text-right space-y-2.5 sm:space-y-3 min-w-0 ${prediction.satellite_image_base64 ? "md:col-span-7" : "md:col-span-12"}`}>
                      {/* Header */}
                      <div className="flex flex-col items-center md:items-end">
                        <span className="text-xs font-orbitron font-bold tracking-[0.2em] text-sky-400 uppercase">
                          MODEL INFERENCE
                        </span>
                        <h2 className="text-base sm:text-lg font-orbitron font-bold text-white tracking-wide">
                          PEAK SUSTAINED WIND
                        </h2>
                      </div>

                      {/* Gigantic Number Readout */}
                      <div className="flex flex-col items-center md:items-end">
                        <div className="flex items-baseline gap-2">
                          <div className="text-4xl xs:text-5xl sm:text-6xl xl:text-7xl 2xl:text-8xl font-black font-orbitron text-white tracking-tight tabular-nums leading-none">
                            {prediction.prediction.wind_speed_kt.toFixed(1)}
                          </div>
                          <span className="text-base sm:text-xl xl:text-2xl font-bold font-orbitron text-sky-400">
                            KT
                          </span>
                        </div>
                        <span className="text-xs xs:text-sm sm:text-base font-mono font-semibold text-white/80 mt-1 sm:mt-1.5">
                          {(prediction.prediction.wind_speed_kt * 1.852).toFixed(1)} KM/H • 1-MIN SUSTAINED
                        </span>
                      </div>

                      {/* Central Pressure Telemetry */}
                      <div className="flex flex-col items-center md:items-end">
                        <span className="text-xs font-mono font-bold tracking-wider text-purple-400 uppercase">
                          ESTIMATED CENTRAL PRESSURE
                        </span>
                        <div className="text-2xl sm:text-4xl font-black font-orbitron text-purple-200 tabular-nums">
                          {prediction.prediction.pressure_mb.toFixed(1)}{" "}
                          <span className="text-sm sm:text-base font-bold text-purple-400 font-mono">MB / hPa</span>
                        </div>
                      </div>

                      {/* IMD Intensity Scale Classification Banner */}
                      {(() => {
                        const meta = getCategoryMetadata(prediction.prediction.intensity_category);
                        return (
                          <div
                            className={`py-2 px-4 sm:px-5 rounded-2xl flex items-center justify-between gap-4 ${meta.color} backdrop-blur-md w-full max-w-sm mx-auto md:mr-0 md:ml-auto shadow-lg`}
                          >
                            <span className="text-xs font-mono uppercase tracking-widest text-white/80 font-bold">
                              IMD STAGE
                            </span>
                            <span className="text-sm sm:text-base font-orbitron font-black text-white tracking-wider">
                              {prediction.prediction.intensity_category}
                            </span>
                          </div>
                        );
                      })()}

                      {/* Real Scientific Telemetry Grid */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-2.5 text-center md:text-right font-mono text-xs w-full max-w-sm mx-auto md:mr-0 md:ml-auto">
                        <div className="p-2 sm:p-2.5 rounded-xl bg-black/70 backdrop-blur-md">
                          <span className="text-white/50 block font-semibold text-[10px] sm:text-xs">SENSOR GRID</span>
                          <span className="font-bold text-white block mt-0.5 sm:mt-1 text-xs sm:text-sm">
                            {prediction.input.original_shape.join("×")}
                          </span>
                        </div>
                        <div className="p-2 sm:p-2.5 rounded-xl bg-black/70 border border-white/10 backdrop-blur-md">
                          <span className="text-white/50 block font-semibold text-[10px] sm:text-xs">VALID SENSOR</span>
                          <span className="font-bold text-white block mt-0.5 sm:mt-1 text-xs sm:text-sm">
                            {prediction.data_quality.valid_percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="p-2 sm:p-2.5 rounded-xl bg-black/70 border border-white/10 backdrop-blur-md">
                          <span className="text-white/50 block font-semibold text-[10px] sm:text-xs">LATENCY</span>
                          <span className="font-bold text-white block mt-0.5 sm:mt-1 text-xs sm:text-sm">
                            {prediction.processing.processing_time_seconds.toFixed(2)}s
                          </span>
                        </div>
                      </div>

                      {/* Real NetCDF Temperature Range */}
                      <div className="p-2 sm:p-2.5 rounded-xl bg-black/70 backdrop-blur-md flex flex-col sm:flex-row items-center sm:justify-between text-center sm:text-right font-mono text-xs w-full max-w-sm mx-auto md:mr-0 md:ml-auto gap-1 sm:gap-0">
                        <span className="text-white/50 font-semibold text-[10px] sm:text-xs">TEMPERATURE BOUNDS</span>
                        <span className="text-white font-bold text-[11px] sm:text-xs">
                          {prediction.data_quality.minimum_kelvin.toFixed(0)}K ({(prediction.data_quality.minimum_kelvin - 273.15).toFixed(0)}°C) → {prediction.data_quality.maximum_kelvin.toFixed(0)}K ({(prediction.data_quality.maximum_kelvin - 273.15).toFixed(0)}°C)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Overview Telemetry HUD Dock — only visible after a prediction */}
          {prediction && (
            <div className="pt-2 pb-6 lg:pb-1 w-full max-w-6xl mx-auto shrink-0 z-20 pointer-events-auto">
              <div className="p-3 sm:p-4 rounded-3xl bg-black/70 backdrop-blur-2xl flex flex-wrap items-center justify-between gap-4 shadow-[0_0_40px_rgba(0,0,0,0.9)]">
                {/* Real KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-4 w-full">
                  <div className="flex items-center gap-2.5 sm:gap-3.5 p-3 sm:px-4 sm:py-2.5 rounded-2xl bg-white/4">
                    <BarChart3 className="size-4 sm:size-5 text-sky-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] sm:text-xs text-white/60 uppercase font-mono font-bold tracking-wider truncate">
                        TOTAL INGESTED
                      </span>
                      <span className="text-base sm:text-xl lg:text-2xl font-black font-orbitron text-white tabular-nums truncate">
                        {dashboardLoading ? "—" : summary?.total_predictions?.toLocaleString() ?? 0}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 sm:gap-3.5 p-3 sm:px-4 sm:py-2.5 rounded-2xl bg-white/4 border border-white/8">
                    <Wind className="size-4 sm:size-5 text-teal-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] sm:text-xs text-white/60 uppercase font-mono font-bold tracking-wider truncate">
                        AVG SUSTAINED
                      </span>
                      <span className="text-base sm:text-xl lg:text-2xl font-black font-orbitron text-white tabular-nums truncate">
                        {dashboardLoading ? "—" : `${summary?.average_wind_kt?.toFixed(1) ?? "—"} KT`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 sm:gap-3.5 p-3 sm:px-4 sm:py-2.5 rounded-2xl bg-white/4 border border-white/8">
                    <Gauge className="size-4 sm:size-5 text-purple-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] sm:text-xs text-white/60 uppercase font-mono font-bold tracking-wider truncate">
                        AVG PRESSURE
                      </span>
                      <span className="text-base sm:text-xl lg:text-2xl font-black font-orbitron text-white tabular-nums truncate">
                        {dashboardLoading ? "—" : `${summary?.average_pressure_mb?.toFixed(1) ?? "—"} MB`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 sm:gap-3.5 p-3 sm:px-4 sm:py-2.5 rounded-2xl bg-white/4 border border-white/8">
                    <Activity className="size-4 sm:size-5 text-rose-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] sm:text-xs text-white/60 uppercase font-mono font-bold tracking-wider truncate">
                        PEAK RECORDED
                      </span>
                      <span className="text-base sm:text-xl lg:text-2xl font-black font-orbitron text-white tabular-nums truncate">
                        {dashboardLoading ? "—" : `${summary?.maximum_wind_kt?.toFixed(1) ?? "—"} KT`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* High-Resolution Satellite Storm Inspection Modal */}
        <AnimatePresence>
          {isZoomModalOpen && prediction && prediction.satellite_image_base64 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsZoomModalOpen(false)}
              className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.92, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.92, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-black/95 p-4 sm:p-6 flex flex-col items-center space-y-4 shadow-[0_0_60px_rgba(0,0,0,0.9)]"
              >
                <button
                  onClick={() => setIsZoomModalOpen(false)}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors z-10"
                >
                  <X className="size-4" />
                </button>

                {/* Modal Header */}
                <div className="text-center space-y-1 sm:space-y-1.5 px-6">
                  <span className="text-[10px] sm:text-xs font-mono tracking-[0.2em] text-sky-400 uppercase font-semibold">
                    {prediction.input.cyclone_name
                      ? `CYCLONE ${prediction.input.cyclone_name} • INFRARED OBSERVATION`
                      : "SATELLITE THERMAL INFRARED OBSERVATION"}
                  </span>
                  <h3 className="text-lg sm:text-2xl font-orbitron font-bold text-white tracking-wider break-all">
                    {prediction.input.filename}
                  </h3>
                  <p className="text-[11px] sm:text-sm text-white/60 font-mono">
                    {prediction.input.tb_variable} • {prediction.input.original_shape.join("×")} RASTER • 4 KM NADIR RESOLUTION
                  </p>
                </div>

                {/* Expanded Image */}
                <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-2xl overflow-hidden bg-black shadow-[0_0_50px_rgba(56,189,248,0.25)] shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      visualMode === "thermal"
                        ? prediction.satellite_image_base64
                        : (prediction.satellite_image_gray_base64 || prediction.satellite_image_base64)
                    }
                    alt="Expanded Satellite Infrared"
                    className="w-full h-full object-cover select-none pointer-events-none [image-rendering:pixelated]"
                  />

                  {/* Reticle Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="absolute size-3/4 rounded-full ring-1 ring-sky-400/25" />
                    <div className="absolute size-1/2 rounded-full ring-1 ring-sky-400/35" />
                    <div className="w-full h-px bg-sky-400/30 absolute" />
                    <div className="h-full w-px bg-sky-400/30 absolute" />
                    <div className="size-6 ring-2 ring-sky-400 rounded-sm" />
                  </div>
                </div>

                {/* Colormap & Stats Footer */}
                <div className="w-full max-w-md space-y-2 sm:space-y-2.5">
                  <div
                    className="h-2 sm:h-2.5 w-full rounded-full"
                    style={{
                      background:
                        visualMode === "thermal"
                          ? "linear-gradient(to right, #000000, #781c6d, #ed6925, #fcffa4)"
                          : "linear-gradient(to right, #000000, #ffffff)",
                    }}
                  />
                  <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono text-white/70 font-semibold">
                    <span>{prediction.data_quality.minimum_kelvin.toFixed(1)}K (Cold Core)</span>
                    <span>{prediction.data_quality.maximum_kelvin.toFixed(1)}K (Ocean Surface)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-1 sm:pt-2 text-xs font-mono">
                    <div className="p-2.5 sm:p-3 rounded-2xl bg-white/5">
                      <span className="text-white/50 block font-semibold text-[10px] sm:text-xs">VALID SENSOR PIXELS</span>
                      <span className="text-white font-bold text-xs sm:text-base mt-0.5 block">{prediction.data_quality.valid_pixels.toLocaleString()} ({prediction.data_quality.valid_percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="p-2.5 sm:p-3 rounded-2xl bg-white/5 border border-white/10">
                      <span className="text-white/50 block font-semibold text-[10px] sm:text-xs">MEAN BRIGHTNESS</span>
                      <span className="text-white font-bold text-xs sm:text-base mt-0.5 block">{prediction.data_quality.mean_kelvin.toFixed(1)} K ({(prediction.data_quality.mean_kelvin - 273.15).toFixed(0)}°C)</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prediction History Pop-up Modal */}
        <AnimatePresence>
          {isHistoryModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryModalOpen(false)}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 select-none"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                onClick={(e) => e.stopPropagation()}
                className="flex flex-col w-full max-w-5xl h-[85vh] sm:h-[78vh] max-h-160 rounded-3xl bg-black/95 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden"
              >
                {/* Toolbar */}
                <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 shrink-0">
                  <div className="flex items-center justify-between sm:justify-start gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 sm:p-2.5 rounded-2xl bg-sky-500/10">
                        <Archive className="size-4 sm:size-5 text-sky-400" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-lg font-orbitron font-bold text-white tracking-wider uppercase">
                          Prediction History Archive
                        </h3>
                        <p className="text-[10px] sm:text-xs text-white/60 font-mono mt-0.5">
                          Historical observation evaluations from SQLite database
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsHistoryModalOpen(false)}
                      className="sm:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                      title="Close history archive"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3 top-2.5 sm:top-3 size-3.5 sm:size-4 text-white/40 pointer-events-none" />
                      <input
                        placeholder="Search file..."
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setOffset(0);
                        }}
                        className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm bg-white/5 text-white placeholder:text-white/40 focus:outline-none font-mono"
                      />
                    </div>

                    <select
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        setOffset(0);
                      }}
                      className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm bg-black text-white focus:outline-none font-mono shrink-0"
                    >
                      <option value="">All Intensities</option>
                      {IMD_CATEGORIES.map((cat) => (
                        <option key={cat.name} value={cat.name} className="bg-black">
                          {cat.name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => setIsHistoryModalOpen(false)}
                      className="hidden sm:block p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors ml-1"
                      title="Close history archive"
                    >
                      <X className="size-5" />
                    </button>
                  </div>
                </div>

                {/* Table with internal horizontal & vertical scroll */}
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="sticky top-0 bg-black/95 backdrop-blur-md z-10">
                      <tr className="text-[10px] sm:text-xs font-mono text-white/60 font-bold uppercase tracking-wider">
                        <th className="py-3 sm:py-4 pl-4 sm:pl-6 font-semibold">OBSERVATION FILE</th>
                        <th className="py-3 sm:py-4 font-semibold">SUSTAINED WIND</th>
                        <th className="py-3 sm:py-4 font-semibold">CENTRAL PRESSURE</th>
                        <th className="py-3 sm:py-4 font-semibold">IMD CLASSIFICATION</th>
                        <th className="py-3 sm:py-4 font-semibold">SENSOR QUALITY</th>
                        <th className="py-3 sm:py-4 pr-4 sm:pr-6 font-semibold">TIMESTAMP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-xs sm:text-sm">
                      {history.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-20 text-white/40 text-sm">
                            No archived predictions found.
                          </td>
                        </tr>
                      ) : (
                        history.map((item) => {
                          const meta = getCategoryMetadata(item.intensity_category);
                          return (
                            <tr
                              key={item.prediction_id}
                              className="hover:bg-white/4 transition-colors"
                            >
                              <td className="py-3 sm:py-4 pl-4 sm:pl-6 text-white">
                                <div className="flex items-center gap-2 max-w-44 sm:max-w-xs truncate">
                                  <FileText className="size-3.5 sm:size-4 text-sky-400 shrink-0" />
                                  <span className="truncate font-medium text-xs sm:text-sm">{item.filename}</span>
                                </div>
                              </td>
                              <td className="py-3 sm:py-4 text-white">
                                <strong className="font-bold font-orbitron tabular-nums text-xs sm:text-base">
                                  {item.wind_speed_kt.toFixed(1)}
                                </strong>{" "}
                                <span className="text-white/50 text-[10px] sm:text-xs">kt</span>
                              </td>
                              <td className="py-3 sm:py-4 text-white">
                                <span className="tabular-nums text-xs sm:text-base font-semibold">
                                  {item.pressure_mb.toFixed(1)}
                                </span>{" "}
                                <span className="text-white/50 text-[10px] sm:text-xs">mb</span>
                              </td>
                              <td className="py-3 sm:py-4">
                                <span
                                  className={`inline-block px-2 sm:px-3 py-0.5 sm:py-1 rounded-xl text-[10px] sm:text-xs font-orbitron font-bold ${meta.color}`}
                                >
                                  {item.intensity_category}
                                </span>
                              </td>
                              <td className="py-3 sm:py-4 text-white/70 tabular-nums text-xs sm:text-sm">
                                {item.valid_percentage != null
                                  ? `${item.valid_percentage.toFixed(1)}%`
                                  : "—"}
                              </td>
                              <td className="py-3 sm:py-4 text-white/50 pr-4 sm:pr-6 text-[10px] sm:text-xs font-mono">
                                {new Date(item.created_at).toLocaleString()}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm font-mono text-white/60 shrink-0 bg-black/50">
                  <span>
                    TOTAL ARCHIVED:{" "}
                    <strong className="text-white font-mono text-sm sm:text-base font-bold ml-1">
                      {summary?.total_predictions ?? totalCount}
                    </strong>
                  </span>

                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="font-semibold text-[11px] sm:text-xs">
                      PAGE {currentPage} OF {totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={offset === 0}
                        onClick={() => setOffset(Math.max(0, offset - LIMIT))}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-white/5 hover:bg-white/15 text-white disabled:opacity-30 disabled:pointer-events-none transition-colors text-[10px] sm:text-xs font-orbitron font-bold"
                      >
                        PREV
                      </button>
                      <button
                        disabled={currentPage >= totalPages}
                        onClick={() => setOffset(offset + LIMIT)}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white disabled:opacity-30 disabled:pointer-events-none transition-colors text-[10px] sm:text-xs font-orbitron font-bold"
                      >
                        NEXT
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
