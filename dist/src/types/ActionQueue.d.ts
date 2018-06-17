import { Action } from '../actions/actions';
export interface ActionQueue {
    /**
     * Add the actions to the queue and increment currentIndex.  Note that if
     * some actions have been undone, they will be removed from the queue.
     * @param {Action} actions
     * @returns {number} currentIndex
     */
    push: (action: Action) => number;
    /**
     * Get the lastN actions from the queue, or as many as are available.
     * Used in undo operations.
     * @param {number} lastN
     * @returns the number of actions performed, should be exactly actions.length
     */
    lastActions: (lastN?: number) => Action[];
    /**
     * Get the nextN actions above the current index from the queue, or as many as are available.
     * Used in redo operations.
     * @param {number} nextN
     * @returns the actual number of actions to be undone, may be less than lastN
     */
    nextActions: (nextN?: number) => Action[];
    /**
     * Increment the current index by dc.  Used in undo and redo operations, where actions are left
     * on the queue and undone or redone.
     * @param {number} dc
     * @returns {number} return the actual number of actions to be redone, may be less than nextN
     */
    incrementCurrentIndex: (dc: number) => number;
    size: () => number;
    max: () => number;
}
/**
 * Queue of actions which have been executed, some of which may have been undone,
 * and the currentIndex, below which all have been executed, equal to or above
 * have been undone.
 *
 * @param {number} _max defaults to 100
 * @returns {any}
 */
export declare const createActionQueue: (_max?: number) => ActionQueue;
