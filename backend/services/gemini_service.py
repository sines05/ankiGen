"""
/**
 * @file gemini_service.py
 * @description Service to communicate with Google's GenAI API for extracting core concepts from multimodal files (documents, images, audio, video).
 * @last_modified Refactored to use Gemini native File API for multimodal support instead of local text extraction.
 */
"""
import os
from google import genai
from pydantic import BaseModel
import json
import logging

class Flashcard(BaseModel):
    front: str
    back: str

class FlashcardList(BaseModel):
    cards: list[Flashcard]

def convert_document_to_json(file_path: str, language: str, max_cards: int, custom_prompt: str = "") -> list[dict]:
    # 1. Guard clause: API Key
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable not set")
    
    # 2. Guard clause: File Existence
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"The uploaded file does not exist: {file_path}")

    client = genai.Client(api_key=api_key)
    uploaded_file = None
    
    try:
        # Upload the file directly to Gemini's File API securely
        uploaded_file = client.files.upload(file=file_path)
        
        system_instruction = "You are an expert educational content creator and Anki flashcard structural engineer."

        prompt = f"""
        Analyze the provided document (which may contain text, images, or audio) and extract the most important core concepts into {max_cards} Flashcards.
        Target Language: {language}
        Ensure the 'front' asks a clear, definitive question or gives a prompt, and the 'back' gives a concise but comprehensive answer.
        """
        
        if custom_prompt.strip():
            prompt += f"\n\nUSER'S CUSTOM INSTRUCTIONS:\n{custom_prompt}\n(You MUST strictly follow these instructions when generating the flashcards)."
        else:
            prompt += "\n\nProvide a standard set of key concepts."

        prompt += "\nOutput only a JSON matching the schema provided."
        
        # Pass both the uploaded file asset and the text prompt to the multimodal model
        response = client.models.generate_content(
            model='gemma-4-31b-it',
            contents=[uploaded_file, prompt],
            config=genai.types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=FlashcardList,
                temperature=0.2,
            )
        )
        
        if not response.text:
            return []
            
        return json.loads(response.text).get("cards", [])
        
    finally:
        # 3. Guard clause/Cleanup: Self-destruct remote file after processing guarantees privacy
        if uploaded_file:
            try:
                client.files.delete(name=uploaded_file.name)
            except Exception as e:
                logging.error(f"Failed to delete remote file {uploaded_file.name}: {e}")
