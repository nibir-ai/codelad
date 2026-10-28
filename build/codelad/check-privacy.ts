/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertCodeladPrivacy } from './privacy.ts';

// Pass the final packaged product.json as an argument when checking distribution artifacts.
const file = resolve(process.argv[2] ?? 'product.json');
assertCodeladPrivacy(JSON.parse(readFileSync(file, 'utf8')));
console.log('Codelad product privacy configuration passed. Runtime network verification is still required.');
