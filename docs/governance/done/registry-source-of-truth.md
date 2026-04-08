# EXECUTION BRIEF — REGISTRY.md as Single Source of Truth for Stages

**Date:** 2026-04-07 | **To:** Code CLI (lc-bigclaw) | **Priority:** P0
**Status:** MANDATORY — Read and follow permanently. Not a one-time task.
**Master copy:** ~/Projects/bigclaw-ai/docs/specs/registry-single-source-of-truth.md

Read the master copy. These are permanent rules for all sessions:
1. REGISTRY.md is the ONLY source of truth for product stages
2. Update REGISTRY.md Stage + Evidence columns after ANY stage-advancing work
3. Dashboard reads stages from REGISTRY.md — do NOT hardcode stages in page.tsx files
4. lc-bigclaw aggregates the dashboard view but does NOT report product-level status in session reports

After reading: update dashboard data sources to read from REGISTRY.md. Move this spec to done/.
