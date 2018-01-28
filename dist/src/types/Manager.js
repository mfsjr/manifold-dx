"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var State_1 = require("./State");
var MappingState_1 = require("./MappingState");
var ActionQueue_1 = require("./ActionQueue");
var ActionProcessor_1 = require("./ActionProcessor");
/**
 * Manages state, contains no references to app-specific data, which is handled in the
 * State class.
 *
 * Note that the state class contains an instance of this class.
 */
var Manager = /** @class */ (function () {
    function Manager(state, options) {
        this.resetManager(state, {});
        Manager.manager = this;
    }
    Manager.get = function () {
        return Manager.manager;
    };
    Manager.set = function (_manager) {
        Manager.manager = _manager;
    };
    Manager.prototype.resetManager = function (state, options) {
        this.state = state;
        this.actionQueue = ActionQueue_1.createActionQueue(options.actionQueueSize);
        this.mappingState = new MappingState_1.MappingState();
        this.resetActionProcessors(state, options);
    };
    Manager.prototype.getActionProcessorAPI = function () {
        return this.actionProcessor;
    };
    Manager.prototype.resetActionProcessors = function (state, options) {
        this.actionProcessor = new ActionProcessor_1.ActionProcessor(state, options);
    };
    Manager.prototype.getActionQueue = function () {
        return this.actionQueue;
    };
    Manager.prototype.actionUndo = function (nActions) {
        var _this = this;
        if (nActions === void 0) { nActions = 1; }
        var _undoActions = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            _undoActions[_i - 1] = arguments[_i];
        }
        var actions = _undoActions.length > 0 ? _undoActions : this.actionQueue.lastActions(nActions);
        actions.forEach(function (action) {
            if (actions !== _undoActions) {
                if (action.pristine) {
                    throw Error('undo cannot be performed on new/original/pristine actions');
                }
            }
            else {
                if (!action.pristine) {
                    throw Error('expecting actions passed in to be new/origin/pristine');
                }
            }
        });
        actions = this.actionProcessor.preProcess(actions);
        actions.forEach(function (action) {
            action.undo();
            _this.actionQueue.incrementCurrentIndex(-1);
        });
        actions = this.actionProcessor.postProcess(actions);
        return actions.length;
    };
    Manager.prototype.actionRedo = function (nActions) {
        var _this = this;
        if (nActions === void 0) { nActions = 1; }
        var actions = this.actionQueue.nextActions(nActions);
        actions.forEach(function (action) {
            if (action.pristine) {
                throw Error('redo cannot be performed on new/original/pristine actions');
            }
        });
        actions = this.actionProcessor.preProcess(actions);
        actions.forEach(function (action) {
            action.perform();
            _this.actionQueue.incrementCurrentIndex(1);
        });
        actions = this.actionProcessor.postProcess(actions);
        return actions.length;
    };
    Manager.prototype.actionPerform = function () {
        var _this = this;
        var actions = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            actions[_i] = arguments[_i];
        }
        actions.forEach(function (action) {
            if (!action.pristine) {
                throw new Error('you can only perform actions for new/original/pristine actions');
            }
        });
        actions = this.actionProcessor.preProcess(actions);
        actions.forEach(function (action) {
            action.perform();
            _this.actionQueue.push(action);
        });
        actions = this.actionProcessor.postProcess(actions);
        return actions.length;
    };
    /**
     * Undo actions that have been performed.
     * @param {number} lastN
     * @returns {number}
     */
    Manager.prototype.undoAction = function (lastN) {
        var _this = this;
        if (lastN === void 0) { lastN = 1; }
        // get the lastN actions and reverse their order, as we want to execute last-to-first
        var undoActions = this.actionQueue.lastActions(lastN).reverse();
        undoActions.forEach(function (action) {
            // annotateActionInState(action);
            action.undo();
            // decrement the actionQueue's current index by the actual number of actions undone
            _this.actionQueue.incrementCurrentIndex(-undoActions.length);
        });
        return undoActions.length;
    };
    /**
     * Redo actions that have been undone.
     * @param {number} nextN
     * @returns {number}
     */
    Manager.prototype.redoAction = function (nextN) {
        var _this = this;
        if (nextN === void 0) { nextN = 1; }
        var redoActions = this.actionQueue.nextActions(nextN);
        redoActions.forEach(function (action) {
            // annotateActionInState(action);
            action.perform();
            // increment the actionQueue's currentIndex by the actual number of actions redone
            _this.actionQueue.incrementCurrentIndex(redoActions.length);
        });
        // TODO: render in React!
        return redoActions.length;
    };
    Manager.prototype.getFullPath = function (container, propName) {
        var fullPath = propName;
        var containerIterator = State_1.State.createStateObjectIterator(container);
        var iteratorResult = containerIterator.next();
        while (!iteratorResult.done) {
            if (iteratorResult.value.__parent__ !== iteratorResult.value) {
                fullPath = iteratorResult.value.__my_propname__ + '.' + fullPath;
            }
            iteratorResult = containerIterator.next();
        }
        return fullPath;
    };
    Manager.prototype.getMappingState = function () {
        return this.mappingState;
    };
    return Manager;
}());
exports.Manager = Manager;
//# sourceMappingURL=Manager.js.map