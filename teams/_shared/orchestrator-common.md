## Spawning Deliverables (applies to every team)

This workspace is for the team's **recurring and operational work**. A distinct
deliverable — a video, a podcast episode, an app — does NOT get built here. It gets
its own project repo.

When the conversation produces one, run the launcher:

```bash
aa new <youtube|podcast|software> "<title>"
```

Then hand Nick the printed `cd … && claude` line and stop. Do not start the
deliverable in this workspace.

**This is the mechanism for reaching another team's capabilities.** You do not have
another team's specialists installed here, and you cannot invoke them. `aa new`
provisions a repo that carries the owning team's full roster:

| Deliverable | Command | Roster it spawns with |
|---|---|---|
| YouTube video, short | `aa new youtube "<title>"` | content-studio |
| Podcast episode | `aa new podcast "<title>"` | content-studio |
| App, tool, service | `aa new software "<title>"` | software-project |

If a request needs a team whose specialists are not in this repo, the answer is
never "I can't reach that team" — it is `aa new`, or a redirect to that team's own
workspace for their recurring work. Say which one you are doing and why.

**Carry the source material forward.** The new repo starts empty. Tell Nick which
files from this workspace the project needs, and flag any handling constraints
attached to them (approval gates, do-not-publish rules, git-exclusion rules) so
they travel with the work instead of being rediscovered — or missed.

**Team and agent changes** (roster edits, new teams, behavior changes) are not
deliverables. They belong in the factory: `cd ${AA_ROOT} && claude`, then
`/architect`.
