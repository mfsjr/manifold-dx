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
exports.createDataTriggerProcessor = exports.ActionProcessor = void 0;
var actions_1 = require("../actions/actions");
var StateMutationCheck_1 = require("./StateMutationCheck");
var ActionProcessor = /** @class */ (function () {
    // private updatedComponents: AnyContainerComponent[] = [];
    /* tslint:disable:no-any */
    function ActionProcessor(state, options) {
        /* tslint:enable:no-any */
        this.preProcessors = [];
        this.postProcessors = [];
        this.createDataTriggerProcessor = function (triggers) {
            return (0, exports.createDataTriggerProcessor)(triggers);
        };
        this.mutationCheck = new StateMutationCheck_1.StateMutationCheck(state);
        /* tslint:enable:no-any */
    }
    ActionProcessor.prototype.setMutationCheckOnFailureFunction = function (newFunction) {
        this.mutationCheck.onFailure = newFunction;
    };
    ActionProcessor.prototype.getMutationCheckOnFailureFunction = function () {
        return this.mutationCheck.onFailure;
    };
    ActionProcessor.prototype.isMutationCheckingEnabled = function () {
        return this.mutationCheck.isEnabled();
    };
    /**
     * This is where mutation checking is enabled, and is where the first snapshot is taken.
     *
     * BE CAREFUL to call this after any state initialization (done by means other than actions),
     * as it will cause mutation errors!
     */
    ActionProcessor.prototype.enableMutationChecking = function () {
        this.mutationCheck.enableMutationChecks();
    };
    ActionProcessor.prototype.disableMutationChecking = function () {
        this.mutationCheck.disableMutationChecks();
    };
    // protected renderer(actions: Action[]): Action[] {
    //   this.updatedComponents = [];
    //   actions.forEach((action: Action) => {
    //     let uc: AnyContainerComponent[] = [];
    //     action.containersToRender(uc);
    //     if (uc.length > 0) {
    //       // TODO: optimize this by creating a map of container keys to action array values, call this once for each
    //       uc.forEach(container => container.handleChange([action]));
    //     }
    //     this.updatedComponents.concat(uc);
    //   });
    //   return actions;
    // }
    ActionProcessor.prototype.renderer = function (actions) {
        // this.updatedComponents.length = 0;
        // TODO: make this a private instance and containerActionsMap.clear() it rather than recreate
        var containerActionsMap = new Map();
        var uc = [];
        actions.forEach(function (action) {
            uc.length = 0;
            action.containersToRender(uc);
            if (uc.length > 0) {
                uc.forEach(function (container) {
                    var mappedActions = containerActionsMap.get(container);
                    if (!mappedActions) {
                        containerActionsMap.set(container, [action]);
                    }
                    else {
                        mappedActions.push(action);
                    }
                });
            }
        });
        if (containerActionsMap.size > 0) {
            containerActionsMap.forEach(function (mappedActions, mappedContainers) {
                mappedContainers.handleChange(mappedActions);
                // this.updatedComponents.push(mappedContainers);
            });
        }
        return actions;
    };
    // /**
    //  * Return an array of the last ContainerComponents that were updated and rendered, see {@link renderer}.
    //  * @returns {AnyContainerComponent[]}
    //  */
    // public getUpdatedComponents(): AnyContainerComponent[] {
    //   return this.updatedComponents;
    // }
    //
    ActionProcessor.prototype.preProcess = function (actions) {
        actions = this.process(actions, this.preProcessors);
        if (this.mutationCheck.isEnabled()) {
            this.mutationCheck.preActionStateCheck(actions);
        }
        return actions;
    };
    ActionProcessor.prototype.postProcess = function (actions) {
        // if checking for mutations done without actions, do it immediately after actions have executed
        if (this.mutationCheck.isEnabled()) {
            this.mutationCheck.postActionCopyState(actions);
        }
        actions.forEach(function (action) {
            if (action.actionPostReducer) {
                action.actionPostReducer();
            }
        });
        this.renderer(actions);
        return this.process(actions, this.postProcessors);
    };
    ActionProcessor.prototype.process = function (actions, processors) {
        if (processors) {
            var _actions = actions;
            for (var i = 0; i < processors.length; i++) {
                _actions = processors[i](_actions);
            }
            return _actions;
        }
        return actions;
    };
    /**
     * Processors executed in order, after the action is performed
     * @param {ActionProcessorFunctionType} processor
     */
    ActionProcessor.prototype.appendPostProcessor = function (processor) {
        this.postProcessors.push(processor);
    };
    ActionProcessor.prototype.removePostProcessor = function (toBeRemoved) {
        this.removeProcessorFrom(toBeRemoved, this.postProcessors);
    };
    ActionProcessor.prototype.removeProcessorFrom = function (toBeRemoved, processors) {
        var index = processors.indexOf(toBeRemoved);
        if (index > -1) {
            processors.splice(index, 1);
        }
    };
    ActionProcessor.prototype.removePreProcessor = function (toBeRemoved) {
        this.removeProcessorFrom(toBeRemoved, this.preProcessors);
    };
    /**
     * Processors executed in order, before the action is performed.
     * @param {ActionProcessorFunctionType} processor
     */
    ActionProcessor.prototype.appendPreProcessor = function (processor) {
        this.preProcessors.push(processor);
    };
    ActionProcessor.prototype.getProcessorClones = function () {
        return {
            pre: __spreadArray([], this.preProcessors, true),
            post: __spreadArray([], this.postProcessors, true)
        };
    };
    return ActionProcessor;
}());
exports.ActionProcessor = ActionProcessor;
/* tslint:enable:no-any */
/**
 * Create ActionProcessorFunctionType that filters for data actions, and hands them to {@link DataTrigger}s,
 * which accepts a single {@link StateCrudAction} or {@link ArrayChangeAction}, so that the DataTrigger implementation
 * can detect when certain properties are changing, and allow them to dispatch actions to other
 * dependent state properties.
 *
 * An example might be an array of objects where array elements of a particular type might be used
 * in other states, where they are mapped to other components.
 * @param actions
 * @return function of type {@link ActionProcessorFunctionType}
 */
var createDataTriggerProcessor = function (triggers) {
    var DataTriggerProcessor = function (actions) {
        actions.forEach(function (action) {
            if (action.type !== actions_1.ActionId.RERENDER && action.type !== actions_1.ActionId.MAP_STATE_TO_PROP) {
                /* tslint:disable:no-any */
                var propAction = (action instanceof actions_1.StateCrudAction) ? action : undefined;
                var arrayAction = !!propAction ? undefined : (action instanceof actions_1.ArrayChangeAction) ? action : undefined;
                var stateDataAction = propAction ? propAction : arrayAction;
                if (stateDataAction) { // execute DataTrigger functions here
                    var sda_1 = stateDataAction;
                    triggers.forEach(function (trigger) { return trigger(sda_1); });
                }
            }
        });
        return actions;
    };
    /* tslint:enable:no-any */
    return DataTriggerProcessor;
};
exports.createDataTriggerProcessor = createDataTriggerProcessor;
//# sourceMappingURL=ActionProcessor.js.map