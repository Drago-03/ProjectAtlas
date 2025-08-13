import mermaid from 'mermaid';
export class MermaidRenderer {
	private currentTheme = 'default';
	constructor() {
		mermaid.initialize({ startOnLoad: false, theme: this.currentTheme as any });
	}
	async render(code: string, theme?: string): Promise<string> {
			if (typeof (global as any).document === 'undefined') {
				// Non-DOM environment (e.g., unit tests) – return placeholder SVG
				return `<svg xmlns='http://www.w3.org/2000/svg'><text x='10' y='20'>[mermaid skipped]</text></svg>`;
			}
		if (theme && theme !== this.currentTheme) {
			this.currentTheme = theme;
			mermaid.initialize({ startOnLoad: false, theme: theme as any });
		}
		try {
			const { svg } = await mermaid.render('mermaid-' + Math.random().toString(36).slice(2), code);
			return svg;
		} catch (e: any) {
			throw e;
		}
	}
}
