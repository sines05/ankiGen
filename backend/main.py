"""
/**
 * @file main.py
 * @description FastAPI backend entry point for Doc2Anki. Handles document uploads, queues background AI processing, polls status, and returns .apkg files.
 * @last_modified Implemented robust AI retry mechanism with exponential backoff and progress notifications.
 */
"""
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
import shutil
import uuid
import os
import logging
from tenacity import retry, stop_after_attempt, wait_exponential, Retrying, before_sleep_log
from pydantic import BaseModel
from typing import List

from services.gemini_service import convert_document_to_json
from services.anki_service import export_apkg

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "/tmp/anki_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# In-memory store for jobs
job_store = {}

class Flashcard(BaseModel):
    front: str
    back: str

class ExportRequest(BaseModel):
    deck_name: str
    cards: List[Flashcard]

def process_document_background(job_id: str, file_path: str, language: str, max_cards: int, custom_prompt: str = ""):
    job_store[job_id] = {"status": "processing", "progress": "Initializing AI session..."}
    try:
        def update_progress(retry_state):
            attempt = retry_state.attempt_number
            job_store[job_id]["progress"] = f"AI extracting (Attempt {attempt}/3)..."
            if attempt > 1:
                logging.warning(f"Retrying job {job_id}: Attempt {attempt}")

        # Use tenacity for robust retrying
        for attempt in Retrying(
            stop=stop_after_attempt(3),
            wait=wait_exponential(multiplier=1, min=2, max=10),
            before_sleep=update_progress,
            reraise=True
        ):
            with attempt:
                result = convert_document_to_json(file_path, language, max_cards, custom_prompt)
        
        job_store[job_id] = {
            "status": "completed",
            "data": result
        }
    except Exception as e:
        logging.error(f"Job {job_id} failed after retries: {e}")
        job_store[job_id] = {
            "status": "failed",
            "error": str(e)
        }
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@app.post("/api/v1/upload-document")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    language: str = Form("English"),
    max_cards: int = Form(20),
    custom_prompt: str = Form("")
):
    try:
        job_id = str(uuid.uuid4())
        # Use only job_id and extension for the file path to avoid non-ASCII encoding issues
        file_extension = os.path.splitext(file.filename)[1]
        file_path = os.path.join(UPLOAD_DIR, f"{job_id}{file_extension}")
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        job_store[job_id] = {"status": "pending", "progress": "In queue..."}
        background_tasks.add_task(process_document_background, job_id, file_path, language, max_cards, custom_prompt)
        
        return {"job_id": job_id, "status": "processing"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/job-status/{job_id}")
async def get_job_status(job_id: str):
    job = job_store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@app.post("/api/v1/export-apkg")
async def export_apkg_endpoint(request: ExportRequest):
    file_bytes = export_apkg(request.deck_name, [c.model_dump() for c in request.cards])
    return Response(
        content=file_bytes,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename={request.deck_name}.apkg"}
    )
