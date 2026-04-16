from fastapi import APIRouter, HTTPException, status
from models import LoginRequest, TokenResponse
from auth import authenticate_user, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    user = authenticate_user(body.username, body.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    token = create_access_token(
        {"sub": str(user["id"]), "username": user["username"], "role": user["role"]}
    )
    return TokenResponse(access_token=token)
