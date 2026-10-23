import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const site = process.env.SITE_URL ?? 'https://xechoz.github.io';
const base = process.env.BASE_PATH ?? '/android-kit';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: [mdx(), preact(), sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'vitesse-dark',
      wrap: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
