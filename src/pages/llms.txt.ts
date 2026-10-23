import type { APIRoute } from 'astro';
import { components, archive, stats } from '@/data/registry';
import { getSkills } from '@/lib/skills';
import { site, siteUrl } from '@/lib/site';

export const prerender = true;

const base = import.meta.env.BASE_URL;
const absolute = (path: string) => new URL(path.replace(/^\//, ''), `${siteUrl}${base}`).toString();

export const GET: APIRoute = () => {
  const lines = [
    `# ${site.name}`,
    '',
    '> Android and Kotlin Multiplatform components, each with an installable Agent Skill and a runnable demo builder.',
    '',
    `Site: ${absolute('/')}`,
    `Repository: ${site.repo}`,
    `Registry: ${absolute('/registry.json')}`,
    `Skills CLI: ${site.skillsInstall}`,
    '',
    '## Components',
    '',
    ...components.map(
      (component) =>
        `- [${component.name}](${absolute(`/components/${component.slug}/`)}) — ${component.summary.en} Artifact: ${component.artifact ?? 'source-only'} ${component.version}. minSdk ${component.minSdk}. License: ${component.license}.`,
    ),
    '',
    '## Skills',
    '',
    ...getSkills().map(
      (skill) =>
        `- [${skill.name}](${absolute(`/skills/${skill.slug}/`)}) — ${skill.description} Raw: ${absolute(`/skills/${skill.slug}/SKILL.md`)}`,
    ),
    '',
    '## Archive',
    '',
    ...archive.map((entry) => `- ${entry.name} (${entry.repo}) — ${entry.description.en}`),
    '',
    '## Notes',
    '',
    `- ${stats.libraries} components, ${stats.skills} skills, ${stats.demos} runnable demos.`,
    '- MVS is GPL-3.0. ServiceCenter has no LICENSE file. Read the component page before adding either to a commercial project.',
    '- The Composer generates a browser-local ZIP; no code is uploaded.',
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
