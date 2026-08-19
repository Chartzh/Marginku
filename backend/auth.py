from fastapi import Header, HTTPException, status
from jose import jwt, JWTError
import httpx
import os

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

async def get_current_user_id(authorization: str | None = Header(None)) -> str:
    """
    Dependency FastAPI: ekstrak user_id dari Bearer token Supabase.
    Lempar 401 kalau token tidak valid atau tidak ada.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Format token tidak valid. Gunakan: Bearer <token>"
        )
    token = authorization.removeprefix("Bearer ").strip()
    try:
        # Verifikasi token ke Supabase Auth API
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": SUPABASE_SERVICE_KEY,
                },
                timeout=5.0,
            )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token tidak valid atau sudah kedaluwarsa"
            )
        user_data = resp.json()
        user_id = user_data.get("id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Tidak bisa mendapatkan user_id dari token"
            )
        return user_id
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Gagal verifikasi token: {str(e)}"
        )
