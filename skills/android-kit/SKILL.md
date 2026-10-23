---
name: android-kit
description: Choose and integrate xechoz's Android/KMP component libraries (LocaleKit, MVS, Loga, ServiceCenter, offline-web) into an app, or scaffold a runnable demo with one screen per component. Use when the user mentions xechoz/android-kit, any of these libraries, or asks to assemble a demo from multiple components.
metadata:
  version: "2026-10-23"
  catalog: https://xechoz.github.io/android-kit/registry.json
  source: https://github.com/xechoz/android-kit
---

# xechoz/android-kit

This is the umbrella skill for a small set of Android/Kotlin Multiplatform libraries. It routes to per-component skills and encodes the constraints between them.

## Catalog

| Skill | Artifact | Version | minSdk | License | Use when |
| --- | --- | --- | --- | --- | --- |
| `locale-kit` | `io.github.xechoz:locale` | 1.0.0 | 24 | Apache-2.0 | In-app language picker, Android 13+ app-language settings |
| `mvs` | `io.github.xechoz:mvs` | 1.1.0 | 26 | **GPL-3.0** | Minimal immutable state + repo |
| `loga` | `io.github.xechoz:loga` | 0.0.1 | 24 | Apache-2.0 | mmap-backed local logging, crash tail recovery |
| `service-center` | `io.github.xechoz:service-center` | 0.0.1 | 24 | **Unspecified** | KSP-generated service registry |
| `offline-web` | `io.github.xechoz:offline-web-core` | 0.1.0 | 21 | Apache-2.0 | Signed offline WebView bundles (source-only) |

Before integrating, flag the two license issues: MVS is GPL-3.0; ServiceCenter has no LICENSE file. Do not silently add them to a commercial project.

## Install the component skills

```bash
npx skills add xechoz/android-kit
```

Or one at a time:

```bash
npx skills add xechoz/android-kit --skill locale-kit
```

If a component skill is missing, fetch it directly:

```text
https://raw.githubusercontent.com/xechoz/android-kit/main/skills/<name>/SKILL.md
```

Then read the full skill before editing. This umbrella file only contains routing and cross-component rules.

## How to approach an integration

1. **Inspect the host project**: Gradle files, minSdk, Compose vs Views, existing DI/logging, and licenses already in use.
2. **Pick the component skill** from the table. Read it fully.
3. **Add one dependency at a time.** Run `./gradlew :app:assembleDebug` after each addition.
4. **Wire initialization** in the right place: `Application.onCreate` for Loga/offline-web, no init for LocaleKit, explicit `initialize()` for ServiceCenter.
5. **Build a small screen** that proves the component works. Do not stop at dependency resolution.
6. **Verify on a device/emulator** when possible: install, launch, exercise the screen.
7. **Report** what was added, which versions, and any license caveats.

## Constraints between components

- **minSdk**: MVS requires 26. If any selected component needs 26, the whole demo must use 26.
- **AppCompat**: LocaleKit requires the host Activity to extend `AppCompatActivity`. Compose can still use `setContent`.
- **KSP**: ServiceCenter requires the KSP plugin. It generates one registrar per module; keep module boundaries clean.
- **Server**: offline-web needs a bundling/signing server and is not on Maven Central. Do not include it in a "compiles offline" demo unless the server is available.
- **Licenses**: MVS (GPL-3.0), ServiceCenter (unspecified), LocaleKit/Loga/offline-web (Apache-2.0).
- **Experimental APIs**: Loga and ServiceCenter are `0.0.1`. Pin versions; do not upgrade opportunistically.

## Assembling a demo app

When asked to create a demo from selected components:

1. Read `TASK.md` / `components.json` in the generated starter if present.
2. Keep the provided Gradle setup and versions. Do not upgrade AGP, Kotlin, Compose, or the component versions.
3. Add one screen per selected component. Use a stateless `XxxScreen(state, callbacks)` plus a small route; add `@Preview(showBackground = true)` with mock data. Do not instantiate repos, ViewModels, or network clients in previews.
4. Reach every screen from the home list. Use simple state-based navigation unless the template already provides Navigation.
5. Compose plus AppCompat is allowed: `AppCompatActivity` + `setContent`.
6. Build after each component. If a component is blocked (license/server), stop and report instead of inventing a workaround.
7. Finish with `./gradlew :app:assembleDebug` and, if a device is attached, `adb install -r` + launch.

## Demo screen recipes

- **LocaleKit**: language list + "Follow system"; switch and confirm the UI changes. Needs `locales_config.xml` and `android:localeConfig`.
- **MVS**: counter or todo list; state via `RxState`, mutations via `RxRepo`, Compose collects `asFlow()`.
- **Loga**: buttons for levels, show the log directory, flush and report the file path.
- **ServiceCenter**: one interface + `@Service` implementation, `initialize()`, show the resolved value.
- **offline-web**: advanced; requires a server and signing keys. Prefer documenting the integration over fabricating a runnable screen.

## Rules

- Pin the versions above. Do not resolve "latest" dynamically.
- Do not modify unrelated app code.
- Do not add a DI framework, navigation library, or logging façade just to wire a demo.
- Do not claim an integration works without a build.
- Do not ignore a license warning.

## Reference

- Site: https://xechoz.github.io/android-kit/
- Machine-readable catalog: https://xechoz.github.io/android-kit/registry.json
- Source: https://github.com/xechoz/android-kit
- Agent Skills spec: https://agentskills.io
