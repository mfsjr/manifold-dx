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
export declare type DispatchType = (action: StateCrudAction<any>) => void;
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
export declare abstract class StateAction<S extends StateObject> extends Action {
    parent: S;
    propertyName: keyof S;
    mappingActions: MappingAction<any, any, any, any>[];
    protected assignProps(from: StateAction<S>): void;
    constructor(actionType: ActionId, _parent: S, _propertyName: keyof S);
    containersToRender(containersBeingRendered: ContainerComponent<any, any, any>[]): void;
}
/**
 * Action classes contain instructions for mutating state, in the form
 * of StateObjects.
 */
export declare class StateCrudAction<S extends StateObject> extends StateAction<S> {
    mutateResult?: {
        oldValue?: S[keyof S];
    };
    oldValue?: S[keyof S];
    value: S[keyof S];
    getOldValue(): S[keyof S] | undefined;
    protected assignProps(from: StateCrudAction<S>): void;
    clone(): StateCrudAction<S>;
    constructor(actionType: ActionId, _parent: S, _propertyName: keyof S, _value: S[keyof S]);
    protected mutate(perform?: boolean): void;
}
/**
 *
 */
export declare class ArrayMutateAction<S extends StateObject, V> extends StateAction<S> {
    mutateResult?: {
        oldValue?: V;
    };
    oldValue?: V | undefined;
    value: V;
    valuesArray: Array<V>;
    index: number;
    protected assignProps(from: ArrayMutateAction<S, V>): void;
    clone(): ArrayMutateAction<S, V>;
    constructor(actionType: ActionId, _parent: S, _propertyName: keyof S, _index: number, valuesArray: Array<V>, _value: V);
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
export declare class MappingAction<S extends StateObject, CP, VP, A extends StateObject> extends StateAction<S> {
    component: ContainerComponent<CP, VP, A>;
    fullPath: string;
    targetPropName: keyof VP;
    dispatches: DispatchType[];
    protected assignProps(from: MappingAction<S, CP, VP, A>): void;
    clone(): MappingAction<S, CP, VP, A>;
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
    constructor(parent: S, _propertyOrArrayName: keyof S, _component: ContainerComponent<CP, VP, A>, targetPropName: keyof VP, ...dispatches: DispatchType[]);
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
