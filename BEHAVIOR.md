# Agent Behavior & Safety Policies

## Execution & Command Restrictions
- NEVER run `rm -rf` or destructive disk operations without explicit human confirmation.
- Force all terminal executions to request user confirmation rather than auto-executing.
- If a package installation fails, stop and ask the user; do not attempt blind version downgrades.

## Security Constraints
- DO NOT hardcode API keys, passwords, or tokens. Use `process.env` or `os.environ`.
- Immediately flag any `.env` or credential files that are accidentally left untracked by `.gitignore`.

## Scope Safety
- Do not perform broad refactors across multiple folders unless specifically asked.
- In case of conflicting task instructions, this behavior document overrides all other instruction files.
