import * as React from 'react';
import { ReactNode, SFC } from 'react';
import { Action, DispatchType, StateCrudAction, MappingAction, StateAction } from '../actions/actions';
import * as _ from 'lodash';
import { Manager } from '../types/Manager';
import { StateObject } from '../types/State';
import { ArrayMutateAction } from '../';

/* tslint:disable:no-any */
export type ComponentGenerator<P> = (props: P) => React.Component<P, any>;
/* tslint:enable:no-any */

export type Renderer<P> = ComponentGenerator<P> | SFC<P>;

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
export abstract class ContainerComponent<CP, VP, A extends StateObject> extends React.Component<CP> {

  // this class will be managing/creating the props to hand to the view, writable here, readonly in the view
  public viewProps: VP;

  protected appData: A; 

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

    /* tslint:disable:no-any */
  protected mappingActions: MappingAction<any, CP, VP>[];
    /* tslint:enable:no-any */

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
              viewGenerator?: ComponentGenerator<VP> | undefined) {
    super(_props);
    if (!_.isPlainObject(_props)) {
      throw new Error('container props must be plain objects');
    }
    this.appData = appData;
    if (!appData) {
      throw new Error('Failed to get appData to base container');
    } else {
      // console.log(`appData in base container: ${JSON.stringify(this.appData, JSON_replaceCyclicParent, 4)}`);
    }

    // examine the component functions
    if ( (sfc && viewGenerator) || (!sfc && !viewGenerator)) {
      throw new Error(`${sfc ? 2 : 0} functions supplied; you must supply exactly one function`);
    }

    this.viewProps = this.createViewProps();
    this.sfcView = sfc;
    this.viewGenerator = viewGenerator;
    if (this.viewGenerator) {
      this.viewComponent = this.viewGenerator(this.viewProps);
    }
  }

  public createMapping<S extends StateObject, K extends keyof S>
          (stateObject: S, stateObjectProperty: K, targetViewProp: keyof VP, ...dispatches: DispatchType[])
          : MappingAction<S, CP, VP> {
    return new MappingAction(stateObject, stateObjectProperty, this, targetViewProp, ...dispatches);
  }

  /**
   * This is only used for testing
   * @returns {React.Component<VP, any>}
   */
  public getView() {
    return this.viewComponent;
  }

  /**
   * Create mappings from your application state to {@link viewProps}.  This method is
   * analogous to Redux's 'mapStateToProps' method.  The framework uses these mappings to
   * forceUpdate this component when state changes occur.
   *
   * Implementations of this method are called once, to populate the stateMappingActions array.
   *
   * @returns {MappingAction<any, any, CP, VP, keyof VP>[]} the array of mappings
   */
    /* tslint:disable:no-any */
  abstract createMappingActions(): MappingAction<any, CP, VP>[];
    /* tslint:enable:no-any */

  /**
   * Create default view properties, used to initialize {@link viewProps} and passed
   * into this container's presentational component, either {@link sfcView} or
   * {@link viewComponent} via {@link viewGenerator}
   * @returns {VP}
   */
  public abstract createViewProps(): VP;

  /**
   * This method can be used to alter default state property and dispatch mappings
   */
  public updateViewProps(executedActions: Action[]): void { return; }

  /**
   * Default implementation of dispatches using mapping actions.
   *
   * Note that only actions whose pathing matches the mapping will invoke
   *
   * @param {Action[]} executedActions
   */
  protected dispatchUsingMappings(executedActions: Action[]): void {
    executedActions.forEach((action) => {
      if (action instanceof StateCrudAction) {
        let mappingActions = action.mappingActions;
        if (mappingActions && mappingActions.length > 0) {
          mappingActions.forEach((mapping) => {
            if (mapping.dispatches && mapping.dispatches.length > 0) {
              mapping.dispatches.forEach((dispatch) => dispatch(action));
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
    executedActions.forEach((action) => {
      if (action instanceof StateAction) {
        let mappingActions = action.mappingActions;
        if (mappingActions && mappingActions.length) {
          mappingActions.forEach((mapping) => {
            if (action instanceof StateCrudAction) {
              this.viewProps[mapping.targetPropName] = action.value;
            } else if (action instanceof ArrayMutateAction) {
              this.viewProps[mapping.targetPropName] = action.valuesArray;
            }

          });
        }
      }
    });
  }

  componentDidMount() {
    // subscribe
    this.mappingActions = this.mappingActions ? this.mappingActions : this.createMappingActions();
    Manager.get().actionPerform(...this.mappingActions);
  }

  componentWillUnmount() {
    if (this.mappingActions) {

      // unsubscribe from stateMappingActions, we need to undo these specific actions
        /* tslint:disable:no-any */
      let unmappingActions: MappingAction<any, CP, VP>[] = [];
        /* tslint:enable:no-any */
      this.mappingActions.forEach((action) => {
        let unmappingAction = action.clone();
        unmappingAction.pristine = true;
        unmappingAction.type = action.getUndoAction();
        unmappingActions.push(unmappingAction);

      });
      // perform these undo actions
      Manager.get().actionUndo(0, ...unmappingActions);
    }
  }

  handleChange(executedActions: Action[]) {
    this.updateViewPropsUsingMappings(executedActions);
    this.dispatchUsingMappings(executedActions);
    this.updateViewProps(executedActions);
    this.forceUpdate();
  }

  render(): ReactNode {
    if (this.sfcView) {
      return this.sfcView(this.viewProps);
    }
    if (this.viewGenerator) {
      this.viewComponent = this.viewGenerator(this.viewProps);
      return this.viewComponent.render();
    }
    throw new Error('Neither SFC nor React.Component is available for rendering');
  }

}
