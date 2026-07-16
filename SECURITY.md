# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

Please report security vulnerabilities to: security@sacredkaleidoscope.community

## Security Practices

- All database access uses Row Level Security (RLS)
- Service-role keys are never exposed client-side
- Environment variables are properly secured
- Regular dependency updates
- Security testing is part of CI/CD pipeline
