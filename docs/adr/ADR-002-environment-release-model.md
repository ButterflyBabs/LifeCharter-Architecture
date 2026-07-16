# ADR-002: Environment and Release Model

**Status:** Accepted

**Date:** July 16, 2026

**Deciders:** Babs Carroll, LifeCharter Architect

## Context

LifeCharter-Architecture requires multiple environments for safe development, testing, and production deployment.

## Decision

**Four-Environment Model:**

1. **Local Development**
   - Supabase CLI for local PostgreSQL
   - Committed migrations only
   - Developer machine

2. **Development** (Shared)
   - Dedicated Supabase project
   - Integration testing
   - Shared development data

3. **Staging**
   - Production-like environment
   - Release candidates
   - Pilot verification

4. **Production**
   - Live client data
   - Approved releases only

## Branch Strategy

- `main`: Production-ready code
- `staging`: Pre-production integration
- `feature/*`, `fix/*`, `chore/*`: Short-lived working branches

## Release Flow

1. Feature branches → `staging` (via PR)
2. `staging` → `main` (via release PR)
3. Semantic versioning (v1.0.0 for first production)

## Consequences

**Positive:**
- Safe testing before production
- Reproducible deployments
- Clear rollback path

**Negative:**
- Multiple environment maintenance
- Migration coordination required

## Implementation

- Separate Supabase projects for each environment
- Separate Vercel deployments
- Environment-specific secrets
- Automated CI/CD pipeline
