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

function renderRotatedImage(image: HTMLImageElement, angle: number) {
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

  return {
    bestRotation: rotations[0],
    rotations,
  };
}