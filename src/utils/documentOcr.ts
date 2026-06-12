import { createWorker } from "tesseract.js";

const ROTATIONS = [0, 90, 180, 270] as const;
const MAX_DIMENSION = 1800;

type OcrWord = {
  text?: string;
  confidence?: number;
};

type OcrWorker = Awaited<ReturnType<typeof createWorker>>;

export type OcrRotationResult = {
  angle: number;
  score: number;
  confidence: number;
  text: string;
  imageUrl: string;
};

export type OcrAnalysisResult = {
  bestRotation: OcrRotationResult;
  rotations: OcrRotationResult[];
};

let workerPromise: Promise<OcrWorker> | null = null;

function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker("eng");
  }

  return workerPromise;
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to read the selected image."));
    };

    image.src = objectUrl;
  });
}

function renderRotatedCanvas(image: HTMLImageElement, angle: number): HTMLCanvasElement {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const isQuarterTurn = angle === 90 || angle === 270;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is not available in this browser.");
  }

  canvas.width = isQuarterTurn ? height : width;
  canvas.height = isQuarterTurn ? width : height;

  context.save();

  if (angle === 90) {
    context.translate(canvas.width, 0);
    context.rotate(Math.PI / 2);
  } else if (angle === 180) {
    context.translate(canvas.width, canvas.height);
    context.rotate(Math.PI);
  } else if (angle === 270) {
    context.translate(0, canvas.height);
    context.rotate(-Math.PI / 2);
  }

  context.drawImage(image, 0, 0, width, height);
  context.restore();

  return canvas;
}

function renderRotatedImage(image: HTMLImageElement, angle: number) {
  const canvas = renderRotatedCanvas(image, angle);
  return canvas.toDataURL("image/jpeg", 0.92);
}

function scoreRotation(data: { text?: string; words?: OcrWord[]; confidence?: number }) {
  const text = (data.text ?? "").trim();
  const words = data.words ?? [];

  const wordScore = words.reduce((sum, word) => {
    const cleaned = String(word.text ?? "").trim();
    const confidence = Number(word.confidence ?? 0);

    if (cleaned.length >= 2 && confidence > 30) {
      return sum + confidence;
    }

    return sum;
  }, 0);

  const textScore = Math.min(text.replace(/\s+/g, " ").trim().length, 800) * 0.25;

  return wordScore + textScore;
}

async function recognizeImageUrl(imageUrl: string) {
  const worker = await getWorker();
  const result = await worker.recognize(imageUrl);
  const data = result.data as { text?: string; words?: OcrWord[]; confidence?: number };
  return {
    text: (data.text ?? "").trim(),
    confidence: Number(data.confidence ?? 0),
    words: data.words ?? [],
  };
}

function preprocessGrayscale(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext("2d");
  if (!ctx) return 1;
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  let totalBrightness = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
    totalBrightness += gray / 255;
  }
  ctx.putImageData(imgData, 0, 0);
  return totalBrightness / (data.length / 4);
}

function invertCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }
  ctx.putImageData(imgData, 0, 0);
}

function upscaleCanvasIfNeeded(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const area = canvas.width * canvas.height;
  let scale = 1;
  if (canvas.height < 30) {
    scale = 4;
  } else if (area < 40000) {
    scale = 2;
  }
  
  if (scale === 1) return canvas;

  const scaledCanvas = document.createElement("canvas");
  scaledCanvas.width = canvas.width * scale;
  scaledCanvas.height = canvas.height * scale;
  const sCtx = scaledCanvas.getContext("2d");
  if (sCtx) {
    sCtx.imageSmoothingEnabled = false;
    sCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
  }
  return scaledCanvas;
}

async function runQuickSnipPipeline(bestRotationCanvas: HTMLCanvasElement): Promise<OcrRotationResult> {
  const canvas = document.createElement("canvas");
  canvas.width = bestRotationCanvas.width;
  canvas.height = bestRotationCanvas.height;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.drawImage(bestRotationCanvas, 0, 0);
  }

  const mean = preprocessGrayscale(canvas);

  if (mean < 0.5) {
    invertCanvas(canvas);
  }

  const finalCanvas = upscaleCanvasIfNeeded(canvas);

  const imageUrl = finalCanvas.toDataURL("image/jpeg", 0.92);
  let ocrResult = await recognizeImageUrl(imageUrl);

  const textCharCount = ocrResult.text.replace(/\s+/g, "").length;
  if (textCharCount < 3) {
    invertCanvas(finalCanvas);
    const negatedImageUrl = finalCanvas.toDataURL("image/jpeg", 0.92);
    const negatedOcrResult = await recognizeImageUrl(negatedImageUrl);
    const negatedCharCount = negatedOcrResult.text.replace(/\s+/g, "").length;

    if (negatedCharCount > textCharCount) {
      ocrResult = negatedOcrResult;
    }
  }

  return {
    angle: 0,
    score: scoreRotation(ocrResult),
    confidence: ocrResult.confidence,
    text: ocrResult.text,
    imageUrl: finalCanvas.toDataURL("image/jpeg", 0.92),
  };
}

async function analyzeAngle(image: HTMLImageElement, angle: number) {
  const worker = await getWorker();
  const imageUrl = renderRotatedImage(image, angle);
  const result = await worker.recognize(imageUrl);
  const data = result.data as { text?: string; words?: OcrWord[]; confidence?: number };
  const text = (data.text ?? "").trim();
  const confidence = Number(data.confidence ?? 0);

  return {
    angle,
    score: scoreRotation(data),
    confidence,
    text,
    imageUrl,
  } satisfies OcrRotationResult;
}

export async function analyzeDocumentOcr(file: File): Promise<OcrAnalysisResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("OCR is currently supported for image files only. Use JPG, PNG, or WebP scans.");
  }

  const image = await loadImage(file);
  const rotations: OcrRotationResult[] = [];

  for (const angle of ROTATIONS) {
    rotations.push(await analyzeAngle(image, angle));
  }

  rotations.sort((left, right) => right.score - left.score);
  const originalBest = rotations[0];

  const bestCanvas = renderRotatedCanvas(image, originalBest.angle);
  const quickSnipResult = await runQuickSnipPipeline(bestCanvas);
  quickSnipResult.angle = originalBest.angle;

  let finalBest: OcrRotationResult;
  if (quickSnipResult.score > originalBest.score) {
    console.log("QuickSnip pipeline yielded better OCR results!", {
      quickSnipScore: quickSnipResult.score,
      originalScore: originalBest.score,
    });
    finalBest = quickSnipResult;
  } else {
    console.log("Original pipeline yielded better OCR results.", {
      quickSnipScore: quickSnipResult.score,
      originalScore: originalBest.score,
    });
    finalBest = originalBest;
  }

  return {
    bestRotation: finalBest,
    rotations,
  };
}
