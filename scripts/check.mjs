// Validates that this repository is in the SkillCDN Format. No dependencies: runs as `node scripts/check.mjs`.
//
// The format is specified in the SkillCDN repository (docs/specs/skill-repo.md). This script enforces its
// required points as far as they are mechanical, plus what this repository asks on top:
//   1. The root has a SKILLCDN.md, and so does every area. A manifest's front-matter has a `description`;
//      its `documents` entries are directories next to it; its `exclude` entries are plain paths that exist;
//      its `language` and `translations` are well formed; its body starts with a level-one heading.
//   2. Every SKILL.md has front-matter with a valid `name` and `description`, the name equals its directory,
//      the body starts with a level-one heading, and what SkillCDN adds under `skillcdn` (the files that
//      come with the skill, the translations) points at what exists and is well formed.
//   3. Every skill lives at <area>/skills/<name>, under an area manifest; none at the root.
//   4. A skill links only inside its own directory (it may be mounted alone). A served document links only
//      to what an agent can reach through the mount: skills, manifests, document directories, and the
//      README of a served folder.
//   5. No rendered media or binaries; JSON parses; text carries no control or invisible characters.
//   6. Every area, skill and document set is listed in its catalog README and in the root README, and every
//      area with skills is one plugin in .claude-plugin/marketplace.json.
// Hidden entries (any path segment starting with a dot) are ignored, as the indexer ignores them; the
// marketplace is the one hidden file this repository maintains by hand, so it is checked on its own.
//
// The indexer's own verdict, with the same parser and the same limits, comes from the `check` role of the
// SkillCDN image: from a checkout of SkillCDN, `pnpm --filter @skillcdn/server run start check <this dir>`.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const toPosix = (path) => relative(root, path).split(sep).join("/");
const fail = (file, message) => errors.push(`${toPosix(file) || "."}: ${message}`);
const inside = (path, dir) => path === dir || path.startsWith(dir + sep);
const isDirectory = (path) => {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
};
const exists = (path) => {
  try {
    statSync(path);
    return true;
  } catch {
    return false;
  }
};

const MANIFEST_FILE = "SKILLCDN.md";
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const LANGUAGE_TAG_RE = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8}){0,3}$/;
const README_RE = /^readme\.(md|markdown|mdx)$/i;
const FRONT_MATTER_MAX = 16_384;
const MANIFEST_MAX = 262_144;
const DESCRIPTION_MAX = 1024;
const SKILL_NAME_MAX = 64;
const SKILL_TITLE_MAX = 200;
const REPO_NAME_MAX = 100;
const DOCUMENTS_MAX = 20;
const EXCLUDE_MAX = 100;
const INCLUDE_MAX = 20;
const TRANSLATIONS_MAX = 32;
// C0 and C1 controls (except tab, LF, CR), soft hyphen, zero-width and directional marks, BOM.
// Built from code points on purpose: some editing tools decode escape sequences in source files, and an
// invisible character in this file is exactly what the check exists to catch.
const cp = (n) => String.fromCodePoint(n);
const range = (a, b) => `${cp(a)}-${cp(b)}`;
const INVISIBLE_RE = new RegExp(
  `[${range(0x00, 0x08)}${cp(0x0b)}${cp(0x0c)}${range(0x0e, 0x1f)}${range(0x7f, 0x9f)}${cp(0xad)}${range(0x200b, 0x200f)}${range(0x2028, 0x202e)}${range(0x2060, 0x2064)}${cp(0xfeff)}]`,
  "u",
);
const TEXT_RE = /\.(md|markdown|mdx|json|ya?ml|mjs|txt)$/i;
const MARKDOWN_RE = /\.(md|markdown|mdx)$/i;
const INCLUDABLE_RE = /\.(md|markdown|mdx|json)$/i;
const MEDIA_RE = /\.(mp4|mov|mkv|webm|wav|mp3|m4a|aac|flac|png|jpe?g|gif|webp)$/i;
const SECRET_RE = /(^|\/)(\.env(\..*)?|.*\.(pem|key|p12|pfx))$/;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isSymbolicLink()) {
      fail(path, "symbolic links are not allowed");
    } else if (entry.name.startsWith(".") || entry.name === "node_modules") {
      // Hidden: never served, never checked.
    } else if (entry.isDirectory()) {
      walk(path, out);
    } else {
      out.push(path);
    }
  }
  return out;
}

function unquote(value) {
  const v = value.trim();
  const quoted = (v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"));
  return quoted ? v.slice(1, -1) : v;
}

// The indexer reads front-matter with a real YAML parser. A plain (unquoted) scalar that YAML cannot parse
// is reported and the skill is not served. The two ways a prose value breaks YAML are a colon followed by
// a space and a space followed by a hash; a value that starts with an indicator character is the third.
function checkPlainScalar(file, key, raw) {
  const v = raw.trim();
  if (!v) return;
  const q = v[0];
  if (q === '"' || q === "'") {
    if (v.length < 2 || !v.endsWith(q)) fail(file, `${key}: unbalanced quotes`);
    return;
  }
  if (/[[\]{}&*!|>%@`]/.test(q)) fail(file, `${key}: a value starting with "${q}" must be quoted`);
  if (v.includes(": ") || v.endsWith(":")) fail(file, `${key}: a plain value cannot contain ": " (rephrase or quote it); the indexer would skip the file and say so`);
  if (v.includes(" #")) fail(file, `${key}: a plain value cannot contain " #" (quote it); YAML reads the rest of the line as a comment`);
}

// Minimal front-matter reader: nested mappings by indentation, and sequences of scalars. This is
// deliberately not a YAML parser; manifests here keep their front-matter simple enough for one, and the
// indexer's failsafe-schema parser accepts the same subset. Returns null after reporting a line it cannot read.
function parseFrontMatter(text, file) {
  if (!text.startsWith("---\n")) {
    fail(file, "no front-matter (file must start with ---)");
    return null;
  }
  const end = text.indexOf("\n---", 4);
  if (end < 0) {
    fail(file, "unterminated front-matter");
    return null;
  }
  const block = text.slice(4, end);
  if (block.length > FRONT_MATTER_MAX) fail(file, `front-matter longer than ${FRONT_MATTER_MAX} characters`);
  const lines = block
    .split("\n")
    .filter((raw) => raw.trim() && !raw.trimStart().startsWith("#"))
    .map((raw) => ({ indent: raw.length - raw.trimStart().length, text: raw.trim() }));
  let index = 0;
  let broken = false;
  const cannotRead = (line) => {
    if (!broken) fail(file, `cannot read front-matter line: ${line.text}`);
    broken = true;
  };

  // Reads the block whose lines sit at `indent`, a sequence of scalars or a mapping, stopping at the
  // first line that sits further left.
  function readBlock(indent, path) {
    const first = lines[index];
    if (first.text.startsWith("- ")) {
      const items = [];
      while (index < lines.length && lines[index].indent === indent) {
        const line = lines[index];
        if (!line.text.startsWith("- ")) {
          cannotRead(line);
          return null;
        }
        const raw = line.text.slice(2);
        checkPlainScalar(file, `${path} item`, raw);
        items.push(unquote(raw));
        index += 1;
      }
      if (index < lines.length && lines[index].indent > indent) {
        cannotRead(lines[index]);
        return null;
      }
      return items;
    }
    const mapping = {};
    while (index < lines.length && lines[index].indent === indent) {
      const line = lines[index];
      const m = /^([A-Za-z][\w-]*):(?:\s+(.*))?$/.exec(line.text);
      if (!m) {
        cannotRead(line);
        return null;
      }
      const [, key, value] = m;
      const keyPath = path ? `${path}.${key}` : key;
      if (key in mapping) fail(file, `duplicate front-matter key: ${keyPath}`);
      index += 1;
      if (value !== undefined && value !== "") {
        checkPlainScalar(file, keyPath, value);
        mapping[key] = unquote(value);
      } else if (index < lines.length && lines[index].indent > indent) {
        const nested = readBlock(lines[index].indent, keyPath);
        if (nested === null) return null;
        mapping[key] = nested;
      } else {
        mapping[key] = "";
      }
    }
    if (index < lines.length && lines[index].indent > indent) {
      cannotRead(lines[index]);
      return null;
    }
    return mapping;
  }

  if (lines.length === 0) return { fields: {}, body: text.slice(end + 4) };
  if (lines[0].indent !== 0) {
    cannotRead(lines[0]);
    return null;
  }
  const fields = readBlock(0, "");
  return fields === null ? null : { fields, body: text.slice(end + 4) };
}

const isMapping = (value) => typeof value === "object" && value !== null && !Array.isArray(value);

function checkDescription(file, description) {
  if (typeof description !== "string" || !description) fail(file, "front-matter needs a `description`");
  else if (description.length > DESCRIPTION_MAX) fail(file, `description longer than ${DESCRIPTION_MAX} characters`);
}

// `translations`: a language tag to the fields people see in that language. `rules` says which fields a
// translation may carry and how long each may be.
function checkTranslations(file, value, rules) {
  if (value === undefined) return;
  if (!isMapping(value)) {
    fail(file, "`translations` must be a mapping from language tags");
    return;
  }
  const tags = Object.keys(value);
  if (tags.length > TRANSLATIONS_MAX) fail(file, `more than ${TRANSLATIONS_MAX} translations`);
  for (const tag of tags) {
    if (!LANGUAGE_TAG_RE.test(tag)) fail(file, `translations: "${tag}" is not a language tag such as ko or pt-BR`);
    const entry = value[tag];
    if (!isMapping(entry)) {
      fail(file, `translations.${tag}: must be a mapping with ${Object.keys(rules).join(" and ")}`);
      continue;
    }
    let usable = 0;
    for (const [field, max] of Object.entries(rules)) {
      const text = entry[field];
      if (text === undefined) continue;
      if (typeof text !== "string" || !text) fail(file, `translations.${tag}.${field}: must be text`);
      else if (text.length > max) fail(file, `translations.${tag}.${field}: longer than ${max} characters`);
      else usable += 1;
    }
    if (usable === 0) fail(file, `translations.${tag}: translates nothing; expected ${Object.keys(rules).join(" or ")}`);
  }
}

// A path a manifest names, relative to its own directory: no absolute path, drive, backslash or `..`.
// Returns the cleaned path, or null after reporting.
function manifestPath(file, key, entry) {
  const clean = String(entry).trim().replace(/\/+$/, "");
  if (clean === "" || clean.startsWith("/") || clean.includes("\\") || /^[A-Za-z]:/.test(clean) || clean.split("/").includes("..")) {
    fail(file, `${key}: must be a relative path inside the manifest's directory: ${entry}`);
    return null;
  }
  return clean;
}

// A repository manifest (the root's or an area's). Returns its directory, the absolute paths of the
// document directories it declares (or the default `docs` next to it, when that exists), and the absolute
// paths it excludes.
function checkManifest(file) {
  const dir = dirname(file);
  const result = { dir, documentDirs: [], excluded: [] };
  const text = readFileSync(file, "utf8");
  if (text.length > MANIFEST_MAX) fail(file, `manifest longer than ${MANIFEST_MAX} characters`);
  const parsed = parseFrontMatter(text, file);
  if (!parsed) return result;
  const { fields, body } = parsed;
  if (typeof fields.name === "string" && fields.name.length > REPO_NAME_MAX) fail(file, `name longer than ${REPO_NAME_MAX} characters`);
  checkDescription(file, fields.description);
  if (fields.language !== undefined && !LANGUAGE_TAG_RE.test(fields.language)) fail(file, `language: "${fields.language}" is not a language tag such as en or pt-BR`);
  checkTranslations(file, fields.translations, { name: REPO_NAME_MAX, description: DESCRIPTION_MAX });
  if (!/^\s*# /.test(body)) fail(file, "body should start with a level-one heading: the rules for the skills below it");

  if (fields.documents === undefined) {
    const dflt = join(dir, "docs");
    if (isDirectory(dflt)) result.documentDirs.push(dflt);
  } else if (!Array.isArray(fields.documents)) {
    fail(file, "`documents` must be a sequence of directories");
  } else {
    if (fields.documents.length > DOCUMENTS_MAX) fail(file, `more than ${DOCUMENTS_MAX} document directories`);
    for (const entry of fields.documents) {
      const clean = manifestPath(file, "documents", entry);
      if (clean === null) continue;
      const abs = resolve(dir, clean);
      if (!isDirectory(abs)) fail(file, `documents entry is not a directory (the indexer would report it): ${entry}`);
      else result.documentDirs.push(abs);
    }
  }

  if (fields.exclude !== undefined) {
    if (!Array.isArray(fields.exclude)) {
      fail(file, "`exclude` must be a sequence of file or directory paths");
    } else {
      if (fields.exclude.length > EXCLUDE_MAX) fail(file, `more than ${EXCLUDE_MAX} excluded paths`);
      for (const entry of fields.exclude) {
        if (/[*?[\]{}]/.test(entry) || String(entry).startsWith("!")) {
          fail(file, `exclude: no globs or negation, only exact files or subtrees: ${entry}`);
          continue;
        }
        const clean = manifestPath(file, "exclude", entry);
        if (clean === null) continue;
        const abs = resolve(dir, clean);
        if (!exists(abs)) fail(file, `exclude: no such path (a typo would withhold nothing): ${entry}`);
        else result.excluded.push(abs);
      }
    }
  }
  return result;
}

// What SkillCDN adds under `skillcdn`: the files that come with the skill, and the translations.
function checkSkillcdnBlock(file, value) {
  if (value === undefined) return;
  if (!isMapping(value)) {
    fail(file, "`skillcdn` must be a mapping");
    return;
  }
  const dir = dirname(file);
  const include = value.include ?? [];
  if (!Array.isArray(include)) {
    fail(file, "`skillcdn.include` must be a sequence of file paths");
  } else {
    if (include.length > INCLUDE_MAX) fail(file, `skillcdn.include: more than ${INCLUDE_MAX} files`);
    for (const entry of include) {
      const segments = entry.split("/");
      if (entry.startsWith("/") || entry.includes("\\") || segments.some((s) => s === "" || s === "." || s === ".." || s.startsWith("."))) {
        fail(file, `skillcdn.include: not a plain relative path inside the skill: ${entry}`);
      } else if (!INCLUDABLE_RE.test(entry) || /(^|\/)SKILL\.md$/.test(entry)) {
        fail(file, `skillcdn.include: only Markdown or JSON files of the skill can come with it: ${entry}`);
      } else if (!exists(resolve(dir, entry))) {
        fail(file, `skillcdn.include: no such file: ${entry}`);
      }
    }
  }
  checkTranslations(file, value.translations, { title: SKILL_TITLE_MAX, description: DESCRIPTION_MAX });
}

function checkSkill(file, text) {
  if (text.length > MANIFEST_MAX) fail(file, `manifest longer than ${MANIFEST_MAX} characters`);
  const parsed = parseFrontMatter(text, file);
  if (!parsed) return;
  const { fields, body } = parsed;
  const { name } = fields;
  if (typeof name !== "string" || !name) {
    fail(file, "front-matter needs a `name`");
  } else {
    if (name.length > SKILL_NAME_MAX) fail(file, `name longer than ${SKILL_NAME_MAX} characters`);
    if (!NAME_RE.test(name)) fail(file, `name must be lowercase letters, digits and single hyphens: ${name}`);
    const dir = dirname(file);
    if (dir !== root && name !== basename(dir)) fail(file, `name "${name}" differs from its directory`);
  }
  checkDescription(file, fields.description);
  checkSkillcdnBlock(file, fields.skillcdn);
  if (!/^\s*# /.test(body)) fail(file, "body should start with a level-one heading");
}

function checkText(file, text) {
  text.split("\n").forEach((line, i) => {
    if (INVISIBLE_RE.test(line)) fail(file, `line ${i + 1}: control or invisible character`);
    if (line.endsWith("\r")) fail(file, `line ${i + 1}: CRLF line ending`);
  });
}

// The nearest ancestor directory that holds a SKILL.md, or null when the file is not inside a skill.
function skillRootOf(file) {
  let dir = dirname(file);
  for (;;) {
    if (exists(join(dir, "SKILL.md"))) return dir;
    if (dir === root) return null;
    dir = dirname(dir);
  }
}

function listedIn(catalog, needle) {
  try {
    return readFileSync(catalog, "utf8").includes(needle);
  } catch {
    return false;
  }
}

// The layout: every manifest, every skill, and what an agent can reach through the mount.

const rootManifest = join(root, MANIFEST_FILE);
if (!exists(rootManifest)) fail(rootManifest, "missing: a repository in the SkillCDN Format has a SKILLCDN.md at its root");
const files = walk(root);
const manifestFiles = files.filter((f) => basename(f) === MANIFEST_FILE);
const manifests = manifestFiles.map(checkManifest);
const areaDirs = manifests.map((m) => m.dir).filter((d) => d !== root);
const documentDirs = manifests.flatMap((m) => m.documentDirs);
const excluded = manifests.flatMap((m) => m.excluded);
const skillDirs = files.filter((f) => basename(f) === "SKILL.md").map(dirname);
const rootReadme = join(root, "README.md");

const isExcluded = (abs) => excluded.some((e) => inside(abs, e));
// Discoverable through browse_repo and search_repo: the manifests, the skills and the declared document directories.
const isDiscoverable = (abs) =>
  !isExcluded(abs) && (manifestFiles.includes(abs) || skillDirs.some((d) => inside(abs, d)) || documentDirs.some((d) => inside(abs, d)));
// A folder is exposed when it is the root, holds a manifest, or lies on the path to a skill or a document.
const isExposedDir = (dir) =>
  !isExcluded(dir) &&
  (dir === root || manifests.some((m) => m.dir === dir) || skillDirs.some((d) => inside(d, dir)) || documentDirs.some((d) => inside(d, dir) || inside(dir, d)));
// The README of an exposed folder is readable on demand, as an optional overview.
const isOverview = (abs) => README_RE.test(basename(abs)) && isExposedDir(dirname(abs));
const isReachable = (abs) => isDiscoverable(abs) || isOverview(abs) || (isDirectory(abs) && isExposedDir(abs));

function checkLinks(file, text) {
  const dir = dirname(file);
  const skillRoot = skillRootOf(file);
  // A manifest or a document under a declared directory is read through the mount, where only what is
  // served can be followed. READMEs and guide pages are for the git host and may link anywhere inside.
  const servedDocument = !skillRoot && isDiscoverable(file);
  const re = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const m of text.matchAll(re)) {
    const target = m[1];
    if (/^([a-z][a-z0-9+.-]*:|#)/i.test(target)) continue;
    const path = target.split("#")[0];
    if (!path) continue;
    const abs = resolve(dir, decodeURIComponent(path));
    if (!inside(abs, root)) {
      fail(file, `link escapes the repository: ${target}`);
    } else if (skillRoot && !inside(abs, skillRoot)) {
      // A skill may be mounted alone, so nothing it links to may live outside its own directory.
      fail(file, `link leaves the skill directory: ${target}`);
    } else if (servedDocument && !isReachable(abs)) {
      fail(file, `link leaves what an agent can reach through the mount (skills, manifests, document directories, the README of a served folder): ${target}`);
    } else if (!exists(abs)) {
      fail(file, `broken link: ${target}`);
    }
  }
}

for (const file of files) {
  const rel = toPosix(file);
  if (MEDIA_RE.test(rel)) fail(file, "rendered media and images must not be committed");
  if (SECRET_RE.test(rel)) fail(file, "looks like a secret or environment file");
  if (!TEXT_RE.test(rel)) continue;
  const text = readFileSync(file, "utf8");
  checkText(file, text);
  if (MARKDOWN_RE.test(rel)) checkLinks(file, text);
  if (rel.endsWith("SKILL.md")) checkSkill(file, text);
  if (rel.endsWith(".json")) {
    try {
      JSON.parse(text);
    } catch (e) {
      fail(file, `invalid JSON: ${e.message}`);
    }
  }
}

// Placement: every skill at <area>/skills/<name>, under an area manifest; nothing under a root skills/.
for (const skillDir of skillDirs) {
  const parent = dirname(skillDir);
  if (basename(parent) !== "skills" || !areaDirs.includes(dirname(parent))) fail(skillDir, "a skill lives at <area>/skills/<name>, under an area with a SKILLCDN.md");
  if (isExcluded(skillDir)) fail(skillDir, "skill inside an excluded path would not be served");
}
if (isDirectory(join(root, "skills"))) fail(join(root, "skills"), "skills live under an area: <area>/skills/<name>");

// Catalogs: areas and their skills, then document sets.
const areaSkillCount = (area) => skillDirs.filter((d) => dirname(d) === join(area, "skills")).length;
for (const area of areaDirs) {
  const name = basename(area);
  if (dirname(area) !== root) fail(area, "an area is a directory at the repository root");
  if (!NAME_RE.test(name)) fail(area, `area directory must be lowercase letters, digits and single hyphens: ${name}`);
  if (!exists(join(area, "README.md"))) fail(area, "area without a README.md catalog");
  if (!listedIn(rootReadme, `${name}/`)) fail(area, "area not listed in the root README.md");
  const skills = join(area, "skills");
  if (!isDirectory(skills)) continue;
  for (const entry of readdirSync(skills, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const item = join(skills, entry.name);
    if (!exists(join(item, "SKILL.md"))) fail(item, "skill directory without SKILL.md");
    if (!listedIn(join(area, "README.md"), `${entry.name}/`)) fail(item, `skill not listed in ${toPosix(area)}/README.md`);
    if (!listedIn(rootReadme, `${entry.name}/`)) fail(item, "skill not listed in the root README.md catalog");
  }
}
let documentSets = 0;
for (const dir of documentDirs) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    documentSets += 1;
    const item = join(dir, entry.name);
    if (!listedIn(join(dir, "README.md"), `${entry.name}/`)) fail(item, `document set not listed in ${toPosix(dir)}/README.md`);
    if (!listedIn(rootReadme, `${entry.name}/`)) fail(item, "document set not listed in the root README.md catalog");
  }
}

// The Claude Code marketplace: one plugin per area with skills, named after the area, sourcing its folder.
function checkMarketplace() {
  const file = join(root, ".claude-plugin", "marketplace.json");
  if (!exists(file)) {
    fail(file, "missing: one Claude Code plugin per area with skills");
    return;
  }
  const text = readFileSync(file, "utf8");
  checkText(file, text);
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    fail(file, `invalid JSON: ${e.message}`);
    return;
  }
  if (!isMapping(data)) {
    fail(file, "must be an object with name, owner and plugins");
    return;
  }
  if (typeof data.name !== "string" || !NAME_RE.test(data.name)) fail(file, "name must be lowercase letters, digits and single hyphens");
  if (!isMapping(data.owner) || typeof data.owner.name !== "string" || !data.owner.name) fail(file, "owner.name is required");
  if (!Array.isArray(data.plugins)) {
    fail(file, "`plugins` must be an array");
    return;
  }
  const listed = new Set();
  for (const plugin of data.plugins) {
    if (!isMapping(plugin)) {
      fail(file, "each plugin is an object with name and source");
      continue;
    }
    const label = typeof plugin.name === "string" ? plugin.name : "?";
    if (typeof plugin.name !== "string" || !NAME_RE.test(plugin.name)) fail(file, `plugin "${label}": name must be lowercase letters, digits and single hyphens`);
    if (typeof plugin.source !== "string" || !plugin.source.startsWith("./")) {
      fail(file, `plugin "${label}": source must be a relative path such as ./marketing`);
      continue;
    }
    const abs = resolve(root, plugin.source);
    if (!areaDirs.includes(abs)) {
      fail(file, `plugin "${label}": source is not an area (a root directory with a SKILLCDN.md): ${plugin.source}`);
      continue;
    }
    if (plugin.name !== basename(abs)) fail(file, `plugin "${label}": name differs from its area directory ${basename(abs)}`);
    if (listed.has(abs)) fail(file, `plugin "${label}": area listed twice`);
    listed.add(abs);
    if (areaSkillCount(abs) === 0) fail(file, `plugin "${label}": the area has no skills yet; add the entry with its first skill`);
  }
  for (const area of areaDirs) {
    if (areaSkillCount(area) > 0 && !listed.has(area)) fail(file, `area with skills is not a plugin: ${toPosix(area)}`);
  }
}
checkMarketplace();

if (errors.length) {
  console.error(`${errors.length} problem(s):\n${errors.map((e) => `  - ${e}`).join("\n")}`);
  process.exit(1);
}
console.log(`ok: ${areaDirs.length} area(s), ${skillDirs.length} skill(s), ${documentSets} document set(s), ${files.length} file(s) checked`);
