# SkillCDN skills

Skills for everyday work, served live through [SkillCDN](https://github.com/skillcdn/skillcdn) and written the way SkillCDN recommends. One folder per area of work holds the skills that drive the tools of that work and the documents an agent reads beside them: marketing, product and engineering today, more areas as they are added. This is the reference repository for the [SkillCDN Format](https://github.com/skillcdn/skillcdn/blob/main/docs/specs/skill-repo.md): the shape SkillCDN proposes for a skill repository, kept working against the real tools. Fork it to publish your own skills in the same shape.

SkillCDN turns a git repository into an MCP server. Point an agent at an address and it gets what the address covers:

```
skillcdn.ai/gh/skillcdn/skills                                        the whole repository (recommended)
skillcdn.ai/gh/skillcdn/skills/marketing                              one area
skillcdn.ai/gh/skillcdn/skills/marketing/skills/higgsfield-shorts-ad  one skill
skillcdn.ai/gh/skillcdn/skills@<commit>                               pinned to a commit
```

The same folders work without SkillCDN. Every skill is a plain [Agent Skills](https://agentskills.io/specification) folder: copy `<area>/skills/<name>/` into any agent that reads `SKILL.md`. Every area with skills is a [Claude Code](https://code.claude.com/docs/en/plugins) plugin: `claude plugin marketplace add skillcdn/skills`, then `claude plugin install marketing@skillcdn`. Only through SkillCDN do the rules in [SKILLCDN.md](SKILLCDN.md) and the area's manifest arrive with every skill; a copied or installed skill relies on its own hard rules.

## Areas

One folder per area of work. Each carries a `SKILLCDN.md` that says who its skills are for and adds the rules they share, a `README.md` that lists them, its skills under `skills/`, and the documents its people read under `docs/`.

| Area | For | Skills |
|---|---|---|
| [`marketing/`](marketing/) | Ads, promotional video, content, campaigns, social posts. | 1 |
| [`product/`](product/) | Discovery, research synthesis, requirements, specifications, roadmaps, prioritization. | none yet |
| [`engineering/`](engineering/) | Software development: writing and changing code, building apps, code review, testing, debugging. | none yet |

Areas to come, each with its first skill: design, sales, support, operations, data, finance, legal, people. The naming rule and the steps are in [guide/adding.md](guide/adding.md).

## Skills

| Skill | Area | Tool family | What it does |
|---|---|---|---|
| [`marketing/skills/higgsfield-shorts-ad/`](marketing/skills/higgsfield-shorts-ad/) | Marketing | Higgsfield | Makes a vertical short-form AI ad from just a reference video and a product link: learns what makes the reference work and writes an original concept for the product, derives language, length, medium and the brand's typography itself, has the user approve generated cast portraits and a still first frame per shot, directs each performance, recommends the latest Kling or Seedance model with a credit estimate, animates one draft-quality take at a time, and adds captions, text and the end card with code-based editing. |

## Document sets

Directories of Markdown without a `SKILL.md`, read by an agent through `search` and `read_file` without any skill: playbooks, handbooks, product documentation. They live in [`docs/`](docs/) when they serve every area and in `<area>/docs/` when they serve one. None yet. As SkillCDN's document features grow (retrieval over larger sets, search that understands meaning), the document sets that exercise them go here.

## Tool families

| Family | What it is | How the user connects it | Documentation |
|---|---|---|---|
| Higgsfield | AI image, video and audio generation with a cloud sandbox for editing. | Add the Higgsfield MCP server to the agent. Skills check for the tools they need and ask for the server when it is missing. | [higgsfield.ai](https://higgsfield.ai) |

## Using a skill

1. Add an address above as a remote MCP server in your agent, install an area as a Claude Code plugin, or copy a skill folder into your agent's skills directory.
2. Ask for what the skill does, in your own words. The skill's `description` is what the agent matches on.
3. Connect the tools the skill names under "Requirements". A skill stops and asks when one is missing.

Skills that spend money or credits always estimate first and wait for your approval.

## Make it yours

This repository takes no pull requests. It is meant to be forked: the layout, the checks, the CI and the rules for agents come with the fork, and your skills go in.

1. Fork the repository, or copy it into a new one.
2. In `SKILLCDN.md`, set `name`, `description`, `translations` and `metadata.author` to yours. Keep the rules that hold for you; change the rest.
3. Keep the areas you need and delete the others. A new area is a folder with a `SKILLCDN.md` and a `README.md`; the steps are in [guide/adding.md](guide/adding.md).
4. Write your skills at `<area>/skills/<name>/`, following [guide/skill-authoring.md](guide/skill-authoring.md). Run `node scripts/check.mjs`; CI runs it on every push.
5. Rewrite this README for your repository. In `.claude-plugin/marketplace.json`, set `name` and `owner` to yours and list the areas that have skills.
6. Connect it at `skillcdn.ai/gh/<you>/<repo>`. A public repository needs no setup.

The rules for changing anything, for people and agents alike, are in [CLAUDE.md](CLAUDE.md); a fork keeps them or changes them. A skill here that no longer works can be reported in an issue.

## Repository layout

```
SKILLCDN.md       the repository manifest: name, description, document roots, the rules for every skill
README.md         this introduction
<area>/           one folder per area of work: marketing/, product/, engineering/, ...
  SKILLCDN.md     the area manifest: who its skills are for, the rules its skills add
  README.md       the area's catalog
  skills/<name>/  one directory per skill: SKILL.md, references/, assets/, optional scripts/
  docs/           the area's document sets
docs/             document sets that serve every area
guide/            how skills in this layout are written and how to add to a repository like this one
scripts/          check.mjs, the validation CI runs
.claude-plugin/   the Claude Code marketplace: one plugin per area with skills
```

What an agent connected through SkillCDN gets: the skills, the manifests and the document sets are discoverable with `browse` and `search`; this README, an area's README and the pages they link are readable on demand with `read_file`; everything else stays on the git host.

```sh
node scripts/check.mjs    # validates manifests, front-matter, catalogs, links and text; needs Node.js 24, no install
```

From a checkout of SkillCDN, `pnpm --filter @skillcdn/server run start check ../skills` reads the repository with the indexer itself and prints what an agent is told.

## License

The content of this repository is under the [MIT License](LICENSE.md). "SkillCDN" is a trademark of KDX Labs Corp. The tools the skills drive are third-party products with their own terms.

Built by KDX Labs. Copyright (c) 2026 KDX Labs Corp.
