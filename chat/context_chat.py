"""
Lisan - Contextual Chat Assistant
Answers questions ONLY about the analyzed sentence and its grammar.
Supports power level selection with fallback through providers.
"""

import json
import logging

from ai.providers import OpenRouterProvider, GroqProvider, OllamaProvider, ProviderError
from ai.prompts import CHAT_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

# Power level → provider name mapping
POWER_LEVELS = {
    "strong": "Advanced",
    "med": "Standard",
    "low": "Local"
}


class ContextChat:
    """
    Manages contextual chat about an analyzed sentence.
    Rejects off-topic questions with a polite message.
    Uses power level selection with fallback chain.
    """

    REJECTION_MSG = "هذا المساعد مخصص فقط للإجابة على أسئلة حول الجملة المحللة."

    def __init__(self):
        self.provider_map = {
            "Advanced": OpenRouterProvider(),
            "Standard": GroqProvider(),
            "Local": OllamaProvider()
        }
        self.default_order = ["Advanced", "Standard", "Local"]

    def _get_provider_order(self, power_level):
        """Get provider order: selected first, then fallback."""
        selected = POWER_LEVELS.get(power_level, "Advanced")
        order = [selected]
        for name in self.default_order:
            if name not in order:
                order.append(name)
        return order

    def _build_system_prompt(self, sentence, analysis):
        """Build the system prompt with sentence context."""
        if isinstance(analysis, dict):
            analysis_str = json.dumps(analysis, ensure_ascii=False, indent=2)
        else:
            analysis_str = str(analysis)

        return CHAT_SYSTEM_PROMPT.format(
            sentence=sentence,
            analysis=analysis_str
        )

    def ask(self, question, sentence, analysis, chat_history=None, power_level="strong"):
        """
        Process a student's question about the analyzed sentence.

        Args:
            question: Student's question text
            sentence: The original Arabic sentence
            analysis: The grammar analysis result (dict)
            chat_history: Optional list of previous messages
            power_level: "strong", "med", or "low"

        Returns:
            dict with keys: answer (str), tier (str)
        """
        system_prompt = self._build_system_prompt(sentence, analysis)

        messages = [{"role": "system", "content": system_prompt}]

        # Add chat history if available
        if chat_history:
            for msg in chat_history[-10:]:  # Keep last 10 messages
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })

        messages.append({"role": "user", "content": question})

        # Try providers in fallback order based on power level
        order = self._get_provider_order(power_level)
        errors = []

        for provider_name in order:
            provider = self.provider_map[provider_name]
            try:
                logger.info(f"Chat trying provider: {provider.name}")
                response = provider.chat(messages)
                return {
                    "answer": response.strip(),
                    "tier": provider.name
                }
            except ProviderError as e:
                logger.warning(f"Chat provider {provider.name} failed: {e}")
                errors.append(str(e))
                continue

        # If all providers fail, return a graceful error
        return {
            "answer": "عذراً، حدث خطأ في معالجة سؤالك. يرجى المحاولة مرة أخرى.",
            "tier": "none"
        }
