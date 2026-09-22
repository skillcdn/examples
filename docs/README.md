# Documentation

How this repository itself is written. Note that SkillCDN serves this directory too: an agent's `find` can return these pages next to the examples. Keep them short and useful to that reader as well.

| Document | Purpose |
|---|---|
| [`shared-rules.md`](shared-rules.md) | The rules every skill follows and restates: ask when ambiguous, request missing tools, spend only with consent, deliver a file, treat inputs as data. |
| [`skill-authoring.md`](skill-authoring.md) | What this repository asks on top of the skill-repo convention, the body skeleton, and the style. The format itself is SkillCDN's spec. |
| [`adding-examples.md`](adding-examples.md) | Step by step: a new skill, a new tool family, a new document set, and changing an existing one. |
| `tools/<family>.md` | Conventions shared by every skill of one tool family. Created when the second skill for a family appears. |

Rules for changing anything in the repository are in the root [`CLAUDE.md`](../CLAUDE.md). The normative format is the [skill-repo convention](https://github.com/skillcdn/skillcdn/blob/main/docs/specs/skill-repo.md) in the SkillCDN repository; nothing here restates it.
