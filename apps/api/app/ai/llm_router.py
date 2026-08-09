"""OpenAI-only LLM router (legacy API path) with demo fallback — no Anthropic."""

from __future__ import annotations

from dataclasses import dataclass

from app.core.config import get_settings


@dataclass
class LLMResponse:
    content: str
    model: str
    provider: str
    tokens_in: int = 0
    tokens_out: int = 0
    cost_usd: float = 0.0
    error: str | None = None


class LLMRouter:
    def resolve_provider(self) -> str:
        settings = get_settings()
        if getattr(settings, "llm_provider", "auto") == "demo":
            return "demo"
        if getattr(settings, "openai_api_key", ""):
            return "openai"
        return "demo"

    async def complete(
        self,
        messages: list[dict[str, str]],
        *,
        system: str | None = None,
        temperature: float = 0.2,
    ) -> LLMResponse:
        if self.resolve_provider() == "openai":
            return await self._openai(messages, system=system, temperature=temperature)
        return self._demo(messages, system=system)

    async def _openai(
        self,
        messages: list[dict[str, str]],
        *,
        system: str | None,
        temperature: float,
    ) -> LLMResponse:
        from openai import AsyncOpenAI

        settings = get_settings()
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        payload: list[dict[str, str]] = []
        if system:
            payload.append({"role": "system", "content": system})
        payload.extend(messages)
        try:
            resp = await client.chat.completions.create(
                model=settings.openai_model,
                messages=payload,
                temperature=temperature,
            )
        except Exception as exc:  # noqa: BLE001
            fallback = self._demo(messages, system=system)
            fallback.error = str(exc)
            fallback.content = f"{fallback.content}\n\n_(OpenAI fallback: {exc})_"
            return fallback
        content = resp.choices[0].message.content or ""
        usage = resp.usage
        tin = usage.prompt_tokens if usage else 0
        tout = usage.completion_tokens if usage else 0
        return LLMResponse(
            content=content,
            model=settings.openai_model,
            provider="openai",
            tokens_in=tin,
            tokens_out=tout,
            cost_usd=(tin * 0.15 + tout * 0.6) / 1_000_000,
        )

    def _demo(self, messages: list[dict[str, str]], *, system: str | None) -> LLMResponse:
        user = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
        content = f"**EIOS Demo Brain**\n\nQuery: {user}\n\nSet OPENAI_API_KEY for cloud synthesis."
        return LLMResponse(content=content, model="demo-brain", provider="demo")


llm_router = LLMRouter()

PROMPT_LIBRARY = {
    "copilot": "You are EIOS Copilot. Be precise and cite sources when provided.",
    "researcher": "You are a clinical research agent.",
    "safety": "You are a pharmacovigilance analyst.",
    "regulatory": "You are a regulatory affairs specialist.",
    "analyst": "You are a commercial analytics agent.",
}
