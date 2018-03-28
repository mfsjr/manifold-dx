import { StateObject } from '../';
import { Action, ArrayKeyGeneratorFn } from './actions';
/**
 * Create CRUD actions for properties of a StateObject.
 * Array CRUD actions are in {@link ArrayCrudActionCreator}
 */
export declare class CrudActionCreator<S extends StateObject> {
    private parent;
    constructor(parent: S);
    protected getPropertyKeyForValue<V>(value: V): keyof S;
    insert<K extends keyof S>(propertyKey: K, value: S[K]): Action;
    update<K extends keyof S>(propertyKey: K, value: S[K]): Action;
    /**
     * Delete the property (named 'remove' because 'delete' is a reserved word)
     * @param {K} propertyKey
     * @returns {Action}
     */
    remove<K extends keyof S>(propertyKey: K): Action;
    insertStateObject<K extends keyof S>(value: S[K], propertyKey: K): Action;
    removeStateObject<K extends keyof S>(propertyKey: K): Action;
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
export declare class ArrayCrudActionCreator<S extends StateObject, K extends keyof S, V extends Object> {
    private parent;
    private propertyKey;
    private valuesArray;
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
    constructor(parent: S, childArray: Array<V> & S[K], keyGenerator: ArrayKeyGeneratorFn<V>);
    insert(index: number, value: V): Action;
    update(index: number, value: V): Action;
    remove(index: number): Action;
}
