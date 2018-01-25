import {Action} from "../actions/actions";

export interface IActionQueue {
  /**
   * Add the actions to the queue and increment currentIndex.  Note that if
   * some actions have been undone, they will be removed from the queue.
   * @param {Action} actions
   * @returns {number} currentIndex
   */
  //push: (...actions: Action[]) => number,
  push: (action: Action) => number,
  /**
   * Get the lastN actions from the queue, or as many as are available.
   * Used in undo operations.
   * @param {number} lastN
   * @returns the number of actions performed, should be exactly actions.length
   */
  lastActions: (lastN?: number) => Action[],
  /**
   * Get the nextN actions above the current index from the queue, or as many as are available.
   * Used in redo operations.
   * @param {number} nextN
   * @returns the actual number of actions to be undone, may be less than lastN
   */
  nextActions: (nextN?: number) => Action[],
  /**
   * Increment the current index by dc.  Used in undo and redo operations, where actions are left
   * on the queue and undone or redone.
   * @param {number} dc
   * @returns {number} return the actual number of actions to be redone, may be less than nextN
   */
  incrementCurrentIndex: (dc: number) => number,

  size: () => number,

  max: () => number
}

/**
 * Queue of actions which have been executed, some of which may have been undone,
 * and the currentIndex, below which all have been executed, equal to or above
 * have been undone.
 *
 * @param {number} _max defaults to 100
 * @returns {any}
 */
export const createActionQueue = function (_max: number = 100): IActionQueue {
  let queue: Action[] = [];
  let max: number = _max;
  let currentIndex: number = -1;

  let api: IActionQueue = {
    push: function (actions: Action): number {
      // If the currentIndex is less than queue.length, some actions have been undone,
      // these new incoming actions are to be done, so the undone actions are discarded
      if (currentIndex < queue.length) {
        queue.splice(currentIndex, queue.length - currentIndex);
      }
      if (queue.length >= max) {
        queue.copyWithin(0, 1);
        queue[queue.length-1] = actions;
      } else {
        queue.push(actions);
      }
      currentIndex = queue.length;
      return actions ? 1 : 0;
    },
    lastActions: function (lastN: number = 1): Action[] {
      return queue.slice(-lastN);
    },
    nextActions: function (nextN: number = 1): Action[] {
      let len = Math.min(queue.length - currentIndex, nextN);
      return queue.slice(currentIndex, len);
    },
    incrementCurrentIndex(dc: number): number {
      let newIndex = currentIndex + dc;
      if (0 <= newIndex && newIndex <= queue.length) {
        currentIndex = newIndex;
      } else if (0 > newIndex) {
        currentIndex = 0;
      } else if (newIndex > queue.length) {
        currentIndex = queue.length;
      }
      return currentIndex;
    },
    max() {
      return max;
    },
    size() {
      return queue.length;
    }

  };
  return api;
};