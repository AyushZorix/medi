/** CPU 2D velocity field for WebGL displacement (Bunq-style fluid advection). */
export class ImageWindField {
  private readonly size: number;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly velX: Float32Array;
  private readonly velY: Float32Array;
  private readonly prevX: Float32Array;
  private readonly prevY: Float32Array;

  constructor(resolution = 64) {
    this.size = resolution;
    const n = resolution * resolution;
    this.velX = new Float32Array(n);
    this.velY = new Float32Array(n);
    this.prevX = new Float32Array(n);
    this.prevY = new Float32Array(n);
    this.canvas = document.createElement("canvas");
    this.canvas.width = resolution;
    this.canvas.height = resolution;
    const ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("2d context unavailable");
    this.ctx = ctx;
  }

  addForce(nx: number, ny: number, fx: number, fy: number, radius = 0.08) {
    const s = this.size;
    const cx = Math.floor(nx * s);
    const cy = Math.floor(ny * s);
    const r = Math.max(2, Math.floor(radius * s));
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        const px = cx + x;
        const py = cy + y;
        if (px < 0 || py < 0 || px >= s || py >= s) continue;
        const d = Math.hypot(x, y) / r;
        if (d > 1) continue;
        const falloff = 1 - d;
        const i = py * s + px;
        this.velX[i] += fx * falloff;
        this.velY[i] += fy * falloff;
      }
    }
  }

  update(damping = 0.92, diffusion = 0.15) {
    const s = this.size;
    const n = s * s;
    for (let i = 0; i < n; i++) {
      this.prevX[i] = this.velX[i];
      this.prevY[i] = this.velY[i];
    }
    for (let y = 1; y < s - 1; y++) {
      for (let x = 1; x < s - 1; x++) {
        const i = y * s + x;
        const avgX =
          (this.prevX[i - 1] + this.prevX[i + 1] + this.prevX[i - s] + this.prevX[i + s]) * 0.25;
        const avgY =
          (this.prevY[i - 1] + this.prevY[i + 1] + this.prevY[i - s] + this.prevY[i + s]) * 0.25;
        this.velX[i] = (this.prevX[i] + diffusion * (avgX - this.prevX[i])) * damping;
        this.velY[i] = (this.prevY[i] + diffusion * (avgY - this.prevY[i])) * damping;
      }
    }
    const img = this.ctx.createImageData(s, s);
    for (let i = 0; i < n; i++) {
      const r = Math.floor((this.velX[i] * 0.5 + 0.5) * 255);
      const g = Math.floor((this.velY[i] * 0.5 + 0.5) * 255);
      const p = i * 4;
      img.data[p] = r;
      img.data[p + 1] = g;
      img.data[p + 2] = 0;
      img.data[p + 3] = 255;
    }
    this.ctx.putImageData(img, 0, 0);
  }

  getCanvas() {
    return this.canvas;
  }

  reset() {
    this.velX.fill(0);
    this.velY.fill(0);
    this.prevX.fill(0);
    this.prevY.fill(0);
  }
}
