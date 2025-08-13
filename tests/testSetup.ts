// JSDOM global environment for tests needing DOM (e.g., mermaid)
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { pretendToBeVisual: true });
// @ts-ignore
global.window = dom.window as any;
// @ts-ignore
global.document = dom.window.document as any;
// Provide minimal SVGElement etc.
// @ts-ignore
try {
	if (typeof global.navigator === 'undefined') {
		// @ts-ignore
		global.navigator = { userAgent: 'node.js' };
	}
} catch {
	// ignore if read-only
}
