import type { APIRoute } from 'astro';
import { siteUrl } from '@/lib/site';

export const prerender = true;

const base = import.meta.env.BASE_URL;

export const GET: APIRoute = () =>
  new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap-index.xml', `${siteUrl}${base}`).toString()}\n`,
    {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    },
  );
