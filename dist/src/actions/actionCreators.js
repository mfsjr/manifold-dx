"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getArrayMappingActionCreator = exports.getMappingActionCreator = exports.ArrayActionCreator = exports.getArrayActionCreator = exports.getActionCreator = exports.ActionCreator = exports.isNotArray = void 0;
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
            throw new Error("Invalid action type for ActionCreator using an array, try using ArrayActionCreator");
        }
    };
    ActionCreator.prototype.rerender = function (propertyKey) {
        // this.throwIfArray(this.parent[propertyKey]);
        return new actions_1.StateCrudAction(actions_1.ActionId.RERENDER, this.parent, propertyKey, this.parent[propertyKey]);
    };
    /**
     * Insert the value.  If the current value exists, an error will be thrown.
     * @param propertyKey
     * @param value
     */
    ActionCreator.prototype.insert = function (propertyKey, value) {
        return new actions_1.StateCrudAction(actions_1.ActionId.INSERT_PROPERTY, this.parent, propertyKey, value);
    };
    /**
     * Insert the value if the current property is empty, else provide a no-op action type so that
     * dispatch will ignore it.
     * {@see insert}, {@see update}
     * @param propertyKey
     * @param value
     */
    ActionCreator.prototype.insertIfEmpty = function (propertyKey, value) {
        var type = !this.parent[propertyKey] ? actions_1.ActionId.INSERT_PROPERTY : actions_1.ActionId.INSERT_PROPERTY_NO_OP;
        return new actions_1.StateCrudAction(type, this.parent, propertyKey, value);
    };
    // NOTE: 'assignAll'?  Seems unnecessary, we can simply insert/update the parent
    /**
     * Update the existing value.  If the value being passed in is the same as the current value, an
     * error will be thrown.  If there is no existing value, an error will be thrown.
     * @param propertyKey
     * @param value
     */
    ActionCreator.prototype.update = function (propertyKey, value) {
        return new actions_1.StateCrudAction(actions_1.ActionId.UPDATE_PROPERTY, this.parent, propertyKey, value);
    };
    /**
     * Tests to see if the update is using the same object as the current value; if it is, the resulting action
     * is a no-op (does nothing), else a regular update is created.
     *
     * @param propertyKey
     * @param value
     */
    ActionCreator.prototype.updateIfChanged = function (propertyKey, value) {
        var actionId = this.parent[propertyKey] !== value ? actions_1.ActionId.UPDATE_PROPERTY : actions_1.ActionId.UPDATE_PROPERTY_NO_OP;
        return new actions_1.StateCrudAction(actionId, this.parent, propertyKey, value);
    };
    /**
     * This is the preferred action creation api, capable of performing inserts, updates and deletes.
     * If the new value is 'undefined', then this is equivalent to deletion/removal.
     *
     * This method works by determining whether it needs to call {@link insert}, {@link update} or {@link remove}.
     * It will not throw errors, but it may create actions that are no-ops (e.g., update the same value, delete
     * a property that is undefined, etc).
     *
     * If the developer knows what a value is, then using insert, update or remove directly is perfectly valid.
     *
     * If you need to squeeze out the highest possible levels of performance, using insert, update or remove
     * directly might make things a little faster.
     *
     * @param propertyKey
     * @param value
     */
    ActionCreator.prototype.set = function (propertyKey, value) {
        if (value === undefined) {
            return this.removeIfHasData(propertyKey);
        }
        else if (this.parent[propertyKey] === null || this.parent[propertyKey] === undefined) {
            return this.insert(propertyKey, value);
        }
        return this.updateIfChanged(propertyKey, value);
    };
    ActionCreator.prototype.isKeyOf = function (value, key) {
        return value.hasOwnProperty(key);
    };
    /**
     * Delete the property (named 'remove' because 'delete' is a reserved word).
     *
     * If it is not empty, throw
     * @param {K} propertyKey
     * @returns {Action}
     */
    ActionCreator.prototype.remove = function (propertyKey) {
        // this.throwIfArray(this.parent[propertyKey]);
        return new actions_1.StateCrudAction(actions_1.ActionId.DELETE_PROPERTY, this.parent, propertyKey);
    };
    /**
     * If the value of the property is not undefined or null, remove it, else return a no-op action.
     * @param propertyKey
     */
    ActionCreator.prototype.removeIfHasData = function (propertyKey) {
        var type = this.parent[propertyKey] === undefined || this.parent[propertyKey] === null ?
            actions_1.ActionId.DELETE_PROPERTY_NO_OP :
            actions_1.ActionId.DELETE_PROPERTY;
        return new actions_1.StateCrudAction(type, this.parent, propertyKey);
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
 * @param {S} parent.
 *
 * @returns {ActionCreator<S extends StateObject>}
 * @throws if the parent state object passed in is falsy.
 */
function getActionCreator(parent) {
    if (!parent) {
        throw new Error("getActionCreator received an undefined parent state object");
    }
    return new ActionCreator(parent);
}
exports.getActionCreator = getActionCreator;
/**
 * Map an array from application state, to be mapped to a target.
 * @param parent
 * @param childArray
 * @throws if the parent state object passed in is falsy.
 */
function getArrayActionCreator(parent, childArray) {
    if (!parent) {
        throw new Error("getArrayActionCreator received an undefined parent state object");
    }
    if (!childArray) {
        throw new Error("getArrayActionCreator received an undefined childArray");
    }
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
     * Construct an array crud creator.  We require a somewhat redundant 'childArray'
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
     * @param parent
     * @param childArray
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
    ArrayActionCreator.prototype.updateArray = function (newArray) {
        return new actions_1.StateCrudAction(actions_1.ActionId.UPDATE_PROPERTY, this.parent, this.propertyKey, newArray);
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
    ArrayActionCreator.prototype.updateElementIfChanged = function (index, newValue) {
        var type = newValue !== this.valuesArray[index] ? actions_1.ActionId.UPDATE_PROPERTY : actions_1.ActionId.UPDATE_PROPERTY_NO_OP;
        return new actions_1.ArrayChangeAction(type, this.parent, this.propertyKey, index, this.valuesArray, newValue);
    };
    /**
     * Replace the current array's elements with the contents of the newArray.
     *
     * Note that if an element at an index is the same in the new and old array, it will be left unchanged (no
     * actions will be dispatched).
     *
     * @param newArray
     */
    ArrayActionCreator.prototype.replaceAll = function (newArray) {
        var actions = [];
        var sup = Math.max(newArray.length, this.valuesArray.length);
        for (var i = 0; i < sup; i++) {
            if (i < newArray.length && i < this.valuesArray.length) {
                if (newArray[i] !== this.valuesArray[i]) {
                    actions.push(this.updateElement(i, newArray[i]));
                }
            }
            if (i >= newArray.length) {
                actions.push(new actions_1.ArrayChangeAction(actions_1.ActionId.DELETE_PROPERTY, this.parent, this.propertyKey, i, this.valuesArray, newArray[i]));
                // actions.concat(this.removeElement(i));
                continue;
            }
            if (i >= this.valuesArray.length) {
                actions.push(new actions_1.ArrayChangeAction(actions_1.ActionId.INSERT_PROPERTY, this.parent, this.propertyKey, i, this.valuesArray, newArray[i]));
                // actions.concat(this.appendElement(array[i]));
                continue;
            }
        }
        actions.push(new actions_1.StateCrudAction(actions_1.ActionId.RERENDER, this.parent, this.propertyKey, this.parent[this.propertyKey]));
        return actions;
    };
    ArrayActionCreator.prototype.removeElement = function (index) {
        var newValue = index + 1 < this.valuesArray.length ? this.valuesArray[index + 1] : this.valuesArray[index];
        return [
            new actions_1.ArrayChangeAction(actions_1.ActionId.DELETE_PROPERTY, this.parent, this.propertyKey, index, this.valuesArray, newValue),
            new actions_1.StateCrudAction(actions_1.ActionId.RERENDER, this.parent, this.propertyKey, this.parent[this.propertyKey])
        ];
    };
    return ArrayActionCreator;
}());
exports.ArrayActionCreator = ArrayActionCreator;
/**
 * Create a mapping from app state to this component.
 * @param _parent
 * @param _propKey
 * @throws if the parent state object passed in is falsy.
 */
function getMappingActionCreator(_parent, _propKey) {
    if (!_parent) {
        throw new Error("getMappingActionCreator received an undefined parent state object");
    }
    /**
     * Create a MappingAction from the state defined by this creator, to the component and its view / target property.
     *
     * @param {ContainerComponent<CP, VP, A extends StateObject>} _component
     * @param {TP} targetPropKey
     * @param {ContainerPostReducer} functions that are executed after reducer but before rendering
     * @returns {MappingAction<S extends StateObject, K extends Extract<keyof S, string>, CP, VP, TP extends keyof VP,
     * A extends StateObject, E>}
     */
    var createPropertyMappingAction = function (_component, targetPropKey) {
        var postReducerCallbacks = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            postReducerCallbacks[_i - 2] = arguments[_i];
        }
        return new (actions_1.MappingAction.bind.apply(actions_1.MappingAction, __spreadArrays([void 0, _parent, _propKey, _component, targetPropKey], postReducerCallbacks)))();
    };
    return {
        createPropertyMappingAction: createPropertyMappingAction,
    };
}
exports.getMappingActionCreator = getMappingActionCreator;
/**
 * Create a mapping from an app state array to this component.
 * @param _parent
 * @param _propKey
 * @throws if the parent state object is falsy
 */
function getArrayMappingActionCreator(_parent, _propKey) {
    if (!_parent) {
        throw new Error("getMappingActionCreator received an undefined parent state object");
    }
    /**
     * Create a mapping from an array element, or the whole array, to a component
     * @param {S[K] & Array<E>} state array to be mapped
     * @param {number | null} index use number to map from an array element, or null to map the array itself
     * @param {ContainerComponent<CP, VP, A extends StateObject>} _component the component being mapped, typically 'this'
     * @param {TP} targetPropKey the name of the view/target property being updated
     * @param {ContainerPostReducer} optional functions executed after the action but before rendering.  View props
     *    may be updated here
     * @returns {MappingAction
     * <S extends StateObject, K extends Extract<keyof S, string>, CP, VP, TP extends keyof VP, A extends StateObject, E>}
     *  the mapping action
     */
    var createArrayIndexMappingAction = function (_array, index, _component, targetPropKey) {
        var postReducerCallbacks = [];
        for (var _i = 4; _i < arguments.length; _i++) {
            postReducerCallbacks[_i - 4] = arguments[_i];
        }
        if (!_parent) {
            throw new Error("getArrayMappingActionCreator received an undefined parent state object");
        }
        var mappingAction = new (actions_1.MappingAction.bind.apply(actions_1.MappingAction, __spreadArrays([void 0, _parent, _propKey, _component, targetPropKey], postReducerCallbacks)))();
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
        createArrayIndexMappingAction: createArrayIndexMappingAction
    };
}
exports.getArrayMappingActionCreator = getArrayMappingActionCreator;
//# sourceMappingURL=actionCreators.js.map