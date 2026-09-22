# documents/

Example document sets: directories of Markdown with no `SKILL.md`. SkillCDN lists and searches them (`find`) and serves them (`read_file`) without any skill. They show what an agent gets when it is pointed at plain documentation, such as a product's developer docs or a team handbook.

| Document set | What it is |
|---|---|
| *(none yet)* | Planned: a developer documentation set for a fictional product, to demonstrate search and paging over ordinary docs. |

How to add one: [docs/adding-examples.md](../docs/adding-examples.md), "A new document set". Give every document a front-matter `title` and `description`, or a level-one heading followed by one summary paragraph, because that is what search shows. The `node scripts/check.mjs` check fails when a directory here is missing from this table.
