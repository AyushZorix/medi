import { useEffect, useRef } from "react";
import * as THREE from "three";

import { registerDisposable } from "@/lib/disposables";

const BLADE_VERT = /* glsl */ `
  precision mediump float;
  attribute vec3 instanceOffset;
  attribute float instancePhase;
  uniform float uTime;
  uniform vec2 uWindPoint;
  uniform float uWindStrength;
  varying float vHeight;
  void main() {
    vec3 pos = position;
    float h = pos.y;
    vHeight = h;
    vec2 wind = vec2(
      sin(uTime * 1.2 + instancePhase) * 0.15,
      cos(uTime * 0.9 + instancePhase * 1.3) * 0.12
    );
    vec2 toMouse = uWindPoint - instanceOffset.xz;
    float mouseInfluence = exp(-dot(toMouse, toMouse) * 8.0) * uWindStrength;
    wind += normalize(toMouse + 0.001) * mouseInfluence * h;
    float turbulence = sin(instanceOffset.x * 3.0 + uTime * 2.0) *
      sin(instanceOffset.z * 3.0 + uTime * 1.7) * 0.08 * h;
    pos.x += wind.x * h + turbulence;
    pos.z += wind.y * h;
    vec3 worldPos = pos + instanceOffset;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
  }
`;

const BLADE_FRAG = /* glsl */ `
  precision mediump float;
  varying float vHeight;
  void main() {
    vec3 base = vec3(0.08, 0.18, 0.06);
    vec3 tip = vec3(0.45, 0.62, 0.22);
    vec3 col = mix(base, tip, vHeight);
    col *= 0.85 + vHeight * 0.25;
    gl_FragColor = vec4(col, 1.0);
  }
`;

type GrassFieldSceneProps = {
  className?: string;
  bladeCount?: number;
};

export function GrassFieldScene({ className = "", bladeCount = 6000 }: GrassFieldSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width < 1 || height < 1) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050508, 0.035);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 80);
    camera.position.set(0, 3.2, 7);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const groundGeo = new THREE.PlaneGeometry(24, 24, 1, 1);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0a0f08,
      roughness: 1,
      metalness: 0,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);

    const baseGeo = new THREE.PlaneGeometry(0.08, 1.2, 1, 4);
    baseGeo.translate(0, 0.6, 0);

    const offsets = new Float32Array(bladeCount * 3);
    const phases = new Float32Array(bladeCount);
    const spread = 11;
    for (let i = 0; i < bladeCount; i++) {
      offsets[i * 3] = (Math.random() - 0.5) * spread * 2;
      offsets[i * 3 + 1] = 0;
      offsets[i * 3 + 2] = (Math.random() - 0.5) * spread * 2;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const bladeGeo = new THREE.InstancedBufferGeometry();
    bladeGeo.copy(baseGeo);
    bladeGeo.setAttribute("instanceOffset", new THREE.InstancedBufferAttribute(offsets, 3));
    bladeGeo.setAttribute("instancePhase", new THREE.InstancedBufferAttribute(phases, 1));

    const shaderMat = new THREE.ShaderMaterial({
      vertexShader: BLADE_VERT,
      fragmentShader: BLADE_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uWindPoint: { value: new THREE.Vector2(0, 0) },
        uWindStrength: { value: 0 },
      },
      side: THREE.DoubleSide,
    });

    const instanced = new THREE.Mesh(bladeGeo, shaderMat);
    instanced.frustumCulled = false;
    scene.add(instanced);

    const hemi = new THREE.HemisphereLight(0x8a9a6a, 0x050508, 0.6);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xc8e650, 0.35);
    dir.position.set(2, 6, 3);
    scene.add(dir);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const windWorld = new THREE.Vector3();
    let windXZ = new THREE.Vector2(0, 0);

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      raycaster.ray.intersectPlane(groundPlane, windWorld);
      if (windWorld) windXZ.set(windWorld.x, windWorld.z);
      shaderMat.uniforms.uWindStrength.value = 1.2;
    };

    const onLeave = () => {
      shaderMat.uniforms.uWindStrength.value = 0;
    };

    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onLeave);

    let raf = 0;
    let paused = false;
    const onVis = () => {
      paused = document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w < 1 || h < 1) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (paused) return;
      shaderMat.uniforms.uTime.value = t * 0.001;
      shaderMat.uniforms.uWindPoint.value.set(windXZ.x, windXZ.y);
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    const dispose = registerDisposable(() => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onLeave);
      ro.disconnect();
      baseGeo.dispose();
      bladeGeo.dispose();
      groundGeo.dispose();
      groundMat.dispose();
      shaderMat.dispose();
      instanced.geometry.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    });

    return () => dispose();
  }, [bladeCount]);

  return <div ref={containerRef} className={`touch-none ${className}`} aria-hidden />;
}
