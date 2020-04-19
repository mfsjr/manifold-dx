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
var React = require("react");
var actions_1 = require("../actions/actions");
var _ = require("lodash");
var Manager_1 = require("../types/Manager");
var __1 = require("../");
var recompose_1 = require("recompose");
var actionCreators_1 = require("../actions/actionCreators");
/* tslint:enable:no-any */
/**
 *
 * A kind of React.Component container/controller (constructor takes a component
 * and uses it to compose/present).
 *
 * It wraps a react component, which performs the actual rendering
 * and the view usually contains all the markup and styling.  There is
 * typically no markup or styling in this container.
 *
 * CP: container props, a plain object (pojo)
 * VP: view component props, also a plain object
 * A: application state (root/top of the StateObject graph) {@link StateObject}
 * RS: React State
 */
var ContainerComponent = /** @class */ (function (_super) {
    __extends(ContainerComponent, _super);
    /**
     * There are two types of views this can create.  The preferred way is with
     * a FunctionComponent, the other way is by creating
     * an instance of a React.Component class.  The constructor accepts either one
     * or the other.
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
        // examine the component functions
        if ((functionComp && viewGenerator) || (!functionComp && !viewGenerator)) {
            throw new Error((functionComp ? 2 : 0) + " functions supplied; you must supply exactly one function");
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
    /**
     * Create a mapping action for this container.
     *
     * To get good code completion in IntelliJ/WebStorm, use this to populate an untyped array then
     * push that onto another array (sadly, pushing directly to a typed generic array breaks code completion)
     *
     * @param parentState
     * @param _propKey
     * @param targetPropKey
     * @param mappingHooks
     */
    ContainerComponent.prototype.createMappingAction = function (parentState, _propKey, targetPropKey) {
        var mappingHooks = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            mappingHooks[_i - 3] = arguments[_i];
        }
        return actionCreators_1.getMappingActionCreator2.apply(void 0, __spreadArrays([parentState, _propKey, this, targetPropKey], mappingHooks));
        // return new MappingAction(parentState, _propKey, this, targetPropKey, ...mappingHooks);
    };
    /**
     * Create a mapping from a state array element to a view.
     *
     * To get good code completion in IntelliJ/WebStorm, use this to populate an untyped array then
     * push that onto another array (sadly, pushing directly to a typed generic array breaks code completion)
     *
     * @param _parent
     * @param _propKey
     * @param _array
     * @param index
     * @param targetPropKey
     * @param mappingHooks
     */
    ContainerComponent.prototype.createArrayMappingAction = function (_parent, _propKey, _array, index, targetPropKey) {
        var mappingHooks = [];
        for (var _i = 5; _i < arguments.length; _i++) {
            mappingHooks[_i - 5] = arguments[_i];
        }
        return actionCreators_1.getArrayMappingActionCreator2.apply(void 0, __spreadArrays([_parent, _propKey, _array, index, this, targetPropKey], mappingHooks));
    };
    ContainerComponent.prototype.createMapping = function (stateObject, stateObjectProperty, targetViewProp) {
        var mappingHooks = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            mappingHooks[_i - 3] = arguments[_i];
        }
        return new (actions_1.MappingAction.bind.apply(actions_1.MappingAction, __spreadArrays([void 0, stateObject, stateObjectProperty, this, targetViewProp], mappingHooks)))();
    };
    /**
     * This is only used for testing
     * @returns {React.Component<VP, any>}
     */
    /*tslint:disable:no-any*/
    ContainerComponent.prototype.getView = function () {
        return this.viewComponent;
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
     * Default implementation of mappingHook functions contained in mapping actions.
     *
     * Note that only actions whose pathing matches the mapping will invoke
     *
     * @param {Action[]} executedActions have already modified state, whose changes have already been mapped,
     * but not yet rendered.
     */
    ContainerComponent.prototype.invokeMappingHooks = function (executedActions) {
        executedActions.forEach(function (action) {
            if (action instanceof actions_1.StateCrudAction) {
                var mappingActions = action.mappingActions;
                if (mappingActions && mappingActions.length > 0) {
                    mappingActions.forEach(function (mapping) {
                        if (mapping.mappingHooks && mapping.mappingHooks.length > 0) {
                            mapping.mappingHooks.forEach(function (hookFunction) { return hookFunction(action); });
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
    ContainerComponent.prototype.handleChange = function (executedActions) {
        this.updateViewPropsUsingMappings(executedActions);
        this.invokeMappingHooks(executedActions);
        this.updateViewProps(executedActions);
        // our state has changed, force a render
        this.forceUpdate();
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
    ContainerComponent.prototype.setupViewProps = function () {
        this.viewProps = this.createViewProps();
        if (this.viewGenerator) {
            this.viewComponent = this.viewGenerator(this.viewProps);
        }
    };
    ContainerComponent.prototype.render = function () {
        if (!this.viewProps) {
            this.setupViewProps();
        }
        if (this.functionCompView) {
            var result = this.functionCompView(this.viewProps);
            return result;
        }
        if (this.viewGenerator) {
            this.viewComponent = this.viewGenerator(this.viewProps);
            return this.viewComponent.render();
        }
        throw new Error('Neither FunctionComponent nor React.Component is available for rendering');
    };
    return ContainerComponent;
}(React.Component));
exports.ContainerComponent = ContainerComponent;
/* tslint:enable:no-any */
//# sourceMappingURL=ContainerComponent.js.map