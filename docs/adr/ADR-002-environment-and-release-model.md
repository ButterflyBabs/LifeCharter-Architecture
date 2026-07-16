# ADR-002: Environment and Release Model

## Status
Accepted

## Context
The application requires multiple environments for safe development, testing, and production deployment.

## Decision
We will maintain four distinct environments:

1. **Local**: Developer machines using Supabase CLI
2. **Development**: Shared development environment for integration testing
3. **Staging**: Pre-production for release candidates and pilot testing
4. **Production**: Live client-facing application

### Branch Strategy
- `main`: Production-ready code only
- `staging`: Integrated pre-production branch
- `feature/*`, `fix/*`, `chore/*`: Short-lived working branches

### Release Flow
1. Feature branches merge to `staging` via PR
2. `staging` deploys to Staging environment automatically
3. Release PRs merge `staging` to `main`
4. `main` deploys to Production

## Consequences

### Positive
- Clear separation of environments
- Safe testing before production
- Rollback capability
- Parallel development support

### Negative
- Environment maintenance overhead
- Database migration coordination required

## Related Decisions
- ADR-001: Standalone Product Boundary
