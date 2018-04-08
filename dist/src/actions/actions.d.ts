/// <reference types="react" />
import { ContainerComponent } from '../components/ContainerComponent';
import { StateObject } from '../types/State';
/**
 * ActionId's for calling api's that change state.
 *
 * Separate CRUD operations for state objects ({@link StateObject}) vs regular data
 * properties, since  state objects have special requirements that have to be checked.
 *
 * Also note that state objects themselves are not updated, ie swapped out for
 * one another since they need to have refs to parents set/unset.
 */
export declare enum ActionId {
    NULL = 0,
    INSERT_STATE_OBJECT = 1,
    DELETE_STATE_OBJECT = 2,
    INSERT_PROPERTY = 3,
    UPDATE_PROPERTY = 4,
    DELETE_PROPERTY = 5,
    MAP_STATE_TO_PROP = 6,
}
export declare type DispatchType = (action: StateCrudAction<any, any>) => void;
export declare abstract class Action {
    type: ActionId;
    mutated: boolean;
    pristine: boolean;
    protected abstract mutate(perform: boolean): void;
    abstract clone(): Action;
    constructor(actionType: ActionId);
    perform(): void;
    protected assignProps(from: Action): void;
    getUndoAction(): ActionId;
    undo(): void;
    containersToRender(containersBeingRendered: ContainerComponent<any, any, any>[]): void;
}
export declare abstract class StateAction<S extends StateObject, K extends keyof S> extends Action {
    parent: S;
    propertyName: K;
    mappingActions: GenericMappingAction[];
    protected assignProps(from: StateAction<S, K>): void;
    constructor(actionType: ActionId, _parent: S, _propertyName: K);
    containersToRender(containersBeingRendered: ContainerComponent<any, any, any>[]): void;
}
export declare type GenericStateCrudAction = StateCrudAction<any, any>;
/**
 * Action classes contain instructions for mutating state, in the form
 * of StateObjects.
 */
export declare class StateCrudAction<S extends StateObject, K extends keyof S> extends StateAction<S, K> {
    mutateResult?: {
        oldValue?: S[K];
    };
    oldValue?: S[K];
    value: S[K] | undefined;
    getOldValue(): S[K] | undefined;
    protected assignProps(from: StateCrudAction<S, K>): void;
    clone(): StateCrudAction<S, K>;
    constructor(actionType: ActionId, _parent: S, _propertyName: K, _value?: S[K]);
    protected mutate(perform?: boolean): void;
}
/**
 * Functions like this are necessary to create mappings between React keys and StateObject array indexes, as
 * in ArrayKeyIndexMap below.
 *
 * These functions should be created in StateObject's _accessors, so that both
 * 1. invocations of ArrayKeyIndexMap's getKeyIndexMap, and...
 * 2. ArrayMutateAction's constructor's 'index' argument
 * ... can use this function (since they have to be the same).
 *
 */
export declare type ArrayKeyGeneratorFn<V> = (arrayElement: V, index?: number, array?: Array<V>) => React.Key;
/**
 * The name of this function is intended to convey the fact that it uses a property of the array
 * object type to use as the key.
 *
 * Seems like this is the usual / expected case, so export this function to be used for that.
 * Note that the signature is not the same as KeyGeneratorFnType, so to use it you will need to
 * generate the actual KeyGeneratorFnType like so:
 *
 * `let idGenerator = bookKeyGenerator<Book>(book: Book) {
 *    return propertyKeyGenerator<Book>(books, index, { propertyKey: 'id' } );
 *  }
 * `
 *
 * @param {Array<V>} array
 * @param {number} index
 * @param {{propertyKey: keyof V}} options
 * @returns {React.Key}
 */
export declare function propertyKeyGenerator<V>(arrayElement: V, propertyKey: keyof V): React.Key;
/**
 * React requires 'key' data elements for list rendering, and we need to keep track of
 * what indexes are associated with keys, for the purposes of modifying array state, since
 * the mutate array api's require array indexes.
 *
 * This class holds mappings for all the arrays in the app state, and for each will return
 * a map of type Map<React.Key, number>, which relates React's unique keys to the index
 * which holds the array element.
 *
 * V the generic type of the values held in the array
 */
export declare class ArrayKeyIndexMap<V> {
    protected arrayMapper: Map<any[], Map<string | number, number>>;
    protected keyGenMapper: Map<any[], ArrayKeyGeneratorFn<any>>;
    getOrCreateKeyIndexMap(array: Array<V>, keyGenerator: ArrayKeyGeneratorFn<V>): Map<React.Key, number>;
    getKeyGeneratorFn(array: Array<V>): ArrayKeyGeneratorFn<V>;
    size(): number;
    get(array: Array<V>): Map<React.Key, number>;
    hasKeyIndexMap(array: Array<V>): boolean;
    /**
     * Creates the key index map, then inserts into it and the keyGenMapper
     * @param {Array<V>} array
     * @param {ArrayKeyGeneratorFn<V>} keyGenerator
     * @returns {Map<React.Key, number>} the key/index map
     */
    protected populateMaps(array: Array<V>, keyGenerator: ArrayKeyGeneratorFn<V>): Map<React.Key, number>;
    deleteFromMaps(array: Array<V>): boolean;
}
/**
 * Standalone data structure: for each array in state, maps React list keys to array indexes.
 *
 * - singleton created at startup
 * - entries <Array, KeyIndexMap> are created lazily
 * - updated upon ArrayMutateAction update
 * - deleted upon StateCrudAction array delete
 *
 * Note that duplicated keys result in an Error being thrown.
 */
export declare const arrayKeyIndexMap: ArrayKeyIndexMap<{}>;
/**
 *
 */
export declare class ArrayMutateAction<S extends StateObject, K extends keyof S, V> extends StateAction<S, K> {
    mutateResult?: {
        oldValue?: V;
    };
    oldValue?: V | undefined;
    value: V | undefined;
    valuesArray: Array<V> & S[K];
    index: number;
    protected assignProps(from: ArrayMutateAction<S, K, V>): void;
    clone(): ArrayMutateAction<S, K, V>;
    constructor(actionType: ActionId, _parent: S, _propertyName: K, _index: number, valuesArray: Array<V> & S[K], _value?: V);
    protected mutate(perform?: boolean): void;
}
/**
 * Define a mapping between a state property and a component property, and optionally
 * provide a function or functions that are executed after the mapping is performed
 * but before anything is rendered (e.g., to transform other property data).
 *
 * The functionality provided here is analogous to, but not the same as,
 * Redux's mapStateToProps/Dispatch.
 *
 * S: type of the parent state
 *
 * Prop types used in defining the ContainerComponent<CP,VP>
 * CP: container prop type
 * VP: view prop type
 */
export declare class MappingAction<S extends StateObject, K extends keyof S, CP, VP, A extends StateObject> extends StateAction<S, K> {
    component: ContainerComponent<CP, VP, A>;
    fullPath: string;
    targetPropName: keyof VP;
    dispatches: DispatchType[];
    protected assignProps(from: MappingAction<S, K, CP, VP, A>): void;
    clone(): MappingAction<S, K, CP, VP, A>;
    /**
     * Create a new mapping action from a state property to a view property
     *
     * @param {S} parent
     * @param {K} _propertyOrArrayName
     * @param {ContainerComponent<CP, VP, any>} _component
     * @param {TP} targetPropName
     * @param {DispatchType} dispatches - these are generally instance functions in the component that update other
     *          component view properties as a function of the target view property having changed.
     */
    constructor(parent: S, _propertyOrArrayName: K, _component: ContainerComponent<CP, VP, A>, targetPropName: keyof VP, ...dispatches: DispatchType[]);
    getValue(): S[keyof S];
    getTargetPropName(): keyof VP;
    /**
     * Map this property/component pair to the applications ContainerState, or if false, unmap it.
     * @param {boolean} perform
     */
    protected mutate(perform?: boolean): void;
    perform(): void;
    undo(): void;
    redo(): void;
}
export declare type GenericMappingAction = MappingAction<any, any, any, any, any>;
