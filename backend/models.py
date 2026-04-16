from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UserOut(BaseModel):
    id: int
    username: str
    role: str
    created_at: datetime


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class CreateUserRequest(BaseModel):
    username: str
    password: str
    role: str = "user"


class ChangePasswordRequest(BaseModel):
    new_password: str


class FileItem(BaseModel):
    key: str
    url: str
    size: int
    last_modified: Optional[datetime] = None
    uploaded_by: Optional[str] = None


class UploadResponse(BaseModel):
    key: str
    url: str
    size: int
    content_type: str
