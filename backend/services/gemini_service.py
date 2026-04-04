"""
/**
 * @file gemini_service.py
 * @description Service to communicate with Google's GenAI API for extracting core concepts from text.
 * @last_modified Added file header to comply with AGENT.md coding rules.
 */
"""
import os
from google import genai
from pydantic import BaseModel
import PyPDF2
import json

class Flashcard(BaseModel):
    front: str
    back: str

class FlashcardList(BaseModel):
    cards: list[Flashcard]

def extract_text_from_file(file_path: str) -> str:
    text = ""
    if file_path.lower().endswith(".pdf"):
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
    elif file_path.lower().endswith((".txt", ".md", ".csv")):
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
    else:
        raise ValueError("Unsupported file type")
    
    return text.strip()

def convert_document_to_json(file_path: str, language: str, max_cards: int) -> list[dict]:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable not set")
    
    client = genai.Client(api_key=api_key)
    
    text = extract_text_from_file(file_path)
    if not text:
        raise ValueError("No text could be extracted from the file.")
        
    prompt = f"""
    You are an expert educational content creator.
    Analyze the following educational text and extract the most important core concepts into {max_cards} Flashcards.
    Target Language: {language}
    Ensure the 'front' asks a clear, definitive question or gives a prompt, and the 'back' gives a concise but comprehensive answer.
    Output only a JSON matching the schema provided.
    
    Source Text:
    {text[:80000]}
    """
    
    response = client.models.generate_content(
        model='gemma-4-31b-it',
        contents=prompt,
        config=genai.types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=FlashcardList,
            temperature=0.2,
        )
    )
    
    return json.loads(response.text).get("cards", [])
