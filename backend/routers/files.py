import mimetypes
import os
import re
import unicodedata
from typing import List

import boto3
from botocore.config import Config
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status

from auth import get_current_user
from models import FileItem, UploadResponse

router = APIRouter(prefix="/files", tags=["files"])

S3_ENDPOINT = os.environ["S3_ENDPOINT"]
S3_ACCESS_KEY = os.environ["S3_ACCESS_KEY"]
S3_SECRET_KEY = os.environ["S3_SECRET_KEY"]
S3_BUCKET = os.environ["S3_BUCKET"]
MAX_FILE_SIZE_MB = int(os.environ.get("MAX_FILE_SIZE_MB", "100"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

# Cyrillic transliteration table
_CYRILLIC = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo",
    "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
    "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
    "ф": "f", "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sch",
    "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
    "А": "A", "Б": "B", "В": "V", "Г": "G", "Д": "D", "Е": "E", "Ё": "Yo",
    "Ж": "Zh", "З": "Z", "И": "I", "Й": "Y", "К": "K", "Л": "L", "М": "M",
    "Н": "N", "О": "O", "П": "P", "Р": "R", "С": "S", "Т": "T", "У": "U",
    "Ф": "F", "Х": "Kh", "Ц": "Ts", "Ч": "Ch", "Ш": "Sh", "Щ": "Sch",
    "Ъ": "", "Ы": "Y", "Ь": "", "Э": "E", "Ю": "Yu", "Я": "Ya",
}


def normalize_filename(name: str) -> str:
    result = []
    for ch in name:
        result.append(_CYRILLIC.get(ch, ch))
    name = "".join(result)
    name = name.replace(" ", "_")
    name = re.sub(r"[^a-zA-Z0-9._\-]", "", name)
    return name or "file"


def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=S3_ACCESS_KEY,
        aws_secret_access_key=S3_SECRET_KEY,
        config=Config(signature_version="s3v4"),
    )


def build_url(key: str) -> str:
    bucket = S3_BUCKET
    endpoint = S3_ENDPOINT.rstrip("/")
    # Yandex Cloud URL format
    return f"https://{bucket}.storage.yandexcloud.net/{key}"


@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_MB} MB",
        )

    original_name = file.filename or "upload"
    key = normalize_filename(original_name)
    content_type, _ = mimetypes.guess_type(key)
    if not content_type:
        content_type = "application/octet-stream"

    s3 = get_s3_client()
    s3.put_object(
        Bucket=S3_BUCKET,
        Key=key,
        Body=content,
        ContentType=content_type,
        ContentDisposition="inline",
        ACL="public-read",
        Metadata={"uploaded-by": current_user.get("username", "unknown")},
    )

    return UploadResponse(
        key=key,
        url=build_url(key),
        size=len(content),
        content_type=content_type,
    )


@router.get("", response_model=List[FileItem])
def list_files(current_user: dict = Depends(get_current_user)):
    s3 = get_s3_client()
    result = s3.list_objects_v2(Bucket=S3_BUCKET)
    items = []
    for obj in result.get("Contents", []):
        try:
            head = s3.head_object(Bucket=S3_BUCKET, Key=obj["Key"])
            uploaded_by = head.get("Metadata", {}).get("uploaded-by")
        except Exception:
            uploaded_by = None
        items.append(
            FileItem(
                key=obj["Key"],
                url=build_url(obj["Key"]),
                size=obj["Size"],
                last_modified=obj["LastModified"],
                uploaded_by=uploaded_by,
            )
        )
    # Sort newest first
    items.sort(key=lambda x: x.last_modified or "", reverse=True)
    return items


@router.delete("/{key:path}")
def delete_file(key: str, current_user: dict = Depends(get_current_user)):
    s3 = get_s3_client()
    s3.delete_object(Bucket=S3_BUCKET, Key=key)
    return {"deleted": True}
