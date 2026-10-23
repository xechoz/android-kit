export interface StarterComponent {
  slug: string;
  name: string;
  artifact: string | null;
  version: string;
  minSdk: number | null;
  license: string;
  demo: 'runnable' | 'skill-only';
  tagline: string;
}

export interface StarterSkill {
  slug: string;
  raw: string;
}

export interface StarterOptions {
  appName: string;
  packageName: string;
  components: StarterComponent[];
  skills: StarterSkill[];
}

export interface GeneratedProject {
  files: Record<string, string>;
  dependencies: string[];
  runnable: StarterComponent[];
  skillOnly: StarterComponent[];
}

const COMPOSE_BOM = '2026.09.00';
const ACTIVITY_COMPOSE = '1.13.0';
const APPCOMPAT = '1.7.1';
const KOTLIN = '2.4.10';
const AGP = '9.4.0';
const GRADLE = '9.7.1';
const COMPILE_SDK = 37;
const MIN_SDK = 26;

const escapeKotlin = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$');

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const rootName = (appName: string) => appName.replace(/[^A-Za-z0-9_-]/g, '') || 'AndroidKitDemo';

function sourcePath(packageName: string, relative: string): string {
  return `app/src/main/java/${packageName.replace(/\./g, '/')}/${relative}`;
}

function buildGradle(
  packageName: string,
  hasLocale: boolean,
  hasMvs: boolean,
): string {
  const deps = [
    `    implementation(platform("androidx.compose:compose-bom:${COMPOSE_BOM}"))`,
    `    implementation("androidx.activity:activity-compose:${ACTIVITY_COMPOSE}")`,
    '    implementation("androidx.compose.ui:ui")',
    '    implementation("androidx.compose.ui:ui-tooling-preview")',
    '    implementation("androidx.compose.material3:material3")',
    '    debugImplementation("androidx.compose.ui:ui-tooling")',
  ];

  if (hasLocale) {
    deps.push(`    implementation("androidx.appcompat:appcompat:${APPCOMPAT}")`);
    deps.push('    implementation("io.github.xechoz:locale:1.0.0")');
  }

  if (hasMvs) {
    deps.push('    implementation("io.github.xechoz:mvs:1.1.0")');
  }

  return `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "${packageName}"
    compileSdk = ${COMPILE_SDK}

    defaultConfig {
        applicationId = "${packageName}"
        minSdk = ${MIN_SDK}
        targetSdk = ${COMPILE_SDK}
        versionCode = 1
        versionName = "1.0"
    }

    buildFeatures {
        compose = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
${deps.join('\n')}
}
`;
}

function mainActivity(
  appName: string,
  packageName: string,
  hasLocale: boolean,
  hasMvs: boolean,
): string {
  const base = hasLocale ? 'AppCompatActivity' : 'ComponentActivity';
  const imports = [
    'android.os.Bundle',
    hasLocale
      ? 'androidx.appcompat.app.AppCompatActivity'
      : 'androidx.activity.ComponentActivity',
    'androidx.activity.compose.setContent',
    'androidx.compose.foundation.layout.Arrangement',
    'androidx.compose.foundation.layout.Column',
    'androidx.compose.foundation.layout.fillMaxSize',
    'androidx.compose.foundation.layout.padding',
    'androidx.compose.foundation.rememberScrollState',
    'androidx.compose.foundation.verticalScroll',
    'androidx.compose.material3.MaterialTheme',
    'androidx.compose.material3.Surface',
    'androidx.compose.material3.Text',
    'androidx.compose.runtime.Composable',
    'androidx.compose.ui.Modifier',
    'androidx.compose.ui.unit.dp',
    ...(hasLocale ? [`${packageName}.demo.LocaleRoute`] : []),
    ...(hasMvs ? [`${packageName}.demo.MvsRoute`] : []),
    `${packageName}.ui.theme.AndroidKitTheme`,
  ];

  const demoLines = [
    hasLocale ? '        LocaleRoute()' : '',
    hasMvs ? '        MvsRoute()' : '',
  ]
    .filter(Boolean)
    .join('\n');

  const content = demoLines
    ? demoLines
    : `            Text(
                text = "The selected components are skill-only. Read TASK.md and add the integration code you need.",
                style = MaterialTheme.typography.bodyMedium,
            )`;

  return `package ${packageName}

${imports.map((entry) => `import ${entry}`).join('\n')}

class MainActivity : ${base}() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AndroidKitTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    DemoContent()
                }
            }
        }
    }
}

@Composable
private fun DemoContent() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp),
    ) {
        Text(
            text = "${escapeKotlin(appName)}",
            style = MaterialTheme.typography.headlineMedium,
        )
        Text(
            text = "Generated from xechoz/android-kit",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
${content}
    }
}
`;
}

function localeDemo(packageName: string): string {
  return `package ${packageName}.demo

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import ${packageName}.ui.theme.AndroidKitTheme
import java.util.Locale
import me.xechoz.localekit.AppLanguage
import me.xechoz.localekit.AppLanguagePreference
import me.xechoz.localekit.LanguageOption
import me.xechoz.localekit.SystemLanguage

@Composable
fun LocaleRoute() {
    val context = LocalContext.current
    val options = remember { AppLanguage.available(context) }
    val current = AppLanguage.current()
    val systemLanguage = remember {
        SystemLanguage.current(context).joinToString(" / ") { it.displayName }
    }

    LocaleScreen(
        options = options,
        current = current,
        systemLanguage = systemLanguage,
        onSelect = { AppLanguage.set(it) },
        onOpenSystemSettings = { SystemLanguage.openSettings(context) },
    )
}

@Composable
fun LocaleScreen(
    options: List<LanguageOption>,
    current: AppLanguagePreference,
    systemLanguage: String,
    onSelect: (AppLanguagePreference) -> Unit,
    onOpenSystemSettings: () -> Unit,
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(text = "LocaleKit", style = MaterialTheme.typography.titleLarge)
        Text(
            text = "In-app language",
            style = MaterialTheme.typography.labelLarge,
        )

        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            FilterChip(
                selected = current == AppLanguagePreference.FollowSystem,
                onClick = { onSelect(AppLanguagePreference.FollowSystem) },
                label = { Text("Follow system") },
            )

            options.forEach { option ->
                FilterChip(
                    selected = current is AppLanguagePreference.Explicit &&
                        current.locale == option.locale,
                    onClick = {
                        onSelect(AppLanguagePreference.Explicit(option.locale))
                    },
                    label = { Text(option.label) },
                )
            }
        }

        Text(
            text = "System language: " + systemLanguage,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        TextButton(onClick = onOpenSystemSettings) {
            Text("Open system language settings")
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun LocaleScreenPreview() {
    AndroidKitTheme {
        LocaleScreen(
            options = listOf(
                LanguageOption(Locale.ENGLISH, "English"),
                LanguageOption(Locale.SIMPLIFIED_CHINESE, "Chinese"),
            ),
            current = AppLanguagePreference.FollowSystem,
            systemLanguage = "English",
            onSelect = {},
            onOpenSystemSettings = {},
        )
    }
}
`;
}

function mvsDemo(packageName: string): string {
  return `package ${packageName}.demo

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import ${packageName}.ui.theme.AndroidKitTheme
import xyz.icode.mvs.RxRepo
import xyz.icode.mvs.RxState

data class CounterState(val count: Int = 0) : RxState

class CounterRepo : RxRepo<CounterState> by RxRepo(initState = CounterState()) {
    fun increment() {
        setState {
            copy(count = count + 1)
        }
    }

    fun reset() {
        setState {
            copy(count = 0)
        }
    }
}

@Composable
fun MvsRoute() {
    val repo = remember { CounterRepo() }
    var count by remember { mutableIntStateOf(0) }

    LaunchedEffect(repo) {
        repo.onEach(CounterState::count) { count = it }
    }

    MvsScreen(
        count = count,
        onIncrement = repo::increment,
        onReset = repo::reset,
    )
}

@Composable
fun MvsScreen(
    count: Int,
    onIncrement: () -> Unit,
    onReset: () -> Unit,
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(text = "MVS", style = MaterialTheme.typography.titleLarge)
        Text(
            text = "Minimal Redux over Coroutines Flow",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text(
            text = "$count",
            style = MaterialTheme.typography.displayLarge,
            modifier = Modifier.padding(vertical = 4.dp),
        )
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = onIncrement) {
                Text("Increment")
            }
            OutlinedButton(onClick = onReset) {
                Text("Reset")
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun MvsScreenPreview() {
    AndroidKitTheme {
        MvsScreen(count = 3, onIncrement = {}, onReset = {})
    }
}
`;
}

function themeFile(packageName: string): string {
  return `package ${packageName}.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColors = lightColorScheme(
    primary = Color(0xFFC8452B),
    onPrimary = Color.White,
    secondary = Color(0xFF1F7A4D),
    background = Color(0xFFF3EFE4),
    surface = Color(0xFFFAF7EE),
    onBackground = Color(0xFF17160F),
    onSurface = Color(0xFF17160F),
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFFE26A4A),
    onPrimary = Color(0xFF17160F),
    secondary = Color(0xFF5FBF8A),
    background = Color(0xFF121210),
    surface = Color(0xFF1A1915),
    onBackground = Color(0xFFF1EADA),
    onSurface = Color(0xFFF1EADA),
)

@Composable
fun AndroidKitTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        content = content,
    )
}
`;
}

function manifest(hasLocale: boolean): string {
  return `<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application
        android:allowBackup="true"
        android:label="@string/app_name"
        android:supportsRtl="true"
        android:theme="@style/Theme.AndroidKit"${hasLocale ? '\n        android:localeConfig="@xml/locales_config"' : ''}>

        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
`;
}

function taskBrief(
  appName: string,
  packageName: string,
  components: StarterComponent[],
  runnable: StarterComponent[],
  skillOnly: StarterComponent[],
): string {
  const lines = components.map(
    (component) =>
      `- ${component.name} (\`${component.slug}\`) — ${component.artifact ?? 'source-only'} ${component.version} · minSdk ${component.minSdk ?? 'n/a'} · ${component.license}`,
  );

  return `# Task: finish this Android Kit starter

Generated by https://xechoz.github.io/android-kit/builder/ for \`${packageName}\`.

App name: **${appName}**

## Selected components

${lines.join('\n')}

Runnable demos: ${runnable.length > 0 ? runnable.map((item) => item.name).join(', ') : 'none'}
Skill-only entries: ${skillOnly.length > 0 ? skillOnly.map((item) => item.name).join(', ') : 'none'}

## Read first

1. \`skills/android-kit/SKILL.md\` — catalog, license warnings, constraints.
${components
  .map((component, index) => `${index + 2}. \`skills/${component.slug}/SKILL.md\` — integration steps for ${component.name}.`)
  .join('\n')}

## Constraints

- minSdk is ${MIN_SDK}; keep it unless the selected libraries require otherwise.
- If LocaleKit is selected, MainActivity must stay an \`AppCompatActivity\`.
- MVS is GPL-3.0. Do not add it to a commercial project without checking the license.
- ServiceCenter has no LICENSE file. Treat it as unlicensed until the upstream repo adds one.
- offline-web needs a server and is not a runnable demo; use its skill for the integration steps.
- Keep generated Compose screens stateless: a \`Screen\` composable with mock data in \`@Preview\`, plus a \`Route\` that owns state.

## Verify

\`\`\`bash
./gradlew :app:assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
\`\`\`

If the build fails because the Android SDK is missing, create \`local.properties\`:

\`\`\`properties
sdk.dir=/path/to/Android/Sdk
\`\`\`
`;
}

function agentsBrief(packageName: string, components: StarterComponent[]): string {
  return `# Agent instructions

This is a generated Android starter for \`${packageName}\`.

- Read \`skills/android-kit/SKILL.md\` before changing dependencies.
- Read the per-component skill for every selection:
${components.map((component) => `  - \`skills/${component.slug}/SKILL.md\``).join('\n')}
- Keep the existing stateless \`Screen\` + \`Route\` split and keep one \`@Preview\` per screen.
- Do not upgrade AGP, Kotlin, Compose, or the component versions unless the user asks.
- Verify with \`./gradlew :app:assembleDebug\`.
- If a selected component is skill-only, add its integration deliberately; do not assume a demo screen exists.
`;
}

export function generateProject(options: StarterOptions): GeneratedProject {
  const { appName, packageName, components, skills } = options;
  const hasLocale = components.some((component) => component.slug === 'locale-kit');
  const hasMvs = components.some((component) => component.slug === 'mvs');
  const runnable = components.filter((component) => component.demo === 'runnable');
  const skillOnly = components.filter((component) => component.demo === 'skill-only');

  const dependencies = [
    'androidx.compose:compose-bom',
    'androidx.activity:activity-compose',
    'androidx.compose.ui:ui',
    'androidx.compose.ui:ui-tooling-preview',
    'androidx.compose.material3:material3',
    ...(hasLocale ? ['androidx.appcompat:appcompat', 'io.github.xechoz:locale'] : []),
    ...(hasMvs ? ['io.github.xechoz:mvs'] : []),
  ];

  const files: Record<string, string> = {
    'settings.gradle.kts': `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "${rootName(appName)}"
include(":app")
`,
    'build.gradle.kts': `plugins {
    id("com.android.application") version "${AGP}" apply false
    id("org.jetbrains.kotlin.plugin.compose") version "${KOTLIN}" apply false
}
`,
    'gradle.properties': `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
`,
    'gradle/wrapper/gradle-wrapper.properties': `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-${GRADLE}-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`,
    'app/build.gradle.kts': buildGradle(packageName, hasLocale, hasMvs),
    'app/proguard-rules.pro': '',
    'app/src/main/AndroidManifest.xml': manifest(hasLocale),
    'app/src/main/res/values/strings.xml': `<resources>
    <string name="app_name">${escapeXml(appName)}</string>
</resources>
`,
    'app/src/main/res/values/themes.xml': hasLocale
      ? `<resources>
    <style name="Theme.AndroidKit" parent="Theme.AppCompat.DayNight.NoActionBar" />
</resources>
`
      : `<resources>
    <style name="Theme.AndroidKit" parent="android:style/Theme.Material.Light.NoActionBar" />
</resources>
`,
    'README.md': `# ${appName}

Generated from [xechoz/android-kit](https://github.com/xechoz/android-kit).

Selected: ${components.map((component) => component.name).join(', ')}

## Run

\`\`\`bash
./gradlew :app:assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
\`\`\`

Or open the folder in Android Studio. If the SDK is not found, add \`local.properties\` with \`sdk.dir=/path/to/Android/Sdk\`.

## Agent workflow

Read \`TASK.md\` and \`AGENTS.md\` first. Integration guides are in \`skills/\`.
`,
    'TASK.md': taskBrief(appName, packageName, components, runnable, skillOnly),
    'AGENTS.md': agentsBrief(packageName, components),
    'components.json': `${JSON.stringify(
      {
        generatedBy: 'xechoz/android-kit',
        appName,
        packageName,
        minSdk: MIN_SDK,
        components: components.map((component) => ({
          slug: component.slug,
          name: component.name,
          artifact: component.artifact,
          version: component.version,
          minSdk: component.minSdk,
          license: component.license,
          demo: component.demo,
        })),
      },
      null,
      2,
    )}\n`,
    [sourcePath(packageName, 'MainActivity.kt')]: mainActivity(
      appName,
      packageName,
      hasLocale,
      hasMvs,
    ),
    [sourcePath(packageName, 'ui/theme/Theme.kt')]: themeFile(packageName),
  };

  if (hasLocale) {
    files['app/src/main/res/xml/locales_config.xml'] = `<?xml version="1.0" encoding="utf-8"?>
<locale-config xmlns:android="http://schemas.android.com/apk/res/android">
    <locale android:name="en" />
    <locale android:name="zh-CN" />
</locale-config>
`;
    files[sourcePath(packageName, 'demo/LocaleDemo.kt')] = localeDemo(packageName);
  }

  if (hasMvs) {
    files[sourcePath(packageName, 'demo/MvsDemo.kt')] = mvsDemo(packageName);
  }

  for (const skill of skills) {
    files[`skills/${skill.slug}/SKILL.md`] = skill.raw;
  }

  return { files, dependencies, runnable, skillOnly };
}
