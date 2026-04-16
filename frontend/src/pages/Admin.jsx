import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listUsers, createUser, deleteUser, changePassword } from "../api.js";

function getUser() {
  try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export default function Admin() {
  const navigate = useNavigate();
  const currentUser = getUser();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");

  function generatePassword() {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
    const arr = new Uint8Array(10);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => chars[b % chars.length]).join("");
  }
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setUsers(await listUsers());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    try {
      await createUser(newUsername, newPassword, newRole);
      setNewUsername("");
      setNewPassword("");
      setNewRole("user");
      loadUsers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id, username) {
    if (!window.confirm(`Delete user "${username}"?`)) return;
    try {
      await deleteUser(id);
      loadUsers();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  async function handleChangePassword(id) {
    const suggested = generatePassword();
    const pwd = window.prompt("New password (or edit):", suggested);
    if (!pwd) return;
    try {
      await changePassword(id, pwd);
      alert("Password changed.");
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <Link to="/dashboard" className="header-logo">File Uploader</Link>
          <div className="header-actions">
            <Link to="/dashboard" className="link">Dashboard</Link>
            <span className="header-user">{currentUser?.username}</span>
            <button className="btn btn-ghost" onClick={handleLogout}>Sign out</button>
          </div>
        </div>
      </header>

      <div className="container page">
        <div className="card">
          <h2 className="page-title">Add user</h2>
          <form onSubmit={handleCreate}>
            <div className="inline-form">
              <div className="form-group">
                <label>Username</label>
                <input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setNewPassword(generatePassword())}
                    title="Generate password"
                  >
                    Generate
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" disabled={formLoading}>
                {formLoading ? "Adding…" : "Add user"}
              </button>
            </div>
            {formError && <p className="error-msg" style={{ textAlign: "left", marginTop: 8 }}>{formError}</p>}
          </form>
        </div>

        <div className="card">
          <h2 className="page-title">Users</h2>
          {loading && <p style={{ color: "var(--color-muted)" }}>Loading…</p>}
          {error && <p className="error-msg" style={{ textAlign: "left" }}>{error}</p>}
          {!loading && !error && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.username}</td>
                      <td>{u.role}</td>
                      <td>{formatDate(u.created_at)}</td>
                      <td>
                        <div className="actions-cell">
                          <button
                            className="btn btn-ghost"
                            onClick={() => handleChangePassword(u.id)}
                          >
                            Change password
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDelete(u.id, u.username)}
                            disabled={String(u.id) === currentUser?.sub}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
