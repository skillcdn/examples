# skills/

One directory per skill, in the [Agent Skills](https://agentskills.io/specification) layout. Each is self-contained and can be mounted alone at `skillcdn.ai/gh/skillcdn/examples/skills/<name>`.

| Skill | Tool family | What it does |
|---|---|---|
| [`higgsfield-shorts-ad/`](higgsfield-shorts-ad/) | Higgsfield | A vertical short-form AI ad from a reference video. Analyze, plan, choose a model with a credit estimate, generate one draft take at a time, edit and caption in code. |

How to write one: [docs/skill-authoring.md](../docs/skill-authoring.md). How to add one: [docs/adding-examples.md](../docs/adding-examples.md). The `node scripts/check.mjs` check fails when a skill directory is missing from this table.
