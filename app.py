"""
Lisan - AI-Powered Arabic Grammar Learning Application
Main Flask application with routes, security, and rate limiting.
"""

import os
import json
import uuid
import logging
from pathlib import Path

from flask import (
    Flask, render_template, request, jsonify,
    session, send_from_directory
)
from flask_wtf.csrf import CSRFProtect
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.utils import secure_filename

from config.settings import Config
from ai.router import AIRouter
from ai.providers import ProviderError
from vision.image_parser import extract_text_from_image
from chat.context_chat import ContextChat

# ── Logging ───────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# ── Flask App ─────────────────────────────────────────
app = Flask(__name__)
app.config["SECRET_KEY"] = Config.SECRET_KEY
app.config["MAX_CONTENT_LENGTH"] = Config.MAX_CONTENT_LENGTH

# ── CSRF Protection ──────────────────────────────────
csrf = CSRFProtect(app)

# ── Rate Limiting ────────────────────────────────────
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    storage_uri="memory://"
)

# ── Services ─────────────────────────────────────────
ai_router = AIRouter()
context_chat = ContextChat()

# ── Upload Directory ─────────────────────────────────
UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "bmp", "tiff"}
ALLOWED_MIME_TYPES = {
    "image/png", "image/jpeg", "image/webp",
    "image/bmp", "image/tiff"
}


def allowed_file(filename):
    """Check if file extension is allowed."""
    return "." in filename and \
        filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def validate_arabic_text(text):
    """Validate that the input contains Arabic characters."""
    if not text or not text.strip():
        return False, "الرجاء إدخال نص"
    if len(text.strip()) > 2000:
        return False, "النص طويل جداً. الحد الأقصى ٢٠٠٠ حرف"
    # Check for at least some Arabic unicode characters
    arabic_chars = sum(
        1 for c in text
        if "\u0600" <= c <= "\u06FF" or "\u0750" <= c <= "\u077F"
        or "\uFB50" <= c <= "\uFDFF" or "\uFE70" <= c <= "\uFEFF"
    )
    if arabic_chars < 2:
        return False, "الرجاء إدخال نص عربي صحيح"
    return True, ""


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Routes
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.route("/")
def index():
    """Grammar analysis page."""
    return render_template("grammar.html", active_page="grammar")


@app.route("/spelling")
def spelling_page():
    """Spelling correction page."""
    return render_template("spelling.html", active_page="spelling")


@app.route("/meanings")
def meanings_page():
    """Meanings & synonyms page."""
    return render_template("meanings.html", active_page="meanings")


@app.route("/api/analyze", methods=["POST"])
@limiter.limit(Config.RATE_LIMIT_ANALYZE)
def analyze():
    """
    Analyze an Arabic sentence grammatically.
    Expects JSON: { sentence: str, mode: "concise"|"detailed" }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "بيانات غير صالحة"}), 400

        sentence = data.get("sentence", "").strip()
        mode = data.get("mode", "detailed")
        power_level = data.get("power_level", "strong")

        # Validate input
        valid, error_msg = validate_arabic_text(sentence)
        if not valid:
            return jsonify({"error": error_msg}), 400

        if mode not in ("concise", "detailed"):
            mode = "detailed"

        if power_level not in ("strong", "med", "low"):
            power_level = "strong"

        # Run analysis through AI router
        result = ai_router.analyze(sentence, mode, power_level)

        # Store analysis in session for chat context
        session["last_sentence"] = sentence
        session["last_analysis"] = result["analysis"]

        return jsonify({
            "success": True,
            "sentence": sentence,
            "mode": mode,
            "tier": result["tier"],
            "analysis": result["analysis"],
            "failed_providers": result.get("failed_providers", [])
        })

    except ProviderError as e:
        logger.error(f"Analysis failed: {e}")
        return jsonify({
            "error": "عذراً، فشل التحليل. يرجى المحاولة مرة أخرى."
        }), 503
    except Exception as e:
        logger.error(f"Unexpected error in /api/analyze: {e}")
        return jsonify({
            "error": "حدث خطأ غير متوقع"
        }), 500


@app.route("/api/analyze-image", methods=["POST"])
@limiter.limit(Config.RATE_LIMIT_ANALYZE)
def analyze_image():
    """
    Upload an image, extract Arabic text, and analyze it.
    Expects multipart form with 'image' file and 'mode' field.
    """
    try:
        if "image" not in request.files:
            return jsonify({"error": "لم يتم رفع صورة"}), 400

        file = request.files["image"]
        mode = request.form.get("mode", "detailed")
        power_level = request.form.get("power_level", "strong")

        if not file or file.filename == "":
            return jsonify({"error": "ملف غير صالح"}), 400

        if not allowed_file(file.filename):
            return jsonify({
                "error": "صيغة الملف غير مدعومة. الصيغ المدعومة: PNG, JPG, WEBP"
            }), 400

        if power_level not in ("strong", "med", "low"):
            power_level = "strong"

        # Save file temporarily
        filename = secure_filename(f"{uuid.uuid4().hex}_{file.filename}")
        filepath = UPLOAD_DIR / filename
        file.save(str(filepath))

        # Determine MIME type
        ext = filename.rsplit(".", 1)[1].lower()
        mime_map = {
            "png": "image/png", "jpg": "image/jpeg",
            "jpeg": "image/jpeg", "webp": "image/webp",
            "bmp": "image/bmp", "tiff": "image/tiff"
        }
        mime_type = mime_map.get(ext, "image/png")

        try:
            # Extract text from image
            extraction = extract_text_from_image(str(filepath), mime_type, power_level)

            if not extraction["text"]:
                return jsonify({
                    "error": "لم يتم العثور على نص عربي في الصورة"
                }), 400

            sentence = extraction["text"]

            # Validate extracted text
            valid, error_msg = validate_arabic_text(sentence)
            if not valid:
                return jsonify({"error": error_msg}), 400

            # Run analysis
            result = ai_router.analyze(sentence, mode, power_level)

            # Store in session
            session["last_sentence"] = sentence
            session["last_analysis"] = result["analysis"]

            return jsonify({
                "success": True,
                "sentence": sentence,
                "mode": mode,
                "tier": result["tier"],
                "analysis": result["analysis"],
                "extraction_method": extraction["method"],
                "failed_providers": result.get("failed_providers", [])
            })

        finally:
            # Clean up uploaded file
            if filepath.exists():
                filepath.unlink()

    except ProviderError as e:
        logger.error(f"Image analysis failed: {e}")
        return jsonify({
            "error": "عذراً، فشل تحليل الصورة. يرجى المحاولة مرة أخرى."
        }), 503
    except Exception as e:
        logger.error(f"Unexpected error in /api/analyze-image: {e}")
        return jsonify({
            "error": "حدث خطأ غير متوقع"
        }), 500


@app.route("/api/chat", methods=["POST"])
@limiter.limit(Config.RATE_LIMIT_CHAT)
def chat():
    """
    Handle contextual chat about the analyzed sentence.
    Expects JSON: { question: str, sentence: str, analysis: dict, history: list }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "بيانات غير صالحة"}), 400

        question = data.get("question", "").strip()
        sentence = data.get("sentence", "") or session.get("last_sentence", "")
        analysis = data.get("analysis", {}) or session.get("last_analysis", {})
        history = data.get("history", [])
        power_level = data.get("power_level", "strong")

        if not question:
            return jsonify({"error": "الرجاء كتابة سؤال"}), 400

        if not sentence or not analysis:
            return jsonify({
                "error": "يرجى تحليل جملة أولاً قبل طرح الأسئلة"
            }), 400

        if len(question) > 500:
            return jsonify({
                "error": "السؤال طويل جداً. الحد الأقصى ٥٠٠ حرف"
            }), 400

        if power_level not in ("strong", "med", "low"):
            power_level = "strong"

        result = context_chat.ask(question, sentence, analysis, history, power_level)

        return jsonify({
            "success": True,
            "answer": result["answer"],
            "tier": result["tier"]
        })

    except Exception as e:
        logger.error(f"Chat error: {e}")
        return jsonify({
            "error": "حدث خطأ في المحادثة"
        }), 500


@app.route("/api/explore-word", methods=["POST"])
@limiter.limit(Config.RATE_LIMIT_CHAT)
def explore_word():
    """
    Explore a specific word linguistically.
    Expects JSON: { word: str, sentence: str }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "بيانات غير صالحة"}), 400

        word = data.get("word", "").strip()
        sentence = data.get("sentence", "") or session.get("last_sentence", "")
        power_level = data.get("power_level", "strong")

        if not word:
            return jsonify({"error": "الرجاء تحديد كلمة"}), 400

        if not sentence:
            return jsonify({
                "error": "يرجى تحليل جملة أولاً"
            }), 400

        result = ai_router.explore_word(word, sentence, power_level)

        return jsonify({
            "success": True,
            "exploration": result["exploration"],
            "tier": result["tier"]
        })

    except ProviderError as e:
        logger.error(f"Word exploration failed: {e}")
        return jsonify({
            "error": "عذراً، فشل استكشاف الكلمة"
        }), 503
    except Exception as e:
        logger.error(f"Word exploration error: {e}")
        return jsonify({
            "error": "حدث خطأ غير متوقع"
        }), 500


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Error Handlers
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.errorhandler(413)
def too_large(e):
    return jsonify({
        "error": f"حجم الملف كبير جداً. الحد الأقصى {Config.MAX_UPLOAD_SIZE_MB} ميغابايت"
    }), 413


@app.errorhandler(429)
def rate_limited(e):
    return jsonify({
        "error": "عدد الطلبات كثير جداً. يرجى الانتظار قليلاً."
    }), 429


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "الصفحة غير موجودة"}), 404


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Spelling API
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.route("/api/spell-check", methods=["POST"])
@limiter.limit(Config.RATE_LIMIT_ANALYZE)
def spell_check():
    """Check spelling of Arabic text."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "طلب غير صالح"}), 400

        text = data.get("text", "").strip()
        power_level = data.get("power_level", "strong")

        valid, msg = validate_arabic_text(text)
        if not valid:
            return jsonify({"error": msg}), 400

        result = ai_router.spell_check(text, power_level)

        return jsonify({
            "result": result["result"],
            "tier": result["tier"],
            "failed_providers": result.get("failed_providers", [])
        })

    except ProviderError as e:
        logger.error(f"Spell check provider error: {e}")
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        logger.error(f"Spell check error: {e}", exc_info=True)
        return jsonify({"error": "حدث خطأ أثناء التصحيح الإملائي"}), 500


@app.route("/api/spell-check-image", methods=["POST"])
@limiter.limit(Config.RATE_LIMIT_ANALYZE)
def spell_check_image():
    """Extract text from image and check spelling."""
    try:
        if "image" not in request.files:
            return jsonify({"error": "لم يتم إرفاق صورة"}), 400

        file = request.files["image"]
        power_level = request.form.get("power_level", "strong")

        if file.filename == "":
            return jsonify({"error": "لم يتم اختيار ملف"}), 400
        if not allowed_file(file.filename):
            return jsonify({"error": "صيغة الملف غير مدعومة"}), 400
        if file.content_type not in ALLOWED_MIME_TYPES:
            return jsonify({"error": "نوع الملف غير مسموح"}), 400

        filename = secure_filename(f"{uuid.uuid4().hex}_{file.filename}")
        filepath = UPLOAD_DIR / filename
        file.save(str(filepath))

        try:
            extracted = extract_text_from_image(str(filepath), power_level)
        finally:
            filepath.unlink(missing_ok=True)

        extracted_text = extracted.get("text", "").strip()
        if not extracted_text:
            return jsonify({"error": "لم يتم التعرف على نص عربي في الصورة"}), 400

        result = ai_router.spell_check(extracted_text, power_level)

        return jsonify({
            "result": result["result"],
            "extracted_text": extracted_text,
            "tier": result["tier"],
            "failed_providers": result.get("failed_providers", [])
        })

    except ProviderError as e:
        logger.error(f"Spell check image error: {e}")
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        logger.error(f"Spell check image error: {e}", exc_info=True)
        return jsonify({"error": "حدث خطأ أثناء تصحيح نص الصورة"}), 500


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Meanings API
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.route("/api/meanings", methods=["POST"])
@limiter.limit(Config.RATE_LIMIT_ANALYZE)
def find_meanings():
    """Find meanings, synonyms, antonyms for a word."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "طلب غير صالح"}), 400

        word = data.get("word", "").strip()
        power_level = data.get("power_level", "strong")

        if not word:
            return jsonify({"error": "الرجاء إدخال كلمة"}), 400
        if len(word) > 100:
            return jsonify({"error": "الكلمة طويلة جداً"}), 400

        result = ai_router.find_meanings(word, power_level)

        return jsonify({
            "result": result["result"],
            "tier": result["tier"],
            "failed_providers": result.get("failed_providers", [])
        })

    except ProviderError as e:
        logger.error(f"Meanings error: {e}")
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        logger.error(f"Meanings error: {e}", exc_info=True)
        return jsonify({"error": "حدث خطأ أثناء البحث عن المعنى"}), 500


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Main
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if __name__ == "__main__":
    # Show configuration warnings
    warnings = Config.validate()
    for w in warnings:
        logger.warning(f"⚠ {w}")

    logger.info("═" * 50)
    logger.info("  Lisan — Arabic Grammar Learning App")
    logger.info(f"  Running on http://localhost:{Config.PORT}")
    logger.info("═" * 50)

    app.run(
        host="0.0.0.0",
        port=Config.PORT,
        debug=Config.DEBUG
    )
