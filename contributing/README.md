# Contributor documentation

How this repository itself is written. Nothing here is served by SkillCDN: the repository manifest declares only `docs/` as documents, so these pages reach contributors on the git host and never an agent's `find` results.

| Document | Purpose |
|---|---|
| [`skill-authoring.md`](skill-authoring.md) | What this repository asks on top of the SkillCDN Format, the body skeleton of a `SKILL.md`, and the style. |
| [`adding-examples.md`](adding-examples.md) | Step by step: a new skill, a new tool family, a new document set, and changing an existing one. |
| `tools/<family>.md` | Conventions shared by every skill of one tool family. Created when the second skill for a family appears. |

The rules that hold for every skill are the body of [`SKILLCDN.md`](../SKILLCDN.md); SkillCDN hands them to the agent with every skill. Rules for changing anything in the repository are in the root [`CLAUDE.md`](../CLAUDE.md). The format itself is the [SkillCDN Format specification](https://github.com/skillcdn/skillcdn/blob/main/docs/specs/skill-repo.md) in the SkillCDN repository; nothing here restates it.
