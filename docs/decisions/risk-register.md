# Risk Register

## High Risks

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
|----|------|------------|--------|------------|-------|
| R001 | Cross-tenant data exposure | Low | Critical | RLS on all tables, automated testing | LifeCharter Architect |
| R002 | Assessment data loss | Low | High | Autosave, versioning, backups | Supabase Data Architect |
| R003 | AI cost overruns | Medium | Medium | Rate limits, usage monitoring, budget alerts | LifeCharter Architect |

## Medium Risks

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
|----|------|------------|--------|------------|-------|
| R004 | Visual fidelity gaps | Medium | Medium | Screenshots, design reviews, visual regression | UI Lead |
| R005 | Scope creep | High | Medium | Strict backlog, approval gates, ADR process | Mariposa |
| R006 | Integration complexity | Medium | Medium | Clear APIs, adapter pattern, documentation | LifeCharter Architect |

## Low Risks

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
|----|------|------------|--------|------------|-------|
| R007 | Performance issues | Low | Medium | Optimization, monitoring, caching | LifeCharter Architect |
