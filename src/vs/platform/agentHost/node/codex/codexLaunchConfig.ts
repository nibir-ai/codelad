/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { disableAgentTelemetry } from '../../common/agentTelemetryPolicy.js';
import { AiAgentEnvValue, AiAgentEnvVar } from '../../../chat/common/aiAgentEnv.js';
import { CODEX_COPILOT_MODEL_PROVIDER } from '../../common/codexModelSelection.js';
import type { IAgentHostNativeOTelConfig } from '../../common/otel/agentHostOTelService.js';
import type { ThreadResumeParams } from './protocol/generated/v2/ThreadResumeParams.js';
import type { JsonValue } from './protocol/generated/serde_json/JsonValue.js';
import type { SandboxMode } from './protocol/generated/v2/SandboxMode.js';

const CODEX_VSCODE_WORKSPACE_PERMISSION_PROFILE = 'vscode-workspace';
const CODEX_VSCODE_RUNTIME_PERMISSION_PROFILE = 'vscode-runtime';
const CODEX_VSCODE_WORKSPACE_NETWORK_PERMISSION_PROFILE = 'vscode-workspace-network';
const CODEX_VSCODE_WORKSPACE_READ_ONLY_PERMISSION_PROFILE = 'vscode-workspace-read-only';

type CodexFileSystemPermissions = Record<string, string | Record<string, string>>;

/**
 * Custom POSIX profiles start with Codex's empty restricted policy. Inheriting
 * `:workspace` grants root reads, but explicitly denying them keeps even approved
 * `require_escalated` commands sandboxed. Grant only the intended baseline access.
 */
function codexWorkspaceFileSystemPermissions(platform: NodeJS.Platform, binaryPath?: string): CodexFileSystemPermissions {
	return platform === 'win32' ? {} : {
		':minimal': 'read',
		':workspace_roots': { '.': 'write', '.git': 'read', '.agents': 'read', '.codex': 'read' },
		':tmpdir': 'write',
		...(platform === 'linux' ? { ':slash_tmp': 'read' } : {}),
		...(platform === 'linux' && binaryPath ? { [binaryPath]: 'read' } : {}),
	};
}

function serializeFileSystemPermissions(permissions: CodexFileSystemPermissions): string {
	return `{ ${Object.entries(permissions).map(([path, access]) => `${JSON.stringify(path)} = ${typeof access === 'string' ? JSON.stringify(access) : serializeFileSystemPermissions(access)}`).join(', ')} }`;
}

export function codexPermissionProfileOverrides(binaryPath: string, platform: NodeJS.Platform = process.platform): string[] {
	const baseProfile = platform === 'linux' ? CODEX_VSCODE_RUNTIME_PERMISSION_PROFILE : CODEX_VSCODE_WORKSPACE_PERMISSION_PROFILE;
	const baseProfilePermissions = platform === 'win32'
		? 'extends = ":workspace"'
		: `filesystem = ${serializeFileSystemPermissions(codexWorkspaceFileSystemPermissions(platform, binaryPath))}`;
	const readOnlyProfile = platform === 'win32'
		? `permissions.${CODEX_VSCODE_WORKSPACE_READ_ONLY_PERMISSION_PROFILE}={ extends = ":read-only" }`
		: `permissions.${CODEX_VSCODE_WORKSPACE_READ_ONLY_PERMISSION_PROFILE}={ extends = "${CODEX_VSCODE_WORKSPACE_PERMISSION_PROFILE}", filesystem = { ":workspace_roots" = { "." = "read" } } }`;
	return [
		`default_permissions="${CODEX_VSCODE_WORKSPACE_PERMISSION_PROFILE}"`,
		`permissions.${baseProfile}={ ${baseProfilePermissions}, network = { enabled = false } }`,
		...(platform === 'linux' ? [`permissions.${CODEX_VSCODE_WORKSPACE_PERMISSION_PROFILE}={ extends = "${baseProfile}" }`] : []),
		`permissions.${CODEX_VSCODE_WORKSPACE_NETWORK_PERMISSION_PROFILE}={ extends = "${CODEX_VSCODE_WORKSPACE_PERMISSION_PROFILE}", network = { enabled = true } }`,
		readOnlyProfile,
	];
}

export function codexPermissionProfile(mode: SandboxMode, networkAccess: boolean): string {
	if (mode === 'danger-full-access') {
		return ':danger-full-access';
	}
	if (mode === 'read-only') {
		return CODEX_VSCODE_WORKSPACE_READ_ONLY_PERMISSION_PROFILE;
	}
	return networkAccess ? CODEX_VSCODE_WORKSPACE_NETWORK_PERMISSION_PROFILE : CODEX_VSCODE_WORKSPACE_PERMISSION_PROFILE;
}

export function codexPermissionProfileReadRoots(readRoots: readonly string[], platform: NodeJS.Platform = process.platform): Record<string, JsonValue> {
	return {
		[`permissions.${CODEX_VSCODE_WORKSPACE_PERMISSION_PROFILE}.filesystem`]: {
			...codexWorkspaceFileSystemPermissions(platform),
			...Object.fromEntries(readRoots.map(root => [root, 'read'])),
		},
	};
}

export interface ICodexLaunchProxy {
	readonly baseUrl: string;
	readonly nonce: string;
}

export interface ICodexLaunchConfig {
	readonly env: NodeJS.ProcessEnv;
	readonly args: readonly string[];
}

export const CODEX_DEFAULT_MODE_REQUEST_USER_INPUT_CONFIG_KEY = 'features.default_mode_request_user_input';

/**
 * Copilot's Responses endpoint rejects Codex's inherited fast/priority tier.
 * Send `serviceTier: null` to Codex's app-server to clear that inherited tier;
 * Codex then omits `service_tier` from the outbound Responses request.
 * Omit the override for native providers to preserve the user's service tier.
 */
export function codexServiceTierOverride(modelProvider: string | undefined): Pick<ThreadResumeParams, 'serviceTier'> {
	return modelProvider === CODEX_COPILOT_MODEL_PROVIDER ? { serviceTier: null } : {};
}

export function buildCodexResumeParams(
	model: { readonly modelProvider: string; readonly modelId: string },
	threadId: string,
	mcpServers: Readonly<Record<string, unknown>>,
	workingDirectories?: readonly string[],
	configOverrides: Readonly<Record<string, JsonValue>> = {},
	developerInstructions?: string,
	imageGenerationEnabled = false,
	permissionOverrides: Pick<ThreadResumeParams, 'approvalPolicy' | 'approvalsReviewer' | 'permissions'> = {},
): ThreadResumeParams {
	const config = {
		...configOverrides,
		[CODEX_DEFAULT_MODE_REQUEST_USER_INPUT_CONFIG_KEY]: true,
		'features.image_generation': imageGenerationEnabled,
		...(Object.keys(mcpServers).length > 0 ? { mcp_servers: mcpServers as JsonValue } : {}),
	};
	return {
		threadId,
		model: model.modelId,
		modelProvider: model.modelProvider,
		...codexServiceTierOverride(model.modelProvider),
		...(workingDirectories?.length ? {
			cwd: workingDirectories[0],
			runtimeWorkspaceRoots: [...workingDirectories],
		} : {}),
		...permissionOverrides,
		...(Object.keys(config).length > 0 ? { config } : {}),
		...(developerInstructions ? { developerInstructions } : {}),
	};
}

export function buildCodexLaunchConfig(
	binaryPath: string,
	inheritedEnv: NodeJS.ProcessEnv,
	proxy: ICodexLaunchProxy,
	extraArgs: readonly string[],
	telemetry?: IAgentHostNativeOTelConfig,
): ICodexLaunchConfig {
	const env: NodeJS.ProcessEnv = { ...inheritedEnv, [AiAgentEnvVar]: AiAgentEnvValue };
	disableAgentTelemetry(env);
	env.OPENAI_API_KEY = proxy.nonce;
	const overrides = [
		`model_providers.${CODEX_COPILOT_MODEL_PROVIDER}.name="VS Code Proxy"`,
		`model_providers.${CODEX_COPILOT_MODEL_PROVIDER}.base_url="${proxy.baseUrl}/v1"`,
		`model_providers.${CODEX_COPILOT_MODEL_PROVIDER}.wire_api="responses"`,
		`model_providers.${CODEX_COPILOT_MODEL_PROVIDER}.env_key="OPENAI_API_KEY"`,
		`model_providers.${CODEX_COPILOT_MODEL_PROVIDER}.requires_openai_auth=false`,
		`model_providers.${CODEX_COPILOT_MODEL_PROVIDER}.supports_websockets=false`,
		// Codex filters its shell tool's env through `shell_environment_policy`,
		// so pin the marker there too — a user policy (e.g. `inherit = "core"`)
		// would otherwise drop it.
		`shell_environment_policy.set.${AiAgentEnvVar}="${AiAgentEnvValue}"`,
		`features.tool_call_mcp_elicitation=false`,
		// Keep image generation disabled for the Copilot/CAPI proxy by default.
		// ChatGPT subscription threads opt in with a per-thread override.
		`features.image_generation=false`,
	];
	const permissionOverrides = codexPermissionProfileOverrides(binaryPath);
	const telemetryOverrides = codexTelemetryOverrides(telemetry);
	return {
		env,
		// The snapshot parser resolves paths against the runtime cwd. Codex otherwise emits repository-relative paths.
		args: ['app-server', ...overrides.flatMap(value => ['-c', value]), ...extraArgs, '-c', 'features.cwd_relative_turn_diffs=true', ...permissionOverrides.flatMap(value => ['-c', value]), ...telemetryOverrides.flatMap(value => ['-c', value])],
	};
}

/** Source-compatible overrides; exporter destinations and prompt capture have been removed. */
export function codexTelemetryOverrides(_config?: IAgentHostNativeOTelConfig): string[] {
	return [
		'analytics.enabled=false',
		'feedback.enabled=false',
		'otel.log_user_prompt=false',
		'otel.trace_exporter="none"',
		'otel.exporter="none"',
		'otel.metrics_exporter="none"',
	];
}
