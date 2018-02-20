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
var mutations_1 = require("./mutations");
var Manager_1 = require("../types/Manager");
/**
 * ActionId's for calling api's that change state.
 *
 * Separate CRUD operations for state objects ({@link StateObject}) vs regular data
 * properties, since  state objects have special requirements that have to be checked.
 *
 * Also note that state objects themselves are not updated, ie swapped out for
 * one another since they need to have refs to parents set/unset.
 */
var ActionId;
(function (ActionId) {
    ActionId[ActionId["NULL"] = 0] = "NULL";
    ActionId[ActionId["INSERT_STATE_OBJECT"] = 1] = "INSERT_STATE_OBJECT";
    ActionId[ActionId["DELETE_STATE_OBJECT"] = 2] = "DELETE_STATE_OBJECT";
    ActionId[ActionId["INSERT_PROPERTY"] = 3] = "INSERT_PROPERTY";
    ActionId[ActionId["UPDATE_PROPERTY"] = 4] = "UPDATE_PROPERTY";
    ActionId[ActionId["DELETE_PROPERTY"] = 5] = "DELETE_PROPERTY";
    ActionId[ActionId["MAP_STATE_TO_PROP"] = 6] = "MAP_STATE_TO_PROP";
})(ActionId = exports.ActionId || (exports.ActionId = {}));
/* tslint:enable:no-any */
var Action = /** @class */ (function () {
    function Action(actionType) {
        this.mutated = false;
        this.pristine = true;
        this.type = actionType;
    }
    Action.prototype.perform = function () {
        this.mutate(true);
    };
    Action.prototype.assignProps = function (from) {
        this.type = from.type;
        this.mutated = from.mutated;
        this.pristine = from.pristine;
    };
    Action.prototype.getUndoAction = function () {
        // Invert the action (note that UPDATE is the inverse of UPDATE)
        var undoAction = ActionId.UPDATE_PROPERTY;
        if (this.type === ActionId.DELETE_PROPERTY || this.type === ActionId.INSERT_PROPERTY) {
            undoAction = this.type === ActionId.INSERT_PROPERTY ? ActionId.DELETE_PROPERTY : ActionId.INSERT_PROPERTY;
        }
        if (this.type === ActionId.DELETE_STATE_OBJECT || this.type === ActionId.INSERT_STATE_OBJECT) {
            undoAction = this.type === ActionId.INSERT_STATE_OBJECT
                ? ActionId.DELETE_STATE_OBJECT
                : ActionId.INSERT_STATE_OBJECT;
        }
        return undoAction;
    };
    Action.prototype.undo = function () {
        this.mutate(false);
    };
    /* tslint:disable:no-any */
    Action.prototype.containersToRender = function (containersBeingRendered) { return; };
    return Action;
}());
exports.Action = Action;
var StateAction = /** @class */ (function (_super) {
    __extends(StateAction, _super);
    function StateAction(actionType, _parent, _propertyName) {
        var _this = _super.call(this, actionType) || this;
        _this.parent = _parent;
        _this.propertyName = _propertyName;
        return _this;
    }
    StateAction.prototype.assignProps = function (from) {
        _super.prototype.assignProps.call(this, from);
        this.parent = from.parent;
        this.propertyName = from.propertyName;
    };
    /* tslint:disable:no-any */
    StateAction.prototype.containersToRender = function (containersBeingRendered) {
        /* tslint:enable:no-any */
        var fullPath = Manager_1.Manager.get().getFullPath(this.parent, this.propertyName);
        var mappingActions = Manager_1.Manager.get().getMappingState().getPathMappings(fullPath);
        if (mappingActions) {
            var containers = mappingActions.map(function (mapping) { return mapping.component; });
            containers.forEach(function (container) {
                if (containersBeingRendered.indexOf(container) < 0) {
                    containersBeingRendered.push(container);
                }
            });
        }
    };
    return StateAction;
}(Action));
exports.StateAction = StateAction;
/**
 * Action classes contain instructions for mutating state, in the form
 * of StateObjects.
 */
var StateCrudAction = /** @class */ (function (_super) {
    __extends(StateCrudAction, _super);
    function StateCrudAction(actionType, _parent, _propertyName, _value) {
        var _this = _super.call(this, actionType, _parent, _propertyName) || this;
        _this.value = _value;
        return _this;
    }
    /* tslint:enable:no-any */
    StateCrudAction.prototype.getOldValue = function () {
        return this.oldValue;
    };
    StateCrudAction.prototype.assignProps = function (from) {
        _super.prototype.assignProps.call(this, from);
        this.mutateResult = from.mutateResult;
        this.oldValue = from.oldValue;
        this.value = from.value;
        this.mappingActions = from.mappingActions;
    };
    StateCrudAction.prototype.clone = function () {
        var copy = new StateCrudAction(this.type, this.parent, this.propertyName, this.value);
        copy.assignProps(this);
        return copy;
    };
    StateCrudAction.prototype.mutate = function (perform) {
        if (perform === void 0) { perform = true; }
        this.pristine = false;
        var fullpath = Manager_1.Manager.get().getFullPath(this.parent, this.propertyName);
        this.mappingActions = Manager_1.Manager.get().getMappingState().getPathMappings(fullpath) || [];
        this.mappingActions = Manager_1.Manager.get().getMappingState().getPathMappings(fullpath) || [];
        // annotateActionInState(this);
        var actionId = perform ? this.type : this.getUndoAction();
        var _value = perform ? this.value : this.oldValue;
        this.mutateResult = mutations_1.mutateValue(actionId, this.parent, _value, this.propertyName);
        if (perform) {
            this.oldValue = this.mutateResult ? this.mutateResult.oldValue : undefined;
            this.mutated = true;
        }
        else {
            this.mutateResult = undefined;
            this.oldValue = undefined;
            this.mutated = false;
        }
    };
    return StateCrudAction;
}(StateAction));
exports.StateCrudAction = StateCrudAction;
/**
 *
 */
var ArrayMutateAction = /** @class */ (function (_super) {
    __extends(ArrayMutateAction, _super);
    function ArrayMutateAction(actionType, _parent, _propertyName, _values, _index, _value) {
        var _this = _super.call(this, actionType, _parent, _propertyName) || this;
        _this.valuesArray = _values;
        _this.index = _index;
        _this.value = _value;
        return _this;
    }
    ArrayMutateAction.prototype.assignProps = function (from) {
        _super.prototype.assignProps.call(this, from);
        this.mutateResult = from.mutateResult;
        this.oldValue = from.oldValue;
        this.value = from.value;
        this.valuesArray = from.valuesArray;
        this.index = from.index;
    };
    ArrayMutateAction.prototype.clone = function () {
        var copy = new ArrayMutateAction(this.type, this.parent, this.propertyName, this.valuesArray, this.index, this.value);
        return copy;
    };
    ArrayMutateAction.prototype.mutate = function (perform) {
        if (perform === void 0) { perform = true; }
        this.pristine = false;
        // annotateActionInState(this);
        var actionId = perform ? this.type : this.getUndoAction();
        this.mutateResult = mutations_1.mutateArray(actionId, this.parent, this.valuesArray, this.value, this.propertyName, this.index);
        if (perform) {
            this.oldValue = this.mutateResult ? this.mutateResult.oldValue : undefined;
            this.mutated = true;
        }
        else {
            this.mutateResult = undefined;
            this.oldValue = undefined;
            this.mutated = false;
        }
    };
    return ArrayMutateAction;
}(StateAction));
exports.ArrayMutateAction = ArrayMutateAction;
/**
 * Define a mapping between a state property and a component property, and optionally
 * provide a function or functions that are executed after the mapping is performed
 * but before anything is rendered (e.g., to transform other property data).
 *
 * The functionality provided here is analogous to, but not the same as,
 * Redux's mapStateToProps/Dispatch.
 *
 * S: type of the parent
 * K: key of the propertyOrArrayName
 *
 * Prop types used in defining the ContainerComponent<CP,VP>
 * CP: container prop type
 * VP: view prop type
 *
 * TP: keys of VP, the view prop type
 */
var MappingAction = /** @class */ (function (_super) {
    __extends(MappingAction, _super);
    /**
     * Create a new mapping action from a state property to a view property
     *
     * @param {S} parent
     * @param {K} _propertyOrArrayName
     * @param {ContainerComponent<CP, VP, any>} _component
     * @param {TP} targetPropName
     * @param {DispatchType} dispatches - these are generally instance functions in the component that update other
     *          component view properties as a function of the target view property having changed.
     */
    function MappingAction(parent, _propertyOrArrayName, 
    /* tslint:disable:no-any */
    _component, 
    /* tslint:enable:no-any */
    targetPropName) {
        var dispatches = [];
        for (var _i = 4; _i < arguments.length; _i++) {
            dispatches[_i - 4] = arguments[_i];
        }
        var _this = _super.call(this, ActionId.MAP_STATE_TO_PROP, parent, _propertyOrArrayName) || this;
        _this.component = _component;
        _this.fullPath = Manager_1.Manager.get().getFullPath(_this.parent, _this.propertyName);
        _this.targetPropName = targetPropName;
        _this.dispatches = dispatches;
        return _this;
    }
    MappingAction.prototype.assignProps = function (from) {
        _super.prototype.assignProps.call(this, from);
        this.component = from.component;
        this.fullPath = from.fullPath;
        this.targetPropName = from.targetPropName;
        this.dispatches = from.dispatches;
    };
    MappingAction.prototype.clone = function () {
        var copy = new (MappingAction.bind.apply(MappingAction, [void 0, this.parent,
            this.propertyName,
            this.component,
            this.targetPropName].concat(this.dispatches)))();
        copy.assignProps(this);
        return copy;
    };
    MappingAction.prototype.getValue = function () {
        return this.parent[this.propertyName];
    };
    MappingAction.prototype.getTargetPropName = function () {
        return this.targetPropName;
    };
    /**
     * Map this property/component pair to the applications ContainerState, or if false, unmap it.
     * @param {boolean} perform
     */
    MappingAction.prototype.mutate = function (perform) {
        if (perform === void 0) { perform = true; }
        this.pristine = false;
        if (perform) {
            var components = Manager_1.Manager.get().getMappingState().getOrCreatePathMappings(this.fullPath);
            components.push(this);
        }
        else {
            Manager_1.Manager.get().getMappingState().removePathMapping(this.fullPath, this);
        }
    };
    // on componentDidMount
    MappingAction.prototype.perform = function () {
        this.mutate(true);
    };
    // on componentWillUnmount
    MappingAction.prototype.undo = function () {
        this.mutate(false);
    };
    MappingAction.prototype.redo = function () {
        this.perform();
    };
    return MappingAction;
}(StateAction));
exports.MappingAction = MappingAction;
//# sourceMappingURL=actions.js.map