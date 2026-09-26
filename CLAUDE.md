# CLAUDE.md

The working agreement for this repository. It applies to AI agents and humans alike. Keep it short and true: when a rule here turns out to be wrong or stale, fix it in the same change.

## Project

This repository holds the official skill collection of SkillCDN, served as an MCP server at `skillcdn.ai/gh/skillcdn/skills`: skills that build a company of agents one area of work at a time (marketing, product, engineering, more to come), each driving a real tool. It is the reference repository for the [SkillCDN Format](https://github.com/skillcdn/skillcdn/blob/main/docs/specs/skill-repo.md): the shape SkillCDN proposes for a skill repository. It takes no pull requests; it is meant to be forked, so that a team publishes its own skills in the same shape with the same checks. Content, not code: Markdown that agents read, small JSON, and one dependency-free script that validates it. Every push to `main` is a public release, because SkillCDN indexes the default branch.

- **Format:** the SkillCDN Format, which is the [Agent Skills](https://agentskills.io/specification) layout plus manifests. A skill is a directory with a `SKILL.md`; an area is a directory with a `SKILLCDN.md` that describes its skills and adds their rules; a document set is a directory of Markdown under `docs/` at the root or in an area; `SKILLCDN.md` at the root names the repository and carries the rules for every skill.
- **Audience:** two readers at once. An agent that will execute a skill from a fresh session with no memory, and a person who wants to see how a skill for a given tool, or a repository in the format, is written, and to fork it.
- **License:** MIT. Public repository.

## Non-negotiables

1. **Everything committed is in English** (content, commit messages, pull request text), whatever language the conversation is in. Other languages appear only in `translations` fields.
2. **Public repository hygiene.** No secrets, tokens, account identifiers, private hostnames, customer material, real people's likeness or identity, or internal business reasoning. Fake-looking secrets trip the scanner too; use obvious placeholders like `<url>`.
3. **Content only.** No rendered media, screenshots, binaries or generated output. Skills ship text. Data files are small JSON or YAML that an agent reads.
4. **Skills declare; they never require executing repository code.** A `scripts/` directory inside a skill is optional help for agents that run locally. SkillCDN serves it as text. The skill must work from `SKILL.md` and `references/` alone.
5. **Skills spend only with consent.** Any step that costs the user money or credits is estimated first and gated on their approval. This and the other rules for every skill are the body of `SKILLCDN.md`.
6. **No pinned versions of models, products or APIs.** A skill tells the agent how to discover the latest through the tool's own catalog and how to choose among candidates. A dated snapshot may illustrate a number, marked as illustrative.
7. **Every skill belongs to an area.** `<area>/skills/<name>/`, never at the root. The area's `SKILLCDN.md` says who its skills are for and adds only the rules that hold for every skill in it. A rule for every skill in the repository goes in the root manifest; a rule for one skill stays in that skill.
8. **Each skill is self-contained.** It may be mounted alone (`.../skills/<area>/skills/<name>`), installed as part of its area's plugin, or copied into another agent, so it links only inside its own directory (`scripts/check.mjs` rejects a link that leaves it). It does not restate the repository's or the area's rules: SkillCDN hands the manifests to the agent with every skill.
9. **The format is SkillCDN's spec, not ours.** The spec is normative for layout, manifests, front-matter and what is served. This repository does not restate it; `guide/` holds only what it adds on top (style, process).
10. **Agents reach only what the format serves.** Discoverable: the skills, the manifests and the declared document directories. Readable on demand: a README at the root or in a served folder, and the pages it links. Everything else (`scripts/`, `.github/`, configuration) stays on the git host. Put content for agents where it is discoverable, and authoring material under `guide/`.

## Repository map

```
SKILLCDN.md       the repository manifest: name, description, documents: [docs], the rules for every skill
README.md         for people on the git host, including whoever forks it; readable by agents on demand
<area>/           one folder per area of work (marketing, product, engineering, ...)               (served)
  SKILLCDN.md     the area manifest: who its skills are for, the rules its skills add
  README.md       the area's catalog
  skills/<name>/  one directory per skill: SKILL.md, references/, assets/, optional scripts/
  docs/           the area's document sets, Markdown only, discovered by default next to the manifest
docs/             document sets that serve every area, declared in the root manifest                   (served)
guide/            skill-authoring, adding; later tools/<family>.md                                     (git host)
scripts/          check.mjs (validation; what CI runs)                                                 (git host)
.claude-plugin/   marketplace.json: one Claude Code plugin per area with skills                        (hidden)
.github/          CI (validation, secret scan), the pull request notice, dependabot                    (hidden)
```

## Commands

| Task | Command |
|---|---|
| **Verify (run before every commit)** | `node scripts/check.mjs` |

Node.js 24. No install step; the script has no dependencies. Do not add a package manager, a build or a framework to this repository. If validation needs more than one script can reasonably do, that is a sign the rule belongs in SkillCDN's own indexer instead.

## Workflow

**Before you start.** Read the spec, [guide/skill-authoring.md](guide/skill-authoring.md), the rules in [SKILLCDN.md](SKILLCDN.md) and the manifest of the area you are adding to. Read the existing skill closest to what you are adding. Read the tool's own documentation for the tool family you are writing for; the skill must reflect how the tool behaves today.

**While working.**

- Follow [guide/adding.md](guide/adding.md) step by step. It ends with trying the skill from a fresh session, following only what the files say. Do not skip that.
- One skill, area or document set per change. Do not reformat or "improve" others in passing.
- Discover live values (model ids, parameters, costs) with the tool at write time to make sure the instructions are right, but write the *how to discover* into the skill, not the values.
- Where the tool has a choice the user should make (which model, how much to spend, which style), write the question the agent asks, and the default if any.

**Definition of done.**

- `node scripts/check.mjs` passes.
- A skill is listed in its area's `README.md` and in the root `README.md`. A new area is listed in the root `README.md` and, once it has a skill, in `.claude-plugin/marketplace.json`. A document set is listed in the `README.md` of its `docs/` and in the root `README.md`.
- A new tool family has a row in the root `README.md` "Tool families" table.
- The skill was exercised end to end with the real tool at least once, and what had to be said in chat was folded back into the files.
- Nothing in rules 1 to 10 is violated.

**Commits and pushes.**

- [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): summary`, imperative, 72 characters or fewer. Types: `feat fix docs chore ci`. Scopes: `repo docs guide`, an area name for a change to one area (`feat(engineering): ...`), or a skill name for a change to one skill (`fix(higgsfield-shorts-ad): ...`). The body says why.
- Commit and push directly to `main` after `node scripts/check.mjs` passes and `git pull --rebase`. This repository takes no pull requests: it is forked, and a fork sets its own process. Do not create branches or pull requests unless asked.
- Never force-push or rewrite `main`. Keep the `Co-Authored-By` trailer your agent adds.

## Documentation protocol

| When you change... | Update in the same change |
|---|---|
| A skill's behavior, inputs or tools | Its `SKILL.md` and references; its row in the area's `README.md` and the root `README.md` if the one-line summary changed |
| A rule that applies to every skill | The body of `SKILLCDN.md`, kept short; skills do not restate it |
| A rule that applies to every skill of one area | The body of that area's `SKILLCDN.md`, kept to a few lines; it is paged before every skill of the area |
| What the repository is, or which directories hold documents | The front-matter of `SKILLCDN.md`; the repository map above |
| An area's purpose, or its first skill | The area's `SKILLCDN.md` front-matter and `README.md`; its row in the root `README.md`; `.claude-plugin/marketplace.json` |
| A file a fork must rename or rewrite (a name, an owner, an address) | The "Make it yours" steps in the root `README.md` |
| How skills are written or checked, beyond the spec | `guide/skill-authoring.md`; `scripts/check.mjs` if the rule is mechanical. A change to the format itself belongs in SkillCDN's spec, not here |
| The process for adding things | `guide/adding.md` |
| A new tool family | Root `README.md` table; `guide/tools/<family>.md` once two skills share conventions |
| A durable gotcha you learned the hard way | "Gotchas" below |

One topic, one file. Link instead of restating.

## Gotchas

- Discoverable and readable are different. `browse_repo` and `search_repo` see skills, manifests and declared document directories; a README in a served folder, and any page it links, can be read with `read_repo_file` but is never searched or paged into a skill. A page that must be searchable goes under a `docs/`; authoring material goes under `guide/`.
- A document under `docs/` may link only to what an agent can reach through the mount: skills, manifests, document directories, and the README of a served folder. A link from `docs/` to `guide/` cannot be followed there, and the check rejects it.
- A nested manifest's `documents` replaces the default at its scope, which is `docs` next to that manifest. Declare `documents` only for another directory, and only one that exists: a declared directory that does not exist is an index diagnostic, and the `check` role fails on it.
- Rules travel with the skill. `load_skill` and the MCP skills extension return the root manifest's body, then the area's, then the skill and its included files, in 16 KiB pages. Keep an area's rules to a few lines; a long body costs every skill in the area a page. A change to any `SKILLCDN.md` changes the served digest of every skill below it, so a host that verified a skill through the extension asks its user again: edit rules deliberately.
- Serving follows the license. SkillCDN passes a skill's content on only under a license it recognizes as permissive, taken from the skill's directory, its `license` field, the manifests above it or the repository's license file; under a restrictive or unrecognized license the skill is only described, with a link to its source. Keep `license: MIT` in every manifest and skill and `LICENSE.md` at the root; the `check` role prints the license it resolved for each skill.
- The connection instructions quote the root `description` cut to about 200 characters and an area's to about 110, within 2,000 characters in all. Put what matters first in every description; the `check` role prints exactly what a client is told.
- SkillCDN indexes Markdown and small JSON and skips everything else from search. A reference document that matters must be `.md`; a data file an agent must read must be small JSON.
- The `description` front-matter field is what search ranks first. Write it as the sentence a user would say, including "Use when ...". An area's `description` is shown with its folder on connect: say who the folder is for.
- Tool catalogs change under the skills. When a skill breaks because a parameter or a model went away, fix the discovery instruction, not just the value, so it does not break the same way twice.
- Some file-writing tools decode escape sequences on the way in: an escape such as U+00AD typed into a source file can land as the invisible character itself, which `scripts/check.mjs` then rejects. Build such characters with `String.fromCodePoint` and never paste them. Shell heredocs on Windows have their own trouble: the command line is truncated past a few thousand characters, so a long file written that way fails to parse or lands incomplete. Prefer the editor's file tools and let `.gitattributes` normalize to LF.
- Front-matter is parsed by a real YAML parser on the server, and a value it cannot parse makes the whole `SKILL.md` unreadable: the skill is not served, and the server says so in the connection instructions, in `browse_repo`, in `load_skill` and on the page of the address, with a hint. The usual cause is a colon followed by a space in an unquoted `description`; a space followed by a hash cuts the value where YAML sees a comment. Rephrase or quote; `scripts/check.mjs` rejects both, and the `check` role of the SkillCDN image gives the indexer's own verdict (`pnpm --filter @skillcdn/server run start check <path to this repository>` from a checkout of SkillCDN).
- A reference that every run reads belongs in `skillcdn.include` in the front-matter, so that `load_skill` returns it with the skill instead of costing a `read_repo_file` call per run. A reference only some phase needs stays linked from that phase.
