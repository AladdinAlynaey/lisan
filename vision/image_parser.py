"""
Lisan - Image Parser
Sends images to AI vision models for Arabic text extraction.
Uses power level to choose primary vision provider.
Falls back through providers: OpenRouter → Ollama → Docling OCR.
"""

import base64
import logging
from pathlib import Path

from ai.providers import OpenRouterProvider, OllamaProvider, ProviderError
from ai.prompts import VISION_EXTRACT_PROMPT
from vision.docling_ocr import extract_text_with_docling

logger = logging.getLogger(__name__)


def extract_text_from_image(image_path, mime_type="image/png", power_level="strong"):
    """
    Extract Arabic text from an image using a multi-step fallback.
    
    Power level controls the order:
      - strong: OpenRouter → Ollama → Docling
      - med/low: Ollama → OpenRouter → Docling

    Args:
        image_path: Path to the image file
        mime_type: MIME type of the image
        power_level: "strong", "med", or "low"

    Returns:
        dict with keys: text (str), method (str)
    """
    # Read and encode the image
    with open(image_path, "rb") as f:
        image_data = f.read()
    image_b64 = base64.b64encode(image_data).decode("utf-8")

    # Build provider order based on power level
    if power_level == "strong":
        vision_steps = [
            ("OpenRouter", OpenRouterProvider(), "vision"),
            ("Ollama", OllamaProvider(), "vision_local"),
        ]
    else:
        # For med/low, try local first
        vision_steps = [
            ("Ollama", OllamaProvider(), "vision_local"),
            ("OpenRouter", OpenRouterProvider(), "vision"),
        ]

    # Try vision providers in order
    for name, provider, method_label in vision_steps:
        try:
            logger.info(f"Attempting text extraction via {name} vision...")
            result = provider.vision(image_b64, VISION_EXTRACT_PROMPT, mime_type)

            if result and "NO_ARABIC_TEXT_FOUND" not in result:
                extracted = result.strip()
                if extracted:
                    logger.info(f"{name} vision successfully extracted text")
                    return {
                        "text": extracted,
                        "method": method_label
                    }
            logger.warning(f"{name} vision did not find Arabic text")
        except ProviderError as e:
            logger.warning(f"{name} vision failed: {e}")

    # Fall back to Docling OCR
    try:
        logger.info("Falling back to Docling OCR...")
        text = extract_text_with_docling(image_path)
        if text:
            logger.info("Docling OCR successfully extracted text")
            return {
                "text": text,
                "method": "ocr"
            }
    except Exception as e:
        logger.error(f"Docling OCR failed: {e}")

    return {
        "text": "",
        "method": "none"
    }
