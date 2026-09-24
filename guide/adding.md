# Adding to your repository

A repository in this layout, this one or a fork of it, grows one piece at a time: a skill that drives a tool, an area that groups the skills of one kind of work, or a document set that an agent reads. All of it is served through SkillCDN as soon as it is on `main`, so every addition is a public release.

## A new skill

1. Read [skill-authoring.md](skill-authoring.md), the rules in [`SKILLCDN.md`](../SKILLCDN.md) and the manifest of the area the skill belongs to. Open the existing skill closest to yours (start with `marketing/skills/higgsfield-shorts-ad/`) and copy its skeleton.
2. Create `<area>/skills/<name>/SKILL.md`. The directory name is the skill name. Prefix it with the tool family (`higgsfield-`, `github-`, ...). If no area fits, add the area first (below).
3. Put anything longer than a paragraph in `references/`, and link each reference from the phase that uses it. List the references every run needs in `skillcdn.include` in the front-matter, so that they arrive with the skill. Data files go in `assets/`. Never link outside the skill directory.
4. Do not restate the repository's or the area's rules; they arrive with the skill. Name the tools the skill requires in "Requirements", with what to do when one is missing.
5. Add one row to the table in `<area>/README.md` and one to the "Skills" table in the root `README.md`. If it is the area's first skill, update the area's row in the root `README.md` and add the area to `.claude-plugin/marketplace.json` (below).
6. Run `node scripts/check.mjs`. Fix what it reports. With a checkout of SkillCDN at hand, `pnpm --filter @skillcdn/server run start check <path to this repository>` shows what an agent would get, with the indexer's own parser.
7. Add a `translations` entry for each language you can write, under `skillcdn` in the skill, so that people who read the page in that language see what the skill is.
8. Try the skill end to end with an agent that has the required tools, from a fresh session, following only what the files say. Whatever you had to explain in chat is missing from the skill: add it.
9. Commit as `feat(<area>): add <name>`.

## A new area

An area is a directory at the root that groups the skills of one kind of work, for the people who do that work. It is named after the function, in one lowercase word: `marketing`, `product`, `engineering` today, and, when their first skill arrives, `design`, `sales`, `support`, `operations`, `data`, `finance`, `legal`, `people`. Use one of these names before inventing one; an agent and a person both find things by function.

1. Create `<area>/SKILLCDN.md`. Its `name` is the function's name in title case. Its `description` says who the skills in this folder are for and for which tasks, in the words those people would use: it is shown with the folder on connect and on the page of the address. Add `translations` for each language you can write, and `license: MIT`. Do not declare `language` (it is inherited from the root) or `documents` (`docs` next to the manifest is the default; declare it only for another directory, and only one that exists).
2. Write the body: a level-one heading, then only the rules that hold for every skill of the area and are not already rules of the repository, each in a sentence or two. The body is paged before every skill of the area, so keep it to a few lines. A rule for one skill belongs in that skill.
3. Create `<area>/README.md`: what the area is, its catalog table (a placeholder row until the first skill), and where its documents go. Copy an existing area's README.
4. Add the area to the "Areas" table in the root `README.md`.
5. Run `node scripts/check.mjs`. Commit as `feat(repo): add the <area> area`.

The area's first skill also adds one entry to `.claude-plugin/marketplace.json`: `name` equal to the area directory, `source` set to `./<area>`, and a one-sentence `description`. Claude Code then installs the area's `skills/` as one plugin. The check requires the entry once the area has a skill, and rejects it before.

## A new tool family

The first skill for a tool that the repository does not cover yet also needs:

- A line in the "Tool families" table in the root `README.md`: what the tool is, how the user connects it (an MCP server address, an install step) and where its own documentation lives.
- The `metadata.tools` value in the front-matter, so skills can be found by family.
- If the tool has conventions that every skill for it will share (how uploads work, how costs are queried, how results come back), write them once in `guide/tools/<family>.md` for authors. Each skill still carries what it cannot work without, because a skill may be mounted alone and guide pages are not discoverable.

## A new document set

A document set is a directory of Markdown without a `SKILL.md`, under a document directory: `docs/` at the root for what serves every area, `<area>/docs/` for what serves one. SkillCDN lists and searches it through `browse` and `search` and serves it through `read_file`; no skill is needed.

1. Create `<docs>/<name>/` with a `README.md` that says what the set is and how it is organized. For the first set of an area, create `<area>/docs/README.md` as the area's document catalog as well.
2. Give each document a front-matter `title` and `description`, or a level-one heading followed by one summary paragraph, because that is what search shows.
3. Link only to what an agent can reach through the mount: skills, manifests, document directories, and the README of a served folder. The check rejects a link to anything else.
4. Add one row to the `README.md` of that `docs/` and one to the root `README.md`.
5. Run `node scripts/check.mjs`.
6. Commit as `feat(docs): add <name>`, or `feat(<area>): add <name> documents` for an area's set.

A document set that should live in another directory is declared by adding that directory to `documents` in the nearest manifest.

## Changing an existing skill

- Keep the change to one skill. A rule that turns out to be wrong in one skill is fixed in that skill; a rule that holds for every skill of an area is fixed in the area's `SKILLCDN.md`; a rule that holds for every skill is fixed in the root `SKILLCDN.md`.
- If a tool's behavior changed under the skill (a renamed parameter, a removed model), fix the skill in the same change and say so in the commit body.
- A skill that no longer works with the current tool is removed from the catalogs rather than left broken.
