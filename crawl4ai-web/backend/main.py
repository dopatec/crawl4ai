from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import httpx
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite's default development port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase configuration
SUPABASE_URL = "https://xfpgxyuuoodtrswefbcn.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcGd4eXV1b29kdHJzd2VmYmNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODQ0MzI2NSwiZXhwIjoyMDU0MDE5MjY1fQ.TmVQicRstA3InXs-m-dAbr-mEzefe-U6qZJtDHmBBAk"

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

class CrawlRequest(BaseModel):
    url: str
    extraction_mode: str = "default"
    max_depth: Optional[int] = 1
    timeout: Optional[int] = 30

async def verify_auth_token(authorization: str = Depends(lambda x: x.headers.get("Authorization"))):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.split(" ")[1]
    try:
        user = supabase.auth.get_user(token)
        return user
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.post("/api/crawl")
async def crawl_website(request: CrawlRequest, user = Depends(verify_auth_token)):
    try:
        # Here you would integrate with your Crawl4AI implementation
        # For now, we'll return mock data
        result = {
            "url": request.url,
            "content": f"Crawled content from {request.url}",
            "metadata": {
                "extraction_mode": request.extraction_mode,
                "max_depth": request.max_depth,
                "timeout": request.timeout,
                "crawler_version": "1.0.0"
            }
        }
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
