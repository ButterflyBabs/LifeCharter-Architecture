# ADR-001: Standalone Product Boundary

**Status:** Accepted

**Date:** July 16, 2026

**Deciders:** Babs Carroll (Product Owner), Mariposa (AI Chief of Staff)

## Context

The LifeCharter ecosystem currently includes:
- LifeCharter Command Suite (business operating system)
- LifeCharter Profit Architecture (assessment tool)
- Multiple standalone assessment tools

The question was whether to integrate Profit Architecture into Command Suite or build a new standalone product.

## Decision

**LifeCharter-Architecture will be a completely standalone product** with:
- Own GitHub repository
- Own Supabase environments (separate from Command Suite)
- Own Vercel project
- No shared database tables
- No structural dependencies on other LifeCharter applications

## Rationale

1. **Data Ownership:** Client business data, assessments, and AI context must be owned by this application
2. **Product Focus:** A standalone product allows for dedicated UX, performance, and feature evolution
3. **Scalability:** Independent infrastructure allows for separate scaling and optimization
4. **Integration-Ready:** APIs and events allow future integration without tight coupling

## Consequences

**Positive:**
- Clear product boundaries
- Independent deployment cycles
- Dedicated security and compliance scope
- Focused user experience

**Negative:**
- Duplicated infrastructure costs
- Need to maintain separate environments
- Potential for data silos (mitigated by API design)

## Related Decisions

- ADR-002: Environment and Release Model
- Master Build Directive v1.0
