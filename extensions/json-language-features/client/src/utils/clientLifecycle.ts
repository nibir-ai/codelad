/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Disposable } from 'vscode';
import type { AsyncDisposable } from '../jsonClient';

/** Keeps client logging available until asynchronous deactivation has settled. */
export class ClientLifecycle implements AsyncDisposable {

	readonly ready: Promise<AsyncDisposable>;
	private disposal: Promise<void> | undefined;

	constructor(
		private readonly outputChannel: Disposable,
		start: () => Promise<AsyncDisposable>
	) {
		this.ready = Promise.resolve().then(start);
	}

	dispose(): Promise<void> {
		return this.disposal ??= this.ready.then(async client => {
			try {
				await client.dispose();
			} finally {
				this.outputChannel.dispose();
			}
		}, () => {
			// Activation reports its own failure; its output channel still needs cleanup.
			this.outputChannel.dispose();
		});
	}
}
