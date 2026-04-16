import CopyLinkButton from "./CopyLinkButton.jsx";
import { deleteFile } from "../api.js";

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export default function FileTable({ files, onRefresh }) {
  async function handleDelete(key) {
    if (!window.confirm(`Delete "${key}"?`)) return;
    try {
      await deleteFile(key);
      onRefresh();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  if (!files.length) {
    return <div className="empty-state">No files yet. Upload the first one.</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>File name</th>
            <th>Size</th>
            <th>Uploaded</th>
            <th>Uploaded by</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.map((f) => (
            <tr key={f.key}>
              <td>
                <a href={f.url} target="_blank" rel="noreferrer" className="link">
                  {f.key}
                </a>
              </td>
              <td>{formatBytes(f.size)}</td>
              <td>{formatDate(f.last_modified)}</td>
              <td>{f.uploaded_by || "—"}</td>
              <td>
                <div className="actions-cell">
                  <CopyLinkButton url={f.url} />
                  <button className="btn btn-danger" onClick={() => handleDelete(f.key)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
