import { StateObject } from '../';
import { ArrayChangeAction, ContainerPostReducer, MappingAction, StateAction, StateCrudAction } from './actions';
import { ContainerComponent } from '../components/ContainerComponent';
/**
 * Create CRUD actions for properties of a StateObject.
 * Array CRUD actions are in {@link ArrayActionCreator}
 */
export declare class ActionCreator<S extends StateObject> {
    private parent;
    constructor(parent: S);
    protected getPropertyKeyForValue<V>(value: V): keyof S;
    protected throwIfArray<K extends Extract<keyof S, string>>(propValue: S[K]): void;
    rerender<K extends Extract<keyof S, string>>(propertyKey: K): StateCrudAction<S, K>;
    /**
     * Insert the value.  If the current value exists, an error will be thrown.
     * @param propertyKey
     * @param value
     */
    insert<K extends Extract<keyof S, string>>(propertyKey: K, value: S[K]): StateCrudAction<S, K>;
    /**
     * Insert the value if the current property is empty, else provide a no-op action type so that
     * dispatch will ignore it.
     * {@see insert}, {@see update}
     * @param propertyKey
     * @param value
     */
    insertIfEmpty<K extends Extract<keyof S, string>>(propertyKey: K, value: S[K]): StateCrudAction<S, K>;
    /**
     * Update the existing value.  If the value being passed in is the same as the current value, an
     * error will be thrown.  If there is no existing value, an error will be thrown.
     * @param propertyKey
     * @param value
     */
    update<K extends Extract<keyof S, string>>(propertyKey: K, value: S[K]): StateCrudAction<S, K>;
    /**
     * Tests to see if the update is using the same object as the current value; if it is, the resulting action
     * is a no-op (does nothing), else a regular update is created.
     *
     * @param propertyKey
     * @param value
     */
    updateIfChanged<K extends Extract<keyof S, string>>(propertyKey: K, value: S[K]): StateCrudAction<S, K>;
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
    set<K extends Extract<keyof S, string>>(propertyKey: K, value?: S[K]): StateCrudAction<S, K>;
    /**
     * Delete the property (named 'remove' because 'delete' is a reserved word).
     *
     * If it is not empty, throw
     * @param {K} propertyKey
     * @returns {Action}
     */
    remove<K extends Extract<keyof S, string>>(propertyKey: K): StateCrudAction<S, K>;
    /**
     * If the value of the property is not undefined or null, remove it, else return a no-op action.
     * @param propertyKey
     */
    removeIfHasData<K extends Extract<keyof S, string>>(propertyKey: K): StateCrudAction<S, K>;
    insertStateObject<K extends Extract<keyof S, string>>(value: S[K] & StateObject, propertyKey: K): StateCrudAction<S, K>;
    removeStateObject<K extends Extract<keyof S, string>>(propertyKey: K): StateCrudAction<S, K>;
}
/**
 * Factory method for CrudActionCreator, rather than exposing implementation details
 * @param {S} parent.
 *
 * @returns {ActionCreator<S extends StateObject>}
 * @throws if the parent state object passed in is falsy.
 */
export declare function getActionCreator<S extends StateObject>(parent?: S): ActionCreator<S>;
/**
 * Map an array from application state, to be mapped to a target.
 * @param parent
 * @param childArray
 * @throws if the parent state object passed in is falsy.
 */
export declare function getArrayActionCreator<S extends StateObject, K extends Extract<keyof S, string>, V extends Object>(parent?: S, childArray?: Array<V> & S[K]): ArrayActionCreator<S, K, V>;
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
export declare class ArrayActionCreator<S extends StateObject, K extends Extract<keyof S, string>, V extends Object> {
    private parent;
    private propertyKey;
    private valuesArray;
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
    updateElement(index: number, newValue: V): ArrayChangeAction<S, K, V>;
    updateElementIfChanged(index: number, newValue: V): ArrayChangeAction<S, K, V>;
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
/**
 * Extract keys (which are strings) whose value's types match the type of S[K].
 * See "Conditional types are particularly useful when combined with mapped types:"
 * in https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
 */
export declare type ExtractMatching<S, K extends Extract<keyof S, string>, VP> = {
    [TP in Extract<keyof VP, string>]: VP[TP] extends S[K] ? TP : never;
}[Extract<keyof VP, string>];
/**
 * Extract keys (which are strings) whose value match E, the specific unknown type of an array.
 */
export declare type ExtractMatchingArrayType<E, VP> = {
    [TP in Extract<keyof VP, string>]: VP[TP] extends E ? TP : never;
}[Extract<keyof VP, string>];
export declare type ExtractArrayKeys<E, VP> = {
    [TP in Extract<keyof VP, string>]: VP[TP] extends Array<E> ? TP : never;
}[Extract<keyof VP, string>];
/**
 * This seems like it should work for declaring TP in MappingAction class, but doesn't
 */
export declare type ExtractMatchingConditional<S, K extends Extract<keyof S, string>, VP, E extends unknown> = E extends void ? ExtractMatching<S, K, VP> : ExtractMatchingArrayType<E, VP>;
/**
 * Create a mapping from app state to this component.
 * @param _parent
 * @param _propKey
 * @throws if the parent state object passed in is falsy.
 */
export declare function getMappingActionCreator<S extends StateObject, K extends Extract<keyof S, string>, A extends StateObject, E extends void>(_parent: S | undefined, _propKey: K): {
    createPropertyMappingAction: <CP, VP, TP_1 extends { [TP in Extract<keyof VP, string>]: VP[TP] extends S[K] ? TP : never; }[Extract<keyof VP, string>]>(_component: ContainerComponent<CP, VP, A, {}>, targetPropKey: TP_1, ...postReducerCallbacks: ContainerPostReducer[]) => MappingAction<S, K, CP, VP, TP_1, A, E>;
};
/**
 * Create a mapping from an app state array to this component.
 * @param _parent
 * @param _propKey
 * @throws if the parent state object is falsy
 */
export declare function getArrayMappingActionCreator<S extends StateObject, K extends ExtractArrayKeys<unknown, S>, A extends StateObject>(_parent: S | undefined, _propKey: K): {
    createArrayIndexMappingAction: <CP, VP, E extends unknown, TP_1 extends { [TP in Extract<keyof VP, string>]: VP[TP] extends E ? TP : never; }[Extract<keyof VP, string>]>(_array: S[K] & E[], index: number | null, _component: ContainerComponent<CP, VP, A, {}>, targetPropKey: TP_1, ...postReducerCallbacks: ContainerPostReducer[]) => MappingAction<S, K, CP, VP, TP_1, A, E>;
};
