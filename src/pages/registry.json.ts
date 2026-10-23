import type { APIRoute } from 'astro';
import { components, archive, stats } from '@/data/registry';
import { getSkills } from '@/lib/skills';
import { site, siteUrl } from '@/lib/site';

export const prerender = true;

const base = import.meta.env.BASE_URL;
const absolute = (path: string) => new URL(path.replace(/^\//, ''), `${siteUrl}${base}`).toString();

export const GET: APIRoute = () => {
  const payload = {
    schemaVersion: 1,
    generatedBy: site.name,
    repository: site.repo,
    site: absolute('/'),
    stats,
    components: components.map((component) => ({
      ...component,
      docsUrl: absolute(`/components/${component.slug}/`),
      skillUrl: absolute(`/skills/${component.slug}/SKILL.md`),
    })),
    skills: getSkills().map((skill) => ({
      slug: skill.slug,
      name: skill.name,
      description: skill.description,
      metadata: skill.metadata,
      url: absolute(`/skills/${skill.slug}/`),
      rawUrl: absolute(`/skills/${skill.slug}/SKILL.md`),
    })),
    archive,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
