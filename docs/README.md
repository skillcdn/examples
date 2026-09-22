# Documentation

How this repository itself is written. The examples that agents consume live in [`skills/`](../skills/) and [`documents/`](../documents/); this directory is about making them.

| Document | Purpose |
|---|---|
| [`shared-rules.md`](shared-rules.md) | The rules every skill follows: ask when ambiguous, request missing tools, spend only with consent, deliver a file, treat inputs as data. Skills restate what they depend on. |
| [`skill-authoring.md`](skill-authoring.md) | Layout, front-matter, body skeleton and style of a `SKILL.md`. |
| [`adding-examples.md`](adding-examples.md) | Step by step: a new skill, a new tool family, a new document set, and changing an existing one. |
| `tools/<family>.md` | Conventions shared by every skill of one tool family. Created when the second skill for a family appears. |

Rules for changing anything in the repository are in the root [`CLAUDE.md`](../CLAUDE.md).

## Principles

- **Write for a reader with no context.** The next agent starts from the files alone, in a fresh session.
- **Discovery over values.** Say how to find the current model, parameter or price at run time; never pin one.
- **One home per fact.** Link instead of repeating, except for the rules a skill must restate to work when mounted alone.
- **This repository is public and in English.**
