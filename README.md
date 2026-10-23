# xechoz/android

A parts catalog for Android and Kotlin Multiplatform libraries, each with an installable Agent Skill and a browser-local demo builder.

Live preview: <https://xechoz.github.io/android-kit/>

## What is here

- `/components/` — five libraries with bilingual docs, versions, licenses, and constraints.
- `/skills/` — six Agent Skills (one umbrella + one per library) following the [Agent Skills spec](https://agentskills.io).
- `/builder/` — pick components, set a package name, and download a compilable Compose starter as a ZIP.
- `/registry.json` and `/llms.txt` — machine-readable catalog endpoints.

The site is bilingual (Chinese default, English under `/en/`). Skill files are English-only so they work across agents.

## Stack

Astro 7, Preact islands, Tailwind CSS 4, MDX, Shiki, JSZip. No backend and no analytics.

## Local development

```bash
npm install
npm run dev          # http://localhost:4321/android-kit/
npm run check        # astro check + registry/skill validation
npm run build
npm run preview
```

The default `base` is `/android-kit`; override it when needed:

```bash
SITE_URL=https://example.com BASE_PATH=/ npm run build
```

## Structure

```text
skills/<slug>/SKILL.md          Canonical Agent Skills
src/data/registry.ts            Components, archive, stats
src/content/components/<lang>/  Bilingual MDX docs
src/lib/starter.ts              Starter project generator (shared by the browser)
src/components/builder/         Preact composer + ZIP download
public/starter/                 Gradle wrapper assets embedded in generated ZIPs
scripts/validate.mjs            Catalog consistency checks
scripts/build-og.mjs            Open Graph image generator
```

## Generated starter

The ZIP contains a Gradle project with:

- Gradle wrapper, `settings.gradle.kts`, `build.gradle.kts`, `app/`
- Compose Material 3, with stateless `Screen` composables and `@Preview`s
- Real demos for LocaleKit and MVS when selected
- `TASK.md`, `AGENTS.md`, `components.json`, and the selected `skills/`

Verified with `./gradlew :app:assembleDebug` and `adb install` on an emulator.

## Deploy

GitHub Actions builds with `SITE_URL=https://xechoz.github.io` and `BASE_PATH=/android-kit`, then publishes `dist/` to GitHub Pages. The workflow is in `.github/workflows/deploy.yml`. The custom domain `android.xechoz.xyz` can be attached later without changing the build.

## License notes

- LocaleKit, Loga, and offline-web are Apache-2.0.
- MVS is GPL-3.0. Check compatibility before adding it to a commercial project.
- ServiceCenter has no LICENSE file in the upstream repository; treat it as unlicensed until that changes.
- Site content and code © xechoz.
