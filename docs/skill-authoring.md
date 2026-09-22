# Writing a skill

The format of a skill is not defined here. It is the [Agent Skills](https://agentskills.io/specification) layout as SkillCDN reads it, and the normative text is the [skill-repo convention](https://github.com/skillcdn/skillcdn/blob/main/docs/specs/skill-repo.md) in the SkillCDN repository: what `SKILL.md` is, which front-matter fields exist and their limits, how names are validated, what is indexed. If this page and the spec disagree, the spec wins and this page gets fixed.

This page adds what this repository asks on top of the spec, and how to write the body.

## What this repository adds

- Prefix the skill name with the tool family it drives (`higgsfield-…`, `github-…`) so related skills sort together. The directory name is the skill name.
- A skill is self-contained. It links only inside its own directory, because it may be mounted alone at `.../examples/skills/<name>`, and it restates the [shared rules](shared-rules.md) it depends on in a "Working agreement" section instead of linking to them. `node scripts/check.mjs` rejects a link that leaves the skill directory.
- No rendered media, screenshots or generated output. Examples ship text. Data an agent must read is small JSON in `assets/`.
- `license` is `MIT` unless stated. `metadata.tools` names the tool family. Quote a `version` so it stays text, and keep `metadata` flat.

## Body skeleton

Every `SKILL.md` follows the same order so an agent that has read one knows where to look in the next:

1. **Title and one-paragraph summary.** What comes out, from what.
2. **Working agreement.** The shared rules this skill depends on, in two or three lines each.
3. **Requirements.** The tools it calls, with what to do when one is missing.
4. **Inputs.** What the user must supply, what is optional, and the intake questions for gaps.
5. **Workflow.** Numbered phases. Each says what it consumes, what it produces, and where the user is consulted. Anything longer than a paragraph goes to `references/` and is linked from its phase.
6. **Hard rules.** The short list an agent must never break, so it can be re-read before every costly step.
7. **Terminology.** The words the skill uses with a fixed meaning.

## Style

- Write for an agent with no memory of the previous session: current facts and decisions, not history.
- Imperative mood, short sentences, one idea each.
- Name a tool by its exact tool name in backticks the first time; describe it in words after that.
- Do not pin versions of models, products or APIs. Tell the agent to discover the latest through the tool's own catalog, and say how to choose when several qualify.
- Where a number matters (a limit, a cost), say how to obtain it at run time. A dated snapshot may illustrate the shape, clearly marked as such.
- Decision points get a table: condition, choice, why.
- Anything the agent must ask the user is written as the question to ask.
- The `description` field is what search ranks first. Write it as the sentence a user would say, ending with when to use the skill.
