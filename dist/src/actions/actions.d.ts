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
    containersToRender(_containers: ContainerComponent<any, any, any>[]): void;
}
export declare abstract class StateAction<S extends StateObject, K extends keyof S> extends Action {
    parent: S;
    propertyName: K;
    protected assignProps(from: StateAction<S, K>): void;
    constructor(actionType: ActionId, _parent: S, _propertyName: K);
}
/**
 * Action classes contain instructions for mutating state, in the form
 * of IStateObjects.
 */
export declare class StateCrudAction<S extends StateObject, K extends keyof S> extends StateAction<S, K> {
    mutateResult?: {
        oldValue?: S[K];
    };
    oldValue?: S[K];
    value: S[K];
    mappingActions: MappingAction<any, any, any, any, any>[];
    getOldValue(): S[K];
    protected assignProps(from: StateCrudAction<S, K>): void;
    clone(): StateCrudAction<S, K>;
    constructor(actionType: ActionId, _parent: S, _propertyName: K, _value: S[K]);
    protected mutate(perform?: boolean): void;
    containersToRender(containersBeingRendered: ContainerComponent<any, any, any>[]): void;
}
/**
 * @deprecated replace the array itself when an element changes.
 */
export declare class ArrayMutateAction<S extends StateObject, K extends keyof S, V extends keyof S[K]> extends StateAction<S, K> {
    mutateResult?: {
        oldValue?: S[K][V];
    };
    oldValue?: S[K][V];
    value: S[K][V];
    valuesArray?: S[K];
    index: number;
    protected assignProps(from: ArrayMutateAction<S, K, V>): void;
    clone(): ArrayMutateAction<S, K, V>;
    constructor(actionType: ActionId, _parent: S, _propertyName: K, _values: S[K], _index: number, _value: S[K][V]);
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
 * S: type of the parent
 * K: key of the propertyOrArrayName
 *
 * Prop types used in defining the ContainerComponent<CP,VP>
 * CP: container prop type
 * VP: view prop type
 *
 * TP: keys of VP, the view prop type
 */
export declare class MappingAction<S extends StateObject, K extends keyof S, CP, VP, TP extends keyof VP> extends StateAction<S, K> {
    component: ContainerComponent<CP, VP, any>;
    fullPath: string;
    targetPropName: TP;
    dispatches: DispatchType[];
    protected assignProps(from: MappingAction<S, K, CP, VP, TP>): void;
    clone(): MappingAction<S, K, CP, VP, TP>;
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
    constructor(parent: S, _propertyOrArrayName: K, _component: ContainerComponent<CP, VP, any>, targetPropName: TP, ...dispatches: DispatchType[]);
    getValue(): S[K];
    getTargetPropName(): TP;
    /**
     * Map this property/component pair to the applications ContainerState, or if false, unmap it.
     * @param {boolean} perform
     */
    protected mutate(perform?: boolean): void;
    perform(): void;
    undo(): void;
    redo(): void;
}
