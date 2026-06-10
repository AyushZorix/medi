import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from "ogl";
import { useEffect, useRef, useState } from "react";

import { ImageWindField } from "./ImageWindField";

const VERT = /* glsl */ `
  attribute vec3 position;
  attribute vec2 uv;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  varying vec2 vTextureCoord;
  void main() {
    vTextureCoord = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  varying vec2 vTextureCoord;
  uniform sampler2D uTexture;
  uniform sampler2D uWindTex;
  uniform float uDistortStrength;
  void main() {
    vec2 wind = texture2D(uWindTex, vTextureCoord).rg * 2.0 - 1.0;
    vec2 uv = vTextureCoord + wind * uDistortStrength;
    vec4 color = texture2D(uTexture, uv);
    float mag = dot(wind, wind);
    color.rgb = mix(color.rgb, 1.0 - color.rgb, mag * 0.35);
    gl_FragColor = color;
  }
`;

type DistortedImageProps = {
  src: string;
  alt?: string;
  className?: string;
  distortStrength?: number;
};

export function DistortedImage({
  src,
  alt = "",
  className = "",
  distortStrength = 0.08,
}: DistortedImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const windRef = useRef<ImageWindField | null>(null);
  const rafRef = useRef(0);
  const pausedRef = useRef(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    
    let renderer: Renderer | null = null;
    let disposed = false;
    let cleanupScene: (() => void) | undefined;

    const onVis = () => {
      pausedRef.current = document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);

    img.onload = () => {
      if (disposed || !container) return;

      try {
        renderer = new Renderer({
          alpha: true,
          antialias: true,
          dpr: Math.min(window.devicePixelRatio, 2),
        });
        const gl = renderer.gl;
        container.appendChild(gl.canvas);
        gl.canvas.style.width = "100%";
        gl.canvas.style.height = "100%";
        gl.canvas.style.display = "block";
        gl.canvas.style.position = "absolute";
        gl.canvas.style.top = "0";
        gl.canvas.style.left = "0";

        const camera = new Camera(gl);
        camera.position.z = 1;

        const scene = new Transform();
        const geometry = new Plane(gl, { width: 2, height: 2 });

        const imageTex = new Texture(gl, { generateMipmaps: false });
        imageTex.image = img;

        const wind = new ImageWindField(72);
        windRef.current = wind;
        const windTex = new Texture(gl, { generateMipmaps: false });
        windTex.image = wind.getCanvas();

        const program = new Program(gl, {
          vertex: VERT,
          fragment: FRAG,
          uniforms: {
            uTexture: { value: imageTex },
            uWindTex: { value: windTex },
            uDistortStrength: { value: distortStrength },
          },
        });

        const mesh = new Mesh(gl, { geometry, program });
        mesh.setParent(scene);

        let lastX = 0;
        let lastY = 0;
        let hasLast = false;

        const onMove = (e: PointerEvent) => {
          const rect = container.getBoundingClientRect();
          const nx = (e.clientX - rect.left) / rect.width;
          const ny = 1 - (e.clientY - rect.top) / rect.height;
          if (hasLast) {
            const fx = (nx - lastX) * 12;
            const fy = (ny - lastY) * 12;
            wind.addForce(nx, ny, fx, fy, 0.12);
          }
          lastX = nx;
          lastY = ny;
          hasLast = true;
        };

        const onLeave = () => {
          hasLast = false;
        };

        container.addEventListener("pointermove", onMove);
        container.addEventListener("pointerleave", onLeave);

        const resize = () => {
          const w = container.clientWidth;
          const h = container.clientHeight;
          if (w < 1 || h < 1) return;
          renderer!.setSize(w, h);
          const aspect = w / h;
          const imgAspect = img.width / img.height;
          if (aspect > imgAspect) {
            mesh.scale.x = aspect / imgAspect;
            mesh.scale.y = 1;
          } else {
            mesh.scale.x = 1;
            mesh.scale.y = imgAspect / aspect;
          }
          camera.perspective({ aspect });
        };

        const ro = new ResizeObserver(resize);
        ro.observe(container);
        resize();

        const tick = () => {
          rafRef.current = requestAnimationFrame(tick);
          if (pausedRef.current || disposed) return;
          wind.update();
          windTex.image = wind.getCanvas();
          renderer!.render({ scene, camera });
        };
        tick();

        cleanupScene = () => {
          cancelAnimationFrame(rafRef.current);
          container.removeEventListener("pointermove", onMove);
          container.removeEventListener("pointerleave", onLeave);
          ro.disconnect();
          if (renderer?.gl.canvas.parentElement === container) {
            container.removeChild(renderer.gl.canvas);
          }
          renderer?.gl.getExtension("WEBGL_lose_context")?.loseContext();
          renderer = null;
        };
      } catch (err) {
        console.warn("DistortedImage WebGL init failed:", err);
        setHasError(true);
      }
    };

    img.onerror = () => {
      if (!container || disposed) return;
      setHasError(true);
    };

    // Set src after handlers are attached
    img.src = src;

    return () => {
      disposed = true;
      cleanupScene?.();
      document.removeEventListener("visibilitychange", onVis);
      windRef.current?.reset();
    };
  }, [src, distortStrength]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {hasError ? (
        <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <img src={src} alt={alt} crossOrigin="anonymous" className="sr-only" aria-hidden />
      )}
    </div>
  );
}
