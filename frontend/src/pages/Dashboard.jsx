import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listFiles } from "../api.js";
import UploadZone from "../components/UploadZone.jsx";
import FileTable from "../components/FileTable.jsx";

function getUser() {
  try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
}

function Header({ user, onLogout }) {
  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/dashboard" className="header-logo">File Uploader</Link>
        <div className="header-actions">
          {user?.role === "admin" && (
            <Link to="/admin" className="link">Manage users</Link>
          )}
          <span className="header-user">{user?.username}</span>
          <button className="btn btn-ghost" onClick={onLogout}>Sign out</button>
        </div>
      </div>
    </header>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const user = getUser();

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const data = await listFiles();
      setFiles(data);
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  }

  return (
    <>
      <Header user={user} onLogout={handleLogout} />
      <div className="container page">
        <div className="card">
          <h2 className="page-title">Upload file</h2>
          <UploadZone onUploaded={loadFiles} />
        </div>
        <div className="card">
          <h2 className="page-title">Files</h2>
          {loading && <p style={{ color: "var(--color-muted)" }}>Loading…</p>}
          {fetchError && <p className="error-msg" style={{ textAlign: "left" }}>{fetchError}</p>}
          {!loading && !fetchError && <FileTable files={files} onRefresh={loadFiles} />}
        </div>
      </div>
    </>
  );
}
