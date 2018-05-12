import { StateObject } from '../';
import { Action, ArrayKeyGeneratorFn, DispatchType, MappingAction } from './actions';
import { ContainerComponent } from '../components/ContainerComponent';
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
 * Factory method for CrudActionCreator, rather than exposing implementation details
 * @param {S} parent
 * @returns {CrudActionCreator<S extends StateObject>}
 */
export declare function getCrudCreator<S extends StateObject>(parent: S): CrudActionCreator<S>;
export declare function getArrayCrudCreator<S extends StateObject, K extends keyof S, V extends Object>(parent: S, childArray: Array<V> & S[K], keyGenerator: ArrayKeyGeneratorFn<V>): ArrayCrudActionCreator<S, K, V>;
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
export declare class ArrayCrudActionCreator<S extends StateObject, K extends keyof S, V extends Object> {
    private parent;
    private propertyKey;
    private valuesArray;
    private keyGenerator;
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
    constructor(parent: S, childArray: Array<V> & S[K], keyGenerator: ArrayKeyGeneratorFn<V>);
    /**
     * Note that we are finding the index of this from a map (not scanning).
     * We throw if this.valuesArray is not found in arrayKeyIndexMap, likewise if the this.keyIndexMap does not
     * contain the key calculated by this.keyGenerator.
     * @param {V} value
     * @returns {number}
     */
    protected getIndexOf(value: V): number;
    append(value: V): Action;
    insert(index: number, value: V): Action;
    update(oldValue: V, newValue: V): Action;
    remove(value: V): Action;
}
export interface ArrayMappingCreatorOptions<S extends StateObject, K extends keyof S, E> {
    keyGen: ArrayKeyGeneratorFn<E>;
    array: Array<E> & S[K];
}
export declare function getMappingCreator<S extends StateObject, K extends keyof S, A extends StateObject, E>(_parent: S, _propKey: K, arrayOptions?: ArrayMappingCreatorOptions<S, K, E>): {
    createPropertyMappingAction: <CP, VP, TP extends keyof VP>(_component: ContainerComponent<CP, VP, A>, targetPropKey: TP, ...dispatches: DispatchType[]) => MappingAction<S, K, CP, VP, TP, A, E>;
    createArrayIndexMappingAction: <CP, VP, TP extends keyof VP>(index: number, _component: ContainerComponent<CP, VP, A>, targetPropKey: TP, ...dispatches: DispatchType[]) => MappingAction<S, K, CP, VP, TP, A, E>;
};