"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Manager = void 0;
var Store_1 = require("./Store");
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
    function Manager(_store, options) {
        // protected dispatchingActions: boolean = false;
        this.dispatchArgs = [];
        /* tslint:disable:no-any */
        this.currentDataAction = null;
        this.resetManager(_store, {});
        Manager.manager = this;
    }
    Manager.get = function (stateObject) {
        var rootState = Store_1.Store.getRootState(stateObject);
        var result = Manager.stateManagerMap.get(rootState);
        if (!result) {
            var err = "Failed to find manager for stateObject = \n        ".concat(JSON.stringify(stateObject, Store_1.JSON_replaceCyclicParent, 4));
            throw Error(err);
        }
        return result;
    };
    Manager.set = function (stateObject, manager) {
        if (Manager.stateManagerMap.has(stateObject)) {
            var message = "Map already has key for \n        ".concat(JSON.stringify(stateObject, Store_1.JSON_replaceCyclicParent, 4));
            throw new Error(message);
        }
        Manager.stateManagerMap.set(stateObject, manager);
    };
    Manager.prototype.resetManager = function (_store, options) {
        this.store = _store;
        this.actionQueue = (0, ActionQueue_1.createActionQueue)(options.actionQueueSize);
        this.mappingState = new MappingState_1.MappingState();
        this.resetActionProcessors(_store, options);
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
    /**
     * This method allows you to undo actions, from the most recent on backwards.
     * @param nActions
     * @param _undoActions
     */
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
        return this.dispatch.apply(this, __spreadArray([actionMethod], actions, false));
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
        return this.dispatch.apply(this, __spreadArray([actionMethod], actions, false));
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
        return this.dispatch.apply(this, __spreadArray([actionMethod], actions, false));
    };
    // NOTE: This commented dispatch code will catch if an action is dispatched while another executes, hold it until the
    // current action(s) are done executing, and then execute it.  Seems better to rule this out, but not really sure...
    // /**
    //  * Dispatch actions if none are being dispatched, else queue them for execution when current dispatch completes
    //  * @param actionMethod
    //  * @param actions
    //  */
    // protected dispatch2(actionMethod: (action: Action) => void, ...actions: Action[]): Action[] {
    //   if (this.dispatchingActions) {
    //     this.dispatchArgs.push({actionMethod, actions});
    //     return [];
    //   }
    //
    //   try {
    //     this.dispatchingActions = true;
    //     actions = this.actionProcessor.preProcess(actions);
    //     actions.forEach((action) => actionMethod(action));
    //     actions = this.actionProcessor.postProcess(actions);
    //     this.dispatchingActions = false;
    //   } catch (err) {
    //     this.dispatchingActions = false;
    //     /*tslint:disable:no-console*/
    //     console.log(`Error during dispatch, action(s) = ${JSON.stringify(actions, JSON_replaceCyclicParent, 4)}`);
    //     /*tslint:disable:no-console*/
    //     throw err;
    //   }
    //   while (this.dispatchArgs.length > 0) {
    //     let deferredActions = this.dispatchFromNextArgs(this.dispatchArgs);
    //     actions.push(...deferredActions);
    //   }
    //   return actions;
    // }
    /**
     * Strictly enforce that no data action can be dispatched while another is dispatching.
     * Mapping actions are invoked on rendering, so are dependent on React, which is async,
     * so we cannot enforce that here.
     *
     * @param actionMethod
     * @param actions
     */
    Manager.prototype.dispatch = function (actionMethod) {
        var _a;
        var actions = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            actions[_i - 1] = arguments[_i];
        }
        // if a no-op exists, filter it and any others out of the array
        if (actions.find(function (action) { return (0, actions_1.ActionTypeIsNoOp)(action.type); })) {
            actions = actions.filter(function (action) { return !(0, actions_1.ActionTypeIsNoOp)(action.type); });
        }
        if (actions.length === 0) {
            return actions;
        }
        var dataAction = !(actions[0] instanceof actions_1.MappingAction);
        if (dataAction && this.currentDataAction) {
            // attempting to dispatch actions while another is dispatching, so handle by deferring until we're done.
            (_a = this.store).dispatchNext.apply(_a, actions);
            return [];
            // let currentDescription = actionDescription(this.currentDataAction);
            // let message = `Dispatch ${currentDescription} interrupted by another: ${actionDescription(actions[0])}`;
            // console.log(`Warning: ${message}`);
            // message += `\nNOTE: use the dispatchNext api to avoid this error (waits until current dispatch completes)`;
            // throw new Error(message);
        }
        try {
            if (dataAction) {
                this.currentDataAction = actions[0];
            }
            actions = this.actionProcessor.preProcess(actions);
            actions.forEach(function (action) { return actionMethod(action); });
            actions = this.actionProcessor.postProcess(actions);
        }
        catch (err) {
            var actionMessage = (0, actions_1.actionDescription)(actions[0]);
            /*tslint:disable:no-console*/
            console.log("Error dispatching ".concat(actionMessage, ", actions length = ").concat(actions.length));
            /*tslint:disable:no-console*/
            throw err;
        }
        finally {
            if (dataAction) {
                this.currentDataAction = null;
            }
        }
        return actions;
    };
    Manager.prototype.dispatchFromNextArgs = function (_dispatchArgs) {
        var args = _dispatchArgs.splice(0, 1);
        return this.dispatch.apply(this, __spreadArray([args[0].actionMethod], args[0].actions, false));
    };
    Manager.prototype.getFullPath = function (container, propName) {
        var fullPath = propName;
        var containerIterator = Store_1.Store.createStateObjectIterator(container);
        var iteratorResult = containerIterator.next();
        while (!iteratorResult.done) {
            if (iteratorResult.value._parent !== iteratorResult.value && iteratorResult.value._parent !== null) {
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