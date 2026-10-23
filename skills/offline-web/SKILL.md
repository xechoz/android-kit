---
name: offline-web
description: Integrate Offline Web (io.github.xechoz:offline-web-core), an Android WebView library for signed offline web bundles, into an app. Use when the user needs WebView pages to load offline, signed resource packages, or local fallback for a web-based feature.
metadata:
  artifact: io.github.xechoz:offline-web-core
  version: 0.1.0
  minSdk: "21"
  source: https://github.com/xechoz/offline-web
  docs: https://xechoz.github.io/android-kit/components/offline-web/
---

# Offline Web

Offline Web serves WebView requests from a signed offline bundle. The flow is: server packages and signs → client downloads, verifies, extracts → `shouldInterceptRequest` maps requests to local files.

It is **not on Maven Central** and needs a server component. Do not pretend it is a drop-in Gradle dependency.

## When to use

- A WebView-hosted feature must keep working offline or on a bad network.
- The team can run the bundling/signing server.
- The app can accept a source-only dependency and a signing key setup.

Do not use it for plain HTTP caching, for non-GET requests, or when the app cannot operate the server side.

## Inspect the host first

1. Does the app have a WebView feature and the `INTERNET` permission?
2. Can the host consume a local Maven artifact or a composite build?
3. Is there a server/CDN endpoint for bundles, and a key pair?
4. Does the app target minSdk 21+?
5. Is the WebView client already customized? The library honors a delegate client first.

## 1. Publish the core locally

Clone the repository and publish:

```bash
git clone https://github.com/xechoz/offline-web.git
cd offline-web
./gradlew :core:publishToMavenLocal
```

Host project:

```kotlin
repositories {
    mavenLocal()
    google()
    mavenCentral()
}

dependencies {
    implementation("io.github.xechoz:offline-web-core:0.1.0")
}
```

Alternatively include `:core` as a composite build or source module. Do not add a Maven Central coordinate; it will not resolve.

## 2. Initialize from Application

```kotlin
class App : Application() {
    override fun onCreate() {
        super.onCreate()

        OfflineWeb.init(
            context = this,
            config = OfflineConfig(
                appKey = "demo",
                endpoint = "https://cdn.example.com/offline/",
                trustedKeys = mapOf(
                    "prod-2026-01" to "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...",
                ),
                clientVersion = 1,
                maxStorageBytes = 200L * 1024 * 1024,
                networkPolicy = NetworkPolicy.ANY,
                expiryPolicy = ExpiryPolicy.STRICT,
                verifyOnStartup = StartupVerification.SIZE_ONLY,
                allowCleartext = false,
            ),
        )
    }
}
```

`trustedKeys` values are **Base64 SPKI DER**, not PEM. The endpoint must be http(s); http requires `allowCleartext = true`, which is for local demos only.

## 3. Bind the WebView

```kotlin
val binding = webView.initOfflineResource(
    resource = OfflineResource(
        packageId = "shop",
        missingResource = MissingResourcePolicy.NETWORK,
    ),
    delegateClient = existingClient,
)

webView.loadUrl("https://cdn.example.com/shop/")

// on destroy
binding.close()
```

`binding.state` is a `StateFlow<ResourceState>` (`NOT_INSTALLED`, `ACTIVE`, `EXPIRED`, `REVOKED`, `INVALID`). Do not replace the host's WebView settings; the library only installs the intercepting client.

## 4. Manage packages

```kotlin
val manager = OfflineWeb.manager
manager.installed
manager.events
manager.storageUsageBytes

manager.update(packageId)
manager.remove(packageId)
manager.clear()
manager.availablePackages()
```

A robust UI should expose install/update/remove, show storage usage, and surface `OfflineError` variants (network, HTTP, signature, unknown key, hash mismatch, zip rejected, disk full, expired, revoked).

## 5. Run the demo server

```bash
cd server
npm install
npm start
```

Defaults: API at `http://127.0.0.1:8080`, admin at `/admin`, token `demo-admin`, demo site at `/site/`. First launch publishes `sample-web/` as `shop` v1. From the emulator, use `10.0.2.2` and `allowCleartext = true` for the local demo.

## Verification

1. Start the server and download/install a bundle; state becomes `ACTIVE`.
2. Stop the server; the page still loads.
3. Airplane mode + process kill + relaunch; the page still loads.
4. Upload a bad signature; install is rejected.
5. Expire a bundle; observe `ExpiryPolicy`.
6. Remove the bundle; state returns to `NOT_INSTALLED` and the network fallback applies.

## Do not

- Do not add `io.github.xechoz:offline-web-core` as if it were on Maven Central.
- Do not pass PEM to `trustedKeys`; use SPKI DER Base64.
- Do not enable cleartext in production.
- Do not expect POST/WebSocket/out-of-manifest resources to be served offline.
- Do not forget `binding.close()` when the WebView is destroyed.
- Do not reuse one `packageId` for different sites.

## Reference

- Docs: https://xechoz.github.io/android-kit/components/offline-web/
- Source: https://github.com/xechoz/offline-web
- License: Apache-2.0
