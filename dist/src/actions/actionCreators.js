"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var actions_1 = require("./actions");
/**
 * Create CRUD actions for properties of a StateObject.
 * Array CRUD actions are in {@link ArrayCrudActionCreator}
 */
var CrudActionCreator = /** @class */ (function () {
    // private propertyKey: keyof S;
    function CrudActionCreator(parent) {
        this.parent = parent;
    }
    CrudActionCreator.prototype.getPropertyKeyForValue = function (value) {
        for (var key in this.parent) {
            /* tslint:disable:no-any */
            if (value === this.parent[key]) {
                /* tslint:enable:no-any */
                return key;
            }
        }
        throw new Error("Failed to find property value " + value + " in parent");
    };
    CrudActionCreator.prototype.rerender = function (propertyKey) {
        return new actions_1.StateCrudAction(actions_1.ActionId.RERENDER, this.parent, propertyKey, this.parent[propertyKey]);
    };
    CrudActionCreator.prototype.insert = function (propertyKey, value) {
        return new actions_1.StateCrudAction(actions_1.ActionId.UPDATE_PROPERTY, this.parent, propertyKey, value);
    };
    CrudActionCreator.prototype.update = function (propertyKey, value) {
        return new actions_1.StateCrudAction(actions_1.ActionId.UPDATE_PROPERTY, this.parent, propertyKey, value);
    };
    /**
     * Delete the property (named 'remove' because 'delete' is a reserved word)
     * @param {K} propertyKey
     * @returns {Action}
     */
    CrudActionCreator.prototype.remove = function (propertyKey) {
        return new actions_1.StateCrudAction(actions_1.ActionId.DELETE_PROPERTY, this.parent, propertyKey);
    };
    // TODO: can this and the crudInsert above actually work when defined in terms of non-existent keys?
    CrudActionCreator.prototype.insertStateObject = function (value, propertyKey) {
        return new actions_1.StateCrudAction(actions_1.ActionId.INSERT_STATE_OBJECT, this.parent, propertyKey, value);
    };
    CrudActionCreator.prototype.removeStateObject = function (propertyKey) {
        return new actions_1.StateCrudAction(actions_1.ActionId.DELETE_STATE_OBJECT, this.parent, propertyKey, this.parent[propertyKey]);
    };
    return CrudActionCreator;
}());
exports.CrudActionCreator = CrudActionCreator;
/**
 * Factory method for CrudActionCreator, rather than exposing implementation details
 * @param {S} parent
 * @returns {CrudActionCreator<S extends StateObject>}
 */
function getCrudCreator(parent) {
    return new CrudActionCreator(parent);
}
exports.getCrudCreator = getCrudCreator;
function getArrayCrudCreator(parent, childArray, keyGenerator) {
    return new ArrayCrudActionCreator(parent, childArray, keyGenerator);
}
exports.getArrayCrudCreator = getArrayCrudCreator;
/**
 * Class for creating CRUD actions for arrays of objects (not primitives).
 *
 * Arrays of primitives can be handled with CRUD operations that treat arrays as simple properties,
 * using {@link CrudActionCreator}s above.  Note that the creation and deletion of arrays of
 * objects would need to use the same.
 *
 * usage example from tests:  new ArrayCrudActionCreator(nameState, nameState.addresses, streetKeyFn)
 *
 * S is the StateObject which the array is a property of
 */
var ArrayCrudActionCreator = /** @class */ (function () {
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
    function ArrayCrudActionCreator(parent, childArray, keyGenerator) {
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
        this.keyGenerator = keyGenerator;
    }
    ArrayCrudActionCreator.prototype.append = function (value) {
        return this.insert(this.valuesArray.length, value)[0];
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
    ArrayCrudActionCreator.prototype.insert = function (index, value) {
        var actions = [
            new actions_1.ArrayMutateAction(actions_1.ActionId.INSERT_PROPERTY, this.parent, this.propertyKey, index, this.valuesArray, this.keyGenerator, value),
            new actions_1.StateCrudAction(actions_1.ActionId.RERENDER, this.parent, this.propertyKey, this.parent[this.propertyKey])
        ];
        return actions;
    };
    ArrayCrudActionCreator.prototype.update = function (index, newValue) {
        // let index = this.getIndexOf(oldValue);
        return new actions_1.ArrayMutateAction(actions_1.ActionId.UPDATE_PROPERTY, this.parent, this.propertyKey, index, this.valuesArray, this.keyGenerator, newValue);
    };
    ArrayCrudActionCreator.prototype.remove = function (index) {
        var newValue = index + 1 < this.valuesArray.length ? this.valuesArray[index + 1] : undefined;
        return [
            new actions_1.ArrayMutateAction(actions_1.ActionId.DELETE_PROPERTY, this.parent, this.propertyKey, index, this.valuesArray, this.keyGenerator, newValue),
            new actions_1.StateCrudAction(actions_1.ActionId.RERENDER, this.parent, this.propertyKey, this.parent[this.propertyKey])
        ];
    };
    return ArrayCrudActionCreator;
}());
exports.ArrayCrudActionCreator = ArrayCrudActionCreator;
function getMappingCreator(_parent, _propKey, arrayOptions) {
    /**
     * Create a MappingAction from the state defined by this creator, to the component and its view / target property.
     *
     * @param {ContainerComponent<CP, VP, A extends StateObject>} _component
     * @param {TP} targetPropKey
     * @param {DispatchType} dispatches
     * @returns {MappingAction<S extends StateObject, K extends keyof S, CP, VP, TP extends keyof VP,
     * A extends StateObject, E>}
     */
    var createPropertyMappingAction = function (_component, targetPropKey) {
        var dispatches = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            dispatches[_i - 2] = arguments[_i];
        }
        return new (actions_1.MappingAction.bind.apply(actions_1.MappingAction, [void 0, _parent, _propKey, _component, targetPropKey].concat(dispatches)))();
    };
    var createArrayIndexMappingAction = function (index, _component, targetPropKey) {
        var dispatches = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            dispatches[_i - 3] = arguments[_i];
        }
        var mappingAction = new (actions_1.MappingAction.bind.apply(actions_1.MappingAction, [void 0, _parent, _propKey, _component, targetPropKey].concat(dispatches)))();
        if (!arrayOptions) {
            throw new Error("Can't invoke this method without arrayOptions!");
        }
        // TODO: try building a custom type guard for Array<E>
        var array = arrayOptions.array;
        var propKey;
        for (var key in _parent) {
            if (array === _parent[key] && array instanceof Array) {
                propKey = key;
            }
        }
        if (!propKey) {
            throw Error("Failed to find array in parent");
        }
        var result = mappingAction.setArrayElement(index, arrayOptions.array, arrayOptions.keyGen);
        return result;
    };
    return {
        createPropertyMappingAction: createPropertyMappingAction,
        createArrayIndexMappingAction: createArrayIndexMappingAction
    };
}
exports.getMappingCreator = getMappingCreator;
//# sourceMappingURL=actionCreators.js.map