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
Object.defineProperty(exports, "__esModule", { value: true });
var changeState_1 = require("./changeState");
var Manager_1 = require("../types/Manager");
var MappingState_1 = require("../types/MappingState");
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
    ActionId[ActionId["RERENDER"] = 0] = "RERENDER";
    ActionId[ActionId["INSERT_STATE_OBJECT"] = 1] = "INSERT_STATE_OBJECT";
    ActionId[ActionId["DELETE_STATE_OBJECT"] = 2] = "DELETE_STATE_OBJECT";
    ActionId[ActionId["INSERT_PROPERTY"] = 3] = "INSERT_PROPERTY";
    ActionId[ActionId["UPDATE_PROPERTY"] = 4] = "UPDATE_PROPERTY";
    ActionId[ActionId["DELETE_PROPERTY"] = 5] = "DELETE_PROPERTY";
    ActionId[ActionId["MAP_STATE_TO_PROP"] = 6] = "MAP_STATE_TO_PROP";
    ActionId[ActionId["UPDATE_PROPERTY_NO_OP"] = 7] = "UPDATE_PROPERTY_NO_OP";
    ActionId[ActionId["INSERT_PROPERTY_NO_OP"] = 8] = "INSERT_PROPERTY_NO_OP";
    ActionId[ActionId["DELETE_PROPERTY_NO_OP"] = 9] = "DELETE_PROPERTY_NO_OP";
})(ActionId = exports.ActionId || (exports.ActionId = {}));
exports.ActionTypeIsNoOp = function (actionId) {
    return actionId >= ActionId.UPDATE_PROPERTY_NO_OP;
};
/* tslint:enable:no-any */
var Action = /** @class */ (function () {
    function Action(actionType) {
        this.changed = false;
        this.pristine = true;
        this.type = actionType;
    }
    /**
     * Performs the change on the action, called by the {@link Manager}, and should only be called by it, with
     * the possible exception of testing.
     *
     * @param {Action} action
     * @param {boolean} perform - optional, will default to true, false means undo
     */
    Action.perform = function (action, perform) {
        action.performChange(perform);
    };
    /**
     * Undo the change on the action.  This is only called by the {@link Manager} and should never be called directly.
     * @param {Action} action
     */
    Action.undo = function (action) {
        action.undoChange();
    };
    Action.prototype.performChange = function (perform) {
        this.change(perform ? perform : true);
    };
    Action.prototype.assignProps = function (from) {
        this.type = from.type;
        this.changed = from.changed;
        this.pristine = from.pristine;
    };
    /**
     * Invert this action's type, or throw an error if its not invertible.
     * @returns {ActionId}
     */
    Action.prototype.getUndoActionId = function () {
        var undoAction;
        if (this.type === ActionId.UPDATE_PROPERTY || this.type === ActionId.MAP_STATE_TO_PROP) {
            undoAction = this.type;
        }
        if (this.type === ActionId.DELETE_PROPERTY || this.type === ActionId.INSERT_PROPERTY) {
            undoAction = this.type === ActionId.INSERT_PROPERTY ? ActionId.DELETE_PROPERTY : ActionId.INSERT_PROPERTY;
        }
        if (this.type === ActionId.DELETE_STATE_OBJECT || this.type === ActionId.INSERT_STATE_OBJECT) {
            undoAction = this.type === ActionId.INSERT_STATE_OBJECT
                ? ActionId.DELETE_STATE_OBJECT
                : ActionId.INSERT_STATE_OBJECT;
        }
        if (!undoAction) {
            throw new Error("Failed to find undoAction for " + this.type + ", " + ActionId[this.type]);
        }
        return undoAction;
    };
    Action.prototype.undoChange = function () {
        this.change(false);
    };
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
        this.mappingActions = from.mappingActions;
    };
    /**
     * Process the action.  A convenience method that calls Manager.get().actionPerform, which is the correct
     * way to process an action or an array of actions.
     */
    StateAction.prototype.dispatch = function () {
        Manager_1.Manager.get(this.parent).actionProcess(this);
    };
    StateAction.prototype.containersToRender = function (containersBeingRendered) {
        var fullPath = Manager_1.Manager.get(this.parent).getFullPath(this.parent, this.propertyName);
        var mappingActions = Manager_1.Manager.get(this.parent).getMappingState().getPathMappings(fullPath);
        this.concatContainersFromMappingActions(containersBeingRendered, mappingActions);
    };
    /**
     * Implementation used by property and array based actions to add unique containers to be rendered
     * to an array of other containers to be rendered.
     * @param containersBeingRendered
     * @param mappingActions
     */
    StateAction.prototype.concatContainersFromMappingActions = function (containersBeingRendered, mappingActions) {
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
/* tslint:enable:no-any */
/**
 * Action classes contain instructions for changing state, in the form
 * of StateObjects.
 */
var StateCrudAction = /** @class */ (function (_super) {
    __extends(StateCrudAction, _super);
    function StateCrudAction(actionType, _parent, _propertyName, _value) {
        var _this = _super.call(this, actionType, _parent, _propertyName) || this;
        _this.value = _value;
        return _this;
        // if (actionType === ActionId.UPDATE_PROPERTY && _value instanceof Array) {
        //   throw new Error(
        //     `Arrays may be inserted or deleted, but not updated (you can insert, update or delete array elements)`);
        // }
    }
    StateCrudAction.prototype.getOldValue = function () {
        return this.oldValue;
    };
    StateCrudAction.prototype.assignProps = function (from) {
        _super.prototype.assignProps.call(this, from);
        this.changeResult = from.changeResult;
        this.oldValue = from.oldValue;
        this.value = from.value;
    };
    StateCrudAction.prototype.clone = function () {
        var copy = new StateCrudAction(this.type, this.parent, this.propertyName, this.value);
        copy.assignProps(this);
        return copy;
    };
    StateCrudAction.prototype.change = function (perform) {
        if (perform === void 0) { perform = true; }
        this.pristine = false;
        var fullpath = Manager_1.Manager.get(this.parent).getFullPath(this.parent, this.propertyName);
        this.mappingActions = Manager_1.Manager.get(this.parent).getMappingState().getPathMappings(fullpath) || [];
        // annotateActionInState(this);
        var actionId = perform ? this.type : this.getUndoActionId();
        var _value = perform ? this.value : this.oldValue;
        this.changeResult = changeState_1.changeValue(actionId, this.parent, _value, this.propertyName);
        if (perform) {
            this.oldValue = this.changeResult ? this.changeResult.oldValue : undefined;
            this.changed = true;
        }
        else {
            this.changeResult = undefined;
            this.oldValue = undefined;
            this.changed = false;
        }
    };
    return StateCrudAction;
}(StateAction));
exports.StateCrudAction = StateCrudAction;
/**
 * For mutating the elements in the array.
 */
var ArrayChangeAction = /** @class */ (function (_super) {
    __extends(ArrayChangeAction, _super);
    // TODO: restrict the set of ActionId's here to regular property insert/update/delete
    function ArrayChangeAction(actionType, _parent, _propertyName, _index, valuesArray, _value) {
        var _this = _super.call(this, actionType, _parent, _propertyName) || this;
        _this.index = _index;
        _this.value = _value;
        _this.valuesArray = valuesArray;
        return _this;
    }
    ArrayChangeAction.prototype.assignProps = function (from) {
        _super.prototype.assignProps.call(this, from);
        this.changeResult = from.changeResult;
        this.oldValue = from.oldValue;
        this.value = from.value;
        this.valuesArray = from.valuesArray;
        this.index = from.index;
    };
    ArrayChangeAction.prototype.clone = function () {
        var copy = new ArrayChangeAction(this.type, this.parent, this.propertyName, this.index, this.valuesArray, this.value);
        return copy;
    };
    // Attempts to solve the problem of updating array actions for inserts/deletes above the index where it occurs.
    // This just doesn't work since container's viewProps get updated by using array actions' indexes and child values
    ArrayChangeAction.prototype.containersToRender = function (containersBeingRendered) {
        if (this.index > -1) {
            var fullpath = Manager_1.Manager.get(this.parent).getFullPath(this.parent, this.propertyName);
            // super.concatContainersFromMappingActions(containersBeingRendered);
            // // super.containersToRender(containersBeingRendered, arrayOptions);
            // let key = this.keyGen(this.valuesArray[this.index]);
            var _index = this.index > -1 ? this.index : undefined;
            var mappingActions = Manager_1.Manager.get(this.parent).getMappingState().getPathMappings(fullpath, _index);
            this.concatContainersFromMappingActions(containersBeingRendered, mappingActions);
        }
        else {
            _super.prototype.containersToRender.call(this, containersBeingRendered);
        }
    };
    ArrayChangeAction.prototype.change = function (perform) {
        if (perform === void 0) { perform = true; }
        this.pristine = false;
        // annotateActionInState(this);
        var actionId = perform ? this.type : this.getUndoActionId();
        var fullpath = Manager_1.Manager.get(this.parent).getFullPath(this.parent, this.propertyName);
        // let key = this.keyGen && this.index > -1 ? this.keyGen(this.valuesArray[this.index]) : undefined;
        // NOTE that index is of type number, required, not possibly undefined or null
        this.mappingActions = Manager_1.Manager.get(this.parent).getMappingState().getPathMappings(fullpath, this.index) || [];
        this.changeResult = changeState_1.changeArray(actionId, this.parent, this.valuesArray, this.value, this.propertyName, this.index);
        if (perform) {
            this.oldValue = this.changeResult ? this.changeResult.oldValue : undefined;
            this.changed = true;
            if (this.type === ActionId.INSERT_PROPERTY) {
                var mappingState = Manager_1.Manager.get(this.parent).getMappingState();
                var arrayMap = mappingState.getPathMappingsArrayMap(fullpath);
                if (!arrayMap) {
                    /*tslint:disable:no-console*/
                    console.log("WARNING: action isn't wired to component, failed to get arrayMap for " + fullpath);
                    /*tslint:enable:no-console*/
                }
                if (arrayMap) {
                    // the component to be rendered will place its mapping actions in this slot
                    MappingState_1.arrayMapInsert(arrayMap, this.index, []);
                }
            }
            else if (this.type === ActionId.DELETE_PROPERTY) {
                var mappingState = Manager_1.Manager.get(this.parent).getMappingState();
                var arrayMap = mappingState.getPathMappingsArrayMap(fullpath);
                if (arrayMap) {
                    // the component to be rendered will place its mapping actions in this slot
                    MappingState_1.arrayMapDelete(arrayMap, this.index);
                }
            }
        }
        else {
            this.changeResult = undefined;
            this.oldValue = undefined;
            this.changed = false;
        }
    };
    return ArrayChangeAction;
}(StateAction));
exports.ArrayChangeAction = ArrayChangeAction;
/**
 * Define a mapping between a state property and a component property, and optionally
 * provide a function or functions that are executed after the mapping is performed
 * but before anything is rendered (e.g., to transform other property data).
 *
 * The functionality provided here is analogous to, but works very differently from,
 * Redux's mapStateToProps/Dispatch.
 *
 * S: type of the parent state
 *
 * Prop types used in defining the ContainerComponent<CP,VP>
 * CP: container prop type
 * VP: view prop type
 * TP: a particular key of VP
 * A: application state
 * E: array element type, if the property type is an array
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
     * @param {MappingHook} mappingHooks - these are generally instance functions in the component that update other
     *          component view properties as a function of the target view property having changed.
     */
    function MappingAction(parent, _propertyOrArrayName, _component, targetPropName) {
        var mappingHooks = [];
        for (var _i = 4; _i < arguments.length; _i++) {
            mappingHooks[_i - 4] = arguments[_i];
        }
        var _this = _super.call(this, ActionId.MAP_STATE_TO_PROP, parent, _propertyOrArrayName) || this;
        //
        _this.index = -1;
        _this.component = _component;
        _this.fullPath = Manager_1.Manager.get(_this.parent).getFullPath(_this.parent, _this.propertyName);
        _this.targetPropName = targetPropName;
        _this.mappingHooks = mappingHooks;
        return _this;
    }
    MappingAction.prototype.assignProps = function (from) {
        _super.prototype.assignProps.call(this, from);
        this.component = from.component;
        this.fullPath = from.fullPath;
        this.targetPropName = from.targetPropName;
        this.mappingHooks = from.mappingHooks;
        this.index = from.index;
    };
    MappingAction.prototype.clone = function () {
        var copy = new (MappingAction.bind.apply(MappingAction, [void 0, this.parent,
            this.propertyName,
            this.component,
            this.targetPropName].concat(this.mappingHooks)))();
        copy.assignProps(this);
        return copy;
    };
    /**
     * Clone the action and modify the clone so that it 'undoes' this, i.e., unmaps this mapping.
     * @returns {MappingAction
     * <S extends StateObject, K extends Extract<keyof S, string>, CP, VP, TP extends keyof VP, A extends StateObject, E>}
     */
    MappingAction.prototype.getUndoAction = function () {
        var unmappingAction = this.clone();
        unmappingAction.pristine = true;
        unmappingAction.type = this.getUndoActionId();
        return unmappingAction;
    };
    MappingAction.prototype.getValue = function () {
        return this.parent[this.propertyName];
    };
    MappingAction.prototype.getTargetPropName = function () {
        return this.targetPropName;
    };
    /**
     * Map this component to an array element object, e.g., a row of data.
     *
     * Note that this method will throw if the index is invalid or refers to an undefined value in the array.
     *
     * @param {number} _index
     * @param {S[K] & Array<E>} _propArray
     * @param {ArrayKeyGeneratorFn<E>} _keyGen
     */
    MappingAction.prototype.setArrayElement = function (_index, _propArray) {
        if ((this.index !== -1 || this.index === null) || this.propArray) {
            // this can be done once and only once, or we throw
            throw new Error("attempting to reset array " + this.propertyName + " at index = " + _index);
        }
        if (_index !== null && (_propArray.length < _index || _propArray.length < 0 || !_propArray[_index])) {
            var fullpath = Manager_1.Manager.get(this.parent).getFullPath(this.parent, this.propertyName);
            throw new Error("Can't map to an undefined array index " + _index + " at " + fullpath);
        }
        this.index = _index;
        this.propArray = _propArray;
        return this;
    };
    MappingAction.prototype.getIndex = function () {
        return this.index;
    };
    /**
     * Map this property/component pair to the applications ContainerState, or if false, unmap it.
     * @param {boolean} perform
     */
    MappingAction.prototype.change = function (perform) {
        if (perform === void 0) { perform = true; }
        this.pristine = false;
        // if this action refers to an element at an index, use that
        // if the index is -1 and the property is an array, set it to null and map the whole array, else
        // map the simple property
        var _index = this.index !== -1 ? this.index : (this.parent[this.propertyName] instanceof Array ? null : undefined);
        if (perform) {
            var components = Manager_1.Manager.get(this.parent).getMappingState().getOrCreatePathMapping(this.fullPath, _index);
            components.push(this);
        }
        else {
            Manager_1.Manager.get(this.parent).getMappingState().removePathMapping(this.fullPath, this, _index);
        }
    };
    // on componentDidMount
    MappingAction.prototype.performChange = function () {
        this.change(true);
    };
    // on componentWillUnmount
    MappingAction.prototype.undoChange = function () {
        this.change(false);
    };
    MappingAction.prototype.redo = function () {
        this.performChange();
    };
    return MappingAction;
}(StateAction));
exports.MappingAction = MappingAction;
/**
 * Pure function that returns an object containing a logging ActionProcessorFunctionType.
 *
 * This optionally allows you to output to the console, and to retain the logging in an array.
 *
 * @param actions
 * @param _logging
 * @param _toConsole
 */
function actionLogging(_logging, _toConsole) {
    var logging = _logging;
    var processor = function (actions) {
        var lines = [];
        actions.forEach(function (action) {
            // let isDataAction: boolean = !(actions[0] instanceof MappingAction);
            // lines.push(`isDataAction = ${isDataAction}`);
            lines.push(exports.actionDescription(action));
        });
        if (_toConsole) {
            lines.forEach(function (line) {
                /*tslint:disable:no-console*/
                console.log(line);
                /*tslint:enable:no-console*/
            });
        }
        if (logging) {
            logging.splice.apply(logging, [logging.length, 0].concat(lines));
        }
        return actions;
    };
    return {
        processor: processor,
        logging: logging
    };
}
exports.actionLogging = actionLogging;
exports.actionDescription = function (action) {
    if (action instanceof ArrayChangeAction) {
        var value = '';
        switch (action.type) {
            case ActionId.INSERT_PROPERTY:
                value = "new value = " + action.value;
                break;
            case ActionId.UPDATE_PROPERTY:
                value = "new value = " + action.value;
                break;
            default: value = '';
        }
        var path = Manager_1.Manager.get(action.parent).getFullPath(action.parent, action.propertyName);
        var log = "StateCrudAction[" + ActionId[action.type] + "]: path: " + path + ", index=" + action.index;
        log += value ? ' value: ' + value : '';
        return log;
    }
    if (action instanceof StateCrudAction) {
        var path = Manager_1.Manager.get(action.parent).getFullPath(action.parent, action.propertyName);
        var value = '';
        switch (action.type) {
            case ActionId.INSERT_PROPERTY:
                value = "new value = " + action.value;
                break;
            case ActionId.UPDATE_PROPERTY:
                value = "new value = " + action.value;
                break;
            default: value = '';
        }
        return "StateCrudAction[" + ActionId[action.type] + "]: path: " + path + " " + (value ? 'value: ' + value : '');
    }
    if (action instanceof MappingAction) {
        var path = Manager_1.Manager.get(action.parent).getFullPath(action.parent, action.propertyName);
        var indexMessage = action.index !== null && action.index > -1 ? ", index=" + action.index : '';
        var message = "MappingAction[" + path + " => " + action.targetPropName + "]" + indexMessage;
        return message;
    } // TODO: throw?
    return "Not StateCrud, Array or Mapping; action.type === " + ActionId[action.type];
};
//# sourceMappingURL=actions.js.map