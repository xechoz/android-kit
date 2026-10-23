---
name: locale-kit
description: Integrate LocaleKit (io.github.xechoz:locale) into an Android app for in-app language switching and Android 13+ system app-language settings. Use when the user asks for a language picker, per-app locale, or system-language settings entry.
metadata:
  artifact: io.github.xechoz:locale
  version: 1.0.0
  minSdk: "24"
  source: https://github.com/xechoz/LocaleKit
  docs: https://xechoz.github.io/android-kit/components/locale-kit/
---

# LocaleKit

LocaleKit wraps the official `AppCompatDelegate` per-app language API. It does **not** change the system language.

## When to use

- The app needs a language picker: follow system, or an explicit locale.
- The app should appear in Android 13+ Settings → Apps → App → Language.
- The app needs to read the system language or open system language settings.
- The app needs to open another app's language settings on Android 13+.

Do not use it to programmatically change the system language. No reliable public API exists on non-root devices.

## Inspect the host app first

Before editing, check:

1. `minSdk` is at least 24.
2. The host Activity extends `AppCompatActivity`. If it extends `ComponentActivity`/`FragmentActivity`, change the base class and keep `setContent` for Compose.
3. `appcompat` is on the classpath. LocaleKit depends on it, but the host Activity must actually use it.
4. There is a `res/xml/locales_config.xml`, or create one.
5. The app has string resources for every locale you declare.

If the host is Compose-only, `AppCompatActivity` + `setContent` is valid. Do not migrate the whole app to Views just for LocaleKit.

## 1. Add the dependency

Version catalog:

```toml
[versions]
localeKit = "1.0.0"

[libraries]
locale-kit = { module = "io.github.xechoz:locale", version.ref = "localeKit" }
```

```kotlin
dependencies {
    implementation(libs.locale.kit)
}
```

Or directly:

```kotlin
implementation("io.github.xechoz:locale:1.0.0")
```

## 2. Declare supported locales

`app/src/main/res/xml/locales_config.xml`:

```xml
<locale-config xmlns:android="http://schemas.android.com/apk/res/android">
    <locale android:name="zh-CN" />
    <locale android:name="en" />
</locale-config>
```

Reference it from the `<application>` element:

```xml
<application
    android:localeConfig="@xml/locales_config"
    ...>
```

Do not skip this. Without it, `AppLanguage.available()` returns an empty list and Android 13+ will not show the app in system app-language settings.

## 3. Make the Activity an AppCompatActivity

```kotlin
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { App() }
    }
}
```

No LocaleKit init call is required. The library manifest merges `AppLocalesMetadataHolderService` for persistence on Android 12 and below.

## 4. Build the picker

```kotlin
import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalContext
import me.xechoz.localekit.AppLanguage
import me.xechoz.localekit.AppLanguagePreference

@Composable
fun LanguagePicker() {
    val context = LocalContext.current
    val options = remember { AppLanguage.available(context) }
    val current = remember { AppLanguage.current() }

    Column(Modifier.padding(16.dp)) {
        Text("App language", style = MaterialTheme.typography.titleMedium)
        LanguageRow(
            label = "Follow system",
            selected = current is AppLanguagePreference.FollowSystem,
            onClick = { AppLanguage.set(AppLanguagePreference.FollowSystem) },
        )
        options.forEach { option ->
            LanguageRow(
                label = option.label,
                selected = current is AppLanguagePreference.Explicit &&
                    current.locale == option.locale,
                onClick = {
                    AppLanguage.set(AppLanguagePreference.Explicit(option.locale))
                },
            )
        }
    }
}

@Composable
private fun LanguageRow(label: String, selected: Boolean, onClick: () -> Unit) {
    Row(
        Modifier.fillMaxWidth().clickable(onClick = onClick).padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        RadioButton(selected = selected, onClick = onClick)
        Text(label, Modifier.padding(start = 12.dp))
    }
}

@Preview(showBackground = true)
@Composable
private fun LanguagePickerPreview() {
    MaterialTheme {
        Column(Modifier.padding(16.dp)) {
            LanguageRow("Follow system", true) {}
            LanguageRow("English", false) {}
            LanguageRow("简体中文", false) {}
        }
    }
}
```

`AppLanguage.set()` must run on the main thread. It triggers Activity recreation on Android 12 and below; on 13+ the system app-language mechanism applies it.

View-based hosts can call the same APIs from button handlers.

## 5. System language and other apps

```kotlin
val systemLocales = SystemLanguage.current(context)
val primary = systemLocales.firstOrNull()

SystemLanguage.openSettings(context)

if (AppLocaleSettings.isSupported) {
    AppLocaleSettings.open(context, "com.example.other")
}
```

`SystemLanguage.current()` reads `LocaleManager` on 13+ and `Resources` below. `openSettings()` returns whether an Activity was opened. `AppLocaleSettings.open()` falls back to the app details page if the language page cannot be resolved.

## Verification

```bash
./gradlew :app:assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Check:

1. The picker lists the locales from `locales_config.xml`.
2. Selecting a language changes the UI.
3. Kill and relaunch; the choice persists.
4. On Android 13+, Settings → Apps → the app → Language shows the same value.
5. `SystemLanguage.openSettings()` opens the system language page.

## Do not

- Do not call `AppLanguage.set()` from a background thread.
- Do not claim the library changes the system language.
- Do not omit `android:localeConfig` and then wonder why the picker is empty.
- Do not switch the Activity to a plain `ComponentActivity` while using LocaleKit.

## Reference

- Docs: https://xechoz.github.io/android-kit/components/locale-kit/
- Source: https://github.com/xechoz/LocaleKit
- License: Apache-2.0
