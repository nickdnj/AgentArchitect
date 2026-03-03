# Gatekeeper: Dynamic Model Escalation + Local File Tools

**Date:** 2026-03-03
**Session type:** execution
**Agents involved:** Direct implementation (no team orchestrator)

## Summary

Implemented two features in the local-ai-gatekeeper Telegram bot: (1) dynamic model escalation where gpt-4o-mini handles cheap routing/triage but gpt-4o handles direct conversational responses, and (2) local file tools (list_directory, read_file, search_files) so the chat model can inspect the max-assistant workspace to report on project status.

## Key Findings

- Gatekeeper codebase lives at `/Users/nickdemarco/Workspaces/local-ai-gatekeeper/`
- The dispatcher already had a clean routing/direct-response split in `_parse_and_route()` that made the escalation pattern straightforward
- All 34 existing tests pass after the changes with no modifications needed

## Decisions Made

- Mini stays as the routing model (cheap triage) — only fires gpt-4o for actual conversations
- Escalation extracted into `_escalate_response()` shared by both normal dispatch and forced `Intent.RESPOND`
- File tools sandboxed to `delegation.working_directory` (max-assistant dir) via path resolution check
- `chat_model: null` preserves single-model fallback behavior

## Artifacts Created

- **New file:** `src/tools/file_tools.py` — TOOL_DEFINITIONS + FileToolExecutor with path sandboxing
- **Modified:** `src/utils/config.py` — added `chat_model`, `chat_max_tokens` to OpenAIConfig
- **Modified:** `src/clients/openai.py` — added model/max_tokens overrides to `chat()`, new `chat_with_tools()` method
- **Modified:** `src/core/dispatcher.py` — `_was_routed()`, `_escalate_response()`, FileToolExecutor init
- **Modified:** `config/config.yaml` — set `chat_model: gpt-4o`, `chat_max_tokens: 4096`
- **Modified:** `config/prompts/system.txt` — added file tools awareness paragraph

## Open Items

- [ ] Restart gatekeeper: `launchctl kickstart -k gui/$(id -u)/com.nickdemarco.gatekeeper`
- [ ] Test routing unchanged: "make me a video" → delegate, no escalation
- [ ] Test conversation escalation: "what's the capital of France?" → escalating_to_chat_model in logs
- [ ] Test file tool usage: "how's the video project going?" → list_directory + read_file calls
- [ ] Test path sandboxing: ensure model can't read outside working_directory

## Context for Next Session

All code changes are complete and tests pass. The gatekeeper needs a restart to pick up the changes. The flow is: mini routes → if direct response → re-call with gpt-4o + file tools → tool loop → final response. If `chat_model` is set to null in config, single-model behavior is preserved. Monitor logs with `tail -f logs/gatekeeper-error.log | grep -E "escalating|tool_call|openai_usage"`.
