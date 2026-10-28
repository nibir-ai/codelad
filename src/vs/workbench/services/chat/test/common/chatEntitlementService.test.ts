/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { mock } from '../../../../../base/test/common/mock.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import { TestConfigurationService } from '../../../../../platform/configuration/test/common/testConfigurationService.js';
import { TestInstantiationService } from '../../../../../platform/instantiation/test/common/instantiationServiceMock.js';
import { MockContextKeyService } from '../../../../../platform/keybinding/test/common/mockKeybindingService.js';
import { NullLogService } from '../../../../../platform/log/common/log.js';
import { IProductService } from '../../../../../platform/product/common/productService.js';
import { InMemoryStorageService } from '../../../../../platform/storage/common/storage.js';
import { NullTelemetryService } from '../../../../../platform/telemetry/common/telemetryUtils.js';
import { IWorkbenchEnvironmentService } from '../../../environment/common/environmentService.js';
import { ChatEntitlement, ChatEntitlementService, chatRequiresSetup, IChatSetupRequirement } from '../../common/chatEntitlementService.js';

suite('ChatEntitlementService without a bundled provider', () => {
	const store = ensureNoDisposablesAreLeakedInTestSuite();

	test('clearing an account policy restriction does not reveal missing-provider UI', () => {
		const service = store.add(new ChatEntitlementService(
			store.add(new TestInstantiationService()),
			new class extends mock<IProductService>() { override readonly defaultChatAgent = undefined; },
			new class extends mock<IWorkbenchEnvironmentService>() { },
			store.add(new MockContextKeyService()),
			new TestConfigurationService(), NullTelemetryService, new NullLogService(), store.add(new InMemoryStorageService())
		));
		service.setForceHidden(true);
		service.setForceHidden(false);
		assert.deepStrictEqual({ hidden: service.sentiment.hidden, requests: service.requests }, { hidden: true, requests: undefined });
	});
});

suite('chatRequiresSetup', () => {

	ensureNoDisposablesAreLeakedInTestSuite();

	function context(overrides: Partial<IChatSetupRequirement> = {}): IChatSetupRequirement {
		return {
			completed: true,
			disabled: false,
			untrusted: false,
			entitlement: ChatEntitlement.Pro,
			anonymous: false,
			hasByokModels: false,
			...overrides,
		};
	}

	test('a completed, signed-up user does not require setup', () => {
		assert.strictEqual(chatRequiresSetup(context()), false);
	});

	test('not completed requires setup', () => {
		assert.strictEqual(chatRequiresSetup(context({ completed: false })), true);
	});

	test('not completed but BYOK models present does not require setup', () => {
		assert.strictEqual(chatRequiresSetup(context({ completed: false, hasByokModels: true })), false);
	});

	test('disabled requires setup', () => {
		assert.strictEqual(chatRequiresSetup(context({ disabled: true })), true);
	});

	test('untrusted requires setup', () => {
		assert.strictEqual(chatRequiresSetup(context({ untrusted: true })), true);
	});

	test('entitlement Available requires setup (sign up)', () => {
		assert.strictEqual(chatRequiresSetup(context({ entitlement: ChatEntitlement.Available })), true);
	});

	test('signed out (Unknown) requires setup', () => {
		// completed: true so the result is driven by the Unknown entitlement, not the "not completed" clause.
		assert.strictEqual(chatRequiresSetup(context({ completed: true, entitlement: ChatEntitlement.Unknown })), true);
	});

	test('signed out but anonymous access enabled does not require setup', () => {
		// Anonymous excepts the "signed out" entitlement clause; the completed
		// clause is satisfied because opting into anonymous completes setup.
		assert.strictEqual(chatRequiresSetup(context({ completed: true, entitlement: ChatEntitlement.Unknown, anonymous: true })), false);
	});

	test('signed out but BYOK models present does not require setup', () => {
		assert.strictEqual(chatRequiresSetup(context({ completed: false, entitlement: ChatEntitlement.Unknown, hasByokModels: true })), false);
	});
});
