# Contributing

Thanks for your interest. This repository is the example content for SkillCDN and the reference repository for the SkillCDN Format, and it is public: every change to `main` is served to agents right away.

The rules for working here (conventions, checks, commits) are in [`CLAUDE.md`](CLAUDE.md), and the process for adding a skill or a document set is in [contributing/adding-examples.md](contributing/adding-examples.md). Both apply to people and AI agents alike. This file covers setup and the contribution process.

## Setup

You need Node.js 24. There is nothing to install.

```sh
node scripts/check.mjs    # must pass before every commit
```

To try a skill, you also need the tool it drives (for example, the Higgsfield MCP server) connected to an agent that reads `SKILL.md`.

## Process

1. Open an issue first for anything larger than a fix, so the shape can be agreed before you write it.
2. Make one logical change: one skill, one document set, or one fix. Update the catalogs.
3. Commit with [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): summary`.
4. Run `node scripts/check.mjs`.
5. **Maintainers** push directly to `main` (`git pull --rebase` first). **Everyone else:** fork, open a pull request against `main` and fill in the checklist.

Found a security problem in SkillCDN itself? Report it through the SkillCDN repository's security policy, not here.

## License of contributions

Contributions are accepted under the repository's [MIT License](LICENSE.md). By submitting a contribution you confirm that you wrote it or otherwise have the right to submit it under those terms. Do not submit content copied from sources whose license does not permit it, and do not include material about real people or real customers.
