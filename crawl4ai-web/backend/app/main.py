from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router
from app.monitoring.dashboard import router as dashboard_router
from app.middleware.rate_limit import rate_limit_middleware
from app.db.session import init_db
from app.services.performance_tracker import performance_tracker
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Crawl4AI Agent API",
    description="API for managing web crawling agents with DeepSeek LLM integration",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add rate limiting middleware
@app.middleware("http")
async def rate_limit(request: Request, call_next):
    return await rate_limit_middleware(request, call_next)

# Add performance tracking middleware
@app.middleware("http")
async def track_performance(request: Request, call_next):
    metric = await performance_tracker.track(
        f"http_{request.method}",
        {
            "path": request.url.path,
            "client_ip": request.client.host
        }
    )
    try:
        response = await call_next(request)
        return response
    finally:
        await performance_tracker.stop_tracking(f"http_{request.method}")

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("Starting up the application")
    await init_db()

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down the application")
    # Log final performance metrics
    stats = performance_tracker.get_all_statistics()
    logger.info(f"Final performance statistics: {stats}")

# Include routers
app.include_router(api_router, prefix="/api")
app.include_router(dashboard_router, prefix="/dashboard", tags=["monitoring"])

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0"
    }
