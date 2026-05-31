import { useState, type ChangeEvent } from "react";
import { AlertTriangle, CheckCircle2, Copy, FileText, FileUp, RefreshCcw, RotateCw } from "lucide-react";
import { analyzeDocumentOcr, type OcrAnalysisResult } from "../utils/documentOcr";

function formatScore(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : "0.0";
}

export function DocumentsPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<OcrAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setAnalysis(null);
    setError("");
    setCopied(false);
  };

  const handleRunOcr = async () => {
    if (!selectedFile) {
      setError("Choose an image scan before running OCR.");
      return;
    }

    setLoading(true);
    setError("");
    setCopied(false);

    try {
      const result = await analyzeDocumentOcr(selectedFile);
      setAnalysis(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "OCR failed.";
      setError(message);
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setAnalysis(null);
    setError("");
    setCopied(false);
  };

  const handleCopyText = async () => {
    const text = analysis?.bestRotation.text;

    if (!text) {
      return;
    }

    await navigator.clipboard.writeText(text);
    setCopied(true);
    globalThis.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="page-stack">
      <section className="page-header">
        <h1>Documents</h1>
        <p>Upload a scanned image, auto-correct its orientation, and extract text for downstream case review.</p>
      </section>

      <section className="card-grid two">
        <article className="card ocr-workspace">
          <h2>OCR Workspace</h2>
          <p>
            This uses the same four-way rotation check as the original Colab script, but runs directly in the app.
          </p>

          <label className="upload-box ocr-upload" htmlFor="ocr-upload-input">
            <FileUp size={18} />
            <span>{selectedFile ? selectedFile.name : "Choose a JPG, PNG, or WebP scan"}</span>
          </label>

          <input
            id="ocr-upload-input"
            className="ocr-file-input"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
          />

          <div className="ocr-actions">
            <button className="btn action" type="button" onClick={handleRunOcr} disabled={!selectedFile || loading}>
              {loading ? <RotateCw size={16} className="spin" /> : <FileText size={16} />}
              {loading ? "Scanning..." : "Run OCR"}
            </button>
            <button className="btn ghost-dark" type="button" onClick={handleReset} disabled={!selectedFile && !analysis && !error}>
              <RefreshCcw size={16} />
              Reset
            </button>
          </div>

          <small>
            OCR is image-based here. If a document starts as PDF or DOCX, convert the page you need into an image first.
          </small>

          {error ? (
            <p className="ocr-error">
              <AlertTriangle size={16} />
              {error}
            </p>
          ) : null}
        </article>

        <article className="card ocr-results">
          <div className="ocr-results-header">
            <div>
              <h2>Extracted Output</h2>
              <p>Best orientation and extracted text from the latest OCR run.</p>
            </div>
            {analysis ? <span className="ocr-badge ok"><CheckCircle2 size={14} /> Ready</span> : <span className="ocr-badge muted">Waiting</span>}
          </div>

          {analysis === null ? (
            <div className="ocr-empty-state">
              <p>No OCR run yet.</p>
              <p>Upload a scanned image and run the rotation scan to populate this panel.</p>
            </div>
          ) : (
            <>
              <div className="ocr-summary-grid">
                <div>
                  <span>Best Rotation</span>
                  <strong>{analysis.bestRotation.angle}°</strong>
                </div>
                <div>
                  <span>Score</span>
                  <strong>{formatScore(analysis.bestRotation.score)}</strong>
                </div>
                <div>
                  <span>Confidence</span>
                  <strong>{formatScore(analysis.bestRotation.confidence)}</strong>
                </div>
              </div>

              <div className="ocr-preview-panel">
                <img
                  className="ocr-preview-image"
                  src={analysis.bestRotation.imageUrl}
                  alt={`Corrected scan at ${analysis.bestRotation.angle} degrees`}
                />
              </div>

              <div className="ocr-text-toolbar">
                <h3>Recognized Text</h3>
                <button className="btn ghost-dark" type="button" onClick={handleCopyText} disabled={!analysis.bestRotation.text}>
                  <Copy size={16} />
                  {copied ? "Copied" : "Copy text"}
                </button>
              </div>

              <pre className="ocr-text-block">{analysis.bestRotation.text || "No readable text was detected."}</pre>
            </>
          )}
        </article>
      </section>

      <article className="card">
        <h2>Rotation Scores</h2>
        <p className="card-note">The best score is chosen automatically using the same confidence-driven logic as the original notebook.</p>

        {analysis ? (
          <div className="rotation-grid">
            {analysis.rotations.map((rotation) => (
              <div key={rotation.angle} className={`rotation-card ${rotation.angle === analysis.bestRotation.angle ? "selected" : ""}`}>
                <span>{rotation.angle}°</span>
                <strong>{formatScore(rotation.score)}</strong>
                <small>{formatScore(rotation.confidence)} confidence</small>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted-copy">Run OCR to compare all four orientations and pick the strongest text result.</p>
        )}
      </article>
    </div>
  );
}
