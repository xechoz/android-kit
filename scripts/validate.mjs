import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { archive, components, stats } from '../src/data/registry.ts';
import { getSkills } from '../src/lib/skills.ts';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);

const statuses = new Set(['stable', 'beta', 'experimental', 'source-only']);
const demos = new Set(['runnable', 'skill-only']);
const platforms = new Set(['android', 'jvm', 'ios', 'js', 'wasm', 'native']);
const categories = new Set(['i18n', 'state', 'logging', 'architecture', 'webview']);

const slugs = new Set();
const parts = new Set();

for (const component of components) {
  if (slugs.has(component.slug)) fail(`duplicate component slug: ${component.slug}`);
  slugs.add(component.slug);

  if (parts.has(component.part)) fail(`duplicate part number: ${component.part}`);
  parts.add(component.part);

  if (!statuses.has(component.status)) fail(`${component.slug}: bad status ${component.status}`);
  if (!demos.has(component.demo)) fail(`${component.slug}: bad demo ${component.demo}`);
  if (!component.license) fail(`${component.slug}: missing license`);
  if (!component.tagline.zh || !component.tagline.en) fail(`${component.slug}: missing tagline`);
  if (!component.summary.zh || !component.summary.en) fail(`${component.slug}: missing summary`);
  if (component.features.zh.length === 0 || component.features.en.length === 0) {
    fail(`${component.slug}: missing features`);
  }
  if (component.categories.length === 0) fail(`${component.slug}: no categories`);
  for (const category of component.categories) {
    if (!categories.has(category)) fail(`${component.slug}: bad category ${category}`);
  }
  for (const platform of component.platforms) {
    if (!platforms.has(platform)) fail(`${component.slug}: bad platform ${platform}`);
  }
  if (component.artifact && !component.artifact.includes(':')) {
    fail(`${component.slug}: artifact should be group:name`);
  }

  for (const lang of ['zh', 'en']) {
    const file = path.join(root, 'src/content/components', lang, `${component.slug}.mdx`);
    if (!fs.existsSync(file)) {
      fail(`${component.slug}: missing ${lang} MDX`);
      continue;
    }
    const { data } = matter(fs.readFileSync(file, 'utf8'));
    if (data.locale !== lang) fail(`${file}: frontmatter locale is ${data.locale}`);
    if (!data.title) fail(`${file}: missing title`);
  }

  for (const lang of ['zh', 'en']) {
    const og = path.join(root, 'public/og', `${component.slug}-${lang}.png`);
    if (!fs.existsSync(og)) fail(`${component.slug}: missing OG image ${og}`);
  }
}

const skills = getSkills();
for (const skill of skills) {
  if (!skill.name) fail(`skill ${skill.slug}: missing name`);
  if (!skill.description) fail(`skill ${skill.slug}: missing description`);
  if (!skill.raw.startsWith('---')) fail(`skill ${skill.slug}: missing frontmatter`);
  if (skill.slug !== 'android-kit' && !slugs.has(skill.slug)) {
    fail(`skill ${skill.slug}: no matching component`);
  }
}

if (stats.libraries !== components.length) {
  fail(`stats.libraries is ${stats.libraries}, expected ${components.length}`);
}
if (stats.skills !== skills.length) {
  fail(`stats.skills is ${stats.skills}, expected ${skills.length}`);
}
if (stats.demos !== components.filter((component) => component.demo === 'runnable').length) {
  fail(`stats.demos does not match runnable components`);
}
if (archive.length !== 7) fail(`archive has ${archive.length} entries, expected 7`);

for (const entry of archive) {
  if (!entry.repo.startsWith('xechoz/')) fail(`archive ${entry.slug}: bad repo ${entry.repo}`);
  if (!entry.description.zh || !entry.description.en) {
    fail(`archive ${entry.slug}: missing localized description`);
  }
}

if (errors.length > 0) {
  console.error(`✗ validation failed (${errors.length})`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(
  `✓ ${components.length} components, ${skills.length} skills, ${archive.length} archive entries, ${components.filter((component) => component.demo === 'runnable').length} runnable demos`,
);
