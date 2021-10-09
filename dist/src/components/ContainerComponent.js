"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContainerComponent = void 0;
var React = require("react");
var actions_1 = require("../actions/actions");
var _ = require("lodash");
var Manager_1 = require("../types/Manager");
var __1 = require("../");
var recompose_1 = require("recompose");
/**
 *
 * A kind of React.Component container/controller (constructor takes a component
 * and uses it to compose/present).
 *
 * This component can delegate rendering to another react component, or you can
 * override this render to render as needed.
 *
 * CP: container props, a plain object (pojo)
 * VP: view component props, also a plain object
 * A: application state (root/top of the StateObject graph) {@link StateObject}
 * RS: React State
 */
var ContainerComponent = /** @class */ (function (_super) {
    __extends(ContainerComponent, _super);
    /**
     * Pass in the props and application state.  Optionally pass in a function component or
     * class component, or override the render method.
     *
     * @param {CP} _props
     * @param {StateObject & A} appData
     * @param {React.FunctionComponent<VP> | undefined} function component
     * @param {ComponentGenerator<VP> | undefined} viewGenerator
     */
    function ContainerComponent(_props, appData, functionComp, viewGenerator, reactState) {
        var _this = _super.call(this, _props, reactState) || this;
        _this.viewPropsUpdated = false;
        /* tslint:enable:no-any */
        _this.mappingActions = [];
        if (!_.isPlainObject(_props)) {
            throw new Error('container props must be plain objects');
        }
        _this.appState = appData;
        if (!appData) {
            throw new Error('Failed to get appData to base container');
        }
        else {
            // console.log(`appData in base container: ${JSON.stringify(this.appData, JSON_replaceCyclicParent, 4)}`);
        }
        _this.functionCompView = functionComp;
        _this.viewGenerator = viewGenerator;
        return _this;
    }
    /**
     * Convenience method
     * @param {Array<T>} oldArray
     * @param {number} index
     * @param {T} newElement
     * @returns {Array<T>}
     */
    ContainerComponent.newArray = function (oldArray, index, newElement) {
        var newArray = __spreadArrays(oldArray);
        newArray[index] = newElement;
        return newArray;
    };
    ContainerComponent.prototype.getMappingActions = function () { return this.mappingActions; };
    ContainerComponent.prototype.createMappingAction = function (parentState, _propKey, targetPropKey) {
        var postReducerCallbacks = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            postReducerCallbacks[_i - 3] = arguments[_i];
        }
        return new (actions_1.MappingAction.bind.apply(actions_1.MappingAction, __spreadArrays([void 0, parentState, _propKey, this, targetPropKey], postReducerCallbacks)))();
    };
    ContainerComponent.prototype.createMapping = function (stateObject, stateObjectProperty, targetViewProp) {
        var postReducerCallbacks = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            postReducerCallbacks[_i - 3] = arguments[_i];
        }
        return new (actions_1.MappingAction.bind.apply(actions_1.MappingAction, __spreadArrays([void 0, stateObject, stateObjectProperty, this, targetViewProp], postReducerCallbacks)))();
    };
    /**
     * Update the properties of the view (presentational component) immediately after the
     * container component's properties have changed.
     *
     * This method is invoked after state changes have been mapped but before rendering,
     * see {@link handleChange}.
     */
    ContainerComponent.prototype.updateViewProps = function (executedActions) { return; };
    /**
     * Default implementation of {@link ContainerPostReducer} functions contained in mapping actions.
     *
     * Note that only actions whose pathing matches the mapping will invoke
     *
     * @param {Action[]} executedActions have already modified state, whose changes have already been mapped,
     * but not yet rendered.
     */
    ContainerComponent.prototype.invokeContainerPostReducers = function (executedActions) {
        executedActions.forEach(function (action) {
            if (action instanceof actions_1.StateCrudAction) {
                var mappingActions = action.mappingActions;
                if (mappingActions && mappingActions.length > 0) {
                    mappingActions.forEach(function (mapping) {
                        if (mapping.postReducerCallbacks && mapping.postReducerCallbacks.length > 0) {
                            mapping.postReducerCallbacks.forEach(function (hookFunction) { return hookFunction(action); });
                        }
                    });
                }
            }
        });
    };
    /**
     * Use the executed actions to identify which state properties have changed,
     * then use the mapping actions to identify the target view props and set them.
     *
     * This is the first method called in this component's {@link handleChange} method,
     * which is invoked by the framework.
     */
    ContainerComponent.prototype.updateViewPropsUsingMappings = function (executedActions) {
        var _this = this;
        var _viewProps = this.viewProps;
        this.viewPropsUpdated = false;
        // let _displayName = this[`displayName`];
        executedActions.forEach(function (action) {
            if (action instanceof actions_1.StateAction) {
                var mappingActions = action.mappingActions;
                if (mappingActions && mappingActions.length) {
                    mappingActions.forEach(function (mapping) {
                        if (action instanceof actions_1.StateCrudAction) {
                            _viewProps[mapping.targetPropName] = action.value;
                            _this.viewPropsUpdated = true;
                        }
                        else if (action instanceof __1.ArrayChangeAction) {
                            // if we are mutating the list element, we only want to change that index
                            // otherwise its an insert/delete and we want to update the whole array
                            if (mapping.index !== undefined) {
                                _viewProps[mapping.targetPropName] = action.value;
                                _this.viewPropsUpdated = true;
                            }
                            else {
                                _viewProps[mapping.targetPropName] = action.valuesArray;
                                _this.viewPropsUpdated = true;
                            }
                        }
                    });
                }
            }
        });
    };
    ContainerComponent.prototype.componentDidMount = function () {
        var _a;
        // subscribe
        this.appendToMappingActions(this.mappingActions);
        (_a = Manager_1.Manager.get(this.appState)).actionProcess.apply(_a, this.mappingActions);
    };
    ContainerComponent.prototype.componentWillUnmount = function () {
        var _a;
        if (this.mappingActions && this.mappingActions.length > 0) {
            // unsubscribe from stateMappingActions, we need to undo these specific actions
            var unmappingActions_1 = [];
            this.mappingActions.forEach(function (action) {
                // let unmappingAction = action.clone();
                // unmappingAction.pristine = true;
                // unmappingAction.type = action.getUndoActionId();
                var unmappingAction = action.getUndoAction();
                unmappingActions_1.push(unmappingAction);
            });
            (_a = Manager_1.Manager.get(this.appState)).actionUndo.apply(_a, __spreadArrays([0], unmappingActions_1));
        }
    };
    /**
     * Hande updates for the executedActions
     * @param executedActions
     * @return true if {@link forceUpdate} was invoked, false if not
     */
    ContainerComponent.prototype.handleChange = function (executedActions) {
        this.updateViewPropsUsingMappings(executedActions);
        this.invokeContainerPostReducers(executedActions);
        this.updateViewProps(executedActions);
        var isDataAction = false;
        for (var _i = 0, executedActions_1 = executedActions; _i < executedActions_1.length; _i++) {
            var action = executedActions_1[_i];
            // we don't want mapping actions to trigger renders
            isDataAction = !(action instanceof actions_1.MappingAction);
            if (isDataAction) {
                // our state has changed, force a render
                this.forceUpdate();
                return true;
            }
        }
        return false;
    };
    /**
     * Return true if viewProps, props or state has changed.
     *
     * We track viewProps changes when actions have changed state that is mapped to viewProps.
     *
     * Our props and state changes are checked against the incoming nextProps and nextState using
     * recompose's 'shallowEqual'.
     *
     * @param {CP} nextProps
     * @returns {boolean}
     */
    ContainerComponent.prototype.shouldComponentUpdate = function (nextProps, nextState, nextContext) {
        var result = this.viewPropsUpdated || !recompose_1.shallowEqual(this.props, nextProps);
        // if this.viewPropsUpdated is true, we will return true, we want to update only once, so reset to null
        this.viewPropsUpdated = this.viewPropsUpdated ? null : this.viewPropsUpdated;
        result = result || !recompose_1.shallowEqual(this.state, nextState);
        return result;
    };
    ContainerComponent.prototype.render = function () {
        if (!this.viewProps) {
            this.viewProps = this.createViewProps();
        }
        if (this.functionCompView) {
            return React.createElement(this.functionCompView, this.viewProps);
        }
        if (this.viewGenerator) {
            return React.createElement(this.viewGenerator, this.viewProps);
        }
        throw new Error('Neither a FunctionComponent nor a React.Component is available for rendering.  Supply one or the other, or override this method.');
    };
    return ContainerComponent;
}(React.Component));
exports.ContainerComponent = ContainerComponent;
/* tslint:enable:no-any */
//# sourceMappingURL=ContainerComponent.js.map