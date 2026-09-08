"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function HeroEarth() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0.4, 4.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    // Procedural Earth Texture
    const createEarthTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d")!;

      // Ocean Background
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      oceanGrad.addColorStop(0, "#030611");
      oceanGrad.addColorStop(0.5, "#071224");
      oceanGrad.addColorStop(1, "#02050e");
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle Lat/Lon Graticule
      ctx.strokeStyle = "rgba(41, 151, 255, 0.05)";
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

      // Continents
      ctx.fillStyle = "#0d1b2e";
      ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
      ctx.lineWidth = 2;

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

      // Eurasia
      drawLand([
        [50, 40], [70, 45], [90, 55], [120, 50], [130, 40], [120, 30],
        [105, 20], [98, 10], [95, 20], [80, 30], [60, 35], [50, 40]
      ]);

      // Middle East
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

      // City lights
      ctx.fillStyle = "rgba(255, 210, 120, 0.5)";
      for (let i = 0; i < 350; i++) {
        const lx = (70 + Math.random() * 25) / 360 * canvas.width;
        const ly = ((90 - (10 + Math.random() * 18)) / 180) * canvas.height;
        ctx.beginPath();
        ctx.arc(lx, ly, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      return new THREE.CanvasTexture(canvas);
    };

    const globeRadius = 1.6;
    const earthGeo = new THREE.SphereGeometry(globeRadius, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
      map: createEarthTexture(),
      roughness: 0.8,
      metalness: 0.1,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.rotation.y = -Math.PI / 1.7;
    earthMesh.rotation.x = 0.22;
    scene.add(earthMesh);

    // Glowing Atmosphere
    const atmosphereGeo = new THREE.SphereGeometry(globeRadius * 1.05, 48, 48);
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(0.16, 0.59, 1.0, 1.0) * intensity * 1.6;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    scene.add(atmosphereMesh);

    // Subtle Cloud Spiral Layer
    const createCloudTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "transparent";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
      for (let i = 0; i < 40; i++) {
        const cx = canvas.width * 0.72 + (Math.random() - 0.5) * 100;
        const cy = canvas.height * 0.42 + (Math.random() - 0.5) * 60;
        ctx.beginPath();
        ctx.arc(cx, cy, 18 + Math.random() * 30, 0, Math.PI * 2);
        ctx.fill();
      }
      return new THREE.CanvasTexture(canvas);
    };

    const cloudGeo = new THREE.SphereGeometry(globeRadius * 1.012, 32, 32);
    const cloudMat = new THREE.MeshStandardMaterial({
      map: createCloudTexture(),
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    earthMesh.add(cloudMesh);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
    sunLight.position.set(4, 2, 4);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x2997ff, 1.0);
    rimLight.position.set(-4, -1, -2);
    scene.add(rimLight);

    // Animation Loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      earthMesh.rotation.y += 0.0012;
      cloudMesh.rotation.y += 0.0006;
      renderer.render(scene, camera);
    };
    animate();

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
      window.removeEventListener("resize", handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none opacity-40 sm:opacity-50 overflow-hidden flex items-center justify-end"
    />
  );
}
