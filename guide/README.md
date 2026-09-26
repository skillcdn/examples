# Authoring guide

How skills in this layout are written, for whoever maintains this repository or a fork of it. Nothing here is discoverable through SkillCDN: the manifests declare only `docs/` directories as documents, so these pages never appear in an agent's `browse_repo` or `search_repo` results. An agent can still read the pages the root `README.md` links (`skill-authoring.md`, `adding.md`) on demand, which is why they say nothing that an agent running a skill should not see.

| Document | Purpose |
|---|---|
| [`skill-authoring.md`](skill-authoring.md) | What this layout asks on top of the SkillCDN Format, the body skeleton of a `SKILL.md`, and the style. |
| [`adding.md`](adding.md) | Step by step: a new skill, a new area, a new tool family, a new document set, and changing an existing skill. |
| `tools/<family>.md` | Conventions shared by every skill of one tool family. Created when the second skill for a family appears. |

The rules that hold for every skill are the body of [`SKILLCDN.md`](../SKILLCDN.md), and the rules of one area are the body of that area's `SKILLCDN.md`; SkillCDN hands both to the agent with every skill. Rules for changing anything in the repository, for people and agents alike, are in the root [`CLAUDE.md`](../CLAUDE.md). The format itself is the [SkillCDN Format specification](https://github.com/skillcdn/skillcdn/blob/main/docs/specs/skill-repo.md) in the SkillCDN repository; nothing here restates it.
