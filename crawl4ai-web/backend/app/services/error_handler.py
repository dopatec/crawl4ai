from typing import Optional, Dict, Any
from datetime import datetime
import logging
from app.db.session import AsyncSessionLocal
from app.models.agent import AgentSession
import traceback
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ErrorRecovery:
    def __init__(self):
        self.max_retries = 3
        self.retry_delays = [5, 15, 30]  # seconds
    
    async def handle_error(
        self,
        session_id: str,
        error: Exception,
        context: Optional[Dict[str, Any]] = None
    ):
        try:
            async with AsyncSessionLocal() as db:
                session = await db.query(AgentSession).filter(
                    AgentSession.id == session_id
                ).first()
                
                if not session:
                    logger.error(f"Session {session_id} not found during error recovery")
                    return
                
                current_retries = len([
                    step for step in session.steps 
                    if step.get("type") == "error_recovery"
                ])
                
                error_details = {
                    "timestamp": datetime.utcnow().isoformat(),
                    "error_type": type(error).__name__,
                    "error_message": str(error),
                    "traceback": traceback.format_exc(),
                    "context": context
                }
                
                if current_retries < self.max_retries:
                    # Add error recovery step
                    session.steps.append({
                        "type": "error_recovery",
                        "timestamp": datetime.utcnow().isoformat(),
                        "retry_count": current_retries + 1,
                        "error_details": error_details,
                        "delay": self.retry_delays[current_retries]
                    })
                    
                    session.status = "retrying"
                else:
                    # Mark session as failed after max retries
                    session.status = "error"
                    session.steps.append({
                        "type": "error_final",
                        "timestamp": datetime.utcnow().isoformat(),
                        "error_details": error_details
                    })
                
                session.updated_at = datetime.utcnow()
                await db.commit()
                
                # Log the error
                logger.error(
                    f"Error in session {session_id} "
                    f"(retry {current_retries + 1}/{self.max_retries}): {str(error)}"
                )
                
                return current_retries < self.max_retries
        
        except Exception as e:
            logger.error(f"Error during error recovery: {str(e)}")
            return False

error_recovery = ErrorRecovery()
