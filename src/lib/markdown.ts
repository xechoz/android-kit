import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import { createHighlighter, type Highlighter } from 'shiki';

const theme = 'vitesse-dark';

const languages = [
  'bash',
  'groovy',
  'java',
  'json',
  'kotlin',
  'markdown',
  'properties',
  'text',
  'toml',
  'xml',
  'yaml',
];

let highlighterPromise: Promise<Highlighter> | undefined;

function highlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({ themes: [theme], langs: languages });
  return highlighterPromise;
}

export async function renderMarkdown(source: string): Promise<string> {
  const shiki = await highlighter();
  const loaded = new Set(shiki.getLoadedLanguages());

  const marked = new Marked(
    markedHighlight({
      highlight(code, lang) {
        const language = loaded.has(lang) ? lang : 'text';
        return shiki.codeToHtml(code, { lang: language, theme });
      },
    }),
  );

  return marked.parse(source, { async: false });
}
