/// <reference types="react" />
import { AnyContainerComponent, ContainerComponent } from '../components/ContainerComponent';
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
    /**
     * NULL is the only action that doesn't mutate anything, but the action will be processed just like any
     * other action, the net effect being that containers that depend on properties of actions with type = NULL
     * will have their viewProps reloaded.  Used for special cases where a single action can change multiple
     * pieces of state, eg an array insertion or deletion.
     */
    RERENDER = 0,
    INSERT_STATE_OBJECT = 1,
    DELETE_STATE_OBJECT = 2,
    INSERT_PROPERTY = 3,
    UPDATE_PROPERTY = 4,
    DELETE_PROPERTY = 5,
    MAP_STATE_TO_PROP = 6,
}
export declare type DispatchType = (action: StateCrudAction<any, any>) => void;
export declare abstract class Action {
    /**
     * Optional action to be performed after the execution of the action,
     * see {@link ActionProcessor}
     */
    postHook?: () => void;
    type: ActionId;
    mutated: boolean;
    pristine: boolean;
    /**
     * Performs the mutation on the action, called by the {@link Manager}, and should only be called by it, with
     * the possible exception of testing.
     *
     * @param {Action} action
     * @param {boolean} perform - optional, will default to true, false means undo
     */
    static perform(action: Action, perform?: boolean): void;
    /**
     * Undo the mutation on the action.  This is only called by the {@link Manager} and should never be called directly.
     * @param {Action} action
     */
    static undo(action: Action): void;
    protected abstract mutate(perform: boolean): void;
    abstract clone(): Action;
    abstract process(): void;
    constructor(actionType: ActionId);
    protected performMutation(perform?: boolean): void;
    protected assignProps(from: Action): void;
    getUndoAction(): ActionId;
    protected undoMutation(): void;
    containersToRender(containersBeingRendered: AnyContainerComponent[]): void;
}
export declare abstract class StateAction<S extends StateObject, K extends keyof S> extends Action {
    parent: S;
    propertyName: K;
    mappingActions: AnyMappingAction[];
    protected assignProps(from: StateAction<S, K>): void;
    constructor(actionType: ActionId, _parent: S, _propertyName: K);
    /**
     * Process the action.  A convenience method that calls Manager.get().actionPerform, which is the correct
     * way to process an action or an array of actions.
     */
    process(): void;
    containersToRender(containersBeingRendered: AnyContainerComponent[]): void;
    protected concatContainersFromMappingActions(containersBeingRendered: AnyContainerComponent[], mappingActions?: AnyMappingAction[]): void;
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
 * Functions like this are necessary to create mappings between React keys array indexes
 *
 * Its probably a good idea to co-locate these methods in StateObjects next to the arrays they apply to,
 * in order to make sure there's one and only one definition.
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
 * Standalone data structure: for each array in state, maps React list keys to array indexes.
 *
 * - singleton created at startup
 * - entries <Array, KeyIndexMap> are created lazily
 * - updated upon ArrayMutateAction update
 * - deleted upon StateCrudAction array delete
 *
 * Note that duplicated keys result in an Error being thrown.
 */
export declare class ArrayMutateAction<S extends StateObject, K extends keyof S, V> extends StateAction<S, K> {
    mutateResult?: {
        oldValue?: V;
    };
    oldValue?: V | undefined;
    value: V | undefined;
    valuesArray: Array<V> & S[K];
    index: number;
    keyGen: ArrayKeyGeneratorFn<V>;
    protected assignProps(from: ArrayMutateAction<S, K, V>): void;
    clone(): ArrayMutateAction<S, K, V>;
    constructor(actionType: ActionId, _parent: S, _propertyName: K, _index: number, valuesArray: Array<V> & S[K], _keyGen: ArrayKeyGeneratorFn<V>, _value?: V);
    containersToRender(containersBeingRendered: AnyContainerComponent[]): void;
    protected mutate(perform?: boolean): void;
}
/**
 * Define a mapping between a state property and a component property, and optionally
 * provide a function or functions that are executed after the mapping is performed
 * but before anything is rendered (e.g., to transform other property data).
 *
 * The functionality provided here is analogous to, but works very differently from,
 * Redux's mapStateToProps/Dispatch.
 *
 * S: type of the parent state
 *
 * Prop types used in defining the ContainerComponent<CP,VP>
 * CP: container prop type
 * VP: view prop type
 * TP: a particular key of VP
 * A: application state
 * E: array element type, if the property type is an array
 */
export declare class MappingAction<S extends StateObject, K extends keyof S, CP, VP, TP extends keyof VP, A extends StateObject, E> extends StateAction<S, K> {
    component: ContainerComponent<CP, VP, A>;
    fullPath: string;
    targetPropName: TP;
    dispatches: DispatchType[];
    index: number;
    keyGen?: ArrayKeyGeneratorFn<E>;
    propArray?: Array<E>;
    protected assignProps(from: MappingAction<S, K, CP, VP, TP, A, E>): void;
    clone(): MappingAction<S, K, CP, VP, TP, A, E>;
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
    constructor(parent: S, _propertyOrArrayName: K, _component: ContainerComponent<CP, VP, A>, targetPropName: TP, ...dispatches: DispatchType[]);
    getValue(): S[K];
    getTargetPropName(): keyof VP;
    /**
     * Map this component to an array element object, e.g., a row of data.
     *
     * Note that this method will throw if the index is invalid or refers to an undefined value in the array.
     *
     * @param {number} _index
     * @param {S[K] & Array<E>} _propArray
     * @param {ArrayKeyGeneratorFn<E>} _keyGen
     */
    setArrayElement(_index: number, _propArray: S[K] & Array<E>, _keyGen: ArrayKeyGeneratorFn<E>): MappingAction<S, K, CP, VP, TP, A, E>;
    getIndex(): number;
    /**
     * Map this property/component pair to the applications ContainerState, or if false, unmap it.
     * @param {boolean} perform
     */
    protected mutate(perform?: boolean): void;
    performMutation(): void;
    undoMutation(): void;
    redo(): void;
}
export declare type AnyMappingAction = MappingAction<any, any, any, any, any, any, any>;
