import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers import auth as auth_router
from routers import files as files_router
from routers import admin as admin_router

ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "http://localhost")

app = FastAPI(title="File Uploader")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


app.include_router(auth_router.router, prefix="/api")
app.include_router(files_router.router, prefix="/api")
app.include_router(admin_router.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}
