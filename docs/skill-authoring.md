# Writing a skill

How a skill in this repository is laid out and written. The layout is the [Agent Skills](https://agentskills.io/specification) convention, which is also what SkillCDN indexes, so a skill that works here works unchanged anywhere that reads `SKILL.md`.

## Layout

```
skills/<name>/
  SKILL.md              front-matter plus the instructions; the only required file
  references/           documents the body points to: decision tables, templates, checklists
  assets/               small data files the skill reads: example JSON, schemas
  scripts/              optional helpers for agents that run locally; SkillCDN serves them as text
```

- `<name>` is lowercase letters, digits and single hyphens, and it equals `name` in the front-matter. Prefix the name with the tool family it drives (`higgsfield-…`, `github-…`) so related skills sort together.
- Keep `SKILL.md` under a few hundred lines. Anything an agent needs only in one phase goes to `references/` and is linked from that phase.
- Files never depend on anything outside the skill directory. A skill can be mounted alone.
- No rendered media, screenshots or generated output. Examples ship text.

## Front-matter

```yaml
---
name: higgsfield-shorts-ad
description: One or two sentences. What the skill produces and when to use it. This is what search matches first.
license: MIT
compatibility: Which tools or servers it needs. Plain text.
metadata:
  author: skillcdn
  version: "0.1"
  tools: higgsfield
---
```

| Field | Required | Rule |
|---|---|---|
| `name` | yes | 1 to 64 characters, matches the directory name. |
| `description` | yes | 1 to 1024 characters. Says what it does *and* when to use it, in words a user would type. |
| `license` | no | SPDX identifier. Skills here are MIT unless stated. |
| `compatibility` | no | The tools, servers or environment the skill needs. |
| `metadata` | no | Flat map of short strings. Use `tools` for the tool family the skill drives. |

Quote a version (`"0.1"`) so it stays text. Keep the mapping flat: the checker reads one level.

## Body

Every `SKILL.md` follows the same skeleton so an agent that has read one knows where to look in the next:

1. **Title and one-paragraph summary.** What comes out, from what.
2. **Working agreement.** The [shared rules](shared-rules.md) this skill depends on, restated in two or three lines each. This is not optional: the skill may be served alone.
3. **Requirements.** The tools it calls, with what to do when one is missing.
4. **Inputs.** What the user must supply, what is optional, and the intake questions to ask for gaps.
5. **Workflow.** Numbered phases. Each phase says what it consumes, what it produces, and where the user is consulted. Link a reference document for anything longer than a paragraph.
6. **Hard rules.** The short list an agent must never break, so it can be re-read before every costly step.
7. **Terminology.** The words the skill uses with a fixed meaning.

## Style

- Write for an agent with no memory of the previous session: current facts and decisions, not history.
- Imperative mood, short sentences, one idea each.
- Name a tool by its exact tool name in backticks the first time; describe it in words after that.
- Do not pin versions of models, products or APIs. Tell the agent to discover the latest through the tool's own catalog, and say how to choose when several qualify. Pinned versions go stale and break the skill silently.
- Where a number matters (a limit, a cost), say how to obtain it at run time. A dated snapshot may illustrate the shape, clearly marked as such.
- Decision points get a table: condition, choice, why.
- Anything the agent must ask the user is written as the question to ask.

## Checking

`node scripts/check.mjs` validates front-matter, catalog listings, links and text safety. Run it before every commit; CI runs the same script.
