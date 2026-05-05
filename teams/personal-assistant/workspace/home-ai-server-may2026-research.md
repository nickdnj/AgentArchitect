# Home AI Server — M3 MacBook Air Research
**May 2026 revisit of Local AI Gatekeeper project**

---

## 1. Local LLMs on M3 MacBook Air 16GB (May 2026)

### The landscape shift since February

Three months has been a long time. The Qwen 3 family, Gemma 4 edge models, and Llama 4 Scout have all shipped. More importantly, Ollama 0.19 shipped an MLX backend on March 31, 2026 — with a critical caveat for your hardware (see below).

### MLX backend: the fine print for 16GB

Ollama 0.19's MLX backend requires **32GB+ unified memory**. On a 16GB M3 Air, it will not activate. You stay on llama.cpp. That said, standard Ollama on Apple Silicon still uses Metal via llama.cpp and is quite capable. The 93% speedup headline only applies to 32GB+ machines.

If you want MLX performance on 16GB, you need to run MLX directly (via `mlx-lm` Python package) — more setup, but possible. LM Studio's MLX backend has the same 32GB gating.

### Runtime recommendation for 16GB M3 Air

**Keep Ollama** (0.19+). It's the right tool — OpenAI-compatible API, always-on daemon, good model library. Install `mlx-lm` separately and benchmark a model or two if you want to experiment. Don't switch to LM Studio (GUI-centric, worse for programmatic use).

### Model recommendations

#### For routing / classification (small, fast, cheap)

These run in 2-4GB leaving headroom for other processes:

| Model | RAM (Q4) | Speed est. M3 | Tool calls | Notes |
|-------|----------|----------------|------------|-------|
| **Phi-4 Mini** (3.8B) | ~2.5GB | ~80-100 tok/s | Yes (native 16K ctx) | Best latency; 2x faster than Gemma 3 4B |
| **Gemma 4 E2B** | ~1.5GB | ~130+ tok/s | Yes (function calling built-in) | Smallest capable tool-caller |
| Qwen 3 1.7B | ~1.2GB | ~150 tok/s | Yes | Smallest Qwen with tool use |

**Pick: Phi-4 Mini for routing.** It's purpose-built for edge inference, natively supports function calling, handles classification reliably, and leaves 12+ GB free for the responding model and system RAM.

#### For responding (general chat + tool use)

This is where February's GLM-4 9B gap gets filled:

| Model | RAM (Q4_K_M) | Speed est. M3 | Tool calls | Notes |
|-------|--------------|----------------|------------|-------|
| **Qwen 3 8B** | ~5.5GB | ~45-60 tok/s | Yes (Hermes-style) | Best 8B tool caller in class; beats models 3x its size on reasoning |
| **Qwen 3.5 9B** | ~6.6GB | ~40-55 tok/s | Yes | Successor to Qwen 3 8B; /think mode for CoT |
| Gemma 4 E4B | ~3.2GB | ~90 tok/s | Yes | Smaller but surprisingly capable; good backup |
| Llama 4 Scout (8B) | ~5.8GB | ~40-50 tok/s | Yes | Meta's 2026 entry; competitive but not clearly better than Qwen |
| Mistral Small 3.5 | ~6.0GB | ~40-50 tok/s | Yes | Strong tool use; European privacy-first option |

**Pick: Qwen 3.5 9B as the primary responder.** It's the direct successor to what you were trying to accomplish with GLM-4. The tool-calling has been fixed across Ollama and llama.cpp. Use Q4_K_M quantization for the best quality/RAM tradeoff.

With Phi-4 Mini (~2.5GB) + Qwen 3.5 9B (~6.6GB) loaded, you're at ~9GB model memory — fits comfortably on 16GB with OS overhead.

**GLM-4 successor note:** GLM-5 exists but remains a Chinese-market model. The Qwen 3.x family has decisively won the open-weight race in this size class for English + tool use.

---

## 2. Orchestration Patterns: Local + Cloud Hybrid

### The dominant 2026 pattern: LiteLLM proxy

The standard architecture that's emerged is: **LiteLLM as a unified gateway** in front of both Ollama (local) and Claude API (cloud). Your app talks to one OpenAI-compatible endpoint. LiteLLM handles routing, fallback chains, and budget caps.

```yaml
# litellm config (simplified)
model_list:
  - model_name: fast-local
    litellm_params:
      model: ollama/phi4-mini
      api_base: http://localhost:11434
  - model_name: strong-local
    litellm_params:
      model: ollama/qwen3.5:9b
      api_base: http://localhost:11434
  - model_name: cloud-strong
    litellm_params:
      model: claude-sonnet-4-6
      api_key: os.environ/ANTHROPIC_API_KEY

context_window_fallbacks:
  fast-local: ["strong-local"]
  strong-local: ["cloud-strong"]
```

You implement a complexity scorer (token count + task type + keyword signals) that selects the tier. 80-90% of requests never leave your machine.

### Anthropic Agent SDK

The Claude Agent SDK (Python and npm packages exist as of 2026) is designed to orchestrate Claude Code's capabilities programmatically — file editing, code execution, multi-step agentic workflows. It is **not** designed as a local/cloud router. It's Claude-centric. You'd use it to dispatch hard work TO Claude Code, not to manage the local↔cloud decision itself.

For your use case: use LiteLLM for routing, use the Anthropic SDK (or `claude -p` subprocess as you have now) for cloud delegation. The Agent SDK adds value if you want to script multi-step Claude Code tasks, not for the routing layer.

### Claude Code as a daemon/server

Claude Code cannot currently run as a persistent HTTP server accepting arbitrary requests. It's a CLI tool. However:

- It supports MCP servers — you can expose local tools to Claude via MCP, and it picks them up at session start
- `claude-peers-mcp` enables multiple Claude Code instances on the same machine to discover each other and message via a local broker (localhost:7899, SQLite, HTTP)
- The cleanest pattern in 2026: Claude Code as the **cloud dispatch target**, invoked via subprocess (`claude -p`) or MCP, not as a daemon

Your existing `claude -p` subprocess approach is architecturally correct. The addition of a proper MCP server layer (vs. ad hoc tool calls) is the main upgrade worth making.

### Framework landscape

| Framework | Best for | Local model support |
|-----------|----------|---------------------|
| **LiteLLM** | Routing gateway, unified API, fallbacks | Yes (Ollama) |
| **Pydantic AI** | Type-safe agents, stable production code | Yes (Ollama via OpenAI compat) |
| **LangGraph** | Complex multi-step stateful graphs | Yes, but heavy |
| LlamaIndex Workflows | Event-driven async pipelines | Yes |
| Letta | Long-term memory, persistent agents | Mature but niche |

**Recommendation:** LiteLLM for the proxy layer + Pydantic AI for agent logic. Pydantic AI has the cleanest Python ergonomics and supports Ollama natively. Skip LangGraph unless your routing logic becomes genuinely graph-complex.

---

## 3. Frontends: Alternatives to Telegram Bot

### Claude Code CLI (your existing daily driver)

The most underrated option. You already use it constantly. For structured home automation commands and hard delegation tasks, typed input to Claude Code is often faster and more capable than a Telegram bot. Not ideal for quick mobile queries.

### Open WebUI

- Single Docker command against Ollama, ChatGPT-like interface
- 124K+ GitHub stars, actively maintained
- Best for: quick ad hoc chat with local models from any browser
- **No native iPhone app** — web-only, but mobile browser works fine
- MCP support: not native (unlike LibreChat)

### LibreChat

- Multi-provider (Ollama + Claude + OpenAI + Gemini all in one)
- **Native MCP support** — compatible tool servers just work
- More complex setup (MongoDB + Docker Compose)
- Best for: if you want one UI that covers both local and cloud, with tools

### Voice: Kokoro TTS + Whisper STT

You're already using this in voice mode. The local pipeline for a home server would be:

- **Whisper** (via faster-whisper or whisper.cpp): STT, runs locally, M3 handles it well
- **Kokoro TTS**: fast, good quality, local
- Wire these as MCP tools or subprocess calls from your existing stack

This is the path to voice-native home server interaction without building a dedicated voice assistant.

### Mobile (iPhone → home server)

No major new iPhone-native app has emerged for this use case in 2026. Options:
- **Open WebUI** in Safari via Tailscale — your UCG Ultra subnet router means you can reach home services remotely without a VPN app open
- **Telegram bot** — your existing frontend actually works well here; keep it
- **Shortcuts + webhook** — iOS Shortcuts can POST to a local HTTP endpoint, enabling Siri-triggered automations

The Telegram bot is not as bad as it feels. Its strength is push notifications and mobile access. The weakness was the model behind it, not the transport.

---

## 4. Recommendation: What Should Nick Actually Do?

### The verdict: Evolve, don't rebuild

The custom scaffolding was the right instinct in February. The problem was the model (GLM-4 9B) wasn't capable enough for the routing/responding job. The architecture was sound.

**Do NOT abandon the custom scaffolding and go pure Claude Code.** Claude Code is expensive for trivial queries and is not designed as an always-on home AI daemon. Using it for every "what's the weather" or "set a timer" invocation will waste tokens and add latency.

### Recommended architecture (May 2026)

```
iPhone / Voice / Browser
         |
    [Telegram Bot frontend — keep it]
         |
    [LiteLLM proxy — NEW]
    /           \
[Phi-4 Mini]  [Qwen 3.5 9B]   ← local, fast, free
  (routing)   (responding)
                  |
         [Claude Code / claude -p]  ← cloud, expensive, reserved for hard work
         [Home Assistant MCP]       ← Phase 0.3 target
```

**Step-by-step upgrade path:**

1. **Swap the model first** — Drop GLM-4 9B, pull Qwen 3.5 9B via Ollama. Test your existing two-pass classifier. This alone will feel like a different product.
2. **Add Phi-4 Mini as fast-path router** — Route classification/IDLE/simple HOME calls through Phi-4 Mini. Send RESPOND/DELEGATE to Qwen 3.5 9B. Total latency on fast-path: ~1-2 seconds.
3. **Replace the custom dispatcher with LiteLLM** — Drop the bespoke Python routing logic. LiteLLM handles fallbacks, budget caps, and provider switching. Your Python code shrinks significantly.
4. **Wrap Home Assistant as an MCP server** — Phase 0.3 target. Expose HA REST API as MCP tools so both local models and Claude Code can invoke home devices via standard tool calls.
5. **Keep Telegram** — Add Open WebUI as a secondary browser-based frontend for when you're at a keyboard.

The custom Python scaffolding reduces to: a Telegram handler → LiteLLM proxy call → result. The classifier, dispatcher, and fallback logic move into LiteLLM config. You go from ~500 lines of Python to ~100.

---

## Sources

- [Best Local LLMs for Apple Silicon 2026 — InsiderLLM](https://insiderllm.com/guides/best-local-llms-mac-2026/)
- [Open-Source LLM Landscape 2026: DeepSeek V4 vs Llama 4 vs Qwen 3.5 vs Gemma 4 — Codersera](https://codersera.com/blog/open-source-llms-landscape-2026/)
- [Apple Silicon LLM Benchmarks — llmcheck.net](https://llmcheck.net/benchmarks)
- [Ollama 0.19 Ships MLX Backend — Medium](https://medium.com/@tentenco/ollama-0-19-ships-mlx-backend-for-apple-silicon-local-ai-inference-gets-a-real-speed-bump-878b4928f680)
- [Ollama MLX Preview — Ollama Blog](https://ollama.com/blog/mlx)
- [Ollama MLX: How to Enable Faster Inference on Apple Silicon — Serverman](https://www.serverman.co.uk/ai/ollama/ollama-mlx-apple-silicon/)
- [2026 Mac Local Inference Stack: Ollama vs LM Studio vs MLX Decision Matrix — MACGPU](https://macgpu.com/en/blog/2026-mac-ollama-lm-studio-mlx-stack-decision-remote-offload.html)
- [The Hybrid AI Architecture: Route Local + Cloud — LocalAI Master](https://localaimaster.com/blog/hybrid-local-cloud-ai)
- [Hybrid Cloud-Local LLM: The Complete Architecture Guide — SitePoint](https://www.sitepoint.com/hybrid-cloudlocal-llm-the-complete-architecture-guide-2026/)
- [Run Claude Code with Local Agents using LiteLLM and Ollama — Medium](https://medium.com/@kamilmatejuk/run-claude-code-with-local-agents-using-litellm-and-ollama-ab88869cbd00)
- [Best Small AI Models to Run with Ollama 2026 — LocalAI Master](https://localaimaster.com/blog/small-language-models-guide-2026)
- [Small Language Models: Phi-4 vs Gemma 3 vs Llama 3.3 — Meta Intelligence](https://www.meta-intelligence.tech/en/insight-slm-enterprise)
- [Qwen3 Function Calling — Qwen Docs](https://qwen.readthedocs.io/en/latest/framework/function_call.html)
- [Qwen-Agent GitHub (MCP + Function Calling framework)](https://github.com/QwenLM/Qwen-Agent)
- [The 2026 AI Agent Framework Decision Guide — DEV Community](https://dev.to/linou518/the-2026-ai-agent-framework-decision-guide-langgraph-vs-crewai-vs-pydantic-ai-b2h)
- [Open WebUI vs AnythingLLM vs LibreChat 2026 — ToolHalla](https://toolhalla.ai/blog/open-webui-vs-anythingllm-vs-librechat-2026)
- [Claude Code MCP Server Setup — ksred.com](https://www.ksred.com/claude-code-as-an-mcp-server-an-interesting-capability-worth-understanding/)
- [MCP Server Ecosystem 2026 — Codeongrass](https://codeongrass.com/blog/mcp-server-ecosystem-integration-layer-ai-agents-2026/)

---

## TL;DR (voice-readable)

- **The model was the problem, not the architecture.** Drop GLM-4 9B, swap in Qwen 3.5 9B as the responder and Phi-4 Mini as the fast router — the capability gap that made the gatekeeper feel broken in February is now closed.
- **Replace custom routing Python with LiteLLM proxy.** It handles local-to-cloud fallback, budget caps, and provider switching in config rather than code — your dispatcher shrinks from hundreds of lines to a YAML file.
- **Keep Telegram, add Phase 0.3 Home Assistant as MCP tools.** The Telegram frontend and `claude -p` subprocess delegation are still the right pattern; the missing piece is Home Assistant as a proper MCP server so both local models and Claude can call home devices without bespoke glue code.
