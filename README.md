# SkillCDN examples

Example skills and document sets, served live through [SkillCDN](https://github.com/skillcdn/skillcdn). SkillCDN turns a git repository into an MCP server; this repository is the first thing to point an agent at.

```
skillcdn.ai/gh/skillcdn/examples                                  everything in this repo
skillcdn.ai/gh/skillcdn/examples/skills/higgsfield-shorts-ad      one skill
skillcdn.ai/gh/skillcdn/examples@<commit>                         pinned to a commit
```

Every skill here is also a plain [Agent Skills](https://agentskills.io/specification) folder: copy `skills/<name>/` into any agent that reads `SKILL.md` and it works without SkillCDN.

## Catalog

### Skills

| Skill | Tool family | What it does |
|---|---|---|
| [`skills/higgsfield-shorts-ad/`](skills/higgsfield-shorts-ad/) | Higgsfield | Makes a vertical short-form AI ad from a reference video: analyzes the reference, lets the user choose the latest Kling or Seedance model with a credit estimate, generates draft-quality takes one at a time, and adds captions, frames and text with code-based editing. |

### Document sets

Directories of Markdown without a `SKILL.md`, such as developer documentation, that an agent reads through `find` and `read_file`. None yet; see [`documents/`](documents/).

### Tool families

| Family | What it is | How the user connects it | Documentation |
|---|---|---|---|
| Higgsfield | AI image, video and audio generation with a cloud sandbox for editing. | Add the Higgsfield MCP server to the agent. Skills check for the tools they need and ask for the server when it is missing. | [higgsfield.ai](https://higgsfield.ai) |

## Using an example

1. Add the address above as a remote MCP server in your agent, or copy a skill folder into your agent's skills directory.
2. Ask for what the skill does, in your own words. The skill's `description` is what the agent matches on.
3. Connect the tools the skill names under "Requirements". A skill stops and asks when one is missing.

Skills that spend money or credits always estimate first and wait for your approval.

## Repository layout

```
skills/        one directory per skill: SKILL.md, references/, assets/
documents/     example document sets: Markdown only, no SKILL.md
docs/          how this repository is written: shared rules, style guide, how to add an example (served too)
scripts/       check.mjs, the validation CI runs
```

## Adding an example

The process, for a skill, a document set or a new tool family, is in [docs/adding-examples.md](docs/adding-examples.md). The format is SkillCDN's [skill-repo convention](https://github.com/skillcdn/skillcdn/blob/main/docs/specs/skill-repo.md); what this repository adds on top is in [docs/skill-authoring.md](docs/skill-authoring.md), and the rules every skill follows are in [docs/shared-rules.md](docs/shared-rules.md). Rules for changing anything here, for people and agents alike, are in [CLAUDE.md](CLAUDE.md).

```sh
node scripts/check.mjs    # validates front-matter, catalogs, links and text; needs Node.js 24, no install
```

## License

The content of this repository is under the [MIT License](LICENSE.md). "SkillCDN" is a trademark of KDX Labs Corp. The tools the skills drive are third-party products with their own terms.

Built by KDX Labs. Copyright (c) 2026 KDX Labs Corp.
