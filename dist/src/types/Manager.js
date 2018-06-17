"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var State_1 = require("./State");
var actions_1 = require("../actions/actions");
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
    Manager.get = function (stateObject) {
        var topState = State_1.Store.getTopState(stateObject);
        var result = Manager.stateManagerMap.get(topState);
        if (!result) {
            var err = "Failed to find manager for stateObject = \n        " + JSON.stringify(stateObject, State_1.JSON_replaceCyclicParent, 4);
            throw Error(err);
        }
        return result;
    };
    Manager.set = function (stateObject, manager) {
        if (Manager.stateManagerMap.has(stateObject)) {
            var message = "Map already has key for \n        " + JSON.stringify(stateObject, State_1.JSON_replaceCyclicParent, 4);
            throw new Error(message);
        }
        Manager.stateManagerMap.set(stateObject, manager);
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
        if (nActions === 0 && _undoActions.length === 0) {
            throw Error("Expecting to undo existing actions or receive actions to undo, received neither");
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
                    throw Error('expecting actions passed in to be new/original/pristine');
                }
            }
        });
        var actionMethod = function (action) {
            actions_1.Action.undo(action);
            _this.actionQueue.incrementCurrentIndex(-1);
        };
        return this.performActions.apply(this, [actionMethod].concat(actions));
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
        var actionMethod = function (action) {
            actions_1.Action.perform(action);
            _this.actionQueue.incrementCurrentIndex(1);
        };
        return this.performActions.apply(this, [actionMethod].concat(actions));
    };
    /**
     * All new actions are performed here.  Actions may be undone via {@link actionUndo} or replayed via
     * {@link actionRedo}.
     *
     * @param {Action} actions
     * @returns {number}
     */
    Manager.prototype.actionProcess = function () {
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
        var actionMethod = function (action) {
            actions_1.Action.perform(action);
            _this.actionQueue.push(action);
        };
        return this.performActions.apply(this, [actionMethod].concat(actions));
    };
    Manager.prototype.performActions = function (actionMethod) {
        var actions = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            actions[_i - 1] = arguments[_i];
        }
        actions = this.actionProcessor.preProcess(actions);
        actions.forEach(function (action) { return actionMethod(action); });
        actions = this.actionProcessor.postProcess(actions);
        return actions;
    };
    Manager.prototype.getFullPath = function (container, propName) {
        var fullPath = propName;
        var containerIterator = State_1.Store.createStateObjectIterator(container);
        var iteratorResult = containerIterator.next();
        while (!iteratorResult.done) {
            if (iteratorResult.value._parent !== iteratorResult.value) {
                fullPath = iteratorResult.value._myPropname + '.' + fullPath;
            }
            iteratorResult = containerIterator.next();
        }
        return fullPath;
    };
    Manager.prototype.getMappingState = function () {
        return this.mappingState;
    };
    Manager.stateManagerMap = new Map();
    return Manager;
}());
exports.Manager = Manager;
//# sourceMappingURL=Manager.js.map