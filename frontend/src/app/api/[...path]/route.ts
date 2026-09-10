import { NextRequest, NextResponse } from "next/server";

/**
 * Catch-all API proxy route.
 *
 * Forwards every request hitting /api/* to the Python backend
 * (configured via BACKEND_URL env var). This eliminates CORS and
 * makes the frontend + backend appear as a single deployment.
 *
 * Example:
 *   GET  /api/health        → GET  https://backend.onrender.com/health
 *   POST /api/predict        → POST https://backend.onrender.com/predict
 *   GET  /api/predictions?limit=20 → GET https://backend.onrender.com/predictions?limit=20
 */

const BACKEND_URL =
  process.env.BACKEND_URL || "https://cycloneai-backend.onrender.com";

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const normalizedBase = BACKEND_URL.replace(/\/+$/, "");
  const cleanPath = path.map(encodeURIComponent).join("/");
  const url = new URL(`${normalizedBase}/${cleanPath}`);

  // Forward query parameters
  req.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  // Build fetch options — forward method, headers, and body
  const fetchOptions: RequestInit = {
    method: req.method,
    headers: {
      // Forward select headers; skip host/connection
      ...(req.headers.get("content-type")
        ? { "content-type": req.headers.get("content-type")! }
        : {}),
      ...(req.headers.get("accept")
        ? { accept: req.headers.get("accept")! }
        : {}),
    },
  };

  // Forward body for non-GET/HEAD requests
  if (req.method !== "GET" && req.method !== "HEAD") {
    fetchOptions.body = await req.arrayBuffer();
    // For multipart form data, we need to let fetch set the boundary
    // so remove the content-type header and pass the raw body
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      // Pass the original content-type with boundary intact
      (fetchOptions.headers as Record<string, string>)["content-type"] =
        contentType;
    }
  }

  try {
    const backendRes = await fetch(url.toString(), fetchOptions);

    // Build response headers, excluding hop-by-hop and encoding headers
    // (fetch automatically decompresses the body, so forwarding content-encoding causes ERR_CONTENT_DECODING_FAILED)
    const responseHeaders = new Headers();
    const skippedHeaders = [
      "content-encoding",
      "content-length",
      "transfer-encoding",
      "connection",
      "keep-alive",
    ];

    backendRes.headers.forEach((value, key) => {
      if (!skippedHeaders.includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    responseHeaders.set("Access-Control-Allow-Origin", "*");

    const bodyData = await backendRes.arrayBuffer();

    return new NextResponse(bodyData, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Backend proxy error:", error);
    return NextResponse.json(
      {
        error: "Backend service unavailable",
        detail:
          "The prediction backend is currently offline or unreachable. It may be waking up from sleep (free tier). Please retry in 30-60 seconds.",
      },
      { status: 502 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;

// App Router route segment config
export const fetchCache = "force-no-store";
export const maxDuration = 60;
