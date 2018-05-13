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
    /**
     * Performs the mutation on the action, called by the {@link Manager}, and should only be called by it, with
     * the possible exception of testing.
     *
     * @param {Action} action
     */
    Action.perform = function (action) {
        action.performMutation();
    };
    /**
     * Undo the mutation on the action.  This is only called by the {@link Manager} and should never be called directly.
     * @param {Action} action
     */
    Action.undo = function (action) {
        action.undoMutation();
    };
    Action.prototype.performMutation = function () {
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
    Action.prototype.undoMutation = function () {
        this.mutate(false);
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
    StateAction.prototype.process = function () {
        Manager_1.Manager.get(this.parent).actionProcess(this);
    };
    StateAction.prototype.containersToRender = function (containersBeingRendered) {
        var fullPath = Manager_1.Manager.get(this.parent).getFullPath(this.parent, this.propertyName);
        var mappingActions = Manager_1.Manager.get(this.parent).getMappingState().getPathMappings(fullPath);
        this.concatContainersFromMappingActions(containersBeingRendered, mappingActions);
        // if (mappingActions) {
        //   let containers = mappingActions.map((mapping) => mapping.component);
        //   containers.forEach((container) => {
        //     if (containersBeingRendered.indexOf(container) < 0) {
        //       containersBeingRendered.push(container);
        //     }
        //   });
        // }
    };
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
    StateCrudAction.prototype.getOldValue = function () {
        return this.oldValue;
    };
    StateCrudAction.prototype.assignProps = function (from) {
        _super.prototype.assignProps.call(this, from);
        this.mutateResult = from.mutateResult;
        this.oldValue = from.oldValue;
        this.value = from.value;
    };
    StateCrudAction.prototype.clone = function () {
        var copy = new StateCrudAction(this.type, this.parent, this.propertyName, this.value);
        copy.assignProps(this);
        return copy;
    };
    StateCrudAction.prototype.mutate = function (perform) {
        if (perform === void 0) { perform = true; }
        this.pristine = false;
        var fullpath = Manager_1.Manager.get(this.parent).getFullPath(this.parent, this.propertyName);
        this.mappingActions = Manager_1.Manager.get(this.parent).getMappingState().getPathMappings(fullpath) || [];
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
 * The name of this function is intended to convey the fact that it uses a property of the array
 * object type to use as the key.
 *
 * Seems like this is the usual / expected case, so export this function to be used for that.
 * Note that the signature is not the same as KeyGeneratorFnType, so to use it you will need to
 * generate the actual KeyGeneratorFnType like so:
 *
 * `let idGenerator = bookKeyGenerator<Book>(book: Book) {
 *    return propertyKeyGenerator<Book>(books, index, { propertyKey: 'id' } );
 *  }
 * `
 *
 * @param {Array<V>} array
 * @param {number} index
 * @param {{propertyKey: keyof V}} options
 * @returns {React.Key}
 */
function propertyKeyGenerator(arrayElement, propertyKey) {
    var keyValue = arrayElement[propertyKey];
    if (typeof keyValue === 'string' || typeof keyValue === 'number') {
        return keyValue;
    }
    var message = "keyValue " + JSON.stringify(keyValue, null, 4) + " is not a React.Key!";
    throw new Error(message);
}
exports.propertyKeyGenerator = propertyKeyGenerator;
/**
 * React requires 'key' data elements for list rendering, and we need to keep track of
 * what indexes are associated with keys, for the purposes of modifying array state, since
 * the mutate array api's require array indexes.
 *
 * This class holds mappings for all the arrays in the app state, and for each will return
 * a map of type Map<React.Key, number>, which relates React's unique keys to the index
 * which holds the array element.
 *
 * V the generic type of the values held in the array, eg, Array<V>
 */
var ArrayKeyIndexMap = /** @class */ (function () {
    function ArrayKeyIndexMap() {
        /* tslint:disable:no-any */
        this.arrayMapper = new Map();
        this.keyGenMapper = new Map();
    }
    ArrayKeyIndexMap.prototype.getOrCreateKeyIndexMap = function (array, keyGenerator) {
        var keyIndexMap = this.arrayMapper.get(array);
        if (!keyIndexMap) {
            keyIndexMap = this.populateMaps(array, keyGenerator);
            this.arrayMapper.set(array, keyIndexMap);
        }
        return keyIndexMap;
    };
    ArrayKeyIndexMap.prototype.getKeyGeneratorFn = function (array) {
        var result = this.keyGenMapper.get(array);
        if (!result) {
            throw new Error("Failed to find key gen fn for array");
        }
        return result;
    };
    ArrayKeyIndexMap.prototype.size = function () {
        return this.arrayMapper.size;
    };
    ArrayKeyIndexMap.prototype.get = function (array) {
        var result = this.arrayMapper.get(array);
        if (!result) {
            throw new Error("Failed to find map for array");
        }
        return result;
    };
    ArrayKeyIndexMap.prototype.hasKeyIndexMap = function (array) {
        return this.arrayMapper.has(array) && this.keyGenMapper.has(array);
    };
    /**
     * Creates the key index map, then inserts into it and the keyGenMapper
     * @param {Array<V>} array
     * @param {ArrayKeyGeneratorFn<V>} keyGenerator
     * @returns {Map<React.Key, number>} the key/index map
     */
    ArrayKeyIndexMap.prototype.populateMaps = function (array, keyGenerator) {
        this.keyGenMapper.set(array, keyGenerator);
        var map = new Map();
        array.forEach(function (value, index, values) {
            var reactKey = keyGenerator(value, index, values);
            if (map.has(reactKey)) {
                throw new Error("Duplicate React key calculated at index " + index + ", key=" + reactKey);
            }
            map.set(reactKey, index);
        });
        return map;
    };
    ArrayKeyIndexMap.prototype.deleteFromMaps = function (array) {
        this.keyGenMapper.delete(array);
        return this.arrayMapper.delete(array);
    };
    /* tslint:enable:no-any */
    ArrayKeyIndexMap.get = function () {
        if (!ArrayKeyIndexMap.instance) {
            ArrayKeyIndexMap.instance = new ArrayKeyIndexMap();
        }
        return ArrayKeyIndexMap.instance;
    };
    return ArrayKeyIndexMap;
}());
exports.ArrayKeyIndexMap = ArrayKeyIndexMap;
/**
 * Standalone data structure: for each array in state, maps React list keys to array indexes.
 *
 * - singleton created at startup
 * - entries <Array, KeyIndexMap> are created lazily
 * - updated upon ArrayMutateAction update
 * - deleted upon StateCrudAction array delete
 *
 * Note that duplicated keys result in an Error being thrown.
 */
// export const arrayKeyIndexMap = new ArrayKeyIndexMap();
/**
 *
 */
var ArrayMutateAction = /** @class */ (function (_super) {
    __extends(ArrayMutateAction, _super);
    // TODO: restrict the set of ActionId's here to regular property insert/update/delete
    function ArrayMutateAction(actionType, _parent, _propertyName, _index, valuesArray, _keyGen, _value) {
        var _this = _super.call(this, actionType, _parent, _propertyName) || this;
        _this.index = _index;
        _this.value = _value;
        _this.valuesArray = valuesArray;
        _this.keyGen = _keyGen;
        return _this;
    }
    ArrayMutateAction.prototype.assignProps = function (from) {
        _super.prototype.assignProps.call(this, from);
        this.mutateResult = from.mutateResult;
        this.oldValue = from.oldValue;
        this.value = from.value;
        this.valuesArray = from.valuesArray;
        this.index = from.index;
        this.keyGen = from.keyGen;
    };
    ArrayMutateAction.prototype.clone = function () {
        var copy = new ArrayMutateAction(this.type, this.parent, this.propertyName, this.index, this.valuesArray, this.keyGen, this.value);
        return copy;
    };
    ArrayMutateAction.prototype.containersToRender = function (containersBeingRendered) {
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
    ArrayMutateAction.prototype.mutate = function (perform) {
        if (perform === void 0) { perform = true; }
        this.pristine = false;
        // annotateActionInState(this);
        var actionId = perform ? this.type : this.getUndoAction();
        var fullpath = Manager_1.Manager.get(this.parent).getFullPath(this.parent, this.propertyName);
        // let key = this.keyGen && this.index > -1 ? this.keyGen(this.valuesArray[this.index]) : undefined;
        // NOTE that index is of type number, required, not possibly undefined or null
        this.mappingActions = Manager_1.Manager.get(this.parent).getMappingState().getPathMappings(fullpath, this.index) || [];
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
     * @param {DispatchType} dispatches - these are generally instance functions in the component that update other
     *          component view properties as a function of the target view property having changed.
     */
    function MappingAction(parent, _propertyOrArrayName, _component, targetPropName) {
        var dispatches = [];
        for (var _i = 4; _i < arguments.length; _i++) {
            dispatches[_i - 4] = arguments[_i];
        }
        var _this = _super.call(this, ActionId.MAP_STATE_TO_PROP, parent, _propertyOrArrayName) || this;
        //
        _this.index = -1;
        _this.component = _component;
        _this.fullPath = Manager_1.Manager.get(_this.parent).getFullPath(_this.parent, _this.propertyName);
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
        this.index = from.index;
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
     * Map this component to an array element object, e.g., a row of data.  We are mapping the index of the
     * state array and the container, while populating the ArrayKeyIndexMap (maps React.Key to index).
     *
     * Note that this method will throw if the index is invalid or refers to an undefined value in the array.
     *
     * @param {number} _index
     * @param {S[K] & Array<E>} _propArray
     * @param {ArrayKeyGeneratorFn<E>} _keyGen
     */
    MappingAction.prototype.setArrayElement = function (_index, _propArray, _keyGen) {
        if (this.index > -1 || this.keyGen || this.propArray) {
            // this can be done once and only once, or we throw
            throw new Error("attempting to reset array " + this.propertyName + " at index = " + _index);
        }
        if (_propArray.length < _index || _propArray.length < 0 || !_propArray[_index]) {
            var fullpath = Manager_1.Manager.get(this.parent).getFullPath(this.parent, this.propertyName);
            throw new Error("Can't map to an undefined array index " + _index + " at " + fullpath);
        }
        // initialize the map using current state values
        ArrayKeyIndexMap.get().getOrCreateKeyIndexMap(_propArray, _keyGen);
        this.index = _index;
        this.keyGen = _keyGen;
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
    MappingAction.prototype.mutate = function (perform) {
        if (perform === void 0) { perform = true; }
        this.pristine = false;
        // If this action refers to an element at an array index, compute the key
        // let key = (this.propArray && this.keyGen && this.index > -1) ?
        // this.keyGen(this.propArray[this.index]) : undefined;
        var _index = this.index > -1 ? this.index : undefined;
        if (perform) {
            var components = Manager_1.Manager.get(this.parent).getMappingState().getOrCreatePathMappings(this.fullPath, _index);
            components.push(this);
        }
        else {
            Manager_1.Manager.get(this.parent).getMappingState().removePathMapping(this.fullPath, this, _index);
        }
    };
    // on componentDidMount
    MappingAction.prototype.performMutation = function () {
        this.mutate(true);
    };
    // on componentWillUnmount
    MappingAction.prototype.undoMutation = function () {
        this.mutate(false);
    };
    MappingAction.prototype.redo = function () {
        this.performMutation();
    };
    return MappingAction;
}(StateAction));
exports.MappingAction = MappingAction;
/* tslint:enable:no-any */ 
//# sourceMappingURL=actions.js.map