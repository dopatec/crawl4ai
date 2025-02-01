from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import logging
import json
from typing import Dict, List
from uuid import uuid4
import os
from supabase import create_client, Client

from .advanced_crawler import AdvancedCrawler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CrawlScheduler:
    def __init__(self):
        self.scheduler = AsyncIOScheduler(
            jobstores={
                'default': SQLAlchemyJobStore(url='sqlite:///jobs.sqlite')
            }
        )
        self.supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY")
        )
        self.crawler = AdvancedCrawler()

    async def start(self):
        """Start the scheduler"""
        if not self.scheduler.running:
            self.scheduler.start()
            logger.info("Scheduler started")
            await self._restore_jobs()

    async def _restore_jobs(self):
        """Restore scheduled jobs from database"""
        try:
            response = self.supabase.table('scheduled_crawls').select('*').execute()
            for job in response.data:
                if job['enabled']:
                    await self.add_job(
                        job['id'],
                        job['config'],
                        job['schedule']
                    )
        except Exception as e:
            logger.error(f"Error restoring jobs: {str(e)}")

    async def add_job(self, job_id: str, config: Dict, schedule: str) -> str:
        """Add a new scheduled crawl job"""
        try:
            # Parse schedule string into CronTrigger
            trigger = CronTrigger.from_crontab(schedule)
            
            # Add job to scheduler
            self.scheduler.add_job(
                self._execute_crawl,
                trigger=trigger,
                args=[job_id, config],
                id=job_id,
                replace_existing=True
            )
            
            logger.info(f"Added job {job_id} with schedule {schedule}")
            return job_id
            
        except Exception as e:
            logger.error(f"Error adding job: {str(e)}")
            raise

    async def _execute_crawl(self, job_id: str, config: Dict):
        """Execute a scheduled crawl"""
        try:
            logger.info(f"Executing scheduled crawl {job_id}")
            
            # Initialize crawler if needed
            if not self.crawler.browser:
                await self.crawler.init_browser()
            
            # Execute crawl
            result = await self.crawler.crawl(
                config['url'],
                config['mode'],
                config.get('options', {})
            )
            
            # Store result in Supabase
            self.supabase.table('crawl_results').insert({
                'id': str(uuid4()),
                'job_id': job_id,
                'url': config['url'],
                'content': result.get('content', ''),
                'metadata': {
                    'performance': result.get('performance', {}),
                    'security': result.get('security', {}),
                    'timestamp': datetime.utcnow().isoformat()
                }
            }).execute()
            
            logger.info(f"Completed scheduled crawl {job_id}")
            
        except Exception as e:
            logger.error(f"Error executing crawl {job_id}: {str(e)}")
            # Update job status in database
            self.supabase.table('scheduled_crawls').update({
                'last_error': str(e),
                'last_run': datetime.utcnow().isoformat()
            }).eq('id', job_id).execute()

    async def remove_job(self, job_id: str):
        """Remove a scheduled job"""
        try:
            self.scheduler.remove_job(job_id)
            logger.info(f"Removed job {job_id}")
        except Exception as e:
            logger.error(f"Error removing job: {str(e)}")
            raise

    async def get_jobs(self) -> List[Dict]:
        """Get all scheduled jobs"""
        try:
            response = self.supabase.table('scheduled_crawls').select('*').execute()
            return response.data
        except Exception as e:
            logger.error(f"Error getting jobs: {str(e)}")
            return []

    async def update_job(self, job_id: str, config: Dict, schedule: str, enabled: bool):
        """Update an existing job"""
        try:
            if enabled:
                await self.add_job(job_id, config, schedule)
            else:
                await self.remove_job(job_id)
            
            self.supabase.table('scheduled_crawls').update({
                'config': config,
                'schedule': schedule,
                'enabled': enabled,
                'updated_at': datetime.utcnow().isoformat()
            }).eq('id', job_id).execute()
            
            logger.info(f"Updated job {job_id}")
            
        except Exception as e:
            logger.error(f"Error updating job: {str(e)}")
            raise

    async def stop(self):
        """Stop the scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            await self.crawler.close()
            logger.info("Scheduler stopped")
