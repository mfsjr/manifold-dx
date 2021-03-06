import { Action } from '../actions/actions';
import * as _ from 'lodash';
import { Store } from './Store';

export class MutationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Default implementation for lightweight state mutation warnings, meaning that
 * libraries that do diagnostics are not loaded.  To be used only in PROD, non-PROD
 * environments should be using StateMutationDiagnostics "onFailureDiff".
 *
 * @param {S} baseline
 * @param {S} failure
 * @returns {string}
 */
let onFailureWarn = function<S>(baseline: S, failure: S): string {
  let result = `StateMutationCheck ERROR: state is being changed by something other than an action!!!`;
  throw new MutationError(result);
};

/**
 * This class implements mutation checking by taking, storing and testing snapshots
 * of application state, and should only be used in non-prod environments (and obviously
 * automated testing).
 *
 * If a developer accidentally makes a change to any piece of state data, other than through
 * actions, this is what can detect and warns you about it.  You should use it for all your
 * testing and development.
 *
 * It relies on lodash _.isEqual for deep comparison, and if not equal, will print out the
 * differences.
 *
 * This should always be disabled in production!
 *
 */
export class StateMutationCheck<S> {

  public onFailure: (baseline: S, failure: S) => string;

  private lastGood: S;

  private enabled: boolean = false;

  private store: Store<S>;

  constructor(store: Store<S>, onFailure?: (baseline: S, failure: S) => string) {
    this.store = store;
    this.onFailure = onFailure ? onFailure : onFailureWarn;
    // this.enableMutationChecks();
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public enableMutationChecks() {
    this.lastGood = _.cloneDeep( this.store.getState() );
    this.enabled = true;
  }

  public disableMutationChecks() {
    this.enabled = false;
  }

  public check(testState: S) {
    if (!_.isEqual(this.lastGood, testState)) {
      this.onFailure(this.lastGood, testState);
    }
  }

  public postActionCopyState(actions: Action[]): Action[] {
    this.lastGood = _.cloneDeep(this.store.getState());
    return actions;
  }

  public preActionStateCheck(actions: Action[]): Action[] {
    this.check(this.store.getState());
    return actions;
  }
}
