# GDPR Compliance (Stub)

EIOS supports GDPR-oriented data handling for EU customers. This document is a stub for legal review.

## Principles

- **Lawful basis:** Customer contract / legitimate interest for B2B enterprise use
- **Data minimization:** Tenant-scoped storage; no cross-tenant training
- **Data rights:** Data Rights Registry (GREEN / BLUE / YELLOW / RED zones)
- **Retention:** Configurable per tenant; audit logs retained per policy
- **Subprocessors:** Document OpenAI, hosting provider, Vercel when web is deployed there

## Data subject rights

| Right | EIOS capability |
|-------|-----------------|
| Access | Export via admin / data-rights modules |
| Rectification | Document and profile update APIs |
| Erasure | Tenant-scoped delete workflows (Partial) |
| Restriction | RED zone blocks retrieval and agent use |
| Portability | Document export (Partial) |

## Status

**Partial** — data rights registry and tenant isolation implemented; formal DPA and EU hosting **Needs account**.
