from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import httpx
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import logging
from logging.handlers import RotatingFileHandler
import time
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        RotatingFileHandler('app.log', maxBytes=1024*1024*5, backupCount=5),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("crawl4ai")

load_dotenv()

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://xfpgxyuuoodtrswefbcn.supabase.co")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcGd4eXV1b29kdHJzd2VmYmNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODQ0MzI2NSwiZXhwIjoyMDU0MDE5MjY1fQ.TmVQicRstA3InXs-m-dAbr-mEzefe-U6qZJtDHmBBAk")

class SupabaseLogger(httpx.EventHandler):
    def handle_request(self, request):
        logger.debug(f"Supabase Request: {request.method} {request.url}")
        
    def handle_response(self, response):
        logger.debug(f"Supabase Response: {response.status_code}")
        logger.debug(f"Response Body: {response.text}")

# Initialize Supabase client with logging
supabase: Client = create_client(
    SUPABASE_URL, 
    SUPABASE_SERVICE_KEY,
    options={
        'http_client': httpx.Client(event_hooks={'request': [SupabaseLogger()]})
    }
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = str(int(time.time() * 1000))
    logger.debug(f"[{request_id}] Request: {request.method} {request.url}")
    logger.debug(f"[{request_id}] Headers: {dict(request.headers)}")
    logger.debug(f"[{request_id}] Client: {request.client.host}")
    
    start_time = time.time()
    try:
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        
        logger.debug(f"[{request_id}] Response: {response.status_code}")
        logger.debug(f"[{request_id}] Process time: {process_time:.2f}ms")
        return response
    except Exception as e:
        logger.error(f"[{request_id}] Request failed: {str(e)}", exc_info=True)
        raise

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
    request_id = str(int(time.time() * 1000))
    logger.info(f"[{request_id}] Crawl initiated for {request.url}")
    logger.debug(f"[{request_id}] Request details: {request.dict()}")
    
    try:
        # Mock crawling logic
        logger.debug(f"[{request_id}] Starting page fetch...")
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
        logger.info(f"[{request_id}] Successfully crawled {request.url}")
        return result
    except Exception as e:
        logger.error(f"[{request_id}] Crawl failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    request_id = str(int(time.time() * 1000))
    logger.info(f"[{request_id}] Fetching dashboard stats")
    try:
        stats = {
            "total_crawls": 10,
            "active_crawls": 2,
            "scheduled_crawls": 3,
            "success_rate": 85,
            "performance_metrics": [
                {
                    "timestamp": datetime.now().isoformat(),
                    "crawl_speed": 120,
                    "memory_usage": 45,
                    "cpu_usage": 30
                }
            ]
        }
        logger.debug(f"[{request_id}] Dashboard stats: {stats}")
        return stats
    except Exception as e:
        logger.error(f"[{request_id}] Failed to fetch dashboard stats: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/settings")
async def get_settings():
    request_id = str(int(time.time() * 1000))
    logger.info(f"[{request_id}] Fetching settings")
    try:
        settings = {
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
        logger.debug(f"[{request_id}] Settings: {settings}")
        return settings
    except Exception as e:
        logger.error(f"[{request_id}] Failed to fetch settings: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/settings")
async def update_settings(settings: Settings):
    request_id = str(int(time.time() * 1000))
    logger.info(f"[{request_id}] Updating settings")
    logger.debug(f"[{request_id}] New settings: {settings.dict()}")
    try:
        return settings.dict()
    except Exception as e:
        logger.error(f"[{request_id}] Failed to update settings: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/agent/sessions")
async def get_agent_sessions():
    request_id = str(int(time.time() * 1000))
    logger.info(f"[{request_id}] Fetching agent sessions")
    try:
        return []  
    except Exception as e:
        logger.error(f"[{request_id}] Failed to fetch agent sessions: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scheduled-crawls")
async def get_scheduled_crawls():
    request_id = str(int(time.time() * 1000))
    logger.info(f"[{request_id}] Fetching scheduled crawls")
    try:
        return []  
    except Exception as e:
        logger.error(f"[{request_id}] Failed to fetch scheduled crawls: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scheduled-crawls")
async def create_scheduled_crawl(
    crawl: CrawlRequest,
    schedule: str,
    user = Depends(verify_auth_token)
):
    request_id = str(int(time.time() * 1000))
    logger.info(f"[{request_id}] Creating scheduled crawl")
    logger.debug(f"[{request_id}] Crawl details: {crawl.dict()}")
    logger.debug(f"[{request_id}] Schedule: {schedule}")
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
        logger.info(f"[{request_id}] Scheduled crawl created successfully")
        return result.data
    except Exception as e:
        logger.error(f"[{request_id}] Failed to create scheduled crawl: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Crawl4AI server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
