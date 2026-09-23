# skills/

One directory per skill, in the [Agent Skills](https://agentskills.io/specification) layout. Each is self-contained and can be mounted alone at `skillcdn.ai/gh/skillcdn/examples/skills/<name>`.

| Skill | Tool family | What it does |
|---|---|---|
| [`higgsfield-shorts-ad/`](higgsfield-shorts-ad/) | Higgsfield | A vertical short-form AI ad in the style of a reference video, from just the reference and a product link. Derive the rest, plan, approve generated cast portraits, confirm a recommended model with its credit estimate, generate one draft take at a time with a quick check, edit and caption in code. |

How to write one: [contributing/skill-authoring.md](../contributing/skill-authoring.md). How to add one: [contributing/adding-examples.md](../contributing/adding-examples.md). The rules every skill follows are the body of [SKILLCDN.md](../SKILLCDN.md). The `node scripts/check.mjs` check fails when a skill directory is missing from this table.
