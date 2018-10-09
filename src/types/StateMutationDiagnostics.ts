import { DiffPatcher } from 'jsondiffpatch';
import * as _ from 'lodash';
import { Store } from './Store';
import { MutationError } from './StateMutationCheck';

/**
 * Separating this script from {@link StateMutationCheck} opens up the possibility of
 * doing environment-based initialization at some point in the future.
 *
 * Right now, there's no obvious way to do that, since start.js and test.js
 * scripts are written in JS, and we can't initialize this from those places (easily, yet).
 *
 * @type {DiffPatcher}
 */

const diffPatcher = new DiffPatcher();

export let onFailureDiff = function<S>(baseline: S, failure: S): string {
  // console.log(`StateMutationCheck failed: `);
  let baselineClone = _.cloneDeep(baseline);
  Store.stripStateObject(baselineClone);
  let failureClone = _.cloneDeep(failure);
  Store.stripStateObject(failureClone);
  let delta = diffPatcher.diff(baselineClone, failureClone);
  let result = JSON.stringify(delta, null, 4);
  // console.log(result);
  throw new MutationError(result);
};
