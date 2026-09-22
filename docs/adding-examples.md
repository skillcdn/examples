# Adding an example

This repository grows one example at a time: a skill that drives a tool, or a document set that an agent reads. Both are served through SkillCDN as soon as they are on `main`, so every addition is a public release.

## A new skill

1. Read [skill-authoring.md](skill-authoring.md) and the [shared rules](shared-rules.md). Open an existing skill (start with `skills/higgsfield-shorts-ad/`) and copy its skeleton.
2. Create `skills/<name>/SKILL.md`. The directory name is the skill name. Prefix it with the tool family (`higgsfield-`, `github-`, ...).
3. Put anything longer than a paragraph in `references/`, and link each reference from the phase that uses it. Data files go in `assets/`.
4. Restate the shared rules the skill depends on in its "Working agreement" section as text (no link out of the skill directory), and name the tools it requires in "Requirements".
5. Add one row to the table in `skills/README.md` and one to the catalog in the root `README.md`.
6. Run `node scripts/check.mjs`. Fix what it reports.
7. Try the skill end to end with an agent that has the required tools, from a fresh session, following only what the files say. Whatever you had to explain in chat is missing from the skill: add it.
8. Commit as `feat(skills): add <name>`.

## A new tool family

The first skill for a tool that the repository does not cover yet also needs:

- A line in the "Tool families" table in the root `README.md`: what the tool is, how the user connects it (an MCP server address, an install step) and where its own documentation lives.
- The `metadata.tools` value in the front-matter, so skills can be found by family.
- If the tool has conventions that every skill for it will share (how uploads work, how costs are queried, how results come back), write them once in `docs/tools/<family>.md` and link it from each of that family's skills. One home per fact. Each skill still restates what it cannot work without, because a skill may be mounted alone.

## A new document set

A document set is a directory of Markdown without a `SKILL.md`: developer documentation, a handbook, a set of specifications. SkillCDN lists and searches it through `find` and serves it through `read_file`; no skill is needed.

1. Create `documents/<name>/` with a `README.md` that says what the set is and how it is organized.
2. Give each document a front-matter `title` and `description`, or a level-one heading followed by one summary paragraph, because that is what search shows.
3. Add one row to `documents/README.md` and one to the root `README.md`.
4. Run `node scripts/check.mjs`.
5. Commit as `feat(documents): add <name>`.

## Changing an existing example

- Keep the change to one example. A rule that turns out to be wrong in one skill is fixed in that skill, and in `docs/` if it came from there.
- If a tool's behavior changed under the skill (a renamed parameter, a removed model), fix the skill in the same change and say so in the commit body.
- A skill that no longer works with the current tool is removed from the catalogs rather than left broken.
