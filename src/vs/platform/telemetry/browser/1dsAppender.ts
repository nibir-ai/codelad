/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AbstractOneDataSystemAppender } from '../common/1dsAppender.js';

/** Retains the upstream service seam without health checks, SDKs or network access. */
export class OneDataSystemWebAppender extends AbstractOneDataSystemAppender { }
