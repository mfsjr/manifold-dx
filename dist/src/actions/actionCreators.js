"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var actions_1 = require("./actions");
// TODO: figure out how to do type checking with this instead of RTE
function isNotArray(value) {
    return !(value instanceof Array);
}
exports.isNotArray = isNotArray;
/**
 * Create CRUD actions for properties of a StateObject.
 * Array CRUD actions are in {@link ArrayActionCreator}
 */
var ActionCreator = /** @class */ (function () {
    // private propertyKey: keyof S;
    function ActionCreator(parent) {
        this.parent = parent;
    }
    ActionCreator.prototype.getPropertyKeyForValue = function (value) {
        for (var key in this.parent) {
            /* tslint:disable:no-any */
            if (value === this.parent[key]) {
                /* tslint:enable:no-any */
                return key;
            }
        }
        throw new Error("Failed to find property value " + value + " in parent");
    };
    ActionCreator.prototype.throwIfArray = function (propValue) {
        if (propValue instanceof Array) {
            throw new Error("ActionCreator instructed to create action on array, use ArrayActionCreator for that");
        }
    };
    ActionCreator.prototype.rerender = function (propertyKey) {
        this.throwIfArray(this.parent[propertyKey]);
        return new actions_1.StateCrudAction(actions_1.ActionId.RERENDER, this.parent, propertyKey, this.parent[propertyKey]);
    };
    ActionCreator.prototype.insert = function (propertyKey, value) {
        this.throwIfArray(this.parent[propertyKey]);
        return new actions_1.StateCrudAction(actions_1.ActionId.INSERT_PROPERTY, this.parent, propertyKey, value);
    };
    ActionCreator.prototype.update = function (propertyKey, value) {
        this.throwIfArray(this.parent[propertyKey]);
        return new actions_1.StateCrudAction(actions_1.ActionId.UPDATE_PROPERTY, this.parent, propertyKey, value);
    };
    /**
     * Delete the property (named 'remove' because 'delete' is a reserved word)
     * @param {K} propertyKey
     * @returns {Action}
     */
    ActionCreator.prototype.remove = function (propertyKey) {
        this.throwIfArray(this.parent[propertyKey]);
        return new actions_1.StateCrudAction(actions_1.ActionId.DELETE_PROPERTY, this.parent, propertyKey);
    };
    // TODO: can this and the crudInsert above actually work when defined in terms of non-existent keys?
    ActionCreator.prototype.insertStateObject = function (value, propertyKey) {
        return new actions_1.StateCrudAction(actions_1.ActionId.INSERT_STATE_OBJECT, this.parent, propertyKey, value);
    };
    ActionCreator.prototype.removeStateObject = function (propertyKey) {
        this.throwIfArray(this.parent[propertyKey]);
        return new actions_1.StateCrudAction(actions_1.ActionId.DELETE_STATE_OBJECT, this.parent, propertyKey, this.parent[propertyKey]);
    };
    return ActionCreator;
}());
exports.ActionCreator = ActionCreator;
/**
 * Factory method for CrudActionCreator, rather than exposing implementation details
 * @param {S} parent
 * @returns {ActionCreator<S extends StateObject>}
 */
function getActionCreator(parent) {
    return new ActionCreator(parent);
}
exports.getActionCreator = getActionCreator;
function getArrayActionCreator(parent, childArray) {
    return new ArrayActionCreator(parent, childArray);
}
exports.getArrayActionCreator = getArrayActionCreator;
/**
 * Class for creating CRUD actions for arrays of objects (not primitives).
 *
 * Arrays of primitives can be handled with CRUD operations that treat arrays as simple properties,
 * using {@link ActionCreator}s above.  Note that the creation and deletion of arrays of
 * objects would need to use the same.
 *
 * usage example from tests:  new ArrayCrudActionCreator(nameState, nameState.addresses, streetKeyFn)
 *
 * S is the StateObject which the array is a property of
 */
var ArrayActionCreator = /** @class */ (function () {
    /**
     * Construct an array crud creator.  We require a somewhat redundant 'valuesArray'
     * parameter in order to provide TypeScript with a strongly typed object that
     * we can use in conjunction with a typeguard so that the array element's property is an
     * appropriately typed value.
     *
     * There may be some TS experts out there who know how to do this, but this appears
     * to be outside of the capabilities of 2.7 judging by the docs.
     *
     * Recent PR's targeted for 2.8 may change this, see https://github.com/Microsoft/TypeScript/pull/21496
     *
     * S extends StateObject
     *
     * @param {S} parent
     * @param {keyof S} propertyKey
     * @param {Array<V>} childArray
     * @param {ArrayKeyGeneratorFn} keyGenerator
     */
    function ArrayActionCreator(parent, childArray) {
        this.parent = parent;
        /* tslint:disable:no-any */
        var array = childArray;
        var propKey;
        for (var key in parent) {
            if (array === parent[key] && array instanceof Array) {
                propKey = key;
            }
        }
        /* tslint:enable:no-any */
        if (!propKey) {
            throw Error("Failed to find array in parent");
        }
        this.propertyKey = propKey;
        this.valuesArray = array;
    }
    ArrayActionCreator.prototype.insertArray = function (newArray) {
        return new actions_1.StateCrudAction(actions_1.ActionId.INSERT_PROPERTY, this.parent, this.propertyKey, newArray);
    };
    ArrayActionCreator.prototype.removeArray = function () {
        return new actions_1.StateCrudAction(actions_1.ActionId.DELETE_PROPERTY, this.parent, this.propertyKey, undefined);
    };
    ArrayActionCreator.prototype.rerenderArray = function () {
        return new actions_1.StateCrudAction(actions_1.ActionId.RERENDER, this.parent, this.propertyKey, this.parent[this.propertyKey]);
    };
    ArrayActionCreator.prototype.appendElement = function (value) {
        return this.insertElement(this.valuesArray.length, value);
    };
    /**
     * Insert into the StateObject's array, and return an array of actions for each element above the insertion.
     *
     * Mapping actions will remain unchanged, but the value of all the mapped state, and container view properties will
     * be updated.
     *
     * If the additional object at the end of the array is to be shown, an additional mapping action would have to be
     * performed, a {@link ContainerComponent} would be required, etc.
     *
     *
     * @param {number} index
     * @param {V} value
     * @returns {Action}
     */
    ArrayActionCreator.prototype.insertElement = function (index, value) {
        var actions = [
            new actions_1.ArrayChangeAction(actions_1.ActionId.INSERT_PROPERTY, this.parent, this.propertyKey, index, this.valuesArray, value),
            new actions_1.StateCrudAction(actions_1.ActionId.RERENDER, this.parent, this.propertyKey, this.parent[this.propertyKey])
        ];
        return actions;
    };
    ArrayActionCreator.prototype.rerenderElement = function (index) {
        return new actions_1.ArrayChangeAction(actions_1.ActionId.RERENDER, this.parent, this.propertyKey, index, this.valuesArray, this.valuesArray[index]);
    };
    ArrayActionCreator.prototype.updateElement = function (index, newValue) {
        // let index = this.getIndexOf(oldValue);
        return new actions_1.ArrayChangeAction(actions_1.ActionId.UPDATE_PROPERTY, this.parent, this.propertyKey, index, this.valuesArray, newValue);
    };
    ArrayActionCreator.prototype.removeElement = function (index) {
        var newValue = index + 1 < this.valuesArray.length ? this.valuesArray[index + 1] : undefined;
        return [
            new actions_1.ArrayChangeAction(actions_1.ActionId.DELETE_PROPERTY, this.parent, this.propertyKey, index, this.valuesArray, newValue),
            new actions_1.StateCrudAction(actions_1.ActionId.RERENDER, this.parent, this.propertyKey, this.parent[this.propertyKey])
        ];
    };
    return ArrayActionCreator;
}());
exports.ArrayActionCreator = ArrayActionCreator;
function getMappingActionCreator(_parent, _propKey) {
    /**
     * Create a MappingAction from the state defined by this creator, to the component and its view / target property.
     *
     * @param {ContainerComponent<CP, VP, A extends StateObject>} _component
     * @param {TP} targetPropKey
     * @param {MappingHook} functions that are executed after mapping but before rendering
     * @returns {MappingAction<S extends StateObject, K extends keyof S, CP, VP, TP extends keyof VP,
     * A extends StateObject, E>}
     */
    var createPropertyMappingAction = function (_component, targetPropKey) {
        var mappingHooks = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            mappingHooks[_i - 2] = arguments[_i];
        }
        return new (actions_1.MappingAction.bind.apply(actions_1.MappingAction, [void 0, _parent, _propKey, _component, targetPropKey].concat(mappingHooks)))();
    };
    /**
     * Create a mapping from an array element, or the whole array, to a component
     * @param {number | null} index use number to map from an array element, or null to map the array itself
     * @param {ContainerComponent<CP, VP, A extends StateObject>} _component the component being mapped, typically 'this'
     * @param {TP} targetPropKey the name of the view/target property being updated
     * @param {MappingHook} optional functions executed after the action but before rendering.  View props
     *    may be updated here
     * @returns {MappingAction
     *  <S extends StateObject, K extends keyof S, CP, VP, TP extends keyof VP, A extends StateObject, E>}
     *  the mapping action
     */
    var createArrayIndexMappingAction = function (_array, index, _component, targetPropKey) {
        var mappingHooks = [];
        for (var _i = 4; _i < arguments.length; _i++) {
            mappingHooks[_i - 4] = arguments[_i];
        }
        var mappingAction = new (actions_1.MappingAction.bind.apply(actions_1.MappingAction, [void 0, _parent, _propKey, _component, targetPropKey].concat(mappingHooks)))();
        // TODO: try building a custom type guard for Array<E>
        var propKey;
        for (var key in _parent) {
            if (_array === _parent[key] && _array instanceof Array) {
                propKey = key;
            }
        }
        if (!propKey) {
            throw Error("Failed to find array in parent");
        }
        var result = mappingAction.setArrayElement(index, _array);
        return result;
    };
    return {
        createPropertyMappingAction: createPropertyMappingAction,
        createArrayIndexMappingAction: createArrayIndexMappingAction
    };
}
exports.getMappingActionCreator = getMappingActionCreator;
//# sourceMappingURL=actionCreators.js.map