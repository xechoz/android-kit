import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { components } from '../src/data/registry.ts';

const outDir = path.resolve('public/og');
await mkdir(outDir, { recursive: true });

const W = 1200;
const H = 630;

const palette = {
  bg: '#F3EFE4',
  surface: '#FAF7EE',
  ink: '#17160F',
  muted: '#6E695B',
  line: '#D6CEBB',
  accent: '#7AA2F7',
  accentText: '#3F6AA8',
};

const esc = (value) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const clip = (value, max) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);

function frame(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${palette.bg}"/>
  <rect x="28" y="28" width="${W - 56}" height="${H - 56}" fill="none" stroke="${palette.line}" stroke-width="1"/>
  <rect x="28" y="28" width="10" height="10" fill="${palette.accent}"/>
  <text x="64" y="82" font-family="Liberation Mono, monospace" font-size="22" letter-spacing="1" fill="${palette.ink}">xechoz<tspan fill="${palette.accent}">/</tspan>android</text>
  <text x="${W - 64}" y="82" text-anchor="end" font-family="Liberation Mono, monospace" font-size="14" letter-spacing="3" fill="${palette.muted}">ANDROID / KMP · OPEN SOURCE</text>
  <line x1="64" y1="112" x2="${W - 64}" y2="112" stroke="${palette.line}"/>
  ${inner}
</svg>`;
}

const defaultInner = `
  <text x="64" y="300" font-family="Liberation Serif, serif" font-size="108" fill="${palette.ink}">Android parts,</text>
  <text x="64" y="410" font-family="Liberation Serif, serif" font-size="108" fill="${palette.accentText}">ready to wire.</text>
  <text x="64" y="482" font-family="Liberation Sans, sans-serif" font-size="26" fill="${palette.muted}">Hand-picked libraries with agent-ready integration skills.</text>
  <line x1="64" y1="528" x2="${W - 64}" y2="528" stroke="${palette.line}"/>
  <text x="64" y="570" font-family="Liberation Mono, monospace" font-size="15" letter-spacing="1.5" fill="${palette.muted}">LOCALEKIT  ·  MVS  ·  LOGA  ·  SERVICECENTER  ·  OFFLINE WEB</text>
`;

await writeFile(path.join(outDir, 'default.png'), await sharp(Buffer.from(frame(defaultInner))).png().toBuffer());

for (const component of components) {
  for (const lang of ['zh', 'en']) {
    const isZh = lang === 'zh';
    const nameFont = isZh ? 'Noto Serif CJK SC, serif' : 'Liberation Serif, serif';
    const bodyFont = isZh ? 'Noto Sans CJK SC, sans-serif' : 'Liberation Sans, sans-serif';
    const tagline = clip(component.tagline[lang], isZh ? 26 : 52);
    const artifact = component.artifact ?? 'source-only / composite build';

    const inner = `
      <text x="64" y="190" font-family="Liberation Mono, monospace" font-size="15" letter-spacing="2" fill="${palette.muted}">${component.part} · ${component.status.toUpperCase()}</text>
      <text x="64" y="320" font-family="${nameFont}" font-size="104" fill="${palette.ink}">${esc(component.name)}</text>
      <text x="64" y="392" font-family="${bodyFont}" font-size="28" fill="${palette.muted}">${esc(tagline)}</text>
      <line x1="64" y1="470" x2="${W - 64}" y2="470" stroke="${palette.line}"/>
      <text x="64" y="518" font-family="Liberation Mono, monospace" font-size="18" fill="${palette.ink}">${esc(artifact)}</text>
      <text x="${W - 64}" y="518" text-anchor="end" font-family="Liberation Mono, monospace" font-size="16" fill="${palette.muted}">minSdk ${component.minSdk ?? '—'} · v${component.version}</text>
      <text x="64" y="570" font-family="Liberation Mono, monospace" font-size="14" letter-spacing="2" fill="${palette.muted}">${isZh ? 'ANDROID 组件与 AI 集成技能' : 'ANDROID COMPONENTS WITH AGENT SKILLS'}</text>
    `;

    const file = path.join(outDir, `${component.slug}-${lang}.png`);
    await writeFile(file, await sharp(Buffer.from(frame(inner))).png().toBuffer());
  }
}

console.log('OG images written to public/og');
