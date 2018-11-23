import * as React from 'react';
import { ReactElement, ReactNode, SFC } from 'react';
import { Action, AnyMappingAction, MappingAction, MappingHook, StateAction, StateCrudAction } from '../actions/actions';
import * as _ from 'lodash';
import { Manager } from '../types/Manager';
import { StateObject } from '../types/Store';
import { ArrayChangeAction } from '../';
import { shallowEqual } from 'recompose';

/* tslint:disable:no-any */
export type ComponentGenerator<P> = (props: P) => React.Component<P, any>;
/* tslint:enable:no-any */

/**
 *
 * A kind of React.Component HOC designed to function as a container/controller (constructor takes a component
 * and uses it to compose/present).
 *
 * It wraps a react component, which performs the actual rendering
 * and the view usually contains all the markup and styling.  There is
 * typically no markup or styling in this container.
 *
 * CP: container props, a plain object (pojo)
 * VP: view component props, also a plain object
 * A: application state (root/top of the StateObject graph) {@link StateObject}
 */
export abstract class ContainerComponent<CP, VP, A extends StateObject, RS = {} >
    extends React.Component<CP, RS> {

  // this class will be managing/creating the props to hand to the view, writable here, readonly in the view
  public viewProps: VP;
  protected viewPropsUpdated: boolean | null = false;

  protected appState: A;

  protected viewGenerator: ComponentGenerator<VP> | undefined;

  /**
   * stateless functional component, this is a function that returns a view typically
   */
  protected sfcView: SFC<VP> | undefined;

  /**
   * An instance of a React.Component class created by the {@link ComponentGenerator} passed into the constructor.
   */
    /* tslint:disable:no-any */
  protected viewComponent: React.Component<VP, any>;
    /* tslint:enable:no-any */

  protected mappingActions: AnyMappingAction[] = [];

  /**
   * Convenience method
   * @param {Array<T>} oldArray
   * @param {number} index
   * @param {T} newElement
   * @returns {Array<T>}
   */
  public static newArray<T>(oldArray: Array<T>, index: number, newElement: T): Array<T> {
      let newArray = [...oldArray];
      newArray[index] = newElement;
      return newArray;
  }

  public getMappingActions() { return this.mappingActions; }

  createMappingAction
  <S extends StateObject, K extends Extract<keyof S, string>, TP extends Extract<keyof VP, string>, V>
  (parentState: S, _propKey: K, targetPropKey: TP, ...mappingHooks: MappingHook[])
    : MappingAction<S, K, CP, VP, TP, A, V> {
    return new MappingAction(parentState, _propKey, this, targetPropKey, ...mappingHooks);
  }

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
  constructor(_props: CP, appData: StateObject & A, sfc: SFC<VP> | undefined,
              viewGenerator?: ComponentGenerator<VP> | undefined, reactState?: RS) {
    super(_props, reactState);
    if (!_.isPlainObject(_props)) {
      throw new Error('container props must be plain objects');
    }
    this.appState = appData;
    if (!appData) {
      throw new Error('Failed to get appData to base container');
    } else {
      // console.log(`appData in base container: ${JSON.stringify(this.appData, JSON_replaceCyclicParent, 4)}`);
    }

    // examine the component functions
    if ( (sfc && viewGenerator) || (!sfc && !viewGenerator)) {
      throw new Error(`${sfc ? 2 : 0} functions supplied; you must supply exactly one function`);
    }

    this.sfcView = sfc;
    this.viewGenerator = viewGenerator;
  }

  public createMapping
          <S extends StateObject, K extends Extract<keyof S, string>, TP extends Extract<keyof VP, string>, V>
          (stateObject: S, stateObjectProperty: K, targetViewProp: TP, ...mappingHooks: MappingHook[])
          : MappingAction<S, K, CP, VP, TP, A, V> {
    return new MappingAction(stateObject, stateObjectProperty, this, targetViewProp, ...mappingHooks);
  }

  /**
   * This is only used for testing
   * @returns {React.Component<VP, any>}
   */
  /*tslint:disable:no-any*/
  public getView(): React.Component<VP, any> {
    return this.viewComponent;
  }
  /*tslint:enable:no-any*/

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
   * into this container's presentational component, either {@link sfcView} or
   * {@link viewComponent} via {@link viewGenerator}
   * @returns {VP}
   */
  public abstract createViewProps(): VP;

  /**
   * Update the properties of the view (presentational component) immediately after the
   * container component's properties have changed.
   *
   * This method is invoked after state changes have been mapped but before rendering,
   * see {@link handleChange}.
   */
  public updateViewProps(executedActions: Action[]): void { return; }

  /**
   * Default implementation of mappingHook functions contained in mapping actions.
   *
   * Note that only actions whose pathing matches the mapping will invoke
   *
   * @param {Action[]} executedActions have already modified state, whose changes have already been mapped,
   * but not yet rendered.
   */
  protected invokeMappingHooks(executedActions: Action[]): void {
    executedActions.forEach((action) => {
      if (action instanceof StateCrudAction) {
        let mappingActions = action.mappingActions;
        if (mappingActions && mappingActions.length > 0) {
          mappingActions.forEach((mapping) => {
            if (mapping.mappingHooks && mapping.mappingHooks.length > 0) {
              mapping.mappingHooks.forEach((hookFunction) => hookFunction(action));
            }
          });
        }
      }
    });
  }

  /**
   * Use the executed actions to identify which state properties have changed,
   * then use the mapping actions to identify the target view props and set them.
   *
   * This is the first method called in this component's {@link handleChange} method,
   * which is invoked by the framework.
   */
  protected updateViewPropsUsingMappings(executedActions: Action[]): void {
    let _viewProps = this.viewProps;
    this.viewPropsUpdated = false;
    // let _displayName = this[`displayName`];
    executedActions.forEach((action) => {
      if (action instanceof StateAction) {
        let mappingActions = action.mappingActions;
        if (mappingActions && mappingActions.length) {
          mappingActions.forEach((mapping) => {
            if (action instanceof StateCrudAction) {
              _viewProps[mapping.targetPropName] = action.value;
              this.viewPropsUpdated = true;
            } else if (action instanceof ArrayChangeAction) {
              // if we are mutating the list element, we only want to change that index
              // otherwise its an insert/delete and we want to update the whole array
              if ( mapping.index !== undefined ) {
                _viewProps[mapping.targetPropName] = action.value;
                this.viewPropsUpdated = true;
              } else {
                _viewProps[mapping.targetPropName] = action.valuesArray;
                this.viewPropsUpdated = true;
              }
            }
          });
        }
      }
    });
  }

  componentDidMount() {
    // subscribe
    this.appendToMappingActions(this.mappingActions);
    Manager.get(this.appState).actionProcess(...this.mappingActions);
  }

  componentWillUnmount() {
    if (this.mappingActions && this.mappingActions.length > 0) {
      // unsubscribe from stateMappingActions, we need to undo these specific actions
      let unmappingActions: AnyMappingAction[] = [];
      this.mappingActions.forEach((action) => {
        // let unmappingAction = action.clone();
        // unmappingAction.pristine = true;
        // unmappingAction.type = action.getUndoActionId();
        let unmappingAction = action.getUndoAction();
        unmappingActions.push(unmappingAction);
      });
      Manager.get(this.appState).actionUndo(0, ...unmappingActions);
    }
  }

  handleChange(executedActions: Action[]) {
    this.updateViewPropsUsingMappings(executedActions);
    this.invokeMappingHooks(executedActions);
    this.updateViewProps(executedActions);
    // our state has changed, force a render
    this.forceUpdate();
  }

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
  shouldComponentUpdate<S, CTX>(nextProps: CP, nextState: S, nextContext: CTX ) {
    let result = this.viewPropsUpdated || !shallowEqual(this.props, nextProps);
    // if this.viewPropsUpdated is true, we will return true, we want to update only once, so reset to null
    this.viewPropsUpdated = this.viewPropsUpdated ? null : this.viewPropsUpdated;
    result = result || !shallowEqual(this.state, nextState);

    return result;
  }

  public setupViewProps() {
    this.viewProps = this.createViewProps();
    if (this.viewGenerator) {
      this.viewComponent = this.viewGenerator(this.viewProps);
    }
  }

  render(): ReactNode {
    if (!this.viewProps) {
      this.setupViewProps();
    }

    if (this.sfcView) {
      let result: ReactElement<VP> | null = this.sfcView(this.viewProps);
      return result;
    }
    if (this.viewGenerator) {
      this.viewComponent = this.viewGenerator(this.viewProps);
      return this.viewComponent.render();
    }
    throw new Error('Neither SFC nor React.Component is available for rendering');
  }
}

/* tslint:disable:no-any */
export type AnyContainerComponent = ContainerComponent<any, any, any>;
/* tslint:enable:no-any */
