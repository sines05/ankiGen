"""
/**
 * @file gemini_service.py
 * @description Service to communicate with Google's GenAI API for extracting core concepts from multimodal files (documents, images, audio, video).
 * @last_modified Refined prompts with specific examples for MCQ, True/False, and Standard card styles to ensure high-quality output and clear Front/Back distinction.
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
        
        system_instruction = (
            "You are an expert educational content creator and Anki flashcard structural engineer. "
            "Your task is to analyze documents and generate high-quality flashcards following a strict JSON schema."
        )

        # Base instruction
        base_instruction = (
            f"Analyze the provided document (text, images, or audio) and extract the most important core concepts into {max_cards} Flashcards.\n"
            f"Target Language: {language}\n"
        )

        if "MCQs (Multiple Choice)" in custom_prompt:
            style_instruction = """
FORMAT: MCQs (Multiple Choice)
- FRONT: Provide a clear question followed by 4 options labeled A, B, C, and D.
- BACK: Provide the correct letter (e.g., 'C) Paris') followed by a concise explanation of why it is correct.
EXAMPLE:
Front: "Which organ is responsible for pumping blood through the body?\\nA) Lungs\\nB) Heart\\nC) Liver\\nD) Kidneys"
Back: "B) Heart. The heart is a muscular organ that pumps blood to all parts of the body."
"""
        elif "True/False Questions" in custom_prompt:
            style_instruction = """
FORMAT: True/False
- FRONT: Provide a definitive statement about a specific concept.
- BACK: Start with either 'True' or 'False', followed by a concise explanation.
EXAMPLE:
Front: "Water freezes at 0 degrees Celsius under standard atmospheric pressure."
Back: "True. 0°C (32°F) is the standard freezing point of water."
"""
        elif custom_prompt.strip() and not custom_prompt.startswith("Extract as:"):
            # Truly custom instructions provided by user
            style_instruction = f"\nUSER'S CUSTOM INSTRUCTIONS:\n{custom_prompt}\n(You MUST strictly follow these instructions)."
        else:
            # Standard style
            style_instruction = """
FORMAT: Standard Flashcard
- FRONT: A clear definition, term, or specific question.
- BACK: A concise yet comprehensive explanation or answer.
EXAMPLE:
Front: "What is Mitochondria?"
Back: "Mitochondria are membrane-bound cell organelles that generate most of the chemical energy needed to power the cell's biochemical reactions."
"""

        prompt = f"{base_instruction}\n{style_instruction}\n\nOutput only a JSON matching the schema provided."
        
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
