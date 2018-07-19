"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var actions_1 = require("../actions/actions");
var _ = require("lodash");
var Manager_1 = require("../types/Manager");
var _1 = require("../");
/* tslint:enable:no-any */
/**
 *
 * A kind of React.Component HOC designed to function as a container/controller (constructor takes a component
 * and uses it to compose/present).
 *
 * It wraps a react component, which performs the actual rendering
 * and the view usually contains all the markup and styling.  There is
 * typically no markup or styling in this container.
 *
 * CP: container props, a plain object (pojo)
 * VP: view component props, also a plain object
 * A: topmost application data residing in a state object {@link StateObject}
 */
var ContainerComponent = /** @class */ (function (_super) {
    __extends(ContainerComponent, _super);
    /**
     * There are two types of views this can create.  The preferred way is with
     * an 'SFC' (stateless functional component), the other way is by creating
     * an instance of a React.Component class.  The constructor accepts either one
     * or the other.
     *
     * @param {CP} _props
     * @param {StateObject & A} appData
     * @param {React.SFC<VP> | undefined} sfc
     * @param {ComponentGenerator<VP> | undefined} viewGenerator
     */
    function ContainerComponent(_props, appData, sfc, viewGenerator) {
        var _this = _super.call(this, _props) || this;
        /* tslint:enable:no-any */
        _this.mappingActions = [];
        if (!_.isPlainObject(_props)) {
            throw new Error('container props must be plain objects');
        }
        _this.appData = appData;
        if (!appData) {
            throw new Error('Failed to get appData to base container');
        }
        else {
            // console.log(`appData in base container: ${JSON.stringify(this.appData, JSON_replaceCyclicParent, 4)}`);
        }
        // examine the component functions
        if ((sfc && viewGenerator) || (!sfc && !viewGenerator)) {
            throw new Error((sfc ? 2 : 0) + " functions supplied; you must supply exactly one function");
        }
        _this.viewProps = _this.createViewProps();
        _this.sfcView = sfc;
        _this.viewGenerator = viewGenerator;
        if (_this.viewGenerator) {
            _this.viewComponent = _this.viewGenerator(_this.viewProps);
        }
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
        var newArray = oldArray.slice();
        newArray[index] = newElement;
        return newArray;
    };
    ContainerComponent.prototype.getMappingActions = function () { return this.mappingActions; };
    ContainerComponent.prototype.createMappingAction = function (parentState, _propKey, targetPropKey) {
        var mappingHooks = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            mappingHooks[_i - 3] = arguments[_i];
        }
        return new (actions_1.MappingAction.bind.apply(actions_1.MappingAction, [void 0, parentState, _propKey, this, targetPropKey].concat(mappingHooks)))();
    };
    ContainerComponent.prototype.createMapping = function (stateObject, stateObjectProperty, targetViewProp) {
        var mappingHooks = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            mappingHooks[_i - 3] = arguments[_i];
        }
        return new (actions_1.MappingAction.bind.apply(actions_1.MappingAction, [void 0, stateObject, stateObjectProperty, this, targetViewProp].concat(mappingHooks)))();
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
        var _viewProps = this.viewProps;
        // let _displayName = this[`displayName`];
        executedActions.forEach(function (action) {
            if (action instanceof actions_1.StateAction) {
                var mappingActions = action.mappingActions;
                if (mappingActions && mappingActions.length) {
                    mappingActions.forEach(function (mapping) {
                        if (action instanceof actions_1.StateCrudAction) {
                            _viewProps[mapping.targetPropName] = action.value;
                        }
                        else if (action instanceof _1.ArrayChangeAction) {
                            // if we are mutating the list element, we only want to change that index
                            // otherwise its an insert/delete and we want to update the whole array
                            if (mapping.index !== undefined) {
                                _viewProps[mapping.targetPropName] = action.value;
                            }
                            else {
                                _viewProps[mapping.targetPropName] = action.valuesArray;
                            }
                        }
                    });
                }
            }
        });
    };
    // TODO: change this to componentWillMount?
    ContainerComponent.prototype.componentDidMount = function () {
        // subscribe
        this.appendToMappingActions(this.mappingActions);
        (_a = Manager_1.Manager.get(this.appData)).actionProcess.apply(_a, this.mappingActions);
        var _a;
    };
    ContainerComponent.prototype.componentWillUnmount = function () {
        // TODO: this fix passes our tests, needs to be tried out
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
            // TODO: defer execution of these actions, as other actions may be executing
            (_a = Manager_1.Manager.get(this.appData)).actionUndo.apply(_a, [0].concat(unmappingActions_1));
        }
        var _a;
    };
    ContainerComponent.prototype.handleChange = function (executedActions) {
        this.updateViewPropsUsingMappings(executedActions);
        this.invokeMappingHooks(executedActions);
        this.updateViewProps(executedActions);
        // our state has changed, force a render
        this.forceUpdate();
    };
    ContainerComponent.prototype.render = function () {
        if (this.sfcView) {
            var result = this.sfcView(this.viewProps);
            return result;
        }
        if (this.viewGenerator) {
            this.viewComponent = this.viewGenerator(this.viewProps);
            return this.viewComponent.render();
        }
        throw new Error('Neither SFC nor React.Component is available for rendering');
    };
    return ContainerComponent;
}(React.Component));
exports.ContainerComponent = ContainerComponent;
/* tslint:enable:no-any */
//# sourceMappingURL=ContainerComponent.js.map