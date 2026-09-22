// Validates the content of this repository. No dependencies: runs on Node.js 24 as `node scripts/check.mjs`.
//
// What it checks:
//   1. Every SKILL.md has front-matter with a valid `name` and `description`, and the name matches its directory.
//   2. Every skill is listed in skills/README.md and the root README.md; every document set in documents/README.md.
//   3. Text files contain no control or invisible characters and no CRLF line endings.
//   4. Relative links in Markdown point at files that exist inside the repository, and links inside a
//      skill stay inside that skill's directory (a skill may be mounted alone).
//   5. JSON assets parse. No rendered media, binaries or secret-looking files are tracked.
//
// The rules mirror the skill-repo convention that SkillCDN applies when it indexes a repository, so a
// repository that passes here is served without warnings.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const toPosix = (path) => relative(root, path).split(sep).join("/");
const fail = (file, message) => errors.push(`${toPosix(file)}: ${message}`);

const SKIP_DIRS = new Set([".git", "node_modules", ".claude", ".github", ".vscode"]);
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const FRONT_MATTER_MAX = 16_384;
const MANIFEST_MAX = 262_144;
const DESCRIPTION_MAX = 1024;
const NAME_MAX = 64;
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
const MEDIA_RE = /\.(mp4|mov|mkv|webm|wav|mp3|m4a|aac|flac|png|jpe?g|gif|webp)$/i;
const SECRET_RE = /(^|\/)(\.env(\..*)?|.*\.(pem|key|p12|pfx))$/;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isSymbolicLink()) {
      fail(path, "symbolic links are not allowed");
    } else if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(path, out);
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

// Minimal front-matter reader: top-level `key: value` lines and one level of nested mapping. This is
// deliberately not a YAML parser; skills here keep their front-matter simple enough for one.
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
  const fields = {};
  let current = null;
  for (const raw of block.split("\n")) {
    if (!raw.trim() || raw.trimStart().startsWith("#")) continue;
    if (/^\s/.test(raw)) {
      const m = /^\s+([^:]+):\s*(.*)$/.exec(raw);
      if (!current || !m) {
        fail(file, `cannot read front-matter line: ${raw.trim()}`);
        return null;
      }
      fields[current][m[1].trim()] = unquote(m[2]);
      continue;
    }
    const m = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(raw);
    if (!m) {
      fail(file, `cannot read front-matter line: ${raw.trim()}`);
      return null;
    }
    const [, key, value] = m;
    if (key in fields) fail(file, `duplicate front-matter key: ${key}`);
    if (value === "") {
      fields[key] = {};
      current = key;
    } else {
      fields[key] = unquote(value);
      current = null;
    }
  }
  return fields;
}

function checkSkill(file, text) {
  if (text.length > MANIFEST_MAX) fail(file, `manifest longer than ${MANIFEST_MAX} characters`);
  const fields = parseFrontMatter(text, file);
  if (!fields) return;
  const { name, description } = fields;
  if (typeof name !== "string" || !name) {
    fail(file, "front-matter needs a `name`");
  } else {
    if (name.length > NAME_MAX) fail(file, `name longer than ${NAME_MAX} characters`);
    if (!NAME_RE.test(name)) fail(file, `name must be lowercase letters, digits and single hyphens: ${name}`);
    const dir = dirname(file);
    if (dir !== root && name !== dir.split(sep).pop()) fail(file, `name "${name}" differs from its directory`);
  }
  if (typeof description !== "string" || !description) {
    fail(file, "front-matter needs a `description`");
  } else if (description.length > DESCRIPTION_MAX) {
    fail(file, `description longer than ${DESCRIPTION_MAX} characters`);
  }
  if (!/\n---\n\s*# /.test(text)) fail(file, "body should start with a level-one heading");
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
  while (dir.startsWith(root)) {
    try {
      statSync(join(dir, "SKILL.md"));
      return dir;
    } catch {
      if (dir === root) return null;
      dir = dirname(dir);
    }
  }
  return null;
}

function checkLinks(file, text) {
  const dir = dirname(file);
  const skillRoot = skillRootOf(file);
  const re = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const m of text.matchAll(re)) {
    const target = m[1];
    if (/^([a-z][a-z0-9+.-]*:|#)/i.test(target)) continue;
    const path = target.split("#")[0];
    if (!path) continue;
    const abs = resolve(dir, decodeURIComponent(path));
    if (!abs.startsWith(root)) {
      fail(file, `link escapes the repository: ${target}`);
      continue;
    }
    // A skill may be mounted alone, so nothing it links to may live outside its own directory.
    if (skillRoot && !abs.startsWith(skillRoot + sep)) {
      fail(file, `link leaves the skill directory: ${target}`);
      continue;
    }
    try {
      statSync(abs);
    } catch {
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

function checkCatalog(parent, catalogName, needsManifest) {
  const dir = join(root, parent);
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  let count = 0;
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    count += 1;
    const item = join(dir, entry.name);
    if (needsManifest) {
      try {
        statSync(join(item, "SKILL.md"));
      } catch {
        fail(item, "skill directory without SKILL.md");
      }
    }
    if (!listedIn(join(dir, "README.md"), entry.name)) fail(item, `not listed in ${parent}/README.md`);
    if (!listedIn(join(root, "README.md"), entry.name)) fail(item, "not listed in the root README.md catalog");
  }
  return count;
}

const files = walk(root);
let skills = 0;

for (const file of files) {
  const rel = toPosix(file);
  if (MEDIA_RE.test(rel)) fail(file, "rendered media and images must not be committed");
  if (SECRET_RE.test(rel)) fail(file, "looks like a secret or environment file");
  if (!TEXT_RE.test(rel)) continue;
  const text = readFileSync(file, "utf8");
  checkText(file, text);
  if (MARKDOWN_RE.test(rel)) checkLinks(file, text);
  if (rel.endsWith("SKILL.md")) {
    skills += 1;
    checkSkill(file, text);
  }
  if (rel.endsWith(".json")) {
    try {
      JSON.parse(text);
    } catch (e) {
      fail(file, `invalid JSON: ${e.message}`);
    }
  }
}

checkCatalog("skills", "skills/README.md", true);
checkCatalog("documents", "documents/README.md", false);

if (errors.length) {
  console.error(`${errors.length} problem(s):\n${errors.map((e) => `  - ${e}`).join("\n")}`);
  process.exit(1);
}
console.log(`ok: ${skills} skill(s), ${files.length} file(s) checked`);
