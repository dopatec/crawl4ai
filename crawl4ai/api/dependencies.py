from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import create_client, Client
import os
from functools import lru_cache

security = HTTPBearer()

@lru_cache()
def get_supabase_client() -> Client:
    """Get or create Supabase client"""
    return create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_KEY")
    )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Validate JWT token and return user"""
    try:
        supabase = get_supabase_client()
        
        # Verify JWT token
        user = supabase.auth.get_user(credentials.credentials)
        
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication credentials"
            )
            
        return user.data
        
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=str(e)
        )
