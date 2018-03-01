/// <reference types="react" />
import * as React from 'react';
import { ReactNode, SFC } from 'react';
import { Action, DispatchType, MappingAction } from '../actions/actions';
import { StateObject } from '../types/State';
export declare type ComponentGenerator<P> = (props: P) => React.Component<P, any>;
export declare type Renderer<P> = ComponentGenerator<P> | SFC<P>;
/**
 *
 * A React.Component designed to function as a container/controller.
 *
 * It contains a react component, which performs the actual rendering
 * and the view usually contains all the markup and styling.  There is
 * typically no markup or styling in this container.
 *
 * CP: container props, a plain object (pojo)
 * VP: view component props, also a plain object
 * A: topmost application data residing in a state object {@link StateObject}
 */
export declare abstract class ContainerComponent<CP, VP, A extends StateObject> extends React.Component<CP> {
    viewProps: VP;
    protected appData: A;
    protected viewGenerator: ComponentGenerator<VP> | undefined;
    /**
     * stateless functional component, this is a function that returns a view typically
     */
    protected sfcView: SFC<VP> | undefined;
    /**
     * An instance of a React.Component class created by the {@link ComponentGenerator} passed into the constructor.
     */
    protected viewComponent: React.Component<VP, any>;
    protected mappingActions: MappingAction<any, CP, VP, A>[];
    /**
     * Convenience method
     * @param {Array<T>} oldArray
     * @param {number} index
     * @param {T} newElement
     * @returns {Array<T>}
     */
    static newArray<T>(oldArray: Array<T>, index: number, newElement: T): Array<T>;
    getMappingActions(): MappingAction<any, CP, VP, A>[];
    /**
     * There are two types of views this can create.  The preferred way is with
     * an 'SFC' (stateless functional component), the other way is by creating
     * an instance of a React.Component class.  The constructor accepts either one
     * or the other.
     *
     * @param {CP} _props
     * @param {StateObject & A} appData
     * @param {React.SFC<VP> | undefined} sfc
     * @param {ComponentGenerator<VP> | undefined} viewGenerator
     */
    constructor(_props: CP, appData: StateObject & A, sfc: SFC<VP> | undefined, viewGenerator?: ComponentGenerator<VP> | undefined);
    createMapping<S extends StateObject, K extends keyof S>(stateObject: S, stateObjectProperty: K, targetViewProp: keyof VP, ...dispatches: DispatchType[]): MappingAction<S, CP, VP, A>;
    /**
     * This is only used for testing
     * @returns {React.Component<VP, any>}
     */
    getView(): React.Component<VP, any>;
    /**
     * Create mappings from your application state to {@link viewProps}.  This method is
     * analogous to Redux's 'mapStateToProps' method.  The framework uses these mappings to
     * forceUpdate this component when state changes occur.
     *
     * Implementations of this method are called once, to populate the stateMappingActions array.
     *
     * @returns {MappingAction<any, any, CP, VP, keyof VP>[]} the array of mappings
     */
    abstract createMappingActions(): MappingAction<any, CP, VP, A>[];
    /**
     * Create default view properties, used to initialize {@link viewProps} and passed
     * into this container's presentational component, either {@link sfcView} or
     * {@link viewComponent} via {@link viewGenerator}
     * @returns {VP}
     */
    abstract createViewProps(): VP;
    /**
     * This method can be used to alter default state property and dispatch mappings
     */
    updateViewProps(executedActions: Action[]): void;
    /**
     * Default implementation of dispatches using mapping actions.
     *
     * Note that only actions whose pathing matches the mapping will invoke
     *
     * @param {Action[]} executedActions
     */
    protected dispatchUsingMappings(executedActions: Action[]): void;
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
    render(): ReactNode;
}
