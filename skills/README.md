# skills/

One directory per skill, in the [Agent Skills](https://agentskills.io/specification) layout. Each is self-contained and can be mounted alone at `skillcdn.ai/gh/skillcdn/examples/skills/<name>`.

| Skill | Tool family | What it does |
|---|---|---|
| [`higgsfield-shorts-ad/`](higgsfield-shorts-ad/) | Higgsfield | A vertical short-form AI ad from just a reference video and a product link. Learn what makes the reference work, write an original concept in its medium (live action or animation), derive the rest, approve generated cast portraits and a first frame per shot, confirm a recommended model with its credit estimate, animate one directed draft take at a time, edit and caption in the brand's type in code. |

How to write one: [contributing/skill-authoring.md](../contributing/skill-authoring.md). How to add one: [contributing/adding-examples.md](../contributing/adding-examples.md). The rules every skill follows are the body of [SKILLCDN.md](../SKILLCDN.md). The `node scripts/check.mjs` check fails when a skill directory is missing from this table.
