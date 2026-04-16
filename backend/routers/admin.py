from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from auth import require_admin, hash_password
from database import get_connection
from models import UserOut, CreateUserRequest, ChangePasswordRequest

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=List[UserOut])
def list_users(current_user: dict = Depends(require_admin)):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, username, role, created_at FROM users ORDER BY id")
            rows = cur.fetchall()
    return [UserOut(**dict(r)) for r in rows]


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(body: CreateUserRequest, current_user: dict = Depends(require_admin)):
    if body.role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'admin'")
    hashed = hash_password(body.password)
    with get_connection() as conn:
        with conn.cursor() as cur:
            try:
                cur.execute(
                    "INSERT INTO users (username, hashed_password, role) VALUES (%s, %s, %s) RETURNING id, username, role, created_at",
                    (body.username, hashed, body.role),
                )
                row = cur.fetchone()
            except Exception:
                conn.rollback()
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Username already exists",
                )
        conn.commit()
    return UserOut(**dict(row))


@router.delete("/users/{user_id}")
def delete_user(user_id: int, current_user: dict = Depends(require_admin)):
    if str(user_id) == current_user.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM users WHERE id = %s RETURNING id", (user_id,))
            row = cur.fetchone()
        conn.commit()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return {"deleted": True}


@router.patch("/users/{user_id}/password")
def change_password(
    user_id: int,
    body: ChangePasswordRequest,
    current_user: dict = Depends(require_admin),
):
    hashed = hash_password(body.new_password)
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE users SET hashed_password = %s WHERE id = %s RETURNING id",
                (hashed, user_id),
            )
            row = cur.fetchone()
        conn.commit()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return {"updated": True}
