import * as assert from 'assert';
let vscode: any;
try { vscode = require('vscode'); } catch { /* running outside VS Code test host */ }
import { suite, test } from 'mocha';

suite('Extension Test Suite', () => {
		test('Activation command is registered (if VS Code test env)', async function () {
			if (!vscode) return this.skip();
			const commands = await vscode.commands.getCommands(true);
			assert.ok(commands.includes('projectAtlas.open'));
		});
});
