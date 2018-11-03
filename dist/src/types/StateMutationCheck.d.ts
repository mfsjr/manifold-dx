import { Action } from '../actions/actions';
import { Store } from './Store';
export declare class MutationError extends Error {
    constructor(message: string);
}
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
export declare class StateMutationCheck<S> {
    onFailure: (baseline: S, failure: S) => string;
    private lastGood;
    private enabled;
    private state;
    constructor(state: Store<S>, onFailure?: (baseline: S, failure: S) => string);
    isEnabled(): boolean;
    enableMutationChecks(): void;
    disableMutationChecks(): void;
    check(testState: S): void;
    postActionCopyState(actions: Action[]): Action[];
    preActionStateCheck(actions: Action[]): Action[];
}
