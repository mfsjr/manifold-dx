import { StateObject } from '../';
import { Action, ArrayKeyGeneratorFn } from './actions';
export declare class CrudActionCreator<S extends StateObject> {
    private parent;
    private propertyKey;
    constructor(parent: S);
    protected getPropertyKeyForValue<V>(value: V): keyof S;
    crudInsert(value: S[keyof S], propertyKey: keyof S): Action;
    crudUpdate(value: S[keyof S]): Action;
    crudDelete(value: S[keyof S]): Action;
    crudNest(value: S[keyof S], propertyKey: keyof S): Action;
    crudUnnest(value: S[keyof S]): Action;
}
/**
 * Class for creating CRUD actions for arrays of objects (not primitives).
 *
 * Arrays of primitives can be handled with CRUD operations that treat arrays as simple properties,
 * using {@link CrudActionCreator}s above.  Note that the creation and deletion of arrays of
 * objects would need to use the same.
 *
 * S is the StateObject which the array is a property of
 */
export declare class ArrayCrudActionCreator<S extends StateObject, V extends Object> {
    private parent;
    private propertyKey;
    private valuesArray;
    private keyGenerator;
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
    constructor(parent: S, childArray: Array<V>, keyGenerator: ArrayKeyGeneratorFn<V>);
    insert(index: number, value: V): Action;
    /**
     * Note that we are finding the index of this from a map (not scanning).
     * We throw if this.valuesArray is not found in arrayKeyIndexMap, likewise if the this.keyIndexMap does not
     * contain the key calculated by this.keyGenerator.
     * @param {V} value
     * @returns {number}
     */
    protected getIndexOf(value: V): number;
    update(index: number, value: V): Action;
    delete(index: number): Action;
}
