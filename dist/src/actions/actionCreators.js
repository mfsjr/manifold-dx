"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var actions_1 = require("./actions");
var CrudActionCreator = /** @class */ (function () {
    function CrudActionCreator(parent, propertyKey) {
        this.parent = parent;
        this.propertyKey = propertyKey;
    }
    CrudActionCreator.prototype.crudInsert = function (value) {
        return new actions_1.StateCrudAction(actions_1.ActionId.UPDATE_PROPERTY, this.parent, this.propertyKey, value);
    };
    CrudActionCreator.prototype.crudUpdate = function (value) {
        return new actions_1.StateCrudAction(actions_1.ActionId.UPDATE_PROPERTY, this.parent, this.propertyKey, value);
    };
    CrudActionCreator.prototype.crudDelete = function () {
        return new actions_1.StateCrudAction(actions_1.ActionId.DELETE_PROPERTY, this.parent, this.propertyKey, this.parent[this.propertyKey]);
    };
    CrudActionCreator.prototype.crudNest = function (value) {
        return new actions_1.StateCrudAction(actions_1.ActionId.INSERT_STATE_OBJECT, this.parent, this.propertyKey, value);
    };
    CrudActionCreator.prototype.crudUnnest = function (value) {
        return new actions_1.StateCrudAction(actions_1.ActionId.DELETE_STATE_OBJECT, this.parent, this.propertyKey, value);
    };
    return CrudActionCreator;
}());
exports.CrudActionCreator = CrudActionCreator;
var ArrayCrudActionCreator = /** @class */ (function () {
    /**
     * Construct an array crud creator.  We require a somewhat redundant 'valuesArray'
     * parameter in order to provide TypeScript with a strongly typed object that
     * we can use in conjunction with a typeguard so that we the property value is an
     * appropriately typed array.
     *
     * There may be some TS experts out there who know how to do this, but this appears
     * to be outside of the capabilities of 2.7 judging by the docs.
     *
     * Recent PR's targeted for 2.8 may change this, see https://github.com/Microsoft/TypeScript/pull/21496
     *
     * @param {S} parent
     * @param {keyof S} propertyKey
     * @param {Array<V>} valuesArray
     */
    function ArrayCrudActionCreator(parent, propertyKey, valuesArray) {
        this.parent = parent;
        this.propertyKey = propertyKey;
        // this.valuesArray = valuesArray;
        /* tslint:disable:no-any */
        var p = this.parent[this.propertyKey];
        var ra = valuesArray;
        /* tslint:enable:no-any */
        if (p === ra) {
            this.valuesArray = ra;
        }
        else {
            throw new Error("Array must be " + this.propertyKey + " of the parent");
        }
    }
    ArrayCrudActionCreator.prototype.insert = function (index, value) {
        return new actions_1.ArrayMutateAction(actions_1.ActionId.INSERT_PROPERTY, this.parent, this.propertyKey, index, this.valuesArray, value);
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