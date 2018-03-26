"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var actions_1 = require("./actions");
var CrudActionCreator = /** @class */ (function () {
    function CrudActionCreator(parent) {
        this.parent = parent;
    }
    CrudActionCreator.prototype.getPropertyKeyForValue = function (value) {
        for (var key in this.parent) {
            /* tslint:disable:no-any */
            if (value === this.parent[key]) {
                /* tslint:enable:no-any */
                this.propertyKey = key;
                break;
            }
        }
        if (!this.propertyKey) {
            throw new Error("Failed to find property value " + value + " in parent");
        }
        return this.propertyKey;
    };
    CrudActionCreator.prototype.crudInsert = function (value, propertyKey) {
        return new actions_1.StateCrudAction(actions_1.ActionId.UPDATE_PROPERTY, this.parent, this.propertyKey, value);
    };
    CrudActionCreator.prototype.crudUpdate = function (value) {
        this.propertyKey = this.getPropertyKeyForValue(value);
        return new actions_1.StateCrudAction(actions_1.ActionId.UPDATE_PROPERTY, this.parent, this.propertyKey, value);
    };
    CrudActionCreator.prototype.crudDelete = function (value) {
        this.propertyKey = this.getPropertyKeyForValue(value);
        return new actions_1.StateCrudAction(actions_1.ActionId.DELETE_PROPERTY, this.parent, this.propertyKey, this.parent[this.propertyKey]);
    };
    // TODO: can this and the crudInsert above actually work when defined in terms of non-existent keys?
    CrudActionCreator.prototype.crudNest = function (value, propertyKey) {
        return new actions_1.StateCrudAction(actions_1.ActionId.INSERT_STATE_OBJECT, this.parent, this.propertyKey, value);
    };
    CrudActionCreator.prototype.crudUnnest = function (value) {
        return new actions_1.StateCrudAction(actions_1.ActionId.DELETE_STATE_OBJECT, this.parent, this.propertyKey, value);
    };
    return CrudActionCreator;
}());
exports.CrudActionCreator = CrudActionCreator;
/**
 * Class for creating CRUD actions for arrays of objects (not primitives).
 *
 * Arrays of primitives can be handled with CRUD operations that treat arrays as simple properties,
 * using {@link CrudActionCreator}s above.  Note that the creation and deletion of arrays of
 * objects would need to use the same.
 *
 * S is the StateObject which the array is a property of
 */
var ArrayCrudActionCreator = /** @class */ (function () {
    /**
     * Construct an array crud creator.  We require a somewhat redundant 'valuesArray'
     * parameter in order to provide TypeScript with a strongly typed object that
     * we can use in conjunction with a typeguard so that we the property value is an
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
        for (var key in parent) {
            if (array === parent[key]) {
                this.propertyKey = key;
            }
        }
        /* tslint:enable:no-any */
        if (!this.propertyKey) {
            throw Error("Failed to find array in parent");
        }
        this.valuesArray = array;
        this.keyGenerator = keyGenerator;
    }
    ArrayCrudActionCreator.prototype.insert = function (index, value) {
        return new actions_1.ArrayMutateAction(actions_1.ActionId.INSERT_PROPERTY, this.parent, this.propertyKey, index, this.valuesArray, value);
    };
    /**
     * Note that we are finding the index of this from a map (not scanning).
     * We throw if this.valuesArray is not found in arrayKeyIndexMap, likewise if the this.keyIndexMap does not
     * contain the key calculated by this.keyGenerator.
     * @param {V} value
     * @returns {number}
     */
    ArrayCrudActionCreator.prototype.getIndexOf = function (value) {
        var keyIndexMap = actions_1.arrayKeyIndexMap.getOrCreateKeyIndexMap(this.valuesArray, this.keyGenerator);
        var key = this.keyGenerator(value);
        var index = keyIndexMap.get(key);
        if (!index) {
            throw new Error("failed to find index in array " + this.propertyKey + " for key " + key);
        }
        return index;
    };
    ArrayCrudActionCreator.prototype.update = function (index, value) {
        return new actions_1.ArrayMutateAction(actions_1.ActionId.UPDATE_PROPERTY, this.parent, this.propertyKey, index, this.valuesArray, value);
    };
    ArrayCrudActionCreator.prototype.delete = function (index) {
        return new actions_1.ArrayMutateAction(actions_1.ActionId.DELETE_PROPERTY, this.parent, this.propertyKey, index, this.valuesArray, undefined);
    };
    return ArrayCrudActionCreator;
}());
exports.ArrayCrudActionCreator = ArrayCrudActionCreator;
//# sourceMappingURL=actionCreators.js.map