"""
/**
 * @file tasks.py
 * @description Old Celery worker entry point, now replaced by FastAPI BackgroundTasks but kept as a reference module.
 * @last_modified Added file header to comply with AGENT.md coding rules.
 */
"""
import os
from celery import Celery
from services.gemini_service import convert_document_to_json

broker_url = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
result_backend = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/1')

celery_app = Celery("anki_tasks", broker=broker_url, backend=result_backend)

@celery_app.task(bind=True)
def process_document_to_anki_task(self, file_path: str, language: str, max_cards: int):
    self.update_state(state='PROGRESS', meta={'progress': 'Reading document content...'})
    try:
        self.update_state(state='PROGRESS', meta={'progress': 'Extracting core concepts using AI...'})
        result = convert_document_to_json(file_path, language, max_cards)
        
        # Cleanup
        if os.path.exists(file_path):
            os.remove(file_path)
            
        return result
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise e
