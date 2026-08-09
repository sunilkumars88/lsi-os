# SOC 2 Readiness (Stub)

EIOS is designed for SOC 2 Type II alignment. This document is a stub for enterprise security reviews.

## Control areas

- **Access control:** RBAC, JWT auth, tenant isolation, SSO-ready (OAuth)
- **Audit logging:** Decorator-based audit trail on platform API actions
- **Change management:** Git-based CI via `.github/workflows/ci.yml`
- **Encryption:** TLS in transit; secrets via environment variables (BYOK for LLM keys)
- **Availability:** Docker Compose health checks; Vercel for web SLA

## Evidence to collect

- Access review logs from `audit_log` entity
- Connector sync records from `connector_sync` entity
- Approval workflow history
- Penetration test report (external)
- Vendor subprocessors list (OpenAI, cloud host, Vercel)

## Status

**Partial** — platform primitives exist; formal SOC 2 audit **Needs account** (external auditor + policy pack).
