import * as React from 'react';
import { FunctionComponent, ReactNode } from 'react';
import { Action, AnyMappingAction, MappingAction, MappingHook } from '../actions/actions';
import { StateObject } from '../types/Store';
import { ExtractArrayKeys, ExtractMatching, ExtractMatchingArrayType } from '../actions/actionCreators';
/**
 * A signature for creating React components.
 *
 * Note that this function can be of many forms, including various forms of React's {@link createFactory}.
 */
export declare type ComponentGenerator<P> = (props: P) => React.Component<P, any>;
/**
 *
 * A kind of React.Component container/controller (constructor takes a component
 * and uses it to compose/present).
 *
 * It wraps a react component, which performs the actual rendering
 * and the view usually contains all the markup and styling.  There is
 * typically no markup or styling in this container.
 *
 * CP: container props, a plain object (pojo)
 * VP: view component props, also a plain object
 * A: application state (root/top of the StateObject graph) {@link StateObject}
 * RS: React State
 */
export declare abstract class ContainerComponent<CP, VP, A extends StateObject, RS = {}> extends React.Component<CP, RS> {
    viewProps: VP;
    protected viewPropsUpdated: boolean | null;
    protected appState: A;
    protected viewGenerator: ComponentGenerator<VP> | undefined;
    /**
     * stateless functional component, this is a function that returns a view typically
     */
    protected functionCompView: FunctionComponent<VP> | undefined;
    /**
     * An instance of a React.Component class created by the {@link ComponentGenerator} passed into the constructor.
     */
    protected viewComponent: React.Component<VP, any>;
    protected mappingActions: AnyMappingAction[];
    /**
     * Convenience method
     * @param {Array<T>} oldArray
     * @param {number} index
     * @param {T} newElement
     * @returns {Array<T>}
     */
    static newArray<T>(oldArray: Array<T>, index: number, newElement: T): Array<T>;
    getMappingActions(): AnyMappingAction[];
<<<<<<< HEAD
    /**
     * Create a mapping action for this container.
     *
     * To get good code completion in IntelliJ/WebStorm, use this to populate an untyped array then
     * push that onto another array (sadly, pushing directly to a typed generic array breaks code completion)
     *
     * @param parentState
     * @param _propKey
     * @param targetPropKey
     * @param mappingHooks
     */
    createMappingAction<S extends StateObject, K extends Extract<keyof S, string>, TP extends ExtractMatching<S, K, VP>, V>(parentState: S, _propKey: K, targetPropKey: TP, ...mappingHooks: MappingHook[]): MappingAction<S, K, CP, VP, TP, A, V>;
    /**
     * Create a mapping from a state array element to a view.
     *
     * To get good code completion in IntelliJ/WebStorm, use this to populate an untyped array then
     * push that onto another array (sadly, pushing directly to a typed generic array breaks code completion)
     *
     * @param _parent
     * @param _propKey
     * @param _array
     * @param index
     * @param targetPropKey
     * @param mappingHooks
     */
    createArrayMappingAction<S extends StateObject, K extends ExtractArrayKeys<unknown, S>, TP extends ExtractMatchingArrayType<E, VP>, E>(_parent: S, _propKey: K, _array: S[K] & Array<E>, index: number | null, targetPropKey: TP, ...mappingHooks: MappingHook[]): MappingAction<S, K, CP, VP, TP, A, E>;
=======
    createMappingAction<S extends StateObject, K extends Extract<keyof S, string>, TP extends Extract<keyof VP, string>, V>(parentState: S, _propKey: K, targetPropKey: TP, ...mappingHooks: MappingHook[]): MappingAction<S, K, CP, VP, TP, A, V>;
>>>>>>> master
    /**
     * There are two types of views this can create.  The preferred way is with
     * a FunctionComponent, the other way is by creating
     * an instance of a React.Component class.  The constructor accepts either one
     * or the other.
     *
     * @param {CP} _props
     * @param {StateObject & A} appData
     * @param {React.FunctionComponent<VP> | undefined} function component
     * @param {ComponentGenerator<VP> | undefined} viewGenerator
     */
    constructor(_props: CP, appData: StateObject & A, functionComp: FunctionComponent<VP> | undefined, viewGenerator?: ComponentGenerator<VP> | undefined, reactState?: RS);
    createMapping<S extends StateObject, K extends Extract<keyof S, string>, TP extends Extract<keyof VP, string>, V>(stateObject: S, stateObjectProperty: K, targetViewProp: TP, ...mappingHooks: MappingHook[]): MappingAction<S, K, CP, VP, TP, A, V>;
    /**
     * This is only used for testing
     * @returns {React.Component<VP, any>}
     */
    getView(): React.Component<VP, any>;
    /**
     * Append mappings to the provided array, so that the container will be notified of state changes affecting its props.
     *
     * Implementations of this method are called once when the container is mounted.
     *
     * @returns {AnyMappingAction[]} the array of mappings for a container
     */
    protected abstract appendToMappingActions(mappingActions: AnyMappingAction[]): void;
    /**
     * Create default view properties, used to initialize {@link viewProps} and passed
     * into this container's presentational component, either {@link functionCompView} or
     * {@link viewComponent} via {@link viewGenerator}
     * @returns {VP}
     */
    abstract createViewProps(): VP;
    /**
     * Update the properties of the view (presentational component) immediately after the
     * container component's properties have changed.
     *
     * This method is invoked after state changes have been mapped but before rendering,
     * see {@link handleChange}.
     */
    updateViewProps(executedActions: Action[]): void;
    /**
     * Default implementation of mappingHook functions contained in mapping actions.
     *
     * Note that only actions whose pathing matches the mapping will invoke
     *
     * @param {Action[]} executedActions have already modified state, whose changes have already been mapped,
     * but not yet rendered.
     */
    protected invokeMappingHooks(executedActions: Action[]): void;
    /**
     * Use the executed actions to identify which state properties have changed,
     * then use the mapping actions to identify the target view props and set them.
     *
     * This is the first method called in this component's {@link handleChange} method,
     * which is invoked by the framework.
     */
    protected updateViewPropsUsingMappings(executedActions: Action[]): void;
    componentDidMount(): void;
    componentWillUnmount(): void;
    handleChange(executedActions: Action[]): void;
    /**
     * Return true if viewProps, props or state has changed.
     *
     * We track viewProps changes when actions have changed state that is mapped to viewProps.
     *
     * Our props and state changes are checked against the incoming nextProps and nextState using
     * recompose's 'shallowEqual'.
     *
     * @param {CP} nextProps
     * @returns {boolean}
     */
    shouldComponentUpdate<S, CTX>(nextProps: CP, nextState: S, nextContext: CTX): boolean;
    setupViewProps(): void;
    render(): ReactNode;
}
export declare type AnyContainerComponent = ContainerComponent<any, any, any>;
