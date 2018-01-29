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
/**
 *
 * A React.Component designed to function as a container/controller.
 *
 * It contains a react component, which performs the actual rendering
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
    /* tslint:enable:no-any */
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
    ContainerComponent.prototype.createMapping = function (stateObject, stateObjectProperty, targetViewProp) {
        var dispatches = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            dispatches[_i - 3] = arguments[_i];
        }
        return new (actions_1.MappingAction.bind.apply(actions_1.MappingAction, [void 0, stateObject, stateObjectProperty, this, targetViewProp].concat(dispatches)))();
    };
    /**
     * This is only used for testing
     * @returns {React.Component<VP, any>}
     */
    ContainerComponent.prototype.getView = function () {
        return this.viewComponent;
    };
    /**
     * This method can be used to alter default state property and dispatch mappings
     */
    ContainerComponent.prototype.updateViewProps = function (executedActions) { return; };
    /**
     * Default implementation of dispatches using mapping actions.
     *
     * Note that only actions whose pathing matches the mapping will invoke
     *
     * @param {Action[]} executedActions
     */
    ContainerComponent.prototype.dispatchUsingMappings = function (executedActions) {
        executedActions.forEach(function (action) {
            if (action instanceof actions_1.StateCrudAction) {
                var mappingActions = action.mappingActions;
                if (mappingActions && mappingActions.length > 0) {
                    mappingActions.forEach(function (mapping) {
                        if (mapping.dispatches && mapping.dispatches.length > 0) {
                            mapping.dispatches.forEach(function (dispatch) { return dispatch(action); });
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
        executedActions.forEach(function (action) {
            if (action instanceof actions_1.StateCrudAction) {
                var mappingActions = action.mappingActions;
                if (mappingActions && mappingActions.length) {
                    mappingActions.forEach(function (mapping) {
                        _this.viewProps[mapping.targetPropName] = action.value;
                    });
                }
            }
        });
    };
    ContainerComponent.prototype.componentDidMount = function () {
        // subscribe
        this.mappingActions = this.mappingActions ? this.mappingActions : this.createMappingActions();
        (_a = Manager_1.Manager.get()).actionPerform.apply(_a, this.mappingActions);
        var _a;
    };
    ContainerComponent.prototype.componentWillUnmount = function () {
        if (this.mappingActions) {
            // unsubscribe from stateMappingActions, we need to undo these specific actions
            /* tslint:disable:no-any */
            var unmappingActions_1 = [];
            /* tslint:enable:no-any */
            this.mappingActions.forEach(function (action) {
                var unmappingAction = action.clone();
                unmappingAction.pristine = true;
                unmappingAction.type = action.getUndoAction();
                unmappingActions_1.push(unmappingAction);
            });
            // perform these undo actions
            (_a = Manager_1.Manager.get()).actionUndo.apply(_a, [0].concat(unmappingActions_1));
        }
        var _a;
    };
    ContainerComponent.prototype.handleChange = function (executedActions) {
        this.updateViewPropsUsingMappings(executedActions);
        this.dispatchUsingMappings(executedActions);
        this.updateViewProps(executedActions);
        this.forceUpdate();
    };
    ContainerComponent.prototype.render = function () {
        if (this.sfcView) {
            return this.sfcView(this.viewProps);
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
//# sourceMappingURL=ContainerComponent.js.map