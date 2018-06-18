import { AnyContainerComponent, ContainerComponent } from '../components/ContainerComponent';
import { StateObject } from '../types/Store';
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
    RERENDER = 0,
    INSERT_STATE_OBJECT = 1,
    DELETE_STATE_OBJECT = 2,
    INSERT_PROPERTY = 3,
    UPDATE_PROPERTY = 4,
    DELETE_PROPERTY = 5,
    MAP_STATE_TO_PROP = 6,
}
/**
 * Mapping hooks are functions that can optionally be attached to mappings (see {@link MappingAction}.
 *
 * They are executed after the mapping has updated the component with the new state values, but immediately
 * before the component renders.  So this is a place where the component's view props could be modified.
 *
 * See {@link ContainerComponent#handleChange} and {@link ContainerComponent#invokeMappingHooks}
 *
 * Note that these differ from postHooks in that those are attached to specific actions, and postHooks
 * execute immediately before mappingHooks.
 */
export declare type MappingHook = (action: StateCrudAction<any, any>) => void;
export declare abstract class Action {
    /**
     * Optional action to be performed after the execution of the action,
     * see {@link ActionProcessor}
     */
    postHook?: () => void;
    type: ActionId;
    changed: boolean;
    pristine: boolean;
    /**
     * Performs the change on the action, called by the {@link Manager}, and should only be called by it, with
     * the possible exception of testing.
     *
     * @param {Action} action
     * @param {boolean} perform - optional, will default to true, false means undo
     */
    static perform(action: Action, perform?: boolean): void;
    /**
     * Undo the change on the action.  This is only called by the {@link Manager} and should never be called directly.
     * @param {Action} action
     */
    static undo(action: Action): void;
    protected abstract change(perform: boolean): void;
    abstract clone(): Action;
    abstract dispatch(): void;
    constructor(actionType: ActionId);
    protected performChange(perform?: boolean): void;
    protected assignProps(from: Action): void;
    /**
     * Invert this action's type, or throw an error if its not invertible.
     * @returns {ActionId}
     */
    getUndoActionId(): ActionId;
    protected undoChange(): void;
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
    dispatch(): void;
    containersToRender(containersBeingRendered: AnyContainerComponent[]): void;
    protected concatContainersFromMappingActions(containersBeingRendered: AnyContainerComponent[], mappingActions?: AnyMappingAction[]): void;
}
export declare type GenericStateCrudAction = StateCrudAction<any, any>;
/**
 * Action classes contain instructions for changing state, in the form
 * of StateObjects.
 */
export declare class StateCrudAction<S extends StateObject, K extends keyof S> extends StateAction<S, K> {
    changeResult?: {
        oldValue?: S[K];
    };
    oldValue?: S[K];
    value: S[K] | undefined;
    getOldValue(): S[K] | undefined;
    protected assignProps(from: StateCrudAction<S, K>): void;
    clone(): StateCrudAction<S, K>;
    constructor(actionType: ActionId, _parent: S, _propertyName: K, _value?: S[K]);
    protected change(perform?: boolean): void;
}
/**
 * For mutating the elements in the array.
 */
export declare class ArrayChangeAction<S extends StateObject, K extends keyof S, V> extends StateAction<S, K> {
    changeResult?: {
        oldValue?: V;
    };
    oldValue?: V | undefined;
    value: V | undefined;
    valuesArray: Array<V> & S[K];
    index: number;
    protected assignProps(from: ArrayChangeAction<S, K, V>): void;
    clone(): ArrayChangeAction<S, K, V>;
    constructor(actionType: ActionId, _parent: S, _propertyName: K, _index: number, valuesArray: Array<V> & S[K], _value?: V);
    containersToRender(containersBeingRendered: AnyContainerComponent[]): void;
    protected change(perform?: boolean): void;
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
    mappingHooks: MappingHook[];
    index: number | null;
    propArray?: Array<E>;
    protected assignProps(from: MappingAction<S, K, CP, VP, TP, A, E>): void;
    clone(): MappingAction<S, K, CP, VP, TP, A, E>;
    /**
     * Clone the action and modify the clone so that it 'undoes' this, i.e., unmaps this mapping.
     * @returns {MappingAction
     * <S extends StateObject, K extends keyof S, CP, VP, TP extends keyof VP, A extends StateObject, E>}
     */
    getUndoAction(): MappingAction<S, K, CP, VP, TP, A, E>;
    /**
     * Create a new mapping action from a state property to a view property
     *
     * @param {S} parent
     * @param {K} _propertyOrArrayName
     * @param {ContainerComponent<CP, VP, any>} _component
     * @param {TP} targetPropName
     * @param {MappingHook} mappingHooks - these are generally instance functions in the component that update other
     *          component view properties as a function of the target view property having changed.
     */
    constructor(parent: S, _propertyOrArrayName: K, _component: ContainerComponent<CP, VP, A>, targetPropName: TP, ...mappingHooks: MappingHook[]);
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
    setArrayElement(_index: number | null, _propArray: S[K] & Array<E>): MappingAction<S, K, CP, VP, TP, A, E>;
    getIndex(): number | null;
    /**
     * Map this property/component pair to the applications ContainerState, or if false, unmap it.
     * @param {boolean} perform
     */
    protected change(perform?: boolean): void;
    performChange(): void;
    undoChange(): void;
    redo(): void;
}
export declare type AnyMappingAction = MappingAction<any, any, any, any, any, any, any>;
