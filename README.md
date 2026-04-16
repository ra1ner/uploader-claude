# File Uploader

Web application for uploading files to Yandex Object Storage (S3-compatible).  
Stack: FastAPI · React 18 · PostgreSQL 16 · Docker Compose · Nginx.

---

## Requirements

- [Docker](https://docs.docker.com/get-docker/) 24+
- [Docker Compose](https://docs.docker.com/compose/) v2
- A domain name with an A-record pointing to your server IP (for HTTPS)

---

## Quick start (local)

```bash
# 1. Clone the repo
git clone <repo-url>
cd <repo-dir>

# 2. Configure environment
cp .env.example .env
# Edit .env — fill in S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET, JWT_SECRET

# 3. Build and start
docker compose up --build

# 4. Create the first admin user
docker compose exec api python create_admin.py

# 5. Open http://localhost in your browser
```

---

## Deploy to Yandex Cloud VM

### 1. Create VM

In the [Yandex Cloud console](https://console.yandex.cloud):
- Image: **Ubuntu 22.04 LTS**
- Resources: 2 vCPU / 2 GB RAM (minimum)
- Network: assign a public IP

### 2. Open firewall ports

In the VM's security group, allow inbound TCP on ports **22**, **80**, **443**.

### 3. Install Docker

```bash
ssh ubuntu@<your-server-ip>
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Re-login to apply group
```

### 4. Deploy the application

```bash
git clone <repo-url>
cd <repo-dir>
cp .env.example .env
nano .env   # fill all variables, set ALLOWED_ORIGIN=https://yourdomain.com

docker compose up -d --build
```

### 5. Obtain TLS certificate with Certbot

```bash
sudo apt update && sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Certbot will modify the nginx config automatically and set up auto-renewal.

### 6. Create admin

```bash
docker compose exec api python create_admin.py
```

---

## Yandex Object Storage setup

1. Open [Yandex Cloud Console → Object Storage](https://console.yandex.cloud/storage).
2. **Create bucket** — choose a unique name, set access to **Public**.
3. Go to **IAM → Service accounts** → create account with role `storage.editor`.
4. In the service account, create **static access keys** — you get `access_key` and `secret_key`.
5. Put the values into `.env`:
   ```
   S3_ACCESS_KEY=<access_key>
   S3_SECRET_KEY=<secret_key>
   S3_BUCKET=<bucket_name>
   ```

---

## User management

Navigate to `http(s)://yourdomain.com/admin` (admin account required).

From the admin panel you can:
- **Add users** — set username, password, and role (`user` / `admin`)
- **Change password** — click "Change password" next to a user
- **Delete users** — click "Delete" (you cannot delete your own account)

---

## Environment variables reference

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `POSTGRES_USER` | DB username (used by the postgres container) |
| `POSTGRES_PASSWORD` | DB password |
| `POSTGRES_DB` | DB name |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `S3_ENDPOINT` | S3 endpoint URL (default: `https://storage.yandexcloud.net`) |
| `S3_ACCESS_KEY` | S3 access key |
| `S3_SECRET_KEY` | S3 secret key |
| `S3_BUCKET` | S3 bucket name |
| `MAX_FILE_SIZE_MB` | Maximum upload size in MB (default: `100`) |
| `ALLOWED_ORIGIN` | CORS allowed origin (e.g. `https://yourdomain.com`) |
