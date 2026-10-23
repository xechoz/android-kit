---
name: mvs
description: Integrate MVS (io.github.xechoz:mvs), a minimal Redux built on Kotlin Coroutines Flow, into an Android or JVM app. Use when the user wants immutable screen state with mutations confined to repos, or asks about RxState, RxRepo, setState, or MVS.
metadata:
  artifact: io.github.xechoz:mvs
  version: 1.1.0
  minSdk: "26"
  source: https://github.com/xechoz/android-kotlin-redux
  docs: https://xechoz.github.io/android-kit/components/mvs/
---

# MVS

MVS is a small Redux-like state container. A screen has an immutable state, a repo that owns mutations, and a view that observes state and calls the repo.

**License: GPL-3.0.** Flag this to the user before integrating. If the project cannot accept GPL terms, do not proceed.

## When to use

- The user wants a minimal, Flow-based state container without RxJava.
- State mutation should be impossible from outside the repo.
- The project targets Android or JVM and can use minSdk 26.

Do not use it if the project needs a permissive license (Apache/MIT) or minSdk below 26.

## Inspect the host first

1. Confirm Android minSdk is at least 26, or the target is plain JVM.
2. Confirm Kotlin Coroutines is available (MVS exposes it as an `api` dependency).
3. Identify whether the screen uses a ViewModel, a plain class, or Compose state.
4. Confirm the license is acceptable.

## 1. Add the dependency

```kotlin
dependencies {
    implementation("io.github.xechoz:mvs:1.1.0")
}
```

Gradle module metadata resolves the Android or JVM variant. For a KMP consumer, add it to the relevant source set.

## 2. Define state

State is any immutable data class implementing `RxState`:

```kotlin
import xyz.icode.mvs.RxState

data class CounterState(
    val count: Int = 0,
) : RxState
```

Use immutable collections and `val` properties. Do not put mutable objects in state.

## 3. Define a repo

```kotlin
import xyz.icode.mvs.RxRepo

class CounterRepo : RxRepo<CounterState> by RxRepo(initState = CounterState()) {

    fun increment() {
        setState { copy(count = count + 1) }
    }

    fun decrement() {
        setState { copy(count = (count - 1).coerceAtLeast(0)) }
    }

    fun reset() {
        setState { CounterState() }
    }
}
```

`setState` is an extension member; it can only be called from the repo implementation or an extension function. Keep reducers pure. Put I/O in suspend functions and call `setState` with the result.

## 4. Connect the view

With a ViewModel:

```kotlin
class CounterViewModel : ViewModel(),
    RxRepo<CounterState> by RxRepo(initState = CounterState()) {

    fun increment() = setState { copy(count = count + 1) }

    fun reset() = setState { CounterState() }
}
```

Compose:

```kotlin
@Composable
fun CounterRoute(viewModel: CounterViewModel) {
    val state by viewModel.asFlow().collectAsState(initial = viewModel.state)
    CounterScreen(state, viewModel::increment, viewModel::reset)
}

@Composable
fun CounterScreen(
    state: CounterState,
    onIncrement: () -> Unit,
    onReset: () -> Unit,
) {
    Column(Modifier.padding(24.dp)) {
        Text("Count: ${state.count}", style = MaterialTheme.typography.headlineMedium)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = onIncrement) { Text("+1") }
            OutlinedButton(onClick = onReset) { Text("Reset") }
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun CounterScreenPreview() {
    MaterialTheme {
        CounterScreen(CounterState(count = 3), onIncrement = {}, onReset = {})
    }
}
```

Keep the screen composable stateless and inject mock state for previews. Do not construct the repo inside the preview.

View-based hosts:

```kotlin
val repo = CounterRepo()
val scope = MainScope()

scope.launch {
    repo.onEach(CounterState::count) { count ->
        text = "Count: $count"
    }
}

setOnClickListener { repo.increment() }
```

`onEach` runs in the caller's coroutine scope. `scope.cancel()` stops observation.

## API summary

| Member | Description |
| --- | --- |
| `state` | Synchronous current state |
| `setState { }` | Repo-only reducer; computes the next state |
| `asFlow()` | Whole state as `Flow<State>` |
| `onEach { }` | Observe whole state in the caller's scope |
| `onEach(KProperty1, action)` | Observe one property |
| `onEach(KProperty1)` | One property as `Flow<A>`, for `combine` |

## Verification

```bash
./gradlew :app:assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Check:

1. Button taps update the UI.
2. The state survives Activity recreation if the repo lives in a ViewModel.
3. Leaving the screen cancels `onEach` and stops updates.
4. `./gradlew :app:testDebugUnitTest` still passes.

## Do not

- Do not expose the `MutableStateFlow` or allow external mutation.
- Do not perform network/database I/O inside a `setState` reducer.
- Do not call suspend `onEach` directly from a composable; use `asFlow()` + `collectAsState` or `LaunchedEffect`.
- Do not ignore the GPL-3.0 license.

## Reference

- Docs: https://xechoz.github.io/android-kit/components/mvs/
- Source: https://github.com/xechoz/android-kotlin-redux
- Blog: https://xechoz.github.io/2025/03/23/Redux-for-Android/
- License: GPL-3.0
