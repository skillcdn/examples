# CLAUDE.md

The working agreement for this repository. It applies to AI agents and humans alike. Keep it short and true: when a rule here turns out to be wrong or stale, fix it in the same change.

## Project

This repository holds example skills and document sets that SkillCDN serves as an MCP server (`skillcdn.ai/gh/skillcdn/examples`). It is the reference repository for the [SkillCDN Format](https://github.com/skillcdn/skillcdn/blob/main/docs/specs/skill-repo.md): content, not code. Markdown that agents read, plus one dependency-free script that validates it. Every push to `main` is a public release, because SkillCDN indexes the default branch.

- **Format:** the SkillCDN Format, which is the [Agent Skills](https://agentskills.io/specification) layout plus a root manifest. A skill is a directory with a `SKILL.md`; a document set is a directory of Markdown under a directory the manifest declares; `SKILLCDN.md` at the root names the repository and carries the rules for every skill.
- **Audience:** two readers at once. An agent that will execute a skill from a fresh session with no memory, and a person who wants to see how a skill for a given tool is written.
- **License:** MIT. Public repository.

## Non-negotiables

1. **Everything committed is in English** (content, commit messages, pull request text), whatever language the conversation is in.
2. **Public repository hygiene.** No secrets, tokens, account identifiers, private hostnames, customer material, real people's likeness or identity, or internal business reasoning. Fake-looking secrets trip the scanner too; use obvious placeholders like `<url>`.
3. **Content only.** No rendered media, screenshots, binaries or generated output. Examples ship text. Data files are small JSON or YAML that an agent reads.
4. **Skills declare; they never require executing repository code.** A `scripts/` directory inside a skill is optional help for agents that run locally. SkillCDN serves it as text. The skill must work from `SKILL.md` and `references/` alone.
5. **Skills spend only with consent.** Any step that costs the user money or credits is estimated first and gated on their approval. This and the other rules for every skill are the body of `SKILLCDN.md`.
6. **No pinned versions of models, products or APIs.** A skill tells the agent how to discover the latest through the tool's own catalog and how to choose among candidates. A dated snapshot may illustrate a number, marked as illustrative.
7. **Each skill is self-contained.** It may be mounted alone (`.../examples/skills/<name>`), so it links only inside its own directory (`scripts/check.mjs` rejects a link that leaves it). It does not restate the repository rules: SkillCDN hands the manifest body to the agent with every skill.
8. **The format is SkillCDN's spec, not ours.** The spec is normative for layout, manifests, front-matter and what is served. This repository does not restate it; `contributing/` holds only what it adds on top (style, process).
9. **Only what the manifest declares is served.** Skills, the directories in `documents` (`docs/`) and `SKILLCDN.md` reach agents. `README.md`, `contributing/`, `scripts/` and hidden entries do not. Put content for agents where it is served, and contributor material where it is not.

## Repository map

```
SKILLCDN.md    the repository manifest: name, description, documents: [docs], and the rules for every skill
README.md      for people reading the repository on the git host (not served)
skills/        one directory per skill: SKILL.md, references/, assets/, optional scripts/   (served)
docs/          example document sets: Markdown only, declared in the manifest                (served)
contributing/  skill-authoring, adding-examples; later tools/<family>.md                     (not served)
scripts/       check.mjs (validation; what CI runs)                                          (not served)
.github/       CI (validation, secret scan), pull request template, dependabot               (hidden)
```

## Commands

| Task | Command |
|---|---|
| **Verify (run before every commit)** | `node scripts/check.mjs` |

Node.js 24. No install step; the script has no dependencies. Do not add a package manager, a build or a framework to this repository. If validation needs more than one script can reasonably do, that is a sign the rule belongs in SkillCDN's own indexer instead.

## Workflow

**Before you start.** Read the spec, [contributing/skill-authoring.md](contributing/skill-authoring.md) and the rules in [SKILLCDN.md](SKILLCDN.md). Read the existing skill closest to what you are adding. Read the tool's own documentation for the tool family you are writing for; the skill must reflect how the tool behaves today.

**While working.**

- Follow [contributing/adding-examples.md](contributing/adding-examples.md) step by step. It ends with trying the skill from a fresh session, following only what the files say. Do not skip that.
- One example per change. Do not reformat or "improve" other examples in passing.
- Discover live values (model ids, parameters, costs) with the tool at write time to make sure the instructions are right, but write the *how to discover* into the skill, not the values.
- Where the tool has a choice the user should make (which model, how much to spend, which style), write the question the agent asks, and the default if any.

**Definition of done.**

- `node scripts/check.mjs` passes.
- The example is listed in its catalog (`skills/README.md` or `docs/README.md`) and in the root `README.md`.
- A new tool family has a row in the root `README.md` "Tool families" table.
- The skill was exercised end to end with the real tool at least once, and what had to be said in chat was folded back into the files.
- Nothing in rules 1 to 9 is violated.

**Commits and pushes.**

- [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): summary`, imperative, 72 characters or fewer. Types: `feat fix docs chore ci`. Scopes: `skills docs contributing repo`, or a skill name for a change to one skill (`fix(higgsfield-shorts-ad): ...`). The body says why.
- Maintainers commit and push directly to `main` after `node scripts/check.mjs` passes and `git pull --rebase`. Everyone else opens a pull request. Do not create branches or pull requests unless asked.
- Never force-push or rewrite `main`. Keep the `Co-Authored-By` trailer your agent adds.

## Documentation protocol

| When you change... | Update in the same change |
|---|---|
| A skill's behavior, inputs or tools | Its `SKILL.md` and references; its row in `skills/README.md` and the root `README.md` if the one-line summary changed |
| A rule that applies to every skill | The body of `SKILLCDN.md`, kept short; skills do not restate it |
| What the repository is or which directories hold documents | The front-matter of `SKILLCDN.md`; the repository map above |
| How skills are written or checked, beyond the spec | `contributing/skill-authoring.md`; `scripts/check.mjs` if the rule is mechanical. A change to the format itself belongs in SkillCDN's spec, not here |
| The process for adding things | `contributing/adding-examples.md` |
| A new tool family | Root `README.md` table; `contributing/tools/<family>.md` once two skills share conventions |
| A durable gotcha you learned the hard way | "Gotchas" below |

One topic, one file. Link instead of restating.

## Gotchas

- With a manifest present, an undeclared directory is invisible to agents. A document that must reach an agent goes under `docs/` (or another directory added to `documents`); a page that must not (contributor material) goes under `contributing/`.
- A served document may link only to served paths. A link from `docs/` to `README.md` or `contributing/` cannot be followed through the mount, and the check rejects it.
- SkillCDN indexes Markdown and small JSON and skips everything else from search. A reference document that matters must be `.md`; a data file an agent must read must be small JSON.
- The `description` front-matter field is what search ranks first. Write it as the sentence a user would say, including "Use when ...".
- Tool catalogs change under the skills. When a skill breaks because a parameter or a model went away, fix the discovery instruction, not just the value, so it does not break the same way twice.
- Some file-writing tools decode escape sequences on the way in: an escape such as U+00AD typed into a source file can land as the invisible character itself, which `scripts/check.mjs` then rejects. Build such characters with `String.fromCodePoint` and never paste them. Shell heredocs on Windows have their own quoting trouble; prefer the editor's file tools and let `.gitattributes` normalize to LF.
