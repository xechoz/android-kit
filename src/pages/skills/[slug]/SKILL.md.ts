import type { APIRoute } from 'astro';
import { getSkills } from '@/lib/skills';

export const prerender = true;

export function getStaticPaths() {
  return getSkills().map((skill) => ({
    params: { slug: skill.slug },
    props: { raw: skill.raw },
  }));
}

export const GET: APIRoute = ({ props }) =>
  new Response((props as { raw: string }).raw, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
