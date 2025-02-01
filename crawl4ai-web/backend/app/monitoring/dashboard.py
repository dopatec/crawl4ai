from fastapi import APIRouter, Depends
from app.db.session import get_db
from app.models.agent import AgentSession
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import psutil
import json

router = APIRouter()

class SystemMetrics:
    @staticmethod
    def get_system_metrics():
        return {
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_usage": psutil.disk_usage('/').percent
        }

class AgentMetrics:
    @staticmethod
    async def get_agent_metrics(db: Session):
        total_sessions = db.query(func.count(AgentSession.id)).scalar()
        active_sessions = db.query(func.count(AgentSession.id)).filter(
            AgentSession.status == "running"
        ).scalar()
        error_sessions = db.query(func.count(AgentSession.id)).filter(
            AgentSession.status == "error"
        ).scalar()
        
        # Get hourly session counts for the last 24 hours
        now = datetime.utcnow()
        hourly_counts = []
        for i in range(24):
            start_time = now - timedelta(hours=i+1)
            end_time = now - timedelta(hours=i)
            count = db.query(func.count(AgentSession.id)).filter(
                AgentSession.created_at.between(start_time, end_time)
            ).scalar()
            hourly_counts.append({
                "hour": start_time.strftime("%H:00"),
                "count": count
            })
        
        return {
            "total_sessions": total_sessions,
            "active_sessions": active_sessions,
            "error_sessions": error_sessions,
            "hourly_counts": hourly_counts
        }

@router.get("/metrics")
async def get_metrics(db: Session = Depends(get_db)):
    system_metrics = SystemMetrics.get_system_metrics()
    agent_metrics = await AgentMetrics.get_agent_metrics(db)
    
    return {
        "system": system_metrics,
        "agent": agent_metrics,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/metrics/history")
async def get_metrics_history(db: Session = Depends(get_db)):
    # Get the last 7 days of metrics
    now = datetime.utcnow()
    start_date = now - timedelta(days=7)
    
    sessions = db.query(AgentSession).filter(
        AgentSession.created_at >= start_date
    ).all()
    
    daily_metrics = []
    for i in range(7):
        day_start = now - timedelta(days=i+1)
        day_end = now - timedelta(days=i)
        
        day_sessions = [
            s for s in sessions 
            if day_start <= s.created_at < day_end
        ]
        
        success_rate = len([s for s in day_sessions if s.status == "completed"]) / len(day_sessions) if day_sessions else 0
        
        daily_metrics.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "total_sessions": len(day_sessions),
            "success_rate": success_rate,
            "avg_duration": sum((s.updated_at - s.created_at).total_seconds() for s in day_sessions) / len(day_sessions) if day_sessions else 0
        })
    
    return {
        "daily_metrics": daily_metrics,
        "total_sessions_last_7_days": len(sessions)
    }
