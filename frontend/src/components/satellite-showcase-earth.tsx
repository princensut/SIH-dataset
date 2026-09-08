"use client";

import { useEffect, useRef } from "react";

interface SatelliteShowcaseEarthProps {
  dimmed?: boolean;
}

export function SatelliteShowcaseEarth({ dimmed = false }: SatelliteShowcaseEarthProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 1.0;
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback: muted video is permitted in all modern browsers
      });
    }
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 bg-black">
      {/* 60 FPS Earth & Orbiting Satellite Showcase Video */}
      <video
        ref={videoRef}
        src="/satellite_earth_showcase.mp4?v=20260908"
        poster="/satellite_earth_poster.png?v=20260908"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className={`w-full h-full object-cover object-center lg:object-right select-none transition-all duration-700 ease-out ${
          dimmed
            ? "opacity-60 brightness-70 blur-xs"
            : "opacity-95 brightness-100 blur-0"
        }`}
      />

      {/* Dynamic dimming and blur backdrop overlay when showing data */}
      <div
        className={`absolute inset-0 transition-all duration-700 pointer-events-none ${
          dimmed ? "bg-black/55 backdrop-blur-xs" : "bg-transparent backdrop-blur-0"
        }`}
      />

      {/* Smooth shadow fade strictly covering the 30-40% region from the left (always active) */}
      <div
        className="absolute inset-0 pointer-events-none z-1"
        style={{
          background:
            "linear-gradient(to right, #000000 0%, #000000 24%, rgba(0,0,0,0.85) 30%, rgba(0,0,0,0.40) 35%, transparent 39%)",
        }}
      />

      {/* Smooth top and bottom dissolves */}
      <div className="absolute top-0 inset-x-0 h-24 bg-linear-to-b from-black via-black/80 to-transparent pointer-events-none z-1" />
      <div className="absolute bottom-0 inset-x-0 h-24 bg-linear-to-t from-black via-black/80 to-transparent pointer-events-none z-1" />
    </div>
  );
}
