// Validates that this repository is in the SkillCDN Format. No dependencies: runs as `node scripts/check.mjs`.
//
// The format is specified in the SkillCDN repository (docs/specs/skill-repo.md). This script enforces its
// required points as far as they are mechanical:
//   1. The root has a SKILLCDN.md whose front-matter has a `description`, whose `documents` entries are
//      directories inside the repository, and whose `language` and `translations` are well formed.
//   2. Every SKILL.md has front-matter with a valid `name` and `description`, the name equals its directory,
//      the body starts with a level-one heading, and what SkillCDN adds under `skillcdn` (the files that
//      come with the skill, the translations) points at what exists and is well formed.
//   3. A skill links only inside its own directory (it may be mounted alone). A served document links only
//      to what is served: skills, declared document directories, the manifest.
//   4. No rendered media or binaries; JSON assets parse; text carries no control or invisible characters.
//   5. Every skill and every document set is listed in its catalog README and in the root README.
// Hidden entries (any path segment starting with a dot) are ignored, as the indexer ignores them.
//
// The indexer's own verdict, with the same parser and the same limits, comes from the `check` role of the
// SkillCDN image: from a checkout of SkillCDN, `pnpm --filter @skillcdn/server run start check <this dir>`.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
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

const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const LANGUAGE_TAG_RE = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8}){0,3}$/;
const FRONT_MATTER_MAX = 16_384;
const MANIFEST_MAX = 262_144;
const DESCRIPTION_MAX = 1024;
const SKILL_NAME_MAX = 64;
const SKILL_TITLE_MAX = 200;
const REPO_NAME_MAX = 100;
const DOCUMENTS_MAX = 20;
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

// The repository manifest. Returns the absolute paths of the declared document directories.
function checkRepoManifest(file) {
  if (!exists(file)) {
    fail(file, "missing: a repository in the SkillCDN Format has a SKILLCDN.md at its root");
    return [];
  }
  const text = readFileSync(file, "utf8");
  if (text.length > MANIFEST_MAX) fail(file, `manifest longer than ${MANIFEST_MAX} characters`);
  const parsed = parseFrontMatter(text, file);
  if (!parsed) return [];
  const { fields, body } = parsed;
  if (typeof fields.name === "string" && fields.name.length > REPO_NAME_MAX) fail(file, `name longer than ${REPO_NAME_MAX} characters`);
  checkDescription(file, fields.description);
  if (fields.language !== undefined && !LANGUAGE_TAG_RE.test(fields.language)) fail(file, `language: "${fields.language}" is not a language tag such as en or pt-BR`);
  checkTranslations(file, fields.translations, { name: REPO_NAME_MAX, description: DESCRIPTION_MAX });
  if (!/^\s*# /.test(body)) fail(file, "body should start with a level-one heading: the rules for every skill");
  const documents = fields.documents ?? [];
  if (!Array.isArray(documents)) {
    fail(file, "`documents` must be a sequence of directories");
    return [];
  }
  if (documents.length > DOCUMENTS_MAX) fail(file, `more than ${DOCUMENTS_MAX} document directories`);
  const dirs = [];
  for (const entry of documents) {
    const clean = entry.replace(/\/+$/, "");
    if (clean.split("/").includes("..") || clean.startsWith("/") || clean.includes("\\")) {
      fail(file, `documents entry must be a relative path inside the repository: ${entry}`);
      continue;
    }
    const abs = resolve(root, clean === "" ? "." : clean);
    if (!isDirectory(abs)) {
      fail(file, `documents entry is not a directory: ${entry}`);
      continue;
    }
    dirs.push(abs);
  }
  return dirs;
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
    if (dir !== root && name !== dir.split(sep).pop()) fail(file, `name "${name}" differs from its directory`);
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

function checkLinks(file, text, served) {
  const dir = dirname(file);
  const skillRoot = skillRootOf(file);
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
    } else if (!skillRoot && served.isServed(file) && !served.isServed(abs)) {
      // A served document is read through the mount, where only served paths can be followed.
      fail(file, `link leaves what is served (skills, declared documents, the manifest): ${target}`);
    } else if (!exists(abs)) {
      fail(file, `broken link: ${target}`);
    }
  }
}

function listedIn(catalog, dirName) {
  try {
    return readFileSync(catalog, "utf8").includes(`${dirName}/`);
  } catch {
    return false;
  }
}

// Every subdirectory of `dir` is an example that must appear in the catalog next to it and in the root README.
function checkCatalog(dir, label, needsManifest) {
  let count = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    count += 1;
    const item = join(dir, entry.name);
    if (needsManifest && !exists(join(item, "SKILL.md"))) fail(item, "skill directory without SKILL.md");
    if (!listedIn(join(dir, "README.md"), entry.name)) fail(item, `${label} not listed in ${toPosix(dir)}/README.md`);
    if (!listedIn(join(root, "README.md"), entry.name)) fail(item, `${label} not listed in the root README.md catalog`);
  }
  return count;
}

const manifest = join(root, "SKILLCDN.md");
const documentDirs = checkRepoManifest(manifest);
const files = walk(root);
const skillDirs = files.filter((f) => f.endsWith(`${sep}SKILL.md`)).map(dirname);
const served = {
  isServed: (abs) => abs === manifest || skillDirs.some((d) => inside(abs, d)) || documentDirs.some((d) => inside(abs, d)),
};

for (const file of files) {
  const rel = toPosix(file);
  if (MEDIA_RE.test(rel)) fail(file, "rendered media and images must not be committed");
  if (SECRET_RE.test(rel)) fail(file, "looks like a secret or environment file");
  if (!TEXT_RE.test(rel)) continue;
  const text = readFileSync(file, "utf8");
  checkText(file, text);
  if (MARKDOWN_RE.test(rel)) checkLinks(file, text, served);
  if (rel.endsWith("SKILL.md")) checkSkill(file, text);
  if (rel.endsWith(".json")) {
    try {
      JSON.parse(text);
    } catch (e) {
      fail(file, `invalid JSON: ${e.message}`);
    }
  }
}

const skillsDir = join(root, "skills");
const skillCount = isDirectory(skillsDir) ? checkCatalog(skillsDir, "skill", true) : 0;
let documentSets = 0;
for (const dir of documentDirs) documentSets += checkCatalog(dir, "document set", false);

if (errors.length) {
  console.error(`${errors.length} problem(s):\n${errors.map((e) => `  - ${e}`).join("\n")}`);
  process.exit(1);
}
console.log(`ok: ${skillCount} skill(s), ${documentSets} document set(s), ${files.length} file(s) checked`);
