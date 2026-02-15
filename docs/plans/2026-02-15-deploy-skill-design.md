# /deploy Skill Design

**Goal:** A user-invocable Claude Code skill that orchestrates a 7-stage deployment pipeline — git check, test setup, TDD validation, design audit, QA smoke tests, build, and deploy commit.

**Approach:** "The Pipeline" — single SKILL.md with strict sequential stages, auto-fix on failure (max 2 retries via /systematic-debugging), fully automated.

**Date:** 2026-02-15

---

## Pipeline Stages

### Stage 1: Git Check
- Run `git status` to identify uncommitted/unstaged changes
- If changes exist: stage all modified/new files, create descriptive commit
- If clean: proceed
- Verify current branch and remote tracking

### Stage 2: Test Setup
- Check if Vitest is installed (`npx vitest --version`)
- If not: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`
- Add `vitest.config.ts` if missing (React + jsdom)
- Add `"test"` script to package.json if missing
- Scaffold basic test files if none exist:
  - `tests/server/routes.test.ts` — API endpoint smoke tests
  - `tests/shared/schema.test.ts` — schema validation tests

### Stage 3: TDD Validation
- Run `npx vitest run` (full suite, no watch mode)
- Run `npx tsc --noEmit` (TypeScript check)
- **On failure**: invoke systematic debugging, apply fix, retry (max 2)
- **Pass gate**: 0 test failures + 0 TypeScript errors

### Stage 4: Design Audit
- **CSS audit**: Scan `.tsx` and `.css` for violations:
  - Banned fonts used directly (Inter, Roboto, Arial, system-ui)
  - Raw hex colors instead of CSS variable tokens
  - Missing font-display/font-body/font-mono usage
  - Inline styles bypassing design system
- **Visual snapshots**: Build client, serve, capture key page screenshots
- Report violations with file:line references
- **On failure**: auto-fix obvious violations, retry

### Stage 5: QA Smoke Tests
- Start dev server (`npm run dev` in background)
- Wait for server ready (poll http://localhost:5000)
- Hit key API endpoints:
  - `GET /api/agents` — 200, returns array
  - `GET /api/agents/:id` — 200, returns agent
  - `POST /api/agents` — 201, creates agent
  - `GET /api/agents/:id/export` — 200, returns zip
  - `GET /api/skills` — 200, returns array
  - `GET /api/commands` — 200, returns array
- Kill dev server
- **On failure**: debug, fix, retry

### Stage 6: Build
- Run `npm run build`
- Verify `dist/` output exists with expected files
- **On failure**: debug build errors, retry

### Stage 7: Deploy Commit
- Stage all changes (build output, test files, fixes)
- Commit: `deploy: verified build [timestamp]`
- Push to remote (auto-push hook handles this)
- Report final status with stage summary

## Failure & Retry Logic

```
For each stage:
  attempt = 0
  while attempt < 3:
    run stage
    if pass: break
    attempt += 1
    if attempt < 3:
      invoke /systematic-debugging with error context
      apply fixes
    else:
      HALT pipeline, report failure with full context
```

## Skill Metadata

```yaml
name: deploy
description: Use when ready to deploy — orchestrates git check, tests, design audit, QA smoke tests, build, and commit
user-invocable: true
argument-hint: "[--skip-tests] [--skip-qa]"
```

## File Location

`.claude/skills/deploy/SKILL.md`

## Decisions Made

| Question | Answer |
|----------|--------|
| Test strategy | Install & scaffold Vitest on first run |
| QA scope | Automated smoke tests (spin up server, hit endpoints) |
| Design check | CSS audit script + visual snapshots |
| Failure mode | Auto-fix & retry (up to 2 retries via /systematic-debugging) |
| Approach | Single SKILL.md pipeline (not modular, not config-driven) |
