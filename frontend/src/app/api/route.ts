import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL || "http://127.0.0.1:8000";

async function handler(req: NextRequest) {
  const normalizedBase = BACKEND_URL.replace(/\/+$/, "");
  const url = new URL(normalizedBase);

  // Forward query parameters
  req.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const fetchOptions: RequestInit = {
    method: req.method,
    headers: {
      ...(req.headers.get("content-type")
        ? { "content-type": req.headers.get("content-type")! }
        : {}),
      ...(req.headers.get("accept")
        ? { accept: req.headers.get("accept")! }
        : {}),
    },
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    fetchOptions.body = await req.arrayBuffer();
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      (fetchOptions.headers as Record<string, string>)["content-type"] =
        contentType;
    }
  }

  try {
    const backendRes = await fetch(url.toString(), fetchOptions);

    const responseHeaders = new Headers();
    backendRes.headers.forEach((value, key) => {
      if (
        !["transfer-encoding", "connection", "keep-alive"].includes(
          key.toLowerCase()
        )
      ) {
        responseHeaders.set(key, value);
      }
    });

    responseHeaders.set("Access-Control-Allow-Origin", "*");

    return new NextResponse(backendRes.body, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Backend proxy root error:", error);
    return NextResponse.json(
      {
        error: "Backend service unavailable",
        detail:
          "The prediction backend is currently offline or unreachable. It may be waking up from sleep. Please retry in 30-60 seconds.",
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

export const fetchCache = "force-no-store";
export const maxDuration = 60;
