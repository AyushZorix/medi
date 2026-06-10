import { useEffect, useRef } from "react";
import * as THREE from "three";

import { registerDisposable } from "@/lib/disposables";

type VideoAmbientSceneProps = {
  className?: string;
};

export function VideoAmbientScene({ className = "" }: VideoAmbientSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w < 1 || h < 1) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.set(0, 1.2, 5);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (err) {
      console.warn("Failed to create WebGL context for VideoAmbientScene:", err);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x030305, 1);
    container.appendChild(renderer.domElement);

    const attorneyUrls = [
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&h=800&q=80",
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&h=800&q=80",
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&h=800&q=80",
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&h=800&q=80",
    ];

    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");
    // Add cache buster to prevent CORS errors from browser caching non-CORS responses
    const textures = attorneyUrls.map((url) => textureLoader.load(url + "&cb=" + Date.now()));

    const panels: THREE.Mesh[] = [];
    const panelGeo = new THREE.PlaneGeometry(2.3, 2.9);

    for (let i = 0; i < 4; i++) {
      const mat = new THREE.MeshStandardMaterial({
        map: textures[i],
        roughness: 0.3,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(panelGeo, mat);
      const x = (i - 1.5) * 2.8;
      const y = 1.6 + Math.sin(i) * 0.2;
      const z = -1.5 - Math.cos(i) * 0.4;
      mesh.position.set(x, y, z);
      mesh.rotation.y = (i - 1.5) * 0.10;
      mesh.rotation.x = 0.05;
      scene.add(mesh);
      panels.push(mesh);
    }

    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x060608, roughness: 1 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Premium studio lighting rig (dual colored highlights for best aesthetics)
    const hemi = new THREE.HemisphereLight(0xffffff, 0x0c0e12, 1.2);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xc8e650, 0.8); // VisaIQ Lime Green Accent
    key.position.set(3, 5, 2);
    scene.add(key);

    const fillLight = new THREE.DirectionalLight(0x8a2be2, 0.5); // Purple/Violet Accent
    fillLight.position.set(-3, -2, 2);
    scene.add(fillLight);

    let frame = 0;
    let raf = 0;
    let paused = false;

    const onVis = () => {
      paused = document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);

    const resize = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      if (cw < 1 || ch < 1) return;
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
      renderer.setSize(cw, ch);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (paused) return;

      frame++;

      panels.forEach((p, i) => {
        p.position.y = (1.6 + Math.sin(i) * 0.2) + Math.sin(frame * 0.015 + i) * 0.08;
        p.rotation.y = ((i - 1.5) * 0.10) + Math.sin(frame * 0.01 + i) * 0.05;
      });

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    const dispose = registerDisposable(() => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      ro.disconnect();
      floorGeo.dispose();
      floorMat.dispose();
      panelGeo.dispose();
      textures.forEach((t) => t.dispose());
      panels.forEach((p) => {
        p.geometry.dispose();
        if (Array.isArray(p.material)) {
          p.material.forEach((m) => m.dispose());
        } else {
          p.material.dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    });

    return () => dispose();
  }, []);

  return <div ref={containerRef} className={`${className}`} aria-hidden />;
}
