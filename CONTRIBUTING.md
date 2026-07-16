# Contributing to LifeCharter Architecture

## Development Workflow

1. Create a feature branch from `staging`: `git checkout -b feature/your-feature-name`
2. Make your changes with clear, focused commits
3. Push your branch and create a pull request to `staging`
4. Ensure all checks pass and request review from CODEOWNERS
5. After approval, your PR will be merged

## Commit Message Convention

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Build process or auxiliary tool changes

## Code Standards

- TypeScript strict mode is required
- All new code must include tests
- Follow existing code style and patterns
- Document complex logic with comments
- Ensure accessibility standards are met

## Pull Request Template

- Purpose of the change
- Screenshots (if visual)
- Migration impact
- Test evidence
- Accessibility impact
- Rollback notes (if applicable)
