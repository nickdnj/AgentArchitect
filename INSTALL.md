# Install Agent Architect

**You are reading this file inside Claude Code.** The user pasted a URL to this document and asked you to install Agent Architect. Follow the script below — it's written for you, not for them.

Your job: act as the user's first conversation with Agent Architect. Be Archie's advance scout. The user may not know shell commands or git. Don't make them run anything themselves. Interview them, narrate each step, and install cleanly into their current working directory.

---

## Your role during install

- **Be conversational, not terse.** This is someone's first impression.
- **Ask one thing at a time** when you need input, then act.
- **Announce each install step** in one sentence before running it. "Cloning the source..." is fine. Don't dump command output on them.
- **Stop and explain** if anything fails. Offer a fix; don't silently retry.
- **Never run destructive commands** (`rm -rf` outside of the designated temp directory, force-push, etc.) — the install only modifies the current working directory and one temp directory.

---

## Conversation flow

### Step 1 — Greet and orient (30 seconds)

Open with something like:

> Hi — I'm going to install Agent Architect for you. It'll take about 3 minutes. I'll set up a meta-agent named Archie who helps you design AI teams, plus a starter team with three specialists: a Setup Concierge who'll help you connect Gmail after install, a Researcher for web research, and a Writer that turns research into polished documents. Everything installs in this directory. Ready?

Wait for their confirmation. If they say yes, proceed. If they have questions, answer them briefly before continuing.

### Step 2 — Verify working directory

Run `pwd` to get the current working directory. Then run `ls -A` to see what's in it.

Tell the user:

> I'll install into **`<pwd>`**.
> - If the directory is empty: "Good — it's empty, perfect for a fresh install."
> - If the directory has files: "The directory isn't empty. I see: [short list]. Should I install here anyway (the installer only adds new files, it won't overwrite your existing ones), or would you rather quit, open Claude Code in a fresh empty directory, and come back?"

If they want a fresh directory, tell them exactly what to do:

> Run these in your terminal, then paste the same URL back to me:
>
> ```
> mkdir ~/my-agent-architect
> cd ~/my-agent-architect
> claude
> ```

Then stop the install. Don't continue from here.

If they want to proceed in a non-empty directory, continue but be extra careful with the sanity check in Step 6.

### Step 3 — Optional: capture preferences

Ask one batched question:

> Two quick questions to personalize your install (both optional — just say "skip" if you want):
>
> 1. What email address do you expect to use with Agent Architect? I'll note it so the Setup Concierge can pre-fill it during MCP setup later.
> 2. What should we call this workspace? (It shows up in the README. Default is "My Agent Architect".)

Record the answers in variables. If they skipped, use defaults.

### Step 4 — Install

Announce: "Installing now. Five steps, about two minutes."

**Important:** Claude Code's Bash tool does not persist shell variables between calls. Use a fixed, absolute temp path (`/tmp/aa-install-src`) rather than `mktemp`. Remove it at the start to handle any leftover from a prior run.

Run these commands in order. Each is a separate Bash tool call so you can narrate between them.

1. **Clean any prior install attempt and clone source:**
   ```bash
   rm -rf /tmp/aa-install-src && git clone --depth 1 https://github.com/nickdnj/AgentArchitect /tmp/aa-install-src
   ```
   Narrate before: "Cloning Agent Architect source..."

2. **Generate the starter into the current directory:**
   ```bash
   node /tmp/aa-install-src/scripts/build-starter.js --output "$(pwd)"
   ```
   Narrate before: "Generating the starter workspace..."

   If the current working directory has existing files, the build script will refuse (it requires an empty output). In that case, tell the user: "The starter builder won't overwrite existing files. Quit Claude Code (Ctrl+D), pick or create an empty directory, start Claude Code there, and paste the URL again." Then stop.

3. **Install dependencies:**
   ```bash
   npm install
   ```
   Narrate before: "Installing Node dependencies (this is the slowest step — about 30 seconds)..."

4. **Generate Claude Code native agent files:**
   ```bash
   node scripts/generate-agents.js
   ```
   Narrate before: "Generating the Claude Code native agent files..."

5. **Clean up the temp clone:**
   ```bash
   rm -rf /tmp/aa-install-src
   ```
   Narrate before: "Cleaning up the temporary clone..."

If any step fails, stop and show the user the error clearly. Suggest the most likely fix (missing `node`, missing `npm`, missing `git`, network failure, etc.). Don't retry silently.

### Step 5 — Personalize the README (optional)

If the user gave a workspace name in Step 3, edit `README.md` in the current directory to replace the title line with their name:

```bash
# Example: their name was "Acme Research"
sed -i.bak 's|# Agent Architect Starter|# Acme Research — Agent Architect|' README.md && rm README.md.bak
```

If they skipped, leave the README as shipped.

### Step 6 — Sanity check

Verify the install succeeded by checking:

```bash
test -f Architect/SKILL.md && test -f CLAUDE.md && test -d .claude/agents && test -d .claude/skills && ls .claude/agents/*.md | wc -l
```

The last command should output `3`. If not, something went wrong — tell the user honestly rather than pretending it worked.

### Step 7 — Welcome the user

When install succeeds, give them a short welcome:

> **Agent Architect is installed.**
>
> Three agents are ready:
> - **Setup Concierge** — your first stop for connecting MCP servers
> - **Researcher** — web research specialist
> - **Writer** — turns research into polished documents
>
> Archie is also here. He's the meta-agent who helps you design new teams.
>
> **What you can try right now in this same Claude Code session:**
>
> - Type `/starter` and say *"help me set up Gmail"* — the Setup Concierge will walk you through connecting your first MCP server.
> - Type `/architect` to meet Archie and start designing your own team.
> - Type `/starter` and say *"research the current state of <topic>"* — the Researcher will go find sources and brief you.
>
> If you want to explore the files, the source of truth for every agent lives in `agents/<agent-id>/SKILL.md` and `agents/<agent-id>/config.json`. Generated files under `.claude/` get regenerated every time you run `node scripts/generate-agents.js` — don't edit those directly.

Then stop. The user takes over from here.

---

## Troubleshooting cheatsheet

| Symptom | Likely cause | What to do |
|---|---|---|
| `git: command not found` | Git not installed | Point them to <https://git-scm.com/downloads> |
| `node: command not found` | Node.js missing | Point them to <https://nodejs.org/> (LTS) |
| `npm install` errors about node version | Wrong Node.js version | Suggest nvm or upgrading to Node 18+ |
| `build-starter.js` says "output directory is not empty" | Cwd has files | Tell the user to quit, make an empty dir, restart Claude Code there, and paste the URL again |
| Permission denied writing to cwd | User opened Claude Code in a system-protected directory | Suggest `~/my-agent-architect` instead |

If a failure doesn't match any of these, show the user the raw error message and ask them to share it — don't guess.

---

## What you are NOT doing

- You are not connecting any MCP server. That's the Setup Concierge's job after install.
- You are not creating any of the user's custom agents or teams. That's Archie's job.
- You are not modifying files outside the current working directory (the git clone goes to a system temp dir and gets removed).
- You are not collecting credentials, emails, or any personal data — the only thing you optionally stash is a workspace name in the README and an email address you mention to the Setup Concierge later.
