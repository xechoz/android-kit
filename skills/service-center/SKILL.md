---
name: service-center
description: Integrate ServiceCenter (io.github.xechoz:service-center), a KSP-generated service registry for Kotlin Multiplatform, into an Android/KMP/JVM project. Use when the user wants annotation-based service registration, a reflection-free registry, or @Service/IService wiring.
metadata:
  artifact: io.github.xechoz:service-center
  version: 0.0.1
  minSdk: "24"
  source: https://github.com/xechoz/ServiceCenter
  docs: https://xechoz.github.io/android-kit/components/service-center/
---

# ServiceCenter

ServiceCenter registers implementations with `@Service` and generates the registry through KSP. The runtime registry uses no reflection. JVM/Android discover generated registrars from `META-INF/services`; other platforms install explicitly.

Version `0.0.1` is early. The repository currently has **no LICENSE file**. Tell the user and ask for authorization before integrating into a real project.

## When to use

- The app wants annotation-based service registration without a full DI framework.
- The project is KMP and needs the same registry across platforms.
- You need lazy singletons keyed by an interface.
- You want JVM/Android auto-discovery and explicit installation elsewhere.

Do not use it as a replacement for a scoped DI graph with constructor injection, lifecycle scopes, or qualifiers. It is a simple service locator.

## Inspect the host first

1. Is it an Android/JVM project or a KMP project?
2. Does it already use KSP? Add the KSP plugin if not.
3. Confirm minSdk 24+ for Android.
4. Identify the module that owns the implementation classes. KSP must run in that module.
5. Confirm the license situation.

## 1. Add the dependency and KSP

Android / JVM:

```kotlin
plugins {
    id("com.google.devtools.ksp")
}

dependencies {
    implementation("io.github.xechoz:service-center:0.0.1")
    ksp("io.github.xechoz:service-center-compiler:0.0.1")
}
```

KMP (commonMain generation):

```kotlin
plugins {
    id("com.google.devtools.ksp")
}

kotlin {
    sourceSets {
        commonMain {
            kotlin.srcDir("build/generated/ksp/metadata/commonMain/kotlin")
            resources.srcDir("build/generated/ksp/metadata/commonMain/resources")
            dependencies {
                implementation("io.github.xechoz:service-center:0.0.1")
            }
        }
    }
}

dependencies {
    add("kspCommonMainMetadata", "io.github.xechoz:service-center-compiler:0.0.1")
}

tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompilationTask<*>>().configureEach {
    if (name != "kspCommonMainKotlinMetadata") dependsOn("kspCommonMainKotlinMetadata")
}

tasks.matching { it.name.startsWith("ksp") && it.name != "kspCommonMainKotlinMetadata" }.configureEach {
    dependsOn("kspCommonMainKotlinMetadata")
}

tasks.withType<org.gradle.language.jvm.tasks.ProcessResources>().configureEach {
    dependsOn("kspCommonMainKotlinMetadata")
}

tasks.matching { it.name.endsWith("JavaRes") }.configureEach {
    dependsOn("kspCommonMainKotlinMetadata")
}
```

Generated package/class defaults to `me.xechoz.servicecenter.generated.ServiceCenterGenerated`. Override with:

```kotlin
ksp {
    arg("serviceCenter.generatedPackage", "com.example.generated")
    arg("serviceCenter.generatedName", "ServiceCenterGenerated")
}
```

## 2. Declare services

```kotlin
import me.xechoz.servicecenter.IService
import me.xechoz.servicecenter.Service

interface Greeter : IService {
    fun greet(): String
}

@Service
class GreeterImpl : Greeter {
    override fun greet(): String = "Hello from ServiceCenter"
}
```

Rules enforced by KSP:

- The class must implement exactly one sub-interface of `IService`.
- It cannot be abstract, sealed, private, protected, or inner.
- It needs an accessible no-arg constructor (all-default parameters are allowed).
- One implementation per service interface; duplicates fail at compile time.

## 3. Initialize and resolve

JVM / Android:

```kotlin
ServiceCenter.initialize()
val greeter = ServiceCenter.getService<Greeter>()
```

`initialize()` is idempotent and discovers every generated registrar on the classpath. It does not run automatically before `getService`.

JS / Wasm / Native:

```kotlin
ServiceCenter.install(AppGenerated(), DataGenerated())
```

Use `getServiceOrNull<T>()` when absence is normal. `getService<T>()` throws `ServiceNotFoundException` with the registered types in the message.

## Verification

```bash
./gradlew :app:assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Check:

1. `./gradlew :app:kspDebugKotlin` (or the KMP task) succeeds.
2. Generated sources include the registrar and `META-INF/services/me.xechoz.servicecenter.ServiceRegistrar`.
3. `ServiceCenter.initialize()` followed by `getService<Greeter>()` returns the implementation.
4. `ServiceCenter.reset()` in tests prevents cross-test leakage.

## Do not

- Do not implement only `IService`; declare a child interface.
- Do not bind multiple implementations to one interface.
- Do not call `getService` without `initialize()`/`install()`.
- Do not use it in a commercial project without clarifying the missing license.
- Do not assume JS/Wasm/Native auto-discovery.

## Reference

- Docs: https://xechoz.github.io/android-kit/components/service-center/
- Source: https://github.com/xechoz/ServiceCenter
- License: unspecified (no LICENSE file)
