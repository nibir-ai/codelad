/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event, Emitter } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { localize } from '../../../../nls.js';
import { IAssignmentService } from '../../../../platform/assignment/common/assignment.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { ConfigurationScope, Extensions, IConfigurationRegistry } from '../../../../platform/configuration/common/configurationRegistry.js';
import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { workbenchConfigurationNodeBase } from '../../../common/configuration.js';

export interface IAssignmentFilter {
	readonly id: string;
	exclude(assignment: string): boolean;
	onDidChange: Event<void>;
}

export const IWorkbenchAssignmentService = createDecorator<IWorkbenchAssignmentService>('assignmentService');

export interface ITreatmentWithAssignment<T extends string | number | boolean> {
	readonly value: T | undefined;
	readonly hasAssignment: Promise<boolean>;
}

export interface IWorkbenchAssignmentService extends IAssignmentService {
	getCurrentExperiments(): Promise<string[] | undefined>;
	addTelemetryAssignmentFilter(filter: IAssignmentFilter): void;
	getTreatmentWithAssignment<T extends string | number | boolean>(name: string): Promise<ITreatmentWithAssignment<T>>;
}

/** Preserves explicit local feature overrides. Remote assignment, storage, polling and telemetry are removed. */
export class WorkbenchAssignmentService extends Disposable implements IWorkbenchAssignmentService {
	declare readonly _serviceBrand: undefined;
	private readonly changed = this._register(new Emitter<void>());
	readonly onDidRefetchAssignments = this.changed.event;

	constructor(@IConfigurationService private readonly configurationService: IConfigurationService) {
		super();
		this._register(configurationService.onDidChangeConfiguration(event => {
			if (event.affectsConfiguration('experiments.override')) {
				this.changed.fire();
			}
		}));
	}

	async getTreatment<T extends string | number | boolean>(name: string): Promise<T | undefined> {
		return this.configurationService.getValue<T>(`experiments.override.${name}`);
	}

	async getTreatmentWithAssignment<T extends string | number | boolean>(name: string): Promise<ITreatmentWithAssignment<T>> {
		return { value: await this.getTreatment<T>(name), hasAssignment: Promise.resolve(false) };
	}

	async getCurrentExperiments(): Promise<string[] | undefined> { return undefined; }
	addTelemetryAssignmentFilter(_filter: IAssignmentFilter): void { }
}

registerSingleton(IWorkbenchAssignmentService, WorkbenchAssignmentService, InstantiationType.Delayed);
Registry.as<IConfigurationRegistry>(Extensions.Configuration).registerConfiguration({
	...workbenchConfigurationNodeBase,
	properties: {
		'workbench.enableExperiments': {
			type: 'boolean',
			enum: [false],
			default: false,
			description: localize('experiments.removed', "Remote experiments and assignment services have been removed from Codelad."),
			scope: ConfigurationScope.APPLICATION,
			restricted: true
		}
	}
});
