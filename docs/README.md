# Document sets

Example document sets: directories of Markdown with no `SKILL.md`. This directory is declared in the repository manifest (`SKILLCDN.md`, `documents: [docs]`), so SkillCDN lists and searches everything here with `find` and serves it with `read_file`, without any skill. They show what an agent gets when it is pointed at plain documentation, such as a product's developer docs or a team handbook.

| Document set | What it is |
|---|---|
| *(none yet)* | Planned: a developer documentation set for a fictional product, to demonstrate search and paging over ordinary docs. |

Every document carries a front-matter `title` and `description`, or starts with a level-one heading followed by one summary paragraph, because that is what search shows. Links stay within what is served: this directory, the skills, the manifest.
