# Document sets

Document sets that serve every area: directories of Markdown with no `SKILL.md`. This directory is declared in the repository manifest (`SKILLCDN.md`, `documents: [docs]`), so SkillCDN lists and searches everything here with `browse` and `search` and serves it with `read_file`, without any skill. A document set that serves one area lives in that area's `docs/` instead, discovered by default next to the area's manifest.

| Document set | What it is |
|---|---|
| *(none yet)* | The first sets will be the ones SkillCDN's document features grow on: a handbook or product documentation large enough to exercise retrieval and paging, and, as search that understands meaning arrives, sets written to be found by it. |

Every document carries a front-matter `title` and `description`, or starts with a level-one heading followed by one summary paragraph, because that is what search shows. Links stay within what an agent can reach through the mount: skills, manifests, document directories, and the README of a served folder.
