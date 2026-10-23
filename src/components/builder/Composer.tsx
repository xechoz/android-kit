import { useMemo, useState } from 'preact/hooks';
import JSZip from 'jszip';
import { generateProject, type StarterComponent, type StarterSkill } from '@/lib/starter';
import type { UI } from '@/i18n/ui';

export interface BuilderComponent extends StarterComponent {
  part: string;
  status: 'stable' | 'beta' | 'experimental' | 'source-only';
}

interface Props {
  components: BuilderComponent[];
  skills: StarterSkill[];
  copy: UI['builder'];
  common: UI['common'];
  statusLabels: UI['status'];
  skillsInstall: string;
  repo: string;
}

const PACKAGE_RE = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/;

const statusDot: Record<BuilderComponent['status'], string> = {
  stable: 'bg-status',
  beta: 'bg-accent',
  experimental: 'bg-[#C98A2B]',
  'source-only': 'bg-muted',
};

function initialSelection(components: BuilderComponent[]): string[] {
  if (typeof window !== 'undefined') {
    const query = new URLSearchParams(window.location.search).get('c');
    if (query !== null) {
      const requested = query
        .split(',')
        .map((slug) => slug.trim())
        .filter((slug) => components.some((component) => component.slug === slug));
      if (requested.length > 0) return requested;
    }
  }

  return components
    .filter((component) => component.demo === 'runnable')
    .map((component) => component.slug);
}

function artifact(component: BuilderComponent): string {
  return component.artifact
    ? `${component.artifact}:${component.version}`
    : `source-only · ${component.version}`;
}

function safeFileBase(name: string): string {
  return name.replace(/[^A-Za-z0-9_-]/g, '') || 'AndroidKitDemo';
}

export default function Composer({
  components,
  skills,
  copy,
  common,
  statusLabels,
  skillsInstall,
  repo,
}: Props) {
  const [selected, setSelected] = useState<string[]>(() => initialSelection(components));
  const [appName, setAppName] = useState('Android Kit Demo');
  const [packageName, setPackageName] = useState('com.example.androidkit');
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [task, setTask] = useState<string | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [deps, setDeps] = useState<string[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState('android-kit-starter.zip');
  const [promptCopied, setPromptCopied] = useState(false);

  const selectedComponents = useMemo(
    () => components.filter((component) => selected.includes(component.slug)),
    [components, selected],
  );

  const allSelected = selected.length === components.length;

  function resetOutput() {
    setTask(null);
    setFiles([]);
    setDeps([]);
    setStatus('idle');
    setError('');
    setDownloadUrl(null);
    setPromptCopied(false);
  }

  function toggle(slug: string) {
    setSelected((current) =>
      current.includes(slug)
        ? current.filter((entry) => entry !== slug)
        : [...current, slug],
    );
    resetOutput();
  }

  function updateName(value: string) {
    setAppName(value);
    resetOutput();
  }

  function updatePackage(value: string) {
    setPackageName(value);
    resetOutput();
  }

  async function fetchAsset(path: string): Promise<Response> {
    const base = import.meta.env.BASE_URL;
    const response = await fetch(`${base}starter/${path}`);
    if (!response.ok) throw new Error(`Missing starter asset: ${path}`);
    return response;
  }

  async function generate(): Promise<void> {
    setError('');
    setPromptCopied(false);

    if (selectedComponents.length === 0) {
      setStatus('error');
      setError(copy.noSelection);
      return;
    }

    if (appName.trim().length === 0) {
      setStatus('error');
      setError(copy.invalidName);
      return;
    }

    if (!PACKAGE_RE.test(packageName.trim())) {
      setStatus('error');
      setError(copy.invalidPackage);
      return;
    }

    setStatus('working');

    try {
      const project = generateProject({
        appName: appName.trim(),
        packageName: packageName.trim(),
        components: selectedComponents,
        skills: skills.filter(
          (skill) => skill.slug === 'android-kit' || selected.includes(skill.slug),
        ),
      });

      const [gradlew, gradlewBat, wrapperJar] = await Promise.all([
        fetchAsset('gradlew.sh').then((response) => response.text()),
        fetchAsset('gradlew.bat').then((response) => response.text()),
        fetchAsset('gradle-wrapper.jar').then((response) => response.arrayBuffer()),
      ]);

      const zip = new JSZip();

      for (const [path, content] of Object.entries(project.files)) {
        zip.file(path, content, {
          unixPermissions: path === 'gradlew' ? 0o755 : 0o644,
        });
      }

      zip.file('gradlew', gradlew, { unixPermissions: 0o755 });
      zip.file('gradlew.bat', gradlewBat, { unixPermissions: 0o644 });
      zip.file('gradle/wrapper/gradle-wrapper.jar', wrapperJar, { binary: true });

      const blob = await zip.generateAsync({
        type: 'blob',
        platform: 'UNIX',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      const name = `${safeFileBase(appName)}-starter.zip`;
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = name;
      anchor.click();

      const allFiles = [
        ...Object.keys(project.files),
        'gradlew',
        'gradlew.bat',
        'gradle/wrapper/gradle-wrapper.jar',
      ].sort();

      setTask(project.files['TASK.md'] ?? '');
      setFiles(allFiles);
      setDeps(project.dependencies);
      setDownloadUrl(url);
      setDownloadName(name);
      setStatus('done');
    } catch (cause) {
      console.error(cause);
      setStatus('error');
      setError(copy.error);
    }
  }

  async function copyPrompt() {
    if (!task) return;
    try {
      await navigator.clipboard.writeText(task);
      setPromptCopied(true);
    } catch {
      setError(copy.error);
    }
  }

  return (
    <div class="grid gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
      <section class="border border-line bg-surface">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <p class="label">01 / {copy.step1}</p>
            <p class="mt-1 text-[12px] text-muted">{copy.step1Hint}</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="filter-chip"
              onClick={() => {
                setSelected(components.map((component) => component.slug));
                resetOutput();
              }}
              disabled={allSelected}
            >
              {copy.selectAll}
            </button>
            <button
              type="button"
              class="filter-chip"
              onClick={() => {
                setSelected([]);
                resetOutput();
              }}
              disabled={selected.length === 0}
            >
              {copy.clear}
            </button>
          </div>
        </div>

        <div class="divide-y divide-line">
          {components.map((component) => {
            const active = selected.includes(component.slug);

            return (
              <button
                type="button"
                key={component.slug}
                class={`group flex w-full items-start gap-3 px-5 py-4 text-left transition-colors ${
                  active ? 'bg-accent-soft/25' : 'hover:bg-surface-2/40'
                }`}
                aria-pressed={active}
                onClick={() => toggle(component.slug)}
              >
                <span
                  class={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center border text-[10px] ${
                    active
                      ? 'border-accent bg-accent text-bg'
                      : 'border-line-strong text-transparent'
                  }`}
                  aria-hidden="true"
                >
                  ✓
                </span>

                <span class="min-w-0 flex-1">
                  <span class="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span class="text-[14px] font-semibold">{component.name}</span>
                    <span class={`h-1.5 w-1.5 rounded-full ${statusDot[component.status]}`} />
                    <span class="font-mono text-[9px] uppercase tracking-[0.06em] text-muted">
                      {statusLabels[component.status === 'source-only' ? 'sourceOnly' : component.status]}
                    </span>
                  </span>
                  <span class="mt-1 block text-[12px] leading-relaxed text-muted">
                    {component.tagline}
                  </span>
                  <span class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[9.5px] uppercase tracking-[0.05em] text-muted">
                    <span>{component.part}</span>
                    <span>{artifact(component)}</span>
                    <span
                      class={
                        component.demo === 'runnable'
                          ? 'text-status'
                          : 'text-muted'
                      }
                    >
                      {component.demo === 'runnable' ? copy.runnable : copy.skillOnly}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <p class="border-t border-line px-5 py-3 text-[11px] leading-relaxed text-muted">
          {copy.selectionHint}
        </p>
      </section>

      <aside class="grid gap-4 lg:sticky lg:top-24">
        <section class="border border-line bg-surface p-5">
          <p class="label">02 / {copy.step2}</p>
          <p class="mt-1 text-[12px] text-muted">{copy.step2Hint}</p>

          <label class="mt-4 block">
            <span class="label">{copy.appName}</span>
            <input
              class="mt-1.5 w-full border border-line bg-bg px-3 py-2 font-mono text-[12px] text-ink outline-none transition-colors focus:border-ink"
              value={appName}
              onInput={(event) => updateName(event.currentTarget.value)}
            />
          </label>

          <label class="mt-3 block">
            <span class="label">{copy.packageName}</span>
            <input
              class="mt-1.5 w-full border border-line bg-bg px-3 py-2 font-mono text-[12px] text-ink outline-none transition-colors focus:border-ink"
              value={packageName}
              onInput={(event) => updatePackage(event.currentTarget.value)}
              spellcheck={false}
            />
          </label>
          <p class="mt-1.5 text-[10.5px] leading-relaxed text-muted">{copy.packageHint}</p>

          <div class="mt-4 border-t border-line pt-3">
            <p class="label">{copy.constraints}</p>
            <ul class="mt-2 space-y-1.5 text-[11px] leading-relaxed text-muted">
              <li>{copy.constraintMinSdk}</li>
              <li>{copy.constraintAppcompat}</li>
              <li>{copy.constraintOfflineWeb}</li>
              <li>{copy.constraintCompose}</li>
            </ul>
          </div>
        </section>

        <section class="border border-line bg-surface p-5">
          <p class="label">03 / {copy.step3}</p>

          <button
            type="button"
            class="btn btn--primary mt-3 w-full justify-between"
            onClick={generate}
            disabled={status === 'working'}
          >
            {status === 'working' ? copy.generating : copy.generate}
            <span class="font-mono text-[10px]">{String(selectedComponents.length).padStart(2, '0')}</span>
          </button>

          {status === 'error' && error && (
            <p class="mt-3 border border-accent/40 bg-accent-soft/40 px-3 py-2 text-[11px] leading-relaxed text-accent">
              {error}
            </p>
          )}

          {status === 'done' && (
            <p class="mt-3 flex items-center gap-2 text-[11px] text-status">
              <span class="dot" />
              {copy.downloadReady}
            </p>
          )}

          <p class="mt-3 text-[10.5px] leading-relaxed text-muted">{copy.privacy}</p>

          {downloadUrl && (
            <a
              class="btn btn--ghost btn--sm mt-3 w-full justify-between"
              href={downloadUrl}
              download={downloadName}
            >
              {copy.download}
              <span class="font-mono text-[10px]">↓</span>
            </a>
          )}
        </section>

        <section class="border border-line bg-surface p-5">
          <div class="flex items-center justify-between gap-3">
            <p class="label">{copy.output}</p>
            {files.length > 0 && (
              <span class="font-mono text-[9.5px] uppercase tracking-[0.06em] text-muted">
                {String(files.length).padStart(2, '0')} {copy.generatedFiles}
              </span>
            )}
          </div>

          {files.length === 0 ? (
            <p class="mt-3 border border-dashed border-line px-3 py-6 text-center text-[11px] text-muted">
              {copy.outputEmpty}
            </p>
          ) : (
            <>
              <div class="mt-3 max-h-56 overflow-auto border border-line bg-bg p-3">
                <ul class="space-y-1 font-mono text-[10px] leading-relaxed text-muted">
                  {files.map((file) => (
                    <li key={file} class="truncate">{file}</li>
                  ))}
                </ul>
              </div>

              <div class="mt-3">
                <p class="label">{copy.deps}</p>
                <div class="mt-1.5 flex flex-wrap gap-1">
                  {deps.map((dep) => (
                    <span class="tag !normal-case" key={dep}>{dep}</span>
                  ))}
                </div>
              </div>

              <div class="mt-3">
                <p class="label">{copy.skillsIncluded}</p>
                <div class="mt-1.5 flex flex-wrap gap-1">
                  <span class="tag">TASK.md</span>
                  <span class="tag">AGENTS.md</span>
                  <span class="tag">components.json</span>
                  <span class="tag">skills/</span>
                </div>
              </div>

              <button
                type="button"
                class="btn btn--ghost btn--sm mt-3 w-full justify-between"
                onClick={copyPrompt}
              >
                {promptCopied ? common.copied : copy.copyPrompt}
                <span class="font-mono text-[10px]">MD</span>
              </button>

              <p class="mt-3 border-t border-line pt-3 text-[10.5px] leading-relaxed text-muted">
                {copy.nextBody}
              </p>
            </>
          )}
        </section>

        <section class="border border-line bg-surface-2/40 p-4">
          <p class="label">Agent</p>
          <code class="mono mt-2 block break-all text-[10px] leading-relaxed text-ink/80">
            {skillsInstall}
          </code>
          <a
            class="mt-2 inline-flex items-center gap-1 text-[10.5px] text-accent hover:underline"
            href={repo}
            target="_blank"
            rel="noreferrer noopener"
          >
            {repo.replace('https://github.com/', 'github.com/')}
          </a>
        </section>
      </aside>
    </div>
  );
}
