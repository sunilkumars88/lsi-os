"""OpenAI-only LLM router with demo-brain fallback (no Anthropic)."""

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
        if settings.llm_provider == "demo":
            return "demo"
        if settings.openai_api_key:
            return "openai"
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
        context = ""
        if system and "CONTEXT:" in system:
            context = system.split("CONTEXT:", 1)[-1].strip()[:1800]
        answer = f"**EIOS Demo Brain** (OpenAI key missing or rejected)\n\nQuery: {user}\n\n"
        if context:
            answer += (
                "Based on retrieved knowledge and tool results:\n\n"
                f"{context}\n\n"
                "— Set a valid `OPENAI_API_KEY` for full generative answers. "
                "Retrieval, agents, and domain tools remain functional in demo mode."
            )
        else:
            answer += (
                "Ask about clinical trials, safety signals, loans, claims, or enterprise knowledge. "
                "Pack agents and workflows still execute with tool grounding."
            )
        return LLMResponse(
            content=answer,
            model="demo-brain",
            provider="demo",
            tokens_in=len(user) // 4,
            tokens_out=len(answer) // 4,
        )


llm_router = LLMRouter()


def estimate_cost(provider: str, tokens_in: int, tokens_out: int) -> float:
    rates: dict[str, tuple[float, float]] = {
        "openai": (0.15, 0.6),
        "demo": (0.0, 0.0),
    }
    ain, aout = rates.get(provider, (0.0, 0.0))
    return (tokens_in * ain + tokens_out * aout) / 1_000_000


PROMPT_LIBRARY: dict[str, str] = {
    "copilot": (
        "You are EIOS Copilot, an enterprise intelligence assistant. "
        "Be precise, cite sources when provided, and flag uncertainty. "
        "Never invent IDs, counts, or regulatory claims."
    ),
    "researcher": "You are a clinical research agent. Prioritize evidence quality and study design.",
    "safety": "You are a pharmacovigilance analyst. Highlight signal strength, seriousness, and next actions.",
    "regulatory": "You are a regulatory affairs specialist. Map findings to FDA/EMA/CDSCO guidance.",
    "analyst": "You are a commercial analytics agent. Focus on brand performance and competitive moves.",
    "trial_coordinator": "You are a clinical trial coordinator. Focus on eligibility, recruitment, and visit scheduling.",
    "loan_originator": "You are a banking loan origination agent. Score risk, KYC, and recommend approve/reject with reasons.",
    "claims_triage": "You are an insurance claims triage agent. Classify FNOL severity and next actions.",
    "fraud_detector": "You are a fraud detection agent. Flag anomalies and recommend investigations.",
    "aml_compliance": "You are an AML/KYC compliance agent. Screen PEP/sanctions risk and STR needs.",
}
