import { useState, useRef } from "react";
import { uploadFile } from "../api.js";

const MAX_MB = 100;
const MAX_BYTES = MAX_MB * 1024 * 1024;

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function UploadZone({ onUploaded }) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  function selectFile(file) {
    setError("");
    if (file.size > MAX_BYTES) {
      setError(`File is too large. Maximum size is ${MAX_MB} MB.`);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setProgress(null);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) selectFile(file);
  }

  function onInputChange(e) {
    const file = e.target.files[0];
    if (file) selectFile(file);
    e.target.value = "";
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    setError("");
    setProgress(0);
    try {
      await uploadFile(selectedFile, setProgress);
      setSelectedFile(null);
      setProgress(null);
      onUploaded();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div
        className={`upload-zone${dragOver ? " drag-over" : ""}`}
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <p>Drag & drop a file here or click to browse</p>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={(e) => { e.stopPropagation(); inputRef.current.click(); }}
        >
          Choose file
        </button>
        <input
          ref={inputRef}
          type="file"
          style={{ display: "none" }}
          onChange={onInputChange}
        />
      </div>

      {selectedFile && (
        <div className="file-info">
          Selected: <strong>{selectedFile.name}</strong> ({formatBytes(selectedFile.size)})
        </div>
      )}

      {progress !== null && (
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      )}

      {error && <p className="error-msg" style={{ textAlign: "left", marginTop: 8 }}>{error}</p>}

      {selectedFile && (
        <button
          className="btn btn-primary mt-16"
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading ? `Uploading… ${progress ?? 0}%` : "Upload"}
        </button>
      )}
    </div>
  );
}
