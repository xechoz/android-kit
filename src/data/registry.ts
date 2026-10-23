import type { Lang } from '@/i18n/ui';

export type Localized<T> = Record<Lang, T>;

export type Platform = 'android' | 'jvm' | 'ios' | 'js' | 'wasm' | 'native';
export type UiType = 'compose' | 'view';
export type Category = 'i18n' | 'state' | 'logging' | 'architecture' | 'webview';
export type ComponentStatus = 'stable' | 'beta' | 'experimental' | 'source-only';
export type DemoSupport = 'runnable' | 'skill-only';

export interface Component {
  slug: string;
  part: string;
  name: string;
  repo: string;
  artifact: string | null;
  version: string;
  status: ComponentStatus;
  categories: Category[];
  platforms: Platform[];
  ui: UiType[];
  minSdk: number | null;
  license: string;
  demo: DemoSupport;
  blog?: string;
  tagline: Localized<string>;
  summary: Localized<string>;
  features: Localized<string[]>;
}

export const components: Component[] = [
  {
    slug: 'locale-kit',
    part: 'XZ-LOC-01',
    name: 'LocaleKit',
    repo: 'xechoz/LocaleKit',
    artifact: 'io.github.xechoz:locale',
    version: '1.0.0',
    status: 'stable',
    categories: ['i18n'],
    platforms: ['android'],
    ui: ['view', 'compose'],
    minSdk: 24,
    license: 'Apache-2.0',
    demo: 'runnable',
    tagline: {
      zh: '应用内语言切换，接入 Android 13+ 的系统应用语言设置。',
      en: 'Per-app language switching, wired into Android 13+ system app-language settings.',
    },
    summary: {
      zh: 'LocaleKit 把「跟随系统 / 指定语言」收敛成一个 sealed interface，并在 Android 13+ 同步写入系统「应用语言」设置；Android 12 及以下由 AppCompat 自动持久化。',
      en: 'LocaleKit models the language preference as a sealed interface, syncs it into Android 13+ app-language settings, and lets AppCompat persist it on Android 12 and below.',
    },
    features: {
      zh: [
        'Android 13+ 同步系统「应用语言」设置',
        'Android 12 及以下由 AppCompat 自动持久化并重建',
        '无反射读取 locales_config',
        '系统语言只读 API 与其他 App 语言入口',
      ],
      en: [
        'Syncs with Android 13+ system app-language settings',
        'Automatic AppCompat persistence and recreation on Android 12 and below',
        'Reads locales_config without reflection',
        'Read-only system language API and deep links to other apps',
      ],
    },
  },
  {
    slug: 'mvs',
    part: 'XZ-MVS-02',
    name: 'MVS',
    repo: 'xechoz/android-kotlin-redux',
    artifact: 'io.github.xechoz:mvs',
    version: '1.1.0',
    status: 'stable',
    categories: ['state', 'architecture'],
    platforms: ['android', 'jvm'],
    ui: [],
    minSdk: 26,
    license: 'GPL-3.0',
    demo: 'runnable',
    blog: 'https://xechoz.github.io/2025/03/23/Redux-for-Android/',
    tagline: {
      zh: '基于 Coroutines Flow 的精简 Redux，状态只能通过 repo 修改。',
      en: 'A minimal Redux built on Coroutines Flow, with state mutation confined to repos.',
    },
    summary: {
      zh: 'MVS 用三个角色描述一个界面：不可变 state、负责修改状态的 repo、消费状态并触发 repo 的 view。没有 RxJava，只有 Coroutines Flow。',
      en: 'MVS describes a screen with three roles: an immutable state, a repo that owns mutations, and a view that consumes state and calls the repo. No RxJava, only Coroutines Flow.',
    },
    features: {
      zh: [
        'setState 只能从 repo 实现或扩展函数调用',
        'onEach 监听整个状态或单个属性',
        'asFlow 支持组合多个属性',
        'KMP：Android + JVM，minSdk 26',
      ],
      en: [
        'setState is only reachable from repo implementations or extensions',
        'onEach observes the whole state or a single property',
        'asFlow supports combining multiple properties',
        'KMP: Android + JVM, minSdk 26',
      ],
    },
  },
  {
    slug: 'loga',
    part: 'XZ-LOG-03',
    name: 'Loga',
    repo: 'xechoz/Loga',
    artifact: 'io.github.xechoz:loga',
    version: '0.0.1',
    status: 'experimental',
    categories: ['logging'],
    platforms: ['android', 'jvm', 'ios'],
    ui: [],
    minSdk: 24,
    license: 'Apache-2.0',
    demo: 'skill-only',
    tagline: {
      zh: '基于 mmap 的 KMP 日志库，进程被杀也不丢最近日志。',
      en: 'A KMP logger backed by mmap. Recent logs survive a process kill.',
    },
    summary: {
      zh: '日志先写入内存映射文件，再由后台 worker 按天追加到日志文件。写入开销低，脏页留在内核 page cache，进程被杀也不会丢掉最近的日志。',
      en: 'Lines are written into a memory-mapped file, then a background worker appends snapshots to daily files. Writes are cheap, and dirty pages in the kernel page cache survive a process kill.',
    },
    features: {
      zh: [
        'Android / JVM 使用 MappedByteBuffer，iOS 使用 posix mmap',
        '按天轮转与保留天数清理',
        '异步 flush，日志线程不阻塞磁盘 I/O',
        '可挂接 Formatter 与 Appender',
        '默认记录未捕获异常并 flush',
      ],
      en: [
        'MappedByteBuffer on Android/JVM, posix mmap on iOS',
        'Daily rotation with retention cleanup',
        'Async flush keeps disk I/O off the logging thread',
        'Pluggable Formatter and Appender',
        'Logs and flushes uncaught exceptions by default',
      ],
    },
  },
  {
    slug: 'service-center',
    part: 'XZ-SVC-04',
    name: 'ServiceCenter',
    repo: 'xechoz/ServiceCenter',
    artifact: 'io.github.xechoz:service-center',
    version: '0.0.1',
    status: 'experimental',
    categories: ['architecture'],
    platforms: ['android', 'jvm', 'ios', 'js', 'wasm', 'native'],
    ui: [],
    minSdk: 24,
    license: 'Unspecified',
    demo: 'skill-only',
    tagline: {
      zh: 'KSP 生成服务注册表，运行时零反射的 KMP 服务发现。',
      en: 'KSP-generated service registry with reflection-free discovery on KMP.',
    },
    summary: {
      zh: '用 @Service 标注实现类，KSP 在 commonMain 生成注册代码。JVM / Android 通过生成的 META-INF/services 自动发现；其他平台显式 install。运行时注册表本身不使用反射。',
      en: 'Mark implementations with @Service; KSP generates the registry into commonMain. JVM and Android discover it through generated META-INF/services, other platforms install explicitly. The runtime registry uses no reflection.',
    },
    features: {
      zh: [
        '注解 + KSP 代码生成，注册表无反射',
        '懒加载单例，重复注册有明确异常',
        'JVM / Android 自动发现，其余平台显式 install',
        '支持 Android、JVM、iOS、JS、Wasm 与 Native',
      ],
      en: [
        'Annotation + KSP codegen, no reflection in the registry',
        'Lazy singletons with explicit duplicate-registration errors',
        'Auto-discovery on JVM/Android, explicit install elsewhere',
        'Android, JVM, iOS, JS, Wasm, and Native targets',
      ],
    },
  },
  {
    slug: 'offline-web',
    part: 'XZ-WEB-05',
    name: 'Offline Web',
    repo: 'xechoz/offline-web',
    artifact: null,
    version: '0.1.0',
    status: 'source-only',
    categories: ['webview'],
    platforms: ['android'],
    ui: ['view'],
    minSdk: 21,
    license: 'Apache-2.0',
    demo: 'skill-only',
    tagline: {
      zh: '把 WebView 的资源请求透明映射到本地签名离线包。',
      en: 'Transparently maps WebView requests to signed offline packages.',
    },
    summary: {
      zh: '服务端把站点打包成签名离线包，客户端下载、校验、解压后通过 shouldInterceptRequest 把请求映射到本地文件。业务代码只需要多写一行 initOfflineResource。',
      en: 'A server packages a site into a signed offline bundle. The client downloads, verifies, and extracts it, then maps requests to local files through shouldInterceptRequest. Host code adds one initOfflineResource call.',
    },
    features: {
      zh: [
        'ECDSA P-256 + SHA-256 签名 release',
        '防 zip-slip、zip bomb、清单外文件的解压',
        '原子安装与 active/previous 切换',
        'Range/206，视频与音频按需读取',
        '升级、回退、撤销、过期与启动恢复',
      ],
      en: [
        'ECDSA P-256 + SHA-256 signed releases',
        'Zip-slip, zip-bomb, and manifest-escape protection',
        'Atomic install with active/previous switching',
        'Range/206 for video and audio',
        'Upgrade, rollback, revoke, expiry, and startup recovery',
      ],
    },
  },
];

export function getComponent(slug: string): Component | undefined {
  return components.find((component) => component.slug === slug);
}

export interface ArchiveEntry {
  slug: string;
  name: string;
  repo: string;
  language: string;
  updatedAt: string;
  description: Localized<string>;
}

export const archive: ArchiveEntry[] = [
  {
    slug: 'custom-density',
    name: 'CustomDensity',
    repo: 'xechoz/CustomDensity',
    language: 'Kotlin',
    updatedAt: '2026-09-16',
    description: {
      zh: '按 360dp 宽度做 Android 屏幕适配。',
      en: 'Android screen adaptation based on a 360dp design width.',
    },
  },
  {
    slug: 'boring-tab-layout',
    name: 'BoringTabLayout',
    repo: 'xechoz/BoringTabLayout',
    language: 'Kotlin',
    updatedAt: '2026-09-16',
    description: {
      zh: '极简 TabLayout，只保留 addTab、选中回调和 indicator。',
      en: 'A minimal TabLayout: tabs, selection callbacks, and an indicator.',
    },
  },
  {
    slug: 'ok-view-stub',
    name: 'OkViewStub',
    repo: 'xechoz/OkViewStub',
    language: 'Kotlin',
    updatedAt: '2024-02-19',
    description: {
      zh: '改进版 ViewStub，支持 layout 或 View class、代码 inflate 和 Android Studio 预览。',
      en: 'A better ViewStub: accepts a layout or a View class, inflates from code, and previews in Android Studio.',
    },
  },
  {
    slug: 'view-cache',
    name: 'ViewCache',
    repo: 'xechoz/ViewCache',
    language: 'Kotlin',
    updatedAt: '2024-04-23',
    description: {
      zh: '缓存并复用 View，减少重复创建的开销。',
      en: 'Caches and reuses views to cut repeated creation cost.',
    },
  },
  {
    slug: 'ok-keyboard',
    name: 'OkKeyboard',
    repo: 'xechoz/OkKeyboard',
    language: 'Java',
    updatedAt: '2018-02-08',
    description: {
      zh: '监听软键盘弹起与收起。',
      en: 'Listens for soft-keyboard show and hide events.',
    },
  },
  {
    slug: 'fast-executor',
    name: 'FastExecutor',
    repo: 'xechoz/FastExecutor',
    language: 'Kotlin',
    updatedAt: '2021-01-03',
    description: {
      zh: '可限制最大线程数、同时接受无限提交量的 Executor。',
      en: 'An executor with a bounded pool size and unbounded submission.',
    },
  },
  {
    slug: 'android-class-loader',
    name: 'AndroidClassLoader',
    repo: 'xechoz/AndroidClassLoader',
    language: 'Kotlin',
    updatedAt: '2024-03-15',
    description: {
      zh: 'Android 类加载器实验：生成 main-dex-list、启动时加载 dex。',
      en: 'Classloader experiments: generate a main-dex-list or load dex files at startup.',
    },
  },
];

export const stats = {
  libraries: components.length,
  skills: components.length + 1,
  demos: components.filter((component) => component.demo === 'runnable').length,
};
