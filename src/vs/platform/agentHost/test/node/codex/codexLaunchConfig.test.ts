/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import { CODEX_COPILOT_MODEL_PROVIDER } from '../../../common/codexModelSelection.js';
import { buildCodexLaunchConfig, buildCodexResumeParams, codexPermissionProfile, codexPermissionProfileOverrides, codexPermissionProfileReadRoots, codexServiceTierOverride } from '../../../node/codex/codexLaunchConfig.js';

suite('CodexLaunchConfig', () => {
	ensureNoDisposablesAreLeakedInTestSuite();

	test('adds the Copilot proxy and enforces telemetry overrides after extra arguments', () => {
		const config = buildCodexLaunchConfig('/sdk/codex', { PATH: '/bin', OPENAI_API_KEY: 'personal' }, { baseUrl: 'http://127.0.0.1:1234', nonce: 'nonce' }, ['--log-level=debug', '-c', 'analytics.enabled=true']);
		assert.deepStrictEqual(config.env, {
			PATH: '/bin', OPENAI_API_KEY: 'nonce', AI_AGENT: 'github_copilot_vscode_agent',
			OTEL_SDK_DISABLED: 'true', OTEL_TRACES_EXPORTER: 'none', OTEL_METRICS_EXPORTER: 'none',
			OTEL_LOGS_EXPORTER: 'none', COPILOT_OTEL_ENABLED: 'false', CLAUDE_CODE_ENABLE_TELEMETRY: '0'
		});
		assert.ok(config.args.includes('model_providers.vscode-proxy.name="VS Code Proxy"'));
		assert.ok(!config.args.some(argument => argument.startsWith('model_provider=')));
		assert.ok(config.args.includes('model_providers.vscode-proxy.requires_openai_auth=false'));
		assert.ok(config.args.includes('features.image_generation=false'));
		assert.ok(config.args.includes('features.cwd_relative_turn_diffs=true'));
		assert.ok(config.args.includes('shell_environment_policy.set.AI_AGENT="github_copilot_vscode_agent"'));
		assert.ok(config.args.includes('--log-level=debug'));
		assert.ok(config.args.indexOf('analytics.enabled=true') < config.args.lastIndexOf('analytics.enabled=false'));
		assert.deepStrictEqual(config.args.slice(-12), [
			'-c', 'analytics.enabled=false',
			'-c', 'feedback.enabled=false',
			'-c', 'otel.log_user_prompt=false',
			'-c', 'otel.trace_exporter="none"',
			'-c', 'otel.exporter="none"',
			'-c', 'otel.metrics_exporter="none"',
		]);
	});

	test('inherited and injected telemetry cannot enable export or prompt capture', () => {
		const config = buildCodexLaunchConfig('/sdk/codex', { OTEL_EXPORTER_OTLP_ENDPOINT: 'https://collector.invalid', TRACEPARENT: 'private-context', PATH: '/user/bin' }, { baseUrl: 'http://127.0.0.1:1234', nonce: 'nonce' }, [], {
			traces: { endpoint: 'https://collector.invalid', protocol: 'http/json' },
			external: { endpoint: 'https://collector.invalid', protocol: 'grpc' },
			captureContent: true, resourceAttributes: { 'user.name': 'private-user' }
		});
		assert.deepStrictEqual({ endpoint: config.env.OTEL_EXPORTER_OTLP_ENDPOINT, trace: config.env.TRACEPARENT, disabled: config.env.OTEL_SDK_DISABLED, path: config.env.PATH, overrides: config.args.slice(-12) }, {
			endpoint: undefined, trace: undefined, disabled: 'true', path: '/user/bin', overrides: [
				'-c', 'analytics.enabled=false', '-c', 'feedback.enabled=false', '-c', 'otel.log_user_prompt=false',
				'-c', 'otel.trace_exporter="none"', '-c', 'otel.exporter="none"', '-c', 'otel.metrics_exporter="none"'
			]
		});
	});

	test('adds client skill read access without overriding the profiles existing restrictions', () => {
		assert.deepStrictEqual(codexPermissionProfileReadRoots(['/plugins/cache'], 'darwin'), {
			'permissions.vscode-workspace.filesystem': {
				':minimal': 'read',
				':workspace_roots': { '.': 'write', '.git': 'read', '.agents': 'read', '.codex': 'read' },
				':tmpdir': 'write',
				'/plugins/cache': 'read',
			},
		});
	});

	test('defines workspace-scoped permission profiles after extra arguments', () => {
		const config = buildCodexLaunchConfig('/sdk/codex', {}, { baseUrl: 'http://127.0.0.1:1234', nonce: 'nonce' }, ['-c', 'default_permissions=":danger-full-access"', '-c', 'sandbox_mode="danger-full-access"']);
		const expectedOverrides = codexPermissionProfileOverrides('/sdk/codex');
		assert.deepStrictEqual({
			profiles: expectedOverrides.map(override => config.args.includes(override)),
			secureDefaultWins: config.args.indexOf('default_permissions=":danger-full-access"') < config.args.indexOf('default_permissions="vscode-workspace"'),
			selection: {
				workspace: codexPermissionProfile('workspace-write', false),
				workspaceWithNetwork: codexPermissionProfile('workspace-write', true),
				readOnly: codexPermissionProfile('read-only', true),
				fullAccess: codexPermissionProfile('danger-full-access', false),
			},
		}, {
			profiles: expectedOverrides.map(() => true),
			secureDefaultWins: true,
			selection: {
				workspace: 'vscode-workspace',
				workspaceWithNetwork: 'vscode-workspace-network',
				readOnly: 'vscode-workspace-read-only',
				fullAccess: ':danger-full-access',
			},
		});
	});

	test('keeps the Linux runtime readable through inherited skill profiles without granting SDK directory access', () => {
		const linuxProfiles = codexPermissionProfileOverrides('/sdk/codex', 'linux');
		const linuxProfile = linuxProfiles[1];
		const macProfile = codexPermissionProfileOverrides('/sdk/codex', 'darwin')[1];
		const windowsProfiles = codexPermissionProfileOverrides('/sdk/codex', 'win32');
		const windowsProfile = windowsProfiles[1];
		assert.deepStrictEqual({
			linux: linuxProfile,
			linuxWorkspace: linuxProfiles[2],
			skillOverrides: codexPermissionProfileReadRoots(['/plugins/cache'], 'linux'),
			mac: macProfile,
			windows: windowsProfiles,
			temp: [linuxProfile, macProfile, windowsProfile].map(profile => [profile.includes('":tmpdir" = "write"'), profile.includes('":slash_tmp" = "read"')]),
		}, {
			linux: 'permissions.vscode-runtime={ filesystem = { ":minimal" = "read", ":workspace_roots" = { "." = "write", ".git" = "read", ".agents" = "read", ".codex" = "read" }, ":tmpdir" = "write", ":slash_tmp" = "read", "/sdk/codex" = "read" }, network = { enabled = false } }',
			linuxWorkspace: 'permissions.vscode-workspace={ extends = "vscode-runtime" }',
			skillOverrides: {
				'permissions.vscode-workspace.filesystem': {
					':minimal': 'read',
					':workspace_roots': { '.': 'write', '.git': 'read', '.agents': 'read', '.codex': 'read' },
					':tmpdir': 'write',
					':slash_tmp': 'read',
					'/plugins/cache': 'read',
				},
			},
			mac: 'permissions.vscode-workspace={ filesystem = { ":minimal" = "read", ":workspace_roots" = { "." = "write", ".git" = "read", ".agents" = "read", ".codex" = "read" }, ":tmpdir" = "write" }, network = { enabled = false } }',
			windows: [
				'default_permissions="vscode-workspace"',
				'permissions.vscode-workspace={ extends = ":workspace", network = { enabled = false } }',
				'permissions.vscode-workspace-network={ extends = "vscode-workspace", network = { enabled = true } }',
				'permissions.vscode-workspace-read-only={ extends = ":read-only" }',
			],
			temp: [[true, true], [true, false], [false, false]],
		});
	});

	test('clears the service tier only for the Copilot provider', () => {
		assert.deepStrictEqual({
			copilot: codexServiceTierOverride(CODEX_COPILOT_MODEL_PROVIDER),
			native: codexServiceTierOverride('openai'),
			custom: codexServiceTierOverride('custom-provider'),
			unspecified: codexServiceTierOverride(undefined),
		}, {
			copilot: { serviceTier: null },
			native: {},
			custom: {},
			unspecified: {},
		});
	});

	test('resume explicitly binds each session model and provider', () => {
		assert.deepStrictEqual(buildCodexResumeParams({ modelProvider: 'openai', modelId: 'native-model' }, 'thread-a', {}, undefined, {}, undefined, true), {
			threadId: 'thread-a',
			model: 'native-model',
			modelProvider: 'openai',
			config: { 'features.default_mode_request_user_input': true, 'features.image_generation': true },
		});
		assert.deepStrictEqual(buildCodexResumeParams({ modelProvider: CODEX_COPILOT_MODEL_PROVIDER, modelId: 'copilot-model' }, 'thread-b', { GitHub: { url: 'https://api.githubcopilot.com/mcp/' } }), {
			threadId: 'thread-b',
			model: 'copilot-model',
			modelProvider: CODEX_COPILOT_MODEL_PROVIDER,
			serviceTier: null,
			config: { 'features.default_mode_request_user_input': true, 'features.image_generation': false, mcp_servers: { GitHub: { url: 'https://api.githubcopilot.com/mcp/' } } },
		});
		assert.deepStrictEqual(buildCodexResumeParams({ modelProvider: 'openai', modelId: 'native-model' }, 'thread-c', {}, undefined, {
			agents: { Reviewer: { description: 'Reviews', config_file: '/tmp/reviewer.toml' } },
		}, 'Use the selected reviewer instructions.'), {
			threadId: 'thread-c',
			model: 'native-model',
			modelProvider: 'openai',
			config: { agents: { Reviewer: { description: 'Reviews', config_file: '/tmp/reviewer.toml' } }, 'features.default_mode_request_user_input': true, 'features.image_generation': false },
			developerInstructions: 'Use the selected reviewer instructions.',
		});
		assert.deepStrictEqual(buildCodexResumeParams({ modelProvider: 'custom-provider', modelId: 'custom-model' }, 'thread-c', {}, ['/repo-a', '/repo-b']), {
			threadId: 'thread-c',
			model: 'custom-model',
			modelProvider: 'custom-provider',
			cwd: '/repo-a',
			runtimeWorkspaceRoots: ['/repo-a', '/repo-b'],
			config: { 'features.default_mode_request_user_input': true, 'features.image_generation': false },
		});
		assert.deepStrictEqual(buildCodexResumeParams({ modelProvider: 'openai', modelId: 'native-model' }, 'thread-d', {}, ['/repo'], {}, undefined, false, {
			approvalPolicy: 'on-request',
			approvalsReviewer: 'auto_review',
			permissions: 'vscode-workspace',
		}), {
			threadId: 'thread-d',
			model: 'native-model',
			modelProvider: 'openai',
			cwd: '/repo',
			runtimeWorkspaceRoots: ['/repo'],
			approvalPolicy: 'on-request',
			approvalsReviewer: 'auto_review',
			permissions: 'vscode-workspace',
			config: { 'features.default_mode_request_user_input': true, 'features.image_generation': false },
		});
	});
});
