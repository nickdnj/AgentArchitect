# Local LLM + Agent Framework Research for Mac Mini

**Date:** 2026-02-07
**Session type:** research
**Agents involved:** Max (Personal Assistant), Web Research subagent

## Summary

Nick asked Max to research the best open source LLM for running an AI agent framework (like OpenClaw) locally on a Mac Mini. Comprehensive research was conducted covering models, inference engines, agent frameworks, benchmarks, and hardware recommendations. Nick then expressed a preference for a hybrid architecture: local LLM for management/routing and cloud models for advanced tasks.

## Key Findings

- **OpenClaw** is the leading open-source AI agent framework in 2026 (145K+ GitHub stars), with native Ollama integration
- **GLM-4.7-Flash** (9B MoE) is the #1 local model for tool calling/agent tasks on Mac Mini hardware
- **Qwen3-Coder-30B-A3B** (30B total, 3B active MoE) is the best coding-focused agent model
- MoE (Mixture of Experts) models are the game-changer for local deployment
- Memory bandwidth matters more than chip generation for LLM inference
- **Hybrid local + cloud approach is the most practical** - local for 80% of tasks, cloud for complex reasoning

## Decisions Made

- Nick wants a **hybrid architecture**: local LLM handles management/routing/simple tasks, cloud models (Claude API or OpenRouter) handle advanced reasoning
- This aligns perfectly with OpenClaw's built-in model routing capability
- **Hardware recommendation:** Mac Mini M4 Pro, 64GB RAM, 1TB — $2,399 (purchase pending)
- 64GB chosen over 48GB to run multiple models (router + task model) simultaneously

## Research Sources

- OpenClaw official site, CNBC coverage, setup guides
- Berkeley Function Calling Leaderboard (BFCL-v3)
- Apple Silicon LLM benchmarks from multiple sources
- Full source list in research cache file

## Artifacts Created

- `context-buckets/research-cache/files/2026-02-07_local-llm-mac-mini-agent-framework.md` - Full research cache report
- `outputs/local-llm-agent-framework-research.md` - Detailed research report from Web Research subagent

## Open Items

- [x] Determine which Mac Mini Nick should buy — **M4 Pro, 64GB, 1TB ($2,399)**
- [ ] Purchase the Mac Mini
- [ ] Set up OpenClaw with Ollama on the new Mac Mini
- [ ] Configure hybrid routing (local GLM-4.7-Flash + cloud Claude API)
- [ ] Pull and test models: GLM-4.7-Flash + Qwen3-Coder-30B-A3B
- [ ] Decide which messaging platforms to connect (Telegram, Discord, Slack, etc.)
- [ ] Explore multi-agent orchestration needs (CrewAI/LangGraph vs single OpenClaw agent)

## Context for Next Session

Nick wants a hybrid local/cloud AI agent setup on a Mac Mini. Recommended hardware: **Mac Mini M4 Pro, 64GB RAM, 1TB — $2,399** (purchase pending). The plan is to run GLM-4.7-Flash (routing/tool calling) and Qwen3-Coder-30B-A3B (coding) locally via Ollama, with cloud fallback to Claude API for complex reasoning. OpenClaw is the agent framework. Once Nick has the hardware, next steps are: install Ollama, pull models, install OpenClaw, configure hybrid routing, and connect messaging platforms. Full research report cached at `context-buckets/research-cache/files/2026-02-07_local-llm-mac-mini-agent-framework.md`.
