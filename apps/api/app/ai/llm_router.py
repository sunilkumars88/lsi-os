"""LLM-agnostic router with demo-brain fallback."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.core.config import get_settings


@dataclass
class LLMResponse:
    content: str
    model: str
    provider: str
    tokens_in: int = 0
    tokens_out: int = 0
    cost_usd: float = 0.0


class LLMRouter:
    def resolve_provider(self) -> str:
        settings = get_settings()
        if settings.llm_provider not in ("auto", ""):
            return settings.llm_provider
        if settings.openai_api_key:
            return "openai"
        if settings.anthropic_api_key:
            return "anthropic"
        return "demo"

    async def complete(
        self,
        messages: list[dict[str, str]],
        *,
        system: str | None = None,
        temperature: float = 0.2,
    ) -> LLMResponse:
        provider = self.resolve_provider()
        if provider == "openai":
            return await self._openai(messages, system=system, temperature=temperature)
        if provider == "anthropic":
            return await self._anthropic(messages, system=system, temperature=temperature)
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
        resp = await client.chat.completions.create(
            model=settings.openai_model,
            messages=payload,
            temperature=temperature,
        )
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

    async def _anthropic(
        self,
        messages: list[dict[str, str]],
        *,
        system: str | None,
        temperature: float,
    ) -> LLMResponse:
        from anthropic import AsyncAnthropic

        settings = get_settings()
        client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        resp = await client.messages.create(
            model=settings.anthropic_model,
            max_tokens=2048,
            system=system or "You are LSI-OS, an AI assistant for life sciences intelligence.",
            messages=[{"role": m["role"], "content": m["content"]} for m in messages if m["role"] != "system"],
            temperature=temperature,
        )
        content = "".join(block.text for block in resp.content if hasattr(block, "text"))
        tin = resp.usage.input_tokens if resp.usage else 0
        tout = resp.usage.output_tokens if resp.usage else 0
        return LLMResponse(
            content=content,
            model=settings.anthropic_model,
            provider="anthropic",
            tokens_in=tin,
            tokens_out=tout,
            cost_usd=(tin * 0.8 + tout * 4.0) / 1_000_000,
        )

    def _demo(self, messages: list[dict[str, str]], *, system: str | None) -> LLMResponse:
        user = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
        context = ""
        if system and "CONTEXT:" in system:
            context = system.split("CONTEXT:", 1)[-1].strip()[:1800]
        answer = (
            "**LSI-OS Demo Brain** (no LLM API key configured)\n\n"
            f"Query: {user}\n\n"
        )
        if context:
            answer += (
                "Based on retrieved knowledge and tool results:\n\n"
                f"{context}\n\n"
                "— Configure `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` for full generative answers. "
                "Retrieval, agents, and domain tools remain fully functional in demo mode."
            )
        else:
            answer += (
                "I can help with clinical trials, OpenFDA safety signals, PubMed literature, "
                "commercial analytics, regulatory readiness, and your org knowledge base. "
                "Ask a domain question or open Agent Studio to run a multi-agent job."
            )
        return LLMResponse(content=answer, model="demo-brain", provider="demo", tokens_in=len(user) // 4, tokens_out=len(answer) // 4)


llm_router = LLMRouter()


def estimate_cost(provider: str, tokens_in: int, tokens_out: int) -> float:
    rates: dict[str, tuple[float, float]] = {
        "openai": (0.15, 0.6),
        "anthropic": (0.8, 4.0),
        "demo": (0.0, 0.0),
    }
    ain, aout = rates.get(provider, (0.0, 0.0))
    return (tokens_in * ain + tokens_out * aout) / 1_000_000


PROMPT_LIBRARY: dict[str, str] = {
    "copilot": (
        "You are LSI-OS Copilot, an AI assistant for life sciences enterprises. "
        "Be precise, cite sources when provided, and flag uncertainty. "
        "Never invent trial IDs or adverse event numbers."
    ),
    "researcher": "You are a clinical research agent. Prioritize evidence quality and study design.",
    "safety": "You are a pharmacovigilance analyst. Highlight signal strength, seriousness, and next actions.",
    "regulatory": "You are a regulatory affairs specialist. Map findings to FDA/EMA guidance and submission risk.",
    "analyst": "You are a commercial analytics agent. Focus on brand performance, HCP engagement, and competitive moves.",
}
