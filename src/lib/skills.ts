import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export interface SkillMeta {
  slug: string;
  name: string;
  description: string;
  metadata: Record<string, string>;
  body: string;
  raw: string;
}

const skillsDir = path.join(process.cwd(), 'skills');

function stringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      entry instanceof Date ? entry.toISOString().slice(0, 10) : String(entry),
    ]),
  );
}

export function getSkills(): SkillMeta[] {
  const skills = fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const file = path.join(skillsDir, entry.name, 'SKILL.md');
      const raw = fs.readFileSync(file, 'utf8');
      const { data, content } = matter(raw);

      return {
        slug: entry.name,
        name: String(data.name ?? entry.name),
        description: String(data.description ?? ''),
        metadata: stringRecord(data.metadata),
        body: content,
        raw,
      } satisfies SkillMeta;
    });

  return skills.sort((a, b) => {
    if (a.slug === 'android-kit') return -1;
    if (b.slug === 'android-kit') return 1;
    return a.slug.localeCompare(b.slug);
  });
}

export function getSkill(slug: string): SkillMeta | undefined {
  return getSkills().find((skill) => skill.slug === slug);
}
