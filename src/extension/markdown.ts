import { marked } from 'marked';
import hljs from 'highlight.js';

const renderer = new marked.Renderer();
// Code highlighting hook
marked.setOptions({ renderer });
// Monkey patch tokenizer highlight via walking after parse (simpler for now)
function highlightAll(html: string): string {
	return html.replace(/<pre><code class="language-([^"]+)">([\s\S]*?)<\/code><\/pre>/g, (_m, lang, code) => {
		const decoded = code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
		let highlighted = decoded;
		if (lang && hljs.getLanguage(lang)) {
			highlighted = hljs.highlight(decoded, { language: lang }).value;
		} else {
			highlighted = hljs.highlightAuto(decoded).value;
		}
		return `<pre><code class="language-${lang}">${highlighted}</code></pre>`;
	});
}
export class MarkdownRenderer {
	render(text: string): string {
		const raw = marked.parse(text) as string;
		return highlightAll(raw);
	}
}
