let _mermaid: any | undefined;
export class MermaidRenderer {
	private currentTheme = 'default';
	private async ensure(theme?: string) {
		if (!_mermaid) {
			_mermaid = (await import('mermaid')).default;
			_mermaid.initialize({ startOnLoad: false, theme: (theme || this.currentTheme) as any });
		} else if (theme && theme !== this.currentTheme) {
			_mermaid.initialize({ startOnLoad: false, theme: theme as any });
		}
		if (theme) this.currentTheme = theme;
	}
	async render(code: string, theme?: string): Promise<string> {
		if (typeof (global as any).document === 'undefined') {
			return `<svg xmlns='http://www.w3.org/2000/svg'><text x='10' y='20'>[mermaid skipped]</text></svg>`;
		}
		await this.ensure(theme);
		const { svg } = await _mermaid.render('mermaid-' + Math.random().toString(36).slice(2), code);
		return svg;
	}
}
