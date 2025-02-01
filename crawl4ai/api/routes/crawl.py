from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import Dict, List, Optional
from datetime import datetime
import logging
from uuid import uuid4
from pydantic import BaseModel, HttpUrl

from ..advanced_crawler import AdvancedCrawler
from ..scheduler import CrawlScheduler
from ..dependencies import get_current_user

router = APIRouter()
crawler = AdvancedCrawler()
scheduler = CrawlScheduler()

# Pydantic models for request validation
class CrawlRequest(BaseModel):
    url: HttpUrl
    mode: str
    options: Optional[Dict] = None

class ScheduleRequest(BaseModel):
    url: HttpUrl
    mode: str
    schedule: str  # cron expression
    options: Optional[Dict] = None
    enabled: bool = True

@router.on_event("startup")
async def startup_event():
    await scheduler.start()

@router.on_event("shutdown")
async def shutdown_event():
    await scheduler.stop()
    await crawler.close()

@router.post("/crawl")
async def crawl(
    request: CrawlRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict = Depends(get_current_user)
):
    """Execute an immediate crawl"""
    try:
        # Validate URL against robots.txt
        if not await crawler.validate_url(str(request.url)):
            raise HTTPException(status_code=403, detail="URL is not allowed by robots.txt")

        # Initialize crawler if needed
        if not crawler.browser:
            await crawler.init_browser()

        # Execute crawl
        result = await crawler.crawl(
            str(request.url),
            request.mode,
            request.options
        )

        # Store result in background
        background_tasks.add_task(
            store_crawl_result,
            result,
            str(request.url),
            current_user['id']
        )

        return {
            "status": "success",
            "result": result
        }

    except Exception as e:
        logging.error(f"Crawl error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/schedule")
async def schedule_crawl(
    request: ScheduleRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Schedule a new crawl job"""
    try:
        job_id = str(uuid4())
        config = {
            'url': str(request.url),
            'mode': request.mode,
            'options': request.options,
            'user_id': current_user['id']
        }

        # Add job to scheduler
        await scheduler.add_job(job_id, config, request.schedule)

        return {
            "status": "success",
            "job_id": job_id
        }

    except Exception as e:
        logging.error(f"Scheduling error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/schedules")
async def get_schedules(current_user: Dict = Depends(get_current_user)):
    """Get all scheduled crawls for the current user"""
    try:
        jobs = await scheduler.get_jobs()
        return {
            "status": "success",
            "schedules": [job for job in jobs if job['config']['user_id'] == current_user['id']]
        }

    except Exception as e:
        logging.error(f"Error getting schedules: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/schedule/{job_id}")
async def update_schedule(
    job_id: str,
    request: ScheduleRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Update an existing scheduled crawl"""
    try:
        config = {
            'url': str(request.url),
            'mode': request.mode,
            'options': request.options,
            'user_id': current_user['id']
        }

        await scheduler.update_job(
            job_id,
            config,
            request.schedule,
            request.enabled
        )

        return {"status": "success"}

    except Exception as e:
        logging.error(f"Error updating schedule: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/schedule/{job_id}")
async def delete_schedule(
    job_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Delete a scheduled crawl"""
    try:
        await scheduler.remove_job(job_id)
        return {"status": "success"}

    except Exception as e:
        logging.error(f"Error deleting schedule: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def store_crawl_result(result: Dict, url: str, user_id: str):
    """Store crawl result in database"""
    try:
        from ..dependencies import get_supabase_client
        supabase = get_supabase_client()

        supabase.table('crawl_results').insert({
            'id': str(uuid4()),
            'url': url,
            'user_id': user_id,
            'content': result.get('content', ''),
            'metadata': {
                'performance': result.get('performance', {}),
                'security': result.get('security', {}),
                'timestamp': datetime.utcnow().isoformat()
            }
        }).execute()

    except Exception as e:
        logging.error(f"Error storing crawl result: {str(e)}")
        # Don't raise exception as this is a background task
