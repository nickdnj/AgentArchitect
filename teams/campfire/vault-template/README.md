# Campfire Starter Vault

A ready-to-use scaffold for the **Campfire** offline memory & autobiography team
(Biographer · Memory Keeper · Vault Librarian).

## Setup (one time, before camping)

1. Copy everything **inside** this `vault-template/` folder into your Obsidian
   vault (or open this folder directly as a vault in Obsidian).
2. Point the team at it:
   ```bash
   export OBSIDIAN_VAULT="/path/to/your/vault"   # add to ~/.zshrc so it persists
   ```
3. From AgentArchitect: run `/sync-agents`, then invoke `/campfire`.

## Folder map

| Folder | What lives here | Owned by |
|---|---|---|
| `Autobiography/` | Long-form chapters / life story | Biographer |
| `Autobiography/Stories/` | One memory or event per note | Biographer |
| `People/` | A note per person (linked from stories via `[[wikilinks]]`) | Biographer / Librarian |
| `_MOC/` | Maps of Content — indexes that tie everything together | Vault Librarian |
| `_inbox/` | Raw, unshaped capture (offline brain-dumps) | Biographer |
| `_changelog/` | Audit log of every in-place edit (old → new + reason) | All agents |
| `_sessions/` | Daily session continuity log (no cloud, no wiki) | Orchestrator |

## Conventions the agents follow

- **Frontmatter** on story notes (`type`, `date_captured`, `era`, `people`, `places`, `status`, `tags`).
- **Wikilinks** `[[Person Name]]` / `[[Place]]` connect notes; tags group themes.
- **`status: draft` → `confirmed`** once you've verified the facts.
- **Edit safety:** any change to an *existing* note is logged to `_changelog/YYYY-MM-DD.md`.
  New notes don't need a log entry. The agents never delete your words without asking.

> The `_TEMPLATE.md` files are starting points — duplicate them, don't edit them in place.
> Delete this README once you're set up if you like.
