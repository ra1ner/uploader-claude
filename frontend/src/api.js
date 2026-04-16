const BASE = "/api";

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

function handleUnauthorized(res) {
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  }
}

async function jsonResponse(res) {
  handleUnauthorized(res);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}

export async function login(username, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return jsonResponse(res);
}

export async function listFiles() {
  const res = await fetch(`${BASE}/files`, { headers: authHeaders() });
  return jsonResponse(res);
}

export async function deleteFile(key) {
  const res = await fetch(`${BASE}/files/${encodeURIComponent(key)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return jsonResponse(res);
}

export function uploadFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE}/files/upload`);
    xhr.setRequestHeader("Authorization", `Bearer ${getToken()}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        let msg = "Upload failed";
        try {
          msg = JSON.parse(xhr.responseText).detail || msg;
        } catch {}
        reject(new Error(msg));
      }
    };

    xhr.onerror = () => reject(new Error("Network error"));

    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

export async function listUsers() {
  const res = await fetch(`${BASE}/admin/users`, { headers: authHeaders() });
  return jsonResponse(res);
}

export async function createUser(username, password, role) {
  const res = await fetch(`${BASE}/admin/users`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, role }),
  });
  return jsonResponse(res);
}

export async function deleteUser(id) {
  const res = await fetch(`${BASE}/admin/users/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return jsonResponse(res);
}

export async function changePassword(id, new_password) {
  const res = await fetch(`${BASE}/admin/users/${id}/password`, {
    method: "PATCH",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ new_password }),
  });
  return jsonResponse(res);
}
