import {
  HealthResponse,
  ModelInfoResponse,
  PredictionHistoryResponse,
  PredictionResponse,
  SummaryResponse,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api";
const DIRECT_BACKEND_URL = "https://cycloneai-backend.onrender.com";

async function requestWithFallback(
  path: string,
  options?: RequestInit
): Promise<Response> {
  const primaryUrl = `${API_BASE_URL}${path}`;
  const fallbackUrl = `${DIRECT_BACKEND_URL}${path}`;

  try {
    const res = await fetch(primaryUrl, options);
    // If the proxy route is working, return it
    if (res.ok) return res;
    // If proxy returned a gateway/offline error or 404, fallback directly to Render
    if (res.status === 502 || res.status === 503 || res.status === 504 || res.status === 404) {
      return await fetch(fallbackUrl, options);
    }
    return res;
  } catch {
    // If proxy network request failed entirely, fetch directly from Render
    return await fetch(fallbackUrl, options);
  }
}

export async function checkBackendHealth(): Promise<{
  online: boolean;
  latencyMs: number;
  data?: HealthResponse;
}> {
  const start = performance.now();
  try {
    const res = await requestWithFallback("/", {
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
  const res = await requestWithFallback("/model-info", {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to load model details (${res.status})`);
  }
  return res.json();
}

export async function fetchSummary(): Promise<SummaryResponse> {
  const res = await requestWithFallback("/predictions/summary", {
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

  const path = `/predictions?${query.toString()}`;
  const res = await requestWithFallback(path, {
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
  const res = await requestWithFallback(`/predictions/${id}`, {
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
  const primaryUrl = `${API_BASE_URL}/predict`;
  const fallbackUrl = `${DIRECT_BACKEND_URL}/predict`;

  const makeFormData = () => {
    const formData = new FormData();
    formData.append("file", file);
    return formData;
  };

  let res: Response;
  try {
    res = await fetch(primaryUrl, {
      method: "POST",
      body: makeFormData(),
    });
    if (!res.ok && (res.status === 502 || res.status === 503 || res.status === 504 || res.status === 404)) {
      res = await fetch(fallbackUrl, {
        method: "POST",
        body: makeFormData(),
      });
    }
  } catch {
    res = await fetch(fallbackUrl, {
      method: "POST",
      body: makeFormData(),
    });
  }

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
    color: "text-slate-400 bg-slate-500/10",
    badgeVariant: "secondary" as const,
    description: "Sustained surface winds below 17 knots (< 31 km/h).",
  },
  {
    name: "Depression",
    minWind: 17,
    maxWind: 27,
    color: "text-blue-400 bg-blue-500/10",
    badgeVariant: "secondary" as const,
    description: "Sustained winds 17–27 knots (31–49 km/h).",
  },
  {
    name: "Deep Depression",
    minWind: 28,
    maxWind: 33,
    color: "text-cyan-400 bg-cyan-500/10",
    badgeVariant: "secondary" as const,
    description: "Sustained winds 28–33 knots (50–61 km/h).",
  },
  {
    name: "Cyclonic Storm",
    minWind: 34,
    maxWind: 47,
    color: "text-teal-400 bg-teal-500/10",
    badgeVariant: "secondary" as const,
    description: "Sustained winds 34–47 knots (62–88 km/h).",
  },
  {
    name: "Severe Cyclonic Storm",
    minWind: 48,
    maxWind: 63,
    color: "text-amber-400 bg-amber-500/10",
    badgeVariant: "default" as const,
    description: "Sustained winds 48–63 knots (89–117 km/h).",
  },
  {
    name: "Very Severe Cyclonic Storm",
    minWind: 64,
    maxWind: 89,
    color: "text-orange-400 bg-orange-500/10",
    badgeVariant: "default" as const,
    description: "Sustained winds 64–89 knots (118–166 km/h).",
  },
  {
    name: "Extremely Severe Cyclonic Storm",
    minWind: 90,
    maxWind: 119,
    color: "text-rose-400 bg-rose-500/10",
    badgeVariant: "destructive" as const,
    description: "Sustained winds 90–119 knots (167–221 km/h).",
  },
  {
    name: "Super Cyclonic Storm",
    minWind: 120,
    maxWind: 999,
    color: "text-red-500 bg-red-500/20",
    badgeVariant: "destructive" as const,
    description: "Sustained winds ≥ 120 knots (≥ 222 km/h).",
  },
];

export function getCategoryMetadata(categoryName: string) {
  return (
    IMD_CATEGORIES.find(
      (c) => c.name.toLowerCase() === categoryName?.toLowerCase()
    ) || {
      name: categoryName || "Unknown",
      minWind: 0,
      maxWind: 0,
      color: "text-gray-400 bg-gray-500/10",
      badgeVariant: "secondary" as const,
      description: "Unclassified intensity observation.",
    }
  );
}
