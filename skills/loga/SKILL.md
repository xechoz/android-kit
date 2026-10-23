---
name: loga
description: Integrate Loga (io.github.xechoz:loga), a Kotlin Multiplatform logger backed by mmap, into an Android, JVM, or iOS app. Use when the user wants cheap logging that survives process kills, daily log rotation, or crash log capture.
metadata:
  artifact: io.github.xechoz:loga
  version: 0.0.1
  minSdk: "24"
  source: https://github.com/xechoz/Loga
  docs: https://xechoz.github.io/android-kit/components/loga/
---

# Loga

Loga writes log lines into a memory-mapped file, then a background worker appends them to daily text files. Recent lines survive a process kill.

Version `0.0.1` is early. Tell the user that the API may change.

## When to use

- The app needs low-overhead logging and wants the last lines available after a crash.
- The app wants daily files with retention cleanup.
- The project is Android, JVM, or iOS (KMP).

Do not use it as a remote logging backend or a full observability stack. It writes local files only.

## Inspect the host first

1. Confirm the target platform: Android (`minSdk` 24+), JVM, or iOS.
2. Find the `Application` class on Android, or the process entry point on JVM/iOS.
3. Decide on a `logDirectory`. Prefer an explicit path under app-private or app-external files.
4. Check whether the host already has a logging abstraction. Wrap Loga behind it instead of scattering calls.

## 1. Add the dependency

```kotlin
dependencies {
    implementation("io.github.xechoz:loga:0.0.1")
}
```

KMP resolves the platform variant automatically.

## 2. Initialize once

Android:

```kotlin
class App : Application() {
    override fun onCreate() {
        super.onCreate()

        Loga.init(
            context = this,
            config = LogConfig(
                logDirectory = File(filesDir, "logs").absolutePath,
                isDebug = BuildConfig.DEBUG,
                retentionDays = 7,
                logUncaughtExceptions = true,
            ),
        )
    }
}
```

JVM / iOS:

```kotlin
Loga.init(
    LogConfig(
        logDirectory = "/path/to/logs",
        isDebug = false,
        retentionDays = 7,
    ),
)
```

Pass an explicit `logDirectory` in production. The Android default is currently `getExternalFilesDir("logs")/logs`; do not depend on that shape.

## 3. Write logs

```kotlin
Loga.v("Network", "verbose")
Loga.d("Network", "cache hit")
Loga.i("Network", "request finished")
Loga.w("Network", "slow response")
Loga.e("Network", "request failed")
```

Use a stable tag per subsystem. Do not concatenate large payloads into a log line; it can exceed the buffer and be truncated.

Flush when the app goes to the background or before an explicit crash report:

```kotlin
Loga.flush()
```

A background flush runs every 5 seconds by default. Set `flushIntervalMillis = 0` to disable it.

## 4. Configure

```kotlin
LogConfig(
    logDirectory = null,
    bufferSize = 400 * 1024,
    level = Level.DEBUG,
    formatter = DefaultFormatter,
    retentionDays = 7,
    flushIntervalMillis = 5_000,
    isDebug = true,
    appenders = null,
    logUncaughtExceptions = true,
)
```

- `isDebug = true` adds a console appender. Pass the build flag so release stays file-only.
- `level` filters before formatting; use `Level.DEBUG` in debug, higher in release.
- `retentionDays` deletes old daily files on init and rotation.
- `logUncaughtExceptions` installs a platform crash hook; iOS is a no-op.

Custom `Formatter` and `Appender` are extension points. Keep `Appender.append()` cheap: it runs on the logging thread.

## Verification

```bash
./gradlew :app:assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Check:

1. Write logs at several levels.
2. `Loga.flush()` and confirm today's `yyyy_MM_dd.txt` exists under `logDirectory`.
3. Kill the process and relaunch; earlier logs are still present.
4. Trigger a crash in a debug build and confirm the log was written.

## Do not

- Do not log before `Loga.init`.
- Do not leave `isDebug = true` in release.
- Do not do disk or network I/O inside a custom `Appender`.
- Do not let multiple processes share one `logDirectory`; there is no cross-process lock.
- Do not put secrets, tokens, or full request bodies in logs.

## Reference

- Docs: https://xechoz.github.io/android-kit/components/loga/
- Source: https://github.com/xechoz/Loga
- License: Apache-2.0
