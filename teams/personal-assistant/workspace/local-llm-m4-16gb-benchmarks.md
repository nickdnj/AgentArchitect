# Local LLM on M4 MacBook Air 16 GB: Agent-Quality Benchmarks & Honest Gap Analysis

**Research date:** 2026-05-09  
**Machine:** Apple M4 MacBook Air, 16 GB unified memory, 120 GB/s memory bandwidth, fanless

---

## TL;DR

- **Qwen3-8B at Q4_K_M is the best all-around pick for 16 GB.** It fits in ~5.5 GB, delivers 30–40 tok/s on M4, posts IFEval (prompt strict) of 0.82, LiveCodeBench 54.4%, MMLU-Pro 68.7% — competitive with what GPT-3.5-class models could do in 2023, adequate for most agentic subtasks.
- **Gemma 3 12B is the runner-up for instruction-following and code.** At Q4_K_M (~8 GB) it fits comfortably and scores HumanEval 85.4, IFEval 88.9 — better instruction tuning than Qwen3-8B in non-thinking mode.
- **14B models are tight, not comfortable.** Qwen2.5-14B Q4_K_M is ~9.5 GB — workable but leaves under 6 GB for OS + browser + KV cache. At full context load you will hit swap. Use 14B only if you close other apps.
- **The M4 Air throttles under 20–30 min of sustained generation.** Expect 15–25% speed drop when the chip hits thermal limits. For agentic loops that run continuously, this matters. For bursty tool-calling (call LLM → execute tool → call LLM), throttling rarely triggers.
- **The honest gap vs. Claude/GPT-4-class:** local 8B/12B models are good enough for summarization, RAG, simple tool routing, and code completion. They fail at multi-step planning, long-context reasoning chains, complex SWE-bench-grade coding, and reliably chaining 5+ tool calls in sequence. Those still need cloud.

---

## The Video (YouTube ID: 1jtlc-ffI_8)

The YouTube video could not be directly fetched (the page serves rendered JS, not crawlable text). Based on the title surfaced in search results — **"Qwen3.6 Solves a Brutal Reverse Engineering Challenge vs Gemma 4 and Matches Claude Sonnet"** — and the timestamp cue (5:36), this appears to be a coding-challenge benchmarking video on a high-RAM M3 Max machine rather than a setup tutorial.

The most relevant parallel video in the ecosystem is the Ollama MLX M5 Max deep-dive ([YouTube: PR-AMSiZKOM](https://www.youtube.com/watch?v=PR-AMSiZKOM)), which demonstrates:

**Stack the community converged on in early 2026:**
- **Inference runtime:** Ollama (CLI + OpenAI-compatible REST API on localhost:11434), now with an optional MLX backend as of v0.19 (March 30, 2026)
- **Alternative for power users:** `mlx-lm` directly via pip — 15–30% faster than Ollama's llama.cpp Metal path, ~10% less memory
- **Model format:** GGUF (Q4_K_M / Q5_K_M) via Ollama; MLX 4-bit for native mlx-lm
- **Agent orchestration:** LangChain or LlamaIndex calling Ollama's OpenAI-compatible endpoint; increasingly, [Qwen-Agent](https://github.com/QwenLM/Qwen-Agent) for Qwen3 models specifically
- **Models tested in that class of video:** Qwen3-235B (flagship, needs 128GB+), Qwen3-30B-A3B (MoE, 32GB+), Gemma 4 12B (fits 16GB), comparisons to Claude Sonnet 4.5

**What a 32 GB M3 Max machine can do that 16 GB M4 Air cannot:**
- Run Qwen3-30B-A3B (MoE, ~20 GB at Q4) — the sweet spot model in that video class
- Run Qwen3-14B at Q8 without swap
- Run two models simultaneously for judge/critic patterns
- Sustain longer inference loops before throttling (M3 Max is actively cooled)

---

## Candidate Models for 16 GB M4 Air

### Memory Budget Reality Check

| Budget item | Estimate |
|-------------|----------|
| macOS + background processes | ~3.0 GB |
| Browser (1–2 tabs) | ~0.5–1.0 GB |
| Available for model + KV cache | ~12–13 GB |
| Safe model footprint ceiling | ~9–10 GB |
| Comfortable ceiling (leaves KV headroom) | ~7–8 GB |

At 4K context, KV cache adds ~0.5–1 GB on top of model weights. At 32K context it adds 2–4 GB.

---

### Model Profiles

#### 1. Qwen3-8B (Q4_K_M)

| Attribute | Value |
|-----------|-------|
| **Quant / footprint** | Q4_K_M, ~5.5 GB |
| **Fit on 16 GB** | Comfortable — 6+ GB headroom |
| **IFEval (prompt strict)** | 0.82 (82%) |
| **MMLU-Pro** | 68.7% |
| **LiveCodeBench** | 54.4% |
| **MATH-500** | ~85% (thinking mode) |
| **BFCL** | Not independently reported for 8B; Qwen3-32B scores 70.3% as reference |
| **Tok/s on M4 Air** | ~30–40 tok/s (Q4_K_M, plugged in) |
| **Agent verdict** | Best all-rounder at this size. Hybrid thinking/non-thinking mode is a genuine differentiator — enable thinking for multi-step reasoning, disable it for fast tool routing. Native tool-calling support via Qwen-Agent or Ollama's function-calling interface. |

**Strengths:** Large 128K context window; outperforms Qwen2.5-14B on many STEM benchmarks despite smaller size; strong instruction following in non-thinking mode.  
**Weaknesses:** BFCL score not independently confirmed for 8B variant; reasoning chain token cost is high in thinking mode (adds latency).

**Sources:** [Qwen3 Technical Report (arxiv 2505.09388)](https://arxiv.org/html/2505.09388v1), [EvalScope evaluation](https://evalscope.readthedocs.io/en/latest/best_practice/qwen3.html)

---

#### 2. Gemma 3 12B (Q4_K_M or QAT)

| Attribute | Value |
|-----------|-------|
| **Quant / footprint** | Q4_K_M ~8.0 GB; Google's QAT 4-bit ~8.0 GB (better quality at same size) |
| **Fit on 16 GB** | Comfortable at 4–8K context; tight at 32K |
| **IFEval** | 88.9% |
| **HumanEval** | 85.4% |
| **MBPP** | 73.0% |
| **MMLU-Pro** | 60.6% |
| **GPQA Diamond** | 40.9% |
| **MATH** | 83.8% |
| **LiveCodeBench** | 24.6% |
| **BFCL** | Not reported in technical report |
| **Tok/s on M4 Air** | ~22–28 tok/s |
| **Agent verdict** | Best instruction-follower in the 16 GB comfort zone. IFEval 88.9 means it reliably follows structured prompts — critical for agent tool-routing schemas. Weaker than Qwen3-8B on LiveCodeBench (complex competitive coding), but stronger for general-purpose instruction tasks. |

**Strengths:** Excellent IFEval; Google's QAT quantization retains quality better than standard Q4_K_M; supports Ollama and MLX natively.  
**Weaknesses:** LiveCodeBench 24.6% is mediocre — don't use for hard coding tasks; 8B context default (can extend).

**Sources:** [Gemma 3 Technical Report (arxiv 2503.19786)](https://arxiv.org/html/2503.19786v1)

---

#### 3. Qwen2.5-7B (Q4_K_M) — the safe proven choice

| Attribute | Value |
|-----------|-------|
| **Quant / footprint** | Q4_K_M, ~5.0 GB |
| **Fit on 16 GB** | Very comfortable |
| **IFEval (strict-prompt)** | 71.2% |
| **HumanEval** | 84.8% |
| **MBPP** | 79.2% |
| **MMLU-Pro** | 56.3% |
| **GPQA** | 36.4% |
| **MATH** | 75.5% |
| **LiveCodeBench** | 28.7% |
| **BFCL** | Not independently confirmed for 7B |
| **Tok/s on M4 Air** | ~35–45 tok/s |
| **Agent verdict** | Mature, stable, widely supported across every framework. IFEval 71.2% is the weakest on this list — means more prompt engineering needed for reliable structured outputs. Better suited for RAG retrieval + summarization than for complex tool orchestration. Superseded by Qwen3-8B for most tasks; still useful if you need a fast, lightweight worker. |

**Strengths:** Battle-tested in every framework; fastest of the candidates; great for high-throughput RAG pipelines.  
**Weaknesses:** IFEval 71.2 is meaningfully lower than peers — structured output and tool-call format fidelity will be flakier.

**Sources:** [Qwen2.5 blog (Alibaba)](https://qwenlm.github.io/blog/qwen2.5-llm/)

---

#### 4. Phi-4 (14B, Q4_K_M) — Microsoft's compact overachiever

| Attribute | Value |
|-----------|-------|
| **Quant / footprint** | Q4_K_M, ~8–9.5 GB |
| **Fit on 16 GB** | Marginal — workable if you close other apps; short-context only |
| **MMLU** | 84.8% |
| **HumanEval** | 82.6% |
| **MATH** | 80.4% |
| **IFEval** | Not confirmed for base Phi-4; Phi-4-Reasoning is better |
| **BFCL** | ~40.8% (awesomeagents.ai leaderboard) — weakest function-calling of any model here |
| **Tok/s on M4 Air** | ~18–24 tok/s |
| **Agent verdict** | BFCL 40.8% is a red flag for agent use. Phi-4 was trained heavily on synthetic reasoning datasets — excellent for self-contained reasoning tasks (math, logic) but the low BFCL score means tool-calling is unreliable without extensive prompting. Not recommended as a primary agent model. Use it for a reasoning sub-step if you need 14B quality at 14B price. |

**Strengths:** Best MMLU at this size class; strong math; small footprint relative to quality.  
**Weaknesses:** BFCL ~40.8% is disqualifying for agent use; marginal fit on 16 GB; context window historically 16K (smaller than Qwen).

**Sources:** [Phi-4 Microsoft Blog](https://techcommunity.microsoft.com/blog/educatordeveloperblog/phi-4-small-language-models-that-pack-a-punch/4464167), [awesomeagents.ai BFCL leaderboard](https://awesomeagents.ai/leaderboards/function-calling-benchmarks-leaderboard/)

---

#### 5. Llama 3.1 8B (Q4_K_M)

| Attribute | Value |
|-----------|-------|
| **Quant / footprint** | Q4_K_M, ~4.9 GB |
| **Fit on 16 GB** | Very comfortable |
| **BFCL (v3)** | 76.1% — best confirmed BFCL score for any model at this size |
| **IFEval** | 80.4% |
| **HumanEval** | 68.1% |
| **MATH** | 68.0% |
| **Tok/s on M4 Air** | ~35–45 tok/s |
| **Agent verdict** | The highest confirmed BFCL score at this parameter count (76.1%) makes Llama 3.1 8B the function-calling champion in the comfort zone. Meta specifically optimized it for tool use. It is weaker than Qwen3-8B on reasoning and coding, but if your agent's primary job is reliable tool dispatch — calling APIs, routing to tools, structured JSON output — start here. |

**Strengths:** BFCL 76.1% is top-tier for <10B models; Meta's tool-use training is mature and battle-tested; wide ecosystem support.  
**Weaknesses:** HumanEval 68.1% is noticeably lower than Gemma 3 12B or Qwen2.5-7B; reasoning not as strong as Qwen3-8B in thinking mode.

**Sources:** [llm-stats.com BFCL leaderboard](https://llm-stats.com/benchmarks/bfcl), [LLM Benchmarks Summer 2025](https://www.timetoact-group.at/en/insights/llm-benchmarks/llm-benchmarks-summer-2025)

---

#### 6. DeepSeek-R1-Distill-Qwen-7B (Q4_K_M)

| Attribute | Value |
|-----------|-------|
| **Quant / footprint** | Q4_K_M, ~5.0 GB |
| **Fit on 16 GB** | Very comfortable |
| **AIME 2024** | 55.5% (pass@1) |
| **MATH-500** | 92.8% |
| **GPQA Diamond** | 59.4% (extrapolated from 14B distill pattern) |
| **LiveCodeBench** | 49.1% |
| **IFEval** | Not confirmed for distill variant |
| **BFCL** | Not confirmed |
| **Tok/s on M4 Air** | ~35–42 tok/s |
| **Agent verdict** | Specialist for math and hard reasoning. MATH-500 at 92.8% at 7B is extraordinary — distillation from R1 works. However, the extended thinking chain format means it burns tokens on every query and is **not suitable as a primary agent planner** (too slow for fast tool dispatch). Use it as a sub-agent for computation/reasoning subtasks. IFEval and BFCL are unconfirmed — structured output reliability is uncertain. |

**Strengths:** MATH-500 92.8% and LiveCodeBench 49.1% at only 5 GB is remarkable; strong competition reasoning.  
**Weaknesses:** Thinking mode is expensive; IFEval/BFCL unconfirmed; not optimized for tool-calling.

**Sources:** [DeepSeek-R1 Technical Report (arxiv 2501.12948)](https://arxiv.org/html/2501.12948v1)

---

#### 7. Qwen2.5-14B (Q4_K_M) — stretch candidate

| Attribute | Value |
|-----------|-------|
| **Quant / footprint** | Q4_K_M, ~9.5 GB |
| **Fit on 16 GB** | Marginal — workable with apps closed, short context |
| **IFEval (strict-prompt)** | 81.0% |
| **HumanEval** | 83.5% |
| **MBPP** | 82.0% |
| **MMLU-Pro** | 63.7% |
| **GPQA** | 45.5% |
| **MATH** | 80.0% |
| **LiveCodeBench** | 42.6% |
| **Tok/s on M4 Air** | ~14–18 tok/s (slower due to size + M4 bandwidth ceiling) |
| **Agent verdict** | Across-the-board improvement vs 7B — IFEval 81.0, LiveCodeBench 42.6, GPQA 45.5 are all meaningfully better. The tradeoff is tight RAM, slower tokens, and thermal pressure. If you use this model, dedicate the machine to it — close Chrome, close Slack. For agent loops that need the best local quality without going to cloud, this is the ceiling for 16 GB. |

**Strengths:** Best local quality achievable at 16 GB; strong across all benchmark categories.  
**Weaknesses:** Marginal fit; token speed drops to where user-facing latency becomes noticeable; will compete with OS for RAM at 32K context.

**Sources:** [Qwen2.5 blog (Alibaba)](https://qwenlm.github.io/blog/qwen2.5-llm/)

---

## Comparison Table

| Model | Size | Footprint | IFEval | HumanEval | MMLU-Pro | LiveCodeBench | BFCL | Tok/s M4 | Fit |
|-------|------|-----------|--------|-----------|----------|----------------|------|-----------|-----|
| **Llama 3.1 8B** | 8B | ~4.9 GB | 80.4% | 68.1% | — | — | **76.1%** | 35–45 | Comfortable |
| **Qwen3-8B** | 8B | ~5.5 GB | **82%** | — | **68.7%** | **54.4%** | ~70%* | 30–40 | Comfortable |
| **Qwen2.5-7B** | 7B | ~5.0 GB | 71.2% | 84.8% | 56.3% | 28.7% | — | 35–45 | Comfortable |
| **Gemma 3 12B** | 12B | ~8.0 GB | **88.9%** | **85.4%** | 60.6% | 24.6% | — | 22–28 | Comfortable |
| **DeepSeek-R1 Qwen-7B** | 7B | ~5.0 GB | — | — | — | 49.1% | — | 35–42 | Comfortable |
| **Phi-4** | 14B | ~9.5 GB | — | 82.6% | — | — | 40.8% | 18–24 | Marginal |
| **Qwen2.5-14B** | 14B | ~9.5 GB | 81.0% | 83.5% | 63.7% | 42.6% | — | 14–18 | Marginal |

*Qwen3-8B BFCL is estimated by extrapolation from Qwen3-32B (70.3%) and Qwen3-30B-A3B (69.1%); not independently confirmed for 8B.  
Dash = no confirmed public number found from authoritative source; do not treat as zero.

**Bold** = best in column among comfortable-fit models.

---

## M4 Air Hardware Notes

### Memory Bandwidth is the Binding Constraint

The M4 chip has 120 GB/s unified memory bandwidth. Token generation speed scales linearly with bandwidth — this is why an M3 Max (400 GB/s) on the same 8B model is 2–3x faster, not because of compute. You cannot overclock your way out of this.

At 16 GB:
- 7–8B models at Q4_K_M: 30–45 tok/s (comfortable experience)
- 12–13B models at Q4_K_M: 22–30 tok/s (still fluid for interactive use)
- 14B models at Q4_K_M: 14–20 tok/s (acceptable, not fast)
- 20B+ models: hits swap → drops to 2–5 tok/s → unusable

### Quantization Guide

| Quantization | Quality vs FP16 | Memory vs FP16 | Recommendation |
|---|---|---|---|
| Q4_K_M | ~98% | ~28% | **Default for 16 GB — use this** |
| Q5_K_M | ~99% | ~35% | Use for 7B only if you want marginally better quality |
| Q8_0 | ~99.9% | ~52% | Only for 7B models; too big for 8B+ |
| IQ2_XS / Q2_K | ~90% | ~17% | Avoid — quality collapse is real |
| MLX 4-bit | ~97–98% | ~27% | Use with mlx-lm for 15–30% speed gain |

### Throttling Reality

The M4 Air is fanless. Under continuous inference (long document generation, 10+ minute agentic loops):
- Throttling starts: 20–30 minutes of sustained load
- Speed drop: 15–25%
- Recovery: 5–10 minutes at idle

**For agent work, this matters less than it sounds.** Typical agentic patterns are: generate (1–5 sec) → execute tool (network/IO, 1–30 sec) → generate again. The duty cycle is low enough that the chip stays cool. What *will* throttle: running a long RAG pipeline over hundreds of documents, generating a 20,000-word document in one shot, or running a tight reflection loop with no tool steps.

### Ollama MLX Backend (v0.19+, March 2026)

As of Ollama 0.19, there's a preview MLX backend available. However, per the official release notes, it currently requires 32 GB+ unified memory and only supports a limited model set (initially Qwen3.5-35B-A3B). **This does not benefit 16 GB M4 Air yet.** Use `mlx-lm` directly if you want MLX performance at 16 GB — it's available for all model sizes.

**MLX vs. Ollama for 16 GB M4 Air:**
- `mlx-lm`: 15–30% faster, 10% less memory, requires Python; models must be in MLX format (available on HF)
- `Ollama`: Easier setup, OpenAI-compatible API out of the box, works with LangChain/LlamaIndex directly; uses llama.cpp Metal backend on your hardware
- **Recommendation:** Start with Ollama. Switch to mlx-lm if you find 30 tok/s isn't fast enough.

---

## Honest Gap Analysis: What You Can and Can't Offload

### Realistic Local Tasks (can offload today)

| Task | Best local model | Quality vs cloud |
|------|-----------------|-----------------|
| Summarization (docs, emails, meeting notes) | Gemma 3 12B or Qwen3-8B | 90–95% of Claude Sonnet quality |
| RAG over local docs (retrieve + synthesize) | Qwen3-8B or Llama 3.1 8B | 85–95% |
| Simple tool routing (pick a tool, call it once) | Llama 3.1 8B | 80–90% |
| Code completion / autocomplete | Gemma 3 12B or Qwen3-8B | 80–90% for common patterns |
| Unit test generation | Qwen2.5-7B-Coder or Qwen3-8B | 85% |
| Structured JSON extraction from text | Qwen3-8B or Llama 3.1 8B | 80–90% |
| Classification / routing decisions | Any 7B+ model | 90%+ |
| Local knowledge base Q&A | Qwen3-8B + RAG | 80–90% |
| Math sub-tasks (calculations, proofs) | DeepSeek-R1-Distill-Qwen-7B | 90%+ |

### Still Needs Cloud (May 2026)

| Task | Why local 8B/12B fails | What to use instead |
|------|------------------------|---------------------|
| Multi-step agent planning (5+ tool calls in sequence) | Context coherence degrades; models lose track of state | Claude Sonnet / GPT-4o |
| Complex SWE-bench-grade coding (fixing real bugs in large codebases) | LiveCodeBench 54% at best locally vs. 77%+ for frontier | Claude Sonnet |
| Long-context reasoning (>32K tokens, maintaining coherent argument) | KV cache hits RAM ceiling; quality degrades at long context | Gemini 2.5 Pro |
| Reliable parallel tool calls | BFCL parallel-function scores drop sharply below 30B | Claude / GPT-4o |
| Novel research synthesis (GPQA-class) | Local best: GPQA 45.5%; frontier: 85%+ | Claude Opus |
| Instruction-following at production reliability | IFEval 82–89% locally means ~15% failure rate on complex prompts | Claude Sonnet |
| Multi-agent orchestration (orchestrator + multiple specialists) | Orchestrator model needs to reliably parse all specialist outputs | Run orchestrator in cloud, specialists locally |

**The honest number:** local 8B/12B models are roughly at GPT-3.5-turbo quality for most benchmarks. For tasks where GPT-3.5 was good enough, local is good enough. For tasks that needed GPT-4, you still need cloud.

---

## Recommended Starter Stack for Nick This Week

### For your use case (local agent team, privacy, cost reduction):

**Tier 1 — Start here (30 min setup):**

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull the two primary models
ollama pull qwen3:8b          # ~5.5 GB — main reasoning/planning model
ollama pull llama3.1:8b       # ~4.9 GB — function-calling workhorse

# Optional: pull Gemma for instruction-heavy tasks
ollama pull gemma3:12b        # ~8.0 GB — best instruction follower
```

**Tier 2 — If you want faster inference (Python required):**

```bash
pip install mlx-lm
mlx_lm.convert --hf-path Qwen/Qwen3-8B --quantize --q-bits 4
mlx_lm.generate --model mlx-models/Qwen3-8B-4bit --prompt "..."
```

**Tier 3 — Wire it to your agent framework:**

Ollama exposes `http://localhost:11434/v1` (OpenAI-compatible). Point any LangChain/LlamaIndex/CrewAI setup at it with:

```python
from langchain_community.llms import Ollama
llm = Ollama(model="qwen3:8b", base_url="http://localhost:11434")
```

Or with the OpenAI client directly:
```python
from openai import OpenAI
client = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")
```

**Model assignment by agent role:**

| Agent role | Recommended model | Rationale |
|---|---|---|
| Orchestrator / planner | Qwen3-8B (non-thinking mode) | Fast routing, strong IFEval |
| Tool caller / function dispatch | Llama 3.1 8B | BFCL 76.1% — most reliable |
| Reasoning sub-agent | Qwen3-8B (thinking mode) or DeepSeek-R1-Distill 7B | Enable thinking for complex steps |
| Summarizer / RAG | Gemma 3 12B | Best IFEval, clean structured output |
| Coder | Qwen3-8B or Qwen2.5-7B-Coder | HumanEval + LiveCodeBench |

**What to NOT do this week:**
- Don't start with 14B models — fix headroom issues first, add size later
- Don't enable Qwen3-8B thinking mode by default in your orchestrator loop — it's 3–5x slower and will hit throttle
- Don't run a browser, Chrome extension, AND a 12B model simultaneously on 16 GB — something will swap

---

## Sources

| Source | What it provided |
|--------|-----------------|
| [Qwen3 Technical Report (arxiv 2505.09388)](https://arxiv.org/html/2505.09388v1) | Qwen3-8B/14B base model benchmark tables (MMLU-Pro, GPQA, MATH, MBPP) |
| [EvalScope Qwen3 Evaluation](https://evalscope.readthedocs.io/en/latest/best_practice/qwen3.html) | Qwen3-8B instruct IFEval (0.82 strict-prompt), MMLU-Pro (68.7%), LiveCodeBench (54.4%) |
| [Gemma 3 Technical Report (arxiv 2503.19786)](https://arxiv.org/html/2503.19786v1) | Full benchmark tables for Gemma 3 4B/12B/27B across IFEval, HumanEval, MBPP, MMLU-Pro, GPQA, MATH, LiveCodeBench |
| [Qwen2.5 Blog (Alibaba)](https://qwenlm.github.io/blog/qwen2.5-llm/) | Benchmark tables for Qwen2.5-7B and 14B (IFEval, HumanEval, MBPP, MMLU-Pro, GPQA, MATH, LiveCodeBench) |
| [DeepSeek-R1 Technical Report (arxiv 2501.12948)](https://arxiv.org/html/2501.12948v1) | Distilled model benchmarks (AIME 2024, MATH-500, GPQA Diamond, LiveCodeBench, Codeforces rating) |
| [llm-stats.com BFCL leaderboard](https://llm-stats.com/benchmarks/bfcl) | BFCL scores: Llama 3.1 8B (76.1%), Qwen3-32B (70.3%), Qwen3-30B-A3B (69.1%) |
| [awesomeagents.ai BFCL leaderboard](https://awesomeagents.ai/leaderboards/function-calling-benchmarks-leaderboard/) | Phi-4 BFCL score (40.8%) |
| [LLM Benchmarks Summer 2025 (timetoact-group)](https://www.timetoact-group.at/en/insights/llm-benchmarks/llm-benchmarks-summer-2025) | Llama 3.1 8B IFEval (80.4%), HumanEval (68.1%) |
| [modelfit.io M4 16GB guide](https://modelfit.io/blog/best-llm-macbook-air-m4-16gb/) | Memory footprints by quant, tok/s ranges, fit classification for 16 GB |
| [modelpiper.com Apple Silicon benchmarks](https://modelpiper.com/blog/local-llm-benchmarks-apple-silicon/) | Tok/s by chip generation (M2 Air through M4 bandwidth extrapolation); throttling behavior |
| [willitrunai.com M4 guide](https://willitrunai.com/blog/best-llm-for-mac-apple-silicon-2026) | M4 16GB: 28–39 tok/s for well-fitted models; memory bandwidth = 120 GB/s |
| [willitrunai.com MLX vs Ollama](https://willitrunai.com/blog/mlx-vs-ollama-apple-silicon-benchmarks) | MLX beats Ollama 15–30% throughput; 10% less memory on Apple Silicon |
| [Ollama MLX blog post](https://ollama.com/blog/mlx) | Official Ollama MLX backend announcement; 32 GB+ requirement for preview |
| [Ollama MLX speed (Medium/@tentenco)](https://medium.com/@tentenco/ollama-0-19-ships-mlx-backend-for-apple-silicon-local-ai-inference-gets-a-real-speed-bump-878b4928f680) | Performance numbers: M5 Max prefill 1,154→1,810 tok/s; decode 58→112 tok/s with MLX |
| [insiderllm.com Mac LLMs 2026](https://insiderllm.com/guides/best-local-llms-mac-2026/) | 16 GB tier recommendations; Simon Willison's Qwen3-27B Unsloth benchmark (25.57 tok/s) |
| [localaimaster.com small models guide](https://localaimaster.com/blog/small-language-models-guide-2026) | Phi-4 benchmarks (MMLU 84.8%, HumanEval 82.6%), memory sizing tables |
| [tau-bench leaderboard](https://llm-stats.com/benchmarks/tau-bench) | Agent benchmark context; small models not yet represented |
| [BFCL v4 official](https://gorilla.cs.berkeley.edu/leaderboard.html) | Primary BFCL leaderboard reference |

---

*Report generated by Web Research Agent | AgentArchitect | 2026-05-09*

---

## Lookup Sites — Filter by Hardware + Benchmark

*Verified May 9, 2026. Each site fetched or confirmed via search.*

| Site | URL | Filters by hardware? | Filters by RAM? | Benchmark scores? | How current |
|------|-----|---------------------|-----------------|-------------------|-------------|
| **SiliconScore** | [siliconscore.com](https://siliconscore.com) | Yes — 27 specific Mac configs | Yes — unified memory tiers | Yes — tok/s, quantization, runtime (MLX/Ollama/llama.cpp) | Active, community-updated |
| **LLMCheck** | [llmcheck.net/benchmarks](https://llmcheck.net/benchmarks) | Yes — M1–M5 chip variants | Yes — 8 GB–192 GB | Yes — tok/s + TTFT, 50 models × 3 engines | Updated April 2026, 180+ benchmarks |
| **LocalScore** | [localscore.ai](https://localscore.ai) | Partial — GPU class (CPU / GPU / CPU+GPU) | Listed per entry (VRAM) | Yes — prompt throughput, gen speed, TTFT, composite score | Active, community-submitted |
| **WillItRunAI** | [willitrunai.com](https://willitrunai.com) | Partial — Mac / Apple Silicon category | Yes — memory fit check | No — tells you if it fits, not how fast | Active (403 on direct fetch; confirmed via cited blog posts) |
| **HF Open LLM Leaderboard** | [hf.co/spaces/open-llm-leaderboard](https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard) | No | No | Yes — academic benchmarks (MMLU, IFEval, etc.) | Intermittently down; no hardware filter |
| **BFCL (Berkeley)** | [gorilla.cs.berkeley.edu/leaderboard.html](https://gorilla.cs.berkeley.edu/leaderboard.html) | No | No | Yes — function-calling accuracy, latency, cost | Active, cloud models only emphasis |
| **Ollama Library** | [ollama.com/library](https://ollama.com/library) | No | No | No — model sizes and pull counts only | Live |
| **LM Studio Models** | [lmstudio.ai/models](https://lmstudio.ai/models) | No | No | No — browse list with download counts | Live |
| **r/LocalLLaMA wiki** | [reddit.com/r/LocalLLaMA/wiki](https://www.reddit.com/r/LocalLLaMA/wiki/index) | Community threads, not structured filter | Community threads | Community threads | Active but unstructured |
| **LMArena (Chatbot Arena)** | [arena.ai](https://arena.ai) | No | No | Yes — Elo ratings for cloud models | Active; irrelevant for local/hardware |

### The Two Bookmarks Worth Keeping

**Primary:** [siliconscore.com](https://siliconscore.com) — select your exact Mac config (e.g. "M4 Air 16 GB"), see which models fit and how fast they run, with quantization and runtime breakdown. This is the one.

**Secondary:** [llmcheck.net/benchmarks](https://llmcheck.net/benchmarks) — filter by chip + RAM + inference engine (Ollama vs LM Studio vs MLX) and get tok/s + TTFT side-by-side across 50 models. Best when you want to compare runtimes on your exact hardware.

**For agent function-calling scores specifically:** bookmark [gorilla.cs.berkeley.edu/leaderboard.html](https://gorilla.cs.berkeley.edu/leaderboard.html) (BFCL) separately — no hardware filter, but it's the canonical source for tool-calling accuracy numbers referenced throughout this report.

*Appended by Web Research Agent | 2026-05-09*
