"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var StateMutationCheck_1 = require("./StateMutationCheck");
var ActionProcessor = /** @class */ (function () {
    /* tslint:disable:no-any */
    function ActionProcessor(state, options) {
        /* tslint:enable:no-any */
        this.preProcessors = [];
        this.postProcessors = [];
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
    ActionProcessor.prototype.renderer = function (actions) {
        this.updatedComponents = [];
        var uc = this.updatedComponents;
        actions.forEach(function (action) {
            action.containersToRender(uc);
        });
        if (this.updatedComponents.length > 0) {
            this.updatedComponents.forEach(function (container) {
                container.handleChange(actions);
            });
        }
        return actions;
    };
    /**
     * Return an array of the last ContainerComponents that were updated and rendered, see {@link renderer}.
     * @returns {AnyContainerComponent[]}
     */
    ActionProcessor.prototype.getUpdatedComponents = function () {
        return this.updatedComponents;
    };
    ActionProcessor.prototype.preProcess = function (actions) {
        actions = this.process(actions, this.preProcessors);
        if (this.mutationCheck.isEnabled()) {
            this.mutationCheck.preActionStateCheck(actions);
        }
        return actions;
    };
    ActionProcessor.prototype.postProcess = function (actions) {
        // if checking for changes, do it immediately after actions have executed
        if (this.mutationCheck.isEnabled()) {
            this.mutationCheck.postActionCopyState(actions);
        }
        actions.forEach(function (action) {
            if (action.postHook) {
                action.postHook();
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
            pre: this.preProcessors.slice(),
            post: this.postProcessors.slice()
        };
    };
    return ActionProcessor;
}());
exports.ActionProcessor = ActionProcessor;
//# sourceMappingURL=ActionProcessor.js.map