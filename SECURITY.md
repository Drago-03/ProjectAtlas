# Security Policy

## Supported Versions

The project follows a simple minor-based support policy:

* Current minor (latest published 0.2.x) – Full support (features, security, critical bug fixes).
* Previous minor (0.1.x) – Security fixes only for 30 days after the first 0.2.x release, then End-of-life (EOL).
* Older / unsupported versions – No fixes; please upgrade.

### Version Status Matrix

| Version  | Release Date | Status        | Support Ends        | Notes |
|----------|--------------|---------------|---------------------|-------|
| 0.2.5    | 2025-01-14   | Supported     | When 0.3.0 releases | Latest with comprehensive UI enhancements and modern features |
| 0.2.4    | 2025-08-14   | Superseded    | 2025-02-13 (30 days after 0.2.5) | Upgrade to 0.2.5 for enhanced features |
| 0.2.3    | 2025-08-13   | Superseded    | 2025-02-13 (30 days after 0.2.5) | Upgrade to 0.2.5 |
| 0.2.2    | 2025-08-13   | Superseded    | 2025-02-13 (30 days after 0.2.5) | Upgrade to 0.2.5 |
| 0.2.1    | 2025-08-13   | Superseded    | 2025-02-13 (30 days after 0.2.5) | Upgrade to 0.2.5 |
| 0.2.0 (<0.2.1) | (n/a)  | Not released | n/a                 | Patch numbers prior to 0.2.1 were not published |
| 0.1.1    | 2025-08-13   | EOL           | 2025-09-12 (30 days after 0.2.2) | Last 0.1 patch; no further fixes after date |
| 0.1.0    | 2025-08-13   | EOL           | 2025-08-13          | Superseded same day by 0.1.1 |

Future versions will be appended with their lifecycle as they are released.

### Support Policy Summary

| Category      | Response Target                    |
|---------------|------------------------------------|
| Critical (RCE, data loss) | Patch or mitigation within 7 days |
| High (privilege escalation, widespread breakage) | Patch within 14 days |
| Moderate (DoS, information disclosure) | Patch in next minor/patch (≤30 days) |
| Low (non-exploitable, hard-to-abuse) | Discretionary / next scheduled release |

If a fix cannot meet the target window, an advisory with recommended mitigations will be published.

### Upgrade Guidance

Always upgrade to the latest patch of the current minor. Skipping minors is supported (0.1.x → 0.2.x) as breaking changes will be documented in the changelog if introduced.

## Reporting a Vulnerability

Open a private security advisory or email the maintainer (see repository profile). Provide:

1. Affected version(s)
2. Reproduction steps
3. Potential impact / severity assessment
4. Suggested fix (if known)

Please allow up to 72 hours for initial response.

## Disclosure

We aim to release a patch within 14 days for high severity issues. Public disclosure will occur after a fix is available.
