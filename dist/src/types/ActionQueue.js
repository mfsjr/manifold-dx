"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createActionQueue = void 0;
/**
 * Queue of actions which have been executed, some of which may have been undone,
 * and the currentIndex, below which all have been executed, equal to or above
 * have been undone.
 *
 * @param {number} _max defaults to 100
 * @returns {any}
 */
exports.createActionQueue = function (_max) {
    if (_max === void 0) { _max = 100; }
    var queue = [];
    var max = _max;
    var currentIndex = -1;
    var api = {
        push: function (actions) {
            // If the currentIndex is less than queue.length, some actions have been undone,
            // these new incoming actions are to be done, so the undone actions are discarded
            if (currentIndex < queue.length) {
                queue.splice(currentIndex, queue.length - currentIndex);
            }
            if (queue.length >= max) {
                queue.copyWithin(0, 1);
                queue[queue.length - 1] = actions;
            }
            else {
                queue.push(actions);
            }
            currentIndex = queue.length;
            return actions ? 1 : 0;
        },
        lastActions: function (lastN) {
            if (lastN === void 0) { lastN = 1; }
            return queue.slice(-lastN);
        },
        nextActions: function (nextN) {
            if (nextN === void 0) { nextN = 1; }
            var len = Math.min(queue.length - currentIndex, nextN);
            return queue.slice(currentIndex, len);
        },
        incrementCurrentIndex: function (dc) {
            var newIndex = currentIndex + dc;
            if (0 <= newIndex && newIndex <= queue.length) {
                currentIndex = newIndex;
            }
            else if (0 > newIndex) {
                currentIndex = 0;
            }
            else if (newIndex > queue.length) {
                currentIndex = queue.length;
            }
            return currentIndex;
        },
        max: function () {
            return max;
        },
        size: function () {
            return queue.length;
        }
    };
    return api;
};
//# sourceMappingURL=ActionQueue.js.map