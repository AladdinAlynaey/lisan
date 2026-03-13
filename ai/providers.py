"""
Lisan - AI Provider Implementations
Each provider exposes chat() and vision() methods with a unified interface.
Config is read at call time so .env changes take effect on restart.
"""

import json
import base64
import os
import requests
import logging

from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Reload .env each time to get fresh values
load_dotenv(override=True)


class ProviderError(Exception):
    """Raised when a provider fails to return a valid response."""
    pass


def _get_env(key, default=""):
    """Read an environment variable fresh (after dotenv load)."""
    return os.getenv(key, default)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  OpenRouter Provider (Primary — "Advanced")
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class OpenRouterProvider:
    """Communicates with OpenRouter API (OpenAI-compatible)."""

    name = "Advanced"

    @property
    def api_key(self):
        return _get_env("OPENROUTER_API_KEY")

    @property
    def model(self):
        return _get_env("OPENROUTER_MODEL", "google/gemini-2.5-flash-preview")

    @property
    def vision_model(self):
        return _get_env("OPENROUTER_VISION_MODEL", "google/gemini-2.5-flash-preview")

    @property
    def base_url(self):
        return _get_env("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

    @property
    def timeout(self):
        return int(_get_env("AI_TIMEOUT", "30"))

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://lisan-app.local",
            "X-Title": "Lisan Arabic Grammar"
        }

    def _is_configured(self):
        key = self.api_key
        return key and not key.startswith("your-") and len(key) > 10

    def chat(self, messages, model_override=None):
        """Send a chat completion request."""
        if not self._is_configured():
            raise ProviderError("OpenRouter API key not configured")

        payload = {
            "model": model_override or self.model,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 4096
        }

        try:
            resp = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self._headers(),
                json=payload,
                timeout=self.timeout
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            return content
        except Exception as e:
            logger.error(f"OpenRouter chat error: {e}")
            raise ProviderError(f"OpenRouter failed: {e}")

    def vision(self, image_b64, prompt, mime_type="image/png"):
        """Send an image + prompt to the vision model."""
        if not self._is_configured():
            raise ProviderError("OpenRouter API key not configured")

        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{image_b64}"
                        }
                    }
                ]
            }
        ]

        payload = {
            "model": self.vision_model,
            "messages": messages,
            "temperature": 0.1,
            "max_tokens": 1024
        }

        try:
            resp = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self._headers(),
                json=payload,
                timeout=self.timeout
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            return content
        except Exception as e:
            logger.error(f"OpenRouter vision error: {e}")
            raise ProviderError(f"OpenRouter vision failed: {e}")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Groq Provider (Secondary — "Standard")
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class GroqProvider:
    """Communicates with Groq API (OpenAI-compatible)."""

    name = "Standard"

    @property
    def api_key(self):
        return _get_env("GROQ_API_KEY")

    @property
    def model(self):
        return _get_env("GROQ_MODEL", "meta-llama/llama-4-maverick-17b-128e-instruct")

    @property
    def base_url(self):
        return _get_env("GROQ_BASE_URL", "https://api.groq.com/openai/v1")

    @property
    def timeout(self):
        return max(int(_get_env("AI_TIMEOUT", "30")) * 3, 90)  # Groq needs longer for large models

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def _is_configured(self):
        key = self.api_key
        return key and not key.startswith("your-") and len(key) > 10

    def chat(self, messages, model_override=None):
        """Send a chat completion request with retry on connection errors."""
        if not self._is_configured():
            raise ProviderError("Groq API key not configured")

        payload = {
            "model": model_override or self.model,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 4096
        }

        last_error = None
        for attempt in range(2):  # Retry once on connection failure
            try:
                resp = requests.post(
                    f"{self.base_url}/chat/completions",
                    headers=self._headers(),
                    json=payload,
                    timeout=self.timeout
                )
                resp.raise_for_status()
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                # gpt-oss models may put answer in reasoning field
                if not content and data["choices"][0]["message"].get("reasoning"):
                    content = data["choices"][0]["message"]["reasoning"]
                return content
            except (requests.exceptions.ConnectionError, 
                    requests.exceptions.Timeout) as e:
                last_error = e
                logger.warning(f"Groq attempt {attempt+1} connection error: {e}")
                if attempt == 0:
                    import time
                    time.sleep(1)
                    continue
                raise ProviderError(f"Groq connection failed after retries: {e}")
            except Exception as e:
                logger.error(f"Groq chat error: {e}")
                raise ProviderError(f"Groq failed: {e}")

    def vision(self, image_b64, prompt, mime_type="image/png"):
        """Groq does not support vision — raise immediately."""
        raise ProviderError("Groq does not support vision models")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Ollama Provider (Fallback — "Local")
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class OllamaProvider:
    """Communicates with local Ollama instance."""

    name = "Local"

    @property
    def base_url(self):
        return _get_env("OLLAMA_BASE_URL", "http://localhost:11434")

    @property
    def model(self):
        return _get_env("OLLAMA_MODEL", "llama3")

    @property
    def timeout(self):
        return int(_get_env("AI_TIMEOUT", "30")) * 2  # Local models may be slower

    def chat(self, messages, model_override=None):
        """Send a chat request to Ollama using the generate API."""
        # Build a single prompt from the messages
        prompt_parts = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system":
                prompt_parts.append(f"[System]: {content}")
            elif role == "user":
                prompt_parts.append(f"[User]: {content}")
            elif role == "assistant":
                prompt_parts.append(f"[Assistant]: {content}")

        full_prompt = "\n\n".join(prompt_parts)

        payload = {
            "model": model_override or self.model,
            "prompt": full_prompt,
            "stream": False,
            "options": {
                "temperature": 0.2,
                "num_predict": 4096
            }
        }

        try:
            resp = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=self.timeout
            )
            resp.raise_for_status()
            data = resp.json()
            content = data.get("response", "")
            if not content:
                raise ProviderError("Ollama returned empty response")
            return content
        except requests.exceptions.ConnectionError:
            raise ProviderError("Ollama is not running on " + self.base_url)
        except ProviderError:
            raise
        except Exception as e:
            logger.error(f"Ollama chat error: {e}")
            raise ProviderError(f"Ollama failed: {e}")

    def vision(self, image_b64, prompt, mime_type="image/png"):
        """Send image to Ollama vision model (llava, etc.)."""
        payload = {
            "model": self.model,
            "prompt": prompt,
            "images": [image_b64],
            "stream": False
        }

        try:
            resp = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=self.timeout
            )
            resp.raise_for_status()
            data = resp.json()
            content = data.get("response", "")
            if not content:
                raise ProviderError("Ollama vision returned empty response")
            return content
        except Exception as e:
            logger.error(f"Ollama vision error: {e}")
            raise ProviderError(f"Ollama vision failed: {e}")
