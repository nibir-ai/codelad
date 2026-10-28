/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { URI } from '../../../../base/common/uri.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';
import { buildClaudeTelemetryEnv, buildOptions, buildSubprocessEnv, toClaudeMcpServers } from '../../node/claude/claudeSdkOptions.js';
import type { ClaudeTransport, IClaudeProxyHandle } from '../../node/claude/claudeProxyService.js';
import { McpServerType } from '../../../mcp/common/mcpPlatformTypes.js';
import { CustomizationType, McpServerStatus, type McpServerCustomization } from '../../common/state/protocol/state.js';
import type { IMcpServerDefinition } from '../../../agentPlugins/common/pluginParsers.js';

suite('claudeSdkOptions / buildSubprocessEnv', () => {

	ensureNoDisposablesAreLeakedInTestSuite();

	const SAVED_ENV = { ...process.env };
	const KNOWN_KEYS = [
		'ELECTRON_RUN_AS_NODE',
		'NODE_OPTIONS',
		'ANTHROPIC_API_KEY',
		'VSCODE_PID',
		'VSCODE_NLS_CONFIG',
		'ELECTRON_NO_ATTACH_CONSOLE',
		'PATH',
		'HOME',
		'USERPROFILE',
	];

	function clearAndSet(values: Record<string, string>): void {
		for (const key of KNOWN_KEYS) { delete process.env[key]; }
		for (const [key, value] of Object.entries(values)) { process.env[key] = value; }
	}

	teardown(() => {
		for (const key of KNOWN_KEYS) { delete process.env[key]; }
		for (const [key, value] of Object.entries(SAVED_ENV)) {
			if (value !== undefined) { process.env[key] = value; }
		}
	});

	test('strips unsafe variables and forwards home paths in proxy mode', () => {
		clearAndSet({
			VSCODE_PID: '1234',
			VSCODE_NLS_CONFIG: '{}',
			ELECTRON_NO_ATTACH_CONSOLE: '1',
			NODE_OPTIONS: '--inspect',
			ANTHROPIC_API_KEY: 'sk-leak',
			PATH: '/usr/bin',
			HOME: '/Users/test',
			USERPROFILE: 'C:\\Users\\test',
		});

		const env = buildSubprocessEnv();

		assert.deepStrictEqual({
			runAsNode: env.ELECTRON_RUN_AS_NODE,
			nodeOptions: env.NODE_OPTIONS,
			anthropicKey: env.ANTHROPIC_API_KEY,
			vscodePid: env.VSCODE_PID,
			vscodeNls: env.VSCODE_NLS_CONFIG,
			electronOther: env.ELECTRON_NO_ATTACH_CONSOLE,
			path: env.PATH,
			home: env.HOME,
			userProfile: env.USERPROFILE,
			aiAgent: env.AI_AGENT,
		}, {
			runAsNode: '1',
			nodeOptions: undefined,
			anthropicKey: undefined,
			vscodePid: undefined,
			vscodeNls: undefined,
			electronOther: undefined,
			path: undefined, // not explicitly forwarded; PATH is composed in settingsEnv, not subprocessEnv
			home: '/Users/test',
			userProfile: 'C:\\Users\\test',
			aiAgent: 'github_copilot_vscode_agent',
		});
	});

	test('injected telemetry configuration cannot enable export or prompt capture', () => {
		const environment = buildClaudeTelemetryEnv({
			traces: { endpoint: 'https://collector.invalid', protocol: 'http/json' },
			external: { endpoint: 'https://collector.invalid', protocol: 'grpc' },
			captureContent: true, resourceAttributes: { 'user.name': 'private-user' }
		});
		assert.deepStrictEqual(environment, {
			OTEL_SDK_DISABLED: 'true', OTEL_TRACES_EXPORTER: 'none', OTEL_METRICS_EXPORTER: 'none',
			OTEL_LOGS_EXPORTER: 'none', COPILOT_OTEL_ENABLED: 'false', CLAUDE_CODE_ENABLE_TELEMETRY: '0'
		});
	});

	test('always sets ELECTRON_RUN_AS_NODE=1 even when not present in process.env', () => {
		clearAndSet({});

		const env = buildSubprocessEnv();

		assert.strictEqual(env.ELECTRON_RUN_AS_NODE, '1');
	});

	test('native mode (proxied=false) inherits auth vars + PATH (SDK replace semantics) while still stripping VSCODE_*/ELECTRON_*/NODE_OPTIONS', () => {
		clearAndSet({
			VSCODE_PID: '1234',
			ELECTRON_NO_ATTACH_CONSOLE: '1',
			NODE_OPTIONS: '--inspect',
			ANTHROPIC_API_KEY: 'sk-user-key',
			CLAUDE_CODE_OAUTH_TOKEN: 'sk-ant-oat-user',
			PATH: '/usr/bin',
			HOME: '/Users/test',
		});

		const env = buildSubprocessEnv(false);

		assert.deepStrictEqual({
			// Inherited so the user's own credentials reach the `claude` subprocess.
			anthropicKey: env.ANTHROPIC_API_KEY,
			oauthToken: env.CLAUDE_CODE_OAUTH_TOKEN,
			path: env.PATH,
			home: env.HOME,
			// Still stripped — these break the Electron-node subprocess.
			vscodePid: env.VSCODE_PID,
			electronOther: env.ELECTRON_NO_ATTACH_CONSOLE,
			nodeOptions: env.NODE_OPTIONS,
			runAsNode: env.ELECTRON_RUN_AS_NODE,
			// Announces the originating VS Code surface to `gh`.
			aiAgent: env.AI_AGENT,
		}, {
			anthropicKey: 'sk-user-key',
			oauthToken: 'sk-ant-oat-user',
			path: '/usr/bin',
			home: '/Users/test',
			vscodePid: undefined,
			electronOther: undefined,
			nodeOptions: undefined,
			runAsNode: '1',
			aiAgent: 'github_copilot_vscode_agent',
		});
	});
});

suite('claudeSdkOptions / MCP server projection', () => {

	ensureNoDisposablesAreLeakedInTestSuite();

	const customization: McpServerCustomization = {
		type: CustomizationType.McpServer,
		id: 'mcp',
		uri: 'file:///mcp',
		name: 'mcp',
		state: { kind: McpServerStatus.Stopped },
	};
	const definition = (name: string, defaultCwd: URI, remote = false): IMcpServerDefinition => ({
		name,
		defaultCwd,
		uri: URI.file('/mcp.json'),
		configuration: remote
			? { type: McpServerType.REMOTE, url: 'https://example.com/mcp' }
			: { type: McpServerType.LOCAL, command: name },
		customization: { ...customization, name },
	});

	test('keeps primary stdio and all remote servers while skipping additional-root stdio', () => {
		const primary = URI.file('/primary');
		const remotePrimary = URI.parse('vscode-remote://ssh-remote+linux/primary');
		const relativePrimary = {
			...definition('relative-primary', primary),
			configuration: { type: McpServerType.LOCAL, command: 'relative-primary', cwd: '.' },
		} satisfies IMcpServerDefinition;
		const normalizedPrimary = {
			...definition('normalized-primary', primary),
			configuration: { type: McpServerType.LOCAL, command: 'normalized-primary', cwd: `${primary.fsPath}/child/..` },
		} satisfies IMcpServerDefinition;
		const result = toClaudeMcpServers([
			definition('primary', primary),
			definition('remote-primary', remotePrimary),
			relativePrimary,
			normalizedPrimary,
			definition('additional', URI.file('/additional')),
			definition('remote', URI.file('/additional'), true),
			{
				...definition('sse', URI.file('/additional'), true),
				configuration: { type: McpServerType.REMOTE, transport: 'sse', url: 'https://example.com/sse' },
			},
		], primary);

		assert.deepStrictEqual(Object.keys(result.servers), ['primary', 'remote-primary', 'relative-primary', 'normalized-primary', 'remote', 'sse']);
		assert.strictEqual(result.servers.sse.type, 'sse');
		assert.deepStrictEqual(result.skipped, ['additional']);
	});
});

suite('claudeSdkOptions / buildOptions plugins projection', () => {

	ensureNoDisposablesAreLeakedInTestSuite();

	const proxyHandle: IClaudeProxyHandle = {
		baseUrl: 'http://127.0.0.1:0',
		nonce: 'n',
		dispose: () => { },
	};
	const proxyTransport: ClaudeTransport = { kind: 'proxy', handle: proxyHandle };

	function input(pluginUris: readonly URI[] | undefined) {
		return {
			sessionId: 's1',
			workingDirectory: URI.file('/tmp/x'),
			model: undefined,
			abortController: new AbortController(),
			permissionMode: 'default' as const,
			canUseTool: async () => ({ behavior: 'allow' as const, updatedInput: {} }),
			onElicitation: async () => ({ action: 'cancel' as const }),
			isResume: false,
			mcpServers: undefined,
			...(pluginUris !== undefined ? { plugins: pluginUris.map(uri => ({ uri, skipMcpDiscovery: true })) } : {}),
		};
	}

	test('non-empty plugins project without duplicate SDK MCP discovery', async () => {
		const opts = await buildOptions(
			input([URI.file('/p/a'), URI.file('/p/b')]),
			proxyTransport,
			() => { },
		);
		assert.deepStrictEqual(opts.plugins, [
			{ type: 'local', path: URI.file('/p/a').fsPath, skipMcpDiscovery: true },
			{ type: 'local', path: URI.file('/p/b').fsPath, skipMcpDiscovery: true },
		]);
	});

	test('empty plugins array omits Options.plugins', async () => {
		const opts = await buildOptions(input([]), proxyTransport, () => { });
		assert.strictEqual(opts.plugins, undefined);
	});

	test('undefined plugins omits Options.plugins', async () => {
		const opts = await buildOptions(input(undefined), proxyTransport, () => { });
		assert.strictEqual(opts.plugins, undefined);
	});

	test('projects denied workspace MCP servers into startup settings', async () => {
		const opts = await buildOptions({
			...input(undefined),
			deniedMcpServers: [
				{ serverCommand: ['node', 'server.js'] },
				{ serverUrl: 'https://disabled.example.com/mcp' },
			],
		}, proxyTransport, () => { });
		assert.deepStrictEqual(typeof opts.settings === 'string' ? undefined : opts.settings?.deniedMcpServers, [
			{ serverCommand: ['node', 'server.js'] },
			{ serverUrl: 'https://disabled.example.com/mcp' },
		]);
	});

	test('UserPromptSubmit adds transient host context', async () => {
		const opts = await buildOptions({
			...input(undefined),
			getUserPromptAdditionalContext: () => 'Rename with exact casing',
		}, proxyTransport, () => { });
		const hook = opts.hooks?.UserPromptSubmit?.[0].hooks[0];
		const result = await hook?.({
			hook_event_name: 'UserPromptSubmit',
			prompt: 'Keep GitHub casing',
			session_id: 's1',
			transcript_path: '/tmp/transcript',
			cwd: '/tmp/x',
		}, undefined, { signal: new AbortController().signal });

		assert.deepStrictEqual(result, {
			hookSpecificOutput: {
				hookEventName: 'UserPromptSubmit',
				additionalContext: 'Rename with exact casing',
			},
		});
	});

	test('PreToolUse projects a host runtime restriction', async () => {
		const opts = await buildOptions({
			...input(undefined),
			onPreToolUse: (toolName, toolInput) => ({
				continue: false,
				stopReason: `${toolName}:${JSON.stringify(toolInput)}`,
			}),
		}, proxyTransport, () => { });
		const hook = opts.hooks?.PreToolUse?.[0].hooks[0];
		const result = await hook?.({
			hook_event_name: 'PreToolUse',
			tool_name: 'Bash',
			tool_input: { command: 'gh pr merge' },
			tool_use_id: 'tool-1',
			session_id: 's1',
			transcript_path: '/tmp/transcript',
			cwd: '/tmp/x',
		}, undefined, { signal: new AbortController().signal });

		assert.deepStrictEqual(result, {
			continue: false,
			stopReason: 'Bash:{"command":"gh pr merge"}',
		});
	});

	test('proxy transport sets ANTHROPIC_BASE_URL + per-session ANTHROPIC_AUTH_TOKEN', async () => {
		const opts = await buildOptions(input(undefined), proxyTransport, () => { });
		const env = (opts.settings as { env?: Record<string, string> }).env ?? {};
		assert.deepStrictEqual({
			baseUrl: env.ANTHROPIC_BASE_URL,
			authToken: env.ANTHROPIC_AUTH_TOKEN,
			nonessential: env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC,
			// Projected into `settings.env`; the CLI still re-stamps `AI_AGENT`
			// for its own Bash tool.
			aiAgent: env.AI_AGENT,
		}, {
			baseUrl: 'http://127.0.0.1:0',
			authToken: 'n.s1',
			nonessential: '1',
			aiAgent: 'github_copilot_vscode_agent',
		});
	});

	test('native transport omits ANTHROPIC_BASE_URL/ANTHROPIC_AUTH_TOKEN (subprocess env carries the user credentials)', async () => {
		const opts = await buildOptions(input(undefined), { kind: 'native' }, () => { });
		const env = (opts.settings as { env?: Record<string, string> }).env ?? {};
		assert.deepStrictEqual({
			baseUrl: env.ANTHROPIC_BASE_URL,
			authToken: env.ANTHROPIC_AUTH_TOKEN,
			nonessential: env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC,
		}, {
			baseUrl: undefined,
			authToken: undefined,
			nonessential: '1',
		});
	});
});

suite('claudeSdkOptions / buildOptions resumeSessionAt projection', () => {

	ensureNoDisposablesAreLeakedInTestSuite();

	const proxyHandle: IClaudeProxyHandle = {
		baseUrl: 'http://127.0.0.1:0',
		nonce: 'n',
		dispose: () => { },
	};
	const proxyTransport: ClaudeTransport = { kind: 'proxy', handle: proxyHandle };

	function input(isResume: boolean, resumeSessionAt: string | undefined) {
		return {
			sessionId: 's1',
			workingDirectory: URI.file('/tmp/x'),
			model: undefined,
			abortController: new AbortController(),
			permissionMode: 'default' as const,
			canUseTool: async () => ({ behavior: 'allow' as const, updatedInput: {} }),
			onElicitation: async () => ({ action: 'cancel' as const }),
			isResume,
			mcpServers: undefined,
			...(resumeSessionAt !== undefined ? { resumeSessionAt } : {}),
		};
	}

	test('resume + resumeSessionAt projects onto Options.resume and Options.resumeSessionAt', async () => {
		const opts = await buildOptions(input(true, 'anchor-uuid'), proxyTransport, () => { });
		assert.deepStrictEqual(
			{ resume: opts.resume, sessionId: opts.sessionId, resumeSessionAt: opts.resumeSessionAt },
			{ resume: 's1', sessionId: undefined, resumeSessionAt: 'anchor-uuid' },
		);
	});

	test('resume without resumeSessionAt omits Options.resumeSessionAt', async () => {
		const opts = await buildOptions(input(true, undefined), proxyTransport, () => { });
		assert.deepStrictEqual(
			{ resume: opts.resume, resumeSessionAt: opts.resumeSessionAt },
			{ resume: 's1', resumeSessionAt: undefined },
		);
	});

	test('non-resume startup never carries resumeSessionAt even when provided', async () => {
		const opts = await buildOptions(input(false, 'anchor-uuid'), proxyTransport, () => { });
		assert.deepStrictEqual(
			{ sessionId: opts.sessionId, resume: opts.resume, resumeSessionAt: opts.resumeSessionAt },
			{ sessionId: 's1', resume: undefined, resumeSessionAt: undefined },
		);
	});
});

suite('claudeSdkOptions / buildOptions additionalDirectories projection', () => {

	ensureNoDisposablesAreLeakedInTestSuite();

	const proxyHandle: IClaudeProxyHandle = {
		baseUrl: 'http://127.0.0.1:0',
		nonce: 'n',
		dispose: () => { },
	};
	const proxyTransport: ClaudeTransport = { kind: 'proxy', handle: proxyHandle };

	function input(additionalDirectories: readonly URI[] | undefined) {
		return {
			sessionId: 's1',
			workingDirectory: URI.file('/tmp/primary'),
			model: undefined,
			abortController: new AbortController(),
			permissionMode: 'default' as const,
			canUseTool: async () => ({ behavior: 'allow' as const, updatedInput: {} }),
			onElicitation: async () => ({ action: 'cancel' as const }),
			isResume: false,
			mcpServers: undefined,
			...(additionalDirectories !== undefined ? { additionalDirectories } : {}),
		};
	}

	test('projects cwd from the primary and additionalDirectories from the tail', async () => {
		const opts = await buildOptions(input([URI.file('/tmp/b'), URI.file('/tmp/c')]), proxyTransport, () => { });
		assert.deepStrictEqual(
			{ cwd: opts.cwd, additionalDirectories: opts.additionalDirectories },
			{ cwd: URI.file('/tmp/primary').fsPath, additionalDirectories: [URI.file('/tmp/b').fsPath, URI.file('/tmp/c').fsPath] },
		);
	});

	test('empty additionalDirectories omits Options.additionalDirectories', async () => {
		const opts = await buildOptions(input([]), proxyTransport, () => { });
		assert.deepStrictEqual(
			{ cwd: opts.cwd, additionalDirectories: opts.additionalDirectories },
			{ cwd: URI.file('/tmp/primary').fsPath, additionalDirectories: undefined },
		);
	});

	test('undefined additionalDirectories omits Options.additionalDirectories', async () => {
		const opts = await buildOptions(input(undefined), proxyTransport, () => { });
		assert.strictEqual(opts.additionalDirectories, undefined);
	});
});
