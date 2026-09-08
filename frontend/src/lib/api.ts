import {
  HealthResponse,
  ModelInfoResponse,
  PredictionHistoryResponse,
  PredictionResponse,
  SummaryResponse,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function checkBackendHealth(): Promise<{
  online: boolean;
  latencyMs: number;
  data?: HealthResponse;
}> {
  const start = performance.now();
  try {
    const res = await fetch(`${API_BASE_URL}/`, {
      method: "GET",
      cache: "no-store",
    });
    const latency = Math.round(performance.now() - start);
    if (!res.ok) {
      return { online: false, latencyMs: latency };
    }
    const data: HealthResponse = await res.json();
    return { online: true, latencyMs: latency, data };
  } catch {
    return { online: false, latencyMs: 0 };
  }
}

export async function fetchModelInfo(): Promise<ModelInfoResponse> {
  const res = await fetch(`${API_BASE_URL}/model-info`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to load model details (${res.status})`);
  }
  return res.json();
}

export async function fetchSummary(): Promise<SummaryResponse> {
  const res = await fetch(`${API_BASE_URL}/predictions/summary`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to load prediction summary (${res.status})`);
  }
  return res.json();
}

export async function fetchPredictionHistory(params: {
  limit?: number;
  offset?: number;
  search?: string;
  category?: string;
}): Promise<PredictionHistoryResponse> {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.offset !== undefined) query.set("offset", String(params.offset));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.category?.trim()) query.set("category", params.category.trim());

  const res = await fetch(`${API_BASE_URL}/predictions?${query.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to retrieve history (${res.status})`);
  }
  return res.json();
}

export async function fetchPredictionById(
  id: string
): Promise<PredictionResponse> {
  const res = await fetch(`${API_BASE_URL}/predictions/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to retrieve prediction ${id} (${res.status})`);
  }
  return res.json();
}

export async function predictCycloneFile(
  file: File
): Promise<PredictionResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    const errorMsg =
      data.detail ||
      data.error ||
      "Prediction inference failed. Please check file format.";
    throw new Error(errorMsg);
  }
  return data;
}

export const IMD_CATEGORIES = [
  {
    name: "Below Depression",
    minWind: 0,
    maxWind: 16,
    color: "text-slate-400 border-slate-500/30 bg-slate-500/10",
    badgeVariant: "secondary" as const,
    description: "Sustained surface winds below 17 knots (< 31 km/h).",
  },
  {
    name: "Depression",
    minWind: 17,
    maxWind: 27,
    color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    badgeVariant: "secondary" as const,
    description: "Sustained winds 17–27 knots (31–49 km/h).",
  },
  {
    name: "Deep Depression",
    minWind: 28,
    maxWind: 33,
    color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
    badgeVariant: "secondary" as const,
    description: "Sustained winds 28–33 knots (50–61 km/h).",
  },
  {
    name: "Cyclonic Storm",
    minWind: 34,
    maxWind: 47,
    color: "text-teal-400 border-teal-500/30 bg-teal-500/10",
    badgeVariant: "secondary" as const,
    description: "Sustained winds 34–47 knots (62–88 km/h).",
  },
  {
    name: "Severe Cyclonic Storm",
    minWind: 48,
    maxWind: 63,
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    badgeVariant: "destructive" as const,
    description: "Sustained winds 48–63 knots (89–117 km/h).",
  },
  {
    name: "Very Severe Cyclonic Storm",
    minWind: 64,
    maxWind: 89,
    color: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    badgeVariant: "destructive" as const,
    description: "Sustained winds 64–89 knots (118–165 km/h).",
  },
  {
    name: "Extremely Severe Cyclonic Storm",
    minWind: 90,
    maxWind: 119,
    color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
    badgeVariant: "destructive" as const,
    description: "Sustained winds 90–119 knots (166–220 km/h).",
  },
  {
    name: "Super Cyclonic Storm",
    minWind: 120,
    maxWind: 300,
    color: "text-purple-400 border-purple-500/30 bg-purple-500/10 animate-pulse",
    badgeVariant: "destructive" as const,
    description: "Catastrophic winds ≥ 120 knots (≥ 221 km/h).",
  },
];

export function getCategoryMetadata(category: string) {
  const match = IMD_CATEGORIES.find(
    (c) => c.name.toLowerCase() === category.toLowerCase().trim()
  );
  return (
    match || {
      name: category,
      minWind: 0,
      maxWind: 0,
      color: "text-muted-foreground border-border bg-muted/20",
      badgeVariant: "outline" as const,
      description: "Tropical disturbance.",
    }
  );
}
