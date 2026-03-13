"""
Lisan - AI Router with Power Level Selection
Routes requests to the selected provider: Strong, Med, or Low.
Falls back through the chain if the selected provider fails.
"""

import json
import logging

from ai.providers import OpenRouterProvider, GroqProvider, OllamaProvider, ProviderError
from ai.prompts import (
    SYSTEM_PROMPT,
    CONCISE_PROMPT_TEMPLATE,
    DETAILED_PROMPT_TEMPLATE,
    WORD_EXPLORE_PROMPT,
    SPELLING_SYSTEM_PROMPT,
    SPELLING_PROMPT_TEMPLATE,
    MEANINGS_SYSTEM_PROMPT,
    MEANINGS_PROMPT_TEMPLATE,
    TASHKEEL_SYSTEM_PROMPT,
    TASHKEEL_PROMPT_TEMPLATE,
    MORPHOLOGY_SYSTEM_PROMPT,
    MORPHOLOGY_PROMPT_TEMPLATE,
    DICTIONARY_SYSTEM_PROMPT,
    DICTIONARY_PROMPT_TEMPLATE
)

logger = logging.getLogger(__name__)

# Power level → provider mapping
POWER_LEVELS = {
    "strong": "Advanced",   # OpenRouter
    "med": "Standard",      # Groq
    "low": "Local"          # Ollama
}


class AIRouter:
    """
    Manages AI provider selection by power level.
    If the selected provider fails, falls back through remaining providers.
    """

    def __init__(self):
        self.provider_map = {
            "Advanced": OpenRouterProvider(),
            "Standard": GroqProvider(),
            "Local": OllamaProvider()
        }
        # Default fallback order
        self.default_order = ["Advanced", "Standard", "Local"]

    def _get_provider_order(self, power_level):
        """
        Get provider order based on power level selection.
        Selected provider goes first, then fallback through remaining.
        """
        selected = POWER_LEVELS.get(power_level, "Advanced")

        # Build order: selected first, then remaining in default order
        order = [selected]
        for name in self.default_order:
            if name not in order:
                order.append(name)

        return order

    def _try_providers(self, messages, power_level="strong"):
        """
        Attempt providers starting with the selected one.
        Return (response_text, tier_name, failed_providers_list).
        """
        order = self._get_provider_order(power_level)
        errors = []
        failed = []

        for provider_name in order:
            provider = self.provider_map[provider_name]
            try:
                logger.info(f"Trying provider: {provider.name}")
                response = provider.chat(messages)
                logger.info(f"Success with provider: {provider.name}")
                return response, provider.name, failed
            except ProviderError as e:
                logger.warning(f"Provider {provider.name} failed: {e}")
                errors.append(f"{provider.name}: {e}")
                failed.append(provider.name)
                continue

        raise ProviderError(
            "All AI providers failed. Errors: " + " | ".join(errors)
        )

    def _parse_json_response(self, text):
        """
        Extract and parse JSON from the AI response.
        Handles cases where the AI wraps JSON in markdown code blocks.
        """
        cleaned = text.strip()

        # Remove markdown code block wrappers
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            # Try to find JSON object in the text
            start = cleaned.find("{")
            end = cleaned.rfind("}") + 1
            if start != -1 and end > start:
                try:
                    return json.loads(cleaned[start:end])
                except json.JSONDecodeError:
                    pass
            raise ProviderError("AI returned invalid JSON response")

    def analyze(self, sentence, mode="detailed", power_level="strong"):
        """
        Analyze an Arabic sentence grammatically.

        Returns:
            dict with keys: analysis, tier, failed_providers
        """
        if mode == "concise":
            user_prompt = CONCISE_PROMPT_TEMPLATE.format(sentence=sentence)
        else:
            user_prompt = DETAILED_PROMPT_TEMPLATE.format(sentence=sentence)

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ]

        response_text, tier, failed = self._try_providers(messages, power_level)
        analysis = self._parse_json_response(response_text)

        return {
            "analysis": analysis,
            "tier": tier,
            "failed_providers": failed
        }

    def explore_word(self, word, sentence, power_level="strong"):
        """Explore a specific word linguistically."""
        user_prompt = WORD_EXPLORE_PROMPT.format(word=word, sentence=sentence)

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ]

        response_text, tier, failed = self._try_providers(messages, power_level)
        exploration = self._parse_json_response(response_text)

        return {
            "exploration": exploration,
            "tier": tier,
            "failed_providers": failed
        }

    def spell_check(self, text, power_level="strong"):
        """Check spelling of Arabic text."""
        user_prompt = SPELLING_PROMPT_TEMPLATE.format(text=text)

        messages = [
            {"role": "system", "content": SPELLING_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ]

        response_text, tier, failed = self._try_providers(messages, power_level)
        result = self._parse_json_response(response_text)

        return {
            "result": result,
            "tier": tier,
            "failed_providers": failed
        }

    def find_meanings(self, word, power_level="strong"):
        """Find meanings, synonyms, and antonyms for an Arabic word."""
        user_prompt = MEANINGS_PROMPT_TEMPLATE.format(word=word)

        messages = [
            {"role": "system", "content": MEANINGS_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ]

        response_text, tier, failed = self._try_providers(messages, power_level)
        result = self._parse_json_response(response_text)

        return {
            "result": result,
            "tier": tier,
            "failed_providers": failed
        }

    def tashkeel(self, text, power_level="strong"):
        """Add diacritics (tashkeel) to Arabic text."""
        user_prompt = TASHKEEL_PROMPT_TEMPLATE.format(text=text)

        messages = [
            {"role": "system", "content": TASHKEEL_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ]

        response_text, tier, failed = self._try_providers(messages, power_level)
        result = self._parse_json_response(response_text)

        return {
            "result": result,
            "tier": tier,
            "failed_providers": failed
        }

    def morphology(self, word, power_level="strong"):
        """Perform morphological (Sarf) analysis on an Arabic word."""
        user_prompt = MORPHOLOGY_PROMPT_TEMPLATE.format(word=word)

        messages = [
            {"role": "system", "content": MORPHOLOGY_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ]

        response_text, tier, failed = self._try_providers(messages, power_level)
        result = self._parse_json_response(response_text)

        return {
            "result": result,
            "tier": tier,
            "failed_providers": failed
        }

    def dictionary_lookup(self, word, dictionaries, power_level="strong"):
        """Look up a word in multiple Arabic dictionaries."""
        dict_str = "، ".join(dictionaries)
        user_prompt = DICTIONARY_PROMPT_TEMPLATE.format(word=word, dictionaries=dict_str)

        messages = [
            {"role": "system", "content": DICTIONARY_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ]

        response_text, tier, failed = self._try_providers(messages, power_level)
        result = self._parse_json_response(response_text)

        return {
            "result": result,
            "tier": tier,
            "failed_providers": failed
        }
