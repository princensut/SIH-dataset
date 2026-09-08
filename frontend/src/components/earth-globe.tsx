"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Compass, Eye, Info, Play, RotateCw, Wind } from "lucide-react";

export interface CycloneHotspot {
  id: string;
  name: string;
  year: number;
  lat: number;
  lon: number;
  peakWindKt: number;
  pressureMb: number;
  category: string;
  basin: string;
}

export const CYCLONE_HOTSPOTS: CycloneHotspot[] = [
  {
    id: "REMAL_2024",
    name: "Cyclone Remal",
    year: 2024,
    lat: 21.8,
    lon: 89.2,
    peakWindKt: 65.0,
    pressureMb: 978.0,
    category: "Severe Cyclonic Storm",
    basin: "Bay of Bengal",
  },
  {
    id: "Mocha",
    name: "Cyclone Mocha",
    year: 2023,
    lat: 20.1,
    lon: 92.8,
    peakWindKt: 115.0,
    pressureMb: 938.0,
    category: "Extremely Severe Cyclonic Storm",
    basin: "Bay of Bengal",
  },
  {
    id: "YAAS",
    name: "Cyclone Yaas",
    year: 2021,
    lat: 21.3,
    lon: 87.0,
    peakWindKt: 75.0,
    pressureMb: 970.0,
    category: "Very Severe Cyclonic Storm",
    basin: "Bay of Bengal",
  },
  {
    id: "Hamoon",
    name: "Cyclone Hamoon",
    year: 2023,
    lat: 21.5,
    lon: 91.8,
    peakWindKt: 65.0,
    pressureMb: 984.0,
    category: "Very Severe Cyclonic Storm",
    basin: "Bay of Bengal",
  },
  {
    id: "Mandous",
    name: "Cyclone Mandous",
    year: 2022,
    lat: 12.5,
    lon: 80.5,
    peakWindKt: 55.0,
    pressureMb: 990.0,
    category: "Severe Cyclonic Storm",
    basin: "Southwest Bay of Bengal",
  },
  {
    id: "BUREVI",
    name: "Cyclone Burevi",
    year: 2020,
    lat: 9.0,
    lon: 80.0,
    peakWindKt: 45.0,
    pressureMb: 996.0,
    category: "Cyclonic Storm",
    basin: "Sri Lanka / Gulf of Mannar",
  },
];

interface EarthGlobeProps {
  onSelectCyclone?: (cyclone: CycloneHotspot) => void;
  selectedCycloneId?: string;
}

export function EarthGlobe({ onSelectCyclone, selectedCycloneId }: EarthGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeHotspot, setActiveHotspot] = useState<CycloneHotspot | null>(
    CYCLONE_HOTSPOTS[0]
  );
  const [isRotating, setIsRotating] = useState(true);

  // Convert Lat/Lon to 3D Cartesian coordinates on sphere
  const latLonToVector3 = useCallback((lat: number, lon: number, radius: number) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 5.2);

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Deep Space Starfield
    const starCount = 1000;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 60;
      starPositions[i + 1] = (Math.random() - 0.5) * 60;
      starPositions[i + 2] = -15 - Math.random() * 30;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x88bbff,
      size: 0.08,
      transparent: true,
      opacity: 0.6,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // Procedural Earth Texture Generator
    const createEarthTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d")!;

      // Deep Space Ocean Gradient
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      oceanGrad.addColorStop(0, "#030814");
      oceanGrad.addColorStop(0.5, "#061328");
      oceanGrad.addColorStop(1, "#020712");
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Graticule Lines (Latitude & Longitude)
      ctx.strokeStyle = "rgba(41, 151, 255, 0.08)";
      ctx.lineWidth = 1;
      for (let lat = 0; lat <= canvas.height; lat += canvas.height / 12) {
        ctx.beginPath();
        ctx.moveTo(0, lat);
        ctx.lineTo(canvas.width, lat);
        ctx.stroke();
      }
      for (let lon = 0; lon <= canvas.width; lon += canvas.width / 24) {
        ctx.beginPath();
        ctx.moveTo(lon, 0);
        ctx.lineTo(lon, canvas.height);
        ctx.stroke();
      }

      // Procedural Continents (India, Asia, Africa, Europe, Americas, Australia)
      ctx.fillStyle = "#112238";
      ctx.strokeStyle = "#2997FF";
      ctx.lineWidth = 2.5;

      const drawLand = (coords: [number, number][]) => {
        ctx.beginPath();
        coords.forEach(([x, y], idx) => {
          const px = (x / 360) * canvas.width;
          const py = ((90 - y) / 180) * canvas.height;
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      };

      // Indian Subcontinent
      drawLand([
        [68, 24], [72, 22], [73, 18], [76, 10], [77, 8], [80, 10],
        [80, 13], [85, 19], [88, 22], [90, 24], [92, 26], [88, 27],
        [80, 29], [74, 32], [70, 30], [68, 24]
      ]);

      // Asia / Eurasia Mainland
      drawLand([
        [50, 40], [70, 45], [90, 55], [120, 50], [130, 40], [120, 30],
        [105, 20], [98, 10], [95, 20], [80, 30], [60, 35], [50, 40]
      ]);

      // Arabian Peninsula & Middle East
      drawLand([
        [35, 30], [45, 30], [55, 25], [60, 22], [55, 15], [45, 12],
        [43, 15], [35, 28], [35, 30]
      ]);

      // Africa
      drawLand([
        [-15, 12], [-5, 35], [15, 38], [32, 31], [42, 12], [51, 10],
        [40, -5], [35, -25], [20, -35], [15, -30], [10, -10], [0, 5],
        [-15, 12]
      ]);

      // Australia
      drawLand([
        [115, -22], [130, -12], [145, -15], [152, -28], [148, -38],
        [138, -35], [120, -35], [114, -26], [115, -22]
      ]);

      // Night city lights across coasts
      ctx.fillStyle = "rgba(255, 200, 100, 0.7)";
      for (let i = 0; i < 400; i++) {
        const lx = (70 + Math.random() * 30) / 360 * canvas.width;
        const ly = ((90 - (10 + Math.random() * 20)) / 180) * canvas.height;
        ctx.beginPath();
        ctx.arc(lx, ly, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      return new THREE.CanvasTexture(canvas);
    };

    const earthTexture = createEarthTexture();

    // Earth Sphere
    const globeRadius = 1.95;
    const earthGeo = new THREE.SphereGeometry(globeRadius, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.75,
      metalness: 0.15,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    // Orient India & Bay of Bengal toward viewer
    earthMesh.rotation.y = -Math.PI / 1.7;
    earthMesh.rotation.x = 0.25;
    scene.add(earthMesh);

    // Glowing Atmospheric Aura (Custom Fresnel Shader)
    const atmosphereVertexShader = `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const atmosphereFragmentShader = `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
        gl_FragColor = vec4(0.16, 0.6, 1.0, 1.0) * intensity * 1.8;
      }
    `;

    const atmosphereGeo = new THREE.SphereGeometry(globeRadius * 1.06, 64, 64);
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    scene.add(atmosphereMesh);

    // Atmospheric Cloud Layer
    const createCloudTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "transparent";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      // Draw spiral cyclone cloud vortex
      for (let i = 0; i < 60; i++) {
        const cx = canvas.width * 0.72 + (Math.random() - 0.5) * 120;
        const cy = canvas.height * 0.42 + (Math.random() - 0.5) * 80;
        const r = 20 + Math.random() * 40;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      return new THREE.CanvasTexture(canvas);
    };

    const cloudGeo = new THREE.SphereGeometry(globeRadius * 1.015, 48, 48);
    const cloudMat = new THREE.MeshStandardMaterial({
      map: createCloudTexture(),
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    earthMesh.add(cloudMesh);

    // Cyclone Hotspot Pins on the 3D Globe
    const pinGroup = new THREE.Group();
    earthMesh.add(pinGroup);

    CYCLONE_HOTSPOTS.forEach((spot) => {
      const pos = latLonToVector3(spot.lat, spot.lon, globeRadius * 1.02);

      // Core Marker
      const pinGeo = new THREE.SphereGeometry(0.04, 16, 16);
      const pinMat = new THREE.MeshBasicMaterial({
        color: spot.peakWindKt >= 90 ? 0xff453a : spot.peakWindKt >= 64 ? 0xff9f0a : 0x2997ff,
      });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.copy(pos);
      pinMesh.userData = spot;
      pinGroup.add(pinMesh);

      // Pulsing radar ring
      const ringGeo = new THREE.RingGeometry(0.06, 0.08, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: spot.peakWindKt >= 90 ? 0xff453a : 0x2997ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos);
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
      pinGroup.add(ringMesh);
    });

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x2997ff, 1.4);
    rimLight.position.set(-5, -2, -3);
    scene.add(rimLight);

    // Mouse Interaction (Drag to Rotate)
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let dragVelocity = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      dragVelocity.x = deltaX * 0.005;
      dragVelocity.y = deltaY * 0.005;

      earthMesh.rotation.y += dragVelocity.x;
      earthMesh.rotation.x = Math.max(-0.6, Math.min(0.6, earthMesh.rotation.x + dragVelocity.y));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // Animation Loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (!isDragging && isRotating) {
        earthMesh.rotation.y += 0.0015;
        cloudMesh.rotation.y += 0.0008;
      } else if (!isDragging) {
        // Inertia damping
        earthMesh.rotation.y += dragVelocity.x;
        dragVelocity.x *= 0.95;
        dragVelocity.y *= 0.95;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      domElement.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("resize", handleResize);
      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
      renderer.dispose();
    };
  }, [isRotating, latLonToVector3]);

  return (
    <div className="relative w-full h-130 sm:h-145 overflow-hidden rounded-3xl apple-glass">
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Floating HUD Badges */}
      <div className="absolute top-5 left-5 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
        <Badge
          variant="outline"
          className="apple-badge px-3 py-1 bg-black/60 border-white/10 text-xs text-white/90 gap-1.5"
        >
          <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
          Live 3D Satellite Earth
        </Badge>
        <Badge
          variant="outline"
          className="apple-badge px-3 py-1 bg-black/40 border-white/10 text-xs text-muted-foreground font-mono"
        >
          INSAT-3D Indian Ocean Basin
        </Badge>
      </div>

      {/* Interactive Hotspot Selection Toolbar */}
      <div className="absolute bottom-5 inset-x-5 z-20 flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/10">
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest pl-2 shrink-0">
            Hotspots:
          </span>
          {CYCLONE_HOTSPOTS.map((spot) => {
            const isSelected = activeHotspot?.id === spot.id;
            return (
              <button
                key={spot.id}
                onClick={() => {
                  setActiveHotspot(spot);
                  onSelectCyclone?.(spot);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-white text-black font-semibold shadow-lg shadow-white/20"
                    : "bg-white/5 hover:bg-white/10 text-white/80 border border-white/5"
                }`}
              >
                <Wind className={`size-3 ${isSelected ? "text-sky-600" : "text-sky-400"}`} />
                {spot.name}
                <span className="text-[10px] opacity-70 font-mono">({spot.peakWindKt} kt)</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsRotating(!isRotating)}
            className="h-8 text-xs text-muted-foreground hover:text-white gap-1.5"
          >
            <RotateCw className={`size-3.5 ${isRotating ? "animate-spin text-sky-400" : ""}`} />
            <span className="hidden sm:inline">{isRotating ? "Auto-Orbit" : "Paused"}</span>
          </Button>
        </div>
      </div>

      {/* Active Hotspot Preview Panel */}
      {activeHotspot && (
        <div className="absolute top-5 right-5 z-20 max-w-xs p-4 rounded-2xl bg-black/75 backdrop-blur-2xl border border-white/10 text-xs space-y-2 hidden md:block">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold">
              {activeHotspot.basin}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">{activeHotspot.year}</span>
          </div>
          <h4 className="text-sm font-bold text-white tracking-tight">{activeHotspot.name}</h4>
          <p className="text-muted-foreground text-[11px] leading-relaxed">
            {activeHotspot.category} with minimum central pressure of {activeHotspot.pressureMb} mb.
          </p>
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-muted-foreground">
            <span>Coordinates:</span>
            <span className="font-mono text-white">
              {activeHotspot.lat}°N, {activeHotspot.lon}°E
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
