# Security Policy

Thank you for helping us keep Node Orchestrator safe for everyone. This document explains how to report vulnerabilities and how we handle security fixes.

## Supported Versions

We currently provide security fixes for:

- **2.0.x** – actively supported
- **1.x** – best-effort only; please upgrade to the latest 2.0 release

## Reporting a Vulnerability

1. **Do not file public issues for security problems.**
2. Contact the maintainers privately:
   - Email: `security@universal-orchestrator.example` (PGP-friendly)
   - GitHub Security Advisory: [https://github.com/greenbynox/universal-orchestrator-node/security/advisories/new](https://github.com/greenbynox/universal-orchestrator-node/security/advisories/new)
3. Include details so we can reproduce:
   - Affected version and platform (OS, architecture)
   - Steps to reproduce and minimal proof-of-concept
   - Expected vs. actual behavior
   - Impact assessment (confidentiality/integrity/availability)
4. If possible, share mitigation ideas or a suggested patch.

We aim to acknowledge reports within **72 hours** and provide a timeline for remediation or a workaround. Coordinated disclosure timelines are welcome; we will keep you updated on progress.

## Security Best Practices for Users

- **Secrets:** set `JWT_SECRET` and `ENCRYPTION_KEY` in production; never commit them.
- **Docker socket:** run the orchestrator with a restricted Docker context; avoid exposing the Docker socket over TCP.
- **Network:** keep RPC/P2P ports behind a firewall; only expose what you need.
- **Least privilege:** run the app under a non-root user when possible.
- **Updates:** apply the latest releases to benefit from security patches.
- **Backups:** store encrypted backups of wallets and configuration files offline.

## Security Hardening in the Codebase

- Whitelisted Docker images and strict pattern checks
- Input sanitization and path traversal protection
- Port validation with reserved-port blocking
- Log redaction for secrets and IP addresses
- Templates constrained to the local repository directory

If you discover any weakness in these controls, please reach out. We appreciate responsible disclosure and will credit researchers upon request.
