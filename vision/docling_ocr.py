"""
Lisan - Docling OCR Integration
Uses the Docling library for local OCR text extraction from images.
https://github.com/docling-project/docling
"""

import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def extract_text_with_docling(image_path):
    """
    Extract text from an image using the Docling library.

    Args:
        image_path: Path to the image file (str or Path)

    Returns:
        Extracted text string, or empty string on failure
    """
    try:
        from docling.document_converter import DocumentConverter

        image_path = str(image_path)
        logger.info(f"Running Docling OCR on: {image_path}")

        converter = DocumentConverter()
        result = converter.convert(image_path)

        # Extract text from the conversion result
        text = result.document.export_to_text()

        if text:
            text = text.strip()
            logger.info(f"Docling extracted {len(text)} characters")
            return text
        else:
            logger.warning("Docling returned empty text")
            return ""

    except ImportError:
        logger.error(
            "Docling is not installed. "
            "Install it with: pip install docling"
        )
        return ""
    except Exception as e:
        logger.error(f"Docling OCR error: {e}")
        return ""
