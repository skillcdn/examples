# Adding an example

This repository grows one example at a time: a skill that drives a tool, or a document set that an agent reads. Both are served through SkillCDN as soon as they are on `main`, so every addition is a public release.

## A new skill

1. Read [skill-authoring.md](skill-authoring.md) and the rules in [`SKILLCDN.md`](../SKILLCDN.md). Open an existing skill (start with `skills/higgsfield-shorts-ad/`) and copy its skeleton.
2. Create `skills/<name>/SKILL.md`. The directory name is the skill name. Prefix it with the tool family (`higgsfield-`, `github-`, ...).
3. Put anything longer than a paragraph in `references/`, and link each reference from the phase that uses it. List the references every run needs in `skillcdn.include` in the front-matter, so that they arrive with the skill. Data files go in `assets/`. Never link outside the skill directory.
4. Do not restate the repository rules; they arrive with the skill. Name the tools the skill requires in "Requirements", with what to do when one is missing.
5. Add one row to the table in `skills/README.md` and one to the catalog in the root `README.md`.
6. Run `node scripts/check.mjs`. Fix what it reports. With a checkout of SkillCDN at hand, `pnpm --filter @skillcdn/server run start check <path to this repository>` shows what an agent would get, with the indexer's own parser.
7. Add a `translations` entry for each language you can write, under `skillcdn` in the skill and at the top level of `SKILLCDN.md`, so that people who read the page in that language see what the skill is.
8. Try the skill end to end with an agent that has the required tools, from a fresh session, following only what the files say. Whatever you had to explain in chat is missing from the skill: add it.
9. Commit as `feat(skills): add <name>`.

## A new tool family

The first skill for a tool that the repository does not cover yet also needs:

- A line in the "Tool families" table in the root `README.md`: what the tool is, how the user connects it (an MCP server address, an install step) and where its own documentation lives.
- The `metadata.tools` value in the front-matter, so skills can be found by family.
- If the tool has conventions that every skill for it will share (how uploads work, how costs are queried, how results come back), write them once in `contributing/tools/<family>.md` for authors. Each skill still carries what it cannot work without, because a skill may be mounted alone and contributor pages are not served.

## A new document set

A document set is a directory of Markdown without a `SKILL.md`, under a directory the manifest declares (`docs/`). SkillCDN lists and searches it through `find` and serves it through `read_file`; no skill is needed.

1. Create `docs/<name>/` with a `README.md` that says what the set is and how it is organized.
2. Give each document a front-matter `title` and `description`, or a level-one heading followed by one summary paragraph, because that is what search shows.
3. Link only to what is served: within `docs/`, to a skill, or to `SKILLCDN.md`. The check rejects a link to anything else.
4. Add one row to `docs/README.md` and one to the root `README.md`.
5. Run `node scripts/check.mjs`.
6. Commit as `feat(docs): add <name>`.

A document set that should live in another directory is declared by adding that directory to `documents` in `SKILLCDN.md`.

## Changing an existing example

- Keep the change to one example. A rule that turns out to be wrong in one skill is fixed in that skill; a rule that holds for every skill is fixed in `SKILLCDN.md`.
- If a tool's behavior changed under the skill (a renamed parameter, a removed model), fix the skill in the same change and say so in the commit body.
- A skill that no longer works with the current tool is removed from the catalogs rather than left broken.
