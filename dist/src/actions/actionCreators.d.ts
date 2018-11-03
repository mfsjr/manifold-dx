import { StateObject } from '../';
import { ArrayChangeAction, MappingHook, MappingAction, StateAction, StateCrudAction } from './actions';
import { ContainerComponent } from '../components/ContainerComponent';
export declare type NotArray<T> = T;
export declare function isNotArray<T>(value: T): value is NotArray<T>;
/**
 * Create CRUD actions for properties of a StateObject.
 * Array CRUD actions are in {@link ArrayActionCreator}
 */
export declare class ActionCreator<S extends StateObject> {
    private parent;
    constructor(parent: S);
    protected getPropertyKeyForValue<V>(value: V): keyof S;
    protected throwIfArray<K extends keyof S>(propValue: S[K]): void;
    rerender<K extends keyof S>(propertyKey: K): StateCrudAction<S, K>;
    insert<K extends keyof S>(propertyKey: K, value: S[K]): StateCrudAction<S, K>;
    update<K extends keyof S>(propertyKey: K, value: S[K]): StateCrudAction<S, K>;
    /**
     * Delete the property (named 'remove' because 'delete' is a reserved word)
     * @param {K} propertyKey
     * @returns {Action}
     */
    remove<K extends keyof S>(propertyKey: K): StateCrudAction<S, K>;
    insertStateObject<K extends keyof S>(value: S[K] & StateObject, propertyKey: K): StateCrudAction<S, K>;
    removeStateObject<K extends keyof S>(propertyKey: K): StateCrudAction<S, K>;
}
/**
 * Factory method for CrudActionCreator, rather than exposing implementation details
 * @param {S} parent
 * @returns {ActionCreator<S extends StateObject>}
 */
export declare function getActionCreator<S extends StateObject>(parent: S): ActionCreator<S>;
export declare function getArrayActionCreator<S extends StateObject, K extends keyof S, V extends Object>(parent: S, childArray: Array<V> & S[K]): ArrayActionCreator<S, K, V>;
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
export declare class ArrayActionCreator<S extends StateObject, K extends keyof S, V extends Object> {
    private parent;
    private propertyKey;
    private valuesArray;
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
    constructor(parent: S, childArray: Array<V> & S[K]);
    updateArray(newArray: Array<V> & S[K]): StateAction<S, K>;
    rerenderArray(): StateAction<S, K>;
    appendElement(value: V): StateAction<S, K>[];
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
    insertElement(index: number, value: V): StateAction<S, K>[];
    rerenderElement(index: number): StateAction<S, K>;
    updateElement(index: number, newValue: V): ArrayChangeAction<S, K, V>;
    /**
     * Replace the current array's elements with the contents of the newArray.
     *
     * Note that if an element at an index is the same in the new and old array, it will be left unchanged (no
     * actions will be dispatched).
     *
     * @param newArray
     */
    replaceAll(newArray: Array<V>): StateAction<S, K>[];
    removeElement(index: number): StateAction<S, K>[];
}
export declare function getMappingActionCreator<S extends StateObject, K extends keyof S, A extends StateObject, E>(_parent: S, _propKey: K): {
    createPropertyMappingAction: <CP, VP, TP extends keyof VP>(_component: ContainerComponent<CP, VP, A, {}>, targetPropKey: TP, ...mappingHooks: MappingHook[]) => MappingAction<S, K, CP, VP, TP, A, E>;
    createArrayIndexMappingAction: <CP, VP, TP extends keyof VP>(_array: S[K] & E[], index: number | null, _component: ContainerComponent<CP, VP, A, {}>, targetPropKey: TP, ...mappingHooks: MappingHook[]) => MappingAction<S, K, CP, VP, TP, A, E>;
};
