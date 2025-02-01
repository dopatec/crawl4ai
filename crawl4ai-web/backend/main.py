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

class Settings(BaseModel):
    deepseek: dict
    crawling: dict
    monitoring: dict

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

@app.get("/api/dashboard/stats")
async def get_dashboard_stats():  
    try:
        # Mock data for testing
        return {
            "total_crawls": 10,
            "active_crawls": 2,
            "scheduled_crawls": 3,
            "success_rate": 85,
            "performance_metrics": [
                {
                    "timestamp": "2025-02-01T22:00:00",
                    "crawl_speed": 120,
                    "memory_usage": 45,
                    "cpu_usage": 30
                },
                {
                    "timestamp": "2025-02-01T22:15:00",
                    "crawl_speed": 125,
                    "memory_usage": 48,
                    "cpu_usage": 35
                }
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/settings")
async def get_settings():  
    try:
        return {
            "deepseek": {
                "api_key": "",
                "model": "deepseek-chat",
                "temperature": 0.7,
                "max_tokens": 2000,
                "top_p": 0.95,
                "frequency_penalty": 0,
                "presence_penalty": 0,
            },
            "crawling": {
                "max_concurrent_crawls": 5,
                "request_delay": 1000,
                "respect_robots_txt": True,
                "max_retries": 3,
                "timeout": 30000,
            },
            "monitoring": {
                "enable_performance_tracking": True,
                "log_level": "info",
                "metrics_retention_days": 30,
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/settings")
async def update_settings(settings: Settings):  
    try:
        # In a real application, we would save these settings to a database
        # For now, we'll just return the settings back
        return settings.dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/agent/sessions")
async def get_agent_sessions():  
    try:
        return []  
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scheduled-crawls")
async def get_scheduled_crawls():  
    try:
        return []  
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scheduled-crawls")
async def create_scheduled_crawl(
    crawl: CrawlRequest,
    schedule: str,
    user = Depends(verify_auth_token)
):
    try:
        data = {
            "url": crawl.url,
            "extraction_mode": crawl.extraction_mode,
            "max_depth": crawl.max_depth,
            "timeout": crawl.timeout,
            "schedule": schedule,
            "user_id": user.id
        }
        result = supabase.table('scheduled_crawls').insert(data).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
